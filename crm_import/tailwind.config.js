/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                heading: ['var(--font-manrope)', 'Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            colors: {
                'emerald-deep': '#064e3b',
                copper: {
                    DEFAULT: '#b86b34',
                    600: '#a95c2d',
                    dark: '#8d5228',
                },
            },
        },
    },
    plugins: [],
}
