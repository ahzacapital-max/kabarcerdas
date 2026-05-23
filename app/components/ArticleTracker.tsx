// app/components/ArticleTracker.tsx
'use client'

import { useEffect, useRef } from 'react'
import { getSessionId } from '@/lib/useSession'
type Props = {
  articleId: string
  category: string
  tags: string[]
}

export default function ArticleTracker({ articleId, category, tags }: Props) {
  const startRef = useRef(Date.now())
  const sentRef = useRef(false)

  useEffect(() => {
    startRef.current = Date.now()
    sentRef.current = false

    const send = () => {
      if (sentRef.current) return
      sentRef.current = true
      const duration = Math.round((Date.now() - startRef.current) / 1000)
      const session_id = getSessionId()
      // pakai sendBeacon supaya tetap terkirim walau tab ditutup
      navigator.sendBeacon(
        '/api/track',
        JSON.stringify({ session_id, article_id: articleId, category, tags, read_duration: duration })
      )
    }

    // Kirim saat user tinggalkan halaman
    window.addEventListener('pagehide', send)
    // Kirim juga kalau sudah baca > 30 detik (engagement signal)
    const timer = setTimeout(send, 30000)

    return () => {
      window.removeEventListener('pagehide', send)
      clearTimeout(timer)
    }
  }, [articleId, category, tags])

  return null
}
