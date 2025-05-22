'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Airport {
  id: number;
  name: string;
  iataCode: string;
  city: string;
  state: string;
  // latitude e longitude podem ser omitidas da tabela de listagem para simplicidade
}

export default function AirportsPage() {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const fetchAirports = async () => { // Movido para fora do useEffect para poder chamar no delete
    if (!backendUrl) {
      setError("URL do Backend não configurada.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/master-data/airports`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao buscar aeroportos: ${response.status} - ${response.statusText}. Detalhes: ${errorText}`);
      }
      const data: Airport[] = await response.json();
      setAirports(data);
    } catch (e: any) {
      setError(e.message || "Ocorreu um erro desconhecido ao buscar aeroportos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAirports();
  }, [backendUrl]); // Dependência apenas em backendUrl

  const handleDelete = async (airportId: number) => {
    if (!backendUrl) {
        setError("URL do Backend não configurada para deleção.");
        return;
    }
    if (confirm(`Tem certeza que deseja deletar o aeroporto com ID ${airportId}?`)) {
        // setIsLoading(true); // Pode adicionar um loading específico para deleção
        try {
            const response = await fetch(`${backendUrl}/api/master-data/airports/${airportId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro ao deletar aeroporto: ${response.statusText}`);
            }
            alert("Aeroporto deletado com sucesso!");
            fetchAirports(); // Recarrega a lista de aeroportos
        } catch (e: any) {
            setError(e.message || "Ocorreu um erro desconhecido ao deletar o aeroporto.");
        } finally {
            // setIsLoading(false);
        }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Lista de Aeroportos</h1>
      <Link href="/airports/new" style={{ display: 'inline-block', marginBottom: '20px', padding: '10px 15px', backgroundColor: 'blue', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
        Adicionar Novo Aeroporto
      </Link>

      {isLoading && <p>Carregando aeroportos...</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>Erro: {error}</p>}
      
      {!isLoading && !error && airports.length === 0 && (
        <p>Nenhum aeroporto cadastrado.</p>
      )}

      {!isLoading && !error && airports.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd', backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Nome</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>IATA</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Cidade</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Estado</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {airports.map((airport) => (
              <tr key={airport.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{airport.id}</td>
                <td style={{ padding: '10px' }}>{airport.name}</td>
                <td style={{ padding: '10px' }}>{airport.iataCode}</td>
                <td style={{ padding: '10px' }}>{airport.city}</td>
                <td style={{ padding: '10px' }}>{airport.state}</td>
                <td style={{ padding: '10px' }}>
                  <button onClick={() => handleDelete(airport.id)} style={{color: 'red', cursor: 'pointer'}}>Deletar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
