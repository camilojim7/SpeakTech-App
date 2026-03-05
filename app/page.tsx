'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Mic, Plus, Settings, LogOut, Code,
    Coffee, DollarSign, Palette, MonitorPlay, ChevronDown, Zap, ArrowRight,
    CheckCircle2, Play, BarChart3, Target, Loader2, MessageSquare, AlertCircle,
} from 'lucide-react';

// ── Firebase client SDK ────────────────────────────────────────────────────────
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// ── Firebase config from .env.local ───────────────────────────────────────────
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const firebaseReady = Boolean(firebaseConfig.apiKey);
const firebaseApp = firebaseReady
    ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0])
    : null;
const auth = firebaseApp ? getAuth(firebaseApp) : null;
const db = firebaseApp ? getFirestore(firebaseApp) : null;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? 'speaktech-dev';

// ── Canonical Pro-Dataset type ─────────────────────────────────────────────────
type AiResponsePayload = {
    reply: string;
    feedback: string;
    corrected_version: string;
    phonetic_respelling: string;
    suggested_pattern: string;
    error_analysis: { original: string; fix: string; category: string; pattern_logic: string; severity: number }[];
    metrics: { grammar_accuracy: number; technical_precision: number; fluency_flow: number; native_vibe: number };
    status: 'perfect' | 'warning' | 'error';
};

type RecordingState = 'idle' | 'recording' | 'transcribing';

/* =========================================
   INLINE COMPONENT: MicrophoneButton
   ========================================= */
function MicrophoneButton({ recordingState, onRecordingStart, onAudioReady }: {
    recordingState: RecordingState;
    onRecordingStart: () => void;
    onAudioReady: (blob: Blob) => void;
}) {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const [permissionDenied, setPermissionDenied] = useState(false);

    const isRecording = recordingState === 'recording';
    const isTranscribing = recordingState === 'transcribing';
    const isIdle = recordingState === 'idle';

    const handlePointerDown = useCallback(async () => {
        if (!isIdle) return;
        setPermissionDenied(false);
        chunksRef.current = [];

        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
            setPermissionDenied(true);
            return;
        }

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus' : 'audio/webm';
        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        recorder.onstop = () => {
            stream.getTracks().forEach(t => t.stop());
            onAudioReady(new Blob(chunksRef.current, { type: mimeType }));
        };
        recorder.start(100);
        onRecordingStart();
    }, [isIdle, onAudioReady, onRecordingStart]);

    const handlePointerUp = useCallback(() => {
        if (recordingState !== 'recording') return;
        mediaRecorderRef.current?.stop();
    }, [recordingState]);

    return (
        <div className="flex flex-col items-center gap-4">
            {permissionDenied && (
                <p className="text-xs text-rose-400 px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30">
                    Microphone access denied. Please allow it in browser settings.
                </p>
            )}
            <div className="relative flex items-center justify-center">
                {isRecording && (
                    <>
                        <span className="absolute w-32 h-32 rounded-full border-2 border-red-400/40 animate-ping" />
                        <span className="absolute w-36 h-36 rounded-full border border-red-400/20 animate-ping" style={{ animationDelay: '0.3s' }} />
                    </>
                )}
                {isTranscribing && (
                    <span className="absolute w-32 h-32 rounded-full border-2 border-t-indigo-400 border-indigo-400/10 animate-spin" />
                )}
                <button
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    disabled={isTranscribing}
                    aria-pressed={isRecording}
                    className={`relative z-10 flex items-center justify-center w-24 h-24 rounded-full border-2 transition-all duration-300 select-none touch-none focus:outline-none
                        ${isRecording ? 'bg-red-500/20 border-red-400 text-red-400' :
                            isTranscribing ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300/50 cursor-not-allowed' :
                                'bg-indigo-500/20 border-indigo-500 text-indigo-400 hover:bg-indigo-500/30 hover:scale-105 active:scale-95'}`}
                >
                    {isRecording ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9"><path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" /></svg>
                    ) : isTranscribing ? (
                        <Loader2 size={32} className="animate-spin" />
                    ) : (
                        <Mic size={36} />
                    )}
                </button>
            </div>
            <div className="text-center">
                <p className={`text-sm font-bold transition-colors ${isRecording ? 'text-red-400' : isTranscribing ? 'text-indigo-300' : 'text-slate-200'}`}>
                    {isRecording ? 'Recording… release to stop' : isTranscribing ? 'Processing…' : 'Hold to speak'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                    {isRecording ? 'Speak clearly' : isTranscribing ? 'AI is analyzing…' : 'Hold & release'}
                </p>
            </div>
        </div>
    );
}

