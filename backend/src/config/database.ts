import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fertyflow_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  min: 5,  // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // How long to wait for a connection
  maxUses: 7500, // Close connections after 7500 uses
};

const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  logger.info('🔗 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('💥 Database connection error:', err);
});

// Test initial connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    logger.info(`✅ Database connection successful. Current time: ${result.rows[0].current_time}`);
    client.release();
  } catch (err) {
    logger.error('❌ Database connection failed:', err);
    process.exit(1);
  }
};

// Test connection on startup
testConnection();

export default pool;