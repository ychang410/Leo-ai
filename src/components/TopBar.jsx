import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function TopBar() {
  const [playing, setPlaying] = useState(true)
  const [weather, setWeather] = useState(null)

  const hour = new Date().getHours()
  const greeting =
    hour < 6  ? '좋은 새벽이에요' :
    hour < 12 ? '좋은 아침이에요' :
    hour < 18 ? '좋은 오후에요'   : '좋은 저녁이에요'

  const today = format(new Date(), 'yyyy.MM.dd (eee)', { locale: ko })

  useEffect(() => {
    fetch('/api/weather')
      .then(r => r.json())
      .then(d => { if (!d.error) setWeather(d) })
      .catch(() => {})
  }, [])

  return (
    <div className="top-bar">
      <div>
        <div className="greeting-line1">
          {greeting},&nbsp;<strong>연수님</strong>&nbsp;✦
        </div>
        <div className="greeting-line2">{today}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="weather-inline">
          {weather ? (
            <>
              {weather.emoji} <span className="wv">{weather.temp}°C</span> {weather.city}
              <span className="wrain">· 💧 {weather.humidity}%</span>
            </>
          ) : (
            <>⛅ <span className="wv">--°C</span> Atlanta</>
          )}
        </div>
        <span className="gsep">·</span>
        <div className="music-inline">
          <div className="spotify-dot" />
          <span className="mc-btn">⏮</span>
          <span className="mc-play" onClick={() => setPlaying(p => !p)}>
            {playing ? '⏸' : '▶'}
          </span>
          <span className="mc-btn">⏭</span>
          <span className="music-title">Blinding Lights — The Weeknd</span>
        </div>
      </div>
    </div>
  )
}
