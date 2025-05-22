import express from 'express';
import {
  createOrgan, getOrgans,
  createHospital, getHospitals, deleteHospital, // Adicionado deleteHospital
  createAirport, getAirports,
  createDonor, getDonors,
  createReceiver, getReceivers
} from '../controllers/masterDataController.js';

const router = express.Router();

// Órgãos
router.post('/organs', createOrgan);
router.get('/organs', getOrgans);

// Hospitais
router.post('/hospitals', createHospital);
router.get('/hospitals', getHospitals);
router.delete('/hospitals/:id', deleteHospital); // NOVA ROTA DELETE

// Aeroportos
router.post('/airports', createAirport);
router.get('/airports', getAirports);

// Doadores
router.post('/donors', createDonor);
router.get('/donors', getDonors);

// Receptores
router.post('/receivers', createReceiver);
router.get('/receivers', getReceivers);

export default router;
