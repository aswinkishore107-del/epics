import { prisma } from '../prisma.js';
import { socketService } from './socketService.js';

export const NotificationType = {
  EMERGENCY: 'EMERGENCY',
  FALL: 'FALL',
  SOS: 'SOS',
  ABNORMAL_VITAL: 'ABNORMAL_VITAL',
  MEDICATION: 'MEDICATION',
  REMINDER: 'REMINDER',
  MESSAGE: 'MESSAGE',
  HEALTH_UPDATE: 'HEALTH_UPDATE',
  APPOINTMENT: 'APPOINTMENT',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export interface NotificationPayload {
  title: string;
  message: string;
  type: NotificationType | string;
  link?: string;
}

export class NotificationService {
  /**
   * Send notification to a specific user
   */
  public async sendToUser(userId: string, payload: NotificationPayload) {
    try {
      const notif = await prisma.notification.create({
        data: {
          userId,
          title: payload.title,
          message: payload.message,
          type: (payload.type as NotificationType) || NotificationType.HEALTH_UPDATE,
          link: payload.link,
          isRead: false,
        },
      });

      // Real-time broadcast to user socket
      socketService.emitToUser(userId, 'new_notification', notif);
      return notif;
    } catch (err) {
      console.error('Error in sendToUser notification:', err);
      return null;
    }
  }

  /**
   * Broadcast notification to elderly patient and all authorized caregivers and doctors
   */
  public async notifyPatientTeam(patientId: string, payload: NotificationPayload) {
    try {
      const patient = await prisma.elderlyProfile.findUnique({
        where: { id: patientId },
        include: {
          relationships: {
            where: { status: 'ACTIVE' },
            include: {
              caregiver: true,
              doctor: true,
            },
          },
        },
      });

      if (!patient) return;

      const userIdsToNotify = new Set<string>();

      // 1. Elderly user themselves
      userIdsToNotify.add(patient.userId);

      // 2. Active caregivers & doctors
      for (const rel of patient.relationships) {
        if (rel.caregiver?.userId) {
          userIdsToNotify.add(rel.caregiver.userId);
        }
        if (rel.doctor?.userId) {
          userIdsToNotify.add(rel.doctor.userId);
        }
      }

      const promises = Array.from(userIdsToNotify).map((uid) =>
        this.sendToUser(uid, payload)
      );

      await Promise.all(promises);
    } catch (err) {
      console.error('Error notifying patient team:', err);
    }
  }
}

export const notificationService = new NotificationService();
