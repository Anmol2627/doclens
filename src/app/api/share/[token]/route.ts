import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { getProfileWithAdmin } from '@/app/actions/profile'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createClient()
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { token } = params

    // 1. Validate the token
    const { data: shareLink, error: linkError } = await supabaseAdmin
      .from('share_links')
      .select('*')
      .eq('token', token)
      .single()

    if (linkError || !shareLink) {
      return NextResponse.json({ error: 'Invalid or expired share link' }, { status: 404 })
    }

    // Check expiration
    if (new Date(shareLink.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This share link has expired' }, { status: 410 })
    }

    const patientId = shareLink.patient_id
    const config = shareLink.config || {}

    // 2. Fetch patient profile
    const profileData = await getProfileWithAdmin(patientId)

    const rawProfile = profileData?.patient_profiles
    const profile = Array.isArray(rawProfile) ? rawProfile[0] || {} : rawProfile || {}
    const fullName = profileData?.full_name || 'Patient'

    // 3. Fetch medical data based on config
    let findings: any[] = []
    let medications: any[] = []
    let investigations: any[] = []
    let events: any[] = []
    let documents: any[] = []

    if (config.includeContext !== false) {
      const { data: f } = await supabaseAdmin.from('medical_findings').select('*').eq('patient_id', patientId)
      findings = f || []
      const { data: m } = await supabaseAdmin.from('medications').select('*').eq('patient_id', patientId)
      medications = m || []
      const { data: inv } = await supabaseAdmin.from('investigations').select('*').eq('patient_id', patientId).order('date', { ascending: false })
      investigations = inv || []
    }

    if (config.includeTimeline !== false) {
      const { data: e } = await supabaseAdmin
        .from('medical_events')
        .select('*, medical_documents(id, file_name, file_path)')
        .eq('patient_id', patientId)
        .order('date', { ascending: false })
      events = e || []
    }

    // Generate signed URLs for documents if included
    if (shareLink.include_documents) {
      const { data: docs } = await supabaseAdmin
        .from('medical_documents')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'COMPLETED')

      if (docs) {
        documents = await Promise.all(
          docs.map(async (doc: any) => {
            const { data } = await supabaseAdmin.storage
              .from('medical_documents')
              .createSignedUrl(doc.file_path, 3600)
            return {
              id: doc.id,
              file_name: doc.file_name,
              document_type: doc.document_type,
              document_date: doc.document_date,
              signedUrl: data?.signedUrl || null
            }
          })
        )
      }

      // Also attach signed URLs to events
      events = await Promise.all(
        events.map(async (event: any) => {
          if (event.medical_documents?.file_path) {
            const { data } = await supabaseAdmin.storage
              .from('medical_documents')
              .createSignedUrl(event.medical_documents.file_path, 3600)
            return { ...event, documentUrl: data?.signedUrl || null }
          }
          return event
        })
      )
    }

    return NextResponse.json({
      patient: {
        fullName,
        dateOfBirth: profile.date_of_birth,
        gender: profile.gender,
        bloodGroup: profile.blood_group,
        heightCm: profile.height_cm,
        weightKg: profile.weight_kg,
        allergies: profile.allergies
      },
      findings,
      medications,
      investigations,
      events,
      documents,
      config,
      expiresAt: shareLink.expires_at
    })
  } catch (error: any) {
    console.error('Share token error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
