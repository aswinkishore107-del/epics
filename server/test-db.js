require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const elderly = await prisma.elderlyProfile.count();
    const caregiver = await prisma.caregiverProfile.count();
    const doctor = await prisma.doctorProfile.count();
    const relationships = await prisma.patientRelationship.count();
    const emergencyContacts = await prisma.emergencyContact.count();
    const devices = await prisma.device.count();
    const readings = await prisma.healthReading.count();
    const ecg = await prisma.ecgRecord.count();
    const meds = await prisma.medication.count();
    const safetyRules = await prisma.safetyRule.count();
    const conversations = await prisma.conversation.count();
    const messages = await prisma.message.count();

    console.log({
      elderly,
      caregiver,
      doctor,
      relationships,
      emergencyContacts,
      devices,
      readings,
      ecg,
      meds,
      safetyRules,
      conversations,
      messages
    });
  } catch (err) {
    console.error('DB Check error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
