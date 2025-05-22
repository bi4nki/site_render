'use client'; // Necessário para usar hooks como useState, useEffect

import { useState } from 'react';

interface OptimizationResult {
  message: string;
  donorInfo?: { id: number; hospital: string; organ: string };
  receiverInfo?: { id: number; hospital: string; urgency: number };
  mlRecommendation?: {
    predicted_class_index: number;
    predicted_transport_mode: string;
    probabilities: number[];
  };
  logId?: number;
  // Adicionar aqui os transportOptions quando o backend os enviar
  // transportOptions?: Array<{ mode: string; estimatedTimeHours: number; estimatedCost: number; isRecommendedByML: boolean }>;
  error?: string;
  details?: any;
}

export default function OptimizePage() {
  const [donorId, setDonorId] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    if (!donorId || !receiverId) {
      setError("Por favor, insira os IDs do Doador e do Receptor.");
      setIsLoading(false);
      return;
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    if (!backendUrl) {
        setError("URL do Backend não configurada.");
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/process/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          donorId: parseInt(donorId),
          receiverId: parseInt(receiverId),
        }),
      });

      const data: OptimizationResult = await response.json();

      if (!response.ok) {
        // Se o backend retornou um erro (ex: 4xx, 5xx)
        setError(data.error || `Erro ${response.status}: ${response.statusText}`);
        if (data.details) {
            console.error("Detalhes do erro do backend:", data.details);
        }
        setResult(null);
      } else {
        setResult(data);
      }
    } catch (e: any) {
      console.error("Erro na chamada da API:", e);
      setError(`Falha ao conectar com a API: ${e.message}`);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Otimizar Transporte de Órgãos</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="donorId">ID do Doador: </label>
          <input
            type="number"
            id="donorId"
            value={donorId}
            onChange={(e) => setDonorId(e.target.value)}
            required
          />
        </div>
        <br />
        <div>
          <label htmlFor="receiverId">ID do Receptor: </label>
          <input
            type="number"
            id="receiverId"
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            required
          />
        </div>
        <br />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Otimizando...' : 'Otimizar'}
        </button>
      </form>

      {isLoading && <p>Carregando...</p>}
      {error && <p style={{ color: 'red' }}>Erro: {error}</p>}
      
      {result && !error && (
        <div style={{ marginTop: '20px', textAlign: 'left', border: '1px solid #ccc', padding: '10px' }}>
          <h2>Resultado da Otimização:</h2>
          <p><strong>Mensagem:</strong> {result.message}</p>
          {result.donorInfo && (
            <p><strong>Doador:</strong> ID {result.donorInfo.id} ({result.donorInfo.organ} @ {result.donorInfo.hospital})</p>
          )}
          {result.receiverInfo && (
            <p><strong>Receptor:</strong> ID {result.receiverInfo.id} (Urgência {result.receiverInfo.urgency} @ {result.receiverInfo.hospital})</p>
          )}
          {result.mlRecommendation && (
            <div>
              <p><strong>Recomendação do ML:</strong> {result.mlRecommendation.predicted_transport_mode}</p>
              <p><strong>Índice da Classe:</strong> {result.mlRecommendation.predicted_class_index}</p>
              <p><strong>Probabilidades:</strong></p>
              <ul>
                {result.mlRecommendation.probabilities.map((prob, index) => (
                  <li key={index}>{CLASS_NAMES[index] || `Classe ${index}`}: {(prob * 100).toFixed(2)}%</li>
                ))}
              </ul>
            </div>
          )}
          {result.logId && <p><strong>ID do Log:</strong> {result.logId}</p>}
        </div>
      )}
    </div>
  );
}

// Defina CLASS_NAMES aqui também para exibir no frontend, ou importe de um arquivo compartilhado
const CLASS_NAMES = ["Terrestre", "Aereo Comercial", "Aereo Dedicado"];
