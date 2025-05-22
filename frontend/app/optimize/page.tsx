'use client';

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link'; // Opcional, se quiser adicionar links

// Interfaces para os dados da resposta do backend e para os dropdowns
interface HospitalSimple { 
  id: number; 
  name: string; 
  // city?: string; // Adicione se o backend enviar e você quiser usar
}
interface OrganSimple { 
  id: number; 
  name: string; 
}

interface DonorForDropdown {
  id: number;
  bloodType: string;
  hospital: HospitalSimple; // Espera que o backend envie o objeto hospital aninhado
  organ: OrganSimple;      // Espera que o backend envie o objeto organ aninhado
  // availabilityDateTime?: string; // Adicione se quiser exibir no dropdown
}

interface ReceiverForDropdown {
  id: number;
  bloodType: string;
  hospital: HospitalSimple;   // Espera hospital aninhado
  organNeeded: OrganSimple; // Espera organNeeded aninhado
  urgencyLevel: number;
  // registrationDate?: string; // Adicione se quiser exibir no dropdown
}

// Interfaces para o resultado da otimização (como definido anteriormente)
interface DonorInfo { id: number; hospital: string; organ: string; maxIschemiaHours: number; bloodType?: string; }
interface ReceiverInfo { id: number; hospital: string; urgency: number; bloodType?: string; }
interface MLRecommendation { predicted_class_index: number; predicted_transport_mode: string; probabilities: number[]; }
interface TransportOption { mode: string; estimatedTimeHours?: number; details: string; riskLevel: string; isViableIschemia: boolean; isRecommendedByML: boolean; }
interface OptimizationResult {
  message: string; donorInfo?: DonorInfo; receiverInfo?: ReceiverInfo;
  calculatedDistanceKm?: number; mlRecommendation?: MLRecommendation;
  transportOptions?: TransportOption[]; overallRiskAssessment?: string;
  logId?: number; error?: string; details?: any; 
}

const CLASS_NAMES_MAP = ["Terrestre", "Aereo Comercial", "Aereo Dedicado"];

