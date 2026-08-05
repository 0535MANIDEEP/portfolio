// Verifies GEMINI_API_KEY can produce a 768-dim embedding and a chat completion.
// Run with: node --env-file=.env scripts/gemini-check.mjs
import { GoogleGenAI } from '@google/genai'

const key = process.env.GEMINI_API_KEY
if (!key) { console.error('GEMINI_API_KEY missing'); process.exit(1) }
console.log('key prefix:', key.slice(0, 6) + '…', 'len:', key.length)

const ai = new GoogleGenAI({ apiKey: key })

try {
  const emb = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: 'hello world',
    config: { outputDimensionality: 768 },
  })
  console.log('EMBEDDING OK, dims:', emb.embeddings?.[0]?.values?.length)
} catch (e) {
  console.error('EMBEDDING FAILED:', e?.message || e)
}

try {
  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'Reply with exactly: pong',
  })
  console.log('CHAT OK:', (res.text || '').trim().slice(0, 40))
} catch (e) {
  console.error('CHAT FAILED:', e?.message || e)
}
