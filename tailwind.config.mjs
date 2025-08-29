/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        fontFamily: {         
          inter: ["var(--font-inter)"],
        },
      },
    },
    variants: {
    extend: {
      display: ['portrait', 'landscape'],
    },
  },
    plugins: [
    function ({ addVariant }) {
      addVariant('portrait', '@media (orientation: portrait)');
      addVariant('landscape', '@media (orientation: landscape)');
    },
  ],
  };
  