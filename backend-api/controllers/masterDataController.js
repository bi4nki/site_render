import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// --- ÓRGÃOS ---
export const createOrgan = async (req, res) => {
  try {
    const { name, maxIschemiaHours } = req.body;
    if (!name || maxIschemiaHours === undefined) {
      return res.status(400).json({ error: 'Nome e maxIschemiaHours são obrigatórios.' });
    }
    const organ = await prisma.organ.create({
      data: { name, maxIschemiaHours: parseInt(maxIschemiaHours) },
    });
    res.status(201).json(organ);
  } catch (error) {
    console.error("Erro ao criar órgão:", error.message);
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
        return res.status(409).json({ error: `Órgão com nome '${req.body.name}' já existe.` });
    }
    res.status(500).json({ error: 'Não foi possível criar o órgão.', details: error.message });
  }
};

export const getOrgans = async (req, res) => {
  try {
    const organs = await prisma.organ.findMany();
    res.status(200).json(organs);
  } catch (error) {
    console.error("Erro ao buscar órgãos:", error.message);
    res.status(500).json({ error: 'Não foi possível buscar os órgãos.', details: error.message });
  }
};

// --- HOSPITAIS ---
export const createHospital = async (req, res) => {
  try {
    const { name, address, city, state, latitude, longitude, transplantTypes } = req.body;
    if (!name || !city || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'Campos obrigatórios (name, city, latitude, longitude) faltando para hospital.' });
    }
    const hospital = await prisma.hospital.create({
      data: {
        name,
        address: address || "",
        city,
        state: state || "",
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        transplantTypes: transplantTypes || [],
      },
    });
    res.status(201).json(hospital);
  } catch (error) {
    console.error("Erro ao criar hospital:", error.message);
    res.status(500).json({ error: 'Não foi possível criar o hospital.', details: error.message });
  }
};

export const getHospitals = async (req, res) => {
  try {
    const hospitals = await prisma.hospital.findMany();
    res.status(200).json(hospitals);
  } catch (error) {
    console.error("Erro ao buscar hospitais:", error.message);
    res.status(500).json({ error: 'Não foi possível buscar os hospitais.', details: error.message });
  }
};

export const deleteHospital = async (req, res) => {
    const { id } = req.params;
    try {
        const hospital = await prisma.hospital.delete({
            where: { id: parseInt(id) },
        });
        res.status(200).json({ message: `Hospital com id ${id} deletado com sucesso.`, hospital });
    } catch (error) {
        if (error.code === 'P2025') { 
            return res.status(404).json({ error: `Hospital com id ${id} não encontrado.` });
        }
        if (error.code === 'P2003') { 
             console.error("Erro ao deletar hospital (foreign key constraint):", error.message, error.meta);
             return res.status(409).json({ 
                 error: `Não foi possível deletar o hospital com id ${id} pois ele está sendo referenciado por outros registros (Doadores/Receptores). Remova as referências primeiro.`, 
                 details: `Constraint violada no campo: ${error.meta?.field_name || 'desconhecido'}` 
            });
        }
        console.error("Erro ao deletar hospital:", error.message);
        res.status(500).json({ error: 'Não foi possível deletar o hospital.', details: error.message });
    }
};

// --- AEROPORTOS ---

export const deleteAirport = async (req, res) => {
    const { id } = req.params;
    try {
        const airport = await prisma.airport.delete({
            where: { id: parseInt(id) },
        });
        res.status(200).json({ message: `Aeroporto com id ${id} deletado com sucesso.`, airport });
    } catch (error) {
        if (error.code === 'P2025') { 
            return res.status(404).json({ error: `Aeroporto com id ${id} não encontrado.` });
        }
        console.error("Erro ao deletar aeroporto:", error.message);
        res.status(500).json({ error: 'Não foi possível deletar o aeroporto.', details: error.message });
    }
};

