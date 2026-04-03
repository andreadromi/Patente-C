'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Area = {
  id: string
  code: string
  name: string
}

export default function NewQuestionPage() {
  const router = useRouter()
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    text: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correctAnswer: '1',
    areaId: '',
  })

  // Carica aree
  useEffect(() => {
    fetch('/api/admin/areas')
      .then((res) => res.json())
      .then((data) => {
        setAreas(data.areas || [])
        // Seleziona prima area di default
        if (data.areas && data.areas.length > 0) {
          setFormData((prev) => ({ ...prev, areaId: data.areas[0].id }))
        }
      })
      .catch((err) => console.error('Error loading areas:', err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        alert('Domanda creata con successo!')
        router.push('/admin/questions')
      } else {
        alert(data.error || 'Errore durante la creazione')
      }
    } catch (error) {
      console.error('Error creating question:', error)
      alert('Errore durante la creazione della domanda')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#D5EA60] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-[#4D5057]">Nuova Domanda</h1>
              <p className="text-sm text-[#4D5057] mt-1">
                Compila tutti i campi per creare una nuova domanda
              </p>
            </div>
            <Link
              href="/admin/questions"
              className="px-4 py-2 text-sm font-medium text-[#4D5057] hover:text-[#4D5057] border border-[#E2E6EA] rounded-lg hover:bg-white"
            >
              ← Torna alla Lista
            </Link>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow p-6 space-y-6"
        >
          {/* Codice e Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Codice Domanda <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="es. MHN001"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-[#9CA3AF] mt-1">
                Codice univoco (3-4 lettere + 2-3 cifre)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area <span className="text-red-600">*</span>
              </label>
              <select
                required
                value={formData.areaId}
                onChange={(e) =>
                  setFormData({ ...formData, areaId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.code} - {area.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Testo Domanda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Testo Domanda <span className="text-red-600">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Inserisci il testo completo della domanda"
              value={formData.text}
              onChange={(e) =>
                setFormData({ ...formData, text: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Opzioni */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Opzioni di Risposta
            </h3>

            {[1, 2, 3, 4].map((num) => (
              <div key={num}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opzione {num} <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={`Testo opzione ${num}`}
                  value={formData[`option${num}` as keyof typeof formData]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [`option${num}`]: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            ))}
          </div>

          {/* Risposta Corretta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Risposta Corretta <span className="text-red-600">*</span>
            </label>
            <select
              required
              value={formData.correctAnswer}
              onChange={(e) =>
                setFormData({ ...formData, correctAnswer: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="1">Opzione 1</option>
              <option value="2">Opzione 2</option>
              <option value="3">Opzione 3</option>
              <option value="4">Opzione 4</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Link
              href="/admin/questions"
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annulla
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-[#4D5057] bg-[#059669] rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creazione...' : 'Crea Domanda'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
