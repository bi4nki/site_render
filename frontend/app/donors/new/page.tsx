'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DonorForm, { DonorFormData } from '../../components/DonorForm'; 

export default function NewDonorPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const handleCreateDonor = async (formData: DonorFormData) => {
    if (!backendUrl) { /* ... */ return; }
    setIsSubmitting(true); setError(null);
    const dataToSubmit = {
      bloodType: formData.bloodType,
      hospitalId: parseInt(formData.hospitalId, 10),
      organId: parseInt(formData.organId, 10),
      ...(formData.availabilityDateTime && { availabilityDateTime: new Date(formData.availabilityDateTime).toISOString() })
    };
    try {
      const response = await fetch(`${backendUrl}/api/master-data/donors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      });
      if (!response.ok) { const errD = await response.json(); throw new Error(errD.error || `Erro`); }
      alert("Doador criado!");
      router.push('/donors'); 
    } catch (e: any) { setError(e.message || "Erro."); } 
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-700 mb-8 text-center">
          Adicionar Novo Doador
        </h1>
        {error && (
          <div className="mb-6 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md">
            <p className="font-bold">Erro:</p>
            <p>{error}</p>
          </div>
        )}
        <DonorForm 
          onSubmit={handleCreateDonor} 
          isSubmitting={isSubmitting}
          submitButtonText="Criar Doador"
        />
      </div>
    </div>
  );
}
