import { useState } from 'react'
import TopBar from './TopBar.jsx'
import AISidebar from './AISidebar.jsx'
import CalendarWidget from './widgets/CalendarWidget.jsx'
import StocksWidget from './widgets/StocksWidget.jsx'
import NewsWidget from './widgets/NewsWidget.jsx'
import GmailWidget from './widgets/GmailWidget.jsx'

export default function Portal() {
  const [expanded, setExpanded] = useState(null)

  return (
    <>
      <div className="stars-layer" />
      <div className="nebula-layer" />
      <div className="portal">
        <TopBar />
        <div className="portal-body">
          <div className="left-panel">
            <div className="main-grid" style={{ display: expanded ? 'none' : 'grid' }}>
              <CalendarWidget onExpand={() => setExpanded('캘린더')} />
              <StocksWidget   onExpand={() => setExpanded('주식')}   />
              <NewsWidget     onExpand={() => setExpanded('뉴스')}   />
              <GmailWidget    onExpand={() => setExpanded('Gmail')}  />
            </div>
            {expanded && (
              <div className="expanded-view active">
                <div className="exp-header">
                  <button className="back-btn" onClick={() => setExpanded(null)}>←</button>
                  <div className="exp-title">{expanded}</div>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
                  확장 뷰 준비 중
                </div>
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
