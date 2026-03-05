import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { adminDb, adminAppId } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import * as fs from 'fs'
import * as path from 'path'

// ── Pro-Dataset: Tipo completo de respuesta del Orquestador ──────────────────
export type AiResponsePayload = {
    reply: string
    feedback: string
    corrected_version: string
    phonetic_respelling: string
    suggested_pattern: string
    error_analysis: {
        original: string
        fix: string
        category: string
        pattern_logic: string
        severity: number
    }[]
    metrics: {
        grammar_accuracy: number
        technical_precision: number
        fluency_flow: number
        native_vibe: number
    }
    status: 'perfect' | 'warning' | 'error'
}

// ─────────────────────────────────────────────────────────────────────────────
// ORQUESTADOR HÍBRIDO — Selección de proveedor vía .env.local
// AI_PROVIDER=gemini (default) | claude
// ─────────────────────────────────────────────────────────────────────────────
const AI_PROVIDER = (process.env.AI_PROVIDER || 'gemini') as 'gemini' | 'claude'


// ─────────────────────────────────────────────────────────────────────────────
// RESILIENCIA — Retry con backoff exponencial para errores 429 (Rate Limit)
// Lee el campo retryDelay de la respuesta de Google y lo respeta exactamente.
// ─────────────────────────────────────────────────────────────────────────────
const MAX_RETRIES = 3

function extractRetryDelay(error: unknown): number {
    // Google envía errorDetails[].retryDelay como "24s" — lo leemos y usamos
    try {
        const err = error as { errorDetails?: { retryDelay?: string }[] }
        const retryInfo = err?.errorDetails?.find(d => d.retryDelay)
        if (retryInfo?.retryDelay) {
            const seconds = parseInt(retryInfo.retryDelay.replace('s', ''), 10)
            if (!isNaN(seconds)) return seconds * 1000
        }
    } catch { /* ignore */ }
    return 0
}

async function callGemini(systemPrompt: string, userMessage: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')
    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash-latest',
        systemInstruction: systemPrompt,
        generationConfig: { responseMimeType: 'application/json' },
    })

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`[orquestador] → Gemini 1.5 Flash Latest (intento ${attempt}/${MAX_RETRIES})`)
            const result = await model.generateContent(userMessage)
            return result.response.text()
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : String(err)
            const is429 = errMsg.includes('429') || errMsg.includes('Too Many Requests') || errMsg.includes('RESOURCE_EXHAUSTED')

            if (is429 && attempt < MAX_RETRIES) {
                // Leer retryDelay de Google, o usar backoff exponencial (2s base)
                const googleDelay = extractRetryDelay(err)
                const backoffDelay = googleDelay > 0 ? googleDelay : Math.pow(2, attempt) * 2000
                console.warn(`[orquestador] ⚠️  429 Rate Limit — esperando ${backoffDelay / 1000}s antes del reintento ${attempt + 1}...`)
                await new Promise(resolve => setTimeout(resolve, backoffDelay))
                continue
            }

            // Error no-429 o últimos intentos agotados — propagar
            throw err
        }
    }

    throw new Error('[orquestador] Gemini: Reintentos agotados tras múltiples errores 429.')
}


async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
    console.log('[orquestador] → Claude 3.5 Sonnet')
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY || '',
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 2048,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
        }),
    })
    if (!response.ok) {
        const errBody = await response.text()
        throw new Error(`Claude API error ${response.status}: ${errBody.slice(0, 200)}`)
    }
    const data = await response.json()
    return data.content[0].text
}

