'use client'

interface TechLeadReplyProps {
    reply: string | null
    isThinking: boolean
}

export default function TechLeadReply({ reply, isThinking }: TechLeadReplyProps) {
    if (!isThinking && !reply) return null

    return (
        <article
            className="response-card w-full flex flex-col gap-4 animate-fade-in-up"
            aria-label="Tech Lead reply"
        >
            {/* Card header */}
            <header className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-5 h-5 text-white"
                            aria-hidden="true"
                        >
                            <path
                                fillRule="evenodd"
                                d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    {/* Online indicator */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-surface-800" />
                </div>

                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white leading-tight">Alex Chen</span>
                    <span className="text-xs text-slate-500">Tech Lead · Engineering</span>
                </div>

                {/* Typing badge */}
                {isThinking && (
                    <div className="ml-auto status-badge bg-brand-500/10 border border-brand-500/30 text-brand-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                        typing…
                    </div>
                )}
            </header>

            {/* Message bubble */}
            <div className="pl-12">
                {isThinking && !reply ? (
                    /* Typing indicator dots */
                    <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm bg-surface-700/60 border border-white/5 w-fit">
                        <span className="typing-dot w-2 h-2 rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                        <span className="typing-dot w-2 h-2 rounded-full bg-slate-400" style={{ animationDelay: '200ms' }} />
                        <span className="typing-dot w-2 h-2 rounded-full bg-slate-400" style={{ animationDelay: '400ms' }} />
                    </div>
                ) : (
                    <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-surface-700/60 border border-white/8 backdrop-blur-sm">
                        <p className="text-slate-200 text-sm leading-relaxed">{reply}</p>
                    </div>
                )}
            </div>
        </article>
    )
}
