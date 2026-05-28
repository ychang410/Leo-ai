import { useState, useEffect } from 'react'
import { getPortfolio, addPortfolioStock, updatePortfolioStock, removePortfolioStock,
         getWatchlist, addWatchlistStock, updateWatchlistStock, removeWatchlistStock,
         getWatchGroups, addWatchGroup } from '../../store/index.js'

const TABS = ['미국', '한국']
const EMPTY_P = { ticker: '', shares: '', buyDate: '', buyPrice: '', market: '미국' }
const EMPTY_W = { ticker: '', market: '미국', group: '' }

export default function StocksWidget({ onExpand }) {
  const [tab, setTab]           = useState('미국')
  const [portfolio, setPortfolio] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [quotes, setQuotes]     = useState({})
  const [showAdd, setShowAdd]   = useState(null)
  const [pForm, setPForm]       = useState(EMPTY_P)
  const [wForm, setWForm]       = useState(EMPTY_W)
  const [wGroup, setWGroup]     = useState('전체')
  const [customGroups, setCustomGroups] = useState(() => getWatchGroups())
  const [addingGroup, setAddingGroup]   = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [editCard, setEditCard] = useState(null)

  function reload() {
    const p = getPortfolio()
    const w = getWatchlist()
    setPortfolio(p); setWatchlist(w)
    const all = [...p, ...w]
    if (!all.length) return
    const symbols = [...new Set(all.map(s => s.ticker))].join(',')
    fetch(`/api/stocks/quote?symbols=${symbols}`)
      .then(r => r.json())
      .then(data => { const m = {}; data.forEach(q => { m[q.symbol] = q }); setQuotes(m) })
      .catch(() => {})
  }

  useEffect(() => { reload() }, [])

  const dtick  = sym => sym.replace(/\.(KS|KQ)$/, '')
  const toYF   = (t, mkt) => mkt === '한국' && !t.includes('.') ? t + '.KS' : t.toUpperCase()
  const fmtP   = (price, mkt) => mkt === '미국' ? `$${price.toFixed(2)}` : `${price.toLocaleString('ko')}원`
  const fmtT   = (price, mkt) => mkt === '미국' ? `$${Math.round(price).toLocaleString()}` : `${Math.round(price).toLocaleString('ko')}원`

  const filteredP = portfolio.filter(s => s.market === tab)
  const tabW      = watchlist.filter(s => s.market === tab)
  const wGroups   = ['전체', ...new Set([...customGroups, ...tabW.map(s => s.group).filter(Boolean)])]
  const filteredW = wGroup === '전체' ? tabW : tabW.filter(s => s.group === wGroup)

  const totalGain = filteredP.reduce((sum, s) => {
    const q = quotes[s.ticker]; return sum + (q ? (q.price - s.buyPrice) * s.shares : 0)
  }, 0)

  function handleAddP(e) {
    e.preventDefault()
    addPortfolioStock({ ticker: toYF(pForm.ticker, pForm.market), market: pForm.market, shares: pForm.shares, buyDate: pForm.buyDate, buyPrice: pForm.buyPrice })
    setPForm(EMPTY_P); setShowAdd(null); reload()
  }

  function handleAddW(e) {
    e.preventDefault()
    const group = wForm.group.trim() || (wGroup !== '전체' ? wGroup : '')
    addWatchlistStock({ ticker: toYF(wForm.ticker, wForm.market), market: wForm.market, group })
    setWForm(EMPTY_W); setShowAdd(null); reload()
  }

  function handleAddGroup(e) {
    e.preventDefault()
    const name = newGroupName.trim()
    if (!name) return
    addWatchGroup(name)
    setCustomGroups(getWatchGroups())
    setWGroup(name)
    setNewGroupName('')
    setAddingGroup(false)
  }

  function openEdit(type, stock) {
    if (type === 'portfolio') {
      setEditCard({ type, stock, form: { mode: '보유', shares: String(stock.shares), buyPrice: String(stock.buyPrice), buyDate: stock.buyDate, group: '' } })
    } else {
      setEditCard({ type, stock, form: { mode: '관심', shares: '', buyPrice: '', buyDate: '', group: stock.group || '' } })
    }
  }

  function handleEditSave() {
    const { type, stock, form } = editCard
    if (form.mode === '보유') {
      if (type === 'portfolio') {
        updatePortfolioStock(stock.id, { shares: parseFloat(form.shares), buyPrice: parseFloat(form.buyPrice), buyDate: form.buyDate })
      } else {
        removeWatchlistStock(stock.id)
        addPortfolioStock({ ticker: stock.ticker, market: stock.market, shares: form.shares, buyDate: form.buyDate, buyPrice: form.buyPrice })
      }
    } else {
      if (type === 'watchlist') {
        const g = form.group.trim()
        if (g) addWatchGroup(g)
        updateWatchlistStock(stock.id, { group: g })
        setCustomGroups(getWatchGroups())
      } else {
        removePortfolioStock(stock.id)
        const g = form.group.trim()
        if (g) addWatchGroup(g)
        addWatchlistStock({ ticker: stock.ticker, market: stock.market, group: g })
        setCustomGroups(getWatchGroups())
      }
    }
    setEditCard(null); reload()
  }

  function handleEditDelete() {
    if (editCard.type === 'portfolio') removePortfolioStock(editCard.stock.id)
    else removeWatchlistStock(editCard.stock.id)
    setEditCard(null); reload()
  }

  return (
    <div className="widget w-stocks" onClick={onExpand}>
      <div className="wlabel"><span className="ind" />&nbsp;주식</div>

      <div className="stabs" onClick={e => e.stopPropagation()}>
        {TABS.map(t => (
          <div key={t} className={`stab${tab === t ? ' on' : ''}`} onClick={() => { setTab(t); setWGroup('전체') }}>{t}</div>
        ))}
        <div className="portfolio-summary">
          <span className="market-badge">정규장</span>
          {filteredP.length > 0 && (
            <span className={`port-gain ${totalGain >= 0 ? 'up' : 'dn'}`}>
              {totalGain >= 0 ? '+' : '-'}{fmtT(Math.abs(totalGain), tab)}
            </span>
          )}
        </div>
      </div>

      {/* ── 보유 ── */}
      <div className="s-section port-section" onClick={e => e.stopPropagation()}>
        <div className="s-section-hd">
          <span>보유</span>
          <span className="s-add-btn" onClick={() => setShowAdd('portfolio')}>+ 추가</span>
        </div>
        <div className="port-scroll">
          <div className="port-row">
            {filteredP.length === 0
              ? <div className="scard-empty">보유 종목을 추가해보세요</div>
              : filteredP.map(s => {
                  const q       = quotes[s.ticker]
                  const gainAmt = q ? (q.price - s.buyPrice) * s.shares : null
                  const gainPct = q ? (q.price - s.buyPrice) / s.buyPrice * 100 : null
                  const isUp    = gainPct === null ? true : gainPct >= 0
                  return (
                    <div key={s.id} className={`scard port-card ${isUp ? 'up-card' : 'dn-card'}`}
                      onClick={e => { e.stopPropagation(); openEdit('portfolio', s) }}>
                      <div className="scard-inner">
                        <div className="scard-left">
                          <div className="scard-top">
                            <div className="sname">{dtick(s.ticker)}</div>
                            <div className="sshares">{s.shares}주</div>
                          </div>
                          <div className="scard-quad">
                            <div className="squad-left">
                              <div className="squad-row">
                                <span className="slabel">Price</span>
                                <span className="sprice-bold">{q ? fmtP(q.price, tab) : '···'}</span>
                              </div>
                              <div className="squad-row">
                                <span className="slabel">Value</span>
                                <span className="stotal-dim">{q ? fmtT(q.price * s.shares, tab) : '···'}</span>
                              </div>
                            </div>
                            {gainAmt !== null && (
                              <div className="scard-gain-stack">
                                <span className={`sgain-amt ${isUp ? 'up' : 'dn'}`}>{isUp ? '+' : '-'}{fmtT(Math.abs(gainAmt), tab)}</span>
                                {gainPct !== null && <span className={`sgain-pct ${isUp ? 'up' : 'dn'}`}>{isUp ? '+' : ''}{gainPct.toFixed(1)}%</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        {q?.weekBuy && (
                          <div className="scard-signals">
                            <span className="signal-buy">매수 {fmtT(q.weekBuy, tab)}</span>
                            <span className="signal-sell">매도 {fmtT(q.weekSell, tab)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
            }
          </div>
        </div>
      </div>

      <div className="s-divider" />


      {/* ── 관심 ── */}
      <div className="s-section watch-section" onClick={e => e.stopPropagation()}>
        <div className="s-section-hd">
          <span>관심</span>
          <span className="s-add-btn" onClick={() => setShowAdd('watch')}>+ 추가</span>
        </div>
        <div className="watch-body">
          <div className="wgroup-panel">
            {wGroups.map(g => (
              <div key={g} className={`wgroup-item${wGroup === g ? ' on' : ''}`} onClick={() => setWGroup(g)}>{g}</div>
            ))}
            <div className="wgroup-spacer" />
            {addingGroup
              ? <form className="wgroup-add-form" onSubmit={handleAddGroup}>
                  <input className="wgroup-add-input" autoFocus placeholder="그룹명"
                    value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                    onBlur={() => { setAddingGroup(false); setNewGroupName('') }} />
                </form>
              : <div className="wgroup-add-btn" onClick={() => setAddingGroup(true)}>+</div>
            }
          </div>
          <div className="wgroup-divider" />
          <div className="watch-scroll">
            <div className="watch-row">
              {filteredW.length === 0
                ? <div className="scard-empty">종목을 추가해보세요</div>
                : filteredW.map(s => {
                    const q      = quotes[s.ticker]
                    const weekUp = q ? q.weekChgPct >= 0 : true
                    const isUp   = weekUp
                    const chgVal = q ? `${weekUp ? '+' : ''}${q.weekChgPct}%` : '-'
                    return (
                      <div key={s.id} className={`scard watch-card ${isUp ? 'up-card' : 'dn-card'}`}
                        onClick={e => { e.stopPropagation(); openEdit('watchlist', s) }}>
                        <div className="watch-card-top">
                          <div className="scard-top">
                            <div className="sname">{dtick(s.ticker)}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <div className={`sgain-pct ${isUp ? 'up' : 'dn'}`}>{chgVal}</div>
                              {q && <div className="watch-label">전주 대비</div>}
                            </div>
                          </div>
                          <div className="sprice">{q ? fmtP(q.price, tab) : '···'}</div>
                        </div>
                        <div className="spark-wrap">
                          {[
                            ['주봉', q?.weekPts, q?.weekEx],
                            ['월봉', q?.monthPts, q?.monthEx]
                          ].map(([label, pts, ex]) =>
                            pts ? (
                              <div key={label} className="spark-section">
                                <span className="spark-label">{label}</span>
                                <div className="spark-chart">
                                  <svg className="spark" viewBox="0 0 80 24" preserveAspectRatio="none">
                                    <polygon points={`${pts} ${ex[0]},26 0,26`} fill={`${isUp ? 'rgba(74,222,128,' : 'rgba(248,113,113,'}0.08)`} />
                                    <polyline points={pts} fill="none" stroke={`${isUp ? 'rgba(74,222,128,' : 'rgba(248,113,113,'}0.8)`} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                                    <circle cx={ex[0]} cy={ex[1]} r="1.2" fill={`${isUp ? 'rgba(74,222,128,' : 'rgba(248,113,113,'}0.9)`} vectorEffect="non-scaling-stroke" />
                                  </svg>
                                </div>
                              </div>
                            ) : null
                          )}
                        </div>
                        {q?.weekBuy && (
                          <div className="watch-signals">
                            <span className="signal-buy">매수 {fmtT(q.weekBuy, tab)}</span>
                            <span className="signal-sell">매도 {fmtT(q.weekSell, tab)}</span>
                          </div>
                        )}
                      </div>
                    )
                  })
              }
            </div>
          </div>
        </div>
      </div>

      {/* ── 보유 추가 모달 ── */}
      {showAdd === 'portfolio' && (
        <div className="smodal-overlay" onClick={e => { e.stopPropagation(); setShowAdd(null) }}>
          <div className="smodal" onClick={e => e.stopPropagation()}>
            <div className="smodal-hd">보유 종목 추가</div>
            <form onSubmit={handleAddP}>
              <div className="smodal-row"><label>시장</label>
                <div className="smodal-tabs">{TABS.map(t => <div key={t} className={`smodal-tab${pForm.market===t?' on':''}`} onClick={()=>setPForm(f=>({...f,market:t}))}>{t}</div>)}</div>
              </div>
              <div className="smodal-row"><label>티커</label>
                <input placeholder={pForm.market==='미국'?'AAPL, NVDA…':'005930…'} value={pForm.ticker} onChange={e=>setPForm(f=>({...f,ticker:e.target.value}))} required />
              </div>
              <div className="smodal-row"><label>수량</label>
                <input type="number" min="0" step="any" placeholder="보유 주식 수" value={pForm.shares} onChange={e=>setPForm(f=>({...f,shares:e.target.value}))} required />
              </div>
              <div className="smodal-row"><label>매수가</label>
                <input type="number" min="0" step="any" placeholder="1주당 매수 가격" value={pForm.buyPrice} onChange={e=>setPForm(f=>({...f,buyPrice:e.target.value}))} required />
              </div>
              <div className="smodal-row"><label>매수일</label>
                <input type="date" value={pForm.buyDate} onChange={e=>setPForm(f=>({...f,buyDate:e.target.value}))} required />
              </div>
              <div className="smodal-btns">
                <button type="button" className="smodal-cancel" onClick={()=>setShowAdd(null)}>취소</button>
                <button type="submit" className="smodal-confirm">추가</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 관심 추가 모달 ── */}
      {showAdd === 'watch' && (
        <div className="smodal-overlay" onClick={e => { e.stopPropagation(); setShowAdd(null) }}>
          <div className="smodal" onClick={e => e.stopPropagation()}>
            <div className="smodal-hd">관심 종목 추가</div>
            <form onSubmit={handleAddW}>
              <div className="smodal-row"><label>시장</label>
                <div className="smodal-tabs">{TABS.map(t => <div key={t} className={`smodal-tab${wForm.market===t?' on':''}`} onClick={()=>setWForm(f=>({...f,market:t}))}>{t}</div>)}</div>
              </div>
              <div className="smodal-row"><label>티커</label>
                <input placeholder={wForm.market==='미국'?'AAPL, NVDA…':'005930…'} value={wForm.ticker} onChange={e=>setWForm(f=>({...f,ticker:e.target.value}))} required />
              </div>
              <div className="smodal-row"><label>그룹</label>
                <input placeholder="반도체, 미래…" value={wForm.group} onChange={e=>setWForm(f=>({...f,group:e.target.value}))} list="wgroup-list" />
                <datalist id="wgroup-list">
                  {wGroups.filter(g => g !== '전체').map(g => <option key={g} value={g} />)}
                </datalist>
              </div>
              <div className="smodal-btns">
                <button type="button" className="smodal-cancel" onClick={()=>setShowAdd(null)}>취소</button>
                <button type="submit" className="smodal-confirm">추가</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 편집 모달 ── */}
      {editCard && (
        <div className="smodal-overlay" onClick={e => { e.stopPropagation(); setEditCard(null) }}>
          <div className="smodal" onClick={e => e.stopPropagation()}>
            <div className="smodal-hd">{dtick(editCard.stock.ticker)}</div>
            <div className="smodal-row"><label>유형</label>
              <div className="smodal-tabs">
                {['보유', '관심'].map(m => (
                  <div key={m} className={`smodal-tab${editCard.form.mode === m ? ' on' : ''}`}
                    onClick={() => setEditCard(c => ({ ...c, form: { ...c.form, mode: m } }))}>{m}</div>
                ))}
              </div>
            </div>
            {editCard.form.mode === '보유' ? (
              <>
                <div className="smodal-row"><label>수량</label>
                  <input type="number" min="0" step="any" placeholder="보유 주식 수"
                    value={editCard.form.shares} onChange={e => setEditCard(c => ({ ...c, form: { ...c.form, shares: e.target.value } }))} />
                </div>
                <div className="smodal-row"><label>매수가</label>
                  <input type="number" min="0" step="any" placeholder="1주당 매수 가격"
                    value={editCard.form.buyPrice} onChange={e => setEditCard(c => ({ ...c, form: { ...c.form, buyPrice: e.target.value } }))} />
                </div>
                <div className="smodal-row"><label>매수일</label>
                  <input type="date" value={editCard.form.buyDate}
                    onChange={e => setEditCard(c => ({ ...c, form: { ...c.form, buyDate: e.target.value } }))} />
                </div>
              </>
            ) : (
              <div className="smodal-row"><label>그룹</label>
                <input placeholder="반도체, 미래…" value={editCard.form.group}
                  onChange={e => setEditCard(c => ({ ...c, form: { ...c.form, group: e.target.value } }))}
                  list="wgroup-list2" />
                <datalist id="wgroup-list2">
                  {wGroups.filter(g => g !== '전체').map(g => <option key={g} value={g} />)}
                </datalist>
              </div>
            )}
            <div className="smodal-btns">
              <button type="button" className="smodal-delete" onClick={handleEditDelete}>삭제</button>
              <button type="button" className="smodal-cancel" onClick={() => setEditCard(null)}>취소</button>
              <button type="button" className="smodal-confirm" onClick={handleEditSave}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
