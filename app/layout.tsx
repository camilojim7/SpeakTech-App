import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
})

export const metadata: Metadata = {
    title: 'SpeakTech – English Simulator for Developers',
    description:
        'Practice your English in technical interviews and daily standups with AI-powered feedback tailored for software engineers.',
    keywords: ['english', 'interview', 'standup', 'simulator', 'developers', 'programming'],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-surface-950 text-white antialiased`}>
                {children}
            </body>
        </html>
    )
}
