"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_js_1 = require("../prisma.js");
const env_js_1 = require("../config/env.js");
const auth_js_1 = require("../middleware/auth.js");
const enums_js_1 = require("../types/enums.js");
const router = (0, express_1.Router)();
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.nativeEnum(enums_js_1.UserRole),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    phone: zod_1.z.string().optional(),
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await prisma_js_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: {
                elderlyProfile: true,
                caregiverProfile: true,
                doctorProfile: true,
            },
        });
        if (!user || !user.isActive) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password credentials',
                code: 'INVALID_CREDENTIALS',
            });
            return;
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValidPassword) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password credentials',
                code: 'INVALID_CREDENTIALS',
            });
            return;
        }
        const tokenPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, env_js_1.config.jwt.secret, {
            expiresIn: env_js_1.config.jwt.expiresIn,
        });
        const refreshToken = jsonwebtoken_1.default.sign(tokenPayload, env_js_1.config.jwt.refreshSecret, {
            expiresIn: env_js_1.config.jwt.refreshExpiresIn,
        });
        // Record audit log
        await prisma_js_1.prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'USER_LOGIN',
                entityType: 'User',
                entityId: user.id,
                details: { role: user.role },
            },
        });
        res.json({
            success: true,
            data: {
                token,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: user.phone,
                    avatarUrl: user.avatarUrl,
                    profile: user.elderlyProfile || user.caregiverProfile || user.doctorProfile || null,
                },
            },
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error?.errors ? error.errors[0].message : error.message,
            code: 'VALIDATION_ERROR',
        });
    }
});
// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const data = registerSchema.parse(req.body);
        const existingUser = await prisma_js_1.prisma.user.findUnique({
            where: { email: data.email.toLowerCase() },
        });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: 'A user with this email address already exists',
                code: 'USER_EXISTS',
            });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
        const user = await prisma_js_1.prisma.user.create({
            data: {
                email: data.email.toLowerCase(),
                passwordHash,
                role: data.role,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
            },
        });
        // Automatically create corresponding profile based on role
        if (data.role === enums_js_1.UserRole.ELDERLY) {
            await prisma_js_1.prisma.elderlyProfile.create({
                data: { userId: user.id },
            });
        }
        else if (data.role === enums_js_1.UserRole.CAREGIVER) {
            await prisma_js_1.prisma.caregiverProfile.create({
                data: { userId: user.id },
            });
        }
        else if (data.role === enums_js_1.UserRole.DOCTOR) {
            await prisma_js_1.prisma.doctorProfile.create({
                data: { userId: user.id },
            });
        }
        const tokenPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, env_js_1.config.jwt.secret, {
            expiresIn: env_js_1.config.jwt.expiresIn,
        });
        res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                },
            },
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error?.errors ? error.errors[0].message : error.message,
            code: 'VALIDATION_ERROR',
        });
    }
});
// GET /api/auth/me
router.get('/me', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const user = await prisma_js_1.prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                elderlyProfile: {
                    include: {
                        devices: true,
                    },
                },
                caregiverProfile: true,
                doctorProfile: true,
            },
        });
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found', code: 'USER_NOT_FOUND' });
            return;
        }
        res.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                avatarUrl: user.avatarUrl,
                profile: user.elderlyProfile || user.caregiverProfile || user.doctorProfile || null,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
exports.default = router;
