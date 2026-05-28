import { useState, useEffect } from 'react'

export default function MailDetail({ mail }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setData(null)
    fetch(`/api/gmail/message/${mail.id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [mail.id])

  const from    = data?.from  || mail.name
  const email   = data?.email || ''
  const dateStr = data?.date  ? new Date(data.date).toLocaleString('ko', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : mail.time

  return (
    <div className="mail-detail">
      <div className="mail-detail-meta">
        <div className="mail-detail-from">
          <span className="mail-from">{from}</span>
          {email && <span className="mail-email">&lt;{email}&gt;</span>}
        </div>
        <div className="mail-detail-date">{dateStr}</div>
      </div>

      <div className="mail-detail-body">
        {loading ? (
          <div className="mail-loading">불러오는 중···</div>
        ) : !data?.body ? (
          <div className="mail-loading">본문을 불러올 수 없어요</div>
        ) : data.isHtml ? (
          <iframe
            srcDoc={data.body}
            sandbox="allow-same-origin"
            className="mail-iframe"
            title="mail"
          />
        ) : (
          <pre className="mail-plain">{data.body}</pre>
        )}
      </div>
    </div>
  )
}
