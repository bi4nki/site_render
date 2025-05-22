'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { MapMarkerData } from '../components/InteractiveMap';
import L from 'leaflet'; // <<< ADICIONE ESTA IMPORTAÇÃO

const InteractiveMap = dynamic(() => import('../components/InteractiveMap'), {
  ssr: false,
  loading: () => <p>Carregando mapa...</p>
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

  // Agora L.LatLngExpression será reconhecido
  const initialMapCenter: L.LatLngExpression = [-15.788497, -47.879873]; 
  const initialMapZoom: number = 4;

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const fetchHospitals = async () => {
    if (!backendUrl) { setError("URL do Backend não configurada."); setIsLoading(false); return; }
    console.log("HospitalsPage: Iniciando fetchHospitalsVocê...");
    setIsLoading(true); setError(null);
    try {
      const response = await fetch(`${ está quase lá! Este erro `Type error: Cannot find namespace 'L'.`backendUrl}/api/master-data/hospitals`);
      console.log("HospitalsPage: Resposta do fetch recebida, status:", response.status);
      if (!response.ok) {
        const error é porque o tipo `L.LatLngExpression` não está diretamente disponível ou importado no escopo do arquivo `frontend/app/hospitals/page.tsx`.

O namespace `L` vem da biblioteca principal do Leaflet. EmboraData = await response.json().catch(() => ({ error: "Erro desconhecido"}));
        throw new Error(errorData.error || `Erro: ${response.status}`);
      }
      const data: Hospital[] = await response.json();
      setHospitals(data);
      if (Array.isArray(data)) {
        const markers: MapMarkerData[] = data
          .filter(h => typeof h.latitude === 'number' && typeof `react-leaflet` seja um wrapper, para usar os tipos específicos do Leaflet (como `LatLngExpression`, `MapOptions`, etc.), você frequentemente precisa importá-los diretamente de `leaflet`.

**Correção no `frontend/app/hospitals/page.tsx`:**

Adicione a importação do `L` e/ou `LatLngExpression` diretamente da biblioteca `leaflet`.

```typescript jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { MapMarkerData } from '../components/ h.longitude === 'number')
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
    if (!backendUrl) { setError("URL Backend não configurada."); return; }
    if (confirm(`Deletar hospital IDInteractiveMap'; // Ajuste se necessário
import type { LatLngExpression } from 'leaflet'; // <--- ADICIONE ESTA IMPORTAÇÃO DE TIPO

const InteractiveMap = dynamic(() => import('../components/InteractiveMap'), { // Ajuste se necessário
  ssr: false,
  loading: () => <p>Carregando mapa...</p>
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

  // Definir centro e zoom para esta página específica ou usar valores padrão
  const initialMapCenter: LatLngExpression = [-15.788497, -47.879873]; // Agora LatLngExpression é reconhecido
  const initialMapZoom: number = 4;

  const backendUrl = process.env.NEXT_PUBLIC_BACK ${hospitalId}?`)) {
      try {
        const res = await fetch(`${backendUrl}/api/master-data/hospitals/${hospitalId}`, { method: 'DELETE' });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Falha ao deletar");}
        alert("Deletado!"); fetchHospitals();
      } catch(e:any) { setError(e.message); }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
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
                center={initialMapCenter} 
                zoom={initialMapZoom}     
            /> 
        }
        { !backendUrl && <p>Mapa indisponível: URL do backend não configurada.</p>}
      </div>

      {isLoading && <p>Carregando hospitais...</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold', marginTop: '10END_API_URL;

  // ... (resto da lógica de fetchHospitals e handleDelete como antes) ...
  const fetchHospitals = async () => {
    if (!backendUrl) { setError("URL do Backend não configurada."); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/master-data/hospitals`);
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
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchHospitals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendUrl]);

  const handleDelete = async (hospitalId: number) => {
    if (!backendUrl) { setError("URL Backend não configurada."); return; }
    if (confirm(`Deletar hospital ID ${hospitalId}?`)) {
      try {
        const res = await fetch(`${backendUrl}/api/master-data/hospitals/${hospitalId}`, { method: 'DELETE' });
        if (!res.ok) { const errData = await res.json().catch(() => ({error: "Erro"})); throw new Error(errData.error || "Falha ao deletar");}
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

      <div style={{ margin: '20px 0', border: '1px solid #ccc', borderRadius: '5pxpx' }}>Erro ao carregar dados: {error}</p>}
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
