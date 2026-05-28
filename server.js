import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { google } from 'googleapis'
import 'dotenv/config'

const WEATHER_KEY = process.env.OPENWEATHER_API_KEY
const TOKENS_FILE = new URL('.tokens.json', import.meta.url).pathname

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3001/api/auth/google/callback'
)

function loadTokens() {
  try {
    if (existsSync(TOKENS_FILE)) {
      return JSON.parse(readFileSync(TOKENS_FILE, 'utf8'))
    }
  } catch {}
  return null
}

function saveTokens(tokens) {
  writeFileSync(TOKENS_FILE, JSON.stringify(tokens), 'utf8')
}

const savedTokens = loadTokens()
if (savedTokens) oauth2Client.setCredentials(savedTokens)

oauth2Client.on('tokens', tokens => {
  const current = loadTokens() || {}
  saveTokens({ ...current, ...tokens })
  oauth2Client.setCredentials({ ...current, ...tokens })
})

const app = express()
app.use(express.json())

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

app.post('/api/chat', async (req, res) => {
  const { system, messages } = req.body
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages 필드가 필요합니다' })
  }
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system,
      messages,
    })
    res.json(response)
  } catch (err) {
    console.error('Anthropic API 오류:', err.message)
    res.status(500).json({ error: err.message })
  }
})

function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return null
  let avgGain = 0, avgLoss = 0
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) avgGain += diff; else avgLoss -= diff
  }
  avgGain /= period; avgLoss /= period
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period
  }
  if (avgLoss === 0) return 100
  return +(100 - 100 / (1 + avgGain / avgLoss)).toFixed(1)
}

function calcMA(closes, period) {
  const slice = closes.slice(-period)
  if (slice.length < period) return null
  return slice.reduce((a, b) => a + b, 0) / period
}

function getSignal(price, rsi, position52w, ma20) {
  let buyScore = 0, sellScore = 0
  const reasons = { buy: [], sell: [] }

  if (rsi !== null) {
    if (rsi < 35) { buyScore  += (35 - rsi);  reasons.buy.push('RSI 과매도')  }
    if (rsi > 65) { sellScore += (rsi - 65);   reasons.sell.push('RSI 과매수') }
  }
  if (position52w !== null) {
    if (position52w < 20) { buyScore  += (20 - position52w);  reasons.buy.push('52주 저점 근접')  }
    if (position52w > 80) { sellScore += (position52w - 80);  reasons.sell.push('52주 고점 근접') }
  }
  if (ma20 !== null) {
    if (price < ma20 * 0.97) { buyScore  += 10; reasons.buy.push('MA20 하회')  }
    if (price > ma20 * 1.03) { sellScore += 10; reasons.sell.push('MA20 상회') }
  }

  return {
    buyScore:  +buyScore.toFixed(1),
    sellScore: +sellScore.toFixed(1),
    buyReason:  reasons.buy[0]  || null,
    sellReason: reasons.sell[0] || null,
  }
}

function toSparkPoints(closes, w = 80, h = 24) {
  if (!closes || closes.length < 2) return null
  const min = Math.min(...closes), max = Math.max(...closes)
  const pad = 4
  const pts = closes.map((c, i) => {
    const x = Math.round(i * w / (closes.length - 1))
    const y = max === min ? h / 2 : Math.round((h - pad * 2) - ((c - min) / (max - min)) * (h - pad * 2)) + pad
    return `${x},${y}`
  }).join(' ')
  const last = closes[closes.length - 1]
  const lastY = max === min ? h / 2 : Math.round((h - pad * 2) - ((last - min) / (max - min)) * (h - pad * 2)) + pad
  return { pts, ex: [w, lastY] }
}

function weeklyOHLC(dailyData) {
  const weeks = {}
  dailyData.forEach(({ t, c, h, l }) => {
    const d = new Date(t * 1000)
    const sun = new Date(d); sun.setDate(d.getDate() - d.getDay())
    const key = sun.toISOString().slice(0, 10)
    if (!weeks[key]) weeks[key] = { key, high: h, low: l, close: c }
    else {
      if (h) weeks[key].high = Math.max(weeks[key].high, h)
      if (l) weeks[key].low  = Math.min(weeks[key].low,  l)
      weeks[key].close = c
    }
  })
  return Object.values(weeks).sort((a, b) => a.key.localeCompare(b.key))
}

