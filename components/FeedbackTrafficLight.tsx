'use client'

// ─── Types ────────────────────────────────────────────────────────────────────
export type TrafficStatus = 'perfect' | 'warning' | 'error'

interface FeedbackTrafficLightProps {
    status: TrafficStatus
}

// ─── Theme config ─────────────────────────────────────────────────────────────
const THEMES = {
    perfect: {
        pill: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        label: 'Perfect flow!',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
            </svg>
        ),
    },
    warning: {
        pill: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        label: 'Good, but watch your fillers/grammar',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
        ),
    },
    error: {
        pill: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
        label: 'Needs correction',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
            </svg>
        ),
    },
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FeedbackTrafficLight({ status }: FeedbackTrafficLightProps) {
    const theme = THEMES[status] ?? THEMES.warning

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${theme.pill}`}>
            {theme.icon}
            {theme.label}
        </span>
    )
}
