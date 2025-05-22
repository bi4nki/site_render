
import express from 'express';
import { optimizeTransport } from '../controllers/optimizationController.js'; // Criaremos este controller a seguir

const router = express.Router();

// Rota para iniciar o processo de otimização de transporte
// Espera { donorId: number, receiverId: number } no corpo da requisição
router.post('/optimize', optimizeTransport);

export default router;
