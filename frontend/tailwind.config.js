/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'naya': {
                    teal: '#29a08e',      // Primary accent (logo/brand)
                    'teal-hover': '#228377',
                    dark: '#212121',      // Primary text
                    divider: '#e0e0e0',   // Borders/dividers
                },
            },
        },
    },
    plugins: [],
}
