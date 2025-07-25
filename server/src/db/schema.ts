import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";
import { relations } from "drizzle-orm";

export * from "./auth-schema";

export const stock = sqliteTable("stock", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  exchange: text("exchange").notNull(),
  currency: text("currency").notNull(),
});

export const stockPrice = sqliteTable("stock_price", {
  id: text("id").primaryKey(),
  price: integer("price").notNull(),
  date: integer("created_at", { mode: "timestamp" }).notNull(),
  stockId: text("stock_id")
    .notNull()
    .references(() => stock.id, { onDelete: "cascade" }),
});

export const stocksRelation = relations(stock, ({ many }) => ({
  transactions: many(transaction),
  prices: many(stockPrice),
}));

export const portfolio = sqliteTable("portfolio", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  baseCurrency: text("base_currency").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

export const portfoliosRelation = relations(portfolio, ({ many }) => ({
  transactions: many(transaction),
  reports: many(report),
}));

export const transaction = sqliteTable("transaction", {
  id: text("id").primaryKey(),
  portfolioId: text("portfolio_id")
    .notNull()
    .references(() => portfolio.id),
  stockId: text("stock_id")
    .notNull()
    .references(() => stock.id),
  type: text("type", { enum: ["BUY", "SELL", "DIVIDEND"] }).notNull(),
  quantity: real("quantity").notNull(),
  pricePerShare: real("price_per_share").notNull(),
  fee: real("fee").default(0),
  date: integer("date", { mode: "timestamp" }).notNull(),
  note: text("note"),
});

export const transactionsRelation = relations(transaction, ({ one }) => ({
  portfolio: one(portfolio, {
    fields: [transaction.portfolioId],
    references: [portfolio.id],
  }),
  stock: one(stock, {
    fields: [transaction.stockId],
    references: [stock.id],
  }),
}));

export const report = sqliteTable("report", {
  id: text("id").primaryKey(),
  portfolioId: text("portfolio_id")
    .notNull()
    .references(() => portfolio.id),
  period: text("period").notNull(),
  generatedAt: integer("generated_at", { mode: "timestamp" }).defaultNow(),
  summary: text("summary"),
  uri: text("uri").notNull(),
});

export const reportsRelation = relations(report, ({ one }) => ({
  portfolio: one(portfolio, {
    fields: [report.portfolioId],
    references: [portfolio.id],
  }),
}));
