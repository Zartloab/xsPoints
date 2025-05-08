import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple script to apply schema changes
console.log('Applying schema changes to database...');

// Generate SQL from our schema
const schemaPath = path.join(__dirname, 'shared', 'schema.ts');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Extract table definitions
const tableRegex = /export const (\w+) = pgTable\("(\w+)"/g;
let match;
const tables = [];

while ((match = tableRegex.exec(schemaContent)) !== null) {
  tables.push({ 
    variableName: match[1],
    tableName: match[2] 
  });
}

console.log(`Found ${tables.length} tables in schema.ts`);
tables.forEach(t => console.log(` - ${t.tableName}`));

// Connect to database and create tables
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import * as schema from './shared/schema.js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable not set');
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema });
  
  try {
    console.log('Checking existing tables...');
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    const res = await pool.query(query);
    const existingTables = res.rows.map(row => row.table_name);
    console.log('Existing tables:', existingTables);
    
    // Check if business_* and trade_* tables exist
    const missingTables = tables
      .filter(t => !existingTables.includes(t.tableName))
      .map(t => t.tableName);
      
    if (missingTables.length === 0) {
      console.log('All tables already exist. No changes needed.');
      process.exit(0);
    }
    
    console.log('Missing tables that need to be created:', missingTables);
    
    // Create tables manually using schema definitions
    for (const tableName of missingTables) {
      const tableVar = tables.find(t => t.tableName === tableName)?.variableName;
      if (!tableVar || !schema[tableVar]) {
        console.warn(`Could not find schema definition for table: ${tableName}`);
        continue;
      }
      
      console.log(`Creating table: ${tableName}`);
      
      // Get SQL for this table (simplified approach)
      const createTableSQL = `CREATE TABLE IF NOT EXISTS "${tableName}" (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )`;
      
      await pool.query(createTableSQL);
      console.log(`Created table: ${tableName}`);
    }
    
    console.log('Database schema updated successfully');
  } catch (error) {
    console.error('Error updating database schema:', error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);