// Simple migration runner for Supabase/Postgres using 'pg'.
// Reads .sql files from supabase/migrations and applies them in filename order.

import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

try { await import('dotenv/config'); } catch (e) {}

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase', 'migrations');
// Prefer Supabase hosted DB connection string; fallback to DATABASE_URL
const DATABASE_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

async function ensureSchemaMigrations(client) {
	await client.query(`
		create table if not exists public.schema_migrations (
			filename text primary key,
			applied_at timestamptz not null default now()
		)
	`);
}

async function getApplied(client) {
	const res = await client.query('select filename from public.schema_migrations');
	return new Set(res.rows.map(r => r.filename));
}

async function applyFile(client, filePath) {
	const sql = fs.readFileSync(filePath, 'utf8');
	await client.query('begin');
	try {
		await client.query(sql);
		const filename = path.basename(filePath);
		await client.query('insert into public.schema_migrations(filename) values($1) on conflict do nothing', [filename]);
		await client.query('commit');
		console.log(`✓ Applied ${filename}`);
	} catch (err) {
		await client.query('rollback');
		console.error(`✗ Failed ${path.basename(filePath)}:`, err.message);
		throw err;
	}
}

async function run() {
	if (!DATABASE_URL) {
		console.error('Faltando SUPABASE_DB_URL (ou DATABASE_URL) no .env');
		console.error('No Supabase Studio: Settings → Database → Connection string (URI).');
		console.error('Exemplo: postgresql://postgres:[PASSWORD]@db.[project].supabase.co:5432/postgres?sslmode=require');
		process.exit(1);
	}

	if (!fs.existsSync(MIGRATIONS_DIR)) {
		console.log('No migrations directory found, skipping.');
		process.exit(0);
	}

	const files = fs
		.readdirSync(MIGRATIONS_DIR)
		.filter(f => f.endsWith('.sql'))
		.sort();

	if (files.length === 0) {
		console.log('No migration files to apply.');
		process.exit(0);
	}

	// Supabase requer SSL nas conexões externas
	const client = new Client({
		connectionString: DATABASE_URL,
		ssl: { rejectUnauthorized: false }
	});
	await client.connect();
	try {
		await ensureSchemaMigrations(client);
		const applied = await getApplied(client);

		for (const file of files) {
			if (applied.has(file)) {
				console.log(`• Skipping already applied: ${file}`);
				continue;
			}
			await applyFile(client, path.join(MIGRATIONS_DIR, file));
		}

		console.log('\nAll migrations applied successfully.');
	} finally {
		await client.end();
	}
}

run().catch((err) => {
	console.error('Erro ao executar migrações:', err.message);
	process.exit(1);
});
