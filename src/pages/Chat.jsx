import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  getEvents, addEvent, deleteEvent,
  getTodos, addTodo, toggleTodo, deleteTodo,
  todayStr,
} from '../store/index.js'

const SYSTEM_PROMPT = `당신은 사용자의 개인 플래너 비서입니다. 한국어로 답변하세요. 친근하고 간결하게 말하되, 필요할 때만 설명하세요.

현재 날짜: ${format(new Date(), 'yyyy년 M월 d일 (EEEE)', { locale: ko })}

당신은 다음과 같은 일정/할일 관련 JSON 명령어를 출력할 수 있습니다.
사용자의 요청에 따라 필요한 경우 아래 형식의 JSON을 마크다운 코드블록 없이 응답에 포함하세요:

일정 추가: {"action":"add_event","title":"제목","date":"YYYY-MM-DD","time":"HH:MM","category":"work|personal","note":""}
할일 추가: {"action":"add_todo","text":"내용","category":"work|personal","dueDate":"YYYY-MM-DD"}
할일 완료: {"action":"toggle_todo","id":"id값"}
삭제: {"action":"delete_event","id":"id값"} 또는 {"action":"delete_todo","id":"id값"}
조회 요청: {"action":"query","type":"events_today|todos_pending|all_events"}

JSON이 있으면 자동으로 실행되고, 나머지 텍스트만 사용자에게 보여집니다.
date 필드는 항상 YYYY-MM-DD 형식으로, 상대적 날짜('내일', '다음주 월요일' 등)를 실제 날짜로 변환하세요.
오늘은 ${todayStr()}입니다.`

export default function Chat({ onDataChange }) {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: '안녕하세요! 저는 당신의 플래너 비서예요 ✦\n\n일정을 추가하거나, 오늘 할 일을 확인하거나, 자유롭게 말씀해주세요!\n\n예시:\n• "내일 오후 3시에 치과 추가해줘"\n• "이번 주 업무 일정 알려줘"\n• "장보기 할일 추가해줘"',
  }])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function buildContextData() {
    const today = todayStr()
    const todayEvents   = getEvents().filter(e => e.date === today)
    const upcomingEvents = getEvents().filter(e => e.date >= today).sort((a,b) => a.date.localeCompare(b.date)).slice(0, 10)
    const pendingTodos  = getTodos().filter(t => !t.done).slice(0, 20)
    return `\n[현재 데이터]\n오늘 일정: ${JSON.stringify(todayEvents)}\n예정 일정(최근 10개): ${JSON.stringify(upcomingEvents)}\n미완료 할일: ${JSON.stringify(pendingTodos)}`
  }

  function extractAndRun(text) {
    const pattern = /\{"action"[^}]+\}/g
    const matches = text.match(pattern) || []
    let changed = false
    for (const raw of matches) {
      try {
        const cmd = JSON.parse(raw)
        if      (cmd.action === 'add_event')    { addEvent({ title: cmd.title, date: cmd.date, time: cmd.time || '', category: cmd.category || 'personal', note: cmd.note || '' }); changed = true }
        else if (cmd.action === 'add_todo')     { addTodo({ text: cmd.text, category: cmd.category || 'personal', dueDate: cmd.dueDate || '' }); changed = true }
        else if (cmd.action === 'toggle_todo')  { toggleTodo(cmd.id); changed = true }
        else if (cmd.action === 'delete_event') { deleteEvent(cmd.id); changed = true }
        else if (cmd.action === 'delete_todo')  { deleteTodo(cmd.id); changed = true }
      } catch {}
    }
    if (changed && onDataChange) onDataChange()
    return text.replace(pattern, '').replace(/\n{3,}/g, '\n\n').trim()
  }

  async function sendMessage() {
    const userMsg = input.trim()
    if (!userMsg || loading) return
    setInput('')
    const contextData  = buildContextData()
    const newMessages  = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const apiMessages = newMessages.map((m, i) => ({
        role: m.role,
        content: i === newMessages.length - 1 && m.role === 'user' ? m.content + contextData : m.content,
      }))
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: SYSTEM_PROMPT, messages: apiMessages }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `HTTP ${res.status}`) }
      const data = await res.json()
      const raw  = data.content?.[0]?.text || '응답을 받지 못했어요.'
      setMessages(prev => [...prev, { role: 'assistant', content: extractAndRun(raw) }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `오류가 발생했어요: ${err.message}\n\n⚠️ \`npm run server\` 로 API 서버를 먼저 실행해주세요.`,
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}
        >
          <Sparkles size={17} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>AI 비서</h2>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>일정을 자연어로 관리하세요</p>
        </div>
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
        {loading && (
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}
            >
              <Bot size={15} style={{ color: 'var(--accent)' }} />
            </div>
            <div
              className="px-4 py-3 rounded-2xl rounded-tl-sm border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--accent-border)' }}
            >
              <Loader2 size={15} className="animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div
        className="flex gap-2 rounded-2xl p-2 border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--accent-border)' }}
      >
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="메시지를 입력하세요... (Enter로 전송)"
          rows={1}
          className="flex-1 text-sm px-2 py-1.5 outline-none resize-none bg-transparent"
          style={{ color: 'var(--text-main)', minHeight: '36px', maxHeight: '120px' }}
          onInput={e => {
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="w-9 h-9 rounded-xl flex items-center justify-center self-end transition-opacity disabled:opacity-30"
          style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border"
        style={{
          background:  'var(--accent-dim)',
          borderColor: 'var(--accent-border)',
        }}
      >
        {isUser
          ? <User size={14} style={{ color: 'var(--text-sub)' }} />
          : <Bot  size={14} style={{ color: 'var(--accent)'   }} />
        }
      </div>
      <div
        className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap border"
        style={isUser
          ? { background: 'var(--accent-dim)', color: 'var(--text-main)', borderColor: 'var(--accent-border)', borderTopRightRadius: '4px' }
          : { background: 'var(--bg-card)',    color: 'var(--text-sub)',   borderColor: 'var(--accent-border)', borderTopLeftRadius: '4px' }
        }
      >
        {msg.content}
      </div>
    </div>
  )
}
