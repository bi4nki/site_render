import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Nomes e ordem das 6 features como o ml-service (V_ATUAL, ex: V4 ou V5) espera
const ML_EXPECTED_FEATURE_NAMES = [ 
    "distancia_km", "tempo_isquemia_max_horas", "urgencia_receptor",
    "disponibilidade_voo_comercial_bool",
    "horario_compativel_voo_comercial_bool",
    "disponibilidade_voo_dedicado_bool"
];

// --- Constantes para Estimativa de Tempo (horas) do Backend (Conforme sua solicitação) ---
const VELOCIDADE_TERRESTRE_KMH_BACKEND = 80;
const VELOCIDADE_AEREO_COMERCIAL_KMH_BACKEND = 800;
const VELOCIDADE_AEREO_DEDICADO_KMH_BACKEND = 700;
const TEMPO_SOLO_AEROPORTOS_COMERCIAL_HORAS_BACKEND = 1.0;
const TEMPO_SOLO_AEROPORTOS_DEDICADO_HORAS_BACKEND = 0.75;
const TEMPO_DESLOC_HOSP_AEROPORTOS_TOTAL_SIMULADO_BACKEND = 1.2; // Soma dos dois trechos (origem + destino)

// Horários de "pico" para voos comerciais simulados (0-23h)
const HORARIO_PICO_VOO_INICIO_BACKEND = 6; 
const HORARIO_PICO_VOO_FIM_BACKEND = 22;   

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || typeof lat2 !== 'number' || typeof lon2 !== 'number') {
        console.error("Coordenadas inválidas para cálculo de distância:", lat1, lon1, lat2, lon2);
        return 0; 
    }
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

function randomUniform(min, max) {
    return Math.random() * (max - min) + min;
}

function checkABOCompatibility(donorBloodType, receiverBloodType) {
    if (!donorBloodType || !receiverBloodType) return false;
    const donorABO = donorBloodType.replace(/[+-]$/, '').toUpperCase();
    const receiverABO = receiverBloodType.replace(/[+-]$/, '').toUpperCase();
    console.log(`Backend: Checando compatibilidade ABO: Doador ${donorABO} -> Receptor ${receiverABO}`);
    if (donorABO === "O") return true;
    if (donorABO === "A" && (receiverABO === "A" || receiverABO === "AB")) return true;
    if (donorABO === "B" && (receiverABO === "B" || receiverABO === "AB")) return true;
    if (donorABO === "AB" && receiverABO === "AB") return true;
    return false;
}

