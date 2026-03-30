import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database patente C...')

  // Carica dati
  const dataPath = path.join(process.cwd(), 'data', 'domande_patente_c.json')
  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  const { capitoli, domande } = raw

  // 1. Admin
  const adminHash = await bcrypt.hash('Admin2025', 10)
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: adminHash, isAdmin: true }
  })
  console.log('✅ Admin creato')

  // 2. Capitoli
  await prisma.capitolo.deleteMany()
  for (let i = 0; i < capitoli.length; i++) {
    const cap = capitoli[i]
    await prisma.capitolo.create({
      data: { id: i + 1, code: cap.code, name: cap.name, nEsame: cap.nEsame }
    })
  }
  console.log(`✅ ${capitoli.length} capitoli creati`)

  // 3. Domande
  await prisma.question.deleteMany()
  const capMap: Record<string, number> = {}
  capitoli.forEach((c: any, i: number) => { capMap[c.code] = i + 1 })

  const BATCH = 200
  let created = 0
  for (let i = 0; i < domande.length; i += BATCH) {
    const batch = domande.slice(i, i + BATCH)
    await prisma.question.createMany({
      data: batch.map((d: any) => ({
        capitoloId: capMap[d.capitolo_id] || 1,
        text: d.domanda,
        risposta: d.risposta
      }))
    })
    created += batch.length
    process.stdout.write(`\r  Domande: ${created}/${domande.length}`)
  }
  console.log(`\n✅ ${domande.length} domande create`)

  // 4. Simulazioni
  const simsPath = path.join(process.cwd(), 'data', 'simulations_patente_c.json')
  const simData = JSON.parse(fs.readFileSync(simsPath, 'utf-8'))

  // Mappa testo -> id domanda
  const allQuestions = await prisma.question.findMany({ select: { id: true, text: true } })
  const textToId: Record<string, string> = {}
  allQuestions.forEach(q => { textToId[q.text] = q.id })

  await prisma.simulation.deleteMany()
  let simCreated = 0
  for (const sim of simData) {
    const ids = sim.questionTexts
      .map((t: string) => textToId[t])
      .filter(Boolean)
    if (ids.length === 40) {
      await prisma.simulation.create({
        data: { number: sim.number, questions: JSON.stringify(ids) }
      })
      simCreated++
    }
  }
  console.log(`✅ ${simCreated} simulazioni create`)
  console.log('🎉 Seed completato!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
