/**
 * lib/firebase.ts — Client-side Firebase singleton
 *
 * Priority:
 *  1. Canvas/Vertex AI globals  (__firebase_config / __app_id / __initial_auth_token)
 *  2. NEXT_PUBLIC_ env vars     (set in .env.local for local dev)
 *  3. Graceful no-op            (app renders without crashing; Firestore/Auth calls are skipped)
 */

import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

// ── Canvas/Vertex AI global declarations ──────────────────────────────────────
declare global {
    // eslint-disable-next-line no-var
    var __firebase_config: string | undefined
    // eslint-disable-next-line no-var
    var __app_id: string | undefined
    // eslint-disable-next-line no-var
    var __initial_auth_token: string | undefined
}

// ── Resolve config — returns null when no credentials are available ───────────
function resolveConfig(): object | null {
    // 1. Canvas environment provides a JSON string
    if (typeof globalThis.__firebase_config !== 'undefined') {
        try { return JSON.parse(globalThis.__firebase_config) } catch { /* fall through */ }
    }

    // 2. Local dev: NEXT_PUBLIC_ env vars
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    if (apiKey) {
        return {
            apiKey,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
        }
    }

    // 3. No credentials — return null; Firebase will not be initialised
    return null
}

// ── Conditional singleton initialisation ─────────────────────────────────────
const config = resolveConfig()

/**
 * `firebaseReady` is true only when valid credentials were found.
 * All auth / Firestore calls in page.tsx are guarded by checking this flag or
 * the `user` state (which stays null when Firebase is unavailable).
 */
export const firebaseReady: boolean = config !== null

let _app: FirebaseApp | null = null
let _auth: Auth | null = null
let _db: Firestore | null = null

if (config) {
    _app = getApps().length === 0 ? initializeApp(config) : getApps()[0]
    _auth = getAuth(_app)
    _db = getFirestore(_app)
}

// Export as non-null — callers must guard with `firebaseReady` or `user !== null`
export const auth = _auth as Auth
export const db = _db as Firestore

/**
 * Firestore collection root key (matches the Admin SDK's adminAppId).
 */
export const appId: string =
    globalThis.__app_id ??
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    'speaktech-dev'

/**
 * Canvas/Vertex AI custom auth token (undefined in local dev → signInAnonymously).
 */
export const initialAuthToken: string | undefined = globalThis.__initial_auth_token
