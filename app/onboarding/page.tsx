'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  { id: 'Nasional', emoji: '🇮🇩', label: 'Nasional' },
  { id: 'Ekonomi', emoji: '💹', label: 'Ekonomi' },
  { id: 'Teknologi', emoji: '💻', label: 'Teknologi' },
  { id: 'Olahraga', emoji: '⚽', label: 'Olahraga' },
  { id: 'Dunia', emoji: '🌍', label: 'Dunia' },
  { id: 'Politik', emoji: '🏛️', label: 'Politik' },
  { id: 'Daerah', emoji: '📍', label: 'Daerah (Sumedang, Majalengka, Subang)' },
  { id: 'Viral', emoji: '🔥', label: 'Viral' },
]

const SCHEDULES = [
  { id: 'morning', emoji: '🌅', label: 'Pagi Cerdas', desc: 'Berita pilihan jam 06.00–09.00' },
  { id: 'afternoon', emoji: '☀️', label: 'Siang Update', desc: 'Berita terkini jam 12.00–14.00' },
  { id: 'evening', emoji: '🌙', label: 'Malam Ringkas', desc: 'Ringkasan hari ini jam 19.00–21.00' },
  { id: 'all', emoji: '⚡', label: 'Semua Waktu', desc: 'Berita terbaru kapan saja' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [selectedSchedule, setSelectedSchedule] = useState('all')
  const [saving, setSaving] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  function toggleCat(id: string) {
    setSelectedCats(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  async function finish() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('user_preferences').upsert({
      user_id: user.id,
      categories: selectedCats.length > 0 ? selectedCats : CATEGORIES.map(c => c.id),
      schedule: selectedSchedule,
      onboarded: true,
      updated_at: new Date().toISOString(),
    })

    router.replace('/')
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-logo">Kabar<span>Cerdas</span></div>

        {step === 1 && (
          <>
            <h2 className="onboarding-title">Pilih topik favoritmu</h2>
            <p className="onboarding-sub">Berita yang muncul akan disesuaikan dengan pilihanmu</p>
            <div className="onboarding-cats">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`onboarding-cat-btn ${selectedCats.includes(cat.id) ? 'selected' : ''}`}
                  onClick={() => toggleCat(cat.id)}
                >
                  <span className="cat-emoji">{cat.emoji}</span>
                  <span>{cat.label}</span>
                  {selectedCats.includes(cat.id) && <span className="cat-check">✓</span>}
                </button>
              ))}
            </div>
            <button
              className="onboarding-next-btn"
              onClick={() => setStep(2)}
            >
              Lanjut →
            </button>
            <p className="onboarding-skip" onClick={() => {
              setSelectedCats(CATEGORIES.map(c => c.id))
              setStep(2)
            }}>Pilih semua</p>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="onboarding-title">Kapan kamu biasa membaca?</h2>
            <p className="onboarding-sub">Kami akan prioritaskan berita terbaik di waktu itu</p>
            <div className="onboarding-schedules">
              {SCHEDULES.map(s => (
                <button
                  key={s.id}
                  className={`onboarding-schedule-btn ${selectedSchedule === s.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSchedule(s.id)}
                >
                  <span className="schedule-emoji">{s.emoji}</span>
                  <div>
                    <div className="schedule-label">{s.label}</div>
                    <div className="schedule-desc">{s.desc}</div>
                  </div>
                  {selectedSchedule === s.id && <span className="schedule-check">✓</span>}
                </button>
              ))}
            </div>
            <button
              className="onboarding-next-btn"
              onClick={finish}
              disabled={saving}
            >
              {saving ? 'Menyimpan...' : 'Mulai Membaca →'}
            </button>
          </>
        )}

        <div className="onboarding-steps">
          <span className={step === 1 ? 'active' : ''} />
          <span className={step === 2 ? 'active' : ''} />
        </div>
      </div>
    </div>
  )
}
