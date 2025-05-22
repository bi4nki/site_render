'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface AirportFormData {
  name: string;
  iataCode: string;
  city: string;
  state: string;
  latitude: string;  // Input é string
  longitude: string; // Input é string
}

interface AirportFormProps {
  initialData?: AirportFormData & { id?: number };
  onSubmit: (data: AirportFormData) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText?: string;
}

export default function AirportForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitButtonText = "Salvar Aeroporto"
}: AirportFormProps) {
  const [formData, setFormData] = useState<AirportFormData>({
    name: '',
    iataCode: '',
    city: '',
    state: '',
    latitude: '',
    longitude: '',
    ...initialData,
  });
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '500px' }}>
      <div>
        <label htmlFor="name">Nome do Aeroporto:</label>
        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
      </div>
      <div>
        <label htmlFor="iataCode">Código IATA (3 letras):</label>
        <input type="text" id="iataCode" name="iataCode" value={formData.iataCode} onChange={handleChange} required maxLength={3} style={{ width: '100%', padding: '8px' }} />
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
      <button type="submit" disabled={isSubmitting} style={{ padding: '10px', marginTop: '10px', cursor: 'pointer' }}>
        {isSubmitting ? 'Salvando...' : submitButtonText}
      </button>
      <button type="button" onClick={() => router.push('/airports')} disabled={isSubmitting} style={{ padding: '10px', marginTop: '5px', backgroundColor: '#f0f0f0', cursor: 'pointer' }}>
        Cancelar
      </button>
    </form>
  );
}
