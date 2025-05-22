'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Hospital {
  id: number;
  name: string;
  city: string;
}
interface Organ {
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
  initialData?: ReceiverFormData & { id?: number };
  onSubmit: (data: ReceiverFormData) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText?: string;
}

export default function ReceiverForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitButtonText = "Salvar Receptor"
}: ReceiverFormProps) {
  const [formData, setFormData] = useState<ReceiverFormData>({
    bloodType: '',
    urgencyLevel: '3',
    hospitalId: '',
    organNeededId: '',
    registrationDate: initialData?.registrationDate || new Date().toISOString().substring(0, 16),
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
        console.error("URL do Backend não configurada para ReceiverForm");
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

        if (initialData?.hospitalId) {
            setFormData(prev => ({...prev, hospitalId: String(initialData.hospitalId)}));
        }
        if (initialData?.organNeededId) {
            setFormData(prev => ({...prev, organNeededId: String(initialData.organNeededId)}));
        }

      } catch (error) {
        console.error("Erro ao carregar dados para dropdowns:", error);
      } finally {
        setLoadingDropdowns(false);
      }
    };
    fetchDataForDropdowns();
  }, [backendUrl, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.hospitalId || !formData.organNeededId || !formData.urgencyLevel) {
        alert("Por favor, selecione hospital, órgão e nível de urgência.");
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
        <label htmlFor="urgencyLevel">Nível de Urgência (1-5, 1=máxima):</label>
        <input type="number" id="urgencyLevel" name="urgencyLevel" value={formData.urgencyLevel} onChange={handleChange} min="1" max="5" required style={{ width: '100%', padding: '8px' }} />
      </div>
      <div>
        <label htmlFor="hospitalId">Hospital (onde aguarda):</label>
        <select id="hospitalId" name="hospitalId" value={formData.hospitalId} onChange={handleChange} required style={{ width: '100%', padding: '8px' }}>
          <option value="" disabled>Selecione um hospital</option>
          {hospitals.map(hospital => (
            <option key={hospital.id} value={hospital.id}>{hospital.name} ({hospital.city})</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="organNeededId">Órgão Necessário:</label>
        <select id="organNeededId" name="organNeededId" value={formData.organNeededId} onChange={handleChange} required style={{ width: '100%', padding: '8px' }}>
          <option value="" disabled>Selecione um órgão</option>
          {organs.map(organ => (
            <option key={organ.id} value={organ.id}>{organ.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="registrationDate">Data de Inscrição (Opcional):</label>
        <input 
            type="datetime-local" 
            id="registrationDate" 
            name="registrationDate" 
            value={formData.registrationDate || ''} 
            onChange={handleChange} 
            style={{ width: '100%', padding: '8px' }} />
      </div>
      <button type="submit" disabled={isSubmitting || loadingDropdowns} style={{ padding: '10px', marginTop: '10px', cursor: 'pointer' }}>
        {isSubmitting ? 'Salvando...' : submitButtonText}
      </button>
      <button type="button" onClick={() => router.push('/receivers')} disabled={isSubmitting} style={{ padding: '10px', marginTop: '5px', backgroundColor: '#f0f0f0', cursor: 'pointer' }}>
        Cancelar
      </button>
    </form>
  );
}
