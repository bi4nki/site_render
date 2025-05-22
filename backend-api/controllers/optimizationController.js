import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const ML_EXPECTED_FEATURE_NAMES_V2 = [ // Ou V5, conforme o modelo que você treinou por último
    "distancia_km", "tempo_isquemia_max_horas", "urgencia_receptor",
    "disponibilidade_voo_comercial_bool",
    "horario_compativel_voo_comercial_bool",
    "disponibilidade_voo_dedicado_bool"
];

const VELOCIDADE_TERRESTRE_KMH_BACKEND = 80;
const VELOCIDADE_AEREO_COMERCIAL_KMH_BACKEND = 800;
const VELOCIDADE_AEREO_DEDICADO_KMH_BACKEND = 700;
const TEMPO_SOLO_AEROPORTOS_COMERCIAL_HORAS_BACKEND = 1.0;
const TEMPO_SOLO_AEROPORTOS_DEDICADO_HORAS_BACKEND = 0.75;
const TEMPO_DESLOC_HOSP_AEROPORTOS_TOTAL_SIMULADO_BACKEND = 1.2; 

const HORARIO_PICO_VOO_INICIO_BACKEND = 6; 
const HORARIO_PICO_VOO_FIM_BACKEND = 22;   

function deg2rad(deg) { /* ... (como antes) ... */ }
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) { /* ... (como antes) ... */ }
function randomUniform(min, max) { /* ... (como antes) ... */ }
function calcularTempoEstimadoViagemBackend(distanciaKmOuDistanciaVoo, modal, disponibilidadeBool, tempoIsquemiaMaxHoras) { /* ... (como antes) ... */ }


