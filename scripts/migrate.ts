import { pool, db } from "../server/db";
import * as schema from "../shared/schema";
import { sql } from "drizzle-orm";

async function addMissingColumnsToUsers() {
  console.log("Checking and adding missing columns to users table...");
  
  try {
    // Check if membershipTier column exists
    const checkMembershipTier = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'membership_tier'
    `);
    
    // If membershipTier doesn't exist, add it and other related columns
    if (checkMembershipTier.rows.length === 0) {
      console.log("Adding new tier-related columns to users table...");
      
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN membership_tier TEXT NOT NULL DEFAULT 'STANDARD',
        ADD COLUMN tier_expires_at TIMESTAMP,
        ADD COLUMN points_converted INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN monthly_points_converted INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN last_month_reset TIMESTAMP,
        ADD COLUMN total_fees_paid DECIMAL NOT NULL DEFAULT 0
      `);
      
      console.log("Successfully added new columns to users table");
    } else {
      console.log("Membership tier columns already exist");
    }
    
    // Check if tier_benefits table exists
    const checkTierBenefitsTable = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'tier_benefits'
    `);
    
    // If tier_benefits table doesn't exist, create it
    if (checkTierBenefitsTable.rows.length === 0) {
      console.log("Creating tier_benefits table...");
      
      await pool.query(`
        CREATE TABLE tier_benefits (
          id SERIAL PRIMARY KEY,
          tier TEXT NOT NULL UNIQUE,
          monthly_points_threshold INTEGER NOT NULL,
          free_conversion_limit INTEGER NOT NULL,
          conversion_fee_rate TEXT NOT NULL,
          p2p_minimum_fee TEXT NOT NULL,
          p2p_maximum_fee TEXT NOT NULL,
          monthly_expiry_days INTEGER NOT NULL
        )
      `);
      
      console.log("Successfully created tier_benefits table");
    } else {
      console.log("Tier benefits table already exists");
    }
    
    // Check if businesses table exists
    const checkBusinessesTable = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'businesses'
    `);
    
    // Create businesses table if it doesn't exist
    if (checkBusinessesTable.rows.length === 0) {
      console.log("Creating businesses table...");
      
      await pool.query(`
        CREATE TABLE businesses (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          industry TEXT,
          contact_name TEXT,
          contact_phone TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      console.log("Successfully created businesses table");
    } else {
      console.log("Businesses table already exists");
    }
    
    // Check if business_programs table exists
    const checkProgramsTable = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'business_programs'
    `);
    
    // Create business_programs table if it doesn't exist
    if (checkProgramsTable.rows.length === 0) {
      console.log("Creating business_programs table...");
      
      await pool.query(`
        CREATE TABLE business_programs (
          id SERIAL PRIMARY KEY,
          business_id INTEGER NOT NULL REFERENCES businesses(id),
          name TEXT NOT NULL,
          points_name TEXT NOT NULL,
          conversion_rate TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      console.log("Successfully created business_programs table");
    } else {
      console.log("Business programs table already exists");
    }
    
    // Check if business_analytics table exists
    const checkAnalyticsTable = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'business_analytics'
    `);
    
    // If business_analytics table doesn't exist, create it
    if (checkAnalyticsTable.rows.length === 0) {
      console.log("Creating business_analytics table...");
      
      await pool.query(`
        CREATE TABLE business_analytics (
          id SERIAL PRIMARY KEY,
          business_id INTEGER NOT NULL REFERENCES businesses(id),
          total_users INTEGER NOT NULL DEFAULT 0,
          active_users INTEGER NOT NULL DEFAULT 0,
          total_points_issued TEXT NOT NULL DEFAULT '0',
          total_points_redeemed TEXT NOT NULL DEFAULT '0',
          average_points_per_user TEXT NOT NULL DEFAULT '0',
          last_updated TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      console.log("Successfully created business_analytics table");
    } else {
      console.log("Business analytics table already exists");
    }
    
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  }
}

async function main() {
  try {
    await addMissingColumnsToUsers();
    await pool.end();
    console.log("Migration completed and connection closed");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();