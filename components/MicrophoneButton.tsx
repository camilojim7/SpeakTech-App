'use client'

import { useRef, useState, useCallback } from 'react'

export type RecordingState = 'idle' | 'recording' | 'transcribing'

interface MicrophoneButtonProps {
    recordingState: RecordingState
    onAudioReady: (blob: Blob) => void
    onRecordingStart: () => void
}

export default function MicrophoneButton({
    recordingState,
    onAudioReady,
    onRecordingStart,
}: MicrophoneButtonProps) {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const [permissionDenied, setPermissionDenied] = useState(false)

    const isRecording = recordingState === 'recording'
    const isTranscribing = recordingState === 'transcribing'
    const isIdle = recordingState === 'idle'

    // ── Start recording when the user presses the button ────────────────────
    const handlePointerDown = useCallback(async () => {
        if (!isIdle) return // ignore if already busy

        setPermissionDenied(false)
        chunksRef.current = []

        let stream: MediaStream
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        } catch {
            console.warn('Microphone permission denied or unavailable.')
            setPermissionDenied(true)
            return
        }

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : 'audio/webm'

        const recorder = new MediaRecorder(stream, { mimeType })
        mediaRecorderRef.current = recorder

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data)
        }

        recorder.onstop = () => {
            // Stop all mic tracks to release the browser indicator
            stream.getTracks().forEach((t) => t.stop())
            const blob = new Blob(chunksRef.current, { type: mimeType })
            onAudioReady(blob)
        }

        recorder.start(100) // collect chunks every 100 ms
        onRecordingStart()
    }, [isIdle, onAudioReady, onRecordingStart])

    // ── Stop recording when the user releases the button ────────────────────
    const handlePointerUp = useCallback(() => {
        if (recordingState !== 'recording') return
        mediaRecorderRef.current?.stop()
    }, [recordingState])

    // Status label & sub-label
    const label = isRecording
        ? 'Recording… release to stop'
        : isTranscribing
            ? 'Transcribing…'
            : 'Start Standup'

    const subLabel = isRecording
        ? 'Speak clearly — AI is listening'
        : isTranscribing
            ? 'Your words are being processed…'
            : 'Hold to record your daily standup'

    return (
        <div className="flex flex-col items-center gap-5">
            {/* Permission error */}
            {permissionDenied && (
                <p className="text-xs text-red-400 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
                    Microphone access was denied. Please allow it in your browser settings.
                </p>
            )}

            {/* Animated ring container */}
            <div className={`relative flex items-center justify-center ${isRecording ? 'mic-recording' : ''}`}>
                {/* Expanding rings (only while recording) */}
                {isRecording && (
                    <>
                        <span
                            aria-hidden="true"
                            className="ring-1 absolute w-32 h-32 rounded-full border-2 border-brand-400/50"
                        />
                        <span
                            aria-hidden="true"
                            className="ring-2 absolute w-32 h-32 rounded-full border-2 border-brand-400/30"
                        />
                    </>
                )}

                {/* Spinner ring (while transcribing) */}
                {isTranscribing && (
                    <span
                        aria-hidden="true"
                        className="absolute w-32 h-32 rounded-full border-2 border-t-brand-400 border-brand-400/10 animate-spin"
                    />
                )}

                {/* Main button */}
                <button
                    id="start-standup-btn"
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}  // release if cursor leaves while held
                    disabled={isTranscribing}
                    aria-pressed={isRecording}
                    aria-label={label}
                    className={`
            relative z-10 mic-icon
            flex items-center justify-center
            w-24 h-24 rounded-full
            border-2 transition-all duration-300 ease-out
            focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-4 focus:ring-offset-surface-950
            select-none touch-none
            ${isRecording
                            ? 'bg-red-500/20 border-red-400 text-red-400 glow-blue'
                            : isTranscribing
                                ? 'bg-brand-500/10 border-brand-500/40 text-brand-300/50 cursor-not-allowed'
                                : 'bg-brand-500/20 border-brand-500 text-brand-400 hover:bg-brand-500/30 hover:scale-105 hover:glow-blue active:scale-95'
                        }
          `}
                >
                    {isRecording ? (
                        /* Stop/Record-active icon */
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9" aria-hidden="true">
                            <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" />
                        </svg>
                    ) : isTranscribing ? (
                        /* Hourglass / processing icon */
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" aria-hidden="true">
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        /* Microphone icon */
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9" aria-hidden="true">
                            <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                            <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Status labels */}
            <div className="flex flex-col items-center gap-1.5">
                <span className={`text-base font-semibold transition-colors duration-300 ${isRecording ? 'text-red-400' : isTranscribing ? 'text-brand-300' : 'text-white'}`}>
                    {label}
                </span>
                <span className="text-xs text-slate-500">
                    {subLabel}
                </span>
            </div>
        </div>
    )
}
