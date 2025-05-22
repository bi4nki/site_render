// backend-api/controllers/dashboardController.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getDashboardStats = async (req, res) => {
    try {
        const hospitalCount = await prisma.hospital.count();
        const organCount = await prisma.organ.count();
        const airportCount = await prisma.airport.count();
        const donorCount = await prisma.donor.count(); // Poderia adicionar filtros aqui, ex: status 'ativo'
        const receiverCount = await prisma.receiver.count(); // Poderia adicionar filtros aqui
        const transportLogCount = await prisma.transportLog.count();

        // Opcional: buscar alguns dos últimos logs de transporte
        const recentTransportLogs = await prisma.transportLog.findMany({
            take: 3, // Pega os 3 mais recentes
            orderBy: {
                createdAt: 'desc',
            },
            include: { // Incluir nomes em vez de apenas IDs, se possível e seu schema permitir
                // donor: { select: { id: true, organ: { select: { name: true } } } },
                // receiver: { select: { id: true, hospital: { select: { name: true } } } }
            }
        });


        res.status(200).json({
            hospitalCount,
            organCount,
            airportCount,
            donorCount,
            receiverCount,
            transportLogCount,
            recentTransportLogs 
        });

    } catch (error) {
        console.error("Erro ao buscar estatísticas do dashboard:", error.message);
        res.status(500).json({ error: 'Não foi possível buscar as estatísticas.', details: error.message });
    }
};
