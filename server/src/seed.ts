import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, UserRole, Gender, ConnectionStatus, ChargingStatus, HealthStatus, MeasurementSource, SeverityLevel, MetricType, RuleOperator, EmergencyType, EmergencyStatus, MedicationStatus, ReminderCategory, ReminderStatus, AppointmentStatus, NotificationType, MessageType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Synthetic ECG Waveform generator: 300 data points simulating clean Sinus Rhythm with P-Q-R-S-T complexes
function generateSyntheticECG(pointsCount = 300): number[] {
  const points: number[] = [];
  const beatPeriod = 30; // 30 samples per beat -> ~10 beats in 300 samples
  for (let i = 0; i < pointsCount; i++) {
    const phase = i % beatPeriod;
    let val = 0;
    if (phase < 5) {
      val = 0; // Baseline
    } else if (phase < 9) {
      val = Math.sin(((phase - 5) / 4) * Math.PI) * 0.15; // P-wave
    } else if (phase < 12) {
      val = 0; // PR segment
    } else if (phase === 12) {
      val = -0.15; // Q-wave
    } else if (phase === 13) {
      val = 1.25; // R-peak
    } else if (phase === 14) {
      val = -0.35; // S-wave
    } else if (phase < 17) {
      val = 0; // ST segment
    } else if (phase < 23) {
      val = Math.sin(((phase - 17) / 6) * Math.PI) * 0.35; // T-wave
    } else {
      val = 0; // TP segment baseline
    }
    // Add tiny realistic sensor noise
    const noise = (Math.random() - 0.5) * 0.02;
    points.push(parseFloat((val + noise).toFixed(3)));
  }
  return points;
}

