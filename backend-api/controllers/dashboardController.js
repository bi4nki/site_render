import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getDashboardStats = async (req, res) => {
    try {
        const hospitalCount = await prisma.hospital.count();
        const organCount = await prisma.organ.count();
        const airportCount = await prisma.airport.count();
        const donorCount = await prisma.donor.count();
        const receiverCount = await prisma.receiver.count();
        const transportLogCount = await prisma.transportLog.count();

        const recentTransportLogs = await prisma.transportLog.findMany({
            take: 3, 
            orderBy: {
                createdAt: 'desc',
            },
            include: {
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
