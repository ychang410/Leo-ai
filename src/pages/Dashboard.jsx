import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CheckCircle2, Circle, Trash2 } from 'lucide-react'
import {
  getEventsForDate, addEvent, deleteEvent,
  getTodos, addTodo, toggleTodo, deleteTodo,
  todayStr,
} from '../store/index.js'

export default function Dashboard({ refreshKey }) {
  const today = todayStr()
  const [events, setEvents] = useState([])
  const [todos,  setTodos]  = useState([])
  const [showEventForm, setShowEventForm] = useState(false)
  const [showTodoForm,  setShowTodoForm]  = useState(false)
  const [eventForm, setEventForm] = useState({ title: '', category: 'personal' })
  const [todoForm,  setTodoForm]  = useState({ text:  '', category: 'personal' })
  const timeRef = useRef(null)

  function reload() {
    const ev = getEventsForDate(today)
    ev.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))
    setEvents(ev)
    setTodos(getTodos())
  }

  useEffect(() => { reload() }, [refreshKey])

  function handleAddEvent(e) {
    e.preventDefault()
    if (!eventForm.title.trim()) return
    addEvent({ ...eventForm, time: timeRef.current?.value || '', date: today })
    setEventForm({ title: '', category: 'personal' })
    if (timeRef.current) timeRef.current.value = ''
    setShowEventForm(false)
    reload()
  }

  function handleAddTodo(e) {
    e.preventDefault()
    if (!todoForm.text.trim()) return
    addTodo(todoForm)
    setTodoForm({ text: '', category: 'personal' })
    setShowTodoForm(false)
    reload()
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 6)  return '좋은 새벽이에요'
    if (h < 12) return '좋은 아침이에요'
    if (h < 18) return '좋은 오후에요'
    return '좋은 저녁이에요'
  }

  const pendingTodos = todos.filter(t => !t.done)
  const doneTodos    = todos.filter(t =>  t.done)

  return (
    <div className="max-w-3xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>
          {greeting()} ✦
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-dim)' }}>
          {format(new Date(), 'yyyy년 M월 d일 EEEE', { locale: ko })}
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="오늘 일정"   value={events.length}        />
        <StatCard label="할 일 남음"  value={pendingTodos.length}  />
        <StatCard label="완료"        value={doneTodos.length} ok  />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 오늘 일정 */}
        <NightCard title="오늘 일정" onAdd={() => setShowEventForm(v => !v)}>
          {showEventForm && (
            <form onSubmit={handleAddEvent} className="mb-4 space-y-2">
              <NightInput
                placeholder="일정 제목"
                value={eventForm.title}
                onChange={e => setEventForm(v => ({ ...v, title: e.target.value }))}
                autoFocus
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  ref={timeRef}
                  placeholder="13:35"
                  className="flex-1 text-sm px-3 py-2 rounded-xl border outline-none transition-colors"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-main)', borderColor: 'var(--accent-border)' }}
                />
                <NightSelect value={eventForm.category} onChange={e => setEventForm(v => ({ ...v, category: e.target.value }))}>
                  <option value="personal">개인</option>
                  <option value="work">업무</option>
                </NightSelect>
              </div>
              <FormButtons onCancel={() => setShowEventForm(false)} />
            </form>
          )}
          {events.length === 0
            ? <Empty text="오늘 일정이 없어요" />
            : <ul className="space-y-2">
                {events.map(ev => (
                  <EventItem key={ev.id} ev={ev} onDelete={() => { deleteEvent(ev.id); reload() }} />
                ))}
              </ul>
          }
        </NightCard>

        {/* 할 일 */}
        <NightCard title="할 일" onAdd={() => setShowTodoForm(v => !v)}>
          {showTodoForm && (
            <form onSubmit={handleAddTodo} className="mb-4 space-y-2">
              <NightInput
                placeholder="할 일 내용"
                value={todoForm.text}
                onChange={e => setTodoForm(v => ({ ...v, text: e.target.value }))}
                autoFocus
              />
              <NightSelect value={todoForm.category} onChange={e => setTodoForm(v => ({ ...v, category: e.target.value }))}>
                <option value="personal">개인</option>
                <option value="work">업무</option>
              </NightSelect>
              <FormButtons onCancel={() => setShowTodoForm(false)} />
            </form>
          )}
          {pendingTodos.length === 0 && doneTodos.length === 0
            ? <Empty text="할 일이 없어요" />
            : <ul className="space-y-1">
                {[...pendingTodos, ...doneTodos].map(todo => (
                  <TodoItem
                    key={todo.id} todo={todo}
                    onToggle={() => { toggleTodo(todo.id); reload() }}
                    onDelete={() => { deleteTodo(todo.id); reload() }}
                  />
                ))}
              </ul>
          }
        </NightCard>
      </div>
    </div>
  )
}

