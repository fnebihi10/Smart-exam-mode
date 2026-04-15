/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      boxShadow: {
        'depth-sm': 'var(--shadow-sm)',
        'depth-md': 'var(--shadow-md)',
        'depth-lg': 'var(--shadow-lg)',
        'depth-xl': 'var(--shadow-xl)',
        'glow-primary': 'var(--shadow-glow-primary)',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInScale: {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(var(--color-primary-rgb), 0.4)' },
          '70%': { boxShadow: '0 0 0 8px rgba(var(--color-primary-rgb), 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(var(--color-primary-rgb), 0)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        'typing-dot': {
          '0%, 80%, 100%': { opacity: '0.35', transform: 'translateY(0)' },
          '40%': { opacity: '1', transform: 'translateY(-3px)' },
        },
        'success-pop': {
          '0%': { transform: 'scale(0.95)' },
          '60%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        'border-dance': {
          '0%': { backgroundPosition: '0 0, 100% 100%' },
          '100%': { backgroundPosition: '200% 0, -200% 100%' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.45s ease-out both',
        fadeInScale: 'fadeInScale 0.45s ease-out both',
        slideInRight: 'slideInRight 0.45s ease-out both',
        shimmer: 'shimmer 1.2s linear infinite',
        'pulse-ring': 'pulse-ring 1.6s ease-out infinite',
        'spin-slow': 'spin-slow 1s linear infinite',
        float: 'float 3s ease-in-out infinite',
        shake: 'shake 0.4s ease-in-out both',
        'typing-dot': 'typing-dot 1.2s ease-in-out infinite',
        'success-pop': 'success-pop 0.42s ease-out both',
        'border-dance': 'border-dance 1.5s linear infinite',
      },
    },
  },
  plugins: [],
}
