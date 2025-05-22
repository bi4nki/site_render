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
    console.error("Erro ao criar órgão:", error);
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
    console.error("Erro ao buscar órgãos:", error);
    res.status(500).json({ error: 'Não foi possível buscar os órgãos.', details: error.message });
  }
};

// --- HOSPITAIS ---
export const createHospital = async (req, res) => {
  try {
    const { name, address, city, state, latitude, longitude, transplantTypes } = req.body;
    // Adicionar validação mais robusta aqui
    if (!name || !city || !latitude || !longitude) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando para hospital.' });
    }
    const hospital = await prisma.hospital.create({
      data: {
        name,
        address,
        city,
        state,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        transplantTypes: transplantTypes || [],
      },
    });
    res.status(201).json(hospital);
  } catch (error) {
    console.error("Erro ao criar hospital:", error);
    res.status(500).json({ error: 'Não foi possível criar o hospital.', details: error.message });
  }
};

export const getHospitals = async (req, res) => {
  try {
    const hospitals = await prisma.hospital.findMany();
    res.status(200).json(hospitals);
  } catch (error) {
    console.error("Erro ao buscar hospitais:", error);
    res.status(500).json({ error: 'Não foi possível buscar os hospitais.', details: error.message });
  }
};

// --- AEROPORTOS ---
export const createAirport = async (req, res) => {
  try {
    const { name, iataCode, city, state, latitude, longitude } = req.body;
    if (!name || !iataCode || !city || !latitude || !longitude) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando para aeroporto.' });
    }
    const airport = await prisma.airport.create({
      data: {
        name,
        iataCode,
        city,
        state,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
    });
    res.status(201).json(airport);
  } catch (error) {
    console.error("Erro ao criar aeroporto:", error);
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
    console.error("Erro ao buscar aeroportos:", error);
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
        console.error("Erro ao criar doador:", error);
        res.status(500).json({ error: 'Não foi possível criar o doador.', details: error.message });
    }
};

export const getDonors = async (req, res) => {
    try {
        const donors = await prisma.donor.findMany({
            include: { hospital: true, organ: true }, // Inclui dados relacionados
        });
        res.status(200).json(donors);
    } catch (error) {
        console.error("Erro ao buscar doadores:", error);
        res.status(500).json({ error: 'Não foi possível buscar os doadores.', details: error.message });
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
        console.error("Erro ao criar receptor:", error);
        res.status(500).json({ error: 'Não foi possível criar o receptor.', details: error.message });
    }
};

export const getReceivers = async (req, res) => {
    try {
        const receivers = await prisma.receiver.findMany({
            include: { hospital: true, organNeeded: true }, // Inclui dados relacionados
        });
        res.status(200).json(receivers);
    } catch (error) {
        console.error("Erro ao buscar receptores:", error);
        res.status(500).json({ error: 'Não foi possível buscar os receptores.', details: error.message });
    }
};
