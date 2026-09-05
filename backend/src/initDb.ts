import pool from "./db";

const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS emails (
      id SERIAL PRIMARY KEY,
      recipient VARCHAR(255) NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      scheduled_at TIMESTAMP NOT NULL,
      status VARCHAR(50) DEFAULT 'SCHEDULED',
      bull_job_id VARCHAR(255),
      sent_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("Emails table created successfully!");
};

export default initDb;