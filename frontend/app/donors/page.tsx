'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface HospitalSimple { 
  id: number;
  name: string;
}
interface OrganSimple { 
  id: number;
  name: string;
}
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

  const fetchDonors = async () => {
    if (!backendUrl) { /* ... */ return; }
    setIsLoading(true); setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/master-data/donors`);
      if (!response.ok) { /* ... */ throw new Error(/*...*/); }
      const data: Donor[] = await response.json();
      setDonors(data);
    } catch (e: any) { /* ... */ setError(e.message || "Erro");
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchDonors();
  }, [backendUrl]);

  const handleDelete = async (donorId: number) => {
    if (!backendUrl) { /* ... */ return; }
    if (confirm(`Tem certeza que deseja deletar o doador com ID ${donorId}?`)) {
        try {
            const response = await fetch(`${backendUrl}/api/master-data/donors/${donorId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro ao deletar doador`);
            }
            alert("Doador deletado com sucesso!");
            fetchDonors(); 
        } catch (e: any) { setError(e.message || "Erro ao deletar"); }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Lista de Doadores</h1>
      <Link href="/donors/new" style={{ /* ... */ }}>
        Adicionar Novo Doador
      </Link>

      {isLoading && <p>Carregando doadores...</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>Erro: {error}</p>}
      
      {!isLoading && !error && donors.length === 0 && (
        <p>Nenhum doador cadastrado.</p>
      )}

      {!isLoading && !error && donors.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ /* ... */ }}>
              <th>ID</th>
              <th>Tipo Sanguíneo</th>
              <th>Hospital</th>
              <th>Órgão</th>
              <th>Disponível Desde</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {donors.map((donor) => (
              <tr key={donor.id} style={{ /* ... */ }}>
                <td>{donor.id}</td>
                <td>{donor.bloodType}</td>
                <td>{donor.hospital?.name || 'N/A'}</td>
                <td>{donor.organ?.name || 'N/A'}</td>
                <td>{new Date(donor.availabilityDateTime).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleDelete(donor.id)} style={{ /* ... */}}>Deletar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
