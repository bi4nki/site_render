'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react'; // Ícone para os selects

// Interfaces para os dados dos dropdowns
interface HospitalOption {
  id: number;
  name: string;
  city: string; 
}
interface OrganOption {
  id: number;
  name: string;
}

// Interface para os dados do formulário
export interface ReceiverFormData {
  bloodType: string;
  urgencyLevel: string; // Input é string, converter para número
  hospitalId: string;   // Mantido como string para o valor do <select>
  organNeededId: string;// Mantido como string para o valor do <select>
  registrationDate?: string; // Formato ISO YYYY-MM-DDTHH:mm
}

interface ReceiverFormProps {
  initialData?: Partial<ReceiverFormData & { id?: number }>; // Para edição futura
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
    urgencyLevel: initialData?.urgencyLevel || '3', // Default para urgência média
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
      console.error("Erro ao carregar dados para dropdowns (ReceiverForm):", error);
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
    if (!formData.hospitalId || !formData.organNeededId || !formData.urgencyLevel) {
        alert("Por favor, selecione hospital, órgão necessário e nível de urgência.");
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
        <label htmlFor="urgencyLevel" className="block text-sm font-medium text-slate-700 mb-1">Nível de Urgência (1=máx, 5=min):</label>
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
        {organs.length === 0 && !loadingDropdowns && <p className="text-xs text-slate-500 mt-1">Nenhum tipo de órgão cadastrado.</p>}
      </div>

      <div>
        <label htmlFor="registrationDate" className="block text-sm font-medium text-slate-700 mb-1">Data de Inscrição (Opcional):</label>
        <input 
          type="datetime-local" id="registrationDate" name="registrationDate" 
          value={formData.registrationDate || ''} 
          onChange={handleChange} 
          className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:text-sm"
        />
      </div>

      {formError && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-200">{formError}</p>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-3 pt-4">
        <button 
          type="button" 
          onClick={() => router.push('/receivers')} 
          disabled={isSubmitting} 
          className="w-full sm:w-auto mb-2 sm:mb-0 px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting || loadingDropdowns} 
          className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
        >
          {isSubmitting ? 'Salvando...' : submitButtonText}
        </button>
      </div>
    </Entendido! Vamos criar o CRUD completo para Receptores no frontend, seguindo o mesmo padrão e estilo Tailwind CSS que usamos para Doadores.

---
**1. Componente: `frontend/app/components/ReceiverForm.tsx`**
---
Este formulário será usado para criar (e futuramente editar) receptores. Ele também buscará a lista de hospitais e órgãos.

```typescript jsx
'use client';

import { useState, useEffect,form>
  );
}
