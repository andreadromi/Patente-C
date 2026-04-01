// Run: node scripts/migrate.js
const{Client}=require("pg");
const DB="postgresql://neondb_owner:npg_biZDsIB0rH5m@ep-noisy-firefly-agmg9wok-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

async function main(){
  const c=new Client({connectionString:DB});
  await c.connect();
  console.log("Connected");

  // 1. image column (probably already exists)
  await c.query('ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "image" TEXT');
  console.log("1. image column OK");

  // 2. answeredAt column on Answer
  await c.query('ALTER TABLE "Answer" ADD COLUMN IF NOT EXISTS "answeredAt" TIMESTAMP');
  console.log("2. answeredAt column OK");

  // 3. Clean up duplicate answers before adding unique constraint
  const dupes=await c.query(`
    DELETE FROM "Answer" a USING "Answer" b
    WHERE a.id > b.id
    AND a."userSimulationId" = b."userSimulationId"
    AND a."questionId" = b."questionId"
  `);
  console.log("3. Cleaned duplicates:",dupes.rowCount);

  // 4. Add unique constraint
  try{
    await c.query('ALTER TABLE "Answer" ADD CONSTRAINT "Answer_userSimulationId_questionId_key" UNIQUE ("userSimulationId","questionId")');
    console.log("4. Unique constraint added");
  }catch(e){
    if(e.message.includes("already exists"))console.log("4. Unique constraint already exists");
    else throw e;
  }

  // 5. Verify
  const imgs=await c.query('SELECT COUNT(*) FROM "Question" WHERE image IS NOT NULL');
  const total=await c.query('SELECT COUNT(*) FROM "Question"');
  const sims=await c.query('SELECT COUNT(*) FROM "Simulation"');
  console.log("\n=== DB Status ===");
  console.log("Questions total:",total.rows[0].count);
  console.log("Questions with images:",imgs.rows[0].count);
  console.log("Simulations:",sims.rows[0].count);

  await c.end();
  console.log("\nMigration complete!");
}
main().catch(e=>{console.error(e);process.exit(1)});
