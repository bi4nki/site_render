'use client';

import { useState } from 'react'; // useEffect não é usado aqui, pode remover se não houver mais lógica
import { useRouter } from 'next/navigation'; 

export interface HospitalFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  latitude: string; 
  longitude: string; 
  transplantTypes: string; 
}

interface HospitalFormProps {
  initialData?: HospitalFormData & { id?: number }; 
  onSubmit: (data: HospitalFormData) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText?: string;
}

export default function HospitalForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitButtonText = "Salvar Hospital"
}: HospitalFormProps) {
  const [formData, setFormData] = useState<HospitalFormData>({
    name: '',
    address: '',
    city: '',
    state: '',
    latitude: '',
    longitude: '',
    transplantTypes: '',
    ...initialData,
    transplantTypes: initialData?.transplantTypes && Array.isArray(initialData.transplantTypes)
                        ? (initialData.transplantTypes as string[]).join(', ')
                        : initialData?.transplantTypes || ''
  });

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    // Formulário com espaçamento e largura máxima
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-slate-200">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
          Nome do Hospital:
        </label>
        <input 
          type="text" 
          id="name" 
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
          required 
          className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">
          Endereço:
        </label>
        <input 
          type="text" 
          id="address" 
          name="address" 
          value={formData.address} 
          onChange={handleChange} 
          className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:text-sm"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1">
            Cidade:
          </label>
          <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-slate-700 mb-1">
            Estado (UF):
          </label>
          <input type="text" id="state" name="state" value={formData.state} onChange={handleChange} maxLength={2} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="latitude" className="block text-sm font-medium text-slate-700 mb-1">
            Latitude:
          </label>
          <input type="number" step="any" id="latitude" name="latitude" value={formData.latitude} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="longitude" className="block text-sm font-medium text-slate-700 mb-1">
            Longitude:
          </label>
          <input type="number" step="any" id="longitude" name="longitude" value={formData.longitude} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:text-sm" />
        </div>
      </div>
      <div>
        <label htmlFor="transplantTypes" className="block text-sm font-medium text-slate-700 mb-1">
          Tipos de Transplante (separados por vírgula):
        </label>
        <input 
          type="text" 
          id="transplantTypes" 
          name="transplantTypes" 
          value={formData.transplantTypes} 
          onChange={handleChange} 
          placeholder="Ex: RIM, FIGADO, CORACAO" 
          className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:text-sm"
        />
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-3 pt-4">
        <button 
          type="button" 
          onClick={() => router.push('/hospitals')} 
          disabled={isSubmitting} 
          className="w-full sm:w-auto mb-2 sm:mb-0 px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition duration-150 ease-in-out"
        >
          {isSubmitting ? 'Salvando...' : submitButtonText}
        </button>
      </div>
    </form>
  );
}