async function main() {
  console.log('🌱 Starting VIORA Database Seeding...');

  // 1. Clear existing records in reverse dependency order
  await prisma.auditLog.deleteMany({});
  await prisma.communityLike.deleteMany({});
  await prisma.communityComment.deleteMany({});
  await prisma.communityPost.deleteMany({});
  await prisma.aiMessage.deleteMany({});
  await prisma.aiConversation.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversationParticipant.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.doctorNote.deleteMany({});
  await prisma.healthReport.deleteMany({});
  await prisma.wellnessResponse.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.reminder.deleteMany({});
  await prisma.medicationLog.deleteMany({});
  await prisma.medicationSchedule.deleteMany({});
  await prisma.medication.deleteMany({});
  await prisma.alert.deleteMany({});
  await prisma.safetyRule.deleteMany({});
  await prisma.emergencyEvent.deleteMany({});
  await prisma.fallEvent.deleteMany({});
  await prisma.activityRecord.deleteMany({});
  await prisma.respiratoryReading.deleteMany({});
  await prisma.ecgRecord.deleteMany({});
  await prisma.healthReading.deleteMany({});
  await prisma.deviceReading.deleteMany({});
  await prisma.device.deleteMany({});
  await prisma.emergencyContact.deleteMany({});
  await prisma.patientRelationship.deleteMany({});
  await prisma.elderlyProfile.deleteMany({});
  await prisma.caregiverProfile.deleteMany({});
  await prisma.doctorProfile.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('✓ Cleaned existing tables');

  const passwordHash = await bcrypt.hash('VioraDemo123!', 10);

  // 2. Create Users
  // User 1: Elderly - Rajesh Kumar
  const elderlyUser = await prisma.user.create({
    data: {
      email: 'elderly@viora.demo',
      passwordHash,
      role: UserRole.ELDERLY,
      firstName: 'Rajesh',
      lastName: 'Kumar',
      phone: '+91 98765 12345',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    },
  });

  // User 2: Caregiver - Priya Kumar (Daughter)
  const caregiverUser = await prisma.user.create({
    data: {
      email: 'caregiver@viora.demo',
      passwordHash,
      role: UserRole.CAREGIVER,
      firstName: 'Priya',
      lastName: 'Kumar',
      phone: '+91 98765 43210',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
  });

  // User 3: Doctor - Dr. Arvind Sharma
  const doctorUser = await prisma.user.create({
    data: {
      email: 'doctor@viora.demo',
      passwordHash,
      role: UserRole.DOCTOR,
      firstName: 'Dr. Arvind',
      lastName: 'Sharma',
      phone: '+91 98112 34567',
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    },
  });

  // User 4: Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@viora.demo',
      passwordHash,
      role: UserRole.ADMIN,
      firstName: 'System',
      lastName: 'Admin',
      phone: '+91 99999 00000',
    },
  });

  console.log('✓ Created Core Users (Elderly, Caregiver, Doctor, Admin)');

  // 3. Profiles
  const elderlyProfile = await prisma.elderlyProfile.create({
    data: {
      userId: elderlyUser.id,
      dateOfBirth: new Date('1954-06-15'),
      gender: Gender.MALE,
      bloodGroup: 'B+',
      emergencyNotes: 'Mild Hypertension under Lisinopril control. No known food allergies; allergic to penicillin.',
      address: 'Flat 402, Shanti Vihar Apartments, 12th Main, Indiranagar, Bangalore, Karnataka - 560038',
      deviceId: 'VIORA-NECK-7291',
    },
  });

  const caregiverProfile = await prisma.caregiverProfile.create({
    data: {
      userId: caregiverUser.id,
      relationshipToElderly: 'Daughter & Primary Caregiver',
      organization: 'Family Caregiver',
      emergencyPhone: '+91 98765 43210',
    },
  });

  const doctorProfile = await prisma.doctorProfile.create({
    data: {
      userId: doctorUser.id,
      specialization: 'Cardiologist & Geriatric Medicine Specialist',
      licenseNumber: 'MCI-KA-482910',
      hospital: 'Fortis Healthcare & Geriatric Care Institute',
      contactPhone: '+91 98112 34567',
    },
  });

  // Link profiles back
  await prisma.elderlyProfile.update({
    where: { id: elderlyProfile.id },
    data: {
      primaryCaregiverId: caregiverProfile.id,
      primaryDoctorId: doctorProfile.id,
    },
  });

  // 4. Patient Relationships (RBAC Access Boundary)
  await prisma.patientRelationship.create({
    data: {
      patientId: elderlyProfile.id,
      caregiverId: caregiverProfile.id,
      relationshipType: 'DAUGHTER_PRIMARY_CAREGIVER',
      isPrimary: true,
      status: 'ACTIVE',
    },
  });

  await prisma.patientRelationship.create({
    data: {
      patientId: elderlyProfile.id,
      doctorId: doctorProfile.id,
      relationshipType: 'ATTENDING_CARDIOLOGIST',
      isPrimary: true,
      status: 'ACTIVE',
    },
  });

  console.log('✓ Created Patient Profiles and Authorized Relationships');

  // 5. Emergency Contacts with Priority Escalation
  await prisma.emergencyContact.createMany({
    data: [
      {
        patientId: elderlyProfile.id,
        name: 'Priya Kumar',
        relationship: 'Daughter (Primary Caregiver)',
        phone: '+91 98765 43210',
        email: 'caregiver@viora.demo',
        priority: 1,
        isPrimary: true,
        isActive: true,
      },
      {
        patientId: elderlyProfile.id,
        name: 'Amit Kumar',
        relationship: 'Son (Secondary Family)',
        phone: '+91 98765 43211',
        email: 'amit.kumar@family.demo',
        priority: 2,
        isPrimary: false,
        isActive: true,
      },
      {
        patientId: elderlyProfile.id,
        name: 'Dr. Arvind Sharma',
        relationship: 'Attending Cardiologist',
        phone: '+91 98112 34567',
        email: 'doctor@viora.demo',
        priority: 3,
        isPrimary: false,
        isActive: true,
      },
    ],
  });

  console.log('✓ Created Priority Escalation Emergency Contacts');

  // 6. Device Abstraction: VIORA Smart Neckband
  const device = await prisma.device.create({
    data: {
      deviceId: 'VIORA-NECK-7291',
      patientId: elderlyProfile.id,
      deviceName: 'VIORA Smart Neckband v2.4',
      model: 'ESP32-WROOM-32E',
      macAddress: 'A4:CF:12:89:BC:4E',
      firmwareVersion: '2.4.1',
      batteryLevel: 88,
      chargingStatus: ChargingStatus.DISCHARGING,
      connectionStatus: ConnectionStatus.CONNECTED,
      wifiStatus: ConnectionStatus.CONNECTED,
      bluetoothStatus: ConnectionStatus.CONNECTED,
      isSimulated: true,
    },
  });

  // 7. Configurable Safety Rules (Clearly labeled: Demo threshold — not a medical diagnosis)
  await prisma.safetyRule.createMany({
    data: [
      {
        metric: MetricType.HEART_RATE,
        operator: RuleOperator.GREATER_THAN,
        threshold: 120,
        severity: SeverityLevel.WARNING,
        enabled: true,
        description: 'Tachycardia alert threshold (Demo safety threshold — not a medical diagnosis)',
        isDemoThreshold: true,
      },
      {
        metric: MetricType.HEART_RATE,
        operator: RuleOperator.LESS_THAN,
        threshold: 50,
        severity: SeverityLevel.WARNING,
        enabled: true,
        description: 'Bradycardia alert threshold (Demo safety threshold — not a medical diagnosis)',
        isDemoThreshold: true,
      },
      {
        metric: MetricType.SPO2,
        operator: RuleOperator.LESS_THAN,
        threshold: 95,
        severity: SeverityLevel.WARNING,
        enabled: true,
        description: 'Oxygen saturation warning threshold (Demo safety threshold — not a medical diagnosis)',
        isDemoThreshold: true,
      },
      {
        metric: MetricType.SPO2,
        operator: RuleOperator.LESS_THAN,
        threshold: 90,
        severity: SeverityLevel.CRITICAL,
        enabled: true,
        description: 'Critical hypoxemia alert threshold (Demo safety threshold — not a medical diagnosis)',
        isDemoThreshold: true,
      },
      {
        metric: MetricType.SKIN_TEMPERATURE,
        operator: RuleOperator.GREATER_THAN,
        threshold: 37.8,
        severity: SeverityLevel.WARNING,
        enabled: true,
        description: 'Elevated skin temperature alert (TMP117 sensor, demo safety threshold — not a medical diagnosis)',
        isDemoThreshold: true,
      },
      {
        metric: MetricType.RESPIRATORY_RATE,
        operator: RuleOperator.GREATER_THAN,
        threshold: 22,
        severity: SeverityLevel.WARNING,
        enabled: true,
        description: 'Elevated respiratory rate alert (ECG-Derived Respiration, demo safety threshold — not a medical diagnosis)',
        isDemoThreshold: true,
      },
      {
        metric: MetricType.RESPIRATORY_RATE,
        operator: RuleOperator.LESS_THAN,
        threshold: 10,
        severity: SeverityLevel.WARNING,
        enabled: true,
        description: 'Depressed respiratory rate alert (ECG-Derived Respiration, demo safety threshold — not a medical diagnosis)',
        isDemoThreshold: true,
      },
    ],
  });

  console.log('✓ Created Configurable Safety Rules with Non-diagnostic Disclaimers');

  // 8. Health Readings: Current baseline + 24-hour historical records
  const now = new Date();
  const historicalReadings = [];

  // Generate 24 hours of readings (one per hour)
  for (let i = 24; i >= 1; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    // Slight realistic sinusoidal diurnal variations
    const hr = 74 + Math.round(Math.sin(i / 3) * 6 + (Math.random() * 4 - 2));
    const spo2 = 97 + Math.round(Math.random() * 2 - 1);
    const skinTemp = parseFloat((36.4 + Math.sin(i / 4) * 0.3 + (Math.random() * 0.2 - 0.1)).toFixed(1));
    const respRate = 16 + Math.round(Math.sin(i / 2) * 2);

    historicalReadings.push({
      patientId: elderlyProfile.id,
      heartRate: hr,
      spo2: Math.min(100, Math.max(94, spo2)),
      skinTemperature: skinTemp, // Strictly labeled Skin Temperature (TMP117)
      respiratoryRate: respRate, // ECG-Derived Respiration (EDR)
      systolicBP: 120 + Math.round(Math.random() * 8),
      diastolicBP: 78 + Math.round(Math.random() * 5),
      stressLevel: 12 + Math.round(Math.random() * 10),
      status: HealthStatus.STABLE,
      measurementSource: MeasurementSource.ECG_DERIVED_RESPIRATION,
      isSimulated: true,
      source: 'VIORA_NECKBAND_SIMULATOR',
      timestamp,
    });
  }

  // Current reading matching specification: HR 78, SpO2 97%, Skin Temp 36.5°C, Respiration 16/min
  historicalReadings.push({
    patientId: elderlyProfile.id,
    heartRate: 78,
    spo2: 97,
    skinTemperature: 36.5,
    respiratoryRate: 16,
    systolicBP: 122,
    diastolicBP: 80,
    stressLevel: 14,
    status: HealthStatus.STABLE,
    measurementSource: MeasurementSource.ECG_DERIVED_RESPIRATION,
    isSimulated: true,
    source: 'VIORA_NECKBAND_SIMULATOR',
    timestamp: now,
  });

  await prisma.healthReading.createMany({
    data: historicalReadings,
  });

  // 9. ECG Record
  const syntheticPoints = generateSyntheticECG(300);
  await prisma.ecgRecord.create({
    data: {
      patientId: elderlyProfile.id,
      durationSeconds: 30,
      sampleRate: 250,
      dataPoints: syntheticPoints,
      heartRate: 78,
      signalQuality: 'EXCELLENT',
      status: 'NORMAL_SINUS_RHYTHM',
      isSimulated: true,
      rhythmInterpretation: 'Normal Sinus Rhythm. Signal Quality: 98%. ECG-Derived Respiration (EDR): 16 breaths/min. No acute ischemic ST-segment shifts or premature ventricular contractions detected.',
      timestamp: now,
    },
  });

  // 10. Respiratory Reading Record
  await prisma.respiratoryReading.create({
    data: {
      patientId: elderlyProfile.id,
      rate: 16,
      depth: 'NORMAL',
      method: MeasurementSource.ECG_DERIVED_RESPIRATION,
      isSimulated: true,
      timestamp: now,
    },
  });

  // 11. Activity Record: 4,250 steps today
  await prisma.activityRecord.create({
    data: {
      patientId: elderlyProfile.id,
      steps: 4250,
      caloriesBurned: 185.5,
      activeMinutes: 42,
      distanceMeters: 3120,
      sleepMinutes: 450,
      date: now,
    },
  });

  console.log('✓ Created Health Readings, ECG Record (EDR), and Activity Data');

  // 12. Medications & Schedules
  const med1 = await prisma.medication.create({
    data: {
      patientId: elderlyProfile.id,
      name: 'Lisinopril',
      dosage: '10mg',
      form: 'TABLET',
      frequency: 'ONCE_DAILY',
      instructions: 'Take 1 tablet every morning with water after breakfast for blood pressure control.',
      startDate: new Date('2024-01-01'),
      isActive: true,
      schedules: {
        create: [
          { scheduledTime: '08:00', daysOfWeek: 'DAILY', dosage: '10mg' },
        ],
      },
    },
  });

  const med2 = await prisma.medication.create({
    data: {
      patientId: elderlyProfile.id,
      name: 'Metformin',
      dosage: '500mg',
      form: 'TABLET',
      frequency: 'TWICE_DAILY',
      instructions: 'Take 1 tablet after meals (morning and evening) with a glass of water.',
      startDate: new Date('2024-01-01'),
      isActive: true,
      schedules: {
        create: [
          { scheduledTime: '08:00', daysOfWeek: 'DAILY', dosage: '500mg' },
          { scheduledTime: '20:00', daysOfWeek: 'DAILY', dosage: '500mg' },
        ],
      },
    },
  });

  const med3 = await prisma.medication.create({
    data: {
      patientId: elderlyProfile.id,
      name: 'Atorvastatin',
      dosage: '20mg',
      form: 'TABLET',
      frequency: 'ONCE_DAILY',
      instructions: 'Take 1 tablet at bedtime for lipid and cholesterol management.',
      startDate: new Date('2024-01-01'),
      isActive: true,
      schedules: {
        create: [
          { scheduledTime: '21:00', daysOfWeek: 'DAILY', dosage: '20mg' },
        ],
      },
    },
  });

  const med4 = await prisma.medication.create({
    data: {
      patientId: elderlyProfile.id,
      name: 'Calcium + Vitamin D3',
      dosage: '500mg / 400IU',
      form: 'CAPSULE',
      frequency: 'ONCE_DAILY',
      instructions: 'Take 1 capsule with midday lunch for bone health and wellness.',
      startDate: new Date('2024-02-01'),
      isActive: true,
      schedules: {
        create: [
          { scheduledTime: '13:00', daysOfWeek: 'DAILY', dosage: '1 capsule' },
        ],
      },
    },
  });

  // Morning dose logs marked TAKEN today
  const morningToday = new Date(now);
  morningToday.setHours(8, 5, 0, 0);

  await prisma.medicationLog.createMany({
    data: [
      {
        medicationId: med1.id,
        patientId: elderlyProfile.id,
        scheduledFor: morningToday,
        takenAt: morningToday,
        status: MedicationStatus.TAKEN,
        loggedBy: 'PATIENT',
        notes: 'Taken on schedule with breakfast',
      },
      {
        medicationId: med2.id,
        patientId: elderlyProfile.id,
        scheduledFor: morningToday,
        takenAt: morningToday,
        status: MedicationStatus.TAKEN,
        loggedBy: 'PATIENT',
        notes: 'Taken on schedule',
      },
    ],
  });

  console.log('✓ Created Medications, Schedules, and Taken Logs');

  // 13. Reminders
  await prisma.reminder.createMany({
    data: [
      {
        patientId: elderlyProfile.id,
        title: 'Morning Blood Pressure & Vitals Sync',
        description: 'Put on VIORA neckband and verify skin temperature and resting heart rate.',
        category: ReminderCategory.GENERAL,
        scheduledTime: morningToday,
        status: ReminderStatus.COMPLETED,
      },
      {
        patientId: elderlyProfile.id,
        title: 'Gentle Afternoon Garden Walk',
        description: 'Take a relaxing 20-minute stroll in the shaded courtyard. Aim for 1,000 steps.',
        category: ReminderCategory.ACTIVITY,
        scheduledTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        status: ReminderStatus.PENDING,
      },
      {
        patientId: elderlyProfile.id,
        title: 'Evening Hydration & Medication',
        description: 'Drink a glass of warm water and take evening Metformin and Atorvastatin.',
        category: ReminderCategory.MEDICATION,
        scheduledTime: new Date(now.getTime() + 6 * 60 * 60 * 1000),
        status: ReminderStatus.PENDING,
      },
    ],
  });

  // 14. Wellness Response
  await prisma.wellnessResponse.create({
    data: {
      patientId: elderlyProfile.id,
      sleepHours: 7.5,
      sleepQuality: 'RESTFUL',
      dietRating: 'BALANCED',
      stressLevel: 'LOW',
      alcoholIntake: 'NONE',
      tobaccoUse: 'NONE',
      weightKg: 68.0,
      heightCm: 172.0,
      bmi: 23.0,
      notes: 'Woke up feeling energetic. No joint stiffness or dizziness reported.',
      recordedDate: now,
    },
  });

  // 15. Telehealth Appointment
  const nextFriday = new Date();
  nextFriday.setDate(nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7 || 7));
  nextFriday.setHours(10, 30, 0, 0);

  await prisma.appointment.create({
    data: {
      patientId: elderlyProfile.id,
      doctorId: doctorProfile.id,
      title: 'Routine Monthly Cardiology & Telehealth Consultation',
      appointmentDate: nextFriday,
      location: 'VIORA Secure Telehealth Room',
      notes: 'Review 30-day ECG trend, EDR respiratory stability, and Lisinopril medication tolerance.',
      status: AppointmentStatus.SCHEDULED,
    },
  });

  // 16. Doctor Clinical Note
  await prisma.doctorNote.create({
    data: {
      patientId: elderlyProfile.id,
      doctorId: doctorProfile.id,
      diagnosis: 'Essential Hypertension (Well-Controlled, Stage 1 History)',
      treatmentPlan: 'Continue Lisinopril 10mg PO daily. Maintain hydration and 30-min daily walks. Follow up in 4 weeks.',
      clinicalNotes: 'Patient Rajesh Kumar demonstrates excellent compliance (>95% adherence). Real-time telemetry shows resting heart rate 78 BPM, SpO2 97%, and skin temperature measured via TMP117 steady at 36.5°C. ECG-Derived Respiration (EDR) verifies normal respiratory rate of 16 breaths/min. No orthostatic symptoms or peripheral edema noted.',
      isConfidential: false,
    },
  });

  // 17. Three-Way Real-time Conversations
  // Conversation 1: Elderly Rajesh <-> Caregiver Priya
  const conv1 = await prisma.conversation.create({
    data: {
      title: 'Rajesh & Priya (Family Care)',
      isGroup: false,
      participants: {
        create: [
          { userId: elderlyUser.id, role: 'PATIENT' },
          { userId: caregiverUser.id, role: 'CAREGIVER' },
        ],
      },
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv1.id,
        senderId: caregiverUser.id,
        content: 'Good morning Dad! How did you sleep last night? Neckband shows your vitals are looking great!',
        messageType: MessageType.TEXT,
        deliveredAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        readAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      },
      {
        conversationId: conv1.id,
        senderId: elderlyUser.id,
        content: 'Good morning Priya! Slept soundly for 7.5 hours. Already took my morning medicine and had breakfast.',
        messageType: MessageType.TEXT,
        deliveredAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        readAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        conversationId: conv1.id,
        senderId: caregiverUser.id,
        content: 'Wonderful! Remember to take your garden walk this evening when the sun goes down.',
        messageType: MessageType.TEXT,
        deliveredAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        readAt: new Date(now.getTime() - 30 * 60 * 1000),
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      },
    ],
  });

  // Conversation 2: Elderly Rajesh <-> Doctor Dr. Arvind Sharma
  const conv2 = await prisma.conversation.create({
    data: {
      title: 'Rajesh & Dr. Arvind Sharma (Clinical)',
      isGroup: false,
      participants: {
        create: [
          { userId: elderlyUser.id, role: 'PATIENT' },
          { userId: doctorUser.id, role: 'DOCTOR' },
        ],
      },
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv2.id,
        senderId: doctorUser.id,
        content: 'Hello Rajesh ji, reviewing your 24-hour continuous telemetry. ECG waveform and ECG-derived respiration are very stable. Keep up the good routine!',
        messageType: MessageType.TEXT,
        deliveredAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        readAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      },
      {
        conversationId: conv2.id,
        senderId: elderlyUser.id,
        content: 'Thank you Doctor! Feeling energetic and cheerful today.',
        messageType: MessageType.TEXT,
        deliveredAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        readAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      },
    ],
  });

  // Conversation 3: Caregiver Priya <-> Doctor Dr. Arvind Sharma
  const conv3 = await prisma.conversation.create({
    data: {
      title: 'Priya & Dr. Sharma (Care Coordination)',
      isGroup: false,
      participants: {
        create: [
          { userId: caregiverUser.id, role: 'CAREGIVER' },
          { userId: doctorUser.id, role: 'DOCTOR' },
        ],
      },
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv3.id,
        senderId: caregiverUser.id,
        content: 'Hello Dr. Sharma, thank you for checking Dad’s vitals. His morning adherence has been 100% this week.',
        messageType: MessageType.TEXT,
        deliveredAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
        readAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      },
      {
        conversationId: conv3.id,
        senderId: doctorUser.id,
        content: 'Excellent progress Priya. We will go over his 30-day comprehensive assessment during our Friday telehealth call.',
        messageType: MessageType.TEXT,
        deliveredAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        readAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      },
    ],
  });

  // 18. Community Posts
  const post1 = await prisma.communityPost.create({
    data: {
      authorId: doctorUser.id,
      title: '5 Gentle Morning Stretches for Neck and Shoulder Comfort',
      content: 'Regular gentle rotation and mild stretching improve blood flow and keep neck muscles supple while wearing your VIORA neckband. Try 5 repetitions every morning before your tea!',
      category: 'HEALTH_TIPS',
      likesCount: 14,
      commentsCount: 2,
      isPinned: true,
    },
  });

  await prisma.communityComment.create({
    data: {
      postId: post1.id,
      authorId: elderlyUser.id,
      content: 'Tried these this morning doctor, feeling much looser and relaxed.',
    },
  });

  const post2 = await prisma.communityPost.create({
    data: {
      authorId: elderlyUser.id,
      title: 'Hit 4,250 steps today in the community garden! 🌿',
      content: 'The weather in Bangalore was pleasant today. Walked with my neighbor Mr. Nair. The VIORA neckband is so light I barely noticed it.',
      category: 'DAILY_WINS',
      likesCount: 9,
      commentsCount: 1,
    },
  });

  await prisma.communityComment.create({
    data: {
      postId: post2.id,
      authorId: caregiverUser.id,
      content: 'So proud of you Dad! Keep it up!',
    },
  });

  // 19. Sample Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: elderlyUser.id,
        title: 'Medication Taken',
        message: 'Lisinopril 10mg and Metformin 500mg logged successfully.',
        type: NotificationType.MEDICATION,
        isRead: true,
      },
      {
        userId: caregiverUser.id,
        title: 'Morning Vitals Stable',
        message: 'Rajesh Kumar’s vitals: HR 78 BPM, SpO2 97%, Skin Temp 36.5°C, Respiration 16/min.',
        type: NotificationType.HEALTH_UPDATE,
        isRead: false,
      },
      {
        userId: doctorUser.id,
        title: 'Telehealth Appointment Upcoming',
        message: 'Routine cardiology follow-up with Rajesh Kumar scheduled for Friday 10:30 AM.',
        type: NotificationType.APPOINTMENT,
        isRead: false,
      },
    ],
  });

  console.log('✓ Created Three-Way Messages, Community Posts, and Notifications');
  console.log('🎉 VIORA Database Seeding Complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
