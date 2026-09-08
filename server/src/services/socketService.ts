import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AuthUser } from '../middleware/auth.js';

export class SocketService {
  private io: SocketIOServer | null = null;
  private userSocketMap = new Map<string, string[]>(); // userId -> socketId[]

  public init(httpServer: HttpServer): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        credentials: true,
      },
    });

    // Authentication middleware for Socket.IO
    this.io.use((socket: Socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
      const rawToken = token && typeof token === 'string' && token.startsWith('Bearer ') ? token.split(' ')[1] : token;

      if (!rawToken || typeof rawToken !== 'string') {
        return next(new Error('Authentication token required for WebSocket connection'));
      }

      try {
        const decoded = jwt.verify(rawToken, config.jwt.secret) as AuthUser;
        socket.data.user = decoded;
        next();
      } catch (err) {
        next(new Error('Invalid socket authentication token'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const user = socket.data.user as AuthUser;
      if (!user) return;

      const userId = user.id;
      const userSockets = this.userSocketMap.get(userId) || [];
      userSockets.push(socket.id);
      this.userSocketMap.set(userId, userSockets);

      // Join personal user room
      socket.join(`user:${userId}`);

      // Join room by conversation
      socket.on('join_conversation', (conversationId: string) => {
        socket.join(`conv:${conversationId}`);
      });

      socket.on('leave_conversation', (conversationId: string) => {
        socket.leave(`conv:${conversationId}`);
      });

      // Join room by patientId
      socket.on('join_patient', (patientId: string) => {
        socket.join(`patient:${patientId}`);
      });

      // Typing indicators for chat
      socket.on('typing_started', (data: { conversationId: string; senderName: string }) => {
        socket.to(`conv:${data.conversationId}`).emit('typing_started', {
          conversationId: data.conversationId,
          userId,
          senderName: data.senderName,
        });
      });

      socket.on('typing_stopped', (data: { conversationId: string }) => {
        socket.to(`conv:${data.conversationId}`).emit('typing_stopped', {
          conversationId: data.conversationId,
          userId,
        });
      });

      // Entertainment & media commands from elderly UI to neckband abstraction
      socket.on('music_command', (data: { patientId: string; command: string; track?: string; volume?: number }) => {
        this.emitToPatientRoom(data.patientId, 'music_command', data);
      });

      socket.on('call_command', (data: { patientId: string; action: string; contact?: any }) => {
        this.emitToPatientRoom(data.patientId, 'call_command', data);
      });

      socket.on('disconnect', () => {
        const currentSockets = this.userSocketMap.get(userId) || [];
        const filtered = currentSockets.filter((id) => id !== socket.id);
        if (filtered.length > 0) {
          this.userSocketMap.set(userId, filtered);
        } else {
          this.userSocketMap.delete(userId);
        }
      });
    });

    return this.io;
  }

  public getIO(): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.IO is not initialized yet.');
    }
    return this.io;
  }

  public emitToUser(userId: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }

  public emitToPatientRoom(patientId: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(`patient:${patientId}`).emit(event, data);
    }
  }

  public emitToConversation(conversationId: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(`conv:${conversationId}`).emit(event, data);
    }
  }

  public broadcast(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
}

export const socketService = new SocketService();
