/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        blink: "blink 1s step-start infinite",
      },
      keyframes: {
        blink: {
          "0%, 100%": { borderColor: "transparent" },
          "50%": { borderColor: "#3b82f6" }, // Tailwind blue-500
        },
      },
      colors: {
        richblack: '#111111',     // very dark, slightly soft black
        jetblack: '#1A1A1A',      // true jet-like black
        raisinblack: '#202020',   // muted, slightly brown-black
        onyx: '#353535',          // warm dark gray-black
        trueblack: '#000000',     // pure black (for contrast only)
      },
    },
  },
  plugins: [],
};
