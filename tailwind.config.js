/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        panel: '#12121a',
        border: '#2a2a3d',
        accent: '#f7c948',
        'pixel-green': '#3ddc84',
        'pixel-red': '#ff4f5e',
        'pixel-blue': '#4fc3f7',
        'pixel-purple': '#c084fc',
        'pixel-orange': '#fb923c',
        'pixel-dim': '#6b7280',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        vt: ['VT323', 'monospace'],
      },
    },
  },
  plugins: [],
};
