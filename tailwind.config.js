/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1cc7b6',        // Verde turquesa principal
        primaryAlt: '#4fd1c5',     // Turquesa claro
        accent: '#38bdf8',         // Azul claro de acento
        background: '#e0f7fa',     // Celeste muy suave
        backgroundSoft: '#b2f5ea', // Celeste pastel
        text: '#134e4a',           // Texto fuerte, verde oscuro
        border: '#b2f5ea',         // Borde celeste pastel
        borderStrong: '#4fd1c5',   // Borde turquesa
      },
    },
  },
  plugins: [],
}
