'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReceiverForm, { ReceiverFormData } from '../../components/ReceiverForm';

export default function NewReceiverPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const handleCreateReceiver = async (formData: ReceiverFormData) => {
    if (!backendUrl) {
      setError("URL do Backend não configurada.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const dataToSubmit = {
      bloodType: formData.bloodType,
      urgencyLevel: parseInt(formData.urgencyLevel, 10),
      hospitalId: parseInt(formData.hospitalId, 10),
      organNeededId: parseInt(formData.organNeededId, 10),
      ...(formData.registrationDate && { registrationDate: new Date(formData.registrationDate).toISOString() })
    };

    try {
      const response = await fetch(`${backendUrl}/api/master-data/receivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ao criar receptor: ${response.statusText}`);
      }
      alert("Receptor criado com sucesso!");
      router.push('/receivers'); 
    } catch (e: any) {
      console.error("Falha ao criar receptor:", e);
      setError(e.message || "Ocorreu um erro desconhecido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Adicionar Novo Receptor</h1>
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>Erro: {error}</p>}
      <ReceiverForm 
        onSubmit={handleCreateReceiver} 
        isSubmitting={isSubmitting}
        submitButtonText="Criar Receptor"
      />
    </div>
  );
}
