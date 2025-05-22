import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const ML_EXPECTED_FEATURE_NAMES = [
    "distancia_km", "tempo_isquemia_max_horas", "urgencia_receptor",
    "disponibilidade_voo_comercial_bool", "custo_voo_comercial_estimado",
    "disponibilidade_voo_dedicado_bool", "custo_voo_dedicado_estimado"
];

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distância em km
    return parseFloat(d.toFixed(1)); // Retorna com 1 casa decimal
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
            include: { organNeeded: true, hospital: true },
        });

        if (!donor) return res.status(404).json({ error: `Doador com id ${donorId} não encontrado.` });
        if (!receiver) return res.status(404).json({ error: `Receptor com id ${receiverId} não encontrado.` });
        if (!donor.organ) return res.status(404).json({ error: `Órgão para o doador ${donorId} não encontrado.` });
        if (!donor.hospital) return res.status(404).json({ error: `Hospital para o doador ${donorId} não encontrado.` });
        if (!receiver.hospital) return res.status(404).json({ error: `Hospital para o receptor ${receiverId} não encontrado.` });

        // --- Preparar Features para o ML Service ---

        // 1. distancia_km (Calculada)
        const distancia_km = getDistanceFromLatLonInKm(
            donor.hospital.latitude, donor.hospital.longitude,
            receiver.hospital.latitude, receiver.hospital.longitude
        );
        console.log("Backend: Distância calculada (Haversine):", distancia_km, "km");

        // 2. tempo_isquemia_max_horas
        const tempo_isquemia_max_horas = donor.organ.maxIschemiaHours;

        // 3. urgencia_receptor
        const urgencia_receptor = receiver.urgencyLevel;

        // 4. & 5. Simulações para voo comercial
        let disponibilidade_voo_comercial_bool = 0.0;
        let custo_voo_comercial_estimado = 0.0;
        if (distancia_km > 200 && Math.random() > 0.15) { // 85% de chance se > 200km
            disponibilidade_voo_comercial_bool = 1.0;
            custo_voo_comercial_estimado = parseFloat((500 + (distancia_km * 0.7) + (Math.random() * 500 - 250)).toFixed(2)); // Custo base + por km + variação
        }

        // 6. & 7. Simulações para voo dedicado
        let disponibilidade_voo_dedicado_bool = 0.0;
        let custo_voo_dedicado_estimado = 0.0;
        // Maior chance se urgente e distância considerável, mas menos comum que comercial
        if (distancia_km > 150 && (urgencia_receptor <= 2 || Math.random() > 0.6)) { 
            disponibilidade_voo_dedicado_bool = 1.0;
            custo_voo_dedicado_estimado = parseFloat((2500 + (distancia_km * 3.0) + (Math.random() * 1000 - 500)).toFixed(2));
        }
        // Se a distância for muito grande e o tempo de isquemia permitir pouco, força a disponibilidade de dedicado se comercial não estiver
        if (distancia_km > 1500 && tempo_isquemia_max_horas <= 12 && disponibilidade_voo_comercial_bool === 0.0){
            disponibilidade_voo_dedicado_bool = 1.0;
            if(custo_voo_dedicado_estimado === 0.0) { // Recalcula se não foi setado antes
                 custo_voo_dedicado_estimado = parseFloat((3000 + (distancia_km * 3.0) + (Math.random() * 1000 - 500)).toFixed(2));
            }
        }


        const feature_values_for_ml = [
            distancia_km,
            parseFloat(tempo_isquemia_max_horas),
            parseFloat(urgencia_receptor),
            disponibilidade_voo_comercial_bool,
            custo_voo_comercial_estimado,
            disponibilidade_voo_dedicado_bool,
            custo_voo_dedicado_estimado
        ];
        
        console.log("Backend: Features enviadas para o ML:", feature_values_for_ml);

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
            console.log("Backend: Resposta do ML Service:", mlPrediction);
        } catch (mlError) {
            // ... (bloco de tratamento de erro do axios como antes) ...
            console.error("Erro ao chamar o ML Service:", mlError.message);
            if (mlError.response) {
                console.error("ML Service Response Data:", mlError.response.data);
                console.error("ML Service Response Status:", mlError.response.status);
                return res.status(500).json({ 
                    error: "Erro ao comunicar com o serviço de ML.", 
                    details: mlError.response.data 
                });
            } else if (mlError.request) {
                console.error("ML Service - Nenhuma resposta recebida:", mlError.request);
                return res.status(500).json({ error: "Serviço de ML não respondeu." });
            } else {
                console.error('ML Service - Erro na configuração da requisição:', mlError.message);
                return res.status(500).json({ error: "Erro ao preparar comunicação com o serviço de ML." });
            }
            return res.status(500).json({ error: "Erro desconhecido ao comunicar com o serviço de ML." });
        }
        
        let transportLogEntry;
        try {
            transportLogEntry = await prisma.transportLog.create({
                data: {
                    donorId: parseInt(donorId),
                    receiverId: parseInt(receiverId),
                    selectedTransportMode: mlPrediction.predicted_transport_mode || "N/A",
                    estimatedTimeHours: 0, 
                    status: "PENDING_CONFIRMATION",
                    notes: `ML: ${mlPrediction.predicted_transport_mode}. Probs: ${JSON.stringify(mlPrediction.probabilities)}. Features: ${JSON.stringify(feature_values_for_ml)}`,
                },
            });
            console.log("Backend: Log de transporte salvo:", transportLogEntry);
        } catch (logError) {
            console.error("Erro ao salvar o log de transporte:", logError.message);
        }
        
        res.status(200).json({
            message: "Otimização processada.",
            donorInfo: { id: donor.id, hospital: donor.hospital.name, organ: donor.organ.name },
            receiverInfo: { id: receiver.id, hospital: receiver.hospital.name, urgency: receiver.urgencyLevel },
            calculatedDistanceKm: distancia_km, // Adicionado para debug/info
            featuresSentToML: feature_values_for_ml, // Adicionado para debug/info
            mlRecommendation: mlPrediction,
            logId: transportLogEntry ? transportLogEntry.id : null
        });

    } catch (error) {
        console.error("Erro no processo de otimização:", error);
        res.status(500).json({ error: 'Erro interno no servidor durante a otimização.', details: error.message });
    }
};