/* =========================================
   INLINE COMPONENT: TranscriptArea
   ========================================= */
function TranscriptArea({ recordingState, transcript }: { recordingState: RecordingState; transcript: string }) {
    const isRecording = recordingState === 'recording';
    const isTranscribing = recordingState === 'transcribing';
    return (
        <div className="w-full bg-[#161b22]/60 backdrop-blur-sm border border-white/5 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-indigo-400" />
                    <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">Live Transcript</span>
                </div>
                {isRecording && <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 uppercase tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />Recording</span>}
                {isTranscribing && <span className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />Transcribing</span>}
                {transcript && recordingState === 'idle' && <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest"><CheckCircle2 size={12} />Complete</span>}
            </div>
            <p className="text-base text-slate-200 leading-relaxed font-medium min-h-[2rem]">
                {transcript || (isRecording ? 'Listening…' : isTranscribing ? 'Transcribing your audio…' : 'Your message will appear here…')}
            </p>
        </div>
    );
}

/* =========================================
   INLINE COMPONENT: FeedbackTrafficLight
   ========================================= */
function FeedbackTrafficLight({ status }: { status: 'perfect' | 'warning' | 'error' }) {
    const cfg = {
        perfect: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25', label: 'Perfect Flow', Icon: CheckCircle2 },
        warning: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/25', label: 'Pattern Alert', Icon: AlertCircle },
        error: { color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/25', label: 'Needs Correction', Icon: AlertCircle },
    }[status] ?? { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/25', label: 'Pattern Alert', Icon: AlertCircle };
    const { color, bg, label, Icon } = cfg;
    return (
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${bg}`}>
            <Icon size={11} className={color} />
            <span className={`text-[9px] font-black uppercase tracking-wider ${color}`}>{label}</span>
        </div>
    );
}

/* =========================================
   INTERNAL: MetricBar (animated from 0)
   ========================================= */
function MetricBar({ label, value, gradient }: { label: string; value: number; gradient: string }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        const t = setTimeout(() => setDisplay(value), 80);
        return () => clearTimeout(t);
    }, [value]);
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-slate-500">
                <span>{label}</span>
                <span className="tabular-nums transition-all duration-700">{display}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${gradient}`}
                    style={{ width: `${display}%` }}
                />
            </div>
        </div>
    );
}

/* =========================================
   INTERNAL: SeverityDot
   ========================================= */
function SeverityDot({ severity }: { severity: number }) {
    const colors = [
        '',
        'bg-slate-500',      // 1 — minor
        'bg-blue-400',       // 2 — noticeable
        'bg-amber-400',      // 3 — confusing
        'bg-orange-500',     // 4 — blocking
        'bg-rose-500',       // 5 — critical
    ];
    const labels = ['', 'Minor', 'Noticeable', 'Confusing', 'Blocking', 'Critical'];
    const color = colors[Math.min(Math.max(severity, 1), 5)];
    const label = labels[Math.min(Math.max(severity, 1), 5)];
    return (
        <span className="flex items-center gap-1">
            <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        </span>
    );
}

/* =========================================
   INTERNAL: ErrorAnalysis
   ========================================= */
function ErrorAnalysis({ errors }: { errors: AiResponsePayload['error_analysis'] }) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    if (!errors || errors.length === 0) return null;
    const borderColors = [
        '',
        'border-slate-600/40',    // 1
        'border-blue-500/30',     // 2
        'border-amber-500/40',    // 3
        'border-orange-500/50',   // 4
        'border-rose-500/60',     // 5
    ];
    const bgColors = [
        '',
        'bg-slate-800/30',
        'bg-blue-950/30',
        'bg-amber-950/30',
        'bg-orange-950/30',
        'bg-rose-950/30',
    ];
    return (
        <div className="bg-[#161b22] border border-white/5 p-6 rounded-[2rem] space-y-3 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
                <AlertCircle size={14} className="text-rose-400" />
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">Error Analysis</span>
                <span className="ml-auto text-[9px] bg-rose-500/15 text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded-full font-bold">
                    {errors.length} found
                </span>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-rose-500/20 to-transparent mb-3" />
            <div className="space-y-2">
                {errors.map((err, i) => {
                    const sv = Math.min(Math.max(err.severity, 1), 5);
                    const isOpen = openIndex === i;
                    return (
                        <div key={i} className={`rounded-2xl border p-4 transition-all ${borderColors[sv]} ${bgColors[sv]}`}>
                            <button
                                onClick={() => setOpenIndex(isOpen ? null : i)}
                                className="w-full text-left"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            <span className="text-[9px] font-black uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-full text-slate-400 border border-white/10">
                                                {err.category}
                                            </span>
                                            <SeverityDot severity={err.severity} />
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-rose-300/80 line-through font-mono text-[11px]">{err.original}</span>
                                            <ArrowRight size={10} className="text-slate-500 shrink-0" />
                                            <span className="text-emerald-300 font-mono font-bold text-[11px]">{err.fix}</span>
                                        </div>
                                    </div>
                                    <ChevronDown size={14} className={`text-slate-500 shrink-0 mt-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                </div>
                            </button>
                            {isOpen && (
                                <p className="mt-3 text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                                    {err.pattern_logic}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* =========================================
   ROOT
   ========================================= */
export default function SpeakTechApp() {
    const [currentView, setCurrentView] = useState('landing');
    const [userRole, setUserRole] = useState('Frontend Developer');
    return (
        <div className="min-h-screen bg-[#080c14] text-slate-50 font-sans selection:bg-indigo-500/30">
            {currentView === 'landing'
                ? <LandingView onLogin={() => setCurrentView('dashboard')} />
                : <DashboardView onLogout={() => setCurrentView('landing')} userRole={userRole} setUserRole={setUserRole} />}
        </div>
    );
}

/* =========================================
   1. LANDING VIEW
   ========================================= */
function LandingView({ onLogin }: { onLogin: () => void }) {
    return (
        <div className="relative min-h-screen flex flex-col overflow-hidden bg-[#080c14]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] z-0" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] z-0" />
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/5 bg-[#080c14]/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Mic size={18} className="text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-100">SpeakTech</span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={onLogin} className="text-sm font-semibold text-slate-300 hover:text-white transition-colors hidden md:block">Iniciar Sesión</button>
                    <button onClick={onLogin} className="text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/10 px-6 py-2.5 rounded-full transition-all">Pruébalo Gratis</button>
                </div>
            </nav>
            <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 pt-20">
                <div className="mb-8 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 flex items-center gap-2">
                    <Zap size={14} className="text-indigo-400" />
                    <span className="text-xs font-semibold tracking-wider text-indigo-300 uppercase">AI English Coach · Beta</span>
                </div>
                <h1 className="text-[14vw] md:text-[9vw] leading-[0.9] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 text-center drop-shadow-2xl select-none">
                    Fluency
                </h1>
                <p className="mt-8 text-lg md:text-xl text-slate-400 font-medium max-w-2xl text-center leading-relaxed">
                    Master technical English through real simulations<br className="hidden md:block" /> powered by AI.
                </p>
                <button onClick={onLogin} className="mt-12 group flex items-center gap-2 bg-white text-black px-10 py-5 rounded-full font-bold text-lg hover:scale-105 transition-all duration-300 shadow-[0_0_50px_rgba(255,255,255,0.15)] hover:shadow-[0_0_70px_rgba(99,102,241,0.4)]">
                    Comenzar la simulación <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <span className="mt-4 text-xs text-slate-500 font-medium">No requiere tarjeta de crédito</span>
            </main>
        </div>
    );
}

/* =========================================
   2. DASHBOARD VIEW
   ========================================= */
function DashboardView({ onLogout, userRole, setUserRole }: { onLogout: () => void; userRole: string; setUserRole: (r: string) => void }) {
    const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
    const [recordingState, setRecordingState] = useState<RecordingState>('idle');
    const [transcript, setTranscript] = useState('');
    const [aiResponse, setAiResponse] = useState<AiResponsePayload | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    const [sessionActive, setSessionActive] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    // ── Firebase Auth: signInAnonymously ────────────────────────────────────
    useEffect(() => {
        if (!auth) return; // guard: Firebase not initialised
        const unsub = onAuthStateChanged(auth, setUser);
        signInAnonymously(auth).catch(err => console.error('[auth]', err));
        return () => unsub();
    }, []);

    // ── Data Moat: saveToDataset ─────────────────────────────────────────────
    const saveToDataset = useCallback(async (originalText: string, response: AiResponsePayload) => {
        if (!user || !db) return; // auth + firebase guard
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'conversations'), {
                userId: user.uid,
                userRole,
                originalText,
                reply: response.reply,
                feedback: response.feedback,
                corrected_version: response.corrected_version,
                phonetic_respelling: response.phonetic_respelling,
                suggested_pattern: response.suggested_pattern,
                status: response.status,
                metrics: response.metrics,
                error_analysis: response.error_analysis,
                timestamp: serverTimestamp(),
                appVersion: '1.0.0',
            });
            console.log('[firestore] ✓ Saved — user:', user.uid);
        } catch (err) {
            console.error('[firestore] Save failed (non-fatal):', err);
        }
    }, [user, userRole]);

    // ── Orchestrator: Transcribe → Chat ─────────────────────────────────────
    const handleRecordingStart = () => {
        setRecordingState('recording'); setTranscript(''); setAiResponse(null);
        setErrorMessage(null); setSessionActive(true);
    };

    const handleAudioReady = async (blob: Blob) => {
        setRecordingState('transcribing'); setErrorMessage(null);
        let transcribedText = '';

        // Phase A: Transcription
        try {
            const formData = new FormData();
            formData.append('audio', blob, 'audio.webm');
            const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
            if (!res.ok) {
                setTranscript(`Transcription failed (${res.status}).`);
                setRecordingState('idle'); return;
            }
            const rawText = await res.text();
            let data: { text?: string } = {};
            try { data = JSON.parse(rawText); } catch { /* ignore */ }
            transcribedText = data.text || '...';
            setTranscript(transcribedText);
        } catch {
            setTranscript('Sin conexión con el servicio de transcripción.');
            setRecordingState('idle'); return;
        }
        setRecordingState('idle');

        // Phase B: AI Analysis
        setIsThinking(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30_000); // 30s timeout para Gemini
        try {
            const chatRes = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: transcribedText, userRole, userId: user?.uid ?? 'anonymous' }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            const rawText = await chatRes.text();
            let chatData: (AiResponsePayload & { error?: string; code?: string }) | null = null;
            try { chatData = JSON.parse(rawText); } catch { /* ignore parse error */ }

            // AUDIT #5 — Edge Case C: responder con mensajes amigables según el código HTTP
            if (!chatRes.ok) {
                const friendlyMsg = chatData?.error
                    ?? (chatRes.status === 503
                        ? 'El coach de IA está temporalmente fuera de línea. Intenta en unos minutos.'
                        : chatRes.status === 400
                            ? 'El mensaje estaba vacío. Graba tu voz y vuelve a intentar.'
                            : 'El Tech Lead está ocupado. Intenta de nuevo en 30 segundos.');
                setErrorMessage(friendlyMsg);
                return;
            }

            // Si el backend devuelve un campo 'error' en el JSON (ej. short-input guard devuelve status payload)
            if (!chatData || ('error' in chatData && chatData.error && !chatData.reply)) {
                setErrorMessage(chatData?.error ?? 'El Tech Lead está ocupado, intenta de nuevo.');
                return;
            }

            setAiResponse(chatData as AiResponsePayload);
            saveToDataset(transcribedText, chatData as AiResponsePayload); // fire-and-forget
        } catch (err) {
            clearTimeout(timeoutId);
            const isTimeout = err instanceof DOMException && err.name === 'AbortError';
            console.error(isTimeout ? '[chat] Timeout después de 30s' : '[chat] Network error', err);
            setErrorMessage(isTimeout
                ? 'El análisis tardó demasiado. Verifica tu conexión e intenta con un mensaje más corto.'
                : 'Sin conexión con el coach de IA. Revisa tu internet e intenta de nuevo.');
        } finally { setIsThinking(false); }

    };

    // ── Scenario cards ───────────────────────────────────────────────────────
    const roleScenarios: Record<string, { id: number; title: string; desc: string; icon: React.ElementType }[]> = {
        'Frontend Developer': [
            { id: 1, title: 'Daily Standup', desc: 'Practice your technical updates.', icon: Coffee },
            { id: 2, title: 'Code Review', desc: 'Defend your latest PR architecture.', icon: Code },
            { id: 3, title: 'Negotiation', desc: 'Ask for a salary raise in English.', icon: DollarSign },
        ],
        'UX/UI Designer': [
            { id: 1, title: 'Daily Standup', desc: 'Update team on your wireframes.', icon: Coffee },
            { id: 2, title: 'Design Critique', desc: 'Justify UX and accessibility choices.', icon: Palette },
            { id: 3, title: 'Stakeholder Pitch', desc: 'Present the redesign to a client.', icon: MonitorPlay },
        ],
    };
    const currentScenarios = roleScenarios[userRole] ?? roleScenarios['Frontend Developer'];

    return (
        <div className="flex h-screen bg-[#0d1117]">
            {/* SIDEBAR */}
            <aside className="w-64 bg-[#010409] flex-col border-r border-white/5 hidden md:flex">
                <div className="p-4">
                    <button onClick={() => { setSessionActive(false); setAiResponse(null); setTranscript(''); }}
                        className="flex items-center gap-3 w-full hover:bg-white/5 text-slate-200 px-3 py-2.5 rounded-lg transition-colors border border-white/10">
                        <Plus size={16} /><span className="text-sm font-medium">Nueva Sesión</span>
                    </button>
                </div>
                <div className="flex-1" />
                <div className="p-4 border-t border-white/5 relative">
                    <button onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                        className="flex items-center gap-3 w-full hover:bg-white/5 px-2 py-2 rounded-lg transition-colors text-slate-300 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0">AM</div>
                        <div className="flex-1 text-left overflow-hidden">
                            <div className="text-sm font-medium">Alex M.</div>
                            <div className="text-[10px] text-indigo-400 truncate flex items-center justify-between">
                                <span>{userRole}</span><ChevronDown size={12} />
                            </div>
                        </div>
                    </button>
                    {isRoleMenuOpen && (
                        <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#161b22] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                            {Object.keys(roleScenarios).map(role => (
                                <button key={role} onClick={() => { setUserRole(role); setIsRoleMenuOpen(false); }}
                                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${userRole === role ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-300 hover:bg-white/5'}`}>
                                    {role}
                                </button>
                            ))}
                        </div>
                    )}
                    <button onClick={onLogout} className="flex items-center gap-3 w-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 px-2 py-2 rounded-lg transition-colors">
                        <LogOut size={16} /><span className="text-sm font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* MAIN */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* HEADER */}
                <header className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-[#0d1117]/80 backdrop-blur-md z-30 shrink-0">
                    <div className="text-[10px] font-black text-indigo-400 tracking-[0.2em] uppercase">{userRole} Simulation</div>
                    {/* Cloud Sync Active — visible when Firebase Auth is ready */}
                    {user && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20" title={`Synced as ${user.uid}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Cloud Sync Active</span>
                        </div>
                    )}
                    <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <Settings size={18} className="text-slate-400" />
                    </button>
                </header>

                {/* SCROLLABLE CONTENT */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
                    <div className="w-full max-w-3xl space-y-8 pb-56">

                        {/* VISTA 1 — Scenario picker */}
                        {!sessionActive ? (
                            <div className="flex flex-col items-center justify-center min-h-[60vh] pt-4">
                                <div className="mb-12 w-full text-center md:text-left">
                                    <h2 className="text-4xl md:text-5xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">Hola, Alex.</h2>
                                    <h3 className="text-4xl md:text-5xl font-semibold text-[#5f5f5f]">
                                        ¿Qué escenario de <span className="text-slate-300">{userRole}</span> practicaremos hoy?
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                    {currentScenarios.map(scenario => {
                                        const Icon = scenario.icon;
                                        return (
                                            <button key={scenario.id} onClick={() => setSessionActive(true)}
                                                className="bg-[#161b22] hover:bg-[#21262d] p-6 rounded-3xl flex flex-col items-start gap-4 transition-all hover:-translate-y-1 text-left border border-white/5 hover:border-white/10 group shadow-lg">
                                                <div className="p-2 rounded-xl bg-white/5 group-hover:bg-indigo-500/20 transition-colors">
                                                    <Icon size={24} className="text-indigo-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-slate-100 font-bold mb-1">{scenario.title}</h4>
                                                    <p className="text-xs text-slate-500 leading-relaxed">{scenario.desc}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            /* VISTA 2 — Active simulation + Feedback */
                            <div className="space-y-6" style={{ animation: 'fadeInUp 0.4s ease-out both' }}>

                                {(transcript || recordingState !== 'idle') && (
                                    <TranscriptArea recordingState={recordingState} transcript={transcript} />
                                )}

                                {isThinking && (
                                    <div className="flex items-center gap-3 text-indigo-400 animate-pulse bg-indigo-500/5 p-6 rounded-[2rem] border border-indigo-500/20">
                                        <Loader2 size={20} className="animate-spin" />
                                        <span className="text-xs font-black tracking-[0.15em] uppercase">Alex Chen is analyzing your English…</span>
                                    </div>
                                )}

                                {/* Error banner */}
                                {errorMessage && !isThinking && (
                                    <div className="flex items-center gap-3 bg-rose-500/8 border border-rose-500/25 text-rose-400 px-5 py-4 rounded-2xl" style={{ animation: 'fadeInUp 0.3s ease-out both' }}>
                                        <AlertCircle size={18} className="shrink-0" />
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs font-bold">{errorMessage}</span>
                                            <span className="text-[10px] text-rose-400/60">Presiona el micrófono para intentar de nuevo.</span>
                                        </div>
                                        <button onClick={() => setErrorMessage(null)} className="ml-auto text-rose-400/60 hover:text-rose-400 p-1 transition-colors">✕</button>
                                    </div>
                                )}

                                {/* Pro-Dataset Feedback */}
                                {aiResponse && !isThinking && (
                                    <div className="space-y-5" style={{ animation: 'fadeInUp 0.4s ease-out both' }}>

                                        {/* 1. Alex Chen reply */}
                                        <div className="flex items-start gap-4 bg-[#161b22] border border-white/5 p-6 rounded-[2.5rem] shadow-2xl">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 font-black shadow-lg shadow-indigo-500/20 text-sm">AC</div>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-slate-100 text-sm">Alex Chen</span>
                                                    <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full uppercase tracking-tighter font-black border border-indigo-500/25">Lead AI Coach</span>
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                                        <span className="w-1 h-1 rounded-full bg-green-400" />Online
                                                    </span>
                                                </div>
                                                <p className="text-slate-300 leading-relaxed text-sm md:text-base">&ldquo;{aiResponse.reply}&rdquo;</p>
                                            </div>
                                        </div>

                                        {/* 2. AI Coach card */}
                                        <div className="bg-[#161b22] border border-amber-500/15 p-6 rounded-[2rem] shadow-xl">
                                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                                                <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">AI Coach Feedback</span>
                                                <FeedbackTrafficLight status={aiResponse.status ?? 'warning'} />
                                            </div>
                                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent mb-4" />
                                            <p className="text-sm text-slate-300 leading-relaxed">{aiResponse.feedback}</p>
                                        </div>

                                        {/* 3. Pro-Fix + Growth Metrics grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-[#1c2128] border border-emerald-500/15 p-6 rounded-[2rem] space-y-4 shadow-xl">
                                                <div className="flex items-center gap-2 text-emerald-400">
                                                    <CheckCircle2 size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Pro-Fix</span>
                                                </div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Corrected Version</span>
                                                        <p className="text-base font-bold text-emerald-300 leading-snug mt-1">&ldquo;{aiResponse.corrected_version}&rdquo;</p>
                                                    </div>
                                                    {/* Phonetic Guide — visible completo, sin truncar */}
                                                    <div className="bg-indigo-950/60 border border-indigo-500/25 rounded-2xl p-4 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <Play size={10} fill="currentColor" className="text-indigo-400" />
                                                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Phonetic Guide</span>
                                                        </div>
                                                        <code className="block text-sm font-mono text-indigo-200 font-bold leading-relaxed break-words whitespace-pre-wrap">{aiResponse.phonetic_respelling}</code>
                                                        <p className="text-[9px] text-indigo-400/60 font-medium">🔁 Repite esta frase 3 veces en voz alta</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-[#1c2128] border border-white/10 p-6 rounded-[2rem] space-y-5 shadow-xl">
                                                <div className="flex items-center gap-2 text-indigo-400">
                                                    <BarChart3 size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Growth Metrics</span>
                                                </div>
                                                <div className="space-y-4">
                                                    <MetricBar label="Grammar" value={aiResponse.metrics.grammar_accuracy} gradient="bg-gradient-to-r from-indigo-500 to-purple-500" />
                                                    <MetricBar label="Tech Precision" value={aiResponse.metrics.technical_precision} gradient="bg-gradient-to-r from-cyan-500 to-blue-500" />
                                                    <MetricBar label="Fluency" value={aiResponse.metrics.fluency_flow} gradient="bg-gradient-to-r from-amber-400 to-orange-500" />
                                                    <MetricBar label="Native Vibe" value={aiResponse.metrics.native_vibe} gradient="bg-gradient-to-r from-rose-500 to-pink-500" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* 4. Error Analysis */}
                                        {aiResponse.error_analysis && aiResponse.error_analysis.length > 0 && (
                                            <ErrorAnalysis errors={aiResponse.error_analysis} />
                                        )}

                                        {/* 5. Power Chunk Mission */}
                                        <div className="bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent border border-indigo-500/25 p-8 rounded-[2.5rem] flex items-center justify-between gap-6 shadow-2xl relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-2 text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors pointer-events-none"><Target size={120} /></div>
                                            <div className="space-y-3 relative z-10">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">
                                                    <Zap size={14} fill="currentColor" /> Pattern Mission
                                                </div>
                                                <p className="text-xs text-slate-400 font-medium">Repeat this pattern 5 times today until it feels automatic:</p>
                                                <code className="block text-base font-mono font-bold text-indigo-200 tracking-wide bg-indigo-500/10 border border-indigo-500/25 px-4 py-2.5 rounded-xl">
                                                    {aiResponse.suggested_pattern}
                                                </code>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* FLOATING MIC */}
                <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center bg-gradient-to-t from-[#080c14] via-[#080c14]/90 to-transparent z-40 pointer-events-none">
                    <div className="bg-[#161b22]/90 backdrop-blur-2xl border border-white/10 px-10 py-8 rounded-[4rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] flex flex-col items-center pointer-events-auto">
                        <MicrophoneButton recordingState={recordingState} onRecordingStart={handleRecordingStart} onAudioReady={handleAudioReady} />
                    </div>
                </div>
            </main>
        </div>
    );
}
