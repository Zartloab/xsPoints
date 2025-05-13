import { config } from 'dotenv';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

config();

const { Pool } = pg;

async function main() {
  console.log('Starting database migration for exchange_rates table...');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  // Connect to database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    console.log('Connected to database');
    
    // Check if column already exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'exchange_rates' 
      AND column_name = 'updated_at';
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('Column updated_at already exists');
    } else {
      // Rename column last_updated to updated_at
      console.log('Renaming column last_updated to updated_at');
      await pool.query(`
        ALTER TABLE exchange_rates 
        RENAME COLUMN last_updated TO updated_at;
      `);
      console.log('Column renamed successfully');
    }
    
    // Check if verification_data column exists
    const checkVDataResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'exchange_rates' 
      AND column_name = 'verification_data';
    `);
    
    if (checkVDataResult.rows.length > 0) {
      console.log('Column verification_data already exists');
    } else {
      // Add verification_data column
      console.log('Adding verification_data column');
      await pool.query(`
        ALTER TABLE exchange_rates 
        ADD COLUMN verification_data TEXT;
      `);
      console.log('Column added successfully');
    }

    // Initialize the verification data for existing rows
    console.log('Initializing verification data for existing rates');
    await pool.query(`
      UPDATE exchange_rates
      SET verification_data = json_build_object(
        'isVerified', TRUE,
        'source', 'initial_setup',
        'pointValue', rate::float,
        'lastVerified', updated_at,
        'termsUrl', '',
        'notes', 'Initial data migration for API verification'
      )::text
      WHERE verification_data IS NULL;
    `);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(console.error);