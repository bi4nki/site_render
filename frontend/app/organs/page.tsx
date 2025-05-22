'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Organ {
  id: number;
  name: string;
  maxIschemiaHours: number;
}

export default function OrgansPage() {
  const [organs, setOrgans] = useState<Organ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  useEffect(() => {
    if (!backendUrl) {
      setError("URL do Backend não configurada.");
      setIsLoading(false);
      return;
    }

    const fetchOrgans = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${backendUrl}/api/master-data/organs`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro ao buscar órgãos: ${response.status} - ${response.statusText}. Detalhes: ${errorText}`);
        }
        const data: Organ[] = await response.json();
        setOrgans(data);
      } catch (e: any) {
        setError(e.message || "Ocorreu um erro desconhecido ao buscar órgãos.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrgans();
  }, [backendUrl]);

  // Lógica de deleção (exemplo, você pode mover para um hook ou utils)
  const handleDelete = async (organId: number) => {
    if (!backendUrl) {
        setError("URL do Backend não configurada para deleção.");
        return;
    }
    if (confirm(`Tem certeza que deseja deletar o órgão com ID ${organId}?`)) {
        setIsLoading(true); // Pode adicionar um loading específico para deleção
        try {
            const response = await fetch(`${backendUrl}/api/master-data/organs/${organId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro ao deletar órgão: ${response.statusText}`);
            }
            // Atualiza a lista de órgãos após a deleção
            setOrgans(prevOrgans => prevOrgans.filter(organ => organ.id !== organId));
            alert("Órgão deletado com sucesso!");
        } catch (e: any) {
            setError(e.message || "Ocorreu um erro desconhecido ao deletar o órgão.");
        } finally {
            setIsLoading(false);
        }
    }
  };


  return (
    <div style={{ padding: '20px' }}>
      <h1>Lista de Órgãos</h1>
      <Link href="/organs/new" style={{ display: 'inline-block', marginBottom: '20px', padding: '10px 15px', backgroundColor: 'blue', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
        Adicionar Novo Órgão
      </Link>

      {isLoading && <p>Carregando órgãos...</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>Erro: {error}</p>}
      
      {!isLoading && !error && organs.length === 0 && (
        <p>Nenhum órgão cadastrado.</p>
      )}

      {!isLoading && !error && organs.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd', backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Nome</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Tempo Máx. Isquemia (h)</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {organs.map((organ) => (
              <tr key={organ.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{organ.id}</td>
                <td style={{ padding: '10px' }}>{organ.name}</td>
                <td style={{ padding: '10px' }}>{organ.maxIschemiaHours}</td>
                <td style={{ padding: '10px' }}>
                  {/* Adicionar link para Edição no futuro */}
                  {/* <Link href={`/organs/edit/${organ.id}`} style={{marginRight: '10px'}}>Editar</Link> */}
                  <button onClick={() => handleDelete(organ.id)} style={{color: 'red', cursor: 'pointer'}}>Deletar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
