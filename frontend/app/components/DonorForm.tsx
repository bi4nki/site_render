'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Supondo que você tenha essas interfaces definidas em algum lugar ou as defina aqui
interface Hospital {
  id: number;
  name: string;
  city: string;
}
interface Organ {
  id: number;
  name: string;
}

export interface DonorFormData {
  bloodType: string;
  hospitalId: string; // Mantém como string para o select, converte ao submeter
  organId: string;    // Mantém como string para o select
  availabilityDateTime?: string; // Opcional, formato ISO string
}

interface DonorFormProps {
  initialData?: DonorFormData & { id?: number };
  onSubmit: (data: DonorFormData) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText?: string;
}

export default function DonorForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitButtonText = "Salvar Doador"
}: DonorFormProps) {
  const [formData, setFormData] = useState<DonorFormData>({
    bloodType: '',
    hospitalId: '',
    organId: '',
    availabilityDateTime: initialData?.availabilityDateTime || new Date().toISOString().substring(0, 16), // Default para data/hora atual
    ...initialData,
  });

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [organs, setOrgans] = useState<Organ[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  useEffect(() => {
    const fetchDataForDropdowns = async () => {
      if (!backendUrl) {
        console.error("URL do Backend não configurada para DonorForm");
        setLoadingDropdowns(false);
        return;
      }
      setLoadingDropdowns(true);
      try {
        const [hospitalsRes, organsRes] = await Promise.all([
          fetch(`${backendUrl}/api/master-data/hospitals`),
          fetch(`${backendUrl}/api/master-data/organs`),
        ]);

        if (!hospitalsRes.ok || !organsRes.ok) {
          throw new Error('Falha ao buscar dados para os dropdowns');
        }

        const hospitalsData = await hospitalsRes.json();
        const organsData = await organsRes.json();

        setHospitals(hospitalsData);
        setOrgans(organsData);

        // Se for edição e initialData existir, pré-selecionar
        if (initialData?.hospitalId) {
            setFormData(prev => ({...prev, hospitalId: String(initialData.hospitalId)}));
        }
        if (initialData?.organId) {
            setFormData(prev => ({...prev, organId: String(initialData.organId)}));
        }

      } catch (error) {
        console.error("Erro ao carregar dados para dropdowns:", error);
        // Tratar erro (ex: mostrar mensagem para o usuário)
      } finally {
        setLoadingDropdowns(false);
      }
    };
    fetchDataForDropdowns();
  }, [backendUrl, initialData]); // Adiciona initialData para re-selecionar em edição

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Validação para garantir que hospitalId e organId foram selecionados
    if (!formData.hospitalId || !formData.organId) {
        alert("Por favor, selecione um hospital e um órgão.");
        return;
    }
    await onSubmit(formData);
  };

  if (loadingDropdowns) {
    return <p>Carregando dados do formulário...</p>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '500px' }}>
      <div>
        <label htmlFor="bloodType">Tipo Sanguíneo:</label>
        <input type="text" id="bloodType" name="bloodType" value={formData.bloodType} onChange={handleChange} required placeholder="Ex: A+, O-" style={{ width: '100%', padding: '8px' }} />
      </div>
      <div>
        <label htmlFor="hospitalId">Hospital de Origem:</label>
        <select id="hospitalId" name="hospitalId" value={formData.hospitalId} onChange={handleChange} required style={{ width: '100%', padding: '8px' }}>
          <option value="" disabled>Selecione um hospital</option>
          {hospitals.map(hospital => (
            <option key={hospital.id} value={hospital.id}>{hospital.name} ({hospital.city})</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="organId">Órgão Doador:</label>
        <select id="organId" name="organId" value={formData.organId} onChange={handleChange} required style={{ width: '100%', padding: '8px' }}>
          <option value="" disabled>Selecione um órgão</option>
          {organs.map(organ => (
            <option key={organ.id} value={organ.id}>{organ.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="availabilityDateTime">Data/Hora Disponibilidade (Opcional):</label>
        <input 
            type="datetime-local" 
            id="availabilityDateTime" 
            name="availabilityDateTime" 
            value={formData.availabilityDateTime || ''} 
            onChange={handleChange} 
            style={{ width: '100%', padding: '8px' }} />
      </div>
      <button type="submit" disabled={isSubmitting || loadingDropdowns} style={{ padding: '10px', marginTop: '10px', cursor: 'pointer' }}>
        {isSubmitting ? 'Salvando...' : submitButtonText}
      </button>
      <button type="button" onClick={() => router.push('/donors')} disabled={isSubmitting} style={{ padding: '10px', marginTop: '5px', backgroundColor: '#f0f0f0', cursor: 'pointer' }}>
        Cancelar
      </button>
    </form>
  );
}
