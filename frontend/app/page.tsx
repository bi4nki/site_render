'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, Building, Plane, Users, Activity, PlusCircle } from 'lucide-react'; // Ícones Lucide (instalar)

// Interface para as estatísticas
interface DashboardStats {
  hospitalCount: number;
  organCount: number;
  airportCount: number;
  donorCount: number;
  receiverCount: number;
  transportLogCount: number;
  recentTransportLogs?: Array<{ // Simplificado para o exemplo
    id: number;
    selectedTransportMode: string;
    status: string;
    createdAt: string;
    // Adicionar donor/receiver info se o backend enviar
  }>;
}

// Componente de Card de Estatística
const StatCard = ({ title, value, icon, colorClass }: { title: string, value: number | string, icon: React.ReactNode, colorClass: string }) => (
  <div className={`bg-white p-6 rounded-xl shadow-lg border-l-4 ${colorClass} flex items-center space-x-4`}>
    <div className={`p-3 rounded-full ${colorClass.replace('border-', 'bg-').replace('500', '100')}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 uppercase">{title}</p>
      <p className="text-3xl font-bold text-slate-700">{value}</p>
    </div>
  </div>
);


export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const fetchDashboardStats = useCallback(async () => {
    if (!backendUrl) {
      setError("URL do Backend não configurada.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/dashboard/stats`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({error: "Erro ao buscar dados"}));
        throw new Error(errData.error || `Erro ${response.status}`);
      }
      const data: DashboardStats = await response.json();
      setStats(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-8">
        Painel de Controle - SisTransplante ML
      </h1>

      {isLoading && <p className="text-center text-slate-600">Carregando estatísticas...</p>}
      {error && <p className="text-center text-red-600 p-4 bg-red-100 rounded-md">Erro ao carregar dados: {error}</p>}

      {stats && !isLoading && !error && (
        <>
          {/* Seção de Cards de Estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            <StatCard title="Hospitais" value={stats.hospitalCount} icon={<Building className="h-8 w-8 text-blue-500" />} colorClass="border-blue-500" />
            <StatCard title="Órgãos (Tipos)" value={stats.organCount} icon={<Activity className="h-8 w-8 text-green-500" />} colorClass="border-green-500" />
            <StatCard title="Aeroportos" value={stats.airportCount} icon={<Plane className="h-8 w-8 text-indigo-500" />} colorClass="border-indigo-500" />
            <StatCard title="Doadores" value={stats.donorCount} icon={<Users className="h-8 w-8 text-teal-500" />} colorClass="border-teal-500" />
            <StatCard title="Receptores" value={stats.receiverCount} icon={<Users className="h-8 w-8 text-amber-500" />} colorClass="border-amber-500" />
            <StatCard title="Otimizações Registradas" value={stats.transportLogCount} icon={<Activity className="h-8 w-8 text-purple-500" />} colorClass="border-purple-500" />
          </div>

          {/* Seção de Ações Rápidas */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-700 mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/optimize" className="block p-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-transform transform hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Otimizar Transporte</h3>
                    <p className="text-blue-100">Iniciar um novo processo de otimização.</p>
                  </div>
                  <PlusCircle className="h-10 w-10" />
                </div>
              </Link>
              <Link href="/hospitals" className="block p-6 bg-slate-600 hover:bg-slate-700 text-white rounded-lg shadow-md transition-transform transform hover:scale-105">
                 <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Gerenciar Hospitais</h3>
                    <p className="text-slate-100">Ver, adicionar ou remover hospitais.</p>
                  </div>
                  <ArrowRight className="h-8 w-8" />
                </div>
              </Link>
              {/* Adicionar mais links rápidos para Doadores, Receptores, etc. */}
            </div>
          </div>

          {/* Opcional: Seção de Últimas Atividades */}
          {stats.recentTransportLogs && stats.recentTransportLogs.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-slate-700 mb-4">Últimas Otimizações Registradas</h2>
              <div className="bg-white shadow-md rounded-lg p-4">
                <ul className="divide-y divide-gray-200">
                  {stats.recentTransportLogs.map(log => (
                    <li key={log.id} className="py-3">
                      <p className="text-sm font-medium text-slate-800">
                        ID Log: {log.id} - Modo: {log.selectedTransportMode}
                      </p>
                      <p className="text-xs text-slate-500">
                        Status: {log.status} - Criado em: {new Date(log.createdAt).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
