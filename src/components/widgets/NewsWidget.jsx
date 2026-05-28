import { useState } from 'react'

const NEWS = [
  { src: 'TechCrunch', title: 'OpenAI releases GPT-5 with enhanced reasoning capabilities for enterprise', time: '2h ago' },
  { src: '연합뉴스',   title: '한국 반도체 수출 3개월 연속 증가…AI 수요 견인',                         time: '4h ago' },
  { src: 'Bloomberg',  title: 'Fed signals potential rate cut as inflation data eases toward 2% target',  time: '6h ago' },
  { src: 'Wired',      title: 'Apple M4 chip delivers 40% performance boost in latest MacBook Pro',      time: '8h ago' },
  { src: '한국경제',   title: '코스피 2,800선 회복…외국인 순매수 전환으로 상승세',                      time: '10h ago' },
  { src: 'The Verge',  title: 'Google DeepMind unveils next-gen AI model beating human experts in math', time: '12h ago' },
]

const TABS = ['전체', '기술 / AI', '경제 / 투자', '국내']

export default function NewsWidget({ onExpand }) {
  const [tab, setTab] = useState('전체')

  return (
    <div className="widget w-news" onClick={onExpand}>
      <div className="wlabel"><span className="ind" />&nbsp;뉴스</div>

      <div className="ntabs" onClick={e => e.stopPropagation()}>
        {TABS.map(t => (
          <div key={t} className={`ntab${tab === t ? ' on' : ''}`} onClick={() => setTab(t)}>{t}</div>
        ))}
      </div>

      <div className="nlist" onClick={e => e.stopPropagation()}>
        {NEWS.map((n, i) => (
          <div key={i} className="nitem">
            <div className="nsrc">{n.src}</div>
            <div className="ntitle">{n.title}</div>
            <div className="ntime">{n.time}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
