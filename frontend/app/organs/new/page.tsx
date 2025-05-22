'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OrganForm, { OrganFormData } from '../../components/OrganForm'; // Ajuste o path se necessário

export default function NewOrganPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const handleCreateOrgan = async (formData: OrganFormData) => {
    if (!backendUrl) {
      setError("URL do Backend não configurada.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const dataToSubmit = {
      name: formData.name,
      maxIschemiaHours: parseInt(formData.maxIschemiaHours, 10), // Converter para número
    };

    try {
      const response = await fetch(`${backendUrl}/api/master-data/organs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ao criar órgão: ${response.statusText}`);
      }
      alert("Órgão criado com sucesso!");
      router.push('/organs'); 
    } catch (e: any) {
      console.error("Falha ao criar órgão:", e);
      setError(e.message || "Ocorreu um erro desconhecido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Adicionar Novo Órgão</h1>
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>Erro: {error}</p>}
      <OrganForm 
        onSubmit={handleCreateOrgan} 
        isSubmitting={isSubmitting}
        submitButtonText="Criar Órgão"
      />
    </div>
  );
}
