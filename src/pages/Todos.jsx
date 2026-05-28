import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, Trash2, Plus } from 'lucide-react'
import { getTodos, addTodo, toggleTodo, deleteTodo } from '../store/index.js'

const FILTERS = ['전체', '업무', '개인', '완료']

export default function Todos({ refreshKey }) {
  const [todos,    setTodos]    = useState([])
  const [filter,   setFilter]   = useState('전체')
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState({ text: '', category: 'personal', dueDate: '' })

  function reload() { setTodos(getTodos()) }
  useEffect(() => { reload() }, [refreshKey])

  function handleAdd(e) {
    e.preventDefault()
    if (!form.text.trim()) return
    addTodo(form)
    setForm({ text: '', category: 'personal', dueDate: '' })
    setShowForm(false)
    reload()
  }

  const filtered = todos.filter(t => {
    if (filter === '업무') return t.category === 'work'    && !t.done
    if (filter === '개인') return t.category === 'personal' && !t.done
    if (filter === '완료') return t.done
    return true
  })

  const pending = todos.filter(t => !t.done).length
  const done    = todos.filter(t =>  t.done).length

  return (
    <div className="max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>할 일</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
            남은 할 일 {pending}개 · 완료 {done}개
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-90 border"
          style={{ background: 'var(--accent-dim)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}
        >
          <Plus size={15} />
          추가
        </button>
      </div>

      {/* 추가 폼 */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mb-6 p-4 rounded-2xl border space-y-3"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--accent-border)' }}
        >
          <input
            className="w-full text-sm px-3 py-2.5 rounded-xl border outline-none"
            placeholder="할 일을 입력하세요"
            value={form.text}
            onChange={e => setForm(v => ({ ...v, text: e.target.value }))}
            autoFocus
            style={{ background: 'var(--bg-input)', color: 'var(--text-main)', borderColor: 'var(--accent-border)' }}
          />
          <div className="flex gap-3">
            {[
              {
                el: 'select',
                value: form.category,
                onChange: e => setForm(v => ({ ...v, category: e.target.value })),
                children: [<option key="p" value="personal">개인</option>, <option key="w" value="work">업무</option>],
              },
            ].map((_, i) => (
              <select
                key={i}
                className="flex-1 text-sm px-3 py-2.5 rounded-xl border outline-none"
                value={form.category}
                onChange={e => setForm(v => ({ ...v, category: e.target.value }))}
                style={{ background: 'var(--bg-input)', color: 'var(--text-main)', borderColor: 'var(--accent-border)' }}
              >
                <option value="personal">개인</option>
                <option value="work">업무</option>
              </select>
            ))}
            <input
              type="date"
              className="flex-1 text-sm px-3 py-2.5 rounded-xl border outline-none"
              value={form.dueDate}
              onChange={e => setForm(v => ({ ...v, dueDate: e.target.value }))}
              style={{ background: 'var(--bg-input)', color: 'var(--text-main)', borderColor: 'var(--accent-border)' }}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 text-sm py-2 rounded-xl"
              style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
            >추가</button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 text-sm py-2 rounded-xl"
              style={{ background: 'var(--bg-input)', color: 'var(--text-dim)', border: '1px solid var(--accent-border)' }}
            >취소</button>
          </div>
        </form>
      )}

      {/* 필터 */}
      <div className="flex gap-2 mb-4">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all border"
            style={
              filter === f
                ? { background: 'var(--accent-dim)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }
                : { background: 'var(--bg-card)', color: 'var(--text-dim)', borderColor: 'var(--accent-border)' }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-dim)' }}>
          <CheckCircle2 size={36} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">{filter === '완료' ? '완료된 항목이 없어요' : '할 일이 없어요'}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map(todo => (
            <li
              key={todo.id}
              className="flex items-center gap-3 p-4 rounded-2xl border group"
              style={{
                background:  'var(--bg-card)',
                borderColor: 'var(--accent-border)',
                opacity:     todo.done ? 0.6 : 1,
              }}
            >
              <button
                onClick={() => { toggleTodo(todo.id); reload() }}
                className="flex-shrink-0 transition-opacity hover:opacity-100"
                style={{ opacity: 0.7 }}
              >
                {todo.done
                  ? <CheckCircle2 size={20} style={{ color: 'var(--ok-color)' }} />
                  : <Circle       size={20} style={{ color: 'var(--accent-border)' }} />
                }
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium"
                  style={{
                    color:          todo.done ? 'var(--text-dim)' : 'var(--text-main)',
                    textDecoration: todo.done ? 'line-through' : 'none',
                  }}
                >
                  {todo.text}
                </p>
                {todo.dueDate && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>마감 {todo.dueDate}</p>
                )}
              </div>

              <span
                className="text-[10px] px-2 py-0.5 rounded-lg border flex-shrink-0"
                style={{
                  color:       todo.category === 'work' ? 'var(--ok-color)' : 'var(--accent)',
                  borderColor: todo.category === 'work' ? 'var(--ok-glow)'  : 'var(--accent-border)',
                  background:  'var(--accent-dim)',
                }}
              >
                {todo.category === 'work' ? '업무' : '개인'}
              </span>

              <button
                onClick={() => { deleteTodo(todo.id); reload() }}
                className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity flex-shrink-0"
                style={{ color: 'var(--text-sub)' }}
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
