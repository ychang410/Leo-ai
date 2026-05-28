import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  getEvents, getTodos,
  addEvent, addTodo, toggleTodo, deleteEvent, deleteTodo,
  todayStr,
} from '../store/index.js'

const SYSTEM_PROMPT = `당신은 사용자의 개인 AI 비서입니다. 한국어로 간결하게 답변하세요. 한두 문장으로 자연스럽게 말해주세요.

현재 날짜: ${format(new Date(), 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
오늘: ${todayStr()}

응답에 다음 JSON 명령어를 포함할 수 있습니다 (마크다운 코드블록 없이):
일정 추가: {"action":"add_event","title":"제목","date":"YYYY-MM-DD","time":"HH:MM","category":"work|personal"}
할일 추가: {"action":"add_todo","text":"내용","category":"work|personal"}
할일 완료: {"action":"toggle_todo","id":"id값"}
삭제: {"action":"delete_event","id":"id값"} 또는 {"action":"delete_todo","id":"id값"}`

export default function AISidebar() {
  const [response, setResponse] = useState('안녕하세요, 연수님.\n무엇이든 물어보세요.')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(false)
  const cosmosRef = useRef(null)

  useEffect(() => {
    const cosmos = cosmosRef.current
    if (!cosmos) return
    for (let i = 0; i < 36; i++) {
      const s = document.createElement('div')
      s.className = 'ai-star'
      const sz = Math.random() * 1.6 + 0.4
      s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${1.8+Math.random()*3}s;--delay:-${Math.random()*4}s;`
      cosmos.appendChild(s)
    }
  }, [])

  function extractAndRun(text) {
    const pattern = /\{"action"[^}]+\}/g
    const matches = text.match(pattern) || []
    for (const raw of matches) {
      try {
        const cmd = JSON.parse(raw)
        if      (cmd.action === 'add_event')    addEvent({ title: cmd.title, date: cmd.date, time: cmd.time || '', category: cmd.category || 'personal' })
        else if (cmd.action === 'add_todo')     addTodo({ text: cmd.text, category: cmd.category || 'personal' })
        else if (cmd.action === 'toggle_todo')  toggleTodo(cmd.id)
        else if (cmd.action === 'delete_event') deleteEvent(cmd.id)
        else if (cmd.action === 'delete_todo')  deleteTodo(cmd.id)
      } catch {}
    }
    return text.replace(pattern, '').replace(/\n{3,}/g, '\n\n').trim()
  }

  async function sendAI() {
    const msg = input.trim()
    if (!msg || loading) return
    setInput('')
    setLoading(true)
    setActive(false)
    setResponse('···')

    const today = todayStr()
    const todayEvents  = getEvents().filter(e => e.date === today)
    const pendingTodos = getTodos().filter(t => !t.done).slice(0, 10)
    const context = `\n[데이터] 오늘 일정: ${JSON.stringify(todayEvents)}, 미완료 할일: ${JSON.stringify(pendingTodos)}`

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: msg + context }],
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const raw  = data.content?.[0]?.text || '응답을 받지 못했어요.'
      setResponse(extractAndRun(raw))
      setActive(true)
    } catch (err) {
      setResponse(`오류: ${err.message}\n\nnpm run server 를 먼저 실행해주세요.`)
      setActive(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-sidebar">
      <div className="ai-sidebar-hd">
        <div className="ai-dot" />
        <div className="ai-title">AI 비서 ✦</div>
      </div>

      <div className="ai-cosmos" ref={cosmosRef}>
        <div className="ai-orb">
          <div className="orb-ring r1" />
          <div className="orb-ring r2" />
          <div className="orb-ring r3" />
          <div className="orb-core">✦</div>
        </div>
        <div className={`ai-response ${active ? 'active' : ''}`}>
          {response}
        </div>
      </div>

      <div className="ai-inp">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendAI()}
          placeholder="무엇이든 물어보세요..."
        />
        <div className="ai-send" onClick={sendAI}>↑</div>
      </div>
    </div>
  )
}