function calcularTempoEstimadoViagemBackend(distanciaKmOuDistanciaVoo, modal, disponibilidadeBool, tempoIsquemiaMaxHoras) {
    if (modal !== 0 && !disponibilidadeBool) { 
        let motivoIndisponibilidade = "Indisponível (simulado).";
        if (modal === 1) { // Se for aéreo comercial, e a flag geral de disponibilidade é true, mas a de horário não, então é por horário
             // Esta função agora recebe a disponibilidade FINAL do modal, então a mensagem pode ser genérica.
             // A lógica de "fora do horário" é melhor tratada ANTES de chamar esta função, ao construir transportOptions.
        }
        return { tempoHoras: null, detalhes: motivoIndisponibilidade, risco: "N/A", isViableIschemia: false };
    }

    let tempoViagemHoras;
    let detalhes = "";
    let risco = "Baixo"; 

    switch (modal) {
        case 0: 
            tempoViagemHoras = distanciaKmOuDistanciaVoo / VELOCIDADE_TERRESTRE_KMH_BACKEND;
            detalhes = `Distância: ${distanciaKmOuDistanciaVoo.toFixed(1)}km. Velocidade média: ${VELOCIDADE_TERRESTRE_KMH_BACKEND}km/h.`;
            break;
        case 1: 
            const tempoVooComercial = distanciaKmOuDistanciaVoo / VELOCIDADE_AEREO_COMERCIAL_KMH_BACKEND;
            tempoViagemHoras = TEMPO_DESLOC_HOSP_AEROPORTOS_TOTAL_SIMULADO_BACKEND + TEMPO_SOLO_AEROPORTOS_COMERCIAL_HORAS_BACKEND + tempoVooComercial;
            detalhes = `Desloc. terrestre aeroportos (total): ${TEMPO_DESLOC_HOSP_AEROPORTOS_TOTAL_SIMULADO_BACKEND.toFixed(1)}h. Tempo solo aeroportos (total): ${TEMPO_SOLO_AEROPORTOS_COMERCIAL_HORAS_BACKEND.toFixed(1)}h. Voo (${distanciaKmOuDistanciaVoo.toFixed(1)}km @ ${VELOCIDADE_AEREO_COMERCIAL_KMH_BACKEND}km/h): ${tempoVooComercial.toFixed(2)}h.`;
            break;
        case 2: 
            const tempoVooDedicado = distanciaKmOuDistanciaVoo / VELOCIDADE_AEREO_DEDICADO_KMH_BACKEND;
            tempoViagemHoras = TEMPO_DESLOC_HOSP_AEROPORTOS_TOTAL_SIMULADO_BACKEND + TEMPO_SOLO_AEROPORTOS_DEDICADO_HORAS_BACKEND + tempoVooDedicado;
            detalhes = `Desloc. terrestre aeroportos (total): ${TEMPO_DESLOC_HOSP_AEROPORTOS_TOTAL_SIMULADO_BACKEND.toFixed(1)}h. Tempo solo aeroportos (total): ${TEMPO_SOLO_AEROPORTOS_DEDICADO_HORAS_BACKEND.toFixed(1)}h. Voo (${distanciaKmOuDistanciaVoo.toFixed(1)}km @ ${VELOCIDADE_AEREO_DEDICADO_KMH_BACKEND}km/h): ${tempoVooDedicado.toFixed(2)}h.`;
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
            include: { hospital: true, organNeeded: true }, 
        });

        if (!donor) return res.status(404).json({ error: `Doador com id ${donorId} não encontrado.` });
        if (!receiver) return res.status(404).json({ error: `Receptor com id ${receiverId} não encontrado.` });
        if (!donor.organ) return res.status(404).json({ error: `Órgão para o doador ${donorId} não encontrado.` });
        if (!receiver.organNeeded) return res.status(404).json({ error: `Órgão necessário para o receptor ${receiverId} não encontrado.` });
        if (!donor.hospital) return res.status(404).json({ error: `Hospital para o doador ${donorId} não encontrado.` });
        if (!receiver.hospital) return res.status(404).json({ error: `Hospital para o receptor ${receiverId} não encontrado.` });

        if (donor.organ.id !== receiver.organNeeded.id) {
            console.log(`Backend: Incompatibilidade de Órgão: Doador (${donor.organ.name}) vs Receptor (${receiver.organNeeded.name})`);
            return res.status(400).json({ error: 'Incompatibilidade de Órgão.', message: `O doador oferece um ${donor.organ.name}, mas o receptor precisa de um ${receiver.organNeeded.name}.`});
        }
        if (!donor.bloodType || !receiver.bloodType) {
            return res.status(400).json({ error: 'Tipo sanguíneo do doador ou receptor não informado no banco de dados.' });
        }
        if (!checkABOCompatibility(donor.bloodType, receiver.bloodType)) {
            console.log(`Backend: Incompatibilidade Sanguínea ABO: Doador (${donor.bloodType}) -> Receptor (${receiver.bloodType})`);
            return res.status(400).json({ error: 'Incompatibilidade Sanguínea (ABO).', message: `Tipo sanguíneo do doador (${donor.bloodType}) não é compatível com o do receptor (${receiver.bloodType}).`});
        }
        console.log(`Backend: Compatibilidade Sanguínea ABO: Doador (${donor.bloodType}) -> Receptor (${receiver.bloodType}) = OK`);
        
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
        
        // --- LÓGICA DE DISPONIBILIDADE DE VOO DEDICADO ATUALIZADA (Opção 2 anterior) ---
        let disponibilidade_voo_dedicado_bool_feat = 0.0;
        if (distancia_km_ponta_a_ponta > 1000) { 
            disponibilidade_voo_dedicado_bool_feat = 1.0;
        } else if (urgencia_receptor <= 2 && distancia_km_ponta_a_ponta > 200) { 
            disponibilidade_voo_dedicado_bool_feat = 1.0;
        } else if (tempo_isquemia_max_horas <= 6 && distancia_km_ponta_a_ponta > 200) { 
            disponibilidade_voo_dedicado_bool_feat = 1.0;
        } else if (distancia_km_ponta_a_ponta > 300 && Math.random() < 0.4) { 
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
        
        console.log("Backend: Features enviadas para o ML (V_ATUAL):", feature_values_for_ml);

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
            console.log("Backend: Resposta do ML Service (V_ATUAL):", mlPrediction);
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
        
        const transportOptions = [];
        let algumaOpcaoViavelEncontrada = false;

        // Terrestre
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

        // Aéreo Comercial
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
        } else { 
             let detailMsg = "Indisponível (simulado).";
             if (disponibilidade_voo_comercial_bool_feat === 1.0 && horario_compativel_voo_comercial_bool_feat === 0.0) {
                detailMsg = "Disponível (geral), mas fora do horário compatível de voo simulado.";
             }
            transportOptions.push({ mode: "Aereo Comercial", details: detailMsg, riskLevel: "N/A", isViableIschemia: false, isRecommendedByML: false });
        }
        
        // Aéreo Dedicado
        console.log("Backend: Valor de disponibilidade_voo_dedicado_bool_feat (para cálculo de tempo):", disponibilidade_voo_dedicado_bool_feat);
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
        } else { 
            transportOptions.push({ mode: "Aereo Dedicado", details: "Indisponível (simulado).", riskLevel: "N/A", isViableIschemia: false, isRecommendedByML: false });
        }
        
        let overallRiskAssessment = "Verificar opções individuais.";
        if (!algumaOpcaoViavelEncontrada) {
            overallRiskAssessment = "ALERTA: Nenhuma opção de transporte encontrada dentro do tempo máximo de isquemia.";
        } else {
            const recomendacaoMLOpcao = transportOptions.find(opt => opt.isRecommendedByML);
            if (recomendacaoMLOpcao) {
                overallRiskAssessment = `Recomendação do ML (${recomendacaoMLOpcao.mode}) tem risco: ${recomendacaoMLOpcao.riskLevel}.`;
                if (recomendacaoMLOpcao.tempoHoras === null || !recomendacaoMLOpcao.isViableIschemia) { // Checa se tempoHoras é null também
                     overallRiskAssessment += " ATENÇÃO: Recomendação do ML pode não ser viável ou excede o tempo de isquemia!";
                }
            }
        }
        
        const logNotes = `ML: ${mlPrediction.predicted_transport_mode}. Risk: ${overallRiskAssessment}. ABO: YES. Organ: YES. Probs: ${JSON.stringify(mlPrediction.probabilities)}. Features: ${JSON.stringify(feature_values_for_ml)}. Options: ${JSON.stringify(transportOptions)}`;
        let transportLogEntry;
        try {
            const recommendedOption = transportOptions.find(opt => opt.isRecommendedByML && opt.estimatedTimeHours !== null);
            transportLogEntry = await prisma.transportLog.create({
                data: {
                    donorId: parseInt(donorId),
                    receiverId: parseInt(receiverId),
                    selectedTransportMode: mlPrediction.predicted_transport_mode || "N/A",
                    estimatedTimeHours: recommendedOption ? recommendedOption.estimatedTimeHours : 0,
                    status: "PENDING_CONFIRMATION",
                    notes: logNotes.substring(0, 1900), // Limita o tamanho da nota
                },
            });
            console.log("Backend: Log de transporte salvo:", transportLogEntry);
        } catch (logError) {
            console.error("Erro ao salvar o log de transporte:", logError.message);
        }
        
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
