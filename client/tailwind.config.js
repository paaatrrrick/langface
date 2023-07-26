/** @type {import('tailwindcss').Config} */
// document.documentElement.style.setProperty('--brandColor', '#625df4');
// document.documentElement.style.setProperty('--brandOffColor', '#e0e1f7');
// document.documentElement.style.setProperty('--mainDark', '#212121');
// document.documentElement.style.setProperty('--lightDark', '#212121');
// document.documentElement.style.setProperty('--darkerBackground', '#f7f7f8');
// document.documentElement.style.setProperty('--lighterBackground', '#fff');
// document.documentElement.style.setProperty('--blackFiler', 'invert(0%) sepia(1%) saturate(7438%) hue-rotate(123deg) brightness(107%) contrast(100%)');
// } else {
// document.documentElement.style.setProperty('--brandColor', '#625df4');
// document.documentElement.style.setProperty('--brandOffColor', '#fff');
// document.documentElement.style.setProperty('--mainDark', '#fff');
// document.documentElement.style.setProperty('--lightDark', '#f7f7f8');
// document.documentElement.style.setProperty('--darkerBackground', '#0e0e0e');
// document.documentElement.style.setProperty('--lighterBackground', '#212121');
// document.documentElement.style.setProperty('--blackFiler', 'invert(100%) sepia(100%) saturate(0%) hue-rotate(83deg) brightness(108%) contrast(101%)');


module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      sm: '480px',
      md: '768px',
      lg: '976px',
      xl: '1440px',
    },
    //add font size in px
    fontSize: {
      'xs': '8px',
      'sm': '12px',
      'base': '16px',
      '18px': '18px',
      'lg': '20px',
      'xl': '24px',
      '2xl': '32px',
      '3xl': '48px',
      '4xl': '64px',
    },
    colors: {
      'brandColor': '#625df4',
      'brand2': '#e0e1f7',
      'light2': '#f7f7f8',
      'mainDark': '#212121',
      'mainWhite': '#fff',
    },
    extend: {
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
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
    }
  },
  plugins: [],
}