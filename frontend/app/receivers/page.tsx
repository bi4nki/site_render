'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
    UserPlus, 
    Trash2, 
    Edit3, 
    Building as HospitalIcon,      
    ActivitySquare as OrganIcon,
    ShieldAlert 
} from 'lucide-react';

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
  organNeeded: OrganSimple; 
  createdAt?: string; 
}

export default function ReceiversPage() {
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const fetchReceivers = useCallback(async () => {
    if (!backendUrl) { 
      setError("URL do Backend não configurada."); 
      setIsLoading(false); 
      return; 
    }
    setIsLoading(true); 
    setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/master-data/receivers`);
      if (!response.ok) { 
        const errData = await response.json().catch(()=>({error: `Erro HTTP ${response.status}`}));
        throw new Error(errData.error || `Erro ${response.status} ao buscar receptores.`);
      }
      const data: Receiver[] = await response.json();
      setReceivers(data);
    } catch (e: any) { 
      setError(e.message || "Ocorreu um erro desconhecido ao buscar receptores.");
      setReceivers([]); 
    } finally { 
      setIsLoading(false); 
    }
  }, [backendUrl]); 

  useEffect(() => {
    fetchReceivers();
  }, [fetchReceivers]); 

  const handleDelete = async (receiverId: number) => {
    if (!backendUrl) { 
      setError("URL do Backend não configurada para deleção."); 
      return; 
    }
    if (confirm(`Tem certeza que deseja deletar o receptor com ID ${receiverId}? Esta ação não pode ser desfeita.`)) {
        setError(null);
        try {
            const response = await fetch(`${backendUrl}/api/master-data/receivers/${receiverId}`, { 
                method: 'DELETE',
            });
            if (!response.ok) { 
                const errorData = await response.json().catch(()=>({error: `Erro HTTP ${response.status}`}));
                throw new Error(errorData.error || "Falha ao deletar receptor.");
            }
            alert("Receptor deletado com sucesso!"); 
            fetchReceivers(); 
        } catch(e:any) { 
            setError(e.message || "Ocorreu um erro desconhecido ao deletar o receptor."); 
        } finally {
        }
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-slate-300">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-700 mb-4 sm:mb-0 tracking-tight">
          Gerenciamento de Receptores
        </h1>
        <Link href="/receivers/new" 
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow hover:shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-opacity-50 flex items-center">
          <UserPlus className="h-5 w-5 mr-2" />
          Adicionar Novo Receptor
        </Link>
      </div>

      {isLoading && <div className="text-center text-slate-600 py-6 text-lg animate-pulse">Carregando lista de receptores...</div>}
      {error && !isLoading && <div className="text-center text-red-700 font-semibold p-4 bg-red-100 border border-red-300 rounded-lg mt-4 shadow-sm">Erro: {error}</div>}
      
      {!isLoading && !error && receivers.length === 0 && (
        <div className="text-center text-slate-500 mt-6 py-6 bg-white p-8 rounded-lg shadow-md">
            Nenhum receptor cadastrado. 
            <Link href="/receivers/new" className="text-blue-600 hover:text-blue-800 font-semibold ml-2">
                 Adicione um agora!
            </Link>
        </div>
      )}

       {!isLoading && !error && receivers.length > 0 && (
        <div className="overflow-x-auto shadow-xl rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100">
              {/* O <tr> do cabeçalho define as colunas */}
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipo Sanguíneo</th>
                
                {/* Cabeçalho para Urgência */}
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center"> {/* Flex para alinhar ícone e texto */}
                    <ShieldAlert className="h-4 w-4 mr-1.5 text-slate-400"/> Urgência
                  </div>
                </th>
                
                {/* Cabeçalho para Hospital */}
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center"> {/* Flex para alinhar ícone e texto */}
                    <HospitalIcon className="h-4 w-4 mr-1.5 text-slate-400"/> Hospital
                  </div>
                </th>
                
                {/* Cabeçalho para Órgão Necessário */}
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center"> {/* Flex para alinhar ícone e texto */}
                    <OrganIcon className="h-4 w-4 mr-1.5 text-slate-400"/> Órgão Necessário
                  </div>
                </th>
                
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Data Inscrição</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {receivers.map((receiver) => (
                <tr key={receiver.id} className="hover:bg-slate-50 transition-colors duration-150 ease-in-out">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{receiver.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{receiver.bloodType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">{receiver.urgencyLevel}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 max-w-xs truncate" title={receiver.hospital?.name}>{receiver.hospital?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{receiver.organNeeded?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(receiver.registrationDate).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleDelete(receiver.id)} 
                      className="text-red-500 hover:text-red-700 transition duration-150 ease-in-out font-semibold focus:outline-none hover:underline flex items-center"
                    >
                      <Trash2 className="inline h-4 w-4 mr-1" /> Deletar
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
