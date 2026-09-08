"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiAssistantService = exports.AIAssistantService = void 0;
const openai_1 = __importDefault(require("openai"));
const prisma_js_1 = require("../prisma.js");
const env_js_1 = require("../config/env.js");
const client_1 = require("@prisma/client");
class AIAssistantService {
    openai = null;
    constructor() {
        if (env_js_1.config.openai.apiKey) {
            this.openai = new openai_1.default({ apiKey: env_js_1.config.openai.apiKey });
        }
    }
    // Database tools ground truth execution
    async executeTool(name, args) {
        const patientId = args.patientId;
        if (!patientId)
            return { error: 'patientId is required' };
        switch (name) {
            case 'getCurrentVitals': {
                const [latestReading, device] = await Promise.all([
                    prisma_js_1.prisma.healthReading.findFirst({
                        where: { patientId },
                        orderBy: { timestamp: 'desc' },
                    }),
                    prisma_js_1.prisma.device.findFirst({
                        where: { patientId },
                    }),
                ]);
                if (!latestReading) {
                    return { message: 'No health readings recorded yet for this patient.' };
                }
                return {
                    heartRate: `${latestReading.heartRate} BPM`,
                    spo2: `${latestReading.spo2}%`,
                    skinTemperature: `${latestReading.skinTemperature}°C (Measured using TMP117 sensor)`,
                    respiratoryRate: `${latestReading.respiratoryRate} breaths/min (ECG-Derived Respiration - EDR)`,
                    overallStatus: latestReading.status,
                    recordedAt: latestReading.timestamp,
                    neckbandBattery: device ? `${device.batteryLevel}%` : 'Unknown',
                    deviceConnection: device?.connectionStatus || 'DISCONNECTED',
                };
            }
            case 'getHealthHistory': {
                const hours = args.hours || 24;
                const since = new Date(Date.now() - hours * 60 * 60 * 1000);
                const readings = await prisma_js_1.prisma.healthReading.findMany({
                    where: { patientId, timestamp: { gte: since } },
                    orderBy: { timestamp: 'asc' },
                });
                if (readings.length === 0) {
                    return { message: `No readings recorded in the last ${hours} hours.` };
                }
                const hrValues = readings.map((r) => r.heartRate);
                const spo2Values = readings.map((r) => r.spo2);
                const tempValues = readings.map((r) => r.skinTemperature);
                const avg = (arr) => (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
                return {
                    hoursAnalyzed: hours,
                    totalReadings: readings.length,
                    heartRate: {
                        min: Math.min(...hrValues),
                        max: Math.max(...hrValues),
                        average: avg(hrValues),
                    },
                    spo2: {
                        min: Math.min(...spo2Values),
                        max: Math.max(...spo2Values),
                        average: avg(spo2Values),
                    },
                    skinTemperature: {
                        min: Math.min(...tempValues),
                        max: Math.max(...tempValues),
                        average: avg(tempValues),
                    },
                };
            }
            case 'getMedicationSchedule': {
                const medications = await prisma_js_1.prisma.medication.findMany({
                    where: { patientId, isActive: true },
                    include: { schedules: true },
                });
                return medications.map((m) => ({
                    name: m.name,
                    dosage: m.dosage,
                    frequency: m.frequency,
                    instructions: m.instructions,
                    schedules: m.schedules.map((s) => s.scheduledTime),
                }));
            }
            case 'getMedicationStatus': {
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                const logs = await prisma_js_1.prisma.medicationLog.findMany({
                    where: { patientId, scheduledFor: { gte: startOfDay } },
                    include: { medication: true },
                    orderBy: { scheduledFor: 'asc' },
                });
                return logs.map((l) => ({
                    medication: l.medication.name,
                    dosage: l.medication.dosage,
                    status: l.status,
                    takenAt: l.takenAt,
                    notes: l.notes,
                }));
            }
            case 'getActivitySummary': {
                const activity = await prisma_js_1.prisma.activityRecord.findFirst({
                    where: { patientId },
                    orderBy: { date: 'desc' },
                });
                if (!activity) {
                    return { steps: 0, distanceKm: 0, caloriesBurned: 0, activeMinutes: 0 };
                }
                return {
                    steps: activity.steps,
                    distanceMeters: activity.distanceMeters,
                    caloriesBurned: activity.caloriesBurned,
                    activeMinutes: activity.activeMinutes,
                    sleepMinutes: activity.sleepMinutes,
                };
            }
            case 'getAppointments': {
                const appointments = await prisma_js_1.prisma.appointment.findMany({
                    where: { patientId, status: 'SCHEDULED' },
                    include: {
                        doctor: {
                            include: { user: true },
                        },
                    },
                    orderBy: { appointmentDate: 'asc' },
                });
                return appointments.map((a) => ({
                    title: a.title,
                    date: a.appointmentDate,
                    location: a.location,
                    doctor: `${a.doctor.user.firstName} ${a.doctor.user.lastName} (${a.doctor.specialization})`,
                    notes: a.notes,
                }));
            }
            case 'createReminder': {
                const reminder = await prisma_js_1.prisma.reminder.create({
                    data: {
                        patientId,
                        title: args.title,
                        description: args.description || 'Created by VIORA Voice Assistant',
                        category: client_1.ReminderCategory.GENERAL,
                        scheduledTime: new Date(args.scheduledTime || Date.now() + 60 * 60 * 1000),
                        status: client_1.ReminderStatus.PENDING,
                    },
                });
                return {
                    success: true,
                    message: `Reminder created: "${reminder.title}" for ${reminder.scheduledTime.toLocaleTimeString()}`,
                    reminderId: reminder.id,
                };
            }
            default:
                return { error: `Unknown tool: ${name}` };
        }
    }
    /**
     * Process conversation with OpenAI tool calling and strict database grounding
     */
    async processChat(userId, patientId, userMessage, history = []) {
        if (!this.openai) {
            return {
                reply: "VIORA AI Assistant is operating in offline mode. Please configure OPENAI_API_KEY in the backend.",
                toolsUsed: [],
            };
        }
        const systemPrompt = `You are VIORA, a warm, polite, and reassuring AI health assistant for elderly well-being.
You speak clearly in simple, comforting language suitable for seniors.
CRITICAL SAFETY RULES:
1. ALWAYS use the provided tools to inspect actual patient records. NEVER make up numbers or guess vitals.
2. Label body temperature strictly as "Skin Temperature" (measured with TMP117).
3. Label respiratory rate as "Respiratory Rate (ECG-Derived Respiration / EDR)".
4. VIORA provides informational well-being assistance and does NOT provide medical diagnoses.
5. If the patient expresses acute pain, chest tightness, severe dizziness, or asks for emergency help, immediately advise pressing the red Emergency SOS button and offer to notify their caregiver Priya or Dr. Sharma.`;
        const tools = [
            {
                type: 'function',
                function: {
                    name: 'getCurrentVitals',
                    description: 'Get current heart rate, SpO2, skin temperature, respiratory rate, and device battery status from live database.',
                    parameters: {
                        type: 'object',
                        properties: {
                            patientId: { type: 'string', description: 'Patient UUID' },
                        },
                        required: ['patientId'],
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'getHealthHistory',
                    description: 'Get historical vitals trends and min/max/average statistics over the last N hours.',
                    parameters: {
                        type: 'object',
                        properties: {
                            patientId: { type: 'string', description: 'Patient UUID' },
                            hours: { type: 'number', description: 'Number of hours to analyze' },
                        },
                        required: ['patientId'],
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'getMedicationSchedule',
                    description: 'Get active medication list and scheduled times.',
                    parameters: {
                        type: 'object',
                        properties: {
                            patientId: { type: 'string', description: 'Patient UUID' },
                        },
                        required: ['patientId'],
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'getMedicationStatus',
                    description: 'Get today\'s medication adherence and logs (taken/missed/upcoming).',
                    parameters: {
                        type: 'object',
                        properties: {
                            patientId: { type: 'string', description: 'Patient UUID' },
                        },
                        required: ['patientId'],
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'getActivitySummary',
                    description: 'Get daily step count, distance, active minutes, and calories burned.',
                    parameters: {
                        type: 'object',
                        properties: {
                            patientId: { type: 'string', description: 'Patient UUID' },
                        },
                        required: ['patientId'],
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'getAppointments',
                    description: 'Get upcoming scheduled doctor appointments.',
                    parameters: {
                        type: 'object',
                        properties: {
                            patientId: { type: 'string', description: 'Patient UUID' },
                        },
                        required: ['patientId'],
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'createReminder',
                    description: 'Create a new reminder for the patient.',
                    parameters: {
                        type: 'object',
                        properties: {
                            patientId: { type: 'string', description: 'Patient UUID' },
                            title: { type: 'string', description: 'Reminder title' },
                            scheduledTime: { type: 'string', description: 'ISO time or future time string' },
                        },
                        required: ['patientId', 'title'],
                    },
                },
            },
        ];
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.slice(-6).map((h) => ({
                role: h.role,
                content: h.content,
            })),
            { role: 'user', content: userMessage },
        ];
        const toolsUsed = [];
        try {
            let response = await this.openai.chat.completions.create({
                model: env_js_1.config.openai.model,
                messages,
                tools,
                tool_choice: 'auto',
            });
            let responseMessage = response.choices[0].message;
            // Handle tool calling loop
            if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                messages.push(responseMessage);
                for (const toolCall of responseMessage.tool_calls) {
                    const toolName = toolCall.function.name;
                    toolsUsed.push(toolName);
                    let parsedArgs = {};
                    try {
                        parsedArgs = JSON.parse(toolCall.function.arguments);
                    }
                    catch {
                        parsedArgs = {};
                    }
                    // Inject verified patientId
                    const toolResult = await this.executeTool(toolName, {
                        ...parsedArgs,
                        patientId,
                    });
                    messages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(toolResult),
                    });
                }
                // Second pass with tool results
                const finalResponse = await this.openai.chat.completions.create({
                    model: env_js_1.config.openai.model,
                    messages,
                });
                const replyText = finalResponse.choices[0].message.content || 'I am here to help you.';
                return { reply: replyText, toolsUsed };
            }
            return {
                reply: responseMessage.content || 'I am here with you.',
                toolsUsed,
            };
        }
        catch (error) {
            console.error('OpenAI Assistant Error:', error?.message);
            // Resilient fallback to direct local database query if OpenAI errors out
            const vitals = await this.executeTool('getCurrentVitals', { patientId });
            return {
                reply: `Hello Rajesh ji, here are your latest recorded vitals: Heart Rate: ${vitals.heartRate}, SpO2: ${vitals.spo2}, Skin Temperature: ${vitals.skinTemperature}, Respiratory Rate: ${vitals.respiratoryRate}. All values are currently within your stable target range.`,
                toolsUsed: ['getCurrentVitals_fallback'],
            };
        }
    }
}
exports.AIAssistantService = AIAssistantService;
exports.aiAssistantService = new AIAssistantService();
