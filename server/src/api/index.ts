import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { portfolio, report, stockPrice, transaction } from "db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import { format } from "date-fns";
import { protectedProcedure } from "trpc";
import puppeteer from "puppeteer";
import { generateRandomString } from "utils";
import path from "path";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";
import { writeFile } from "fs/promises";
import z from "zod";

export const portfolioRouter = {
  //TODO: Split code and refactor to reduce db calls
  getPortfolio: protectedProcedure.query(async ({ ctx }) => {
    const portfolios = await ctx.db
      .select()
      .from(portfolio)
      .where(eq(portfolio.userId, ctx.session.session.userId));

    const result = {
      totalInvested: 0,
      currentTotalValue: 0,
      portfolios: [] as any[],
      graph: [] as { date: string; price: number }[],
    };

    for (const p of portfolios) {
      const transactions = await ctx.db
        .select()
        .from(transaction)
        .where(eq(transaction.portfolioId, p.id));

      const stockMap: Record<string, { quantity: number; totalCost: number }> =
        {};
      for (const tx of transactions) {
        if (tx.type === "BUY") {
          stockMap[tx.stockId] = stockMap[tx.stockId] || {
            quantity: 0,
            totalCost: 0,
          };
          stockMap[tx.stockId].quantity += tx.quantity;
          stockMap[tx.stockId].totalCost +=
            tx.quantity * tx.pricePerShare + (tx.fee || 0);
        } else if (tx.type === "SELL") {
          stockMap[tx.stockId] = stockMap[tx.stockId] || {
            quantity: 0,
            totalCost: 0,
          };
          stockMap[tx.stockId].quantity -= tx.quantity;
        }
      }

      let invested = 0;
      let currentValue = 0;
      const holdings = [];

      for (const [stockId, { quantity, totalCost }] of Object.entries(
        stockMap,
      )) {
        if (quantity <= 0) continue;

        invested += totalCost;

        const [latestPrice] = await ctx.db
          .select()
          .from(stockPrice)
          .where(eq(stockPrice.stockId, stockId))
          .orderBy(desc(stockPrice.date))
          .limit(1);

        if (latestPrice) {
          const value = latestPrice.price * quantity;
          currentValue += value;

          holdings.push({
            stockId,
            quantity,
            latestPrice: latestPrice.price,
            value,
          });
        }
      }

      result.totalInvested += invested;
      result.currentTotalValue += currentValue;

      result.portfolios.push({
        id: p.id,
        name: p.name,
        baseCurrency: p.baseCurrency,
        invested,
        currentValue,
        gain: currentValue - invested,
        holdings,
        graph: [],
      });
    }

    const allPriceDates = await ctx.db
      .selectDistinct({ date: stockPrice.date })
      .from(stockPrice)
      .orderBy(stockPrice.date);

    for (const { date } of allPriceDates) {
      let dayTotal = 0;

      for (const p of result.portfolios) {
        for (const h of p.holdings) {
          // TODO: Optimize db calls
          const [dayPrice] = await ctx.db
            .select()
            .from(stockPrice)
            .where(
              and(eq(stockPrice.stockId, h.stockId), eq(stockPrice.date, date)),
            )
            .limit(1);

          if (dayPrice) {
            dayTotal += dayPrice.price * h.quantity;
          }
          result.portfolios[0].graph.push({
            date: format(new Date(date), "yyyy-MM-dd"),
            price: dayTotal,
          });
        }
      }

      result.graph.push({
        date: format(new Date(date), "yyyy-MM-dd"),
        price: dayTotal,
      });
    }

    return result;
  }),
  transcations: protectedProcedure.query(async ({ ctx }) => {
    const portfolios = await ctx.db
      .select()
      .from(portfolio)
      .where(eq(portfolio.userId, ctx.session.session.userId));

    const transactionsPromises = portfolios.map(async (p) => {
      const transactions = await ctx.db.query.transaction.findMany({
        where: (tx, { eq }) => eq(tx.portfolioId, p.id),
      });
      return transactions;
    });

    return (await Promise.all(transactionsPromises)).flatMap((i) => i);
  }),
  reports: protectedProcedure.query(async ({ ctx }) => {
    const portfolios = await ctx.db
      .select()
      .from(portfolio)
      .where(eq(portfolio.userId, ctx.session.session.userId));

    const reportsPromises = portfolios.map(async (p) => {
      const reports = await ctx.db.query.report.findMany({
        where: (re, { eq }) => eq(re.portfolioId, p.id),
      });
      return reports;
    });
    const res = (await Promise.all(reportsPromises)).flatMap((i) => i);
    return res;
  }),
  listPortfolios: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.portfolio.findMany({
      where: (p, { eq }) => eq(p.userId, ctx.session.session.userId),
    });
  }),
  generateReport: protectedProcedure
    .input(
      z.object({
        portfolioId: z.string(),
        period: z.enum(["yearly", "monthly"]),
        summary: z.string().nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;

      try {
        const portfolioData = await db
          .select()
          .from(portfolio)
          .where(
            and(
              eq(portfolio.id, input.portfolioId),
              eq(portfolio.userId, session.session.userId),
            ),
          )
          .limit(1);

        if (!portfolioData.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Portfolio not found",
          });
        }

        const portfolioInfo = portfolioData[0];

        const now = new Date();
        const startDate =
          input.period === "yearly"
            ? new Date(now.getFullYear(), 0, 1)
            : new Date(now.getFullYear(), now.getMonth(), 1);

        const transactions = await db
          .select()
          .from(transaction)
          .where(
            and(
              eq(transaction.portfolioId, input.portfolioId),
              gte(transaction.date, startDate),
            ),
          );
        const reportId = generateRandomString();
        const fileName = await generatePDFFile({
          id: reportId,
          period: input.period,
          portfolio: portfolioInfo,
          transactions,
        });
        const newReport = await db
          .insert(report)
          .values({
            id: reportId,
            portfolioId: input.portfolioId,
            period: input.period,
            summary: `Simple ${input.period} report - ${transactions.length} transactins`,
            uri: `public/reports/${fileName}`,
            generatedAt: new Date(),
          })
          .returning();
        return {
          success: true,
          transactionCount: transactions.length,
          ...newReport.at(0),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate PDF",
        });
      }
    }),
  deleteReport: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.db
        .delete(report)
        .where(eq(report.id, input.id))
        .returning();
      return res;
    }),
} satisfies TRPCRouterRecord;

