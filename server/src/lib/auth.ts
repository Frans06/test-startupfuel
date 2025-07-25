import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import { createAuthMiddleware } from "better-auth/api";
import * as schema from "../db/auth-schema";
import { portfolio, report, transaction } from "db/schema";
import { generateRandomString } from "utils";
import { generatePDFFile } from "api";

// Sedding data for new user
const seedPortfolio = {
  id: generateRandomString(),
  name: "Retirement Fund",
  baseCurrency: "USD",
  createdAt: new Date(),
};

const seedTransactions = [
  {
    id: generateRandomString(),
    portfolioId: seedPortfolio.id,
    stockId: "AAPL",
    type: "BUY" as const,
    quantity: 10,
    pricePerShare: 150,
    fee: 1,
    date: new Date("2025-01-15"),
    note: "Initial buy",
  },
  {
    id: generateRandomString(),
    portfolioId: seedPortfolio.id,
    stockId: "TSLA",
    type: "BUY" as const,
    quantity: 5,
    pricePerShare: 700,
    fee: 2,
    date: new Date("2025-02-10"),
    note: "Aggressive growth",
  },
  {
    id: generateRandomString(),
    portfolioId: seedPortfolio.id,
    stockId: "AAPL",
    type: "DIVIDEND" as const,
    quantity: 0,
    pricePerShare: 1.2, // dividend per share
    fee: 0,
    date: new Date("2025-03-01"),
    note: "Quarterly dividend",
  },
];

const seedReports = [
  {
    id: generateRandomString(),
    portfolioId: seedPortfolio.id,
    period: "quarterly",
    generatedAt: new Date("2025-04-01"),
    summary: "Q1 2025 performance: +8.5%. Strong performance from TSLA.",
  },
  {
    id: generateRandomString(),
    portfolioId: seedPortfolio.id,
    period: "quarterly",
    generatedAt: new Date("2025-07-01"),
    summary: "Q2 2025 performance: -2.1%. Market correction observed.",
  },
];

const seedAccount = async (userId: string) => {
  await db.insert(portfolio).values([{ ...seedPortfolio, userId }]);
  await db.insert(transaction).values(seedTransactions);
  for (const r of seedReports) {
    const fileName = await generatePDFFile({
      id: r.id,
      period: r.period,
      portfolio: seedPortfolio,
      transactions: seedTransactions,
    });
    await db.insert(report).values({ ...r, uri: `public/reports/${fileName}` });
  }
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  trustedOrigins: ["http://localhost:3000"],
  emailAndPassword: {
    enabled: true,
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith("/sign-up")) {
        if (ctx.context.newSession?.user.id)
          try {
            await seedAccount(ctx.context.newSession?.user.id);
          } catch (e) {
            console.error("error seeding initial user", e);
          }
      }
    }),
  },
});
