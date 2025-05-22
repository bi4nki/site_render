// frontend/app/layout.tsx
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
"./globals.css';

// Opcional: Se você quiser usar uma fonte específica via next/font
// import { Inter } from 'next/font/google'
// const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Otimização de Doação de Órgãos - TCC', // Título mais descritivo
  description: 'Sistema para otimização da tomada de decisão em doações de órgãos por transporte aéreo',
};

export default function RootLayout({
  children,
}: { // Esta é a tipagem correta para as props em TypeScript
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR"> {/* Mude para pt-BR */}
      {/* <body className={inter.className}> // Se usar next/font */}
      <body>
        <nav style={{ padding: '10px 20px', backgroundColor: '#f0f0f0', marginBottom: '20px', borderBottom: '1px solid #ddd', display: 'flex', gap: '15px' }}>
          <Link href="/">Home</Link>
          <Link href="/optimize">Otimizar Transporte</Link>
          <Link href="/donors">Doadores</Link>
          <Link href="/receivers">Receptores</Link>
          <Link href="/hospitals">Hospitais</Link>
          <Link href="/organs">Órgãos</Link>
          <Link href="/airports">Aeroportos</Link>
          {/* Adicionar outros links aqui (Órgãos, Doadores, Receptores) quando criar as páginas */}
        </nav>
        <main style={{ padding: '0 20px', flexGrow: 1 }}> {/* Adicionado flexGrow para main ocupar espaço */}
            {children}
        </main>
        <footer style={{ padding: '20px', backgroundColor: '#f0f0f0', marginTop: 'auto', borderTop: '1px solid #ddd', textAlign: 'center' }}>
            <p>© {new Date().getFullYear()} Gabriel Azeredo Bianki - TCC</p>
        </footer>
      </body>
    </html>
  );
}
