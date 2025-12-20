import { SqlClient } from '@effect/sql';
import { Effect } from 'effect';

export const migrations = {
	'001_initial': Effect.flatMap(
		SqlClient.SqlClient,
		(sql) => sql`
            PRAGMA journal_mode=WAL;
            PRAGRAM foreign_keys=ON;
        `
	),
	// store category
	'002_create_store_category_table': Effect.flatMap(
		SqlClient.SqlClient,
		(sql) => sql`CREATE TABLE IF NOT EXISTS store_categories (
            id TEXT PRIMARY KEY,
            created DATETIME DEFAULT (datetime('now')),
            updated DATETIME DEFAULT (datetime('now')),
            label TEXT
        )`
	),
	// store type
	'003_create_store_type_table': Effect.flatMap(
		SqlClient.SqlClient,
		(sql) => sql`CREATE TABLE IF NOT EXISTS store_types (
            id TEXT PRIMARY KEY,
            created DATETIME DEFAULT (datetime('now')),
            updated DATETIME DEFAULT (datetime('now')),
            label TEXT
        )`
	),
	// store
	'004_create_store_table': Effect.flatMap(
		SqlClient.SqlClient,
		(sql) => sql`CREATE TABLE IF NOT EXISTS stores (
            id TEXT PRIMARY KEY,
            created DATETIME DEFAULT (datetime('now')),
            updated DATETIME DEFAULT (datetime('now')),
            name TEXT DEFAULT '',
            address TEXT DEFAULT '',

            -- relations
            store_type TEXT,
            store_category TEXT,

            FOREIGN KEY (store_type) REFERENCES store_types(id), 
            FOREIGN KEY (store_category) REFERENCES store_categories(id)
            
        )`
	),
	// auth
	'005_create_auth_table': Effect.flatMap(
		SqlClient.SqlClient,
		(sql) => sql`CREATE TABLE IF NOT EXISTS auths (
            id TEXT PRIMARY KEY,
            created DATETIME DEFAULT (datetime('now')),
            updated DATETIME DEFAULT (datetime('now')),
            refresh_token TEXT,
            device_info TEXT,
            device_type TEXT, -- desktop, mobile, unknown

            -- relations
            user TEXT,

            FOREIGN KEY (user) REFERENCES users(id)
        )`
	),
	// user
	'006_create_user_table': Effect.flatMap(
		SqlClient.SqlClient,
		(sql) => sql`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            created DATETIME DEFAULT (datetime('now')),
            updated DATETIME DEFAULT (datetime('now')),
            verified DATETIME DEFAULT '',
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            role TEXT, -- owner,staff
            complete_onboarding DATETIME DEFAULT '',
            hash_password TEXT NOT NULL,
            last_login DATETIME DEFAULT '',

            -- relations
            store TEXT,

            FOREIGN KEY (store) REFERENCES stores(id)
        )`
	),
	// otp??
	'007_create_otp_table': Effect.flatMap(
		SqlClient.SqlClient,
		(sql) => sql`CREATE TABLE IF NOT EXISTS otps (
            id TEXT PRIMARY KEY,
            created DATETIME DEFAULT (datetime('now')),
            updated DATETIME DEFAULT (datetime('now')),
            sent_to TEXT,
            code TEXT, -- hash dari kode otp

            -- relations
            user TEXT,

            FOREIGN KEY (user) REFERENCES users(id)
        )`
	),
	// product brand
	'008_create_product_brand_table': Effect.flatMap(
		SqlClient.SqlClient,
		(sql) => sql`CREATE TABLE IF NOT EXISTS product_brands (
            id TEXT PRIMARY KEY,
            created DATETIME DEFAULT (datetime('now')),
            updated DATETIME DEFAULT (datetime('now')),
            label TEXT DEFAULT '',

            -- relations
            store TEXT,

            FOREIGN KEY (store) REFERENCES stores(id)
        )`
	),
	'009_create_product_category_table': Effect.flatMap(
		SqlClient.SqlClient,
		(sql) => sql`CREATE TABLE IF NOT EXISTS product_categories (
            id TEXT PRIMARY KEY,
            created DATETIME DEFAULT (datetime('now')),
            updated DATETIME DEFAULT (datetime('now')),
            label TEXT DEFAULT '',

            -- relations
            store TEXT,

            FOREIGN KEY (store) REFERENCES stores(id)
        )`
	),
	// product
	'010_create_product_table': Effect.flatMap(
		SqlClient.SqlClient,
		(sql) => sql`CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            created DATETIME DEFAULT (datetime('now')),
            updated DATETIME DEFAULT (datetime('now')),
            name TEXT DEFAULT '',
            image TEXT DEFAULT '',

            -- relations
            store TEXT,
            brand TEXT,
            category TEXT,

            FOREIGN KEY (store) REFERENCES stores(id),
            FOREIGN KEY (brand) REFERENCES product_brands(id),
            FOREIGN KEY (category) REFERENCES product_categories(id)
        )`
	),
	// product variant
	'011_create_product_variant_table': Effect.flatMap(
		SqlClient.SqlClient,
		(sql) => sql`CREATE TABLE IF NOT EXISTS product_variants (
            id TEXT PRIMARY KEY,
            created DATETIME DEFAULT (datetime('now')),
            updated DATETIME DEFAULT (datetime('now')),
            label TEXT DEFAULT '',
            selling_price INTEGER DEFAULT 0,
            base_cost_price INTEGER DEFAULT 0,
            barcode TEXT DEFAULT '',

            --relations
            product TEXT,
            store TEXT,

            FOREIGN KEY (product) REFERENCES products(id),
            FOREIGN KEY (store) REFERENCES stores(id)
        )`
	),
	// product stock unit
	'012_create_product_stock_unit_table': Effect.flatMap(
		SqlClient.SqlClient,
		(sql) => sql`CREATE TABLE IF NOT EXISTS product_stock_units (
            id TEXT PRIMARY KEY,
            created DATETIME DEFAULT (datetime('now')),
            updated DATETIME DEFAULT (datetime('now')),
            label TEXT DEFAULT '',

            --relations
            store TEXT,

            FOREIGN KEY (store) REFERENCES stores(id)

        )`
	),
	// product stock
	'013_create_product_stock_table': Effect.flatMap(
		SqlClient.SqlClient,
		(sql) => sql`CREATE TABLE IF NOT EXISTS product_stocks (
            id TEXT PRIMARY KEY,
            created DATETIME DEFAULT (datetime('now')),
            updated DATETIME DEFAULT (datetime('now')),
            stock INTEGER DEFAULT 0,
            alert_treshold INTEGER DEFAULT 1,

            --relations
            store TEXT,
            product TEXT,
            unit TEXT,
            product_variant TEXT,

            FOREIGN KEY (store) REFERENCES store(id),
            FOREIGN KEY (product) REFERENCES products(id),
            FOREIGN KEY (unit) REFERENCES product_stock_units(id),
            FOREIGN KEY (product_variant) REFERENCES product_variants(id)
        )`
	),
	// payment method
	'014_create_payment_method_table': Effect.flatMap(
		SqlClient.SqlClient,
		(sql) => sql`CREATE TABLE IF NOT EXISTS payment_methods (
            id TEXT PRIMARY KEY,
            created DATETIME DEFAULT (datetime('now')),
            updated DATETIME DEFAULT (datetime('now')),
            label TEXT DEFAULT ''
        )`
	),
	// transaction
	'015_create_transaction_table': Effect.flatMap(
		SqlClient.SqlClient,
		(sql) => sql`CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            created DATETIME DEFAULT (datetime('now')),
            updated DATETIME DEFAULT (datetime('now')),
            total INTEGER DEFAULT 0,
            notes TEXT DEFAULT '',
            change INTEGER DEFAULT 0,
            cash_received INTEGER DEFAULT 0,

            -- relations
            store TEXT,
            user TEXT,
            payment_method TEXT,

            FOREIGN KEY (store) REFERENCES stores(id),
            FOREIGN KEY (user) REFERENCES users(id),
            FOREIGN KEY (payment_method) REFERENCES payment_methods(id)
        )`
	),
	// transaction item
	'016_create_transaction_item_table': Effect.flatMap(
		SqlClient.SqlClient,
		(sql) => sql`CREATE TABLE IF NOT EXISTS transaction_items (
            id TEXT PRIMARY KEY,
            created DATETIME DEFAULT (datetime('now')),
            updated DATETIME DEFAULT (datetime('now')),
            product_name TEXT DEFAULT '',
            product_brand TEXT DEFAULT '',
            product_category TEXT DEFAULT '',
            product_variant TEXT DEFAULT '',
            product_variant_selling_price INTEGER DEFAULT 0,
            product_variant_base_cost_price INTEGER DEFAULT 0,
            product_variant_barcode TEXT DEFAULT '',
            count INTEGER DEFAULT 0,
            unit TEXT DEFAULT '',
            total INTEGER DEFAULT 0,


            -- relations
            store TEXT,
            'transaction' TEXT,
            product TEXT,

            FOREIGN KEY (store) REFERENCES stores(id),
            FOREIGN KEY ('transaction') REFERENCES transactions(id),
            FOREIGN KEY (product) REFERENCES product(id)
        )`
	)
};
