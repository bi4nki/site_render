'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReceiverForm, { ReceiverFormData } from '../../components/ReceiverForm'; 
import Link from 'next/link';

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
      ...(formData.registrationDate && !isNaN(new Date(formData.registrationDate).getTime()) && 
        { registrationDate: new Date(formData.registrationDate).toISOString() })
    };

    try {
      const response = await fetch(`${backendUrl}/api/master-data/receivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || `Erro ao criar receptor: ${response.statusText}`);
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
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
         <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-700">
            Adicionar Novo Receptor
            </h1>
            <Link href="/receivers" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                ← Voltar para Lista de Receptores
            </Link>
        </div>
        
        <ReceiverForm 
          onSubmit={handleCreateReceiver} 
          isSubmitting={isSubmitting}
          submitButtonText="Criar Receptor"
          formError={error}
        />
      </div>
    </div>
  );
}
