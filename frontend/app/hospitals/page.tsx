'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic'; // Para importação dinâmica do mapa
import { MapMarkerData } from '../components/InteractiveMap'; // Importar a interface do nosso componente de mapa

// Importar o mapa dinamicamente para evitar problemas de SSR
// O componente InteractiveMap está em app/components/InteractiveMap.tsx
const InteractiveMap = dynamic(() => import('../components/InteractiveMap'), {
  ssr: false, // Esta é a chave para componentes Leaflet
  loading: () => <p>Carregando mapa...</p> // Opcional: mensagem de carregamento para o mapa
});

// Interface para os dados do hospital como vêm do backend
interface Hospital {
  id: number;
  name: string;
  address?: string; // Tornar opcional se nem sempre vier
  city: string;
  state?: string; // Tornar opcional
  latitude: number;
  longitude: number;
  transplantTypes: string[]; // Backend retorna array de strings
}

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapMarkers, setMapMarkers] = useState<MapMarkerData[]>([]);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  // Função para buscar hospitais, movida para fora do useEffect para poder ser chamada pela deleção
  const fetchHospitals = async () => {
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
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido ao parsear JSON da resposta de erro."}));
        console.error("HospitalsPage: Erro na resposta do backend:", response.status, errorData);
        throw new Error(errorData.error || `Erro ao buscar hospitais: ${response.status} - ${response.statusText}`);
      }
      const data: Hospital[] = await response.json();
      console.log("HospitalsPage: Dados recebidos:", data);
      setHospitals(data);

      // Transformar dados dos hospitais para o formato dos marcadores do mapa
      if (Array.isArray(data)) {
        const markers: MapMarkerData[] = data
          .filter(hospital => typeof hospital.latitude === 'number' && typeof hospital.longitude === 'number') // Garante que lat/lon são números
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
      setHospitals([]); // Limpa hospitais em caso de erro
      setMapMarkers([]); // Limpa marcadores em caso de erro
    } finally {
      console.log("HospitalsPage: fetchHospitals finalizado.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("HospitalsPage: useEffect para fetch inicial ou mudança de backendUrl.");
    fetchHospitals();
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  // Apenas backendUrl como dependência, pois fetchHospitals é estável (ou use useCallback se preferir)
  }, [backendUrl]); 

  const handleDelete = async (hospitalId: number) => {
    if (!backendUrl) {
        setError("URL do Backend não configurada para deleção.");
        return;
    }
    if (confirm(`Tem certeza que deseja deletar o hospital com ID ${hospitalId}? Esta ação não pode ser desfeita.`)) {
        // setIsLoading(true); // Você pode ter um estado de loading específico para deleção
        setError(null);
        try {
            const response = await fetch(`${backendUrl}/api/master-data/hospitals/${hospitalId}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Erro ao parsear JSON da resposta de erro da deleção."}));
                console.error("HospitalsPage: Erro ao deletar hospital:", errorData);
                throw new Error(errorData.error || `Erro ao deletar hospital: ${response.statusText}`);
            }
            // const deletedData = await response.json(); // Opcional, se o backend retornar o hospital deletado
            alert("Hospital deletado com sucesso!");
            fetchHospitals(); // Recarrega a lista de hospitais e os marcadores do mapa
        } catch (e: any) {
            console.error("HospitalsPage: Falha ao deletar hospital (catch):", e);
            setError(e.message || "Ocorreu um erro desconhecido ao deletar o hospital.");
        } finally {
            // setIsLoading(false);
        }
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Lista de Hospitais</h1>
        <Link href="/hospitals/new" style={{ padding: '10px 15px', backgroundColor: 'green', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          Adicionar Novo Hospital
        </Link>
      </div>

      {/* Mapa */}
      <div style={{ margin: '20px 0', border: '1px solid #ccc', borderRadius: '5px', overflow: 'hidden' }}>
        <h2 style={{padding: '10px', backgroundColor: '#f9f9f9', margin:0, borderBottom: '1px solid #ccc'}}>Localização dos Hospitais</h2>
        { typeof window !== 'undefined' && backendUrl && <InteractiveMap markers={mapMarkers} /> }
        { !backendUrl && <p>Mapa indisponível: URL do backend não configurada.</p>}
      </div>

      {isLoading && <p>Carregando hospitais...</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold', marginTop: '10px' }}>Erro ao carregar dados: {error}</p>}
      
      {!isLoading && !error && hospitals.length === 0 && (
        <p style={{ marginTop: '10px' }}>Nenhum hospital cadastrado.</p>
      )}

      {!isLoading && !error && hospitals.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Nome</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Cidade</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Estado</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Tipos de Transplante</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {hospitals.map((hospital) => (
              <tr key={hospital.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{hospital.id}</td>
                <td style={{ padding: '10px' }}>{hospital.name}</td>
                <td style={{ padding: '10px' }}>{hospital.city}</td>
                <td style={{ padding: '10px' }}>{hospital.state || 'N/A'}</td>
                <td style={{ padding: '10px' }}>
                  {Array.isArray(hospital.transplantTypes) && hospital.transplantTypes.length > 0 
                    ? hospital.transplantTypes.join(', ') 
                    : 'Nenhum tipo informado'}
                </td>
                <td style={{ padding: '10px' }}>
                  {/* Link para Edição (a ser implementado)
                  <Link href={`/hospitals/edit/${hospital.id}`} style={{marginRight: '10px', color: 'blue', textDecoration: 'none'}}>Editar</Link>
                  */}
                  <button 
                    onClick={() => handleDelete(hospital.id)} 
                    style={{color: 'red', cursor: 'pointer', background: 'none', border: '1px solid red', padding: '5px 10px', borderRadius: '3px'}}
                  >
                    Deletar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
