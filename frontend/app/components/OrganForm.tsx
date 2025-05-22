'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface OrganFormData {
  name: string;
  maxIschemiaHours: string;
}

interface OrganFormProps {
  initialData?: OrganFormData & { id?: number };
  onSubmit: (data: OrganFormData) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText?: string;
}

export default function OrganForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitButtonText = "Salvar Órgão"
}: OrganFormProps) {
  const [formData, setFormData] = useState<OrganFormData>({
    name: '',
    maxIschemiaHours: '',
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
      <div>
        <label htmlFor="name">Nome do Órgão:</label>
        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
      </div>
      <div>
        <label htmlFor="maxIschemiaHours">Tempo Máx. Isquemia (horas):</label>
        <input type="number" id="maxIschemiaHours" name="maxIschemiaHours" value={formData.maxIschemiaHours} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
      </div>
      <button type="submit" disabled={isSubmitting} style={{ padding: '10px', marginTop: '10px', cursor: 'pointer' }}>
        {isSubmitting ? 'Salvando...' : submitButtonText}
      </button>
      <button type="button" onClick={() => router.push('/organs')} disabled={isSubmitting} style={{ padding: '10px', marginTop: '5px', backgroundColor: '#f0f0f0', cursor: 'pointer' }}>
        Cancelar
      </button>
    </form>
  );
}
