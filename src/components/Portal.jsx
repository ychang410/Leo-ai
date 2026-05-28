import { useState } from 'react'
import TopBar from './TopBar.jsx'
import AISidebar from './AISidebar.jsx'
import CalendarWidget from './widgets/CalendarWidget.jsx'
import StocksWidget from './widgets/StocksWidget.jsx'
import NewsWidget from './widgets/NewsWidget.jsx'
import GmailWidget from './widgets/GmailWidget.jsx'
import MailDetail from './MailDetail.jsx'

export default function Portal() {
  const [expanded, setExpanded]     = useState(null)   // widget name string
  const [expandedMail, setExpandedMail] = useState(null) // { id, name, subj, time }

  function openMail(mail) {
    setExpanded(null)
    setExpandedMail(mail)
  }

  function closeExpanded() {
    setExpanded(null)
    setExpandedMail(null)
  }

  const isExpanded = expanded || expandedMail

  return (
    <>
      <div className="stars-layer" />
      <div className="nebula-layer" />
      <div className="portal">
        <TopBar />
        <div className="portal-body">
          <div className="left-panel">
            <div className="main-grid" style={{ display: isExpanded ? 'none' : 'flex' }}>
              <div className="main-row-top">
                <CalendarWidget onExpand={() => setExpanded('캘린더')} />
                <StocksWidget   onExpand={() => setExpanded('주식')}   />
              </div>
              <div className="main-row-bottom">
                <NewsWidget     onExpand={() => setExpanded('뉴스')}   />
                <GmailWidget    onExpand={() => setExpanded('Gmail')} onOpenMail={openMail} />
              </div>
            </div>
            {isExpanded && (
              <div className="expanded-view active">
                <div className="exp-header">
                  <button className="back-btn" onClick={closeExpanded}>←</button>
                  <div className="exp-title">{expandedMail ? expandedMail.subj : expanded}</div>
                </div>
                {expandedMail
                  ? <MailDetail mail={expandedMail} />
                  : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
                      확장 뷰 준비 중
                    </div>
                }
              </div>
            )}
          </div>
          <div className="panel-divider" />
          <AISidebar />
        </div>
      </div>
      <div className="status-bar">
        <div className="sdot" />
        <span className="slbl">MY SPACE</span>
      </div>
    </>
  )
}
