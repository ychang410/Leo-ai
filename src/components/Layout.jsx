import { useContext } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, CheckSquare, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ThemeContext } from '../App.jsx'
import { THEMES, THEME_ORDER, applyTheme } from '../store/theme.js'

const navItems = [
  { to: '/',         icon: LayoutDashboard, label: '대시보드' },
  { to: '/calendar', icon: CalendarDays,    label: '캘린더'   },
  { to: '/todos',    icon: CheckSquare,     label: '할 일'    },
  { to: '/chat',     icon: MessageSquare,   label: 'AI 비서'  },
]

export default function Layout({ children }) {
  const { themeId, setThemeId } = useContext(ThemeContext)
  const today = format(new Date(), 'yyyy.MM.dd (eee)', { locale: ko })

  function handleTheme(id) {
    setThemeId(id)
    applyTheme(id)
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-app)' }}>
      {/* 별 배경 */}
      <div className="stars-layer" />
      <div className="nebula-layer" />

      {/* 사이드바 */}
      <aside
        className="fixed left-0 top-0 h-screen w-56 flex flex-col py-6 px-4 z-20 border-r"
        style={{
          background: 'var(--bg-sidebar)',
          borderColor: 'var(--accent-border)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* 브랜드 */}
        <div className="mb-8 px-2 pb-5 border-b" style={{ borderColor: 'var(--accent-border)' }}>
          <h1 className="text-sm font-bold tracking-wider" style={{ color: 'var(--text-main)' }}>
            나의 플래너
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-dim)', fontFamily: "'Space Mono', monospace" }}>
            {today}
          </p>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border"
              style={({ isActive }) => ({
                background:  isActive ? 'var(--bg-nav-active)' : 'transparent',
                color:       isActive ? 'var(--accent)'       : 'var(--text-dim)',
                borderColor: isActive ? 'var(--accent-border)' : 'transparent',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} style={{ opacity: isActive ? 1 : 0.5 }} />
                  <span>{label}</span>
                  {isActive && (
                    <span
                      className="ml-auto w-1.5 h-1.5 rounded-full"
                      style={{ background: 'var(--accent)', boxShadow: '0 0 6px var(--accent-glow)' }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* 테마 선택기 */}
        <div className="px-2 pt-5 border-t" style={{ borderColor: 'var(--accent-border)' }}>
          <p className="text-[10px] mb-3 tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>
            테마
          </p>
          <div className="flex gap-2">
            {THEME_ORDER.map(id => (
              <button
                key={id}
                onClick={() => handleTheme(id)}
                title={THEMES[id].label}
                className="w-5 h-5 rounded-full transition-all duration-200 flex-shrink-0"
                style={{
                  background:  THEMES[id].dot,
                  boxShadow:   themeId === id ? `0 0 8px ${THEMES[id].dot}` : 'none',
                  transform:   themeId === id ? 'scale(1.25)' : 'scale(1)',
                  opacity:     themeId === id ? 1 : 0.45,
                  outline:     themeId === id ? `2px solid ${THEMES[id].dot}` : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* 메인 */}
      <main className="ml-56 flex-1 p-8 relative z-10">
        {children}
      </main>
    </div>
  )
}
