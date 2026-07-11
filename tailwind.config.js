/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        lime: '#C6FF00',
        ink: '#0A0A0A',
        soft: '#F5F5F2',
        line: '#E8E8E3',
        muted: '#6B6B6B'
      },
      boxShadow: {
        card: '0 10px 30px rgba(0,0,0,0.06)'
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.75rem'
      }
    },
  },
  plugins: [],
}
