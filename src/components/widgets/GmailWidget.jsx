import { useState, useEffect } from 'react'

export default function GmailWidget({ onExpand, onOpenMail }) {
  const [emails, setEmails]       = useState([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading]     = useState(true)

  async function checkStatus() {
    const r = await fetch('/api/auth/google/status')
    const { connected } = await r.json()
    setConnected(connected)
    return connected
  }

  async function fetchInbox() {
    try {
      const r = await fetch('/api/gmail/inbox')
      if (!r.ok) return
      setEmails(await r.json())
    } catch {}
  }

  useEffect(() => {
    (async () => {
      const ok = await checkStatus()
      if (ok) await fetchInbox()
      setLoading(false)
    })()
  }, [])

  function connectGmail(e) {
    e.stopPropagation()
    const w = window.open('/api/auth/google', 'gmail-auth', 'width=500,height=650')
    const timer = setInterval(async () => {
      if (w?.closed) {
        clearInterval(timer)
        const ok = await checkStatus()
        if (ok) { await fetchInbox(); setLoading(false) }
      }
    }, 500)
  }

  function handleMailClick(e, mail) {
    e.stopPropagation()
    setEmails(prev => prev.map(m => m.id === mail.id ? { ...m, unread: false } : m))
    onOpenMail(mail)
  }

  const unreadCount = emails.filter(e => e.unread).length

  return (
    <div className="widget w-email" onClick={onExpand}>
      <div className="wlabel"><span className="ind" />&nbsp;Gmail</div>

      {loading ? (
        <div className="gmail-connecting">불러오는 중···</div>
      ) : !connected ? (
        <div className="gmail-connect-wrap" onClick={e => e.stopPropagation()}>
          <div className="gmail-connect-icon">✉</div>
          <div className="gmail-connect-desc">Gmail을 연결하면<br />받은편지함을 여기서 확인할 수 있어요</div>
          <button className="gmail-connect-btn" onClick={connectGmail}>Gmail 연결</button>
        </div>
      ) : (
        <>
          <div className="email-top">
            <div className="unread-big">{String(unreadCount).padStart(2, '0')}</div>
            <div className="unread-lbl">읽지 않은 메일</div>
          </div>
          <div className="widget-scroll">
            <div className="elist">
              {emails.length === 0
                ? <div style={{ color: 'var(--text-dim)', fontSize: '12px', padding: '8px 0' }}>메일 없음</div>
                : emails.map(e => (
                  <div key={e.id} className="eitem" onClick={ev => handleMailClick(ev, e)}>
                    <div className="esrow">
                      <div className={e.unread ? 'eunread' : 'eread'} />
                      <div className="ename">{e.name}</div>
                      <div className="etime" style={{ marginLeft: 'auto' }}>{e.time}</div>
                    </div>
                    <div className="esubj">{e.subj}</div>
                  </div>
                ))
              }
            </div>
          </div>
        </>
      )}
    </div>
  )
}
