import { useState, useEffect, useRef } from 'react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react'
import { getEvents, addEvent, deleteEvent } from '../store/index.js'

export default function Calendar({ refreshKey }) {
  const [current,  setCurrent]  = useState(new Date())
  const [events,   setEvents]   = useState([])
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState({ title: '', category: 'personal', note: '' })
  const timeRef = useRef(null)

  function reload() { setEvents(getEvents()) }
  useEffect(() => { reload() }, [refreshKey])

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(current), { weekStartsOn: 0 }),
    end:   endOfWeek(endOfMonth(current),     { weekStartsOn: 0 }),
  })

  function eventsForDay(day) {
    const ds = format(day, 'yyyy-MM-dd')
    return events.filter(e => e.date === ds).sort((a, b) => (a.time || '').localeCompare(b.time || ''))
  }

  function handleAddEvent(e) {
    e.preventDefault()
    if (!form.title.trim() || !selected) return
    addEvent({ ...form, time: timeRef.current?.value || '', date: format(selected, 'yyyy-MM-dd') })
    setForm({ title: '', category: 'personal', note: '' })
    if (timeRef.current) timeRef.current.value = ''
    setShowForm(false)
    reload()
  }

  const selectedEvents = selected ? eventsForDay(selected) : []

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex gap-6">
        {/* 캘린더 그리드 */}
        <div className="flex-1">
          {/* 월 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>
              {format(current, 'yyyy년 M월', { locale: ko })}
            </h2>
            <div className="flex gap-1.5">
              {[
                { label: <ChevronLeft size={15} />, action: () => setCurrent(subMonths(current, 1)) },
                { label: '오늘', action: () => setCurrent(new Date()) },
                { label: <ChevronRight size={15} />, action: () => setCurrent(addMonths(current, 1)) },
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.action}
                  className="px-2.5 h-8 rounded-xl border text-xs font-medium flex items-center justify-center transition-opacity hover:opacity-100 opacity-70"
                  style={{ borderColor: 'var(--accent-border)', color: 'var(--text-sub)', background: 'var(--bg-card)' }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 mb-1">
            {['일','월','화','수','목','금','토'].map((d, i) => (
              <div
                key={d}
                className="text-center text-xs font-medium py-2"
                style={{ color: i === 0 ? '#FF8080' : i === 6 ? 'var(--accent)' : 'var(--text-dim)' }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-0.5">
            {days.map(day => {
              const dayEvents = eventsForDay(day)
              const inMonth   = isSameMonth(day, current)
              const isT       = isToday(day)
              const isSel     = selected && isSameDay(day, selected)
              const dow       = day.getDay()

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => { setSelected(day); setShowForm(false) }}
                  className="min-h-[76px] p-1.5 rounded-xl cursor-pointer transition-all border"
                  style={{
                    opacity:     inMonth ? 1 : 0.25,
                    borderColor: isSel ? 'var(--accent-border)' : 'transparent',
                    background:  isSel ? 'var(--accent-dim)' : 'transparent',
                  }}
                >
                  <div
                    className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1"
                    style={{
                      background:  isT ? 'var(--accent)' : 'transparent',
                      color:       isT ? 'var(--bg-app)'
                                 : dow === 0 ? '#FF8080'
                                 : dow === 6 ? 'var(--accent)'
                                 : 'var(--text-sub)',
                      fontFamily: "'Space Mono', monospace",
                      boxShadow:  isT ? '0 0 8px var(--accent-glow)' : 'none',
                    }}
                  >
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map(ev => (
                      <div key={ev.id} className="flex items-center gap-1">
                        <span
                          className="w-1 h-1 rounded-full flex-shrink-0"
                          style={{
                            background: ev.category === 'work' ? 'var(--ok-color)' : 'var(--accent)',
                          }}
                        />
                        <span className="text-[10px] truncate" style={{ color: 'var(--text-dim)' }}>
                          {ev.title}
                        </span>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className="text-[9px]" style={{ color: 'var(--text-dim)' }}>+{dayEvents.length - 2}개</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 선택 날짜 패널 */}
        {selected && (
          <div className="w-60 flex-shrink-0">
            <div
              className="rounded-2xl border p-4 sticky top-8"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--accent-border)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{format(selected, 'M월 d일', { locale: ko })}</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>{format(selected, 'EEEE', { locale: ko })}</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setShowForm(v => !v)}
                    className="w-7 h-7 rounded-lg border flex items-center justify-center"
                    style={{ background: 'var(--accent-dim)', borderColor: 'var(--accent-border)', color: 'var(--accent)' }}
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => setSelected(null)}
                    className="w-7 h-7 rounded-lg border flex items-center justify-center"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--accent-border)', color: 'var(--text-dim)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {showForm && (
                <form onSubmit={handleAddEvent} className="mb-4 space-y-2">
                  {[
                    { placeholder: '일정 제목', key: 'title' },
                  ].map(f => (
                    <input
                      key={f.key}
                      className="w-full text-sm px-3 py-2 rounded-xl border outline-none"
                      placeholder={f.placeholder}
                      value={form[f.key]}
                      onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                      autoFocus={f.key === 'title'}
                      style={{ background: 'var(--bg-input)', color: 'var(--text-main)', borderColor: 'var(--accent-border)' }}
                    />
                  ))}
                  <input
                    type="text"
                    ref={timeRef}
                    placeholder="13:35"
                    className="w-full text-sm px-3 py-2 rounded-xl border outline-none"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-main)', borderColor: 'var(--accent-border)' }}
                  />
                  <select
                    className="w-full text-sm px-3 py-2 rounded-xl border outline-none"
                    value={form.category}
                    onChange={e => setForm(v => ({ ...v, category: e.target.value }))}
                    style={{ background: 'var(--bg-input)', color: 'var(--text-main)', borderColor: 'var(--accent-border)' }}
                  >
                    <option value="personal">개인</option>
                    <option value="work">업무</option>
                  </select>
                  <textarea
                    className="w-full text-sm px-3 py-2 rounded-xl border outline-none resize-none"
                    placeholder="메모 (선택)"
                    rows={2}
                    value={form.note}
                    onChange={e => setForm(v => ({ ...v, note: e.target.value }))}
                    style={{ background: 'var(--bg-input)', color: 'var(--text-main)', borderColor: 'var(--accent-border)' }}
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 text-xs py-1.5 rounded-xl"
                      style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
                    >추가</button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 text-xs py-1.5 rounded-xl"
                      style={{ background: 'var(--bg-input)', color: 'var(--text-dim)', border: '1px solid var(--accent-border)' }}
                    >취소</button>
                  </div>
                </form>
              )}

              {selectedEvents.length === 0
                ? <p className="text-sm text-center py-5" style={{ color: 'var(--text-dim)' }}>일정이 없어요</p>
                : (
                  <ul className="space-y-2">
                    {selectedEvents.map(ev => (
                      <li
                        key={ev.id}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl border group"
                        style={{ background: 'var(--accent-dim)', borderColor: 'var(--accent-border)' }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                          style={{ background: ev.category === 'work' ? 'var(--ok-color)' : 'var(--accent)' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm" style={{ color: 'var(--text-main)' }}>{ev.title}</p>
                          {ev.time && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)', fontFamily: "'Space Mono', monospace" }}>
                              {ev.time}
                            </p>
                          )}
                          {ev.note && <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-dim)' }}>{ev.note}</p>}
                        </div>
                        <button
                          onClick={() => { deleteEvent(ev.id); reload() }}
                          className="opacity-0 group-hover:opacity-60 hover:!opacity-100 flex-shrink-0"
                          style={{ color: 'var(--text-sub)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )
              }
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
