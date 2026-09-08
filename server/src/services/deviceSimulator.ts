import { prisma } from '../prisma.js';
import {
  HealthStatus,
  MeasurementSource,
  EmergencyType,
  SeverityLevel,
  EmergencyStatus,
  FallStatus,
  MedicationStatus,
  ConnectionStatus,
  ChargingStatus,
} from '@prisma/client';
import { socketService } from './socketService.js';
import { safetyRuleEngine } from './safetyRuleEngine.js';
import { notificationService } from './notificationService.js';

export interface IDeviceProvider {
  getDeviceStatus(deviceId: string): Promise<any>;
  sendMediaCommand(deviceId: string, command: string, payload?: any): Promise<any>;
  sendCallCommand(deviceId: string, action: string, contact?: any): Promise<any>;
  generateReading(patientId: string): Promise<any>;
}

export class SimulatorDeviceProvider implements IDeviceProvider {
  private intervalId: NodeJS.Timeout | null = null;
  private isSimulating = false;
  private currentBattery = 88;
  private chargingStatus: ChargingStatus = ChargingStatus.DISCHARGING;

  public async getDeviceStatus(deviceId: string) {
    return await prisma.device.findUnique({
      where: { deviceId },
    });
  }

  public async sendMediaCommand(deviceId: string, command: string, payload?: any) {
    // Media command executed on neckband speaker abstraction
    console.log(`[Neckband Audio Abstraction] Executing ${command} on device ${deviceId}:`, payload);
    return { success: true, command, payload, timestamp: new Date() };
  }

  public async sendCallCommand(deviceId: string, action: string, contact?: any) {
    // Phone call simulation abstraction
    console.log(`[Neckband Phone Abstraction] Executing call action ${action} on device ${deviceId}:`, contact);
    return { success: true, action, contact, timestamp: new Date() };
  }

  public startSimulation(patientId: string, intervalSeconds = 10) {
    if (this.isSimulating) return;
    this.isSimulating = true;
    console.log(`▶ Device Simulator started for patient: ${patientId}`);

    this.intervalId = setInterval(async () => {
      try {
        await this.generateReading(patientId);
        await this.tickBatteryAndHeartbeat(patientId);
      } catch (err) {
        console.error('Error in simulation cycle:', err);
      }
    }, intervalSeconds * 1000);
  }

