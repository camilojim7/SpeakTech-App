import Link from 'next/link'

export default function Header() {
    return (
        <header className="w-full flex items-center justify-between">
            {/* Logo / Brand */}
            <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center group-hover:bg-brand-400 transition-colors duration-200">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4 text-white"
                        aria-hidden="true"
                    >
                        <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                        <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
                    </svg>
                </div>
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-brand-400 transition-colors duration-200">
                    Speak<span className="text-brand-400 group-hover:text-white transition-colors duration-200">Tech</span>
                </span>
            </Link>

            {/* Nav links (placeholder for future pages) */}
            <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-400">
                <span className="cursor-default px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white font-medium text-xs">
                    Standup
                </span>
                <span className="hover:text-white transition-colors duration-200 cursor-not-allowed opacity-40" title="Coming soon">
                    Interview
                </span>
                <span className="hover:text-white transition-colors duration-200 cursor-not-allowed opacity-40" title="Coming soon">
                    Code Review
                </span>
            </nav>
        </header>
    )
}