/* ── 하위 컴포넌트 ── */

function StatCard({ label, value, ok }) {
  return (
    <div className="rounded-2xl p-4 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--accent-border)' }}>
      <p className="text-xs mb-2" style={{ color: 'var(--text-dim)' }}>{label}</p>
      <p
        className="text-3xl font-bold"
        style={{
          fontFamily: "'Space Mono', monospace",
          color:      ok ? 'var(--ok-color)' : 'var(--accent)',
          textShadow: ok ? '0 0 14px var(--ok-glow)' : '0 0 14px var(--accent-glow)',
        }}
      >
        {String(value).padStart(2, '0')}
        <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-dim)' }}>개</span>
      </p>
    </div>
  )
}

function NightCard({ title, onAdd, children }) {
  return (
    <div className="rounded-2xl p-5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--accent-border)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-sub)' }}>{title}</h3>
        <button
          onClick={onAdd}
          className="w-6 h-6 rounded-lg border flex items-center justify-center transition-opacity hover:opacity-100 opacity-60 text-sm"
          style={{ borderColor: 'var(--accent-border)', color: 'var(--accent)', background: 'var(--accent-dim)' }}
        >
          +
        </button>
      </div>
      {children}
    </div>
  )
}

function EventItem({ ev, onDelete }) {
  const isWork = ev.category === 'work'
  return (
    <li
      className="flex items-start gap-3 p-2.5 rounded-xl border group"
      style={{ background: 'var(--accent-dim)', borderColor: 'var(--accent-border)' }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
        style={{
          background: isWork ? 'var(--ok-color)' : 'var(--accent)',
          boxShadow:  isWork ? '0 0 5px var(--ok-glow)' : '0 0 5px var(--accent-glow)',
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate" style={{ color: 'var(--text-main)' }}>{ev.title}</p>
        {ev.time && <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)', fontFamily: "'Space Mono', monospace" }}>{ev.time}</p>}
      </div>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity flex-shrink-0"
        style={{ color: 'var(--text-sub)' }}
      >
        <Trash2 size={13} />
      </button>
    </li>
  )
}

function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <li className="flex items-center gap-2.5 py-1.5 px-1 group rounded-lg">
      <button onClick={onToggle} className="flex-shrink-0 transition-opacity hover:opacity-100" style={{ opacity: 0.7 }}>
        {todo.done
          ? <CheckCircle2 size={17} style={{ color: 'var(--ok-color)' }} />
          : <Circle      size={17} style={{ color: 'var(--accent-border)' }} />
        }
      </button>
      <span
        className="flex-1 text-sm"
        style={{ color: todo.done ? 'var(--text-dim)' : 'var(--text-sub)', textDecoration: todo.done ? 'line-through' : 'none' }}
      >
        {todo.text}
      </span>
      <span
        className="text-[10px] px-1.5 py-0.5 rounded border flex-shrink-0"
        style={{ color: todo.category === 'work' ? 'var(--ok-color)' : 'var(--accent)', borderColor: todo.category === 'work' ? 'var(--ok-glow)' : 'var(--accent-border)', background: 'var(--accent-dim)' }}
      >
        {todo.category === 'work' ? '업무' : '개인'}
      </span>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity flex-shrink-0"
        style={{ color: 'var(--text-sub)' }}
      >
        <Trash2 size={13} />
      </button>
    </li>
  )
}

function NightInput({ ...props }) {
  return (
    <input
      className="w-full text-sm px-3 py-2 rounded-xl border outline-none transition-colors"
      style={{ background: 'var(--bg-input)', color: 'var(--text-main)', borderColor: 'var(--accent-border)' }}
      {...props}
    />
  )
}

function NightSelect({ children, ...props }) {
  return (
    <select
      className="w-full text-sm px-3 py-2 rounded-xl border outline-none"
      style={{ background: 'var(--bg-input)', color: 'var(--text-main)', borderColor: 'var(--accent-border)' }}
      {...props}
    >
      {children}
    </select>
  )
}

function FormButtons({ onCancel }) {
  return (
    <div className="flex gap-2">
      <button
        type="submit"
        className="flex-1 text-sm py-1.5 rounded-xl font-medium transition-opacity hover:opacity-90"
        style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
      >
        추가
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 text-sm py-1.5 rounded-xl transition-opacity hover:opacity-90"
        style={{ background: 'var(--bg-input)', color: 'var(--text-dim)', border: '1px solid var(--accent-border)' }}
      >
        취소
      </button>
    </div>
  )
}

function Empty({ text }) {
  return <p className="text-sm text-center py-5" style={{ color: 'var(--text-dim)' }}>{text}</p>
}
