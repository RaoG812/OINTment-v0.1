import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function summarizeRepo(fileList: string[]): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return 'OpenAI API key missing'
  }
  const content = fileList.join('\n')
  const messages: any = [
    { role: 'system', content: 'You summarize repository file lists.' },
    { role: 'user', content }
  ]
  try {
    const res = await client.chat.completions.create({
      model: 'gpt-5',
      messages
    })
    return res.choices[0]?.message?.content?.trim() ?? ''
  } catch (err) {
    console.warn('gpt-5 failed, falling back to gpt-4o', err)
    try {
      const res = await client.chat.completions.create({
        model: 'gpt-4o',
        messages
      })
      return res.choices[0]?.message?.content?.trim() ?? ''
    } catch (err2) {
      console.error('OpenAI analysis failed', err2)
      throw err2
    }
  }
}
