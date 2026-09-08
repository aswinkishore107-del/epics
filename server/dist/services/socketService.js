"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketService = exports.SocketService = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
class SocketService {
    io = null;
    userSocketMap = new Map(); // userId -> socketId[]
    init(httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: [env_js_1.config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
                methods: ['GET', 'POST', 'PATCH', 'DELETE'],
                credentials: true,
            },
        });
        // Authentication middleware for Socket.IO
        this.io.use((socket, next) => {
            const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
            const rawToken = token && typeof token === 'string' && token.startsWith('Bearer ') ? token.split(' ')[1] : token;
            if (!rawToken || typeof rawToken !== 'string') {
                return next(new Error('Authentication token required for WebSocket connection'));
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(rawToken, env_js_1.config.jwt.secret);
                socket.data.user = decoded;
                next();
            }
            catch (err) {
                next(new Error('Invalid socket authentication token'));
            }
        });
        this.io.on('connection', (socket) => {
            const user = socket.data.user;
            if (!user)
                return;
            const userId = user.id;
            const userSockets = this.userSocketMap.get(userId) || [];
            userSockets.push(socket.id);
            this.userSocketMap.set(userId, userSockets);
            // Join personal user room
            socket.join(`user:${userId}`);
            // Join room by conversation
            socket.on('join_conversation', (conversationId) => {
                socket.join(`conv:${conversationId}`);
            });
            socket.on('leave_conversation', (conversationId) => {
                socket.leave(`conv:${conversationId}`);
            });
            // Join room by patientId
            socket.on('join_patient', (patientId) => {
                socket.join(`patient:${patientId}`);
            });
            // Typing indicators for chat
            socket.on('typing_started', (data) => {
                socket.to(`conv:${data.conversationId}`).emit('typing_started', {
                    conversationId: data.conversationId,
                    userId,
                    senderName: data.senderName,
                });
            });
            socket.on('typing_stopped', (data) => {
                socket.to(`conv:${data.conversationId}`).emit('typing_stopped', {
                    conversationId: data.conversationId,
                    userId,
                });
            });
            // Entertainment & media commands from elderly UI to neckband abstraction
            socket.on('music_command', (data) => {
                this.emitToPatientRoom(data.patientId, 'music_command', data);
            });
            socket.on('call_command', (data) => {
                this.emitToPatientRoom(data.patientId, 'call_command', data);
            });
            socket.on('disconnect', () => {
                const currentSockets = this.userSocketMap.get(userId) || [];
                const filtered = currentSockets.filter((id) => id !== socket.id);
                if (filtered.length > 0) {
                    this.userSocketMap.set(userId, filtered);
                }
                else {
                    this.userSocketMap.delete(userId);
                }
            });
        });
        return this.io;
    }
    getIO() {
        if (!this.io) {
            throw new Error('Socket.IO is not initialized yet.');
        }
        return this.io;
    }
    emitToUser(userId, event, data) {
        if (this.io) {
            this.io.to(`user:${userId}`).emit(event, data);
        }
    }
    emitToPatientRoom(patientId, event, data) {
        if (this.io) {
            this.io.to(`patient:${patientId}`).emit(event, data);
        }
    }
    emitToConversation(conversationId, event, data) {
        if (this.io) {
            this.io.to(`conv:${conversationId}`).emit(event, data);
        }
    }
    broadcast(event, data) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }
}
exports.SocketService = SocketService;
exports.socketService = new SocketService();
