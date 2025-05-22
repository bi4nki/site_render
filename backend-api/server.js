import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import masterDataRoutes from './routes/masterDataRoutes.js';
import optimizationRoutes from './routes/optimizationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js'
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend API is running' });
});

app.use('/api/master-data', masterDataRoutes);
app.use('/api/process', optimizationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error Handling Middleware (simples)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configured' : 'NOT CONFIGURED!');
    console.log('ML_SERVICE_URL:', process.env.ML_SERVICE_URL || 'NOT CONFIGURED!');
  }
});
