const EMAILS = [
  { name: 'Google Workspace', subj: 'Monthly storage usage report for your account',       time: '10:32', unread: true  },
  { name: 'GitHub',           subj: '[PR #142] Feature: Add dark mode support merged',      time: '09:15', unread: true  },
  { name: '김민준',           subj: 'Re: 다음 주 미팅 일정 관련 확인 부탁드립니다',          time: '어제',   unread: true  },
  { name: 'Notion',           subj: 'Your weekly digest: 3 pages updated',                  time: '어제',   unread: false },
  { name: 'LinkedIn',         subj: 'You appeared in 12 searches this week',                time: '어제',   unread: false },
]

export default function GmailWidget({ onExpand }) {
  const unreadCount = EMAILS.filter(e => e.unread).length

  return (
    <div className="widget w-email" onClick={onExpand}>
      <div className="wlabel"><span className="ind" />&nbsp;Gmail</div>
      <div className="email-top">
        <div className="unread-big">{String(unreadCount).padStart(2, '0')}</div>
        <div className="unread-lbl">읽지 않은 메일</div>
      </div>
      <div className="widget-scroll">
        <div className="elist">
          {EMAILS.map((e, i) => (
            <div key={i} className="eitem">
              <div className="esrow">
                <div className={e.unread ? 'eunread' : 'eread'} />
                <div className="ename">{e.name}</div>
                <div className="etime" style={{ marginLeft: 'auto' }}>{e.time}</div>
              </div>
              <div className="esubj">{e.subj}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
