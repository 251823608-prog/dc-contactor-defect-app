/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        severity: {
          critical: '#DC2626',
          major: '#EA580C',
          minor: '#CA8A04',
          trivial: '#16A34A',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
