const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 5,                 // 🔹 límite de conexiones
  idleTimeoutMillis: 30000, // 🔹 30 segundos
  connectionTimeoutMillis: 10000
});

pool.on("connect", () => {
  console.log("📦 PostgreSQL conectado");
});

pool.on("error", (err) => {
  console.error("❌ Error inesperado en PostgreSQL:", err);
});

module.exports = pool;
