import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// ATUALIZADO: Nomes e ordem das 6 features como o ml-service V2 espera
const ML_EXPECTED_FEATURE_NAMES_V2 = [
    "distancia_km", "tempo_isquemia_max_horas", "urgencia_receptor",
    "disponibilidade_voo_comercial_bool",
    "horario_compativel_voo_comercial_bool", // Nova feature
    "disponibilidade_voo_dedicado_bool"
];

// Constantes para Estimativa de Tempo (horas) do Backend
const VELOCIDADE_TERRESTRE_KMH_BACKEND = 80;
const VELOCIDADE_AEREO_COMERCIAL_KMH_BACKEND = 800;
const VELOCIDADE_AEREO_DEDICADO_KMH_BACKEND = 700;
const TEMPO_SOLO_AEROPORTOS_COMERCIAL_HORAS_BACKEND = 3.0;
const TEMPO_SOLO_AEROPORTOS_DEDICADO_HORAS_BACKEND = 1.5;
const TEMPO_DESLOC_HOSP_AEROPORTOS_TOTAL_SIMULADO_BACKEND = 2.0; // Ex: 1h para cada trecho (origem + destino)

// Horários de "pico" para voos comerciais simulados (0-23h) - Usado na simulação de disponibilidade
const HORARIO_PICO_VOO_INICIO_BACKEND = 6; 
const HORARIO_PICO_VOO_FIM_BACKEND = 22;   

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; 
    return parseFloat(d.toFixed(1));
}

