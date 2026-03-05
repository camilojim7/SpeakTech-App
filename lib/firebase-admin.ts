/**
 * lib/firebase-admin.ts — Server-side Firebase Admin SDK singleton
 *
 * Credential priority:
 *  1. firebase-admin.json in project root (local dev — gitignored)
 *  2. FIREBASE_* env vars (CI / Vercel / Cloud Run)
 *  3. Graceful no-op — if neither exists, adminDb is null and logging is skipped
 */

import * as admin from 'firebase-admin'
import { getApps } from 'firebase-admin/app'
import type { Firestore } from 'firebase-admin/firestore'
import fs from 'fs'
import path from 'path'

function tryInit(): boolean {
    if (getApps().length > 0) return true // already initialised

    // Option A: service-account JSON file (gitignored, local dev only)
    try {
        const saPath = path.join(process.cwd(), 'firebase-admin.json')
        const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'))
        admin.initializeApp({ credential: admin.credential.cert(sa) })
        return true
    } catch { /* file not found — fall through */ }

    // Option B: individual environment variables (Vercel / CI)
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

    if (projectId && clientEmail && privateKey) {
        admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) })
        return true
    }

    // Option C: FIREBASE_ADMIN_CONFIG as a single JSON string (Vercel alternative)
    const adminConfig = process.env.FIREBASE_ADMIN_CONFIG
    if (adminConfig) {
        try {
            const sa = JSON.parse(adminConfig)
            admin.initializeApp({ credential: admin.credential.cert(sa) })
            return true
        } catch {
            console.error('[firebase-admin] FIREBASE_ADMIN_CONFIG is not valid JSON.')
        }
    }

    // Option D: no credentials — log once and continue
    console.warn('[firebase-admin] No credentials found — server-side Firestore logging is disabled.')
    return false
}

const initialised = tryInit()

/**
 * Firestore Admin instance — null when no credentials are configured.
 * Callers MUST check `if (!adminDb) return` before writing.
 */
export const adminDb: Firestore | null = initialised ? admin.firestore() : null

export const adminAppId: string =
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    process.env.FIREBASE_PROJECT_ID ??
    'speaktech-dev'
