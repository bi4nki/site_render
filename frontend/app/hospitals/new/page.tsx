'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HospitalForm, { HospitalFormData } from '../../components/HospitalForm'; 
// Ajuste o import '../../components/HospitalForm' para '@/app/components/HospitalForm' 
// ou o alias correto que você configurou, se tiver.

export default function NewHospitalPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const handleCreateHospital = async (formData: HospitalFormData) => {
    if (!backendUrl) { /* ... */ }
    setIsSubmitting(true); setError(null);

    const dataToSubmit = {
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      transplantTypes: formData.transplantTypes.split(',').map(type => type.trim()).filter(type => type),
    };

    try {
      const response = await fetch(`${backendUrl}/api/master-data/hospitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) { /* ... */ }
      alert("Hospital criado com sucesso!");
      router.push('/hospitals'); 
    } catch (e: any) { /* ... */ } 
    finally { setIsSubmitting(false); }
  };

  return (
    // Container da página estilizado
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto"> {/* Centraliza o conteúdo do formulário */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-700 mb-8 text-center">
          Adicionar Novo Hospital
        </h1>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
            <strong>Erro:</strong> {error}
          </div>
        )}
        <HospitalForm 
          onSubmit={handleCreateHospital} 
          isSubmitting={isSubmitting}
          submitButtonText="Criar Hospital"
        />
      </div>
    </div>
  );
}
