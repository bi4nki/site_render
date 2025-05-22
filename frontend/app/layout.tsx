// app/layout.js
export const metadata = {
  title: 'Otimização de Doação de Órgãos',
  description: 'TCC Frontend',
}
import Link from 'next/link'; // Adicione se não tiver

export const metadata = { /* ... */ };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav style={{ padding: '10px', backgroundColor: '#f0f0f0', marginBottom: '20px' }}>
          <Link href="/" style={{ marginRight: '15px' }}>Home</Link>
          <Link href="/optimize" style={{ marginRight: '15px' }}>Otimizar Transporte</Link>
          <Link href="/hospitals" style={{ marginRight: '15px' }}>Hospitais</Link>
          {/* Adicionar outros links aqui (Órgãos, Doadores, Receptores) quando criar as páginas */}
        </nav>
        <main style={{ padding: '0 20px' }}>
            {children}
        </main>
      </body>
    </html>
  );
}
