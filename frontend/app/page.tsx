'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
    ArrowRight, 
    Building as HospitalIcon,
    Plane, 
    Users, 
    ActivitySquare,
    PlusCircle, 
    ListChecks 
} from 'lucide-react';

// Interface para as estatísticas
interface DashboardStats {
  hospitalCount: number;
  organCount: number;
  airportCount: number;
  donorCount: number;
  receiverCount: number;
  transportLogCount: number;
  recentTransportLogs?: Array<{
    id: number;
    selectedTransportMode: string;
    status: string;
    createdAt: string;
    donorId?: number; 
    receiverId?: number; 
  }>;
}

// Componente de Card de Estatística
const StatCard = ({ title, value, icon, cardLink, colorClass = "border-slate-500", iconBgColor = "bg-slate-100", iconTextColor = "text-slate-500" }: 
    { title: string, value: number | string, icon: React.ReactNode, cardLink?: string, colorClass?: string, iconBgColor?: string, iconTextColor?: string }) => (
  
  <Link href={cardLink || "#"} className={`block p-6 rounded-xl shadow-lg border-l-4 ${colorClass} flex items-center space-x-4 bg-white hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1`}>
    <div className={`p-3 rounded-full ${iconBgColor} shadow-sm`}>
      {React.cloneElement(icon as React.ReactElement, { className: `h-8 w-8 ${iconTextColor}` })}
    </div>
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
      <p className="text-3xl font-bold text-slate-700">{value}</p>
    </div>
  </Link>
);


export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const fetchDashboardStats = useCallback(async () => {
    if (!backendUrl) { setError("URL Backend não configurada."); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/dashboard/stats`);
      if (!response.ok) { 
        const errData = await response.json().catch(()=>({error: "Erro ao buscar dados"}));
        throw new Error(errData.error || `Erro ${response.status}`);
      }
      const data: DashboardStats = await response.json();
      setStats(data);
    } catch (e: any) { setError(e.message);
    } finally { setIsLoading(false); }
  }, [backendUrl]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const getProbabilityColor = (prob: number): string => {
    if (prob > 0.75) return 'green';
    if (prob > 0.5) return 'orange';
    return 'inherit';
  };


  if (isLoading) return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><p className="text-slate-600 text-lg animate-pulse">Carregando estatísticas...</p></div>;
  if (error) return <div className="container mx-auto p-4"><p className="text-center text-red-600 p-4 bg-red-100 rounded-md border border-red-300 shadow-sm">Erro ao carregar dados: {error}</p></div>;
  if (!stats) return <div className="container mx-auto p-4"><p className="text-center text-slate-500">Nenhuma estatística para mostrar.</p></div>;


  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-10 text-center sm:text-left tracking-tight">
        Painel de Controle - SisTransplante ML
      </h1>
        <>
          {}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <StatCard title="Hospitais" value={stats.hospitalCount} icon={<HospitalIcon />} cardLink="/hospitals" colorClass="border-blue-500" iconBgColor="bg-blue-100" iconTextColor="text-blue-600" />
            <StatCard title="Órgãos (Tipos)" value={stats.organCount} icon={<ActivitySquare />} cardLink="/organs" colorClass="border-green-500" iconBgColor="bg-green-100" iconTextColor="text-green-600"/>
            <StatCard title="Aeroportos" value={stats.airportCount} icon={<Plane />} cardLink="/airports" colorClass="border-indigo-500" iconBgColor="bg-indigo-100" iconTextColor="text-indigo-600"/>
            <StatCard title="Doadores" value={stats.donorCount} icon={<Users />} cardLink="/donors" colorClass="border-teal-500" iconBgColor="bg-teal-100" iconTextColor="text-teal-600"/>
            <StatCard title="Receptores" value={stats.receiverCount} icon={<Users />} cardLink="/receivers" colorClass="border-amber-500" iconBgColor="bg-amber-100" iconTextColor="text-amber-600"/>
            <StatCard title="Otimizações Registradas" value={stats.transportLogCount} icon={<ListChecks />} cardLink="/optimize" colorClass="border-purple-500" iconBgColor="bg-purple-100" iconTextColor="text-purple-600"/>
          </div>

          {}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-slate-700 mb-6 pb-2 border-b border-slate-300">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/optimize" className="group block p-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-opacity-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">Otimizar Transporte</h3>
                    <p className="text-blue-100 mt-1 text-sm">Iniciar novo processo de otimização.</p>
                  </div>
                  <PlusCircle className="h-10 w-10 text-blue-300 group-hover:text-white transition-colors" />
                </div>
              </Link>
              <Link href="/hospitals/new" className="group block p-6 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-opacity-50">
                 <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">Adicionar Hospital</h3>
                    <p className="text-green-100 mt-1 text-sm">Cadastrar nova instituição.</p>
                  </div>
                  <HospitalIcon className="h-10 w-10 text-green-200 group-hover:text-white transition-colors" />
                </div>
              </Link>
            </div>
          </div>

          {}
          {stats.recentTransportLogs && stats.recentTransportLogs.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-300">Últimas Otimizações Registradas</h2>
              <div className="bg-white shadow-xl rounded-xl border border-slate-200">
                <div className="p-4 border-b border-slate-200"> 
                   <h3 className="text-lg font-medium text-slate-700">Histórico Recente</h3>
                </div>
                <ul className="divide-y divide-slate-200">
                  {stats.recentTransportLogs.map(log => (
                    <li key={log.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-800">
                          Log ID: <span className="font-bold text-blue-600">{log.id}</span> - Modo Sugerido: <span className="font-semibold">{log.selectedTransportMode}</span>
                        </p>
                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          log.status === 'PENDING_CONFIRMATION' ? 'bg-yellow-100 text-yellow-800' : 
                          log.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                          'bg-red-100 text-red-800' 
                        }`}>
                          {log.status.replace('_', ' ').toLowerCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Criado em: {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
    </div>
  );
}
