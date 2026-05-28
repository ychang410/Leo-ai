import { useState, useEffect } from 'react'
import { format, getDaysInMonth, startOfMonth, getDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { getEventsForDate, getTodos, toggleTodo, todayStr } from '../../store/index.js'

export default function CalendarWidget({ onExpand }) {
  const [events, setEvents] = useState([])
  const [todos,  setTodos]  = useState([])

  const todayDate = new Date()
  const today     = todayStr()
  const todayFmt  = format(todayDate, 'MM.dd · eee', { locale: ko })
  const year      = todayDate.getFullYear()
  const month     = todayDate.getMonth()
  const todayDay  = todayDate.getDate()
  const daysInMonth    = getDaysInMonth(todayDate)
  const firstDayOfWeek = getDay(startOfMonth(todayDate))

  const days = []
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  function reload() {
    const evs = getEventsForDate(today)
    evs.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))
    setEvents(evs)
    setTodos(getTodos())
  }
  useEffect(() => { reload() }, [])

  return (
    <div className="widget w-calendar" onClick={onExpand}>
      <div className="wlabel"><span className="ind" />&nbsp;캘린더 &amp; 할 일</div>
      <div className="cal-inner">

        {/* 왼쪽: 미니 달력 + 할 일 */}
        <div className="cal-left-col">
          <div className="cal-q">
            <div className="cal-month-nav">
              <h3>{year}년 {month + 1}월</h3>
            </div>
            <div className="cal-dows">
              {['일','월','화','수','목','금','토'].map((d, i) => (
                <span key={d} style={{ color: i === 0 ? '#FF8080' : i === 6 ? 'var(--accent)' : undefined }}>{d}</span>
              ))}
            </div>
            <div className="cal-days" style={{ flex: 1 }}>
              {days.map((d, i) => (
                <div
                  key={i}
                  className={`cday${d === todayDay ? ' today' : ''}`}
                  style={{ color: d && (i % 7 === 0) && d !== todayDay ? '#FF8080' : undefined }}
                  onClick={e => e.stopPropagation()}
                >
                  {d ?? ''}
                </div>
              ))}
            </div>
          </div>

          <div className="cal-q full" onClick={e => e.stopPropagation()}>
            <div className="sec-t" style={{ marginTop: 0, marginBottom: '6px' }}>할 일</div>
            <div className="cal-q-scroll">
              <div className="todo-list">
                {todos.length === 0
                  ? <p style={{ fontSize: '10px', color: 'var(--text-dim)', padding: '4px 0' }}>할 일이 없어요</p>
                  : todos.map(t => (
                    <div
                      key={t.id}
                      className="titem"
                      onClick={e => { e.stopPropagation(); toggleTodo(t.id); reload() }}
                    >
                      <div className={`tcheck${t.done ? ' done' : ''}`} />
                      <span className={`ttxt${t.done ? ' done' : ''}`}>{t.text}</span>
                      <span className={`ttag${t.category === 'work' ? ' work' : ''}`}>
                        {t.category === 'work' ? '업무' : '개인'}
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 오늘 일정 */}
        <div className="cal-q full" onClick={e => e.stopPropagation()}>
          <div className="today-hd">
            <h4>오늘</h4>
            <div className="tdate">{todayFmt}</div>
          </div>
          <div className="cal-q-scroll">
            {events.length === 0
              ? <p style={{ fontSize: '10px', color: 'var(--text-dim)', padding: '4px 0' }}>오늘 일정이 없어요</p>
              : (
                <div className="ev-list">
                  {events.map(ev => (
                    <div key={ev.id} className="ev-item">
                      <div className={`ev-bar${ev.category === 'work' ? ' work' : ''}`} />
                      <div>
                        <div className="ev-title">{ev.title}</div>
                        {ev.time && <div className="ev-time">{ev.time}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </div>

      </div>
    </div>
  )
}
