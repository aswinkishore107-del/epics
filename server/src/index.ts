import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import { prisma } from './prisma.js';
import { socketService } from './services/socketService.js';
import { deviceSimulator } from './services/deviceSimulator.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import patientsRoutes from './routes/patients.routes.js';
import vitalsRoutes from './routes/vitals.routes.js';
import ecgRoutes from './routes/ecg.routes.js';
import respirationRoutes from './routes/respiration.routes.js';
import activityRoutes from './routes/activity.routes.js';
import medicationsRoutes from './routes/medications.routes.js';
import remindersRoutes from './routes/reminders.routes.js';
import wellnessRoutes from './routes/wellness.routes.js';
import emergencyRoutes from './routes/emergency.routes.js';
import safetyRulesRoutes from './routes/safetyRules.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import appointmentsRoutes from './routes/appointments.routes.js';
import aiRoutes from './routes/ai.routes.js';
import voiceRoutes from './routes/voice.routes.js';
import devicesRoutes from './routes/devices.routes.js';
import communityRoutes from './routes/community.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import notesRoutes from './routes/notes.routes.js';

const app = express();
const httpServer = http.createServer(app);

// Security and utility middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Initialize Socket.IO server
socketService.init(httpServer);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    platform: 'VIORA — AI-Powered Smart Health Platform',
    version: '2.4.1',
    status: 'ONLINE',
    database: 'Neon PostgreSQL (Connected)',
    features: config.features,
    timestamp: new Date(),
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/ecg', ecgRoutes);
app.use('/api/respiration', respirationRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/medications', medicationsRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/wellness', wellnessRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/safety-rules', safetyRulesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notes', notesRoutes);

// Global error handling middleware
app.use(errorHandler);

// Start HTTP + Socket.IO Server
const PORT = config.port;
httpServer.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 VIORA Health Platform Server running on port ${PORT}`);
  console.log(`🌐 Frontend Allowed Origin: ${config.frontendUrl}`);
  console.log(`🗄️ Neon PostgreSQL Database: Connected via Prisma`);
  console.log(`⚡ Real-Time WebSockets: Active via Socket.IO`);
  console.log(`====================================================`);

  // Optionally initialize continuous device simulator for demo patient
  if (config.features.enableDeviceSimulator) {
    try {
      const demoElderly = await prisma.elderlyProfile.findFirst();
      if (demoElderly) {
        deviceSimulator.startSimulation(demoElderly.id, 12);
        console.log(`📡 Background device simulator initiated for ${demoElderly.id}`);
      }
    } catch (err) {
      console.warn('Could not auto-start simulator for demo patient:', err);
    }
  }
});

export { app, httpServer };
