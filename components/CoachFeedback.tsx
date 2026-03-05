'use client'

interface CoachFeedbackProps {
    feedback: string | null
    isThinking: boolean
}

export default function CoachFeedback({ feedback, isThinking }: CoachFeedbackProps) {
    if (!isThinking && !feedback) return null

    return (
        <article
            className="w-full rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-500/5 via-surface-800/80 to-surface-800/60
                 backdrop-blur-sm p-5 flex flex-col gap-3 shadow-[0_0_40px_rgba(251,191,36,0.06)] animate-fade-in-up"
            style={{ animationDelay: '120ms' }}
            aria-label="AI Coach feedback"
        >
            {/* Header */}
            <header className="flex items-center gap-2.5">
                {/* Icon badge */}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-400/30 flex items-center justify-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4 text-amber-400"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>

                <div>
                    <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">AI Coach Feedback</p>
                    <p className="text-xs text-slate-500">Language & fluency tip</p>
                </div>

                {isThinking && (
                    <div className="ml-auto status-badge bg-amber-400/10 border border-amber-400/20 text-amber-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Analyzing…
                    </div>
                )}
            </header>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />

            {/* Content */}
            {isThinking && !feedback ? (
                /* Skeleton loading lines */
                <div className="flex flex-col gap-2 pt-1">
                    <div className="h-3 rounded-full bg-white/5 animate-pulse w-full" />
                    <div className="h-3 rounded-full bg-white/5 animate-pulse w-3/4" />
                </div>
            ) : (
                <p className="text-sm text-slate-300 leading-relaxed">{feedback}</p>
            )}
        </article>
    )
}
