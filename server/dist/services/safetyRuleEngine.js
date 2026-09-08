"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safetyRuleEngine = exports.SafetyRuleEngine = void 0;
const prisma_js_1 = require("../prisma.js");
const client_1 = require("@prisma/client");
const socketService_js_1 = require("./socketService.js");
const notificationService_js_1 = require("./notificationService.js");
class SafetyRuleEngine {
    /**
     * Deterministically evaluate a validated health reading against active configurable safety rules.
     * NOTE: The AI model does NOT participate in this critical emergency/alert decision pipeline.
     * All rules are explicitly labeled: "Demo safety threshold — not a medical diagnosis."
     */
    async evaluateReading(reading) {
        const results = [];
        try {
            const activeRules = await prisma_js_1.prisma.safetyRule.findMany({
                where: { enabled: true },
            });
            for (const rule of activeRules) {
                let observedValue = null;
                switch (rule.metric) {
                    case client_1.MetricType.HEART_RATE:
                        observedValue = reading.heartRate;
                        break;
                    case client_1.MetricType.SPO2:
                        observedValue = reading.spo2;
                        break;
                    case client_1.MetricType.SKIN_TEMPERATURE:
                        observedValue = reading.skinTemperature;
                        break;
                    case client_1.MetricType.RESPIRATORY_RATE:
                        observedValue = reading.respiratoryRate;
                        break;
                    default:
                        break;
                }
                if (observedValue === null)
                    continue;
                let isTriggered = false;
                if (rule.operator === client_1.RuleOperator.GREATER_THAN && observedValue > rule.threshold) {
                    isTriggered = true;
                }
                else if (rule.operator === client_1.RuleOperator.LESS_THAN && observedValue < rule.threshold) {
                    isTriggered = true;
                }
                else if (rule.operator === client_1.RuleOperator.EQUALS && Math.abs(observedValue - rule.threshold) < 0.01) {
                    isTriggered = true;
                }
                if (isTriggered) {
                    const evalResult = {
                        triggered: true,
                        ruleId: rule.id,
                        metric: rule.metric,
                        observedValue,
                        threshold: rule.threshold,
                        severity: rule.severity,
                        description: rule.description,
                        isDemoThreshold: rule.isDemoThreshold,
                    };
                    results.push(evalResult);
                    // 1. Create Alert record with explicit non-diagnosis disclaimer
                    const alertTitle = `Abnormal ${rule.metric.replace(/_/g, ' ')} Detected`;
                    const alertMessage = `${rule.description}: Observed ${observedValue} (Threshold: ${rule.threshold}). [Demo safety threshold — not a medical diagnosis]`;
                    const alert = await prisma_js_1.prisma.alert.create({
                        data: {
                            patientId: reading.patientId,
                            title: alertTitle,
                            message: alertMessage,
                            type: 'SAFETY_RULE_BREACH',
                            severity: rule.severity,
                        },
                    });
                    // 2. Broadcast alert via Socket.IO
                    socketService_js_1.socketService.emitToPatientRoom(reading.patientId, 'new_alert', {
                        alert,
                        evalResult,
                        patientId: reading.patientId,
                    });
                    // 3. Dispatch notifications to authorized caregivers and doctor
                    await notificationService_js_1.notificationService.notifyPatientTeam(reading.patientId, {
                        title: alertTitle,
                        message: alertMessage,
                        type: 'ABNORMAL_VITAL',
                    });
                    // 4. If rule severity is CRITICAL, escalate to EmergencyEvent
                    if (rule.severity === client_1.SeverityLevel.CRITICAL) {
                        const emergency = await prisma_js_1.prisma.emergencyEvent.create({
                            data: {
                                patientId: reading.patientId,
                                type: client_1.EmergencyType.ABNORMAL_VITAL,
                                severity: client_1.SeverityLevel.CRITICAL,
                                status: client_1.EmergencyStatus.ACTIVE,
                                source: `SAFETY_RULE_ENGINE_${rule.metric}`,
                                notes: `Critical threshold breach on ${rule.metric}: ${observedValue}. Rule: ${rule.description}`,
                            },
                        });
                        socketService_js_1.socketService.emitToPatientRoom(reading.patientId, 'emergency_created', {
                            emergency,
                            patientId: reading.patientId,
                        });
                        await notificationService_js_1.notificationService.notifyPatientTeam(reading.patientId, {
                            title: `CRITICAL EMERGENCY: ${rule.metric.replace(/_/g, ' ')}`,
                            message: `Urgent critical reading observed (${observedValue}). Immediate caregiver attention required.`,
                            type: 'EMERGENCY',
                        });
                    }
                }
            }
        }
        catch (error) {
            console.error('Error in SafetyRuleEngine evaluation:', error);
        }
        return results;
    }
}
exports.SafetyRuleEngine = SafetyRuleEngine;
exports.safetyRuleEngine = new SafetyRuleEngine();
