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

  async function run(model: string) {
    const res = await client.chat.completions.create({
      model,
      messages,
      response_format: { type: 'json_object' }
    })
    const txt = res.choices[0]?.message?.content ?? '{}'
    return JSON.parse(txt)
  }

  try {
    return await run(process.env.LLM_MODEL_PRIMARY || 'gpt-5')
  } catch (err) {
    console.warn('primary model failed, falling back', err)
    try {
      return await run(process.env.LLM_MODEL_FALLBACK || 'gpt-4o')
    } catch (err2) {
      const message = err2 instanceof Error ? err2.message : String(err2)
      console.error('LLM analysis failed', err2)
      throw new Error(`LLM analysis failed: ${message}`)
    }
  }
}

