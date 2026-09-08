export const MedicationStatus = {
  UPCOMING: 'UPCOMING',
  TAKEN: 'TAKEN',
  MISSED: 'MISSED',
  SKIPPED: 'SKIPPED',
} as const;
export type MedicationStatus = (typeof MedicationStatus)[keyof typeof MedicationStatus];

export const ReminderCategory = {
  MEDICATION: 'MEDICATION',
  ACTIVITY: 'ACTIVITY',
  APPOINTMENT: 'APPOINTMENT',
  HYDRATION: 'HYDRATION',
  GENERAL: 'GENERAL',
} as const;
export type ReminderCategory = (typeof ReminderCategory)[keyof typeof ReminderCategory];

export const ReminderStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  SNOOZED: 'SNOOZED',
  DISMISSED: 'DISMISSED',
} as const;
export type ReminderStatus = (typeof ReminderStatus)[keyof typeof ReminderStatus];

export const EmergencyStatus = {
  ACTIVE: 'ACTIVE',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  RESOLVED: 'RESOLVED',
  CANCELLED: 'CANCELLED',
} as const;
export type EmergencyStatus = (typeof EmergencyStatus)[keyof typeof EmergencyStatus];

export const FallStatus = {
  DETECTED: 'DETECTED',
  COUNTDOWN_ACTIVE: 'COUNTDOWN_ACTIVE',
  CONFIRMED_FALL: 'CONFIRMED_FALL',
  CANCELLED_FALSE_ALARM: 'CANCELLED_FALSE_ALARM',
} as const;
export type FallStatus = (typeof FallStatus)[keyof typeof FallStatus];

export const EmergencyType = {
  SOS: 'SOS',
  FALL: 'FALL',
  ABNORMAL_VITAL: 'ABNORMAL_VITAL',
  DEVICE_ALERT: 'DEVICE_ALERT',
} as const;
export type EmergencyType = (typeof EmergencyType)[keyof typeof EmergencyType];

export const SeverityLevel = {
  INFO: 'INFO',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  WARNING: 'WARNING',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type SeverityLevel = (typeof SeverityLevel)[keyof typeof SeverityLevel];

export const MetricType = {
  HEART_RATE: 'HEART_RATE',
  SPO2: 'SPO2',
  SKIN_TEMPERATURE: 'SKIN_TEMPERATURE',
  RESPIRATORY_RATE: 'RESPIRATORY_RATE',
  BLOOD_PRESSURE_SYS: 'BLOOD_PRESSURE_SYS',
  BLOOD_PRESSURE_DIA: 'BLOOD_PRESSURE_DIA',
} as const;
export type MetricType = (typeof MetricType)[keyof typeof MetricType];

export const RuleOperator = {
  GREATER_THAN: 'GREATER_THAN',
  LESS_THAN: 'LESS_THAN',
  EQUALS: 'EQUALS',
} as const;
export type RuleOperator = (typeof RuleOperator)[keyof typeof RuleOperator];

export const MessageType = {
  TEXT: 'TEXT',
  ALERT: 'ALERT',
  VOICE: 'VOICE',
  IMAGE: 'IMAGE',
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

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

export const UserRole = {
  ELDERLY: 'ELDERLY',
  CAREGIVER: 'CAREGIVER',
  DOCTOR: 'DOCTOR',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const HealthStatus = {
  STABLE: 'STABLE',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
} as const;
export type HealthStatus = (typeof HealthStatus)[keyof typeof HealthStatus];

export const MeasurementSource = {
  ECG_DERIVED_RESPIRATION: 'ECG_DERIVED_RESPIRATION',
  OPTICAL_PPG: 'OPTICAL_PPG',
  TMP117_SENSOR: 'TMP117_SENSOR',
  MANUAL_ENTRY: 'MANUAL_ENTRY',
  SIMULATED: 'SIMULATED',
} as const;
export type MeasurementSource = (typeof MeasurementSource)[keyof typeof MeasurementSource];

export const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];
