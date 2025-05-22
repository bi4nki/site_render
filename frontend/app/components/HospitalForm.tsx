'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Para redirecionamento

export interface HospitalFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  latitude: string; // Manter como string para o input, converter antes de enviar
  longitude: string; // Manter como string para o input
  transplantTypes: string; // String separada por vírgulas para input, converter para array
}

interface HospitalFormProps {
  initialData?: HospitalFormData & { id?: number }; // Para edição
  onSubmit: (data: HospitalFormData) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText?: string;
}

export default function HospitalForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitButtonText = "Salvar Hospital"
}: HospitalFormProps) {
  
  // Lógica para inicializar transplantTypes corretamente
  let initialTransplantTypesString = '';
  if (initialData?.transplantTypes) {
    if (Array.isArray(initialData.transplantTypes)) {
      initialTransplantTypesString = (initialData.transplantTypes as string[]).join(', ');
    } else {
      // Se já for string (ou outro tipo que não array), usa diretamente
      initialTransplantTypesString = initialData.transplantTypes;
    }
  }

  const [formData, setFormData] = useState<HospitalFormData>({
    name: '',
    address: '',
    city: '',
    state: '',
    latitude: '',
    longitude: '',
    // ... Espalha initialData, MAS sobrescreve transplantTypes logo abaixo
    ...initialData, 
    transplantTypes: initialTransplantTypesString, // Define transplantTypes UMA VEZ aqui
  });

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  // ... (resto do JSX do formulário como antes) ...
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '500px' }}>
      {/* ... campos do formulário ... */}
      <div>
        <label htmlFor="name">Nome do Hospital:</label>
        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
      </div>
      <div>
        <label htmlFor="address">Endereço:</label>
        <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
      </div>
      <div>
        <label htmlFor="city">Cidade:</label>
        <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
      </div>
      <div>
        <label htmlFor="state">Estado (UF):</label>
        <input type="text" id="state" name="state" value={formData.state} onChange={handleChange} maxLength={2} style={{ width: '100%', padding: '8px' }} />
      </div>
      <div>
        <label htmlFor="latitude">Latitude:</label>
        <input type="number" step="any" id="latitude" name="latitude" value={formData.latitude} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
      </div>
      <div>
        <label htmlFor="longitude">Longitude:</label>
        <input type="number" step="any" id="longitude" name="longitude" value={formData.longitude} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
      </div>
      <div>
        <label htmlFor="transplantTypes">Tipos de Transplante (separados por vírgula):</label>
        <input type="text" id="transplantTypes" name="transplantTypes" value={formData.transplantTypes} onChange={handleChange} placeholder="Ex: RIM, FIGADO, CORACAO" style={{ width: '100%', padding: '8px' }} />
      </div>
      <button type="submit" disabled={isSubmitting} style={{ padding: '10px', marginTop: '10px', cursor: 'pointer' }}>
        {isSubmitting ? 'Salvando...' : submitButtonText}
      </button>
      <button type="button" onClick={() => router.push('/hospitals')} disabled={isSubmitting} style={{ padding: '10px', marginTop: '5px', backgroundColor: '#f0f0f0', cursor: 'pointer' }}>
        Cancelar
      </button>
    </form>
  );
}
