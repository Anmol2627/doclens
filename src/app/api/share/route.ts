import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      includeContext = true,
      includeTimeline = true,
      includeDocuments = false,
      includeAttention = true,
      expiresIn = '7d'
    } = body

    // Calculate expiration
    const now = new Date()
    let expiresAt: Date
    switch (expiresIn) {
      case '30d':
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        break
      case '6m':
        expiresAt = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000)
        break
      case 'never':
        expiresAt = new Date(now.getTime() + 365 * 10 * 24 * 60 * 60 * 1000) // 10 years
        break
      default: // 7d
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    }

    const token = randomUUID()

    const { data, error } = await supabase.from('share_links').insert({
      token,
      patient_id: user.id,
      config: {
        includeContext,
        includeTimeline,
        includeDocuments,
        includeAttention
      },
      include_documents: includeDocuments,
      expires_at: expiresAt.toISOString()
    }).select().single()

    if (error) {
      console.error('Error creating share link:', error)
      return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
    }

    // Build the share URL
    const origin = request.headers.get('origin') || request.headers.get('host') || 'http://localhost:3000'
    const protocol = origin.startsWith('http') ? '' : 'http://'
    const shareUrl = `${protocol}${origin}/doctor/${token}`

    return NextResponse.json({
      success: true,
      token,
      shareUrl,
      expiresAt: expiresAt.toISOString()
    })
  } catch (error: any) {
    console.error('Share error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
