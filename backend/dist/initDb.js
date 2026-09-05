"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./db"));
const initDb = async () => {
    await db_1.default.query(`
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
exports.default = initDb;
