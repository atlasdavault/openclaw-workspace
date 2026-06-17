/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        p3: { DEFAULT: '#CC0000', bright: '#EE2222', dim: '#990000' },
        atlas: { DEFAULT: '#00e5ff', dim: '#00b4d8' },
        claude: { DEFAULT: '#ff6b35', dim: '#cc5520' },
        ollama: { DEFAULT: '#39ff14', dim: '#00cc44' },
        dark: { DEFAULT: '#0a0a0f', card: '#0d0d1a', border: '#1a1a2e' }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
