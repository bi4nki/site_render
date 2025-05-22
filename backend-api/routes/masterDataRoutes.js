import express from 'express';
import {
  createOrgan, getOrgans,
  createHospital, getHospitals, deleteHospital,
  createAirport, getAirports,
  createDonor, getDonors, deleteDonor,       // Adicionado deleteDonor
  createReceiver, getReceivers, deleteReceiver, // Adicionado deleteReceiver
  deleteTransportLog, getTransportLogs, deleteAllTransportLogs,
  deleteAirport
} from '../controllers/masterDataController.js';

const router = express.Router();

// Órgãos
router.post('/organs', createOrgan);
router.get('/organs', getOrgans);
// Não adicionei delete para organs, assumindo que são mais estáticos. Adicione se precisar.

// Hospitais
router.post('/hospitals', createHospital);
router.get('/hospitals', getHospitals);
router.delete('/hospitals/:id', deleteHospital);

// Aeroportos
router.post('/airports', createAirport);
router.get('/airports', getAirports);
router.delete('/airports/:id', deleteAirport);

// Doadores
router.post('/donors', createDonor);
router.get('/donors', getDonors);
router.delete('/donors/:id', deleteDonor); // NOVA ROTA

// Receptores
router.post('/receivers', createReceiver);
router.get('/receivers', getReceivers);
router.delete('/receivers/:id', deleteReceiver); // NOVA ROTA

// TransportLogs (ADICIONAR ESTAS ROTAS)
router.get('/transport-logs', getTransportLogs);
router.delete('/transport-logs/:id', deleteTransportLog);
router.delete('/transport-logs', deleteAllTransportLogs); // Para deletar todos

export default router;
