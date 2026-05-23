// lib/useSession.ts
// Generate session_id unik per browser, simpan di localStorage

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  let sid = localStorage.getItem('kc_session')
  if (!sid) {
    sid = crypto.randomUUID()
    localStorage.setItem('kc_session', sid)
  }
  return sid
}
