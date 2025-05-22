import { PrismaClient } from '@prisma/client';
import axios from 'axios'; // Para fazer chamadas HTTP para o ml-service

const prisma = new PrismaClient();

// Nomes e ordem das features como o ml-service espera
// DEVE SER IDÊNTICO AO `EXPECTED_FEATURE_NAMES` no ml-service/app.py
const ML_EXPECTED_FEATURE_NAMES = [
    "distancia_km", "tempo_isquemia_max_horas", "urgencia_receptor",
    "disponibilidade_voo_comercial_bool", "custo_voo_comercial_estimado",
    "disponibilidade_voo_dedicado_bool", "custo_voo_dedicado_estimado"
];

export const optimizeTransport = async (req, res) => {
    const { donorId, receiverId } = req.body;

    if (!donorId || !receiverId) {
        return res.status(400).json({ error: 'donorId e receiverId são obrigatórios.' });
    }

    try {
        // 1. Buscar dados do Doador e do Órgão doado
        const donor = await prisma.donor.findUnique({
            where: { id: parseInt(donorId) },
            include: {
                organ: true,        // Inclui dados do órgão
                hospital: true,     // Inclui dados do hospital do doador
            },
        });

        // 2. Buscar dados do Receptor
        const receiver = await prisma.receiver.findUnique({
            where: { id: parseInt(receiverId) },
            include: {
                organNeeded: true, // Para verificar compatibilidade (não usado no ML diretamente, mas bom ter)
                hospital: true,    // Inclui dados do hospital do receptor
            },
        });

        if (!donor) {
            return res.status(404).json({ error: `Doador com id ${donorId} não encontrado.` });
        }
        if (!receiver) {
            return res.status(404).json({ error: `Receptor com id ${receiverId} não encontrado.` });
        }
        if (!donor.organ) {
            return res.status(404).json({ error: `Órgão para o doador ${donorId} não encontrado.` });
        }
        // Poderia adicionar checagem se donor.organ.id === receiver.organNeeded.id

        // 3. Preparar Features para o ML Service
        // Esta é uma SIMULAÇÃO INICIAL. Você precisará refinar como essas features são calculadas.
        const features = [];

        // Feature 1: distancia_km (Simulação MUITO básica - distância em linha reta, ou fixo)
        // Em um cenário real, você usaria as latitudes/longitudes dos hospitais
        // e uma API como Google Maps ou calcularia a distância haversine.
        // Por agora, vamos simular ou usar um valor fixo para teste.
        // const dist = calcularDistancia(donor.hospital, receiver.hospital); // Função hipotética
        const distancia_km = 500.0; // VALOR DE TESTE - SUBSTITUA POR CÁLCULO REAL/MELHOR SIMULAÇÃO

        // Feature 2: tempo_isquemia_max_horas (do órgão do doador)
        const tempo_isquemia_max_horas = donor.organ.maxIschemiaHours;

        // Feature 3: urgencia_receptor
        const urgencia_receptor = receiver.urgencyLevel;

        // Features 4-7: Simulações para disponibilidade e custo de voos
        // Você pode torná-las mais "inteligentes" depois.
        const disponibilidade_voo_comercial_bool = 1.0; // 1.0 para true, 0.0 para false
        const custo_voo_comercial_estimado = 2000.0;
        const disponibilidade_voo_dedicado_bool = Math.random() > 0.5 ? 1.0 : 0.0; // Aleatório para teste
        const custo_voo_dedicado_estimado = 10000.0;

        // Montar o array na ordem ESPERADA PELO ML_EXPECTED_FEATURE_NAMES
        // Certifique-se de que a ordem aqui corresponde à ordem em ML_EXPECTED_FEATURE_NAMES
        // e que todos são números (floats ou ints que o ML espera como float)
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

        // 4. Chamar o ML Service
        if (!process.env.ML_SERVICE_URL) {
            console.error("ERRO: ML_SERVICE_URL não está definida nas variáveis de ambiente.");
            return res.status(500).json({ error: "Configuração do serviço de ML ausente no servidor." });
        }
        
        let mlPrediction;
        try {
            const mlServiceResponse = await axios.post(
                `${process.env.ML_SERVICE_URL}/predict`,
                { features: feature_values_for_ml } // Envia no formato que o ml-service espera
            );
            mlPrediction = mlServiceResponse.data;
            console.log("Backend: Resposta do ML Service:", mlPrediction);
        } catch (mlError) {
            console.error("Erro ao chamar o ML Service:", mlError.message);
            if (mlError.response) {
                console.error("ML Service Response Data:", mlError.response.data);
                console.error("ML Service Response Status:", mlError.response.status);
                return res.status(500).json({ 
                    error: "Erro ao comunicar com o serviço de ML.", 
                    details: mlError.response.data 
                });
            }
            return res.status(500).json({ error: "Erro de comunicação com o serviço de ML." });
        }

        // 5. (Opcional por agora) Lógica Adicional de Transporte e Custos
        // Aqui você adicionaria chamadas para Google Maps (distâncias/tempos terrestres)
        // e simulações/APIs de voos para enriquecer a decisão ou apresentar opções.
        // Por enquanto, vamos focar na sugestão do ML.

        // 6. Salvar Log da Decisão (Básico)
        let transportLogEntry;
        try {
            transportLogEntry = await prisma.transportLog.create({
                data: {
                    donorId: parseInt(donorId),
                    receiverId: parseInt(receiverId),
                    selectedTransportMode: mlPrediction.predicted_transport_mode || "N/A",
                    estimatedTimeHours: 0, // Placeholder - seria calculado com mais lógica
                    status: "PENDING_CONFIRMATION", // Exemplo de status
                    notes: `Sugestão do ML: ${mlPrediction.predicted_transport_mode}. Probs: ${JSON.stringify(mlPrediction.probabilities)}`,
                },
            });
            console.log("Backend: Log de transporte salvo:", transportLogEntry);
        } catch (logError) {
            console.error("Erro ao salvar o log de transporte:", logError.message);
            // Não falhar a requisição principal por causa do log, mas registrar o erro
        }
        
        // 7. Retornar a Resposta Consolidada
        res.status(200).json({
            message: "Otimização processada.",
            donorInfo: { id: donor.id, hospital: donor.hospital.name, organ: donor.organ.name },
            receiverInfo: { id: receiver.id, hospital: receiver.hospital.name, urgency: receiver.urgencyLevel },
            mlRecommendation: mlPrediction,
            logId: transportLogEntry ? transportLogEntry.id : null
            // Adicionar mais detalhes de transporte aqui no futuro
        });

    } catch (error) {
        console.error("Erro no processo de otimização:", error);
        res.status(500).json({ error: 'Erro interno no servidor durante a otimização.', details: error.message });
    }
};

// Função hipotética para cálculo de distância (SIMPLES para exemplo)
// Em um projeto real, use Haversine ou uma API de mapas.
// function calcularDistancia(hospitalOrigem, hospitalDestino) {
//     // Exemplo muito simples baseado em diferença de lat/lon (NÃO PRECISO GEOGRAFICAMENTE)
//     const latDiff = Math.abs(hospitalOrigem.latitude - hospitalDestino.latitude);
//     const lonDiff = Math.abs(hospitalOrigem.longitude - hospitalDestino.longitude);
//     // Fator de conversão aproximado para km (varia com a latitude)
//     // Esta é uma GRANDE simplificação.
//     return Math.sqrt(latDiff*latDiff + lonDiff*lonDiff) * 111; 
// }
