import { useState } from 'react'

const STOCKS = [
  { name: '삼성전자',  chg: '▲ 2.3%', price: '72,400',   up: true,  pts: '0,20 12,17 24,15 36,12 50,9 64,6 80,3',  ex: [80,3]  },
  { name: 'NVIDIA',    chg: '▲ 1.8%', price: '$892.54',  up: true,  pts: '0,18 12,20 24,16 36,14 50,10 64,7 80,4', ex: [80,4]  },
  { name: '카카오',    chg: '▼ 0.7%', price: '42,150',   up: false, pts: '0,5 12,7 24,6 36,10 50,13 64,12 80,16',  ex: [80,16] },
  { name: 'Apple',     chg: '▼ 0.4%', price: '$189.30',  up: false, pts: '0,6 12,8 24,11 36,9 50,13 64,15 80,17',  ex: [80,17] },
  { name: 'SK하이닉스', chg: '▲ 1.1%', price: '185,500', up: true,  pts: '0,19 12,21 24,17 36,14 50,11 64,8 80,5', ex: [80,5]  },
  { name: '테슬라',    chg: '▲ 3.2%', price: '$248.10',  up: true,  pts: '0,22 12,18 24,20 36,14 50,10 64,7 80,3', ex: [80,3]  },
  { name: '메타',      chg: '▼ 1.1%', price: '$512.80',  up: false, pts: '0,4 12,6 24,8 36,7 50,11 64,14 80,18',   ex: [80,18] },
  { name: '현대차',    chg: '▲ 0.9%', price: '228,000',  up: true,  pts: '0,18 12,16 24,17 36,13 50,11 64,9 80,6', ex: [80,6]  },
]

const BUY  = [
  { name: '삼성전자',  reason: '52주 저점 근접' },
  { name: 'SK하이닉스', reason: '과매도 구간'   },
  { name: '카카오',    reason: '지지선 반등'    },
  { name: '현대차',    reason: '저PBR 매력'    },
]
const SELL = [
  { name: 'NVIDIA',  reason: '52주 고점 근접' },
  { name: 'Apple',   reason: 'RSI 과매수'     },
  { name: '테슬라',  reason: '단기 과열'       },
  { name: '메타',    reason: '목표가 도달'     },
]

const TABS = ['전체', '한국', '미국']

export default function StocksWidget({ onExpand }) {
  const [tab, setTab] = useState('전체')

  return (
    <div className="widget w-stocks" onClick={onExpand}>
      <div className="wlabel"><span className="ind" />&nbsp;주식</div>

      <div className="stabs" onClick={e => e.stopPropagation()}>
        {TABS.map(t => (
          <div key={t} className={`stab${tab === t ? ' on' : ''}`} onClick={() => setTab(t)}>{t}</div>
        ))}
      </div>

      {/* 주식 카드 영역 - 구분선 위에서만 스크롤 */}
      <div className="widget-scroll" onClick={e => e.stopPropagation()}>
        <div className="sgrid">
          {STOCKS.map(s => {
            const c = s.up ? 'rgba(255,110,110,' : 'rgba(100,160,255,'
            return (
              <div key={s.name} className={`scard ${s.up ? 'up-card' : 'dn-card'}`}>
                <div className="scard-top">
                  <div className="sname">{s.name}</div>
                  <div className={`schg ${s.up ? 'up' : 'dn'}`}>{s.chg}</div>
                </div>
                <div className="sprice">{s.price}</div>
                <svg className="spark" viewBox="0 0 80 24" preserveAspectRatio="none">
                  <polygon points={`${s.pts} ${s.ex[0]},24 0,24`} fill={`${c}0.08)`} />
                  <polyline points={s.pts} fill="none" stroke={`${c}0.6)`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx={s.ex[0]} cy={s.ex[1]} r="2" fill={`${c}0.85)`} />
                </svg>
              </div>
            )
          })}
          <div className="scard-add">+ 추가</div>
        </div>
      </div>

      {/* 매수/매도 추천 - 구분선 아래 */}
      <div className="srec" onClick={e => e.stopPropagation()}>
        <div className="srec-hd"><span className="srec-dot" />오늘의 추천</div>
        <div className="srec-cols">
          <div className="srec-col">
            <div className="srec-label buy">▲ 매수</div>
            {BUY.map(b => (
              <div key={b.name} className="srec-item buy">
                <span className="srec-name">{b.name}</span>
                <span className="srec-reason">{b.reason}</span>
              </div>
            ))}
          </div>
          <div className="srec-col">
            <div className="srec-label sell">▼ 매도</div>
            {SELL.map(s => (
              <div key={s.name} className="srec-item sell">
                <span className="srec-name">{s.name}</span>
                <span className="srec-reason">{s.reason}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
