// Verifies the full retrieval path: embed a question -> match_documents RPC.
// Run with: node --env-file=.env scripts/rag-check.mjs "your question"
import { GoogleGenAI } from '@google/genai'

const q = process.argv[2] || 'What is Gokul experienced in?'
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const emb = await ai.models.embedContent({
  model: 'gemini-embedding-001',
  contents: q,
  config: { outputDimensionality: 768 },
})

const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/match_documents`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  },
  body: JSON.stringify({
    query_embedding: emb.embeddings[0].values,
    match_threshold: 0.2,
    match_count: 5,
    filter_type: null,
  }),
})

const body = await res.text()
if (!res.ok) { console.error('RPC FAILED', res.status, body); process.exit(1) }

const docs = JSON.parse(body)
console.log(`Q: ${q}`)
console.log(`matches: ${docs.length}`)
for (const d of docs) {
  console.log(`  [${d.type}] ${d.source_title} — similarity ${d.similarity.toFixed(3)}`)
}
