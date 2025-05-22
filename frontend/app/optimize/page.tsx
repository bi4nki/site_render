'use client';

import { useState, Fragment } from 'react'; // Adicionado Fragment
import Link from 'next/link'; // Se quiser adicionar um link de volta ou para outras páginas

// Interfaces para os dados da resposta do backend
interface HospitalInfo {
  id: number;
  name: string; // Supondo que o backend envia 'name' em vez de 'hospital' para consistência
  city?: string; // Adicionado para mais detalhes
}

interface OrganInfo {
    name: string;
    maxIschemiaHours: number;
}

interface DonorInfo {
  id: number;
  hospital: string; // Mantendo como string simples por enquanto, como no seu exemplo de resposta
  organ: string;    // Mantendo como string simples
  maxIschemiaHours: number;
  bloodType?: string; // Adicionar se o backend enviar
}

interface ReceiverInfo {
  id: number;
  hospital: string; // Mantendo como string simples
  urgency: number;
  bloodType?: string; // Adicionar se o backend enviar
}

interface MLRecommendation {
  predicted_class_index: number;
  predicted_transport_mode: string;
  probabilities: number[];
}

interface TransportOption {
  mode: string;
  estimatedTimeHours?: number;
  details: string;
  riskLevel: string;
  isViableIschemia: boolean;
  isRecommendedByML: boolean;
}

interface OptimizationResult {
  message: string;
  donorInfo?: DonorInfo;
  receiverInfo?: ReceiverInfo;
  calculatedDistanceKm?: number;
  mlRecommendation?: MLRecommendation;
  transportOptions?: TransportOption[];
  overallRiskAssessment?: string;
  logId?: number;
  error?: string;
  details?: any; // Para erros do backend
}

const CLASS_NAMES_MAP = ["Terrestre", "Aereo Comercial", "Aereo Dedicado"]; // Para mapear índice da classe