// ── Validación de Variables de Entorno al arranque del módulo ─────────────────
const REQUIRED_ENV: Record<string, string | undefined> = {
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const MISSING_VARS = Object.entries(REQUIRED_ENV)
    .filter(([, v]) => !v)
    .map(([k]) => k)

if (MISSING_VARS.length > 0) {
    console.warn(
        '\n╔════════════════════════════════════════════════════════╗',
        '\n║  ⚠️  SPEAKTECH — MISSING ENVIRONMENT VARIABLES          ║',
        '\n╠════════════════════════════════════════════════════════╣',
        ...MISSING_VARS.map(v => `\n║  ✗  ${v.padEnd(52)}║`),
        '\n║  Add them to .env.local and restart the dev server.    ║',
        '\n╚════════════════════════════════════════════════════════╝\n',
    )
}

console.log(`[orquestador] 🧠 Provider activo: ${AI_PROVIDER.toUpperCase()}`)

// ── Cargar system-prompt.md una sola vez (module-level cache) ─────────────────
let systemPromptCache: string | null = null

function getSystemPrompt(): string {
    if (systemPromptCache) return systemPromptCache
    const promptPath = path.join(process.cwd(), 'system-prompt.md')
    systemPromptCache = fs.readFileSync(promptPath, 'utf-8')
    console.log('[system-prompt] ✓ Cargado —', systemPromptCache.length, 'chars')
    return systemPromptCache
}

// ── AUDIT #1 — JSON Sanitizer ─────────────────────────────────────────────────
function sanitizeJsonResponse(raw: string): string {
    const trimmed = raw.trim()
    const fenceMatch = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/i)
    if (fenceMatch) {
        console.warn('[sanitizer] ⚠️  Markdown fence detectado — eliminando...')
        return fenceMatch[1].trim()
    }
    if (trimmed.startsWith('json{') || trimmed.startsWith('JSON{')) {
        return trimmed.slice(4).trim()
    }
    return trimmed
}

