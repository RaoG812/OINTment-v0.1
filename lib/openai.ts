import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function summarizeRepo(fileList: string[]): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return 'OpenAI API key missing'
  }
  const content = fileList.join('\n')
  try {
    const res = await client.chat.completions.create({
      model: 'gpt-5',
      messages: [
        { role: 'system', content: 'You summarize repository file lists.' },
        { role: 'user', content }
      ],
    })
    return res.choices[0]?.message?.content ?? ''
  } catch (err) {
    console.error(err)
    return 'analysis failed'
  }
}
