'use client';

import { useState, useEffect, useCallback } from 'react'; // Adicionado useCallback
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { MapMarkerData } from '../components/InteractiveMap'; 
import L from 'leaflet'; 

const InteractiveMap = dynamic(() => import('../components/InteractiveMap'), {
  ssr: false, 
  loading: () => <div className="text-center p-4">Carregando mapa...</div>
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

  // Usar useCallback para fetchHospitals para evitar recriação desnecessária
  // se passada como dependência para outros useEffects (não é o caso aqui, mas boa prática)
  const fetchHospitals = useCallback(async () => {
    if (!backendUrl) {
      setError("URL do Backend não configurada.");
      setIsLoading(false); 
      return;
    }

    console.log("HospitalsPage: Iniciando fetchHospitals...");
    setIsLoading(true); 
    setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/master-data/hospitals`);
      console.log("HospitalsPage: Resposta do fetch recebida, status:", response.status);

      if (!response.ok) {
        // Tenta pegar o corpo do erro como JSON, senão como texto
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { error: await response.text() || `Erro HTTP ${response.status}` };
        }
        console.error("HospitalsPage: Erro na resposta do backend:", response.status, errorData);
        throw new Error(errorData.error || `Erro ao buscar hospitais: ${response.status} - ${response.statusText}`);
      }
      const data: Hospital[] = await response.json();
      console.log("HospitalsPage: Dados recebidos:", data);
      setHospitals(data);

      if (Array.isArray(data)) {
        const markers: MapMarkerData[] = data
          .filter(hospital => typeof hospital.latitude === 'number' && typeof hospital.longitude === 'number') 
          .map(hospital => ({
            id: hospital.id,
            latitude: hospital.latitude,
            longitude: hospital.longitude,
            name: hospital.name,
            type: 'hospital',
            details: `${hospital.city}${hospital.state ? `, ${hospital.state}` : ''}`
          }));
        setMapMarkers(markers);
        console.log("HospitalsPage: Marcadores do mapa definidos:", markers);
      } else {
        console.warn("HospitalsPage: Dados recebidos não são um array para marcadores.")
        setMapMarkers([]);
      }

    } catch (e: any) {
      console.error("HospitalsPage: Falha ao buscar hospitais (catch):", e);
      setError(e.message || "Ocorreu um erro desconhecido ao buscar hospitais.");
      setHospitals([]); 
      setMapMarkers([]); 
    } finally {
      console.log("HospitalsPage: fetchHospitals finalizado.");
      setIsLoading(false); 
    }
  // Adicionado backendUrl como dependência para useCallback
  }, [backendUrl]); 

  useEffect(() => {
    console.log("HospitalsPage: useEffect para fetch inicial.");
    fetchHospitals();
  }, [fetchHospitals]); // Agora fetchHospitals é uma dependência estável

  const handleDelete = async (hospitalId: number) => {
    if (!backendUrl) {
        setError("URL do Backend não configurada para deleção.");
        return;
    }
    if (confirm(`Tem certeza que deseja deletar o hospital com ID ${hospitalId}? Esta ação não pode ser desfeita.`)) {
        setError(null);
        // Poderia adicionar um estado de loading específico para a deleção aqui
        try {
            const response = await fetch(`${backendUrl}/api/master-data/hospitals/${hospitalId}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { error: await response.text() || `Erro HTTP ${response.status}` };
                }
                console.error("HospitalsPage: Erro ao deletar hospital:", errorData);
                throw new Error(errorData.error || `Erro ao deletar hospital: ${response.statusText}`);
            }
            alert("Hospital deletado com sucesso!");
            fetchHospitals(); 
        } catch (e: any) {
            console.error("HospitalsPage: Falha ao deletar hospital (catch):", e);
            setError(e.message || "Ocorreu um erro desconhecido ao deletar o hospital.");
        } finally {
            // Resetar loading específico de deleção se tivesse
        }
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-700">Gerenciamento de Hospitais</h1>
        <Link href="/hospitals/new" 
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out self-start sm:self-center focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-opacity-50">
          Adicionar Novo Hospital
        </Link>
      </div>

      {/* Mapa */}
      <div className="mb-8 bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
        <h2 className="text-xl font-semibold p-4 bg-gray-100 border-b border-gray-200 text-gray-700">
            Localização dos Hospitais Cadastrados
        </h2>
        <div className="h-[400px] md:h-[500px] w-full"> {/* Altura definida para o mapa */}
            { typeof window !== 'undefined' && backendUrl && 
                <InteractiveMap 
                    markers={mapMarkers} 
                    center={initialMapCenter} 
                    zoom={initialMapZoom}
                    style={{ height: '100%', width: '100%' }} // Faz o mapa preencher o div pai
                /> 
            }
            { !backendUrl && <p className="p-4 text-center text-red-600">Mapa indisponível: URL do backend não configurada.</p>}
            { isLoading && !mapMarkers.length && <div className="h-full flex items-center justify-center text-gray-500">Carregando mapa e marcadores...</div>}
        </div>
      </div>

      {isLoading && <p className="text-center text-gray-600 py-4">Carregando lista de hospitais...</p>}
      {error && !isLoading && <p className="text-center text-red-600 font-semibold p-3 bg-red-100 border border-red-300 rounded-md mt-4">Erro ao carregar dados: {error}</p>}
      
      {!isLoading && !error && hospitals.length === 0 && (
        <p className="text-center text-gray-500 mt-4 py-4 bg-white p-6 rounded-md shadow">Nenhum hospital cadastrado.</p>
      )}

      {!isLoading && !error && hospitals.length > 0 && (
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cidade</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipos de Transplante</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hospitals.map((hospital) => (
                <tr key={hospital.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{hospital.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate" title={hospital.name}>{hospital.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hospital.city}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hospital.state || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={Array.isArray(hospital.transplantTypes) && hospital.transplantTypes.length > 0 ? hospital.transplantTypes.join(', ') : 'Nenhum tipo informado'}>
                    {Array.isArray(hospital.transplantTypes) && hospital.transplantTypes.length > 0 
                      ? hospital.transplantTypes.join(', ') 
                      : 'Nenhum tipo informado'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {/* Link para Edição (a ser implementado)
                    <Link href={`/hospitals/edit/${hospital.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4 transition duration-150 ease-in-out">
                        Editar
                    </Link>
                    */}
                    <button 
                      onClick={() => handleDelete(hospital.id)} 
                      className="text-red-500 hover:text-red-700 transition duration-150 ease-in-out font-semibold focus:outline-none"
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