export default function OptimizePage() {
  const [donorId, setDonorId] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

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
        setError(data.error || data.message || `Erro ${response.status}: ${response.statusText}`);
        if (data.details) {
            console.error("Detalhes do erro do backend:", data.details);
            // Poderia adicionar data.details ao setError se for uma string simples
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

  const getRiskColor = (riskLevel: string | undefined): string => {
    if (!riskLevel) return 'inherit';
    const lowerRisk = riskLevel.toLowerCase();
    if (lowerRisk.includes("muito alto")) return 'darkred';
    if (lowerRisk.includes("alto")) return 'red';
    if (lowerRisk.includes("moderado")) return 'orange';
    if (lowerRisk.includes("baixo")) return 'green';
    return '#555'; // Cor padrão para N/A ou outros
  };

  const getProbabilityColor = (prob: number): string => {
    if (prob > 0.75) return 'green';
    if (prob > 0.5) return 'orange';
    return 'inherit';
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Otimizar Transporte de Órgãos</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="donorId" style={{ display: 'block', marginBottom: '5px' }}>ID do Doador:</label>
          <input
            type="number"
            id="donorId"
            value={donorId}
            onChange={(e) => setDonorId(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="receiverId" style={{ display: 'block', marginBottom: '5px' }}>ID do Receptor:</label>
          <input
            type="number"
            id="receiverId"
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
          {isLoading ? 'Otimizando...' : 'Otimizar Transporte'}
        </button>
      </form>

      {isLoading && <p style={{ textAlign: 'center' }}>Carregando...</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold', textAlign: 'center', padding: '10px', border: '1px solid red', borderRadius: '4px' }}>Erro: {error}</p>}
      
      {result && !error && (
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
          <h2>Resultado da Otimização</h2>
          <p><strong>Status:</strong> {result.message}</p>
          {result.logId && <p><strong>ID do Log de Processamento:</strong> {result.logId}</p>}
          {result.calculatedDistanceKm !== undefined && (
            <p><strong>Distância Direta entre Hospitais:</strong> {result.calculatedDistanceKm.toFixed(1)} km</p>
          )}
          {result.overallRiskAssessment && (
            <p style={{ marginTop: '10px'}}>
                <strong>Avaliação Geral de Risco: </strong> 
                <span style={{fontWeight: 'bold', color: getRiskColor(result.overallRiskAssessment)}}>
                    {result.overallRiskAssessment}
                </span>
            </p>
          )}
          <hr style={{ margin: '20px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            {result.donorInfo && (
              <div style={{ marginBottom: '15px', width: '48%'}}>
                <h3>Informações do Doador (ID: {result.donorInfo.id})</h3>
                <p><strong>Hospital:</strong> {result.donorInfo.hospital}</p>
                <p><strong>Órgão:</strong> {result.donorInfo.organ}</p>
                <p><strong>Tempo Máx. Isquemia:</strong> {result.donorInfo.maxIschemiaHours} horas</p>
                {result.donorInfo.bloodType && <p><strong>Tipo Sanguíneo:</strong> {result.donorInfo.bloodType}</p>}
              </div>
            )}

            {result.receiverInfo && (
              <div style={{ marginBottom: '15px', width: '48%'}}>
                <h3>Informações do Receptor (ID: {result.receiverInfo.id})</h3>
                <p><strong>Hospital:</strong> {result.receiverInfo.hospital}</p>
                <p><strong>Nível de Urgência:</strong> {result.receiverInfo.urgency}</p>
                {result.receiverInfo.bloodType && <p><strong>Tipo Sanguíneo:</strong> {result.receiverInfo.bloodType}</p>}
              </div>
            )}
          </div>
          <hr style={{ margin: '20px 0' }} />
          

          {result.mlRecommendation && (
            <div style={{ marginBottom: '20px' }}>
              <h3><span role="img" aria-label="brain">🧠</span> Recomendação do Modelo de ML</h3>
              <p><strong>Modal Sugerido:</strong> <strong style={{fontSize: '1.1em', color: 'darkblue'}}>{result.mlRecommendation.predicted_transport_mode}</strong></p>
              <p><strong>Confiança (Probabilidades):</strong></p>
              <ul style={{ listStyleType: 'none', paddingLeft: '0' }}>
                {result.mlRecommendation.probabilities.map((prob, index) => (
                  <li key={index} style={{ color: getProbabilityColor(prob)}}>
                    {CLASS_NAMES_MAP[index] || `Classe ${index}`}: {(prob * 100).toFixed(2)}%
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {result.transportOptions && result.transportOptions.length > 0 && (
            <div>
              <h3>Análise Detalhada das Opções de Transporte:</h3>
              {result.transportOptions.map((option, index) => (
                <div key={index} style={{ 
                    border: `2px solid ${option.isRecommendedByML ? 'green' : (option.isViableIschemia ? '#ccc' : 'darkred')}`, 
                    padding: '15px', 
                    marginBottom: '15px', 
                    borderRadius: '5px',
                    backgroundColor: option.isRecommendedByML ? '#f0fff0' : (option.isViableIschemia ? '#fff' : '#fff0f0')
                }}>
                  <h4>Modal: {option.mode} {option.isRecommendedByML && <span style={{color: 'green', fontWeight:'bold'}}>(Recomendado pelo ML)</span>}</h4>
                  {option.estimatedTimeHours !== undefined && option.estimatedTimeHours !== null ? (
                    <Fragment>
                      <p><strong>Tempo Estimado Total:</strong> {option.estimatedTimeHours.toFixed(2)} horas</p>
                      <p>
                        <strong>Viabilidade (Isquemia):</strong> 
                        <span style={{color: option.isViableIschemia ? 'green' : 'red', fontWeight: 'bold'}}>
                            {option.isViableIschemia ? ' SIM' : ' NÃO'}
                        </span>
                        {result.donorInfo && ` (Órgão: ${result.donorInfo.maxIschemiaHours}h / Viagem: ${option.estimatedTimeHours.toFixed(2)}h)`}
                      </p>
                      <p>
                        <strong>Nível de Risco da Opção:</strong> 
                        <span style={{color: getRiskColor(option.riskLevel), fontWeight: 'bold'}}>
                            {option.riskLevel}
                        </span>
                      </p>
                      <p style={{fontSize: '0.9em', color: '#555', marginTop: '5px'}}><i>Detalhes do cálculo: {option.details}</i></p>
                    </Fragment>
                  ) : (
                     <p><strong>Status:</strong> <span style={{fontStyle: 'italic', color: '#777'}}>{option.details || "Indisponível"}</span></p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
