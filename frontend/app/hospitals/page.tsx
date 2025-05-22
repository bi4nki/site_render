'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { MapMarkerData } from '../components/InteractiveMap'; 
import L from 'leaflet'; 

const InteractiveMap = dynamic(() => import('../components/InteractiveMap'), {
  ssr: false, 
  loading: () => <div className="text-center p-4 animate-pulse text-gray-500">Carregando mapa...</div> // Adicionado estilo ao loading
});

interface Hospital {
  id: number;
  name: string;
  address?: string; 
  city: string;
  state?: string; 
  latitude: number;
  longitude: number;
  transplantTypes: string[]; 
}

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);
  const [mapMarkers, setMapMarkers] = useState<MapMarkerData[]>([]);

  const initialMapCenter: L.LatLngExpression = [-15.788497, -47.879873]; 
  const initialMapZoom: number = 4;

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const fetchHospitals = useCallback(async () => {
    if (!backendUrl) {
      setError("URL do Backend não configurada.");
      setIsLoading(false); 
      return;
    }
    setIsLoading(true); 
    setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/master-data/hospitals`);
      if (!response.ok) {
        let errorData;
        try { errorData = await response.json(); } 
        catch (e) { errorData = { error: await response.text() || `Erro HTTP ${response.status}` }; }
        throw new Error(errorData.error || `Erro ao buscar hospitais: ${response.status}`);
      }
      const data: Hospital[] = await response.json();
      setHospitals(data);
      if (Array.isArray(data)) {
        const markers: MapMarkerData[] = data
          .filter(h => typeof h.latitude === 'number' && typeof h.longitude === 'number') 
          .map(h => ({
            id: h.id, latitude: h.latitude, longitude: h.longitude,
            name: h.name, type: 'hospital',
            details: `${h.city}${h.state ? `, ${h.state}` : ''}`
          }));
        setMapMarkers(markers);
      } else { setMapMarkers([]); }
    } catch (e: any) { 
      setError(e.message || "Ocorreu um erro desconhecido ao buscar hospitais.");
      setHospitals([]); setMapMarkers([]); 
    } finally { setIsLoading(false); }
  }, [backendUrl]); 

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]); 

  const handleDelete = async (hospitalId: number) => {
    if (!backendUrl) { setError("URL Backend não configurada."); return; }
    if (confirm(`Tem certeza que deseja deletar o hospital com ID ${hospitalId}?`)) {
        try {
            const res = await fetch(`${backendUrl}/api/master-data/hospitals/${hospitalId}`, { method: 'DELETE' });
            if (!res.ok) { 
                let errData;
                try { errData = await res.json(); } catch(e) { errData = {error: await res.text() || `Erro HTTP ${res.status}`};}
                throw new Error(errData.error || "Falha ao deletar");
            }
            alert("Hospital deletado com sucesso!"); 
            fetchHospitals(); 
        } catch(e:any) { setError(e.message); }
    }
  };

  return (
    // Container principal da página
    <div className="container mx-auto p-4 py-8 sm:p-6 md:p-8 bg-slate-50 min-h-screen">
      {/* Cabeçalho da Página: Título e Botão Adicionar */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-slate-300">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-700 mb-4 sm:mb-0">
          Gerenciamento de Hospitais
        </h1>
        <Link href="/hospitals/new" 
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow hover:shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-opacity-50">
          Adicionar Novo Hospital
        </Link>
      </div>

      {/* Seção do Mapa */}
      <div className="mb-10 bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200">
        <h2 className="text-xl font-semibold p-5 bg-slate-100 border-b border-slate-200 text-slate-700">
            Localização dos Hospitais Cadastrados
        </h2>
        <div className="h-[450px] md:h-[550px] w-full"> {/* Altura definida para o mapa */}
            { typeof window !== 'undefined' && backendUrl && 
                <InteractiveMap 
                    markers={mapMarkers} 
                    center={initialMapCenter} 
                    zoom={initialMapZoom}
                    style={{ height: '100%', width: '100%' }}
                /> 
            }
            { !backendUrl && <div className="h-full flex items-center justify-center p-4 text-center text-red-600 bg-red-50 rounded-b-xl">Mapa indisponível: URL do backend não configurada.</div>}
            { isLoading && !mapMarkers.length && !error && <div className="h-full flex items-center justify-center text-slate-500">Carregando mapa e marcadores...</div>}
        </div>
      </div>

      {/* Mensagens de Loading e Erro para a Tabela */}
      {isLoading && <div className="text-center text-slate-600 py-6 text-lg">Carregando lista de hospitais...</div>}
      {error && !isLoading && <div className="text-center text-red-700 font-semibold p-4 bg-red-100 border border-red-300 rounded-lg mt-4 shadow-sm">Erro ao carregar dados: {error}</div>}
      
      {/* Tabela de Hospitais */}
      {!isLoading && !error && hospitals.length === 0 && (
        <div className="text-center text-slate-500 mt-6 py-6 bg-white p-8 rounded-lg shadow-md">
            Nenhum hospital cadastrado. 
            <Link href="/hospitals/new" className="text-blue-600 hover:text-blue-800 font-semibold ml-2">
                 Adicione um agora!
            </Link>
        </div>
      )}

      {!isLoading && !error && hospitals.length > 0 && (
        <div className="overflow-x-auto shadow-xl rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 bg-white">
            <thead className="bg-slate-100">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nome</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cidade</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipos de Transplante</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {hospitals.map((hospital) => (
                <tr key={hospital.id} className="hover:bg-slate-50 transition-colors duration-150 ease-in-out">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{hospital.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 max-w-xs truncate" title={hospital.name}>{hospital.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{hospital.city}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{hospital.state || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-sm truncate" title={Array.isArray(hospital.transplantTypes) && hospital.transplantTypes.length > 0 ? hospital.transplantTypes.join(', ') : 'Nenhum'}>
                    {Array.isArray(hospital.transplantTypes) && hospital.transplantTypes.length > 0 
                      ? hospital.transplantTypes.join(', ') 
                      : <span className="italic text-slate-400">Nenhum tipo</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {/* Futuro Link para Edição:
                    <Link href={`/hospitals/edit/${hospital.id}`} className="text-indigo-600 hover:text-indigo-800 mr-4 transition duration-150 ease-in-out">
                        Editar
                    </Link>
                    */}
                    <button 
                      onClick={() => handleDelete(hospital.id)} 
                      className="text-red-500 hover:text-red-700 transition duration-150 ease-in-out font-semibold focus:outline-none hover:underline"
                    >
                      Deletar
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
