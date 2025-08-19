import OpenAI from 'openai'

export interface RepoAnalysis {
  overview: string
  takeaways: string[]
  metrics: {
    complexity: number
    documentation: number
    tests: number
  }
}

// Create a client that can talk to AIMLAPI when AIML_API_KEY is provided.
// Otherwise, it falls back to the standard OpenAI endpoint using OPENAI_API_KEY.
const apiKey = process.env.AIML_API_KEY || process.env.OPENAI_API_KEY
const baseURL = process.env.AIML_API_KEY
  ? process.env.AIML_API_BASE_URL || 'https://api.aimlapi.com/v1'
  : process.env.OPENAI_BASE_URL

const client = new OpenAI({ apiKey, baseURL })

export async function summarizeRepo(fileList: string[]): Promise<RepoAnalysis> {
  if (!apiKey) {
    throw new Error('LLM API key missing')
  }

  const content = fileList.join('\n')
  const messages: any = [
    {
      role: 'system',
      content:
        'Summarize the repository file list. Respond with JSON of shape {"overview":string,"takeaways":string[],"metrics":{"complexity":number,"documentation":number,"tests":number}}. Values are 0-100. No extra text.'
    },
    { role: 'user', content }
  ]

  const model = process.env.LLM_MODEL || 'gpt-5'
  try {
    const res = await client.chat.completions.create({
      model,
      messages,
      reasoning: { effort: 'medium' } as any,
      response_format: { type: 'json_object' }
    } as any)
    const txt = res.choices[0]?.message?.content ?? '{}'
    return JSON.parse(txt)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('LLM analysis failed', err)
    throw new Error(`LLM analysis failed: ${message}`)
  }
}

// Categorize commit messages into high-level buckets using the configured LLM.
export async function categorizeCommits(messages: string[]): Promise<string[]> {
  if (!apiKey) {
    throw new Error('LLM API key missing')
  }
  const prompt = messages.map((m, i) => `${i + 1}. ${m}`).join('\n')
  const model = process.env.LLM_MODEL || 'gpt-5'
  const res = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'Classify each commit message as one of: backend, frontend, db, other. Respond with JSON {"categories": string[]} with same order.'
      },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' }
  } as any)
  const txt = res.choices[0]?.message?.content ?? '{"categories": []}'
  try {
    const parsed = JSON.parse(txt)
    return Array.isArray(parsed.categories) ? parsed.categories : []
  } catch {
    return []
  }
}

