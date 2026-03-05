import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        // Parse the incoming FormData (audio blob sent from the client)
        const formData = await request.formData()
        const audioFile = formData.get('audio') as File | null

        if (!audioFile) {
            return NextResponse.json({ error: 'No audio file received.' }, { status: 400 })
        }

        // ─────────────────────────────────────────────────────────────────────────
        // TODO: REAL WHISPER CALL GOES HERE
        //
        // Replace the mock below with the actual OpenAI Whisper API call:
        //
        //   import OpenAI from 'openai'
        //   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        //
        //   const transcription = await openai.audio.transcriptions.create({
        //     file: audioFile,           // The File object from FormData
        //     model: 'whisper-1',
        //     language: 'en',            // optional: force English
        //   })
        //
        //   return NextResponse.json({ text: transcription.text })
        //
        // ─────────────────────────────────────────────────────────────────────────

        // MOCK RESPONSE — simulates the Whisper API response for development
        await new Promise((resolve) => setTimeout(resolve, 1200)) // simulate network latency

        return NextResponse.json({
            text: 'I worked on the database login yesterday and today I will fix some bugs.',
        })
    } catch (error) {
        console.error('[/api/transcribe] Error:', error)
        return NextResponse.json({ error: 'Internal server error during transcription.' }, { status: 500 })
    }
}
