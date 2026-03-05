'use client'

import type { RecordingState } from '@/components/MicrophoneButton'

interface TranscriptAreaProps {
    recordingState: RecordingState
    transcript: string
}

export default function TranscriptArea({ recordingState, transcript }: TranscriptAreaProps) {
    const isRecording = recordingState === 'recording'
    const isTranscribing = recordingState === 'transcribing'
    const isEmpty = !transcript && recordingState === 'idle'

    return (
        <section className="w-full flex flex-col gap-3" aria-label="Transcript output">
            {/* Section header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Transcript
                </h2>

                {isRecording && (
                    <div className="status-badge bg-red-500/10 border border-red-500/30 text-red-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                        Recording
                    </div>
                )}

                {isTranscribing && (
                    <div className="status-badge bg-brand-500/10 border border-brand-500/30 text-brand-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                        Transcribing…
                    </div>
                )}

                {recordingState === 'idle' && transcript && (
                    <div className="status-badge bg-green-500/10 border border-green-500/30 text-green-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                        </svg>
                        Complete
                    </div>
                )}
            </div>

            {/* Output box */}
            <div
                id="transcript-output"
                role="log"
                aria-live="polite"
                aria-label="Speech transcript"
                className={`transcript-area relative transition-all duration-500 ${isRecording
                        ? 'border-red-500/30 shadow-[0_0_0_1px_rgba(239,68,68,0.15),0_0_30px_rgba(239,68,68,0.08)]'
                        : isTranscribing
                            ? 'border-brand-500/30 shadow-[0_0_0_1px_rgba(59,130,246,0.15),0_0_30px_rgba(59,130,246,0.08)]'
                            : ''
                    }`}
            >
                {/* Empty state */}
                {isEmpty && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-600 select-none">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 opacity-30" aria-hidden="true">
                            <path d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97Z" />
                        </svg>
                        <p className="text-sm font-mono">
                            Your transcript will appear here…
                        </p>
                        <p className="text-xs opacity-60">
                            Hold <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-xs">Start Standup</kbd> to record
                        </p>
                    </div>
                )}

                {/* Listening state — recording but no text yet */}
                {isRecording && !transcript && (
                    <p className="text-slate-500 font-mono text-sm cursor-blink">
                        Listening…
                    </p>
                )}

                {/* Transcribing state */}
                {isTranscribing && !transcript && (
                    <p className="text-brand-300/60 font-mono text-sm animate-pulse">
                        Transcribing your audio…
                    </p>
                )}

                {/* Transcript content */}
                {transcript && (
                    <p className={`text-slate-200 font-mono text-sm leading-relaxed whitespace-pre-wrap ${isRecording ? 'cursor-blink' : ''}`}>
                        {transcript}
                    </p>
                )}
            </div>

            {/* Tips row */}
            <p className="text-center text-xs text-slate-600">
                Tip: Try saying — &ldquo;Yesterday I worked on the login API, today I&rsquo;ll fix the auth bug, no blockers.&rdquo;
            </p>
        </section>
    )
}
