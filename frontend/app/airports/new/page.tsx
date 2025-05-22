'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AirportForm, { AirportFormData } from '../../components/AirportForm'; // Ajuste o path

export default function NewAirportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const handleCreateAirport = async (formData: AirportFormData) => {
    if (!backendUrl) {
      setError("URL do Backend não configurada.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const dataToSubmit = {
      ...formData,
      iataCode: formData.iataCode.toUpperCase(), // IATA codes são geralmente maiúsculos
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
    };

    try {
      const response = await fetch(`${backendUrl}/api/master-data/airports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ao criar aeroporto: ${response.statusText}`);
      }
      alert("Aeroporto criado com sucesso!");
      router.push('/airports'); 
    } catch (e: any) {
      console.error("Falha ao criar aeroporto:", e);
      setError(e.message || "Ocorreu um erro desconhecido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Adicionar Novo Aeroporto</h1>
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>Erro: {error}</p>}
      <AirportForm 
        onSubmit={handleCreateAirport} 
        isSubmitting={isSubmitting}
        submitButtonText="Criar Aeroporto"
      />
    </div>
  );
}
