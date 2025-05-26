'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { UserPlus, Trash2, Edit3, Hospital, Activity, ShieldAlert } from 'lucide-react';

interface HospitalSimple { id: number; name: string; }
interface OrganSimple { id: number; name: string; }
interface Receiver {
  id: number;
  bloodType: string;
  urgencyLevel: number;
  registrationDate: string; 
  hospital: HospitalSimple;
  organNeeded: OrganSimple; 
  createdAt: string;
}

export default function ReceiversPage() {
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

interface HospitalOption {
  id: number;
  name: string;
  city: string;
}
interface OrganOption {
  id: number;
  name: string;
}

export interface ReceiverFormData {
  bloodType: string;
  urgencyLevel: string; 
  hospitalId: string;   
  organNeededId: string;
  registrationDate?: string; 
}

interface ReceiverFormProps {
  initialData?: Partial<ReceiverFormData & { id?: number }>; 
  onSubmit: (data: ReceiverFormData) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText?: string;
  formError?: string | null;
}

export default function ReceiverForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitButtonText = "Salvar Receptor",
  formError
}: ReceiverFormProps) {
  const [formData, setFormData] = useState<ReceiverFormData>({
    bloodType: initialData?.bloodType || '',
    urgencyLevel: initialData?.urgencyLevel || '3', 
    hospitalId: initialData?.hospitalId || '',
    organNeededId: initialData?.organNeededId || '',
    registrationDate: initialData?.registrationDate || new Date().toISOString().substring(0, 16),
  });

  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [organs, setOrgans] = useState<OrganOption[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [dropdownError, setDropdownError] = useState<string | null>(null);

  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const fetchDataForDropdowns = useCallback(async () => {
    if (!backendUrl) {
      setDropdownError("URL do Backend não configurada.");
      setLoadingDropdowns(false);
      return;
    }
    setLoadingDropdowns(true);
    setDropdownError(null);
    try {
      const [hospitalsRes, organsRes] = await Promise.all([
        fetch(`${backendUrl}/api/master-data/hospitals`),
        fetch(`${backendUrl}/api/master-data/organs`),
      ]);

      if (!hospitalsRes.ok) throw new Error(`Falha ao buscar hospitais: ${hospitalsRes.statusText}`);
      if (!organsRes.ok) throw new Error(`Falha ao buscar órgãos: ${organsRes.statusText}`);

      const hospitalsData: HospitalOption[] = await hospitalsRes.json();
      const organsData: OrganOption[] = await organsRes.json();

      setHospitals(hospitalsData);
      setOrgans(organsData);

      if (initialData?.hospitalId && hospitalsData.some(h => String(h.id) === String(initialData.hospitalId))) {
        setFormData(prev => ({ ...prev, hospitalId: String(initialData.hospitalId) }));
      }
      if (initialData?.organNeededId && organsData.some(o => String(o.id) === String(initialData.organNeededId))) {
        setFormData(prev => ({ ...prev, organNeededId: String(initialData.organNeededId) }));
      }

    } catch (error: any) {
      console.error("Erro ao carregar dados para dropdowns [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const fetchReceivers = useCallback(async () => {
    if (!backendUrl) { setError("URL Backend não configurada."); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/master-data/receivers`);
      if (!response.ok) { 
        const errData = await response.json().catch(()=>({error:"Erro"}));
        throw new Error(errData.error || `Erro ${response.status}`);
      }
      const data: Receiver[] = await response.json();
      setReceivers(data);
    } catch (e: any) { setError(e.message || "Erro ao buscar receptores.");
    } finally { setIsLoading(false); }
  }, [backendUrl]); 

  useEffect(() => {
    fetchReceivers();
  }, [fetchReceivers]); 

  const handleDelete = async (receiverId: number) => {
    if (!backendUrl) { setError("URL Backend não configurada."); return; }
    if (confirm(`Tem certeza que deseja deletar o receptor com ID ${receiverId}?`)) {
        try {
            const res = await fetch(`${backendUrl}/api/master-data/receivers/${receiverId}`, { method: 'DELETE' });
            if (!res.ok) { 
                const errData = await res.json().catch(()=>({error:"Erro"}));
                throw new Error(errData.error || "Falha ao deletar");
            }
            alert("Receptor deletado com sucesso!"); 
            fetchReceivers(); 
        } catch(e:any) { setError(e.message || "Erro ao deletar receptor."); }
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-slate-300">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-700 mb-4 sm:mb-0">
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
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipo Sanguíneo</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center"><ShieldAlert className="h-4 w-4 mr-1 text-slate-400"/>Urgência</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center"><Hospital className="h-4 w-4 mr-1 text-slate-400"/>Hospital</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center"><Activity className="h-4 w-4 mr-1 text-slate-400"/>Órgão Necessário</th>
                <th scope="col" className="px (ReceiverForm):", error);
      setDropdownError(error.message || "Erro ao carregar opções.");
    } finally {
      setLoadingDropdowns(false);
    }
  }, [backendUrl, initialData]);

  useEffect(() => {
    fetchDataForDropdowns();
  }, [fetchDataForDropdowns]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.hospitalId || !formData.organNeededId || !formData.urgencyLevel || !formData.bloodType) {
        alert("Por favor, preencha todos os campos obrigatórios (Tipo Sanguíneo, Urgência, Hospital e Órgão).");
        return;
    }
    await onSubmit(formData);
  };

  if (loadingDropdowns) {
    return <p className="text-center text-slate-500 p-4 animate-pulse">Carregando opções do formulário...</p>;
  }
  if (dropdownError) {
    return <p className="text-center text-red-600 p-4 bg-red-50 border border-red-200 rounded-md">{dropdownError}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-slate-200">
      <div>
        <label htmlFor="bloodType" className="block text-sm font-medium text-slate-700 mb-1">Tipo Sanguíneo:</label>
        <input 
          type="text" id="bloodType" name="bloodType" 
          value={formData.bloodType} onChange={handleChange} 
          required placeholder="Ex: B-, AB+" 
          className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="urgencyLevel" className="block text-sm font-medium text-slate-700 mb-1">Nível de Urgência (1=Máx, 5=Min):</label>
        <input 
          type="number" id="urgencyLevel" name="urgencyLevel" 
          value={formData.urgencyLevel} onChange={handleChange} 
          min="1" max="5" required 
          className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:text-sm"
        />
      </div>
      
      <div className="relative">
        <label htmlFor="hospitalId" className="block text-sm font-medium text-slate-700 mb-1">Hospital (onde aguarda):</label>
        <select 
          id="hospitalId" name="hospitalId" 
          value={formData.hospitalId} onChange={handleChange} 
          required 
          className="mt-1 block w-full appearance-none px-3 py-2.5 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:text-sm disabled:bg-slate-100"
          disabled={isSubmitting || hospitals.length === 0}
        >
          <option value="" disabled>-- Selecione um hospital --</option>
          {hospitals.map(hospital => (
            <option key={hospital.id} value={String(hospital.id)}>{hospital.name} ({hospital.city})</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-9 h-5 w-5 text-slate-400 pointer-events-none"/>
        {hospitals.length === 0 && !loadingDropdowns && <p className="text-xs text-slate-500 mt-1">Nenhum hospital cadastrado.</p>}
      </div>

      <div className="relative">
        <label htmlFor="organNeededId" className="block text-sm font-medium text-slate-700 mb-1">Órgão Necessário:</label>
        <select 
          id="organNeededId" name="organNeededId" 
          value={formData.organNeededId} onChange={handleChange} 
          required 
          className="mt-1 block w-full appearance-none px-3 py-2.5 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:text-sm disabled:bg-slate-100"
          disabled={isSubmitting || organs.length === 0}
        >
          <option value="" disabled>-- Selecione um órgão --</option>
          {organs.map(organ => (
            <option key={organ.id} value={String(organ.id)}>{organ.name}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-9 h-5 w-5 text-slate-400 pointer-events-none"/>
        {organs.length === 0 && !loadingDropdowns && <p className="text-xs text-slate-500 mt-1">-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Data Registro</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    {}
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