export const createAirport = async (req, res) => {
  try {
    const { name, iataCode, city, state, latitude, longitude } = req.body;
    if (!name || !iataCode || !city || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando para aeroporto.' });
    }
    const airport = await prisma.airport.create({
      data: { name, iataCode, city, state: state || "", latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
    });
    res.status(201).json(airport);
  } catch (error) {
    console.error("Erro ao criar aeroporto:", error.message);
     if (error.code === 'P2002' && error.meta?.target?.includes('iataCode')) {
        return res.status(409).json({ error: `Aeroporto com IATA Code '${req.body.iataCode}' já existe.` });
    }
    res.status(500).json({ error: 'Não foi possível criar o aeroporto.', details: error.message });
  }
};
export const getAirports = async (req, res) => {
  try {
    const airports = await prisma.airport.findMany();
    res.status(200).json(airports);
  } catch (error) {
    console.error("Erro ao buscar aeroportos:", error.message);
    res.status(500).json({ error: 'Não foi possível buscar os aeroportos.', details: error.message });
  }
};

// --- DOADORES ---
export const createDonor = async (req, res) => {
    try {
        const { bloodType, hospitalId, organId, availabilityDateTime } = req.body;
        if (!bloodType || hospitalId === undefined || organId === undefined) {
            return res.status(400).json({ error: 'bloodType, hospitalId e organId são obrigatórios.' });
        }
        const donor = await prisma.donor.create({
            data: {
                bloodType,
                hospitalId: parseInt(hospitalId),
                organId: parseInt(organId),
                availabilityDateTime: availabilityDateTime ? new Date(availabilityDateTime) : new Date(),
            },
        });
        res.status(201).json(donor);
    } catch (error) {
        console.error("Erro ao criar doador:", error.message);
        res.status(500).json({ error: 'Não foi possível criar o doador.', details: error.message });
    }
};

export const getDonors = async (req, res) => {
    try {
        const donors = await prisma.donor.findMany({
            include: { hospital: true, organ: true },
        });
        res.status(200).json(donors);
    } catch (error) {
        console.error("Erro ao buscar doadores:", error.message);
        res.status(500).json({ error: 'Não foi possível buscar os doadores.', details: error.message });
    }
};

export const deleteDonor = async (req, res) => {
    const { id } = req.params;
    try {
        const relatedLogs = await prisma.transportLog.count({
            where: { donorId: parseInt(id) }
        });
        if (relatedLogs > 0) {
            return res.status(409).json({ error: `Não é possível deletar o doador com id ${id} pois ele está referenciado em ${relatedLogs} log(s) de transporte. Remova as referências primeiro ou delete os logs.` });
        }

        const donor = await prisma.donor.delete({
            where: { id: parseInt(id) },
        });
        res.status(200).json({ message: `Doador com id ${id} deletado com sucesso.`, donor });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: `Doador com id ${id} não encontrado.` });
        }
        console.error("Erro ao deletar doador:", error.message);
        res.status(500).json({ error: 'Não foi possível deletar o doador.', details: error.message });
    }
};

// --- RECEPTORES ---
export const createReceiver = async (req, res) => {
    try {
        const { bloodType, urgencyLevel, hospitalId, organNeededId, registrationDate } = req.body;
        if (!bloodType || urgencyLevel === undefined || hospitalId === undefined || organNeededId === undefined) {
            return res.status(400).json({ error: 'Campos obrigatórios faltando para receptor.' });
        }
        const receiver = await prisma.receiver.create({
            data: {
                bloodType,
                urgencyLevel: parseInt(urgencyLevel),
                hospitalId: parseInt(hospitalId),
                organNeededId: parseInt(organNeededId),
                registrationDate: registrationDate ? new Date(registrationDate) : new Date(),
            },
        });
        res.status(201).json(receiver);
    } catch (error) {
        console.error("Erro ao criar receptor:", error.message);
        res.status(500).json({ error: 'Não foi possível criar o receptor.', details: error.message });
    }
};

export const getReceivers = async (req, res) => {
    try {
        const receivers = await prisma.receiver.findMany({
            include: { hospital: true, organNeeded: true },
        });
        res.status(200).json(receivers);
    } catch (error) {
        console.error("Erro ao buscar receptores:", error.message);
        res.status(500).json({ error: 'Não foi possível buscar os receptores.', details: error.message });
    }
};

// --- TRANSPORT LOGS ---
export const getTransportLogs = async (req, res) => {
    try {
        const logs = await prisma.transportLog.findMany();
        res.status(200).json(logs);
    } catch (error) {
        console.error("Erro ao buscar logs de transporte:", error.message);
        res.status(500).json({ error: 'Não foi possível buscar os logs.', details: error.message });
    }
};

export const deleteTransportLog = async (req, res) => {
    const { id } = req.params;
    try {
        const log = await prisma.transportLog.delete({
            where: { id: parseInt(id) },
        });
        res.status(200).json({ message: `TransportLog com id ${id} deletado.`, log });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: `TransportLog com id ${id} não encontrado.` });
        }
        console.error("Erro ao deletar TransportLog:", error.message);
        res.status(500).json({ error: 'Não foi possível deletar o TransportLog.', details: error.message });
    }
};

export const deleteAllTransportLogs = async (req, res) => {
    try {
        const deleteResult = await prisma.transportLog.deleteMany({});
        res.status(200).json({ message: `${deleteResult.count} log(s) de transporte deletados.` });
    } catch (error) {
        console.error("Erro ao deletar todos os logs de transporte:", error.message);
        res.status(500).json({ error: 'Não foi possível deletar todos os logs.', details: error.message });
    }
};

// NOVA FUNÇÃO PARA DELETAR RECEPTOR
export const deleteReceiver = async (req, res) => {
    const { id } = req.params;
    try {
        const relatedLogs = await prisma.transportLog.count({
            where: { receiverId: parseInt(id) }
        });
        if (relatedLogs > 0) {
            return res.status(409).json({ error: `Não é possível deletar o receptor com id ${id} pois ele está referenciado em ${relatedLogs} log(s) de transporte. Remova as referências primeiro ou delete os logs.` });
        }

        const receiver = await prisma.receiver.delete({
            where: { id: parseInt(id) },
        });
        res.status(200).json({ message: `Receptor com id ${id} deletado com sucesso.`, receiver });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: `Receptor com id ${id} não encontrado.` });
        }
        console.error("Erro ao deletar receptor:", error.message);
        res.status(500).json({ error: 'Não foi possível deletar o receptor.', details: error.message });
    }
};
