import OpenAI from 'openai'

// Create a client that can talk to AIMLAPI when AIML_API_KEY is provided.
// Otherwise, it falls back to the standard OpenAI endpoint using OPENAI_API_KEY.
const apiKey = process.env.AIML_API_KEY || process.env.OPENAI_API_KEY
const baseURL = process.env.AIML_API_KEY
  ? process.env.AIML_API_BASE_URL || 'https://api.aimlapi.com/v1'
  : process.env.OPENAI_BASE_URL

const client = new OpenAI({ apiKey, baseURL })

export async function summarizeRepo(fileList: string[]): Promise<string> {
  if (!apiKey) {
    throw new Error('LLM API key missing')
  }

  const content = fileList.join('\n')
  const messages: any = [
    { role: 'system', content: 'You summarize repository file lists.' },
    { role: 'user', content }
  ]

  try {
    const res = await client.chat.completions.create({
      model: process.env.LLM_MODEL_PRIMARY || 'gpt-5',
      messages
    })
    return res.choices[0]?.message?.content?.trim() ?? ''
  } catch (err) {
    console.warn('primary model failed, falling back', err)
    try {
      const res = await client.chat.completions.create({
        model: process.env.LLM_MODEL_FALLBACK || 'gpt-4o',
        messages
      })
      return res.choices[0]?.message?.content?.trim() ?? ''
    } catch (err2) {
      const message = err2 instanceof Error ? err2.message : String(err2)
      console.error('LLM analysis failed', err2)
      throw new Error(`LLM analysis failed: ${message}`)
    }
  }
}