export const generatePDFFile = async ({
  id,
  period,
  portfolio,
  transactions,
}: {
  id: string;
  period: string;
  portfolio: { name: string };
  transactions: { id: string }[];
}) => {
  // TODO: improve html generation and copy
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Report</title>
      <style>
        body { 
          font-family: Arial, sans-serif;
          padding: 40px; 
          color: #333;
        }
        h1 { color: #b3b3b3; }
        .info { 
          background: #f1f1f1; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <h1>${period.charAt(0).toUpperCase() + period.slice(1)} Report</h1>
      
      <div class="info">
        <p><strong>Portflio:</strong> ${portfolio.name}</p>
        <p><strong>Period:</strong> ${period}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Transactions Found:</strong> ${transactions.length}</p>
      </div>

      <h2>Summary</h2>
      <p>This is a very simple ${period} report for testing PDF generation.</p>
      <p>Your portfolio "${portfolio.name}" has ${transactions.length} transactions for this period.</p>
    </body>
    </html>
  `;
  // Simplest pdf generator.
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(htmlContent);

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();

  const fileName = `simple-report-${id}.pdf`;

  const assetsDir = path.join(process.cwd(), "src", "public", "reports");
  if (!existsSync(assetsDir)) {
    await mkdir(assetsDir, { recursive: true });
  }

  const filePath = path.join(assetsDir, fileName);
  await writeFile(filePath, pdfBuffer);
  return fileName;
};
