import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log("Connecting to PostgreSQL database...");

// Create robust database connection with error handling
let pool: Pool;
let db: ReturnType<typeof drizzle>;

try {
  // Make connection timeout faster to avoid hanging
  pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000 // 10 seconds timeout
  });
  
  // Set up event listeners
  pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
  });
  
  pool.on('connect', () => {
    console.log('Connected to PostgreSQL successfully');
  });
  
  db = drizzle({ client: pool, schema });
  
  // Test the connection in background
  pool.query('SELECT 1').then(() => {
    console.log('Database connection verified successfully');
  }).catch(err => {
    console.error('Database connection test failed:', err);
  });
  
} catch (error) {
  console.error("Critical database connection error:", error);
  
  // Create fallback objects
  console.warn("Using FALLBACK database objects - app will have limited functionality");
  
  pool = {
    on: () => {},
    query: async () => ({ rows: [] }),
    connect: async () => {},
    end: async () => {}
  } as unknown as Pool;
  
  db = {
    select: () => ({ from: () => ({ where: () => [] }) }),
    insert: () => ({ values: () => ({ returning: () => [] }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => [] }) }) }),
    delete: () => ({ where: () => ({ returning: () => [] }) })
  } as unknown as ReturnType<typeof drizzle>;
}

export { pool, db };
