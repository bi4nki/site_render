'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DonorForm, { DonorFormData } from '../../components/DonorForm'; // Ajuste o path se necessário

export default function NewDonorPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const handleCreateDonor = async (formData: DonorFormData) => {
    if (!backendUrl) {
      setError("URL do Backend não configurada.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const dataToSubmit = {
      bloodType: formData.bloodType,
      hospitalId: parseInt(formData.hospitalId, 10),
      organId: parseInt(formData.organId, 10),
      // Envia availabilityDateTime apenas se tiver valor, senão o backend usará o default
      ...(formData.availabilityDateTime && { availabilityDateTime: new Date(formData.availabilityDateTime).toISOString() })
    };

    try {
      const response = await fetch(`${backendUrl}/api/master-data/donors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ao criar doador: ${response.statusText}`);
      }
      alert("Doador criado com sucesso!");
      router.push('/donors'); 
    } catch (e: any) {
      console.error("Falha ao criar doador:", e);
      setError(e.message || "Ocorreu um erro desconhecido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Adicionar Novo Doador</h1>
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>Erro: {error}</p>}
      <DonorForm 
        onSubmit={handleCreateDonor} 
        isSubmitting={isSubmitting}
        submitButtonText="Criar Doador"
      />
    </div>
  );
}
