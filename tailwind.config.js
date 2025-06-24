/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'neon-blue': '#00ffff',
        'neon-pink': '#ff00ff',
        'neon-green': '#00ff00',
        'dark-metal': '#1a1a1a',
        'dark-gray': '#0a0a0a',
        'metal-gray': '#2d2d2d',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-neon': 'pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: {
          'from': { textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff' },
          'to': { textShadow: '0 0 20px #00ffff, 0 0 30px #00ffff, 0 0 40px #00ffff' }
        },
        'pulse-neon': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' }
        }
      },
      fontFamily: {
        'tech': ['Orbitron', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}