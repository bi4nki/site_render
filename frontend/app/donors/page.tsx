'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { UserPlus, Trash2, Edit3 } from 'lucide-react';

interface HospitalSimple { id: number; name: string; }
interface OrganSimple { id: number; name: string; }
interface Donor {
  id: number;
  bloodType: string;
  availabilityDateTime: string; 
  hospital: HospitalSimple;
  organ: OrganSimple;
  createdAt: string;
}

export default function DonorsPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const fetchDonors = useCallback(async () => {
    if (!backendUrl) { setError("URL Backend não configurada."); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/master-data/donors`);
      if (!response.ok) { 
        const errData = await response.json().catch(()=>({error: "Erro"}));
        throw new Error(errData.error || `Erro ${response.status}`);
      }
      const data: Donor[] = await response.json();
      setDonors(data);
    } catch (e: any) { setError(e.message || "Erro ao buscar doadores.");
    } finally { setIsLoading(false); }
  }, [backendUrl]); 

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]); 

  const handleDelete = async (donorId: number) => {
    if (!backendUrl) { setError("URL Backend não configurada."); return; }
    if (confirm(`Tem certeza que deseja deletar o doador com ID ${donorId}?`)) {
        try {
            const res = await fetch(`${backendUrl}/api/master-data/donors/${donorId}`, { method: 'DELETE' });
            if (!res.ok) { 
                const errData = await res.json().catch(()=>({error: "Erro"}));
                throw new Error(errData.error || "Falha ao deletar");
            }
            alert("Doador deletado com sucesso!"); 
            fetchDonors(); 
        } catch(e:any) { setError(e.message || "Erro ao deletar doador."); }
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-slate-300">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-700 mb-4 sm:mb-0">
          Gerenciamento de Doadores
        </h1>
        <Link href="/donors/new" 
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow hover:shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-opacity-50 flex items-center">
          <UserPlus className="h-5 w-5 mr-2" />
          Adicionar Novo Doador
        </Link>
      </div>

      {isLoading && <div className="text-center text-slate-600 py-6 text-lg animate-pulse">Carregando lista de doadores...</div>}
      {error && !isLoading && <div className="text-center text-red-700 font-semibold p-4 bg-red-100 border border-red-300 rounded-lg mt-4 shadow-sm">Erro: {error}</div>}
      
      {!isLoading && !error && donors.length === 0 && (
        <div className="text-center text-slate-500 mt-6 py-6 bg-white p-8 rounded-lg shadow-md">
            Nenhum doador cadastrado. 
            <Link href="/donors/new" className="text-blue-600 hover:text-blue-800 font-semibold ml-2">
                 Adicione um agora!
            </Link>
        </div>
      )}

      {!isLoading && !error && donors.length > 0 && (
        <div className="overflow-x-auto shadow-xl rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipo Sanguíneo</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hospital de Origem</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Órgão Doador</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Disponível Desde</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {donors.map((donor) => (
                <tr key={donor.id} className="hover:bg-slate-50 transition-colors duration-150 ease-in-out">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{donor.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{donor.bloodType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 max-w-xs truncate" title={donor.hospital?.name}>{donor.hospital?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{donor.organ?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(donor.availabilityDateTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    {}
                    <button 
                      onClick={() => handleDelete(donor.id)} 
                      className="text-red-500 hover:text-red-700 transition duration-150 ease-in-out font-semibold focus:outline-none hover:underline flex items-center"
                    >
                      <Trash2 className="inline h-4 w-4 mr-1" /> Deletar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
