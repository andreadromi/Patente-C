import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database patente C...')

  const dataPath = path.join(process.cwd(), 'data', 'domande_patente_c.json')
  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  const { capitoli, domande } = raw

  const simsPath = path.join(process.cwd(), 'data', 'simulations_patente_c.json')
  const simData = JSON.parse(fs.readFileSync(simsPath, 'utf-8'))

  const adminHash = await bcrypt.hash('Admin2025', 10)
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: adminHash, isAdmin: true }
  })
  console.log('✅ Admin creato')

  await prisma.answer.deleteMany()
  await prisma.capitoloResult.deleteMany()
  await prisma.weakPoint.deleteMany()
  await prisma.userSimulation.deleteMany()
  await prisma.simulation.deleteMany()
  await prisma.question.deleteMany()
  await prisma.capitolo.deleteMany()
  console.log('✅ Dati vecchi rimossi')

  for (let i = 0; i < capitoli.length; i++) {
    const cap = capitoli[i]
    await prisma.capitolo.create({
      data: { id: i + 1, code: cap.code, name: cap.name, nEsame: cap.nEsame }
    })
  }
  console.log(`✅ ${capitoli.length} capitoli creati`)

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

  const allQuestions = await prisma.question.findMany({ select: { id: true, text: true } })
  const textToId: Record<string, string> = {}
  allQuestions.forEach(q => { textToId[q.text] = q.id })

  let simCreated = 0
  for (const sim of simData) {
    const ids = sim.questionTexts.map((t: string) => textToId[t]).filter(Boolean)
    if (ids.length === 40) {
      await prisma.simulation.create({
        data: {
          number: sim.number,
          questions: JSON.stringify(ids),
          capitoloCode: sim.capitoloCode || null,
          titolo: sim.capitolo || null,
        }
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
