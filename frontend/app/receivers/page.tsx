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
interface Receiver {
  id: number;
  bloodType: string;
  urgencyLevel: number;
  registrationDate: string; 
  hospital: HospitalSimple;
  organNeeded: OrganSimple; // Nome da relação no Prisma é organNeeded
  createdAt: string;
}

export default function ReceiversPage() {
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const fetchReceivers = async () => {
    if (!backendUrl) { /* ... */ return; }
    setIsLoading(true); setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/master-data/receivers`);
      if (!response.ok) { /* ... */ throw new Error(/*...*/); }
      const data: Receiver[] = await response.json();
      setReceivers(data);
    } catch (e: any) { /* ... */ setError(e.message || "Erro");
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchReceivers();
  }, [backendUrl]);

  const handleDelete = async (receiverId: number) => {
    if (!backendUrl) { /* ... */ return; }
    if (confirm(`Tem certeza que deseja deletar o receptor com ID ${receiverId}?`)) {
        try {
            const response = await fetch(`${backendUrl}/api/master-data/receivers/${receiverId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro ao deletar receptor`);
            }
            alert("Receptor deletado com sucesso!");
            fetchReceivers(); 
        } catch (e: any) { setError(e.message || "Erro ao deletar"); }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Lista de Receptores</h1>
      <Link href="/receivers/new" style={{ /* ... */ }}>
        Adicionar Novo Receptor
      </Link>

      {isLoading && <p>Carregando receptores...</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>Erro: {error}</p>}
      
      {!isLoading && !error && receivers.length === 0 && (
        <p>Nenhum receptor cadastrado.</p>
      )}

      {!isLoading && !error && receivers.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ /* ... */ }}>
              <th>ID</th>
              <th>Tipo Sanguíneo</th>
              <th>Urgência</th>
              <th>Hospital</th>
              <th>Órgão Necessário</th>
              <th>Data Registro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {receivers.map((receiver) => (
              <tr key={receiver.id} style={{ /* ... */ }}>
                <td>{receiver.id}</td>
                <td>{receiver.bloodType}</td>
                <td>{receiver.urgencyLevel}</td>
                <td>{receiver.hospital?.name || 'N/A'}</td>
                <td>{receiver.organNeeded?.name || 'N/A'}</td> 
                <td>{new Date(receiver.registrationDate).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleDelete(receiver.id)} style={{ /* ... */}}>Deletar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
