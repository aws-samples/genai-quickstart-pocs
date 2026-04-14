/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'amazon-ember': ['Amazon Ember', 'Helvetica', 'Arial', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        squid: '#232f3e',
        squid2: '#131921',
        'amazon-orange': '#ff9900',
        'aws-blue': '#0073bb',
      },
    },
  },
  plugins: [],
};
