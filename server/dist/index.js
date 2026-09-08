"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpServer = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const env_js_1 = require("./config/env.js");
const prisma_js_1 = require("./prisma.js");
const socketService_js_1 = require("./services/socketService.js");
const deviceSimulator_js_1 = require("./services/deviceSimulator.js");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
// Route imports
const auth_routes_js_1 = __importDefault(require("./routes/auth.routes.js"));
const patients_routes_js_1 = __importDefault(require("./routes/patients.routes.js"));
const vitals_routes_js_1 = __importDefault(require("./routes/vitals.routes.js"));
const ecg_routes_js_1 = __importDefault(require("./routes/ecg.routes.js"));
const respiration_routes_js_1 = __importDefault(require("./routes/respiration.routes.js"));
const activity_routes_js_1 = __importDefault(require("./routes/activity.routes.js"));
const medications_routes_js_1 = __importDefault(require("./routes/medications.routes.js"));
const reminders_routes_js_1 = __importDefault(require("./routes/reminders.routes.js"));
const wellness_routes_js_1 = __importDefault(require("./routes/wellness.routes.js"));
const emergency_routes_js_1 = __importDefault(require("./routes/emergency.routes.js"));
const safetyRules_routes_js_1 = __importDefault(require("./routes/safetyRules.routes.js"));
const messages_routes_js_1 = __importDefault(require("./routes/messages.routes.js"));
const notifications_routes_js_1 = __importDefault(require("./routes/notifications.routes.js"));
const appointments_routes_js_1 = __importDefault(require("./routes/appointments.routes.js"));
const ai_routes_js_1 = __importDefault(require("./routes/ai.routes.js"));
const voice_routes_js_1 = __importDefault(require("./routes/voice.routes.js"));
const devices_routes_js_1 = __importDefault(require("./routes/devices.routes.js"));
const community_routes_js_1 = __importDefault(require("./routes/community.routes.js"));
const reports_routes_js_1 = __importDefault(require("./routes/reports.routes.js"));
const notes_routes_js_1 = __importDefault(require("./routes/notes.routes.js"));
const app = (0, express_1.default)();
exports.app = app;
const httpServer = http_1.default.createServer(app);
exports.httpServer = httpServer;
// Security and utility middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use((0, cors_1.default)({
    origin: [env_js_1.config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
if (env_js_1.config.env === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// Initialize Socket.IO server
socketService_js_1.socketService.init(httpServer);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        platform: 'VIORA — AI-Powered Smart Health Platform',
        version: '2.4.1',
        status: 'ONLINE',
        database: 'Neon PostgreSQL (Connected)',
        features: env_js_1.config.features,
        timestamp: new Date(),
    });
});
// Mount modular API routes
app.use('/api/auth', auth_routes_js_1.default);
app.use('/api/patients', patients_routes_js_1.default);
app.use('/api/vitals', vitals_routes_js_1.default);
app.use('/api/ecg', ecg_routes_js_1.default);
app.use('/api/respiration', respiration_routes_js_1.default);
app.use('/api/activity', activity_routes_js_1.default);
app.use('/api/medications', medications_routes_js_1.default);
app.use('/api/reminders', reminders_routes_js_1.default);
app.use('/api/wellness', wellness_routes_js_1.default);
app.use('/api/emergency', emergency_routes_js_1.default);
app.use('/api/safety-rules', safetyRules_routes_js_1.default);
app.use('/api/messages', messages_routes_js_1.default);
app.use('/api/notifications', notifications_routes_js_1.default);
app.use('/api/appointments', appointments_routes_js_1.default);
app.use('/api/ai', ai_routes_js_1.default);
app.use('/api/voice', voice_routes_js_1.default);
app.use('/api/devices', devices_routes_js_1.default);
app.use('/api/community', community_routes_js_1.default);
app.use('/api/reports', reports_routes_js_1.default);
app.use('/api/notes', notes_routes_js_1.default);
// Global error handling middleware
app.use(errorHandler_js_1.errorHandler);
// Start HTTP + Socket.IO Server
const PORT = env_js_1.config.port;
httpServer.listen(PORT, async () => {
    console.log(`====================================================`);
    console.log(`🚀 VIORA Health Platform Server running on port ${PORT}`);
    console.log(`🌐 Frontend Allowed Origin: ${env_js_1.config.frontendUrl}`);
    console.log(`🗄️ Neon PostgreSQL Database: Connected via Prisma`);
    console.log(`⚡ Real-Time WebSockets: Active via Socket.IO`);
    console.log(`====================================================`);
    // Optionally initialize continuous device simulator for demo patient
    if (env_js_1.config.features.enableDeviceSimulator) {
        try {
            const demoElderly = await prisma_js_1.prisma.elderlyProfile.findFirst();
            if (demoElderly) {
                deviceSimulator_js_1.deviceSimulator.startSimulation(demoElderly.id, 12);
                console.log(`📡 Background device simulator initiated for ${demoElderly.id}`);
            }
        }
        catch (err) {
            console.warn('Could not auto-start simulator for demo patient:', err);
        }
    }
});
