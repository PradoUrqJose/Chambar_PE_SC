import {
    sqliteTable,
    text,
    integer
} from 'drizzle-orm/sqlite-core';

export const companies = sqliteTable('companies', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
});

export const cashBoxes = sqliteTable('cash_boxes', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    businessDate: text('business_date').notNull()
});

export const operations = sqliteTable('operations', {
    id: text('id').primaryKey(),
    amount: integer('amount').notNull(),
    businessDate: text('business_date').notNull()
});