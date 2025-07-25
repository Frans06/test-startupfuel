import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import * as trpcExpress from "@trpc/server/adapters/express";
import { db } from "./db";
import cors from "cors";
import { stock, stockPrice } from "db/schema";
import { subDays } from "date-fns";
import { generateRandomString } from "utils";
import { appRouter } from "root";
import { createContext } from "trpc";
import path from "path";
import { getAppUrl } from "./utils";
const port = 3001;

const app = express();

app.use(express.static(path.join(__dirname, "dist"))); // Adjust path as needed

app.use(
  cors({
    origin: getAppUrl(),
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.all("/api/auth/*any", toNodeHandler(auth));

app.get("/api/health", (_, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/public", express.static(path.join(__dirname, "public")));

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

const seedStocks = [
  {
    id: "AAPL",
    name: "Apple Inc.",
    exchange: "NASDAQ",
    currency: "USD",
  },
  {
    id: "TSLA",
    name: "Tesla Inc.",
    exchange: "NASDAQ",
    currency: "USD",
  },
  {
    id: "GOOGL",
    name: "Alphabet Inc.",
    exchange: "NASDAQ",
    currency: "USD",
  },
];

app.get("*any", (_, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

async function start() {
  // Seeding some stock prices
  const existing = await db.select().from(stock).limit(1);
  if (!existing.length) {
    await db.insert(stock).values(seedStocks).onConflictDoNothing();

    const priceData: {
      id: string;
      price: number;
      stockId: string;
      date: Date;
    }[] = [];

    seedStocks.forEach((stock) => {
      let currentDate = new Date();
      let basePrice = Math.floor(Math.random() * 10000 + 5000);
      Array.from({ length: 100 }).map(() => {
        const fluctuation = Math.random() * 0.06 - 0.03;
        basePrice = Math.max(100, Math.floor(basePrice * (1 + fluctuation)));

        priceData.push({
          id: generateRandomString(),
          price: basePrice,
          date: currentDate,
          stockId: stock.id,
        });

        currentDate = subDays(currentDate, 1);
      });
    });
    // Batching because of sqlite limit
    const batchSize = 100;
    for (let i = 0; i < priceData.length; i += batchSize) {
      const batch = priceData.slice(i, i + batchSize);
      await db.insert(stockPrice).values(batch);
    }
  }

  app.listen(port, () => {
    console.log(`App listening on port ${port}`);
  });
}

start().catch((e) => {
  console.error("Error starting server: ", e);
  process.exit(1);
});

export type AppRouter = typeof appRouter;
