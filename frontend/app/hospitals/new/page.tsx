'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HospitalForm, { HospitalFormData } from '../../components/HospitalForm'; // Ajuste o path se necessário

export default function NewHospitalPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const handleCreateHospital = async (formData: HospitalFormData) => {
    if (!backendUrl) {
      setError("URL do Backend não configurada.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    // Converter transplantTypes de string para array e latitude/longitude para float
    const dataToSubmit = {
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      transplantTypes: formData.transplantTypes.split(',').map(type => type.trim()).filter(type => type), // Cria array e remove vazios
    };

    try {
      const response = await fetch(`${backendUrl}/api/master-data/hospitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ao criar hospital: ${response.statusText}`);
      }

      // const newHospital = await response.json();
      // console.log("Hospital criado:", newHospital);
      alert("Hospital criado com sucesso!");
      router.push('/hospitals'); // Redireciona para a lista de hospitais
    } catch (e: any) {
      console.error("Falha ao criar hospital:", e);
      setError(e.message || "Ocorreu um erro desconhecido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Adicionar Novo Hospital</h1>
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>Erro: {error}</p>}
      <HospitalForm 
        onSubmit={handleCreateHospital} 
        isSubmitting={isSubmitting}
        submitButtonText="Criar Hospital"
      />
    </div>
  );
}
