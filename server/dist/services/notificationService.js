"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = exports.NotificationType = void 0;
const prisma_js_1 = require("../prisma.js");
const socketService_js_1 = require("./socketService.js");
exports.NotificationType = {
    EMERGENCY: 'EMERGENCY',
    FALL: 'FALL',
    SOS: 'SOS',
    ABNORMAL_VITAL: 'ABNORMAL_VITAL',
    MEDICATION: 'MEDICATION',
    REMINDER: 'REMINDER',
    MESSAGE: 'MESSAGE',
    HEALTH_UPDATE: 'HEALTH_UPDATE',
    APPOINTMENT: 'APPOINTMENT',
};
class NotificationService {
    /**
     * Send notification to a specific user
     */
    async sendToUser(userId, payload) {
        try {
            const notif = await prisma_js_1.prisma.notification.create({
                data: {
                    userId,
                    title: payload.title,
                    message: payload.message,
                    type: payload.type || exports.NotificationType.HEALTH_UPDATE,
                    link: payload.link,
                    isRead: false,
                },
            });
            // Real-time broadcast to user socket
            socketService_js_1.socketService.emitToUser(userId, 'new_notification', notif);
            return notif;
        }
        catch (err) {
            console.error('Error in sendToUser notification:', err);
            return null;
        }
    }
    /**
     * Broadcast notification to elderly patient and all authorized caregivers and doctors
     */
    async notifyPatientTeam(patientId, payload) {
        try {
            const patient = await prisma_js_1.prisma.elderlyProfile.findUnique({
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
            if (!patient)
                return;
            const userIdsToNotify = new Set();
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
            const promises = Array.from(userIdsToNotify).map((uid) => this.sendToUser(uid, payload));
            await Promise.all(promises);
        }
        catch (err) {
            console.error('Error notifying patient team:', err);
        }
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
