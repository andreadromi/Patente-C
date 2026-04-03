const { Client } = require("pg");
const bcrypt = require("bcryptjs");
const DB = "postgresql://neondb_owner:npg_biZDsIB0rH5m@ep-noisy-firefly-agmg9wok-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

async function main() {
  const c = new Client({ connectionString: DB });
  await c.connect();
  const hash = await bcrypt.hash("@Div44354", 10);
  const r = await c.query('UPDATE "User" SET password = $1 WHERE username = $2 AND "isAdmin" = true', [hash, "admin"]);
  console.log("Updated:", r.rowCount, "admin users");
  if (r.rowCount === 0) {
    const r2 = await c.query('INSERT INTO "User" (username, password, "isAdmin") VALUES ($1, $2, true) ON CONFLICT (username) DO UPDATE SET password = $2, "isAdmin" = true', ["admin", hash]);
    console.log("Created/updated admin:", r2.rowCount);
  }
  await c.end();
  console.log("Done! Admin: admin / @Div44354");
}
main().catch(e => { console.error(e); process.exit(1); });
