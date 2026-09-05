import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "reachbox",
  password: "reachbox123",
  database: "reachbox",
});

export default pool;