export const optimizeTransport = async (req, res) => {
    const { donorId, receiverId } = req.body;

    if (!donorId || !receiverId) {
        return res.status(400).json({ error: 'donorId e receiverId são obrigatórios.' });
    }

    try {
        const donor = await prisma.donor.findUnique({
            where: { id: parseInt(donorId) },
            include: { organ: true, hospital: true },
        });
        const receiver = await prisma.receiver.findUnique({
            where: { id: parseInt(receiverId) },
            include: { hospital: true, organNeeded: true }, 
        });

        if (!donor) return res.status(404).json({ error: `Doador com id ${donorId} não encontrado.` });
        // ... (outras validações de existência como antes) ...
        if (!receiver) return res.status(404).json({ error: `Receptor com id ${receiverId} não encontrado.` });
        if (!donor.organ) return res.status(404).json({ error: `Órgão para o doador ${donorId} não encontrado.` });
        if (!receiver.organNeeded) return res.status(404).json({ error: `Órgão necessário para o receptor ${receiverId} não encontrado.` });
        if (!donor.hospital) return res.status(404).json({ error: `Hospital para o doador ${donorId} não encontrado.` });
        if (!receiver.hospital) return res.status(404).json({ error: `Hospital para o receptor ${receiverId} não encontrado.` });

        if (donor.organ.id !== receiver.organNeeded.id) { /* ... (validação tipo órgão) ... */ }
        if (!checkABOCompatibility(donor.bloodType, receiver.bloodType)) { /* ... (validação ABO) ... */ }
        
        const distancia_km_ponta_a_ponta = getDistanceFromLatLonInKm(
            donor.hospital.latitude, donor.hospital.longitude,
            receiver.hospital.latitude, receiver.hospital.longitude
        );
        const tempo_isquemia_max_horas = donor.organ.maxIschemiaHours;
        const urgencia_receptor = receiver.urgencyLevel;
        
        let disponibilidade_voo_comercial_bool_feat = 0.0;
        if (distancia_km_ponta_a_ponta > 300 && Math.random() > (distancia_km_ponta_a_ponta < 1000 ? 0.2 : 0.1)) {
            disponibilidade_voo_comercial_bool_feat = 1.0;
        }
        
        const horario_atual_simulado_backend = Math.floor(Math.random() * 24);
        const tempo_preparacao_ate_decolagem_comercial_backend = randomUniform(2,4); 
        const horario_decolagem_estimado_backend = (horario_atual_simulado_backend + tempo_preparacao_ate_decolagem_comercial_backend) % 24;
        
        let horario_compativel_voo_comercial_bool_feat = 0.0;
        if (disponibilidade_voo_comercial_bool_feat === 1.0) {
            if (HORARIO_PICO_VOO_INICIO_BACKEND <= horario_decolagem_estimado_backend && horario_decolagem_estimado_backend < HORARIO_PICO_VOO_FIM_BACKEND) {
                horario_compativel_voo_comercial_bool_feat = 1.0;
            } else if (Math.random() < 0.2) { 
                horario_compativel_voo_comercial_bool_feat = 1.0;
            }
        }
        
        // --- LÓGICA DE DISPONIBILIDADE DE VOO DEDICADO ATUALIZADA (Opção 2) ---
        let disponibilidade_voo_dedicado_bool_feat = 0.0;
        if (distancia_km_ponta_a_ponta > 1000) { // Sempre disponível para longas distâncias
            disponibilidade_voo_dedicado_bool_feat = 1.0;
        } else if (urgencia_receptor <= 2 && distancia_km_ponta_a_ponta > 200) { // Urgência alta
            disponibilidade_voo_dedicado_bool_feat = 1.0;
        } else if (tempo_isquemia_max_horas <= 6 && distancia_km_ponta_a_ponta > 200) { // Isquemia curta
            disponibilidade_voo_dedicado_bool_feat = 1.0;
        } else if (distancia_km_ponta_a_ponta > 300 && Math.random() < 0.4) { // Chance moderada para distâncias médias
             disponibilidade_voo_dedicado_bool_feat = 1.0;
        }
        // --- FIM DA LÓGICA ATUALIZADA ---

        console.log("Backend: Feature de disponibilidade_voo_dedicado_bool_feat (para ML):", disponibilidade_voo_dedicado_bool_feat);

        const feature_values_for_ml = [
            distancia_km_ponta_a_ponta, 
            parseFloat(tempo_isquemia_max_horas),
            parseFloat(urgencia_receptor),
            disponibilidade_voo_comercial_bool_feat,
            horario_compativel_voo_comercial_bool_feat,
            disponibilidade_voo_dedicado_bool_feat
        ];
        
        // ... (resto do código para chamar ML, calcular transportOptions, e retornar resposta como antes) ...
        // A função calcularTempoEstimadoViagemBackend já usa a disponibilidade_voo_dedicado_bool_feat
        // para decidir se calcula o tempo ou retorna null.

        // ... (o resto do seu código da função optimizeTransport, 
        //      incluindo a chamada axios, a montagem do transportOptions,
        //      e a resposta JSON, permanece o mesmo da versão anterior) ...
        //      Apenas garanta que os console.logs dentro do catch do axios e
        //      no final do try também estão lá para debug.

        // Cole o restante da função optimizeTransport da sua última versão funcional aqui
        // (a partir da checagem do process.env.ML_SERVICE_URL)


        if (!process.env.ML_SERVICE_URL) { /* ... */ }
        let mlPrediction;
        try {
            const mlServiceResponse = await axios.post( `${process.env.ML_SERVICE_URL}/predict`, { features: feature_values_for_ml } );
            mlPrediction = mlServiceResponse.data;
            console.log("Backend: Resposta do ML Service (V_ATUAL):", mlPrediction);
        } catch (mlError) { /* ... tratamento de erro axios ... */ 
            console.error("Erro ao chamar o ML Service:", mlError.message);
            if (mlError.response) {
                console.error("ML Service Response Data:", mlError.response.data);
                console.error("ML Service Response Status:", mlError.response.status);
                return res.status(500).json({ error: "Erro ao comunicar com o serviço de ML.", details: mlError.response.data });
            } else if (mlError.request) {
                console.error("ML Service - Nenhuma resposta recebida:", mlError.request);
                return res.status(500).json({ error: "Serviço de ML não respondeu." });
            } else {
                console.error('ML Service - Erro na configuração da requisição:', mlError.message);
                return res.status(500).json({ error: "Erro ao preparar comunicação com o serviço de ML." });
            }
            return res.status(500).json({ error: "Erro desconhecido ao comunicar com o serviço de ML." });
        }
        
        const transportOptions = [];
        let algumaOpcaoViavelEncontrada = false;

        const terrestreCalc = calcularTempoEstimadoViagemBackend(distancia_km_ponta_a_ponta, 0, 1.0, tempo_isquemia_max_horas);
        transportOptions.push({
            mode: "Terrestre", estimatedTimeHours: terrestreCalc.tempoHoras, details: terrestreCalc.detalhes,
            riskLevel: terrestreCalc.risco, isViableIschemia: terrestreCalc.isViableIschemia,
            isRecommendedByML: mlPrediction.predicted_transport_mode === "Terrestre"
        });
        if (terrestreCalc.isViableIschemia) algumaOpcaoViavelEncontrada = true;

        const dispRealComercialParaCalculoTempo = disponibilidade_voo_comercial_bool_feat === 1.0 && horario_compativel_voo_comercial_bool_feat === 1.0;
        const aereoComercialCalc = calcularTempoEstimadoViagemBackend(distancia_km_ponta_a_ponta, 1, dispRealComercialParaCalculoTempo, tempo_isquemia_max_horas);
        if (aereoComercialCalc.tempoHoras !== null) {
            transportOptions.push({
                mode: "Aereo Comercial", estimatedTimeHours: aereoComercialCalc.tempoHoras, details: aereoComercialCalc.detalhes,
                riskLevel: aereoComercialCalc.risco, isViableIschemia: aereoComercialCalc.isViableIschemia,
                isRecommendedByML: mlPrediction.predicted_transport_mode === "Aereo Comercial"
            });
            if (aereoComercialCalc.isViableIschemia) algumaOpcaoViavelEncontrada = true;
        } else { 
             let detailMsg = "Indisponível (simulado).";
             if (disponibilidade_voo_comercial_bool_feat === 1.0 && horario_compativel_voo_comercial_bool_feat === 0.0) {
                detailMsg = "Disponível (geral), mas fora do horário compatível de voo simulado.";
             }
            transportOptions.push({ mode: "Aereo Comercial", details: detailMsg, riskLevel: "N/A", isViableIschemia: false, isRecommendedByML: false });
        }
        
        console.log("Backend: Valor de disponibilidade_voo_dedicado_bool_feat (para cálculo de tempo):", disponibilidade_voo_dedicado_bool_feat);
        const aereoDedicadoCalc = calcularTempoEstimadoViagemBackend(distancia_km_ponta_a_ponta, 2, disponibilidade_voo_dedicado_bool_feat, tempo_isquemia_max_horas);
         if (aereoDedicadoCalc.tempoHoras !== null) {
            transportOptions.push({
                mode: "Aereo Dedicado", estimatedTimeHours: aereoDedicadoCalc.tempoHoras, details: aereoDedicadoCalc.detalhes,
                riskLevel: aereoDedicadoCalc.risco, isViableIschemia: aereoDedicadoCalc.isViableIschemia,
                isRecommendedByML: mlPrediction.predicted_transport_mode === "Aereo Dedicado"
            });
            if (aereoDedicadoCalc.isViableIschemia) algumaOpcaoViavelEncontrada = true;
        } else { 
            transportOptions.push({ mode: "Aereo Dedicado", details: "Indisponível (simulado).", riskLevel: "N/A", isViableIschemia: false, isRecommendedByML: false });
        }
        
        let overallRiskAssessment = "Verificar opções individuais."; /* ... (lógica como antes) ... */
        if (!algumaOpcaoViavelEncontrada) { /* ... */ } else { const recomendacaoMLOpcao = transportOptions.find(opt => opt.isRecommendedByML); if (recomendacaoMLOpcao) { /* ... */ } }
        
        const logNotes = `ML: ${mlPrediction.predicted_transport_mode}. Risk: ${overallRiskAssessment}. ABO: YES. Organ: YES. Probs: ${JSON.stringify(mlPrediction.probabilities)}. Features: ${JSON.stringify(feature_values_for_ml)}. Options: ${JSON.stringify(transportOptions)}`;
        let transportLogEntry;
        try {
            transportLogEntry = await prisma.transportLog.create({
                data: {
                    donorId: parseInt(donorId), receiverId: parseInt(receiverId),
                    selectedTransportMode: mlPrediction.predicted_transport_mode || "N/A",
                    estimatedTimeHours: transportOptions.find(opt => opt.isRecommendedByML && opt.estimatedTimeHours !== null)?.estimatedTimeHours || 0,
                    status: "PENDING_CONFIRMATION", notes: logNotes.substring(0, 1900),
                },
            });
        } catch (logError) { console.error("Erro ao salvar log:", logError.message); }
        
        res.status(200).json({
            message: "Otimização processada com sucesso. Tipos sanguíneos ABO e Órgão compatíveis.",
            donorInfo: { id: donor.id, bloodType: donor.bloodType, hospital: donor.hospital.name, organ: donor.organ.name, maxIschemiaHours: tempo_isquemia_max_horas },
            receiverInfo: { id: receiver.id, bloodType: receiver.bloodType, hospital: receiver.hospital.name, urgency: receiver.urgencyLevel },
            calculatedDistanceKm: distancia_km_ponta_a_ponta,
            mlRecommendation: mlPrediction,
            transportOptions: transportOptions,
            overallRiskAssessment: overallRiskAssessment,
            logId: transportLogEntry ? transportLogEntry.id : null
        });

    } catch (error) {
        console.error("Erro no processo de otimização:", error.message, error.stack);
        res.status(500).json({ error: 'Erro interno no servidor durante a otimização.', details: error.message });
    }
};
