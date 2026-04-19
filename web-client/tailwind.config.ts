import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#7f5af0',
        'primary-hover': '#6b46e0',
        secondary: '#666666',
        background: '#16161a',
        surface: '#242629',
        'surface-hover': '#2e3035',
        text: '#fffffe',
        subtle: '#94a1b2',
        border: '#3a3d44',
        success: '#2cb67d',
        warning: '#f4c430',
        danger: '#ef4565',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 1.5s linear infinite',
        'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        skeleton: 'shimmer 2s infinite linear',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
