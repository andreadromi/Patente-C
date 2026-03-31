await c.query('ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "image" TEXT');
await c.query('UPDATE "Question" SET image=NULL');
console.log("DB ready");const all={};
for(let e=1;e<=200;e++){try{
process.stdout.write("e"+e+".");
const h=await get("https://www.patentisuperiori.com/quiz-patente-c/esame-"+e+".html");
if(h.length<2000){console.log("skip");continue}
const p=parse(h);let nw=0;
for(const x of p){const k=x.text.substring(0,80).toLowerCase();if(!all[k]){all[k]=x;nw++}}
console.log(p.length+"p("+nw+"n)t:"+Object.keys(all).length);
if(Object.keys(all).length>=226&&e>68)break;
await sleep(400)}catch(er){console.log("err")}}
console.log("\nPairs:"+Object.keys(all).length);
let u=0,nf=0;
for(const[k,p]of Object.entries(all)){
const r=await c.query('UPDATE "Question" SET image=$1 WHERE LOWER(LEFT(text,80))=LOWER($2) AND image IS NULL RETURNING id',[p.img+".png",p.text.substring(0,80)]);
if(r.rowCount>0)u+=r.rowCount;
else{const r2=await c.query('UPDATE "Question" SET image=$1 WHERE LOWER(text) LIKE LOWER($2) AND image IS NULL RETURNING id',[p.img+".png","%"+p.text.substring(0,50)+"%"]);
if(r2.rowCount>0)u+=r2.rowCount;else nf++}}
console.log("Updated:"+u+" NotFound:"+nf);
const v=await c.query('SELECT COUNT(*) FROM "Question" WHERE image IS NOT NULL');
console.log("Total with images:"+v.rows[0].count);await c.end()}
main().catch(e=>{console.error(e);process.exit(1)});
