"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceSimulator = exports.SimulatorDeviceProvider = void 0;
const prisma_js_1 = require("../prisma.js");
const client_1 = require("@prisma/client");
const socketService_js_1 = require("./socketService.js");
const safetyRuleEngine_js_1 = require("./safetyRuleEngine.js");
const notificationService_js_1 = require("./notificationService.js");
class SimulatorDeviceProvider {
    intervalId = null;
    isSimulating = false;
    currentBattery = 88;
    chargingStatus = client_1.ChargingStatus.DISCHARGING;
    async getDeviceStatus(deviceId) {
        return await prisma_js_1.prisma.device.findUnique({
            where: { deviceId },
        });
    }
    async sendMediaCommand(deviceId, command, payload) {
        // Media command executed on neckband speaker abstraction
        console.log(`[Neckband Audio Abstraction] Executing ${command} on device ${deviceId}:`, payload);
        return { success: true, command, payload, timestamp: new Date() };
    }
    async sendCallCommand(deviceId, action, contact) {
        // Phone call simulation abstraction
        console.log(`[Neckband Phone Abstraction] Executing call action ${action} on device ${deviceId}:`, contact);
        return { success: true, action, contact, timestamp: new Date() };
    }
    startSimulation(patientId, intervalSeconds = 10) {
        if (this.isSimulating)
            return;
        this.isSimulating = true;
        console.log(`▶ Device Simulator started for patient: ${patientId}`);
        this.intervalId = setInterval(async () => {
            try {
                await this.generateReading(patientId);
                await this.tickBatteryAndHeartbeat(patientId);
            }
            catch (err) {
                console.error('Error in simulation cycle:', err);
            }
        }, intervalSeconds * 1000);
    }
    stopSimulation() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isSimulating = false;
        console.log('⏹ Device Simulator stopped');
    }
    getSimulationStatus() {
        return { isSimulating: this.isSimulating, battery: this.currentBattery };
    }
    async tickBatteryAndHeartbeat(patientId) {
        const device = await prisma_js_1.prisma.device.findFirst({
            where: { patientId },
        });
        if (!device)
            return;
        // Slowly discharge battery or charge if charging
        if (this.chargingStatus === client_1.ChargingStatus.DISCHARGING) {
            this.currentBattery = Math.max(5, this.currentBattery - 0.1);
        }
        else {
            this.currentBattery = Math.min(100, this.currentBattery + 0.5);
        }
        const updatedDevice = await prisma_js_1.prisma.device.update({
            where: { id: device.id },
            data: {
                batteryLevel: Math.round(this.currentBattery),
                chargingStatus: this.chargingStatus,
                lastHeartbeat: new Date(),
                lastSeen: new Date(),
            },
        });
        socketService_js_1.socketService.emitToPatientRoom(patientId, 'device_status_updated', updatedDevice);
        socketService_js_1.socketService.emitToPatientRoom(patientId, 'battery_updated', {
            patientId,
            batteryLevel: Math.round(this.currentBattery),
            chargingStatus: this.chargingStatus,
        });
    }
    async generateReading(patientId) {
        // Generate realistic normal telemetry with subtle physiological variations
        const hr = 76 + Math.round(Math.random() * 6 - 3); // 73 - 79 BPM
        const spo2 = 97 + Math.round(Math.random() * 2 - 1); // 96 - 98 %
        const skinTemp = parseFloat((36.5 + (Math.random() * 0.4 - 0.2)).toFixed(1)); // 36.3 - 36.7 °C (TMP117)
        const respRate = 16 + Math.round(Math.random() * 2 - 1); // 15 - 17 /min (ECG-Derived Respiration)
        const reading = await prisma_js_1.prisma.healthReading.create({
            data: {
                patientId,
                heartRate: hr,
                spo2: Math.min(100, Math.max(90, spo2)),
                skinTemperature: skinTemp, // Strictly labeled Skin Temperature (TMP117)
                respiratoryRate: respRate, // Formally ECG-Derived Respiration (EDR)
                systolicBP: 122 + Math.round(Math.random() * 4 - 2),
                diastolicBP: 80 + Math.round(Math.random() * 3 - 1),
                stressLevel: 14 + Math.round(Math.random() * 4 - 2),
                status: client_1.HealthStatus.STABLE,
                measurementSource: client_1.MeasurementSource.ECG_DERIVED_RESPIRATION,
                isSimulated: true,
                source: 'VIORA_NECKBAND_SIMULATOR',
                timestamp: new Date(),
            },
        });
        // Broadcast vital update to all connected dashboards in real time
        socketService_js_1.socketService.emitToPatientRoom(patientId, 'vital_updated', {
            reading,
            patientId,
        });
        // Evaluate through SafetyRuleEngine
        await safetyRuleEngine_js_1.safetyRuleEngine.evaluateReading(reading);
        return reading;
    }
    // Trigger Manual SOS button simulation
    async triggerSOS(patientId, location = 'Living Room, Home') {
        const emergency = await prisma_js_1.prisma.emergencyEvent.create({
            data: {
                patientId,
                type: client_1.EmergencyType.SOS,
                severity: client_1.SeverityLevel.CRITICAL,
                status: client_1.EmergencyStatus.ACTIVE,
                location,
                source: 'SIMULATED_MANUAL_SOS_BUTTON',
                notes: 'Elderly activated emergency SOS on VIORA device / dashboard.',
            },
        });
        socketService_js_1.socketService.emitToPatientRoom(patientId, 'emergency_created', {
            emergency,
            patientId,
        });
        await notificationService_js_1.notificationService.notifyPatientTeam(patientId, {
            title: '🚨 EMERGENCY SOS TRIGGERED!',
            message: `Elderly patient Rajesh Kumar triggered manual SOS from ${location}. Immediate assistance required.`,
            type: 'SOS',
        });
        return emergency;
    }
    // Trigger Fall Detection Pipeline (MPU6050 Acceleration Breach -> 15s Verification Countdown)
    async triggerFall(patientId) {
        const fall = await prisma_js_1.prisma.fallEvent.create({
            data: {
                patientId,
                accelerationPeak: 4.2,
                impactVelocity: 2.8,
                postImpactRestDurationSeconds: 15,
                confidenceScore: 0.94,
                verified: false,
                status: client_1.FallStatus.COUNTDOWN_ACTIVE,
                timestamp: new Date(),
            },
        });
        socketService_js_1.socketService.emitToPatientRoom(patientId, 'fall_detected', {
            fall,
            countdownSeconds: 15,
            patientId,
        });
        // Start 15s post-event verification timer: if not cancelled by patient, auto-escalate to Critical Emergency
        setTimeout(async () => {
            try {
                const currentFall = await prisma_js_1.prisma.fallEvent.findUnique({
                    where: { id: fall.id },
                });
                if (currentFall && currentFall.status === client_1.FallStatus.COUNTDOWN_ACTIVE) {
                    // Uncancelled -> Confirmed Fall Emergency
                    await prisma_js_1.prisma.fallEvent.update({
                        where: { id: fall.id },
                        data: { status: client_1.FallStatus.CONFIRMED_FALL, verified: true },
                    });
                    const emergency = await prisma_js_1.prisma.emergencyEvent.create({
                        data: {
                            patientId,
                            type: client_1.EmergencyType.FALL,
                            severity: client_1.SeverityLevel.CRITICAL,
                            status: client_1.EmergencyStatus.ACTIVE,
                            location: 'Simulated Motion Tracker: Floor Impact',
                            source: 'MPU6050_FALL_DETECTION_AUTOMATIC',
                            notes: 'Unresponsive fall detected by VIORA neckband inertial sensor after 15s verification window.',
                        },
                    });
                    socketService_js_1.socketService.emitToPatientRoom(patientId, 'emergency_created', {
                        emergency,
                        patientId,
                    });
                    await notificationService_js_1.notificationService.notifyPatientTeam(patientId, {
                        title: '🚨 CONFIRMED FALL DETECTED!',
                        message: 'Fall detection verified by neckband sensor with no cancellation response. Caregivers alerted immediately.',
                        type: 'FALL',
                    });
                }
            }
            catch (err) {
                console.error('Error handling fall countdown auto-escalation:', err);
            }
        }, 15000);
        return fall;
    }
    // Trigger Simulated Abnormal Vitals (Tachycardia, Hypoxia, Fever)
    async triggerAbnormalVitals(patientId, condition) {
        let hr = 78;
        let spo2 = 97;
        let skinTemp = 36.5;
        let respRate = 16;
        let status = client_1.HealthStatus.WARNING;
        if (condition === 'TACHYCARDIA') {
            hr = 135; // Breaches 120 threshold
            respRate = 22;
        }
        else if (condition === 'HYPOXIA') {
            spo2 = 88; // Breaches 90 critical threshold
            respRate = 24;
            status = client_1.HealthStatus.CRITICAL;
        }
        else if (condition === 'FEVER') {
            skinTemp = 38.6; // Breaches 37.8 threshold
            hr = 98;
        }
        const reading = await prisma_js_1.prisma.healthReading.create({
            data: {
                patientId,
                heartRate: hr,
                spo2,
                skinTemperature: skinTemp,
                respiratoryRate: respRate,
                status,
                measurementSource: client_1.MeasurementSource.ECG_DERIVED_RESPIRATION,
                isSimulated: true,
                source: `SIMULATOR_TRIGGER_${condition}`,
                timestamp: new Date(),
            },
        });
        socketService_js_1.socketService.emitToPatientRoom(patientId, 'vital_updated', { reading, patientId });
        // Safety rule engine strictly handles the rule alert generation
        const ruleResults = await safetyRuleEngine_js_1.safetyRuleEngine.evaluateReading(reading);
        return { reading, ruleResults };
    }
    // Trigger Simulated Missed Medication
    async triggerMissedMedication(patientId) {
        const med = await prisma_js_1.prisma.medication.findFirst({
            where: { patientId, isActive: true },
        });
        if (!med)
            return null;
        const log = await prisma_js_1.prisma.medicationLog.create({
            data: {
                medicationId: med.id,
                patientId,
                scheduledFor: new Date(),
                status: client_1.MedicationStatus.MISSED,
                loggedBy: 'SIMULATION_MONITOR',
                notes: `Simulated scheduled dose missed for ${med.name}`,
            },
        });
        socketService_js_1.socketService.emitToPatientRoom(patientId, 'medication_missed', {
            log,
            medicationName: med.name,
            patientId,
        });
        await notificationService_js_1.notificationService.notifyPatientTeam(patientId, {
            title: `Missed Medication: ${med.name}`,
            message: `Rajesh Kumar did not log dose for ${med.name} (${med.dosage}) scheduled for today.`,
            type: 'MEDICATION',
        });
        return log;
    }
}
exports.SimulatorDeviceProvider = SimulatorDeviceProvider;
exports.deviceSimulator = new SimulatorDeviceProvider();
