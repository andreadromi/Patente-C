import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { leggiCodici, materialeSimulazione, domandeDaCodici } from '@/lib/esame-generato'

type Props = {
  params: Promise<{
    id: string
  }>
}

/** La simulazione fissa con questo id; gli esami generati degli utenti non si toccano da qui. */
async function simulazioneFissa(id: string) {
  const simulation = await prisma.simulation.findUnique({ where: { id } })
  return simulation && !simulation.generata ? simulation : null
}

// GET /api/admin/simulations/[id] - Dettaglio singola simulazione
export async function GET(request: NextRequest, props: Props) {
  const params = await props.params
  try {
    const user = await getCurrentUser()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const simulation = await simulazioneFissa(params.id)
    if (!simulation) {
      return NextResponse.json(
        { error: 'Simulazione non trovata' },
        { status: 404 }
      )
    }

    // Per il modulo di modifica: i codici del listato, non gli id delle domande
    const ids: string[] = JSON.parse(simulation.questions || '[]')
    const righe = await prisma.question.findMany({ where: { id: { in: ids } }, select: { id: true, code: true } })
    const codice = new Map(righe.map(r => [r.id, r.code]))
    return NextResponse.json({ simulation, codici: ids.map(id => codice.get(id)).filter(Boolean) })
  } catch (error) {
    console.error('[GET /api/admin/simulations/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante il caricamento della simulazione' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/simulations/[id] - Aggiorna simulazione dai codici delle domande del listato
export async function PUT(request: NextRequest, props: Props) {
  const params = await props.params
  try {
    const user = await getCurrentUser()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { number, questions, titolo } = body

    if (!number || !questions) {
      return NextResponse.json(
        { error: 'Numero e domande sono obbligatori' },
        { status: 400 }
      )
    }

    const n = parseInt(number)
    if (!Number.isInteger(n) || n <= 0) {
      return NextResponse.json({ error: 'Numero simulazione non valido' }, { status: 400 })
    }

    const codici = leggiCodici(questions)
    if (!codici || !codici.length) {
      return NextResponse.json(
        { error: 'Formato domande non valido. Deve essere un array JSON di codici delle domande del listato' },
        { status: 400 }
      )
    }

    const existingSimulation = await simulazioneFissa(params.id)
    if (!existingSimulation) {
      return NextResponse.json(
        { error: 'Simulazione non trovata' },
        { status: 404 }
      )
    }

    // Verifica che il numero non sia già usato da altra simulazione
    if (n !== existingSimulation.number) {
      const numberExists = await prisma.simulation.findUnique({ where: { number: n } })
      if (numberExists) {
        return NextResponse.json(
          { error: 'Numero simulazione già esistente' },
          { status: 400 }
        )
      }
    }

    const { trovate, mancanti } = await domandeDaCodici(prisma, codici)
    if (mancanti.length) {
      return NextResponse.json(
        { error: `Codici non trovati: ${mancanti.join(', ')}` },
        { status: 400 }
      )
    }

    const simulation = await prisma.simulation.update({
      where: { id: params.id },
      data: {
        number: n,
        ...(typeof titolo === 'string' && titolo.trim() ? { titolo: titolo.trim() } : {}),
        ...materialeSimulazione(trovate),
      },
    })

    return NextResponse.json({ simulation })
  } catch (error) {
    console.error('[PUT /api/admin/simulations/[id]] Error:', error)
    return NextResponse.json(
      { error: "Errore durante l'aggiornamento della simulazione" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/simulations/[id] - Elimina simulazione
export async function DELETE(request: NextRequest, props: Props) {
  const params = await props.params
  try {
    const user = await getCurrentUser()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const existingSimulation = await simulazioneFissa(params.id)
    if (!existingSimulation) {
      return NextResponse.json(
        { error: 'Simulazione non trovata' },
        { status: 404 }
      )
    }

    // Verifica se la simulazione è stata usata da utenti
    const usedSimulation = await prisma.userSimulation.findFirst({
      where: { simulationId: params.id },
    })

    if (usedSimulation) {
      return NextResponse.json(
        {
          error:
            'Impossibile eliminare: simulazione già utilizzata da uno o più utenti',
        },
        { status: 400 }
      )
    }

    await prisma.simulation.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/admin/simulations/[id]] Error:', error)
    return NextResponse.json(
      { error: "Errore durante l'eliminazione della simulazione" },
      { status: 500 }
    )
  }
}