function monthlyOHLC(dailyData) {
  const months = {}
  dailyData.forEach(({ t, c, h, l }) => {
    const d = new Date(t * 1000)
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`
    if (!months[key]) months[key] = { key, high: h, low: l, close: c }
    else {
      if (h) months[key].high = Math.max(months[key].high, h)
      if (l) months[key].low  = Math.min(months[key].low,  l)
      months[key].close = c
    }
  })
  return Object.values(months).sort((a, b) => a.key.localeCompare(b.key))
}

function weeklyCloses(dailyData) {
  return weeklyOHLC(dailyData).map(w => w.close)
}

function monthlyCloses(dailyData) {
  return monthlyOHLC(dailyData).map(m => m.close)
}

app.get('/api/stocks/quote', async (req, res) => {
  const { symbols } = req.query
  if (!symbols) return res.json([])
  try {
    const syms = symbols.split(',').map(s => s.trim())
    const results = await Promise.all(syms.map(async sym => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=6mo`
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      const data = await r.json()
      const result = data.chart?.result?.[0]
      if (!result) return { symbol: sym, error: true }

      const meta       = result.meta
      const timestamps = result.timestamp || []
      const rawCloses  = result.indicators.quote[0].close || []
      const rawHighs   = result.indicators.quote[0].high  || []
      const rawLows    = result.indicators.quote[0].low   || []
      const dailyData  = timestamps.map((t, i) => ({ t, c: rawCloses[i], h: rawHighs[i], l: rawLows[i] })).filter(d => d.c != null)
      const closes     = dailyData.map(d => d.c)

      const now = new Date()
      const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0)
      const thisWeek  = dailyData.filter(d => new Date(d.t * 1000) >= weekStart)
      const weekHigh  = thisWeek.length ? +Math.max(...thisWeek.map(d => d.h).filter(Boolean)).toFixed(2) : null
      const weekLow   = thisWeek.length ? +Math.min(...thisWeek.map(d => d.l).filter(Boolean)).toFixed(2) : null

      const last7     = closes.slice(-7)
      const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice
      const chgPct    = (meta.regularMarketPrice - prevClose) / prevClose * 100
      const weekBase  = last7[0] ?? prevClose
      const weekChgPct = (meta.regularMarketPrice - weekBase) / weekBase * 100

      const price       = meta.regularMarketPrice
      const rsi         = calcRSI(closes)
      const ma20        = calcMA(closes, 20)
      const low52       = meta.fiftyTwoWeekLow
      const high52      = meta.fiftyTwoWeekHigh
      const range52     = high52 && low52 ? high52 - low52 : null
      const position52w = (low52 && high52 && high52 !== low52)
        ? +((price - low52) / (high52 - low52) * 100).toFixed(1) : null
      const signal     = getSignal(price, rsi, position52w, ma20)

      const wOHLC = weeklyOHLC(dailyData)
      const mOHLC = monthlyOHLC(dailyData)
      const weekSpark  = toSparkPoints(wOHLC.map(w => w.close))
      const monthSpark = toSparkPoints(mOHLC.map(m => m.close))

      const weekBuy   = wOHLC.length     ? +Math.min(...wOHLC.map(w => w.low).filter(Boolean)).toFixed(2)             : null
      const weekSell  = wOHLC.length > 1 ? +Math.max(...wOHLC.slice(0,-1).map(w => w.high).filter(Boolean)).toFixed(2) : null
      const monthBuy  = mOHLC.length     ? +Math.min(...mOHLC.map(m => m.low).filter(Boolean)).toFixed(2)             : null
      const monthSell = mOHLC.length > 1 ? +Math.max(...mOHLC.slice(0,-1).map(m => m.high).filter(Boolean)).toFixed(2) : null

      return {
        symbol: sym,
        name: meta.longName || meta.shortName || sym,
        price, prevClose,
        chgPct:     +chgPct.toFixed(2),
        weekChgPct: +weekChgPct.toFixed(2),
        up: chgPct >= 0,
        currency: meta.currency,
        weekPts: weekSpark?.pts, weekEx: weekSpark?.ex,
        monthPts: monthSpark?.pts, monthEx: monthSpark?.ex,
        weekBuy, weekSell, monthBuy, monthSell,
        rsi, ma20: ma20 ? +ma20.toFixed(2) : null, position52w,
        ...signal,
      }
    }))
    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Google OAuth ─────────────────────────────────────────