// ── AUDIT #5 — Guard para transcripts muy cortos (< 4 palabras) ──────────────
function buildShortInputResponse(): AiResponsePayload {
    return {
        reply: "That was too brief for me to coach you properly. Try giving me a full sentence — like what you'd say in a daily standup. You've got this!",
        feedback: "Necesito al menos una oración completa para darte feedback útil. En tu próximo standup en inglés, intenta el patrón: 'Yesterday I [action], today I'll [action], my blocker is [issue].'",
        corrected_version: "Please speak a full sentence so I can analyze your English. Try: 'Yesterday I finished the login component and today I'll start on the API integration.'",
        phonetic_respelling: "/Plíis spíik a fúl séntens sou Ai can ánalais yor Inglish/",
        suggested_pattern: "Yesterday I [completed X], today I'll [work on Y], my blocker is [Z].",
        error_analysis: [
            {
                original: "(transcript demasiado corto para analizar)",
                fix: "Usa oraciones completas: sujeto + verbo + objeto + contexto técnico.",
                category: "Fluency",
                pattern_logic: "En tech standups, las respuestas incompletas generan desconfianza. Necesitas al menos una oración con estructura clara.",
                severity: 2,
            },
        ],
        metrics: { grammar_accuracy: 0, technical_precision: 0, fluency_flow: 0, native_vibe: 0 },
        status: 'error',
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST Handler
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        // Soportar tanto 'transcript' (frontend actual) como 'message' (legado)
        const userTranscript: string = body.transcript ?? body.message ?? ''
        const userRole: string = body.userRole ?? 'Unknown'
        const userId: string = body.userId ?? 'anonymous'

        if (!userTranscript.trim()) {
            return NextResponse.json({ error: 'No transcript provided.' }, { status: 400 })
        }

        // AUDIT #5 — Edge Case A: mensaje muy corto (< 4 palabras)
        const wordCount = userTranscript.trim().split(/\s+/).length
        if (wordCount < 4) {
            console.log(`[guard] ⚠️  Transcript muy corto (${wordCount} palabras)`)
            const shortResponse = buildShortInputResponse()
            if (adminDb) {
                adminDb
                    .collection('artifacts').doc(adminAppId)
                    .collection('public').doc('data').collection('conversations')
                    .add({ userId, userRole, originalTranscript: userTranscript, structuredResponse: shortResponse, provider: 'short-input-guard', timestamp: FieldValue.serverTimestamp(), appVersion: '2.0.0' })
                    .catch((err: unknown) => console.warn('[firestore] Short input log failed:', err))
            }
            return NextResponse.json(shortResponse)
        }

        // AUDIT #4 — Validar API key en tiempo de request
        if (AI_PROVIDER === 'gemini') {
            const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
            if (!apiKey) {
                console.error('[orquestador] ✗ GOOGLE_GENERATIVE_AI_API_KEY no configurada.')
                return NextResponse.json({
                    error: 'El coach está temporalmente fuera de línea. Por favor intenta en unos minutos.',
                    code: 'AI_SERVICE_UNAVAILABLE',
                }, { status: 503 })
            }
        } else if (AI_PROVIDER === 'claude') {
            const apiKey = process.env.ANTHROPIC_API_KEY
            if (!apiKey) {
                console.error('[orquestador] ✗ ANTHROPIC_API_KEY no configurada.')
                return NextResponse.json({
                    error: 'Claude está sin credenciales. Verifica ANTHROPIC_API_KEY en .env.local.',
                    code: 'AI_SERVICE_UNAVAILABLE',
                }, { status: 503 })
            }
        }

        const systemPrompt = getSystemPrompt()
        const enrichedPrompt = `[USER ROLE: ${userRole}]\n[TRANSCRIPT]: ${userTranscript}`

        console.log(`[orquestador] → Enviando — user:${userId} role:${userRole} words:${wordCount} provider:${AI_PROVIDER}`)

        // ── Llamada al modelo seleccionado ───────────────────────────────────
        let rawJson: string
        if (AI_PROVIDER === 'claude') {
            rawJson = await callClaude(systemPrompt, enrichedPrompt)
        } else {
            rawJson = await callGemini(systemPrompt, enrichedPrompt)
        }

        // AUDIT #1 — Sanitizar respuesta antes del parse
        const cleanJson = sanitizeJsonResponse(rawJson)

        let structuredResponse: AiResponsePayload
        try {
            structuredResponse = JSON.parse(cleanJson) as AiResponsePayload
        } catch (parseErr) {
            console.error('[orquestador] ✗ JSON parse failed. Raw:', rawJson.slice(0, 500))
            throw new Error(`${AI_PROVIDER} returned invalid JSON: ${parseErr}`)
        }

        // AUDIT #2 — Validar que error_analysis no esté vacío
        if (!structuredResponse.error_analysis || structuredResponse.error_analysis.length === 0) {
            console.warn('[orquestador] ⚠️  error_analysis vacío — inyectando fallback')
            structuredResponse.error_analysis = [
                {
                    original: userTranscript.slice(0, 80),
                    fix: structuredResponse.corrected_version?.slice(0, 80) ?? 'Use the corrected version above.',
                    category: 'Fluency',
                    pattern_logic: 'Siempre hay algo que pulir para sonar más nativo. Practica la versión corregida.',
                    severity: 1,
                },
            ]
        }

        console.log(`[orquestador] ✓ Respuesta OK — status:${structuredResponse.status} errores:${structuredResponse.error_analysis.length} provider:${AI_PROVIDER}`)

        // ── DATA MOAT: Firestore logging (Admin SDK — non-blocking) ──────────
        if (adminDb) {
            adminDb
                .collection('artifacts').doc(adminAppId)
                .collection('public').doc('data').collection('conversations')
                .add({
                    userId,
                    userRole,
                    provider: AI_PROVIDER,
                    originalTranscript: userTranscript,
                    wordCount,
                    structuredResponse,
                    timestamp: FieldValue.serverTimestamp(),
                    appVersion: '2.0.0',
                    model: AI_PROVIDER === 'gemini' ? 'gemini-1.5-flash-latest' : 'claude-3-5-sonnet-20240620',
                })
                .then(() => console.log(`[firestore] ✓ Logged — user:${userId} provider:${AI_PROVIDER}`))
                .catch((err: unknown) => console.error('[firestore] Log failed (non-fatal):', err))
        } else {
            console.log('[firestore] Skipped — no Admin credentials.')
        }

        return NextResponse.json(structuredResponse)

    } catch (error: unknown) {
        console.error(`[/api/chat] Error (${AI_PROVIDER}):`, error)

        const errMessage = error instanceof Error ? error.message : String(error)
        const isAuthError = errMessage.includes('API_KEY') || errMessage.includes('401') || errMessage.includes('403') || errMessage.includes('PERMISSION_DENIED')
        const isRateLimit = errMessage.includes('429') || errMessage.includes('Too Many Requests') || errMessage.includes('RESOURCE_EXHAUSTED') || errMessage.includes('Reintentos agotados')

        if (isAuthError) {
            return NextResponse.json({
                error: 'No se pudo conectar con el coach de IA. Verifica la configuración del servicio.',
                code: 'AI_AUTH_ERROR',
            }, { status: 503 })
        }

        if (isRateLimit) {
            return NextResponse.json({
                error: 'El plan gratuito de la IA alcanzó su límite por minuto. Espera 30 segundos e intenta de nuevo. 🕐',
                code: 'RATE_LIMIT',
            }, { status: 429 })
        }

        return NextResponse.json({
            error: 'Alex Chen está resolviendo un incidente en producción. Reintenta en 10s.',
            code: 'INTERNAL_ERROR',
        }, { status: 500 })
    }
}
