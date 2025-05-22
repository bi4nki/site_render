// frontend/app/hospitals/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { MapMarkerData } from '../components/InteractiveMap'; // Presumindo que está uma pasta acima
// Se 'components' está na raiz de 'app', o caminho seria '../components/InteractiveMap'
// Se 'components' está em 'frontend/src/components', o caminho seria '../../components/InteractiveMap' (ajuste conforme sua estrutura)


const InteractiveMap = dynamic(() => import('../components/InteractiveMap'), { // Ajuste o path se necessário
  ssr: false,
  loading: () => <p>Carregando mapa...</p>
});

interface Hospital {
  // ... (interface Hospital como antes) ...
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

  // Definir centro e zoom para esta página específica ou usar valores padrão
  const initialMapCenter: L.LatLngExpression = [-15.788497, -47.879873]; // Centro do Brasil
  const initialMapZoom: number = 4;

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const fetchHospitals = async () => {
    // ... (lógica de fetchHospitals como antes) ...
    if (!backendUrl) { setError("URL do Backend não configurada."); setIsLoading(false); return; }
    console.log("HospitalsPage: Iniciando fetchHospitals...");
    setIsLoading(true); setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/master-data/hospitals`);
      console.log("HospitalsPage: Resposta do fetch recebida, status:", response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido"}));
        throw new Error(errorData.error || `Erro: ${response.status}`);
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
    } catch (e: any) { setError(e.message); setHospitals([]); setMapMarkers([]);
    } finally { setIsLoading(false); console.log("HospitalsPage: fetchHospitals finalizado.");}
  };

  useEffect(() => {
    fetchHospitals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendUrl]);

  const handleDelete = async (hospitalId: number) => {
    // ... (lógica de handleDelete como antes, chamando fetchHospitals() no sucesso) ...
    if (!backendUrl) { setError("URL Backend não configurada."); return; }
    if (confirm(`Deletar hospital ID ${hospitalId}?`)) {
      try {
        const res = await fetch(`${backendUrl}/api/master-data/hospitals/${hospitalId}`, { method: 'DELETE' });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Falha ao deletar");}
        alert("Deletado!"); fetchHospitals();
      } catch(e:any) { setError(e.message); }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* ... (Título e botão Adicionar Novo Hospital como antes) ... */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Lista de Hospitais</h1>
        <Link href="/hospitals/new" style={{ padding: '10px 15px', backgroundColor: 'green', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          Adicionar Novo Hospital
        </Link>
      </div>


      <div style={{ margin: '20px 0', border: '1px solid #ccc', borderRadius: '5px', overflow: 'hidden' }}>
        <h2 style={{padding: '10px', backgroundColor: '#f9f9f9', margin:0, borderBottom: '1px solid #ccc'}}>Localização dos Hospitais</h2>
        { typeof window !== 'undefined' && backendUrl && 
            <InteractiveMap 
                markers={mapMarkers} 
                center={initialMapCenter} // <<< PASSANDO A PROP CENTER
                zoom={initialMapZoom}     // <<< PASSANDO A PROP ZOOM
            /> 
        }
        { !backendUrl && <p>Mapa indisponível: URL do backend não configurada.</p>}
      </div>

      {/* ... (tabela de hospitais como antes) ... */}
      {isLoading && <p>Carregando hospitais...</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold', marginTop: '10px' }}>Erro ao carregar dados: {error}</p>}
      {!isLoading && !error && hospitals.length === 0 && ( <p style={{ marginTop: '10px' }}>Nenhum hospital cadastrado.</p> )}
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
