import express from 'express';
import {
  createOrgan, getOrgans,
  createHospital, getHospitals, deleteHospital,
  createAirport, getAirports,
  createDonor, getDonors, deleteDonor,       // Adicionado deleteDonor
  createReceiver, getReceivers, deleteReceiver // Adicionado deleteReceiver
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
// Não adicionei delete para airports.

// Doadores
router.post('/donors', createDonor);
router.get('/donors', getDonors);
router.delete('/donors/:id', deleteDonor); // NOVA ROTA

// Receptores
router.post('/receivers', createReceiver);
router.get('/receivers', getReceivers);
router.delete('/receivers/:id', deleteReceiver); // NOVA ROTA

export default router;
