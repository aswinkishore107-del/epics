export type UserRole = 'ELDERLY' | 'CAREGIVER' | 'DOCTOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isActive?: boolean;
}

export interface EmergencyContact {
  id: string;
  patientId: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  priority: number;
  isPrimary: boolean;
  isActive: boolean;
}

export interface Device {
  id: string;
  deviceId: string;
  patientId?: string;
  deviceName: string;
  model: string;
  firmwareVersion: string;
  batteryLevel: number;
  chargingStatus: 'CHARGING' | 'DISCHARGING' | 'FULL' | 'UNKNOWN';
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'PAIRING';
  wifiStatus: 'CONNECTED' | 'DISCONNECTED';
  bluetoothStatus: 'CONNECTED' | 'DISCONNECTED';
  lastSeen: string;
  lastHeartbeat: string;
  isSimulated: boolean;
}

export interface HealthReading {
  id: string;
  patientId: string;
  heartRate: number;
  spo2: number;
  skinTemperature: number; // Strictly labeled Skin Temperature (TMP117)
  respiratoryRate: number; // ECG-Derived Respiration (EDR)
  systolicBP?: number;
  diastolicBP?: number;
  stressLevel?: number;
  status: 'STABLE' | 'WARNING' | 'CRITICAL';
  measurementSource: string;
  isSimulated: boolean;
  source: string;
  timestamp: string;
}

export interface EcgRecord {
  id: string;
  patientId: string;
  durationSeconds: number;
  sampleRate: number;
  dataPoints: number[];
  heartRate: number;
  signalQuality: string;
  status: string;
  isSimulated: boolean;
  rhythmInterpretation: string;
  timestamp: string;
}

export interface ActivityRecord {
  id: string;
  patientId: string;
  steps: number;
  caloriesBurned: number;
  activeMinutes: number;
  distanceMeters: number;
  sleepMinutes?: number;
  date: string;
}

export interface FallEvent {
  id: string;
  patientId: string;
  accelerationPeak: number;
  impactVelocity: number;
  postImpactRestDurationSeconds: number;
  confidenceScore: number;
  verified: boolean;
  status: 'DETECTED' | 'COUNTDOWN_ACTIVE' | 'CONFIRMED_FALL' | 'CANCELLED_FALSE_ALARM';
  timestamp: string;
}

export interface EmergencyEvent {
  id: string;
  patientId: string;
  type: 'SOS' | 'FALL' | 'ABNORMAL_VITAL' | 'DEVICE_ALERT';
  severity: 'LOW' | 'MEDIUM' | 'WARNING' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'CANCELLED';
  location?: string;
  source: string;
  resolvedByUserId?: string;
  resolvedAt?: string;
  notes?: string;
  timestamp: string;
  patient?: any;
}

export interface SafetyRule {
  id: string;
  metric: 'HEART_RATE' | 'SPO2' | 'SKIN_TEMPERATURE' | 'RESPIRATORY_RATE';
  operator: 'GREATER_THAN' | 'LESS_THAN' | 'EQUALS';
  threshold: number;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'WARNING' | 'HIGH' | 'CRITICAL';
  enabled: boolean;
  description: string;
  isDemoThreshold: boolean;
}

export interface Alert {
  id: string;
  patientId: string;
  title: string;
  message: string;
  type: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'WARNING' | 'HIGH' | 'CRITICAL';
  isRead: boolean;
  createdAt: string;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  form: string;
  frequency: string;
  instructions?: string;
  startDate: string;
  isActive: boolean;
  schedules: Array<{ scheduledTime: string }>;
  todayStatus?: 'UPCOMING' | 'TAKEN' | 'MISSED' | 'SKIPPED';
  takenAt?: string | null;
}

export interface Reminder {
  id: string;
  patientId: string;
  title: string;
  description?: string | null;
  category: 'MEDICATION' | 'ACTIVITY' | 'APPOINTMENT' | 'HYDRATION' | 'GENERAL';
  scheduledTime: string;
  isRecurring?: boolean;
  recurrencePattern?: string | null;
  status: 'PENDING' | 'COMPLETED' | 'SNOOZED' | 'DISMISSED';
  snoozedUntil?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface WellnessResponse {
  id: string;
  patientId: string;
  sleepHours: number;
  sleepQuality: string;
  dietRating: string;
  stressLevel: string;
  alcoholIntake: string;
  tobaccoUse: string;
  weightKg: number;
  heightCm: number;
  bmi: number;
  notes?: string;
  recordedDate: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'TEXT' | 'ALERT' | 'VOICE' | 'IMAGE';
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    avatarUrl?: string;
  };
}

export interface Conversation {
  id: string;
  title?: string;
  isGroup: boolean;
  updatedAt: string;
  participants: Array<{
    id: string;
    userId: string;
    role: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      role: UserRole;
      avatarUrl?: string;
    };
  }>;
  messages: Message[];
}

export interface DoctorNote {
  id: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  treatmentPlan: string;
  clinicalNotes: string;
  isConfidential: boolean;
  createdAt: string;
  doctor?: {
    user: { firstName: string; lastName: string; email: string };
  };
}

export interface HealthReport {
  id: string;
  patientId: string;
  doctorId?: string;
  reportType: string;
  summary: string;
  metricsJson: any;
  pdfUrl?: string;
  generatedAt: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  title: string;
  content: string;
  category: string;
  likesCount: number;
  commentsCount: number;
  isPinned: boolean;
  createdAt: string;
  hasLiked?: boolean;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    avatarUrl?: string;
  };
  comments?: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: {
      firstName: string;
      lastName: string;
      role: UserRole;
    };
  }>;
}
