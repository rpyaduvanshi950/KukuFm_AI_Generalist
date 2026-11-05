import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
// Aggregate counters only: no messages, documents, identifiers or case facts.
export const aiBudget=sqliteTable('ai_budget',{
 day:text('day').primaryKey(),
 reservedMicros:integer('reserved_micros').notNull().default(0),
 attempts:integer('attempts').notNull().default(0),
 failures:integer('failures').notNull().default(0),
});
