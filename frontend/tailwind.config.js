/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // Adicione "./pages/**/*.{js,ts,jsx,tsx,mdx}" se você também usar a pasta pages
    // Adicione "./components/**/*.{js,ts,jsx,tsx,mdx}" se sua pasta components estiver na raiz de frontend/
    // Se components está dentro de app/, o primeiro caminho já cobre.
    // Para sua estrutura atual, onde components está em app/components:
    // O caminho "./app/**/*.{js,ts,jsx,tsx,mdx}" já inclui "./app/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      // Exemplo de como estender o tema:
      // colors: {
      //  'brand-blue': '#007bff',
      //  'brand-green': '#28a745',
      // },
      // fontFamily: {
      //   sans: ['Inter', 'sans-serif'], // Exemplo de fonte customizada
      // },
    },
  },
  plugins: [],
}
