import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import 'dotenv/config'

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

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`)
})
