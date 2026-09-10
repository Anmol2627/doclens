import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import Groq from 'groq-sdk';
import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

// Extract text from PDF using a subprocess with pdfjs-dist
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const tempId = randomUUID();
  const pdfPath = join(tmpdir(), `upload-${tempId}.pdf`);
  const scriptPath = join(tmpdir(), `extract-${tempId}.mjs`);
  const outPath = join(tmpdir(), `output-${tempId}.txt`);

  try {
    // Write PDF buffer to a temp file
    writeFileSync(pdfPath, buffer);

    // Build absolute path to pdfjs-dist in this project's node_modules
    const projectRoot = process.cwd().replace(/\\/g, '/');
    const pdfjsPath = `${projectRoot}/node_modules/pdfjs-dist/legacy/build/pdf.mjs`;

    // Write a small extraction script using absolute import path
    const script = `
import { readFileSync, writeFileSync } from 'fs';
const pdfjsLib = await import('file:///${pdfjsPath}');
const { getDocument } = pdfjsLib;

const data = new Uint8Array(readFileSync('${pdfPath.replace(/\\/g, '/')}'));
const pdf = await getDocument({ data }).promise;
const parts = [];
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const tc = await page.getTextContent();
  parts.push(tc.items.map(item => item.str).join(' '));
}
writeFileSync('${outPath.replace(/\\/g, '/')}', parts.join('\\n'));
`;
    writeFileSync(scriptPath, script);

    // Run the script as a child process
    execSync(`node ${scriptPath}`, {
      timeout: 30000,
      cwd: projectRoot
    });

    const text = readFileSync(outPath, 'utf-8');
    return text;
  } finally {
    // Clean up temp files
    try { unlinkSync(pdfPath); } catch {}
    try { unlinkSync(scriptPath); } catch {}
    try { unlinkSync(outPath); } catch {}
  }
}

export async function POST(request: Request) {
  let docId = null;
  try {
    const { documentId } = await request.json()
    docId = documentId;
    
    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
    }

    if (!process.env.GROQ_API_KEY) {
       console.warn("No GROQ_API_KEY found in environment variables.");
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update document status to PROCESSING
    await supabase
      .from('medical_documents')
      .update({ status: 'PROCESSING' })
      .eq('id', documentId)

    // 1. Fetch document from DB
    const { data: doc, error: docError } = await supabase
      .from('medical_documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError || !doc) {
      throw new Error('Document not found')
    }

    // 2. Download PDF
    const { data: fileData, error: fileError } = await supabase.storage
      .from('medical_documents')
      .download(doc.file_path)

    if (fileError || !fileData) {
      throw new Error('Could not download file')
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Extract text from PDF
    let pdfText = '';
    try {
      pdfText = await extractTextFromPDF(buffer);
      console.log(`Successfully extracted ${pdfText.length} characters from PDF`);
      console.log(`First 200 chars: ${pdfText.substring(0, 200)}`);
    } catch (e: any) {
      console.error("Failed to parse PDF text:", e.message);
      if (e.stderr) console.error("stderr:", e.stderr.toString());
    }

    // 3. Process with Groq
    if (process.env.GROQ_API_KEY && pdfText.trim()) {
      console.log("Sending text to Groq for extraction...");
      const prompt = `
      You are an expert medical AI. Extract the following information from this medical document text and return it strictly as a JSON object matching this schema:
      {
        "findings": [{"condition": "string", "status": "ACTIVE" | "RESOLVED", "date": "YYYY-MM-DD"}],
        "medications": [{"name": "string", "dosage": "string", "frequency": "string", "status": "ACTIVE" | "STOPPED", "startDate": "YYYY-MM-DD"}],
        "investigations": [{"testName": "string", "value": "string", "unit": "string", "referenceRange": "string", "date": "YYYY-MM-DD"}],
        "events": [{"eventType": "CONSULTATION" | "LAB_TEST" | "IMAGING" | "PROCEDURE", "title": "string", "description": "string", "date": "YYYY-MM-DD"}]
      }
      If a piece of information is missing, omit the field or leave it empty/null. Do not make up dates if they are missing. Use null for unknown fields.
      Respond ONLY with the raw JSON object, without any markdown formatting, backticks, or extra conversational text.

      Document Text:
      ${pdfText.substring(0, 30000)}
      `;

      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'openai/gpt-oss-20b'
      });

      let jsonText = chatCompletion.choices[0]?.message?.content || '{}';
      console.log("Groq raw response:", jsonText.substring(0, 500));
      
      // Clean markdown if the model hallucinates it
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      let extractedData;
      try {
        extractedData = JSON.parse(jsonText);
        console.log("Parsed extraction:", JSON.stringify(extractedData).substring(0, 300));
      } catch (e) {
        console.error("Failed to parse Groq output", jsonText);
        extractedData = null;
      }

      if (extractedData) {
        // 4. Insert into database
        const { findings, medications, investigations, events } = extractedData;
        const patientId = doc.patient_id;

        if (findings && findings.length > 0) {
          const { error } = await supabase.from('medical_findings').insert(
            findings.map((f: any) => ({
              patient_id: patientId,
              condition: f.condition,
              status: f.status || 'ACTIVE',
              first_noted_date: f.date || null
            }))
          )
          if (error) console.error("Error inserting findings:", error);
          else console.log(`Inserted ${findings.length} findings`);
        }

        if (medications && medications.length > 0) {
          const { error } = await supabase.from('medications').insert(
            medications.map((m: any) => ({
              patient_id: patientId,
              name: m.name,
              dosage: m.dosage,
              frequency: m.frequency,
              status: m.status || 'ACTIVE',
              start_date: m.startDate || null
            }))
          )
          if (error) console.error("Error inserting medications:", error);
          else console.log(`Inserted ${medications.length} medications`);
        }

        if (investigations && investigations.length > 0) {
          const { error } = await supabase.from('investigations').insert(
            investigations.map((i: any) => ({
              patient_id: patientId,
              test_name: i.testName,
              value: i.value,
              unit: i.unit,
              reference_range: i.referenceRange,
              date: i.date || null
            }))
          )
          if (error) console.error("Error inserting investigations:", error);
          else console.log(`Inserted ${investigations.length} investigations`);
        }

        if (events && events.length > 0) {
          const { error } = await supabase.from('medical_events').insert(
            events.map((e: any) => ({
              patient_id: patientId,
              event_type: e.eventType || 'OTHER',
              title: e.title,
              description: e.description,
              date: e.date || new Date().toISOString().split('T')[0],
              document_id: docId
            }))
          )
          if (error) console.error("Error inserting events:", error);
          else console.log(`Inserted ${events.length} events`);
        }
      }
    } else {
        console.warn(`Skipping AI extraction. GROQ_API_KEY present: ${!!process.env.GROQ_API_KEY}, pdfText length: ${pdfText.length}`);
        // Insert dummy data if no API key or PDF text extraction failed
        await supabase.from('medical_events').insert([{
            patient_id: doc.patient_id,
            event_type: 'CONSULTATION',
            title: 'Uploaded Document (No Text/Groq Key)',
            description: 'Document processed without valid text extraction',
            date: new Date().toISOString().split('T')[0],
            document_id: docId
        }])
    }

    // Update status to COMPLETED
    await supabase
      .from('medical_documents')
      .update({ status: 'COMPLETED' })
      .eq('id', docId)

    return NextResponse.json({ success: true, message: 'Processing completed' })
  } catch (error: any) {
    console.error('Processing error:', error)
    if (docId) {
        const supabase = createClient()
        await supabase.from('medical_documents').update({ status: 'FAILED' }).eq('id', docId)
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
