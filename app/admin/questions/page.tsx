'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Question {
  id: string; code: string; text: string; risposta: boolean; questionGroup: string | null; image: string | null
  argomento: { code: string; name: string }
}

/**
 * L'archivio, da sfogliare e cercare. In sola lettura: le domande stanno in
 * data/ e il seed le riallinea a ogni deploy (vedi api/admin/questions).
 */
export default function AdminQuestionsPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const PER_PAGE = 50

  useEffect(() => {
    fetch('/api/admin/questions').then(r => r.json()).then(d => { setQuestions(d.questions || []); setLoading(false) })
  }, [])

  const cerca = search.trim().toLowerCase()
  const filtered = questions.filter(q => !cerca
    || q.code.toLowerCase().includes(cerca)
    || q.text.toLowerCase().includes(cerca)
    || q.questionGroup?.toLowerCase().includes(cerca)
    || q.argomento.name.toLowerCase().includes(cerca))
  const pages = Math.ceil(filtered.length / PER_PAGE)
  const items = filtered.slice(page * PER_PAGE, (page+1) * PER_PAGE)

  if (loading) return <div style={{minHeight:'100vh',background:'var(--bg)',padding:40,textAlign:'center'}}>Caricamento...</div>

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
    <div style={{padding:24,fontFamily:'system-ui,sans-serif',maxWidth:1000,margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
        <div>
          <h1 style={{margin:'0 0 4px',fontSize:22,fontWeight:800}}>Domande</h1>
          <p style={{margin:0,color:'#6b7280',fontSize:13}}>{questions.length.toLocaleString('it-IT')} domande vero/falso del listato ministeriale</p>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={() => router.push('/admin/dashboard')} style={{padding:'8px 16px',borderRadius:8,border:'1px solid #d1d5db',background:'#fff',cursor:'pointer'}}>← Dashboard</button>
        </div>
      </div>

      <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} placeholder="Cerca nel testo, per codice o per argomento..."
        style={{width:'100%',padding:'10px 14px',borderRadius:10,border:'1px solid #d1d5db',fontSize:14,marginBottom:8,boxSizing:'border-box'}} />
      <p style={{margin:'0 0 16px',color:'#6b7280',fontSize:12}}>
        {filtered.length.toLocaleString('it-IT')} trovate · l&apos;archivio si corregge in <code>data/</code>, non da qui
      </p>

      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {items.map(q => (
          <div key={q.id} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,padding:'12px 16px'}}>
            {q.questionGroup && <div style={{fontSize:11,color:'#6b7280',marginBottom:4,fontStyle:'italic'}}>{q.questionGroup}</div>}
            <div style={{fontSize:13,color:'#111',lineHeight:1.4}}>{q.text}</div>
            <div style={{display:'flex',gap:8,marginTop:6,alignItems:'center',flexWrap:'wrap'}}>
              <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:q.risposta?'#dcfce7':'#fee2e2',color:q.risposta?'#166534':'#991b1b',fontWeight:700}}>{q.risposta?'VERO':'FALSO'}</span>
              <span style={{fontSize:11,color:'#6b7280',fontWeight:700}}>{q.code}</span>
              <span style={{fontSize:11,color:'#9ca3af'}}>{q.argomento.name}</span>
              {q.image && <span style={{fontSize:11,color:'#9ca3af'}}>figura {q.image}</span>}
            </div>
          </div>
        ))}
      </div>

      {pages > 1 && (
        <div style={{display:'flex',gap:8,justifyContent:'center',marginTop:20}}>
          <button disabled={page===0} onClick={()=>setPage(p=>p-1)} style={{padding:'6px 14px',borderRadius:8,border:'1px solid #d1d5db',cursor:page===0?'default':'pointer',opacity:page===0?0.4:1}}>← Prec</button>
          <span style={{padding:'6px 12px',fontSize:13,color:'#6b7280'}}>{page+1}/{pages}</span>
          <button disabled={page===pages-1} onClick={()=>setPage(p=>p+1)} style={{padding:'6px 14px',borderRadius:8,border:'1px solid #d1d5db',cursor:page===pages-1?'default':'pointer',opacity:page===pages-1?0.4:1}}>Succ →</button>
        </div>
      )}
    </div>
    </div>
  )
}
