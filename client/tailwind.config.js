/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0A0D14',
        surface: '#11151F',
        raised: '#161B26',
        border: 'rgba(255,255,255,0.08)',
        accent: {
          blue: '#5B8DEF',
          purple: '#A855F7',
          violet: '#8B5CF6',
        },
        success: '#34D399',
        warning: '#FBBF24',
        danger: '#F87171',
        muted: '#8B93A7',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #5B8DEF 0%, #A855F7 100%)',
        'glow-radial': 'radial-gradient(circle at 30% 20%, rgba(91,141,239,0.15), transparent 60%)',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.35)',
        glow: '0 0 24px rgba(139,92,246,0.25)',
      },
      backdropBlur: {
        glass: '16px',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.75 },
        },
      },
      animation: {
        flicker: 'flicker 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
