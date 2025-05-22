'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Hospital {
  id: number;
  name: string;
  city: string;
  state: string;
  transplantTypes: string[];
}

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  useEffect(() => {
    if (!backendUrl) {
      setError("URL do Backend não configurada.");
      setIsLoading(false);
      return;
    }

    const fetchHospitals = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${backendUrl}/api/master-data/hospitals`);
        if (!response.ok) {
          throw new Error(`Erro ao buscar hospitais: ${response.statusText}`);
        }
        const data: Hospital[] = await response.json();
        setHospitals(data);
      } catch (e: any) {
        console.error("Falha ao buscar hospitais:", e);
        setError(e.message || "Ocorreu um erro desconhecido.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHospitals();
  }, [backendUrl]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Lista de Hospitais</h1>
      <Link href="/hospitals/new" style={{ display: 'inline-block', marginBottom: '20px', padding: '10px 15px', backgroundColor: 'blue', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
        Adicionar Novo Hospital
      </Link>

      {isLoading && <p>Carregando hospitais...</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>Erro: {error}</p>}
      
      {!isLoading && !error && hospitals.length === 0 && (
        <p>Nenhum hospital cadastrado.</p>
      )}

      {!isLoading && !error && hospitals.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd', backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Nome</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Cidade</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Estado</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Tipos de Transplante</th>
              {/* Adicionar coluna de Ações para Editar/Deletar no futuro */}
            </tr>
          </thead>
          <tbody>
            {hospitals.map((hospital) => (
              <tr key={hospital.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{hospital.id}</td>
                <td style={{ padding: '10px' }}>{hospital.name}</td>
                <td style={{ padding: '10px' }}>{hospital.city}</td>
                <td style={{ padding: '10px' }}>{hospital.state}</td>
                <td style={{ padding: '10px' }}>{hospital.transplantTypes.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
