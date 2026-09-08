"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentStatus = exports.MeasurementSource = exports.HealthStatus = exports.UserRole = exports.NotificationType = exports.MessageType = exports.RuleOperator = exports.MetricType = exports.SeverityLevel = exports.EmergencyType = exports.FallStatus = exports.EmergencyStatus = exports.ReminderStatus = exports.ReminderCategory = exports.MedicationStatus = void 0;
exports.MedicationStatus = {
    UPCOMING: 'UPCOMING',
    TAKEN: 'TAKEN',
    MISSED: 'MISSED',
    SKIPPED: 'SKIPPED',
};
exports.ReminderCategory = {
    MEDICATION: 'MEDICATION',
    ACTIVITY: 'ACTIVITY',
    APPOINTMENT: 'APPOINTMENT',
    HYDRATION: 'HYDRATION',
    GENERAL: 'GENERAL',
};
exports.ReminderStatus = {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    SNOOZED: 'SNOOZED',
    DISMISSED: 'DISMISSED',
};
exports.EmergencyStatus = {
    ACTIVE: 'ACTIVE',
    ACKNOWLEDGED: 'ACKNOWLEDGED',
    RESOLVED: 'RESOLVED',
    CANCELLED: 'CANCELLED',
};
exports.FallStatus = {
    DETECTED: 'DETECTED',
    COUNTDOWN_ACTIVE: 'COUNTDOWN_ACTIVE',
    CONFIRMED_FALL: 'CONFIRMED_FALL',
    CANCELLED_FALSE_ALARM: 'CANCELLED_FALSE_ALARM',
};
exports.EmergencyType = {
    SOS: 'SOS',
    FALL: 'FALL',
    ABNORMAL_VITAL: 'ABNORMAL_VITAL',
    DEVICE_ALERT: 'DEVICE_ALERT',
};
exports.SeverityLevel = {
    INFO: 'INFO',
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    WARNING: 'WARNING',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
};
exports.MetricType = {
    HEART_RATE: 'HEART_RATE',
    SPO2: 'SPO2',
    SKIN_TEMPERATURE: 'SKIN_TEMPERATURE',
    RESPIRATORY_RATE: 'RESPIRATORY_RATE',
    BLOOD_PRESSURE_SYS: 'BLOOD_PRESSURE_SYS',
    BLOOD_PRESSURE_DIA: 'BLOOD_PRESSURE_DIA',
};
exports.RuleOperator = {
    GREATER_THAN: 'GREATER_THAN',
    LESS_THAN: 'LESS_THAN',
    EQUALS: 'EQUALS',
};
exports.MessageType = {
    TEXT: 'TEXT',
    ALERT: 'ALERT',
    VOICE: 'VOICE',
    IMAGE: 'IMAGE',
};
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
exports.UserRole = {
    ELDERLY: 'ELDERLY',
    CAREGIVER: 'CAREGIVER',
    DOCTOR: 'DOCTOR',
    ADMIN: 'ADMIN',
};
exports.HealthStatus = {
    STABLE: 'STABLE',
    WARNING: 'WARNING',
    CRITICAL: 'CRITICAL',
};
exports.MeasurementSource = {
    ECG_DERIVED_RESPIRATION: 'ECG_DERIVED_RESPIRATION',
    OPTICAL_PPG: 'OPTICAL_PPG',
    TMP117_SENSOR: 'TMP117_SENSOR',
    MANUAL_ENTRY: 'MANUAL_ENTRY',
    SIMULATED: 'SIMULATED',
};
exports.AppointmentStatus = {
    SCHEDULED: 'SCHEDULED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
};
