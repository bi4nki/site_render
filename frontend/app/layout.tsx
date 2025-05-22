import type { Metadata } from 'next'; // Import Metadata se não estiver já
import Link from 'next/link';
import './globals.css'; // Importa o globals.css onde as diretivas @tailwind estão

// Opcional: Se você quiser usar uma fonte específica via next/font
// import { Inter } from 'next/font/google';
// const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = { // Garanta que a tipagem Metadata está aqui
  title: 'Otimização de Doação de Órgãos - TCC',
  description: 'Sistema para otimização da tomada de decisão em doações de órgãos por transporte aéreo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      {/* <body className={inter.className}> // Se usar next/font, aplique a classe aqui */}
      <body className="flex flex-col min-h-screen bg-slate-50 text-slate-800"> {/* Estilo base para o body */}
        
        {/* Header/Navegação */}
        <header className="bg-white shadow-md sticky top-0 z-50"> {/* Fixo no topo com sombra */}
          <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo ou Título do Site */}
              <div className="flex-shrink-0">
                <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-800 transition-colors">
                  SisTransplante-ML
                </Link>
              </div>
              
              {/* Links de Navegação */}
              <div className="hidden sm:flex sm:space-x-6">
                <Link href="/" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Home
                </Link>
                <Link href="/optimize" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Otimizar Transporte
                </Link>
                <Link href="/hospitals" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Hospitais
                </Link>
                <Link href="/organs" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Órgãos
                </Link>
                <Link href="/airports" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Aeroportos
                </Link>
                <Link href="/donors" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Doadores
                </Link>
                <Link href="/receivers" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Receptores
                </Link>
                {/* Adicionar mais links conforme necessário */}
              </div>

              {/* Botão de Menu Mobile (funcionalidade a ser implementada se desejar) */}
              <div className="sm:hidden">
                <button type="button" className="text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500" aria-controls="mobile-menu" aria-expanded="false">
                  <span className="sr-only">Abrir menu principal</span>
                  {/* Ícone de menu (ex: hamburger) */}
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </nav>
          {/* Menu Mobile (a ser implementado com estado e JS) */}
          {/* <div className="sm:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link href="/" className="text-slate-700 hover:bg-slate-200 hover:text-slate-900 block px-3 py-2 rounded-md text-base font-medium">Home</Link>
              <Link href="/optimize" className="text-slate-700 hover:bg-slate-200 hover:text-slate-900 block px-3 py-2 rounded-md text-base font-medium">Otimizar</Link>
              ... (outros links)
            </div>
          </div> */}
        </header>

        {/* Conteúdo Principal da Página */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
            {children}
        </main>

        {/* Footer */}
        <footer className="bg-slate-800 text-slate-300 shadow-inner mt-auto"> {/* mt-auto empurra para baixo */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
            <p>© {new Date().getFullYear()} Gabriel Azeredo Bianki - TCC Otimização de Doação de Órgãos.</p>
            <p className="text-sm text-slate-400 mt-1">Todos os direitos reservados.</p>
          </div>
        </footer>

      </body>
    </html>
  );
}