export default function OptimizePage() {
  const [donorId, setDonorId] = useState(''); 
  const [receiverId, setReceiverId] = useState(''); 

  const [donors, setDonors] = useState<DonorForDropdown[]>([]);
  const [receivers, setReceivers] = useState<ReceiverForDropdown[]>([]);
  const [loadingDropdownData, setLoadingDropdownData] = useState(true);

  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false); 
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  useEffect(() => {
    if (!backendUrl) {
      setError("URL do Backend não configurada.");
      setLoadingDropdownData(false);
      return;
    }

    const fetchDataForDropdowns = async () => {
      setLoadingDropdownData(true);
      setError(null); // Limpa erros anteriores ao buscar dados
      try {
        console.log("OptimizePage: Buscando doadores e receptores para dropdowns...");
        const [donorsRes, receiversRes] = await Promise.all([
          fetch(`${backendUrl}/api/master-data/donors`),
          fetch(`${backendUrl}/api/master-data/receivers`),
        ]);

        let donorsError = !donorsRes.ok;
        let receiversError = !receiversRes.ok;

        const donorsData = donorsError ? { error: `Falha ao buscar doadores: ${donorsRes.statusText}`, details: await donorsRes.text().catch(()=>"")} : await donorsRes.json();
        const receiversData = receiversError ? { error: `Falha ao buscar receptores: ${receiversRes.statusText}`, details: await receiversRes.text().catch(()=>"")} : await receiversRes.json();

        if (donorsError) {
          console.error("Erro ao buscar doadores:", donorsData);
          throw new Error(donorsData.error || "Falha ao buscar doadores");
        }
        if (receiversError) {
          console.error("Erro ao buscar receptores:", receiversData);
          throw new Error(receiversData.error || "Falha ao buscar receptores");
        }
        
        console.log("OptimizePage: Doadores recebidos:", donorsData);
        console.log("OptimizePage: Receptores recebidos:", receiversData);

        setDonors(Array.isArray(donorsData) ? donorsData : []);
        setReceivers(Array.isArray(receiversData) ? receiversData : []);

      } catch (e: any) {
        console.error("OptimizePage: Erro ao carregar dados para dropdowns:", e);
        setError(e.message || "Erro ao carregar dados para seleção.");
        setDonors([]); // Limpa em caso de erro
        setReceivers([]); // Limpa em caso de erro
      } finally {
        setLoadingDropdownData(false);
      }
    };

    fetchDataForDropdowns();
  }, [backendUrl]);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true); 
    setError(null);
    setResult(null);

    if (!donorId || !receiverId) {
      setError("Por favor, selecione um Doador e um Receptor.");
      setIsLoading(false);
      return;
    }
    if (!backendUrl) {
        setError("URL do Backend não configurada.");
        setIsLoading(false);
        return;
    }

    console.log("OptimizePage: Enviando para otimização - Doador ID:", donorId, "Receptor ID:", receiverId);

    try {
      const response = await fetch(`${backendUrl}/api/process/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({
          donorId: parseInt(donorId),
          receiverId: parseInt(receiverId),
        }),
      });
      const data: OptimizationResult = await response.json();
      console.log("OptimizePage: Resposta da otimização:", data);
      if (!response.ok) {
        setError(data.error || data.message || `Erro ${response.status}: ${response.statusText}`);
        if (data.details) console.error("Detalhes do erro do backend:", data.details);
        setResult(null);
      } else {
        setResult(data);
      }
    } catch (e: any) {
      console.error("OptimizePage: Erro na chamada da API de otimização:", e);
      setError(`Falha ao conectar com a API de otimização: ${e.message}`);
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
    return '#555';
  };
  const getProbabilityColor = (prob: number): string => {
    if (prob > 0.75) return 'green';
    if (prob > 0.5) return 'orange';
    return 'inherit';
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Otimizar Transporte de Órgãos</h1>
      {loadingDropdownData && <p style={{textAlign: 'center', fontWeight: 'bold'}}>Carregando opções de doadores e receptores...</p>}
      {!loadingDropdownData && error && !donors.length && !receivers.length && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p> /* Mostra erro do dropdown se não houver dados */}
      
      {!loadingDropdownData && (donors.length > 0 || receivers.length > 0 || !error) && ( // Mostra formulário se dados carregados ou se não houve erro de dropdown
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="donorId" style={{ display: 'block', marginBottom: '5px' }}>Selecione o Doador:</label>
            <select
              id="donorId"
              value={donorId}
              onChange={(e) => setDonorId(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            >
              <option value="" disabled>-- Selecione um Doador --</option>
              {donors.map(d => (
                <option key={d.id} value={d.id}>
                  ID: {d.id} - Órgão: {d.organ?.name || 'N/A'} @ {d.hospital?.name || 'N/A'} (Sangue: {d.bloodType})
                </option>
              ))}
            </select>
            {donors.length === 0 && !loadingDropdownData && <p style={{fontSize: '0.9em', color: 'orange'}}>Nenhum doador disponível para seleção.</p>}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="receiverId" style={{ display: 'block', marginBottom: '5px' }}>Selecione o Receptor:</label>
            <select
              id="receiverId"
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            >
              <option value="" disabled>-- Selecione um Receptor --</option>
              {receivers.map(r => (
                <option key={r.id} value={r.id}>
                  ID: {r.id} - Precisa: {r.organNeeded?.name || 'N/A'} @ {r.hospital?.name || 'N/A'} (Sangue: {r.bloodType}, Urg: {r.urgencyLevel})
                </option>
              ))}
            </select>
            {receivers.length === 0 && !loadingDropdownData && <p style={{fontSize: '0.9em', color: 'orange'}}>Nenhum receptor disponível para seleção.</p>}
          </div>
          <button type="submit" disabled={isLoading || loadingDropdownData} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
            {isLoading ? 'Otimizando...' : 'Otimizar Transporte'}
          </button>
        </form>
      )}

      {isLoading && !loadingDropdownData && <p style={{ textAlign: 'center' }}>Processando otimização...</p>}
      {/* Mostra erro da otimização se não for erro do dropdown */}
      {error && !loadingDropdownData && (donors.length > 0 || receivers.length > 0) && <p style={{ color: 'red', fontWeight: 'bold', textAlign: 'center', padding: '10px', border: '1px solid red', borderRadius: '4px' }}>Erro na Otimização: {error}</p>}
      
      {result && !error && (
        <div style={{ marginTop: '20px', border: '1px solid #ddd', padding: '20px', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
          <h2>Resultado da Otimização</h2>
          <p><strong>Status:</strong> {result.message}</p>
          {result.logId && <p><strong>ID do Log de Processamento:</strong> {result.logId}</p>}
          {result.overallRiskAssessment && <p style={{ marginTop: '10px'}}>
                <strong>Avaliação Geral de Risco: </strong> 
                <span style={{fontWeight: 'bold', color: getRiskColor(result.overallRiskAssessment)}}>
                    {result.overallRiskAssessment}
                </span>
            </p>}
          <hr style={{ margin: '20px 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
            {result.donorInfo && (
              <div>
                <h3>Informações do Doador (ID: {result.donorInfo.id})</h3>
                <p><strong>Hospital:</strong> {result.donorInfo.hospital}</p>
                <p><strong>Órgão:</strong> {result.donorInfo.organ}</p>
                <p><strong>Tipo Sanguíneo:</strong> {result.donorInfo.bloodType || 'N/A'}</p>
                <p><strong>Tempo Máx. Isquemia:</strong> {result.donorInfo.maxIschemiaHours} horas</p>
              </div>
            )}

            {result.receiverInfo && (
              <div>
                <h3>Informações do Receptor (ID: {result.receiverInfo.id})</h3>
                <p><strong>Hospital:</strong> {result.receiverInfo.hospital}</p>
                <p><strong>Tipo Sanguíneo:</strong> {result.receiverInfo.bloodType || 'N/A'}</p>
                <p><strong>Nível de Urgência:</strong> {result.receiverInfo.urgency}</p>
              </div>
            )}
          </div>
          
          {result.calculatedDistanceKm !== undefined && (
            <p><strong>Distância Direta entre Hospitais:</strong> {result.calculatedDistanceKm.toFixed(1)} km</p>
          )}
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
                    padding: '15px', marginBottom: '15px', borderRadius: '5px',
                    backgroundColor: option.isRecommendedByML ? '#e6ffe6' : (option.isViableIschemia ? '#fff' : '#fff0f0')
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
