// app/layout.js
export const metadata = {
  title: 'Otimização de Doação de Órgãos',
  description: 'TCC Frontend',
}

export default function RootLayout({ children }) {
 return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
