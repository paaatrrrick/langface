// /** @type {import('tailwindcss').Config} */
// const defaultTheme = require('tailwindcss/defaultTheme')


const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
  module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    fontSize: {
      "10": '10px',
      "12": '12px',
      "14": '14px',
      '18': '18px',
      '20': '20px',
      "22": '22px',
      "24": '24px',
      "32": '32px',
      "34": '34px',
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.5rem' }],
      base: ['1rem', { lineHeight: '1.75rem' }],
      lg: ['1.125rem', { lineHeight: '2rem' }],
      xl: ['1.25rem', { lineHeight: '2rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['2rem', { lineHeight: '2.5rem' }],
      '4xl': ['32px', { lineHeight: '3.5rem' }],
      '5xl': ['3rem', { lineHeight: '3.5rem' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1.1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
      '9xl': ['8rem', { lineHeight: '1' }],
    },
    margin: {
      auto: 'auto',
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '48px',
      "4px": '4px',
      "8px": '8px',
      "12px": '12px',
      "15px": '15px',
      "16px": '16px',
      "20px": '20px',
      "24px": '24px',
      "32px": '32px',
      "40px": '40px',
      "48px": '48px',
      "56px": '56px',
    },

    colors: {
      'brandColor': '#625df4',
      'brandColor2': '#e0e1f7',
      'lightGray': '#e5e7eb',
      'l-b2': '#e0e1f7',
      'l-l2': '#f7f7f8',
      'd-d2': '#f7f7f8',
      'd-l2': '#0e0e0e',
      'mainDark': '#212121',
      'mainWhite': '#fff',
    },
    extend: {
      borderRadius: {
        '4xl': '2rem',
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        display: ['Lexend', ...defaultTheme.fontFamily.sans],
      },
      maxWidth: {
        '2xl': '40rem',
      },
      padding: {
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '48px',
      },
      margin: {
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '48px',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}