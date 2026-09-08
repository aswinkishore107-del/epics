import { prisma } from '../prisma.js';
import { HealthReading, SeverityLevel, MetricType, RuleOperator, EmergencyType, EmergencyStatus } from '@prisma/client';
import { socketService } from './socketService.js';
import { notificationService } from './notificationService.js';

export interface RuleEvaluationResult {
  triggered: boolean;
  ruleId?: string;
  metric: string;
  observedValue: number;
  threshold: number;
  severity: SeverityLevel;
  description: string;
  isDemoThreshold: boolean;
}

export class SafetyRuleEngine {
  /**
   * Deterministically evaluate a validated health reading against active configurable safety rules.
   * NOTE: The AI model does NOT participate in this critical emergency/alert decision pipeline.
   * All rules are explicitly labeled: "Demo safety threshold — not a medical diagnosis."
   */
  public async evaluateReading(reading: HealthReading): Promise<RuleEvaluationResult[]> {
    const results: RuleEvaluationResult[] = [];

    try {
      const activeRules = await prisma.safetyRule.findMany({
        where: { enabled: true },
      });

      for (const rule of activeRules) {
        let observedValue: number | null = null;

        switch (rule.metric) {
          case MetricType.HEART_RATE:
            observedValue = reading.heartRate;
            break;
          case MetricType.SPO2:
            observedValue = reading.spo2;
            break;
          case MetricType.SKIN_TEMPERATURE:
            observedValue = reading.skinTemperature;
            break;
          case MetricType.RESPIRATORY_RATE:
            observedValue = reading.respiratoryRate;
            break;
          default:
            break;
        }

        if (observedValue === null) continue;

        let isTriggered = false;
        if (rule.operator === RuleOperator.GREATER_THAN && observedValue > rule.threshold) {
          isTriggered = true;
        } else if (rule.operator === RuleOperator.LESS_THAN && observedValue < rule.threshold) {
          isTriggered = true;
        } else if (rule.operator === RuleOperator.EQUALS && Math.abs(observedValue - rule.threshold) < 0.01) {
          isTriggered = true;
        }

        if (isTriggered) {
          const evalResult: RuleEvaluationResult = {
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

          const alert = await prisma.alert.create({
            data: {
              patientId: reading.patientId,
              title: alertTitle,
              message: alertMessage,
              type: 'SAFETY_RULE_BREACH',
              severity: rule.severity,
            },
          });

          // 2. Broadcast alert via Socket.IO
          socketService.emitToPatientRoom(reading.patientId, 'new_alert', {
            alert,
            evalResult,
            patientId: reading.patientId,
          });

          // 3. Dispatch notifications to authorized caregivers and doctor
          await notificationService.notifyPatientTeam(reading.patientId, {
            title: alertTitle,
            message: alertMessage,
            type: 'ABNORMAL_VITAL',
          });

          // 4. If rule severity is CRITICAL, escalate to EmergencyEvent
          if (rule.severity === SeverityLevel.CRITICAL) {
            const emergency = await prisma.emergencyEvent.create({
              data: {
                patientId: reading.patientId,
                type: EmergencyType.ABNORMAL_VITAL,
                severity: SeverityLevel.CRITICAL,
                status: EmergencyStatus.ACTIVE,
                source: `SAFETY_RULE_ENGINE_${rule.metric}`,
                notes: `Critical threshold breach on ${rule.metric}: ${observedValue}. Rule: ${rule.description}`,
              },
            });

            socketService.emitToPatientRoom(reading.patientId, 'emergency_created', {
              emergency,
              patientId: reading.patientId,
            });

            await notificationService.notifyPatientTeam(reading.patientId, {
              title: `CRITICAL EMERGENCY: ${rule.metric.replace(/_/g, ' ')}`,
              message: `Urgent critical reading observed (${observedValue}). Immediate caregiver attention required.`,
              type: 'EMERGENCY',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error in SafetyRuleEngine evaluation:', error);
    }

    return results;
  }
}

export const safetyRuleEngine = new SafetyRuleEngine();