app.get('/api/auth/google/status', (req, res) => {
  const tokens = loadTokens()
  res.json({ connected: !!(tokens?.access_token || tokens?.refresh_token) })
})

app.get('/api/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
  })
  res.redirect(url)
})

app.get('/api/auth/google/callback', async (req, res) => {
  const { code } = req.query
  try {
    const { tokens } = await oauth2Client.getToken(code)
    saveTokens(tokens)
    oauth2Client.setCredentials(tokens)
    res.send(`<html><body><script>window.close()</script><p>Gmail 연결 완료! 이 창을 닫아주세요.</p></body></html>`)
  } catch (err) {
    res.status(500).send('인증 실패: ' + err.message)
  }
})

app.get('/api/gmail/inbox', async (req, res) => {
  const tokens = loadTokens()
  if (!tokens) return res.status(401).json({ error: 'not_connected' })
  try {
    oauth2Client.setCredentials(tokens)
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    const list = await gmail.users.messages.list({
      userId: 'me', maxResults: 20, q: 'in:inbox category:primary',
    })
    const messages = list.data.messages || []
    const emails = await Promise.all(messages.map(async ({ id }) => {
      const msg = await gmail.users.messages.get({ userId: 'me', id, format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'] })
      const headers = msg.data.payload.headers
      const get = name => headers.find(h => h.name === name)?.value || ''
      const from = get('From')
      const name = from.includes('<') ? from.split('<')[0].replace(/"/g, '').trim() : from
      const date = new Date(get('Date'))
      const now  = new Date()
      const diffH = (now - date) / 36e5
      const time = diffH < 24
        ? date.toLocaleTimeString('ko', { hour: '2-digit', minute: '2-digit', hour12: false })
        : diffH < 48 ? '어제'
        : date.toLocaleDateString('ko', { month: 'numeric', day: 'numeric' })
      return {
        id, name, subj: get('Subject'), time,
        unread: msg.data.labelIds?.includes('UNREAD') ?? false,
      }
    }))
    res.json(emails)
  } catch (err) {
    console.error('Gmail error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/gmail/message/:id', async (req, res) => {
  const tokens = loadTokens()
  if (!tokens) return res.status(401).json({ error: 'not_connected' })
  try {
    oauth2Client.setCredentials(tokens)
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    const msg = await gmail.users.messages.get({ userId: 'me', id: req.params.id, format: 'full' })
    const headers = msg.data.payload.headers
    const get = name => headers.find(h => h.name === name)?.value || ''

    function extractBody(payload) {
      if (payload.body?.data) return { data: payload.body.data, mime: payload.mimeType }
      if (payload.parts) {
        const html  = payload.parts.find(p => p.mimeType === 'text/html')
        const plain = payload.parts.find(p => p.mimeType === 'text/plain')
        const pick  = html || plain
        if (pick?.body?.data) return { data: pick.body.data, mime: pick.mimeType }
        for (const part of payload.parts) {
          const nested = extractBody(part)
          if (nested) return nested
        }
      }
      return null
    }

    const body = extractBody(msg.data.payload)
    const decoded = body ? Buffer.from(body.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8') : ''

    const from = get('From')
    const name = from.includes('<') ? from.split('<')[0].replace(/"/g, '').trim() : from
    const email = from.match(/<(.+)>/)?.[1] || from

    res.json({
      id: req.params.id,
      subject: get('Subject'),
      from: name, email,
      date: get('Date'),
      body: decoded,
      isHtml: body?.mime === 'text/html',
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/weather', async (req, res) => {
  const { lat = '33.749', lon = '-84.388' } = req.query  // Atlanta 기본값
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_KEY}&units=metric&lang=kr`
    const r = await fetch(url)
    const data = await r.json()
    if (!r.ok) return res.status(r.status).json(data)

    const icon = data.weather[0].main
    const emoji =
      icon === 'Clear'       ? '☀️'  :
      icon === 'Clouds'      ? '⛅'  :
      icon === 'Rain'        ? '🌧️' :
      icon === 'Drizzle'     ? '🌦️' :
      icon === 'Thunderstorm'? '⛈️' :
      icon === 'Snow'        ? '❄️'  : '🌫️'

    res.json({
      temp:  Math.round(data.main.temp),
      feels: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      city:  data.name,
      emoji,
      desc:  data.weather[0].description,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`)
})
