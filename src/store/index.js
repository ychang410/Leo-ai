import { format } from 'date-fns'

const EVENTS_KEY = 'planner_events'
const TODOS_KEY = 'planner_todos'

function load(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// ─── Events ─────────────────────────────────────────────
export function getEvents() {
  return load(EVENTS_KEY)
}

export function getEventsForDate(dateStr) {
  return load(EVENTS_KEY).filter(e => e.date === dateStr)
}

export function addEvent({ title, date, time = '', category = 'personal', note = '' }) {
  const events = load(EVENTS_KEY)
  const newEvent = { id: genId(), title, date, time, category, note, createdAt: new Date().toISOString() }
  save(EVENTS_KEY, [...events, newEvent])
  return newEvent
}

export function updateEvent(id, patch) {
  const events = load(EVENTS_KEY).map(e => e.id === id ? { ...e, ...patch } : e)
  save(EVENTS_KEY, events)
}

export function deleteEvent(id) {
  save(EVENTS_KEY, load(EVENTS_KEY).filter(e => e.id !== id))
}

// ─── Todos ───────────────────────────────────────────────
export function getTodos() {
  return load(TODOS_KEY)
}

export function addTodo({ text, category = 'personal', dueDate = '' }) {
  const todos = load(TODOS_KEY)
  const newTodo = { id: genId(), text, category, dueDate, done: false, createdAt: new Date().toISOString() }
  save(TODOS_KEY, [...todos, newTodo])
  return newTodo
}

export function toggleTodo(id) {
  const todos = load(TODOS_KEY).map(t => t.id === id ? { ...t, done: !t.done } : t)
  save(TODOS_KEY, todos)
}

export function deleteTodo(id) {
  save(TODOS_KEY, load(TODOS_KEY).filter(t => t.id !== id))
}

export function updateTodo(id, patch) {
  const todos = load(TODOS_KEY).map(t => t.id === id ? { ...t, ...patch } : t)
  save(TODOS_KEY, todos)
}

// ─── Helpers ─────────────────────────────────────────────
export function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function formatDateStr(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`
}
