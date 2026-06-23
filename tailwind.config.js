/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 따뜻하고 포근한 파스텔 팔레트
        cream: '#FFF8F0',
        toast: '#F4D9A0',
        crust: '#C99A5B',
        cozy: '#FBE3D6',
        cocoa: '#6B4F3A',
        milk: '#FFFDFA',
        mint: '#BFE3D0',
        sky: '#CDE7F0',
        dusk: '#3A2E4A',
        heartpink: '#F5849B',
        ecogreen: '#7BC47F',
        gold: '#F2B441',
      },
      fontFamily: {
        round: ['"Jua"', '"Gaegu"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pop: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        heartfloat: {
          '0%': { transform: 'translateY(0) scale(0.8)', opacity: '0' },
          '20%': { opacity: '1' },
          '100%': { transform: 'translateY(-70px) scale(1.3)', opacity: '0' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        rain: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '30%': { opacity: '0.7' },
          '100%': { transform: 'translateY(120px)', opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        floaty: 'floaty 3s ease-in-out infinite',
        pop: 'pop 0.4s ease-out',
        heartfloat: 'heartfloat 1.1s ease-out forwards',
        wiggle: 'wiggle 0.6s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        rain: 'rain 0.9s linear infinite',
        slideUp: 'slideUp 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