function calcularTempoEstimadoViagemBackend(distanciaKmOuDistanciaVoo, modal, disponibilidadeBool, tempoIsquemiaMaxHoras) {
    // Para modais aéreos, disponibilidadeBool combina disponibilidade geral E horário compatível
    if (!disponibilidadeBool && (modal === 1 || modal === 2) && modal !== 0) { // Terrestre sempre "disponível" em termos de 'disponibilidadeBool' aqui
        return { tempoHoras: null, detalhes: (modal === 1 ? "Indisponível ou fora do horário de voo comercial." : "Indisponível."), risco: "N/A", isViableIschemia: false };
    }

    let tempoViagemHoras;
    let detalhes = "";
    let risco = "Baixo";

    switch (modal) {
        case 0: // Terrestre
            tempoViagemHoras = distanciaKmOuDistanciaVoo / VELOCIDADE_TERRESTRE_KMH_BACKEND;
            detalhes = `Distância: ${distanciaKmOuDistanciaVoo.toFixed(1)}km. Velocidade média: ${VELOCIDADE_TERRESTRE_KMH_BACKEND}km/h.`;
            break;
        case 1: // Aéreo Comercial
            const tempoVooComercial = distanciaKmOuDistanciaVoo / VELOCIDADE_AEREO_COMERCIAL_KMH_BACKEND;
            tempoViagemHoras = TEMPO_DESLOC_HOSP_AEROPORTOS_TOTAL_SIMULADO_BACKEND + TEMPO_SOLO_AEROPORTOS_COMERCIAL_HORAS_BACKEND + tempoVooComercial;
            detalhes = `Desloc. terrestre aeroportos (total): ${TEMPO_DESLOC_HOSP_AEROPORTOS_TOTAL_SIMULADO_BACKEND}h. Tempo solo aeroportos (total): ${TEMPO_SOLO_AEROPORTOS_COMERCIAL_HORAS_BACKEND}h. Voo (${distanciaKmOuDistanciaVoo.toFixed(1)}km @ ${VELOCIDADE_AEREO_COMERCIAL_KMH_BACKEND}km/h): ${tempoVooComercial.toFixed(2)}h.`;
            break;
        case 2: // Aéreo Dedicado
            const tempoVooDedicado = distanciaKmOuDistanciaVoo / VELOCIDADE_AEREO_DEDICADO_KMH_BACKEND;
            tempoViagemHoras = TEMPO_DESLOC_HOSP_AEROPORTOS_TOTAL_SIMULADO_BACKEND + TEMPO_SOLO_AEROPORTOS_DEDICADO_HORAS_BACKEND + tempoVooDedicado;
            detalhes = `Desloc. terrestre aeroportos (total): ${TEMPO_DESLOC_HOSP_AEROPORTOS_TOTAL_SIMULADO_BACKEND}h. Tempo solo aeroportos (total): ${TEMPO_SOLO_AEROPORTOS_DEDICADO_HORAS_BACKEND}h. Voo (${distanciaKmOuDistanciaVoo.toFixed(1)}km @ ${VELOCIDADE_AEREO_DEDICADO_KMH_BACKEND}km/h): ${tempoVooDedicado.toFixed(2)}h.`;
            break;
        default:
            return { tempoHoras: null, detalhes: "Modal desconhecido", risco: "N/A", isViableIschemia: false };
    }

    const isViableIschemia = tempoViagemHoras <= tempoIsquemiaMaxHoras;
    const margemTempo = tempoIsquemiaMaxHoras - tempoViagemHoras;

    if (!isViableIschemia) {
        risco = "Muito Alto (Excede Isquemia)";
    } else if (margemTempo < 1.0) { 
        risco = "Alto (Margem < 1h)";
    } else if (margemTempo < 2.5) { 
        risco = "Moderado (Margem < 2.5h)";
    }
    
    return { 
        tempoHoras: parseFloat(tempoViagemHoras.toFixed(2)), 
        detalhes, 
        risco,
        isViableIschemia 
    };
}


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
            include: { hospital: true }, 
        });

        if (!donor) return res.status(404).json({ error: `Doador com id ${donorId} não encontrado.` });
        if (!receiver) return res.status(404).json({ error: `Receptor com id ${receiverId} não encontrado.` });
        if (!donor.organ) return res.status(404).json({ error: `Órgão para o doador ${donorId} não encontrado.` });
        if (!donor.hospital) return res.status(404).json({ error: `Hospital para o doador ${donorId} não encontrado.` });
        if (!receiver.hospital) return res.status(404).json({ error: `Hospital para o receptor ${receiverId} não encontrado.` });

        // --- Preparar Features para o ML Service (6 features) ---

        // 1. distancia_km (Calculada entre hospitais)
        // Para o ML, esta é a distância principal. Para cálculos de tempo aéreo, pode ser a mesma.
        const distancia_km_ponta_a_ponta = getDistanceFromLatLonInKm(
            donor.hospital.latitude, donor.hospital.longitude,
            receiver.hospital.latitude, receiver.hospital.longitude
        );
        console.log("Backend: Distância calculada (Haversine):", distancia_km_ponta_a_ponta, "km");

        // 2. tempo_isquemia_max_horas
        const tempo_isquemia_max_horas = donor.organ.maxIschemiaHours;

        // 3. urgencia_receptor
        const urgencia_receptor = receiver.urgencyLevel;

        // 4. disponibilidade_voo_comercial_bool (Feature para ML)
        let disponibilidade_voo_comercial_bool_feat = 0.0;
        if (distancia_km_ponta_a_ponta > 300 && Math.random() > (0.2 if distancia_km_ponta_a_ponta < 1000 else 0.1)) {
            disponibilidade_voo_comercial_bool_feat = 1.0;
        }

        // 5. horario_compativel_voo_comercial_bool (Feature para ML)
        const horario_atual_simulado_backend = Math.floor(Math.random() * 24);
        const tempo_preparacao_ate_decolagem_comercial_backend = random.uniform(2,4); // Simula tempo para chegar ao aeroporto e embarcar
        const horario_decolagem_estimado_backend = (horario_atual_simulado_backend + tempo_preparacao_ate_decolagem_comercial_backend) % 24;
        
        let horario_compativel_voo_comercial_bool_feat = 0.0;
        if (disponibilidade_voo_comercial_bool_feat === 1.0) {
            if (HORARIO_PICO_VOO_INICIO_BACKEND <= horario_decolagem_estimado_backend && horario_decolagem_estimado_backend < HORARIO_PICO_VOO_FIM_BACKEND) {
                horario_compativel_voo_comercial_bool_feat = 1.0;
            } else if (Math.random() < 0.2) { 
                horario_compativel_voo_comercial_bool_feat = 1.0;
            }
        }
        
        // 6. disponibilidade_voo_dedicado_bool (Feature para ML)
        let disponibilidade_voo_dedicado_bool_feat = 0.0;
        if ( (distancia_km_ponta_a_ponta > 150 && urgencia_receptor <= 2 && Math.random() > 0.3) ||
             (distancia_km_ponta_a_ponta > 600 && disponibilidade_voo_comercial_bool_feat === 0.0 && horario_compativel_voo_comercial_bool_feat === 0.0 && Math.random() > 0.2) ||
             (tempo_isquemia_max_horas <= 6 && distancia_km_ponta_a_ponta > 400 && Math.random() > 0.25) ) {
            disponibilidade_voo_dedicado_bool_feat = 1.0;
        }

        const feature_values_for_ml = [
            distancia_km_ponta_a_ponta, // Usar a distância total para o modelo
            parseFloat(tempo_isquemia_max_horas),
            parseFloat(urgencia_receptor),
            disponibilidade_voo_comercial_bool_feat,
            horario_compativel_voo_comercial_bool_feat,
            disponibilidade_voo_dedicado_bool_feat
        ];
        
        console.log("Backend: Features enviadas para o ML V2:", feature_values_for_ml);

        if (!process.env.ML_SERVICE_URL) {
            console.error("ERRO: ML_SERVICE_URL não está definida.");
            return res.status(500).json({ error: "Configuração do serviço de ML ausente no servidor." });
        }
        
        let mlPrediction;
        try {
            const mlServiceResponse = await axios.post(
                `${process.env.ML_SERVICE_URL}/predict`,
                { features: feature_values_for_ml }
            );
            mlPrediction = mlServiceResponse.data;
            console.log("Backend: Resposta do ML Service V2:", mlPrediction);
        } catch (mlError) {
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
        
        // --- Calcular detalhes de transporte para a resposta ---
        const transportOptions = [];
        let algumaOpcaoViavelEncontrada = false;

        // Terrestre (usa distancia_km_ponta_a_ponta)
        const terrestreCalc = calcularTempoEstimadoViagemBackend(distancia_km_ponta_a_ponta, 0, 1.0, tempo_isquemia_max_horas);
        transportOptions.push({
            mode: "Terrestre",
            estimatedTimeHours: terrestreCalc.tempoHoras,
            details: terrestreCalc.detalhes,
            riskLevel: terrestreCalc.risco,
            isViableIschemia: terrestreCalc.isViableIschemia,
            isRecommendedByML: mlPrediction.predicted_transport_mode === "Terrestre"
        });
        if (terrestreCalc.isViableIschemia) algumaOpcaoViavelEncontrada = true;

        // Aéreo Comercial (usa distancia_km_ponta_a_ponta como distância de voo para o cálculo de tempo)
        const dispRealComercialParaCalculoTempo = disponibilidade_voo_comercial_bool_feat === 1.0 && horario_compativel_voo_comercial_bool_feat === 1.0;
        const aereoComercialCalc = calcularTempoEstimadoViagemBackend(distancia_km_ponta_a_ponta, 1, dispRealComercialParaCalculoTempo, tempo_isquemia_max_horas);
        if (aereoComercialCalc.tempoHoras !== null) {
            transportOptions.push({
                mode: "Aereo Comercial",
                estimatedTimeHours: aereoComercialCalc.tempoHoras,
                details: aereoComercialCalc.detalhes,
                riskLevel: aereoComercialCalc.risco,
                isViableIschemia: aereoComercialCalc.isViableIschemia,
                isRecommendedByML: mlPrediction.predicted_transport_mode === "Aereo Comercial"
            });
            if (aereoComercialCalc.isViableIschemia) algumaOpcaoViavelEncontrada = true;
        } else { // Se tempoHoras for null, significa que não estava disponível ou houve erro de cálculo de horário
             let detailMsg = "Indisponível.";
             if (disponibilidade_voo_comercial_bool_feat === 1.0 && horario_compativel_voo_comercial_bool_feat === 0.0) {
                detailMsg = "Disponível, mas fora do horário compatível de voo.";
             }
            transportOptions.push({ mode: "Aereo Comercial", details: detailMsg, riskLevel: "N/A", isViableIschemia: false, isRecommendedByML: false });
        }

        // Aéreo Dedicado (usa distancia_km_ponta_a_ponta como distância de voo)
        const aereoDedicadoCalc = calcularTempoEstimadoViagemBackend(distancia_km_ponta_a_ponta, 2, disponibilidade_voo_dedicado_bool_feat, tempo_isquemia_max_horas);
        if (aereoDedicadoCalc.tempoHoras !== null) {
            transportOptions.push({
                mode: "Aereo Dedicado",
                estimatedTimeHours: aereoDedicadoCalc.tempoHoras,
                details: aereoDedicadoCalc.detalhes,
                riskLevel: aereoDedicadoCalc.risco,
                isViableIschemia: aereoDedicadoCalc.isViableIschemia,
                isRecommendedByML: mlPrediction.predicted_transport_mode === "Aereo Dedicado"
            });
            if (aereoDedicadoCalc.isViableIschemia) algumaOpcaoViavelEncontrada = true;
        } else { // Se tempoHoras for null, significa que não estava disponível
            transportOptions.push({ mode: "Aereo Dedicado", details: "Indisponível.", riskLevel: "N/A", isViableIschemia: false, isRecommendedByML: false });
        }
        
        let overallRiskAssessment = "Verificar opções individuais.";
        if (!algumaOpcaoViavelEncontrada) {
            overallRiskAssessment = "ALERTA: Nenhuma opção de transporte encontrada dentro do tempo máximo de isquemia.";
        } else {
            const recomendacaoMLOpcao = transportOptions.find(opt => opt.isRecommendedByML);
            if (recomendacaoMLOpcao) {
                overallRiskAssessment = `Recomendação do ML (${recomendacaoMLOpcao.mode}) tem risco: ${recomendacaoMLOpcao.riskLevel}.`;
                if (!recomendacaoMLOpcao.isViableIschemia) {
                     overallRiskAssessment += " ATENÇÃO: Recomendação do ML excede o tempo de isquemia!";
                }
            }
        }
        
        const logNotes = `ML: ${mlPrediction.predicted_transport_mode}. Risk: ${overallRiskAssessment}. Probs: ${JSON.stringify(mlPrediction.probabilities)}. Features: ${JSON.stringify(feature_values_for_ml)}. Options: ${JSON.stringify(transportOptions)}`;
        let transportLogEntry;
        try {
            transportLogEntry = await prisma.transportLog.create({
                data: {
                    donorId: parseInt(donorId),
                    receiverId: parseInt(receiverId),
                    selectedTransportMode: mlPrediction.predicted_transport_mode || "N/A",
                    estimatedTimeHours: transportOptions.find(opt => opt.isRecommendedByML)?.estimatedTimeHours || 0,
                    status: "PENDING_CONFIRMATION",
                    notes: logNotes.substring(0, 1900), // Prisma text fields can have limits
                },
            });
            console.log("Backend: Log de transporte salvo:", transportLogEntry);
        } catch (logError) {
            console.error("Erro ao salvar o log de transporte:", logError.message);
        }
        
        res.status(200).json({
            message: "Otimização processada.",
            donorInfo: { id: donor.id, hospital: donor.hospital.name, organ: donor.organ.name, maxIschemiaHours: tempo_isquemia_max_horas },
            receiverInfo: { id: receiver.id, hospital: receiver.hospital.name, urgency: receiver.urgencyLevel },
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

// Simulação de random.uniform para JS, já que não é nativo
function randomUniform(min, max) {
    return Math.random() * (max - min) + min;
}
// Adicionar a simulação para `tempo_preparacao_ate_decolagem_comercial_backend` se você quiser usar a mesma lógica do data_generator
// Por enquanto, usei um valor fixo no controller ou a simulação de horário_atual_simulado.
