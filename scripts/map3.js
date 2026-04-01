const{Client}=require("pg");const https=require("https");
const DB="postgresql://neondb_owner:npg_biZDsIB0rH5m@ep-noisy-firefly-agmg9wok-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function get(u){return new Promise((res,rej)=>{
  https.get(u,{headers:{"User-Agent":"Mozilla/5.0"}},r=>{
    let d="";r.on("data",c=>d+=c);r.on("end",()=>res(d));r.on("error",rej)
  }).on("error",rej)
})}

function parseExam(html){
  // Extract image numbers from img-sign references
  const imgs=[];let m;const re=/img-sign\/(\d+)\.png/g;
  while((m=re.exec(html))!==null){
    const n=parseInt(m[1]);if(!imgs.includes(n))imgs.push(n);
  }
  
  // Strip scripts, styles, and HTML tags
  let pl=html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi,"")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi,"")
    .replace(/<[^>]+>/g,"\n")
    .replace(/&nbsp;/g," ")
    .replace(/&#x27;/g,"'")
    .replace(/&amp;/g,"&")
    .replace(/&quot;/g,'"')
    .replace(/&ograve;/g,"ò")
    .replace(/&agrave;/g,"à")
    .replace(/&egrave;/g,"è")
    .replace(/&ugrave;/g,"ù")
    .replace(/&igrave;/g,"ì")
    .replace(/&eacute;/g,"é")
    .replace(/&Egrave;/g,"È");
  
  // Split into lines, trim each, remove empty
  const lines=pl.split("\n").map(l=>l.trim()).filter(l=>l.length>0);
  
  // Find questions: a line that is just a number (1-40) followed by a line with actual text
  const questions=[];
  for(let i=0;i<lines.length;i++){
    const num=parseInt(lines[i]);
    if(num>=1 && num<=40 && lines[i]===String(num)){
      // Next non-empty line should be the question text
      if(i+1<lines.length && lines[i+1].length>20 && !/^\d+$/.test(lines[i+1])){
        // Verify it's a real question (starts with letter, not just "V" or "F")
        const txt=lines[i+1];
        if(txt.length>25 && /^[A-ZÈÉÀÙILSDNPUCQOl]/i.test(txt)){
          questions[num]=txt;
        }
      }
    }
  }
  
  // Match image-bearing questions to images in order
  const KW=["raffigurat","in figura","simbolo rappresentato","pannello in fig"];
  const pairs=[];let idx=0;
  for(let n=1;n<=40;n++){
    if(!questions[n])continue;
    const lo=questions[n].toLowerCase();
    if(KW.some(k=>lo.includes(k))&&idx<imgs.length){
      pairs.push({text:questions[n],img:imgs[idx]});
      idx++;
    }
  }
  
  const qCount=Object.keys(questions).length;
  return{imgs,pairs,totalQ:qCount};
}

async function main(){
  const c=new Client({connectionString:DB});
  await c.connect();
  
  await c.query('ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "image" TEXT');
  await c.query('UPDATE "Question" SET image=NULL');
  console.log("DB ready");
  
  const allPairs={};
  let noNew=0;
  
  for(let e=1;e<=500;e++){
    try{
      process.stdout.write("e"+e+".");
      const h=await get("https://www.patentisuperiori.com/quiz-patente-c/esame-"+e+".html");
      if(h.length<2000){console.log("skip");noNew++;if(noNew>50)break;continue}
      
      const result=parseExam(h);
      let nw=0;
      for(const p of result.pairs){
        const k=p.text.substring(0,60).toLowerCase().replace(/\s+/g," ").trim();
        if(!allPairs[k]){allPairs[k]=p;nw++}
      }
      const tot=Object.keys(allPairs).length;
      console.log(result.pairs.length+"p("+nw+"n)q:"+result.totalQ+" t:"+tot);
      
      if(nw>0)noNew=0;else noNew++;
      if(tot>=226&&e>100)break;
      if(noNew>50){console.log("Stopping: no new pairs for 50 exams");break}
      await sleep(300);
    }catch(er){console.log("err:"+er.message);noNew++}
  }
  
  console.log("\nTotal unique text-image pairs: "+Object.keys(allPairs).length);
  
  // Match pairs to DB questions
  let updated=0,notfound=0;
  const missed=[];
  
  for(const[k,p]of Object.entries(allPairs)){
    // Try LIKE match on substring
    const sub=p.text.substring(0,50).replace(/\s+/g," ").trim();
    const r=await c.query(
      'UPDATE "Question" SET image=$1 WHERE LOWER(text) LIKE LOWER($2) AND image IS NULL RETURNING id',
      [p.img+".png",sub+"%"]
    );
    if(r.rowCount>0){updated+=r.rowCount;continue}
    
    // Fuzzy: try with middle part
    const mid=p.text.substring(5,45).replace(/\s+/g," ").trim();
    const r2=await c.query(
      'UPDATE "Question" SET image=$1 WHERE LOWER(text) LIKE LOWER($2) AND image IS NULL RETURNING id',
      [p.img+".png","%"+mid+"%"]
    );
    if(r2.rowCount>0){updated+=r2.rowCount;continue}
    
    notfound++;
    if(missed.length<10)missed.push("["+p.img+"] "+p.text.substring(0,80));
  }
  
  console.log("Updated: "+updated);
  console.log("Not found: "+notfound);
  if(missed.length>0){
    console.log("\nNot found samples:");
    missed.forEach(t=>console.log("  "+t));
  }
  
  const v=await c.query('SELECT COUNT(*) FROM "Question" WHERE image IS NOT NULL');
  console.log("\n*** Total questions with images: "+v.rows[0].count+" ***");
  
  const samples=await c.query('SELECT LEFT(text,70) as t, image FROM "Question" WHERE image IS NOT NULL LIMIT 5');
  console.log("\nSamples:");
  samples.rows.forEach(r=>console.log("  ["+r.image+"] "+r.t));
  
  await c.end();
}

main().catch(e=>{console.error(e);process.exit(1)});
