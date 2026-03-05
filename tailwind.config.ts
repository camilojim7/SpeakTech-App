/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                surface: {
                    950: '#080c14',
                    900: '#0d1117',
                    800: '#161b27',
                    700: '#1e2636',
                },
                brand: {
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                },
                // Dashboard UI palette
                ui: {
                    sidebar: '#171717',
                    main: '#212121',
                    input: '#2f2f2f',
                    hover: '#2a2a2a',
                    border: '#383838',
                    muted: '#8e8ea0',
                },
                indigo: {
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                },
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
                    '100%': { boxShadow: '0 0 40px rgba(59, 130, 246, 0.6), 0 0 80px rgba(59, 130, 246, 0.2)' },
                },
            },
        },
    },
    plugins: [],
}
