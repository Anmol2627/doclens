import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { translateMedicalData, SUPPORTED_LANGUAGES } from '@/lib/translate'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { payload, targetLang } = await request.json()

    if (!payload || !targetLang) {
      return NextResponse.json({ error: 'payload and targetLang are required' }, { status: 400 })
    }

    if (!SUPPORTED_LANGUAGES[targetLang]) {
      return NextResponse.json({ error: `Unsupported language: ${targetLang}` }, { status: 400 })
    }

    const translated = await translateMedicalData(payload, targetLang)
    return NextResponse.json(translated)
  } catch (e: any) {
    console.error('Translation API error:', e.message)
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
  }
}
