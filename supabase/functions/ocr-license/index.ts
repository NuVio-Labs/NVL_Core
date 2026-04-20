import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { image_base64, mime_type } = await req.json() as {
      image_base64: string
      mime_type: string
    }

    if (!image_base64 || !mime_type) {
      return new Response(JSON.stringify({ error: 'image_base64 and mime_type required' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

    const prompt = `Du siehst die Vorderseite eines deutschen Führerscheins.
Extrahiere ausschließlich diese Felder und gib sie als JSON zurück:
{
  "last_name": "Nachname aus Feld 1",
  "first_name": "Vorname aus Feld 2",
  "date_of_birth": "Geburtsdatum aus Feld 3 im Format YYYY-MM-DD",
  "license_number": "Führerscheinnummer aus Feld 5",
  "license_class": "Höchste Führerscheinklasse aus Feld 9 (z.B. B, BE, C, CE)"
}
Wichtig:
- Nur diese 5 Felder, nichts anderes
- date_of_birth immer als YYYY-MM-DD
- license_class: wähle die höchste Klasse in dieser Reihenfolge: CE > C1E > C1 > C > BE > B > L > T > AM > A > A2 > A1
- Falls ein Feld nicht erkennbar ist, setze null
- Antworte NUR mit dem JSON-Objekt, kein Text davor oder danach`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mime_type};base64,${image_base64}`, detail: 'high' } },
          ],
        }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`OpenAI error: ${err}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content ?? '{}'

    // JSON aus Antwort extrahieren
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    const parsed = JSON.parse(jsonMatch[0])

    return new Response(JSON.stringify(parsed), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