  public stopSimulation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isSimulating = false;
    console.log('⏹ Device Simulator stopped');
  }

  public getSimulationStatus() {
    return { isSimulating: this.isSimulating, battery: this.currentBattery };
  }

  private async tickBatteryAndHeartbeat(patientId: string) {
    const device = await prisma.device.findFirst({
      where: { patientId },
    });
    if (!device) return;

    // Slowly discharge battery or charge if charging
    if (this.chargingStatus === ChargingStatus.DISCHARGING) {
      this.currentBattery = Math.max(5, this.currentBattery - 0.1);
    } else {
      this.currentBattery = Math.min(100, this.currentBattery + 0.5);
    }

    const updatedDevice = await prisma.device.update({
      where: { id: device.id },
      data: {
        batteryLevel: Math.round(this.currentBattery),
        chargingStatus: this.chargingStatus,
        lastHeartbeat: new Date(),
        lastSeen: new Date(),
      },
    });

    socketService.emitToPatientRoom(patientId, 'device_status_updated', updatedDevice);
    socketService.emitToPatientRoom(patientId, 'battery_updated', {
      patientId,
      batteryLevel: Math.round(this.currentBattery),
      chargingStatus: this.chargingStatus,
    });
  }

  public async generateReading(patientId: string) {
    // Generate realistic normal telemetry with subtle physiological variations
    const hr = 76 + Math.round(Math.random() * 6 - 3); // 73 - 79 BPM
    const spo2 = 97 + Math.round(Math.random() * 2 - 1); // 96 - 98 %
    const skinTemp = parseFloat((36.5 + (Math.random() * 0.4 - 0.2)).toFixed(1)); // 36.3 - 36.7 °C (TMP117)
    const respRate = 16 + Math.round(Math.random() * 2 - 1); // 15 - 17 /min (ECG-Derived Respiration)

    const reading = await prisma.healthReading.create({
      data: {
        patientId,
        heartRate: hr,
        spo2: Math.min(100, Math.max(90, spo2)),
        skinTemperature: skinTemp, // Strictly labeled Skin Temperature (TMP117)
        respiratoryRate: respRate, // Formally ECG-Derived Respiration (EDR)
        systolicBP: 122 + Math.round(Math.random() * 4 - 2),
        diastolicBP: 80 + Math.round(Math.random() * 3 - 1),
        stressLevel: 14 + Math.round(Math.random() * 4 - 2),
        status: HealthStatus.STABLE,
        measurementSource: MeasurementSource.ECG_DERIVED_RESPIRATION,
        isSimulated: true,
        source: 'VIORA_NECKBAND_SIMULATOR',
        timestamp: new Date(),
      },
    });

    // Broadcast vital update to all connected dashboards in real time
    socketService.emitToPatientRoom(patientId, 'vital_updated', {
      reading,
      patientId,
    });

    // Evaluate through SafetyRuleEngine
    await safetyRuleEngine.evaluateReading(reading);

    return reading;
  }

  // Trigger Manual SOS button simulation
  public async triggerSOS(patientId: string, location = 'Living Room, Home') {
    const emergency = await prisma.emergencyEvent.create({
      data: {
        patientId,
        type: EmergencyType.SOS,
        severity: SeverityLevel.CRITICAL,
        status: EmergencyStatus.ACTIVE,
        location,
        source: 'SIMULATED_MANUAL_SOS_BUTTON',
        notes: 'Elderly activated emergency SOS on VIORA device / dashboard.',
      },
    });

    socketService.emitToPatientRoom(patientId, 'emergency_created', {
      emergency,
      patientId,
    });

    await notificationService.notifyPatientTeam(patientId, {
      title: '🚨 EMERGENCY SOS TRIGGERED!',
      message: `Elderly patient Rajesh Kumar triggered manual SOS from ${location}. Immediate assistance required.`,
      type: 'SOS',
    });

    return emergency;
  }

  // Trigger Fall Detection Pipeline (MPU6050 Acceleration Breach -> 15s Verification Countdown)
  public async triggerFall(patientId: string) {
    const fall = await prisma.fallEvent.create({
      data: {
        patientId,
        accelerationPeak: 4.2,
        impactVelocity: 2.8,
        postImpactRestDurationSeconds: 15,
        confidenceScore: 0.94,
        verified: false,
        status: FallStatus.COUNTDOWN_ACTIVE,
        timestamp: new Date(),
      },
    });

    socketService.emitToPatientRoom(patientId, 'fall_detected', {
      fall,
      countdownSeconds: 15,
      patientId,
    });

    // Start 15s post-event verification timer: if not cancelled by patient, auto-escalate to Critical Emergency
    setTimeout(async () => {
      try {
        const currentFall = await prisma.fallEvent.findUnique({
          where: { id: fall.id },
        });

        if (currentFall && currentFall.status === FallStatus.COUNTDOWN_ACTIVE) {
          // Uncancelled -> Confirmed Fall Emergency
          await prisma.fallEvent.update({
            where: { id: fall.id },
            data: { status: FallStatus.CONFIRMED_FALL, verified: true },
          });

          const emergency = await prisma.emergencyEvent.create({
            data: {
              patientId,
              type: EmergencyType.FALL,
              severity: SeverityLevel.CRITICAL,
              status: EmergencyStatus.ACTIVE,
              location: 'Simulated Motion Tracker: Floor Impact',
              source: 'MPU6050_FALL_DETECTION_AUTOMATIC',
              notes: 'Unresponsive fall detected by VIORA neckband inertial sensor after 15s verification window.',
            },
          });

          socketService.emitToPatientRoom(patientId, 'emergency_created', {
            emergency,
            patientId,
          });

          await notificationService.notifyPatientTeam(patientId, {
            title: '🚨 CONFIRMED FALL DETECTED!',
            message: 'Fall detection verified by neckband sensor with no cancellation response. Caregivers alerted immediately.',
            type: 'FALL',
          });
        }
      } catch (err) {
        console.error('Error handling fall countdown auto-escalation:', err);
      }
    }, 15000);

    return fall;
  }

  // Trigger Simulated Abnormal Vitals (Tachycardia, Hypoxia, Fever)
  public async triggerAbnormalVitals(patientId: string, condition: 'TACHYCARDIA' | 'HYPOXIA' | 'FEVER') {
    let hr = 78;
    let spo2 = 97;
    let skinTemp = 36.5;
    let respRate = 16;
    let status: HealthStatus = HealthStatus.WARNING;

    if (condition === 'TACHYCARDIA') {
      hr = 135; // Breaches 120 threshold
      respRate = 22;
    } else if (condition === 'HYPOXIA') {
      spo2 = 88; // Breaches 90 critical threshold
      respRate = 24;
      status = HealthStatus.CRITICAL;
    } else if (condition === 'FEVER') {
      skinTemp = 38.6; // Breaches 37.8 threshold
      hr = 98;
    }

    const reading = await prisma.healthReading.create({
      data: {
        patientId,
        heartRate: hr,
        spo2,
        skinTemperature: skinTemp,
        respiratoryRate: respRate,
        status,
        measurementSource: MeasurementSource.ECG_DERIVED_RESPIRATION,
        isSimulated: true,
        source: `SIMULATOR_TRIGGER_${condition}`,
        timestamp: new Date(),
      },
    });

    socketService.emitToPatientRoom(patientId, 'vital_updated', { reading, patientId });

    // Safety rule engine strictly handles the rule alert generation
    const ruleResults = await safetyRuleEngine.evaluateReading(reading);

    return { reading, ruleResults };
  }

  // Trigger Simulated Missed Medication
  public async triggerMissedMedication(patientId: string) {
    const med = await prisma.medication.findFirst({
      where: { patientId, isActive: true },
    });

    if (!med) return null;

    const log = await prisma.medicationLog.create({
      data: {
        medicationId: med.id,
        patientId,
        scheduledFor: new Date(),
        status: MedicationStatus.MISSED,
        loggedBy: 'SIMULATION_MONITOR',
        notes: `Simulated scheduled dose missed for ${med.name}`,
      },
    });

    socketService.emitToPatientRoom(patientId, 'medication_missed', {
      log,
      medicationName: med.name,
      patientId,
    });

    await notificationService.notifyPatientTeam(patientId, {
      title: `Missed Medication: ${med.name}`,
      message: `Rajesh Kumar did not log dose for ${med.name} (${med.dosage}) scheduled for today.`,
      type: 'MEDICATION',
    });

    return log;
  }
}

export const deviceSimulator = new SimulatorDeviceProvider();
