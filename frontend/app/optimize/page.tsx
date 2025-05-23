'use client';

import React, { useState, useEffect, useCallback, Fragment } from 'react'; // <<< React importado
import Link from 'next/link';
import { PlusCircle, Brain, Users, Truck, Plane, Rocket, ChevronDown, AlertTriangle } from 'lucide-react';

// Interfaces (mantidas da sua última versão funcional desta página)
interface HospitalSimple { id: number; name: string; }
interface OrganSimple { id: number; name: string; }
interface DonorForDropdown { id: number; bloodType: string; hospital: HospitalSimple; organ: OrganSimple; }
interface ReceiverForDropdown { id: number; bloodType: string; hospital: HospitalSimple; organNeeded: OrganSimple; urgencyLevel: number; }
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

  const fetchDataForDropdowns = useCallback(async () => {
    if (!backendUrl) { setError("URL Backend não configurada."); setLoadingDropdownData(false); return; }
    setLoadingDropdownData(true); setError(null);
    try {
      const [donorsRes, receiversRes] = await Promise.all([
        fetch(`${backendUrl}/api/master-data/donors`),
        fetch(`${backendUrl}/api/master-data/receivers`),
      ]);
      if (!donorsRes.ok || !receiversRes.ok) { throw new Error('Falha ao buscar dados para seleção.'); }
      const donorsData = await donorsRes.json(); const receiversData = await receiversRes.json();
      setDonors(Array.isArray(donorsData) ? donorsData : []);
      setReceivers(Array.isArray(receiversData) ? receiversData : []);
    } catch (e: any) { setError(e.message || "Erro."); setDonors([]); setReceivers([]);
    } finally { setLoadingDropdownData(false); }
  }, [backendUrl]);

  useEffect(() => {
    fetchDataForDropdowns();
  }, [fetchDataForDropdowns]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setIsLoading(true); setError(null); setResult(null);
    if (!donorId || !receiverId) { setError("Selecione Doador e Receptor."); setIsLoading(false); return; }
    if (!backendUrl) { setError("URL Backend não configurada."); setIsLoading(false); return; }
    try {
      const response = await fetch(`${backendUrl}/api/process/optimize`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({ donorId: parseInt(donorId), receiverId: parseInt(receiverId) }),
      });
      const data: OptimizationResult = await response.json();
      if (!response.ok) { setError(data.error || data.message || `Erro ${response.status}`); setResult(null); } 
      else { setResult(data); }
    } catch (e: any) { setError(`Falha na API: ${e.message}`); setResult(null);
    } finally { setIsLoading(false); }
  };

  const getRiskColorClassesText = (riskLevel: string | undefined): string => {
    if (!riskLevel) return 'text-slate-500';
    const lowerRisk = riskLevel.toLowerCase();
    if (lowerRisk.includes("muito alto")) return 'text-red-700';
    if (lowerRisk.includes("alto")) return 'text-red-600';
    if (lowerRisk.includes("moderado")) return 'text-amber-600';
    if (lowerRisk.includes("baixo")) return 'text-green-700';
    return 'text-slate-600';
  };
  const getRiskColorBorderBg = (riskLevel: string | undefined): string => {
    if (!riskLevel) return 'border-slate-300 bg-slate-50';
    const lowerRisk = riskLevel.toLowerCase();
    if (lowerRisk.includes("muito alto")) return 'border-red-500 bg-red-100'; // Mais forte para muito alto
    if (lowerRisk.includes("alto")) return 'border-red-300 bg-red-50';
    if (lowerRisk.includes("moderado")) return 'border-amber-300 bg-amber-50';
    if (lowerRisk.includes("baixo")) return 'border-green-300 bg-green-50';
    return 'border-slate-300 bg-slate-50';
  };
  const getProbabilityColor = (prob: number): string => {
    if (prob > 0.75) return 'text-green-600 font-semibold';
    if (prob > 0.5) return 'text-amber-600 font-medium';
    return 'text-slate-600';
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 bg-slate-50 min-h-screen">
      <div className="mb-8 pb-4 border-b border-slate-300">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-700 text-center sm:text-left tracking-tight">
          Otimização de Transporte de Órgãos
        </h1>
      </div>

      {/* Formulário de Seleção */}
      <div className="mb-10 bg-white p-6 sm:p-8 rounded-xl shadow-xl border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-700 mb-6">Selecionar Doador e Receptor</h2>
        {loadingDropdownData && <p className="text-center text-slate-500 animate-pulse py-4">Carregando opções...</p>}
        {!loadingDropdownData && error && !donors.length && !receivers.length && 
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                <strong>Erro ao carregar dados para seleção:</strong> {error}
            </div>
        }
        
        {!loadingDropdownData && (donors.length > 0 || receivers.length > 0 || !error) && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dropdown Doador */}
            <div>
              <label htmlFor="donorId" className="block text-sm font-medium text-slate-700 mb-1">
                Doador:
              </label>
              <div className="relative">
                <select
                  id="donorId"
                  value={donorId}
                  onChange={(e) => setDonorId(e.target.value)}
                  required
                  className="mt-1 block w-full appearance-none px-3 py-2.5 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                  disabled={loadingDropdownData || isLoading}
                >
                  <option value="" disabled>-- Selecione um Doador --</option>
                  {donors.map(d => (
                    <option key={d.id} value={d.id}>
                      ID: {d.id} - {d.organ?.name || 'N/A'} @ {d.hospital?.name || 'N/A'} (Sangue: {d.bloodType})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                    <ChevronDown className="h-4 w-4" />
                </div>
              </div>
              {donors.length === 0 && !loadingDropdownData && <p className="mt-1 text-xs text-amber-600">Nenhum doador disponível.</p>}
            </div>

            {/* Dropdown Receptor */}
            <div>
              <label htmlFor="receiverId" className="block text-sm font-medium text-slate-700 mb-1">
                Receptor:
              </label>
              <div className="relative">
                <select
                  id="receiverId"
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  required
                  className="mt-1 block w-full appearance-none px-3 py-2.5 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                  disabled={loadingDropdownData || isLoading}
                >
                  <option value="" disabled>-- Selecione um Receptor --</option>
                  {receivers.map(r => (
                    <option key={r.id} value={r.id}>
                      ID: {r.id} - Precisa: {r.organNeeded?.name || 'N/A'} @ {r.hospital?.name || 'N/A'} (Sangue: {r.bloodType}, Urg: {r.urgencyLevel})
                    </option>
                  ))}
                </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                    <ChevronDown className="h-4 w-4" />
                </div>
              </div>
              {receivers.length === 0 && !loadingDropdownData && <p className="mt-1 text-xs text-amber-600">Nenhum receptor disponível.</p>}
            </div>
            <button 
              type="submit" 
              disabled={isLoading || loadingDropdownData} 
              className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              <PlusCircle className={`mr-2 h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Otimizando...' : 'Otimizar Transporte'}
            </button>
          </form>
        )}
      </div>
      
      {/* Exibição de Erro da Otimização */}
      {isLoading && !loadingDropdownData && <div className="text-center text-slate-600 py-6 text-lg animate-pulse">Processando otimização...</div>}
      {error && !isLoading && !loadingDropdownData && (donors.length > 0 || receivers.length > 0) && 
        <div className="my-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md shadow-md">
          <p className="font-bold flex items-center"><AlertTriangle className="h-5 w-5 mr-2"/>Erro na Otimização:</p>
          <p className="mt-1">{error}</p>
        </div>
      }
      
      {/* Card de Resultado da Otimização */}
      {result && !error && (
        // Aplicando o mesmo estilo de card da página principal
        <div className="mt-10 p-6 bg-white shadow-xl rounded-xl border border-slate-200 space-y-6">
          {/* Cabeçalho do Card de Resultado */}
          <div className="pb-3 mb-4 border-b border-slate-200">
            <h2 className="text-2xl font-semibold text-slate-700">Resultado da Otimização</h2>
            {result.logId && <p className="text-sm text-slate-500 mt-1">ID do Log de Processamento: {result.logId}</p>}
          </div>

          {result.overallRiskAssessment && (
            <div className={`p-3 rounded-md border text-sm font-medium mb-4 ${getRiskColorBorderBg(result.overallRiskAssessment)}`}>
                <strong>Avaliação Geral de Risco:</strong> {result.overallRiskAssessment}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
            {result.donorInfo && (
              <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                <h3 className="text-lg font-semibold text-slate-700 mb-2 flex items-center"><Users className="h-5 w-5 mr-2 text-blue-500" />Doador (ID: {result.donorInfo.id})</h3>
                <p className="text-sm"><strong>Hospital:</strong> {result.donorInfo.hospital}</p>
                <p className="text-sm"><strong>Órgão:</strong> {result.donorInfo.organ}</p>
                <p className="text-sm"><strong>Tipo Sanguíneo:</strong> {result.donorInfo.bloodType || 'N/A'}</p>
                <p className="text-sm"><strong>Tempo Máx. Isquemia:</strong> {result.donorInfo.maxIschemiaHours} horas</p>
              </div>
            )}
            {result.receiverInfo && (
              <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                <h3 className="text-lg font-semibold text-slate-700 mb-2 flex items-center"><Users className="h-5 w-5 mr-2 text-amber-500" />Receptor (ID: {result.receiverInfo.id})</h3>
                <p className="text-sm"><strong>Hospital:</strong> {result.receiverInfo.hospital}</p>
                <p className="text-sm"><strong>Tipo Sanguíneo:</strong> {result.receiverInfo.bloodType || 'N/A'}</p>
                <p className="text-sm"><strong>Nível de Urgência:</strong> {result.receiverInfo.urgency}</p>
              </div>
            )}
          </div>
          
          {result.calculatedDistanceKm !== undefined && (
            <p className="text-md text-slate-600 pt-2"><strong>Distância Direta:</strong> {result.calculatedDistanceKm.toFixed(1)} km</p>
          )}
          
          {result.mlRecommendation && (
            <div className="p-4 border border-slate-200 rounded-lg mt-4 bg-white">
              <h3 className="text-lg font-semibold text-slate-700 mb-2 flex items-center"><Brain className="h-5 w-5 mr-2 text-purple-500" />Recomendação do Modelo de ML</h3>
              <p className="text-sm"><strong>Modal Sugerido:</strong> <span className="font-bold text-xl text-blue-600">{result.mlRecommendation.predicted_transport_mode}</span></p>
              <p className="text-xs text-slate-500 mt-1">Confiança (Probabilidades):</p>
              <ul className="list-disc list-inside ml-4 text-xs">
                {result.mlRecommendation.probabilities.map((prob, index) => (
                  <li key={index} className={getProbabilityColor(prob)}>
                    {CLASS_NAMES_MAP[index] || `Classe ${index}`}: {(prob * 100).toFixed(1)}%
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {result.transportOptions && result.transportOptions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-slate-700 mb-4">Análise Detalhada das Opções de Transporte:</h3>
              <div className="space-y-4">
                {result.transportOptions.map((option) => (
                  <div key={option.mode} className={`p-4 rounded-lg border-2 ${option.isRecommendedByML ? 'border-green-500 bg-green-50 shadow-lg' : (option.isViableIschemia ? 'border-slate-300 bg-white shadow-md' : 'border-red-500 bg-red-50 shadow-lg')}`}>
                    <h4 className="text-md font-semibold text-slate-800 flex items-center mb-2">
                      {option.mode === "Terrestre" && <Truck className="h-5 w-5 mr-2 text-slate-600" />}
                      {option.mode === "Aereo Comercial" && <Plane className="h-5 w-5 mr-2 text-sky-600" />}
                      {option.mode === "Aereo Dedicado" && <Rocket className="h-5 w-5 mr-2 text-purple-600" />}
                      {option.mode}
                      {option.isRecommendedByML && <span className="ml-3 px-2 py-0.5 text-xs font-semibold bg-green-600 text-white rounded-full">Recomendado</span>}
                    </h4>
                    {option.estimatedTimeHours !== undefined && option.estimatedTimeHours !== null ? (
                      <Fragment>
                        <p className="text-sm"><strong>Tempo Estimado Total:</strong> {option.estimatedTimeHours.toFixed(2)} horas</p>
                        <p className="text-sm">
                          <strong>Viabilidade (Isquemia):</strong> 
                          <span className={`font-semibold ${option.isViableIschemia ? 'text-green-700' : 'text-red-700'}`}>
                              {option.isViableIschemia ? ' SIM' : ' NÃO'}
                          </span>
                          {result.donorInfo && ` (Órgão: ${result.donorInfo.maxIschemiaHours}h / Viagem: ${option.estimatedTimeHours.toFixed(2)}h)`}
                        </p>
                        <p className="text-sm">
                          <strong>Nível de Risco da Opção:</strong> 
                          <span className={`font-semibold px-1.5 py-0.5 rounded-sm text-xs ${getRiskColorClassesText(option.riskLevel)} ${getRiskColorBorderBg(option.riskLevel).split(' ')[1]}`}>
                              {option.riskLevel}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500 mt-2"><i>Detalhes: {option.details}</i></p>
                      </Fragment>
                    ) : (
                       <p className="italic text-slate-500 text-sm">{option.details || "Indisponível"}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
