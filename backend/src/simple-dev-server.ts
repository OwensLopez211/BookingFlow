/**
 * Simplified Local Development Server
 * A direct Express server that bypasses AWS Lambda complexity
 */

// Load environment variables from .env file
import * as fs from 'fs';
import * as path from 'path';

// Load .env file manually
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    }
  });
  console.log('🔧 Environment variables loaded from .env file');
}

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Import metrics functionality
import { withMetrics, getRequestStats, estimateCosts } from './middleware/requestMetrics';

// Import Transbank handler for local testing
import { handler as transbankHandler } from './functions/transbank';

const app = express();
const PORT = 3001;
const JWT_SECRET = 'local-development-secret-for-bookflow';

// Configure Transbank environment variables for integration testing
process.env.TRANSBANK_ENVIRONMENT = 'INTEGRATION'; // Use real integration environment
// Las credenciales se obtienen automáticamente del SDK para el ambiente de integración
process.env.SUBSCRIPTIONS_TABLE = 'bookflow-subscriptions-local';

// Development storage for OneClick subscriptions (in-memory)
interface DevSubscription {
  id: string;
  organizationId: string;
  customerId: string;
  planId: string;
  planName: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  trial_start?: number;
  trial_end?: number;
  amount: number;
  currency: string;
  interval: string;
  payment_method: string;
  // OneClick specific fields
  oneclick_username?: string;
  oneclick_user_id?: string;
  oneclick_inscription_token?: string;
  oneclick_inscription_date?: number;
  oneclick_active?: boolean;
  oneclick_card_type?: string;
  oneclick_card_number?: string;
  oneclick_authorization_code?: string;
  payment_attempts: number;
}

let devSubscriptions: DevSubscription[] = [];

// Helper function to convert Express request to Lambda event
const expressToLambdaEvent = (req: any, res: any): any => {
  return {
    httpMethod: req.method,
    path: req.path,
    pathParameters: req.params,
    queryStringParameters: req.query,
    headers: req.headers,
    body: req.body ? JSON.stringify(req.body) : null,
    isBase64Encoded: false,
  };
};

// Helper function to send Lambda response via Express
const sendLambdaResponse = (lambdaResponse: any, res: any) => {
  const statusCode = lambdaResponse.statusCode || 200;
  const headers = lambdaResponse.headers || {};
  
  // Set CORS headers
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...headers
  });
  
  let body;
  try {
    body = lambdaResponse.body ? JSON.parse(lambdaResponse.body) : {};
  } catch (e) {
    body = lambdaResponse.body || {};
  }
  
  res.status(statusCode).json(body);
};

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());

// Types for organization structure
interface OrganizationSettings {
  timezone: string;
  businessHours: { [key: string]: { isOpen: boolean; openTime: string; closeTime: string; } };
  notifications: { [key: string]: any };
  appointmentSystem?: {
    appointmentModel?: string;
    allowClientSelection?: boolean;
    bufferBetweenAppointments?: number;
    maxAdvanceBookingDays?: number;
    maxProfessionals?: number;
    maxResources?: number;
    maxResourcesPerSlot?: number;
    professionals?: Array<{
      id: string;
      name: string;
      photo?: string;
      isActive: boolean;
    }>;
  };
  businessConfiguration?: {
    appointmentModel?: string;
    allowClientSelection?: boolean;
    bufferBetweenAppointments?: number;
    maxAdvanceBookingDays?: number;
    maxProfessionals?: number;
    maxResources?: number;
    maxResourcesPerSlot?: number;
    professionals?: Array<{
      id: string;
      name: string;
      photo?: string;
      isActive: boolean;
    }>;
  };
  businessInfo?: {
    businessName?: string;
    businessAddress?: string;
    businessPhone?: string;
    businessEmail?: string;
  };
  services?: Array<{
    id: string;
    name: string;
    description: string;
    duration: number;
    price: number;
    isActive: boolean;
  }>;
  currency?: string;
}

interface Organization {
  id: string;
  name: string;
  templateType: string;
  address?: string;
  phone?: string;
  email?: string;
  currency?: string;
  settings: OrganizationSettings;
  subscription: {
    plan: 'free' | 'basic' | 'professional' | 'enterprise';
    limits: {
      maxResources: number;
      maxAppointmentsPerMonth: number;
      maxUsers: number;
    };
  };
  createdAt: string;
  updatedAt: string;
}

// Simple in-memory storage
let users: any[] = [];
let organizations: Organization[] = [];

// Storage for SSE connections
const sseConnections = new Map<string, Set<any>>(); // orgId -> Set of response objects

// Storage for notifications history
interface StoredNotification {
  id: string;
  orgId: string;
  type: string;
  data: any;
  timestamp: string;
  isRead: boolean;
  createdAt: string;
}

const notificationsHistory: StoredNotification[] = [];

// Initialize with test data
const initializeTestData = () => {
  const testOrg = {
    id: '74e46f50-509d-451e-bf21-df12fbda7b77',
    name: 'Mi Organización Local',
    templateType: 'beauty_salon',
    address: 'Calle Principal 123, Centro',
    phone: '+34 912 345 678',
    email: 'info@miorganizacion.com',
    currency: 'EUR',
    settings: {
      timezone: 'America/Santiago',
      businessHours: {
        monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        saturday: { isOpen: true, openTime: '09:00', closeTime: '15:00' },
        sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
      },
      notifications: {
        emailReminders: true,
        smsReminders: false,
        autoConfirmation: true,
        reminderHours: 24,
      },
      appointmentSystem: {
        appointmentModel: 'professional_based',
        allowClientSelection: true,
        bufferBetweenAppointments: 15,
        maxAdvanceBookingDays: 30,
        maxProfessionals: 3,
        maxResources: 1,
        maxResourcesPerSlot: 5,
        professionals: [
          {
            id: 'prof-1',
            name: 'Elena García',
            photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xNiA3QTQgNCAwIDEgMSA4IDdBNCA0IDAgMCAxIDE2IDdaTTEyIDEyQzE1LjMxIDEyIDE4IDEyLjY3IDE4IDE0VjE2SDZWMTRDNiAxMi42NyA4LjY5IDEyIDEyIDEyWiIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4KPC9zdmc+',
            isActive: true,
          },
          {
            id: 'prof-2',
            name: 'María López',
            photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGRUY3RkYiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xNiA3QTQgNCAwIDEgMSA4IDdBNCA0IDAgMCAxIDE2IDdaTTEyIDEyQzE1LjMxIDEyIDE4IDEyLjY3IDE4IDE0VjE2SDZWMTRDNiAxMi42NyA4LjY5IDEyIDEyIDEyWiIgZmlsbD0iIzM3NDE1MSIvPgo8L3N2Zz4KPC9zdmc+',
            isActive: true,
          }
        ],
      },
      businessConfiguration: {
        appointmentModel: 'professional_based',
        allowClientSelection: true,
        bufferBetweenAppointments: 15,
        maxAdvanceBookingDays: 30,
        maxProfessionals: 3,
        maxResources: 1,
        professionals: [
          {
            id: 'prof-1',
            name: 'Elena García',
            photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xNiA3QTQgNCAwIDEgMSA4IDdBNCA0IDAgMCAxIDE2IDdaTTEyIDEyQzE1LjMxIDEyIDE4IDEyLjY3IDE4IDE0VjE2SDZWMTRDNiAxMi42NyA4LjY5IDEyIDEyIDEyWiIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4KPC9zdmc+',
            isActive: true,
          },
          {
            id: 'prof-2',
            name: 'María López',
            photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGRUY3RkYiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xNiA3QTQgNCAwIDEgMSA4IDdBNCA0IDAgMCAxIDE2IDdaTTEyIDEyQzE1LjMxIDEyIDE4IDEyLjY3IDE4IDE0VjE2SDZWMTRDNiAxMi42NyA4LjY5IDEyIDEyIDEyWiIgZmlsbD0iIzM3NDE1MSIvPgo8L3N2Zz4KPC9zdmc+',
            isActive: true,
          }
        ],
      },
      businessInfo: {
        businessName: 'Mi Organización Local',
        businessAddress: 'Calle Principal 123, Centro',
        businessPhone: '+34 912 345 678',
        businessEmail: 'info@miorganizacion.com',
      },
      services: [
        {
          id: 'svc-1',
          name: 'Corte y Peinado',
          description: 'Corte personalizado con peinado incluido',
          duration: 60,
          price: 35,
          isActive: true,
        },
        {
          id: 'svc-2',
          name: 'Coloración',
          description: 'Tinte completo con tratamiento',
          duration: 120,
          price: 85,
          isActive: true,
        },
        {
          id: 'svc-3',
          name: 'Manicura',
          description: 'Manicura completa con esmaltado',
          duration: 45,
          price: 25,
          isActive: true,
        },
        {
          id: 'svc-4',
          name: 'Tratamiento Capilar',
          description: 'Tratamiento nutritivo para el cabello',
          duration: 90,
          price: 55,
          isActive: true,
        }
      ],
    },
    subscription: {
      plan: 'free' as const,
      limits: {
        maxResources: 2,
        maxAppointmentsPerMonth: 100,
        maxUsers: 3,
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const testUser = {
    id: 'test-user-123',
    cognitoId: 'local-cognito-123',
    email: 'test@example.com',
    password: bcrypt.hashSync('password123', 10),
    role: 'owner',
    orgId: '74e46f50-509d-451e-bf21-df12fbda7b77',
    profile: {
      firstName: 'Usuario',
      lastName: 'Local',
    },
    onboardingStatus: {
      isCompleted: true,
      currentStep: 3,
      completedSteps: [
        { stepNumber: 1, stepName: 'industry_selection', isCompleted: true, completedAt: new Date().toISOString(), data: { industryType: 'beauty_salon' } },
        { stepNumber: 2, stepName: 'organization_setup', isCompleted: true, completedAt: new Date().toISOString(), data: { businessName: 'Mi Organización Local' } },
        { stepNumber: 3, stepName: 'business_configuration', isCompleted: true, completedAt: new Date().toISOString(), data: { appointmentModel: 'professional_based' } }
      ],
      industry: 'beauty_salon',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Create a second test organization with resource-based system
  const testResourceOrg = {
    id: 'resource-org-demo-123',
    name: 'Centro Recursos Local',
    templateType: 'fitness_center',
    address: 'Avenida Deportes 456, Zona Norte',
    phone: '+34 987 654 321',
    email: 'info@centrodeportes.com',
    currency: 'EUR',
    settings: {
      timezone: 'America/Santiago',
      businessHours: {
        monday: { isOpen: true, openTime: '06:00', closeTime: '22:00' },
        tuesday: { isOpen: true, openTime: '06:00', closeTime: '22:00' },
        wednesday: { isOpen: true, openTime: '06:00', closeTime: '22:00' },
        thursday: { isOpen: true, openTime: '06:00', closeTime: '22:00' },
        friday: { isOpen: true, openTime: '06:00', closeTime: '22:00' },
        saturday: { isOpen: true, openTime: '08:00', closeTime: '20:00' },
        sunday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
      },
      notifications: {
        emailReminders: true,
        smsReminders: false,
        autoConfirmation: true,
        reminderHours: 24,
      },
      appointmentSystem: {
        appointmentModel: 'resource_based',
        allowClientSelection: true,
        bufferBetweenAppointments: 0,
        maxAdvanceBookingDays: 30,
        maxProfessionals: 1,
        maxResources: 3,
        maxResourcesPerSlot: 8,
      },
      services: [
        {
          id: 'res-svc-1',
          name: 'Clase de Spinning',
          description: 'Clase grupal de spinning de alta intensidad',
          duration: 60,
          price: 15,
          isActive: true,
        },
        {
          id: 'res-svc-2',
          name: 'Yoga',
          description: 'Clase de yoga relajante para todos los niveles',
          duration: 90,
          price: 20,
          isActive: true,
        },
        {
          id: 'res-svc-3',
          name: 'Entrenamiento Funcional',
          description: 'Rutina de ejercicios funcionales',
          duration: 45,
          price: 12,
          isActive: true,
        }
      ],
    },
    subscription: {
      plan: 'free' as const,
      limits: {
        maxResources: 8,
        maxAppointmentsPerMonth: 500,
        maxUsers: 5,
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (organizations.length === 0) {
    organizations.push(testOrg);
    organizations.push(testResourceOrg);
  }
  
  if (users.length === 0) {
    users.push(testUser);
  }
};

// Auth middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, error: 'Token inválido' });
  }
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'BookFlow Backend Local Server',
    timestamp: new Date().toISOString()
  });
});

// Login
app.post('/v1/auth/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body.email);
    const { email, password } = req.body;

    const user = users.find(u => u.email === email);
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({ success: false, error: 'Email o contraseña incorrectos' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('🔑 Password match:', passwordMatch);
    
    if (!passwordMatch) {
      console.log('❌ Password incorrect for user:', email);
      return res.status(400).json({ success: false, error: 'Email o contraseña incorrectos' });
    }

    const organization = organizations.find(org => org.id === user.orgId);

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, orgId: user.orgId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful for:', email);

    res.json({
      success: true,
      message: 'Bienvenido de nuevo' + user.profile.firstName + '!',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        profile: user.profile,
        onboardingStatus: user.onboardingStatus,
      },
      organization: organization ? {
        id: organization.id,
        name: organization.name,
        templateType: organization.templateType,
      } : null,
      tokens: {
        accessToken: token,
        idToken: token,
        refreshToken: token,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Register
app.post('/v1/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, organizationName, templateType } = req.body;

    if (users.find(u => u.email === email)) {
      return res.status(400).json({ success: false, error: 'Ya existe un usuario con este email' });
    }

    // Create minimal organization (will be configured during onboarding)
    const organization = {
      id: uuidv4(),
      name: organizationName || 'Mi Organización', // Nombre temporal
      templateType: templateType || 'custom', // Tipo temporal
      settings: {
        timezone: 'America/Santiago', // Default básico
        businessHours: {}, // Se configurará en onboarding
        notifications: {}, // Se configurará en onboarding
      },
      subscription: {
        plan: 'free' as const,
        limits: {
          maxResources: 1, // Default mínimo
          maxAppointmentsPerMonth: 100,
          maxUsers: 3,
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const user = {
      id: uuidv4(),
      cognitoId: `local-${uuidv4()}`,
      email,
      password: await bcrypt.hash(password, 10),
      role: 'owner',
      orgId: organization.id,
      profile: { firstName, lastName },
      onboardingStatus: {
        isCompleted: false,
        currentStep: 1,
        completedSteps: [],
        startedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    organizations.push(organization);
    users.push(user);

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, orgId: user.orgId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        profile: user.profile,
        onboardingStatus: user.onboardingStatus,
      },
      organization: null, // No mostrar organización hasta completar onboarding
      tokens: {
        accessToken: token,
        idToken: token,
        refreshToken: token,
      },
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Get current user
app.get('/v1/auth/me', authenticateToken, (req: any, res) => {
  try {
    const user = users.find(u => u.id === req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const organization = organizations.find(org => org.id === user.orgId);
    
    // Debug: Log organization data including trial
    console.log('🔍 /v1/auth/me - organization:', organization);
    console.log('🔍 /v1/auth/me - trial:', organization?.subscription?.trial);

    res.json({
      success: true,
      message: 'Usuario actual obtenido exitosamente',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        profile: user.profile,
        onboardingStatus: user.onboardingStatus,
      },
      organization: organization || null,
    });
  } catch (error) {
    console.error('❌ Get current user error:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// =============================================
// REAL-TIME NOTIFICATIONS ENDPOINTS
// =============================================

// GET /v1/notifications/stream/:orgId - SSE endpoint for real-time notifications
app.get('/v1/notifications/stream/:orgId', (req: any, res) => {
  try {
    const { orgId } = req.params;
    const { token } = req.query;

    console.log(`🔔 SSE connection attempt for org: ${orgId}`);
    
    // Authenticate using query parameter token
    if (!token) {
      console.log('❌ SSE connection denied - no token provided');
      return res.status(401).json({ 
        success: false, 
        error: 'Token de acceso requerido' 
      });
    }

    let user;
    try {
      user = jwt.verify(token as string, JWT_SECRET) as any;
    } catch (error) {
      console.log('❌ SSE connection denied - invalid token');
      return res.status(403).json({ 
        success: false, 
        error: 'Token inválido' 
      });
    }

    console.log(`🔔 SSE user verified: ${user.userId}, role: ${user.role}`);
    
    // Verify user is owner and belongs to the organization
    if (user.role !== 'owner' || user.orgId !== orgId) {
      console.log('❌ SSE connection denied - not owner or wrong org');
      return res.status(403).json({ 
        success: false, 
        error: 'Solo los propietarios pueden recibir notificaciones en tiempo real' 
      });
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({
      type: 'connection_established',
      timestamp: new Date().toISOString(),
      message: 'Conectado a notificaciones en tiempo real'
    })}\n\n`);

    // Store connection
    if (!sseConnections.has(orgId)) {
      sseConnections.set(orgId, new Set());
    }
    sseConnections.get(orgId)!.add(res);
    
    console.log(`✅ SSE connection established for org: ${orgId}, total connections: ${sseConnections.get(orgId)!.size}`);

    // Keep alive ping every 30 seconds
    const keepAlive = setInterval(() => {
      if (!res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() })}\n\n`);
      }
    }, 30000);

    // Handle client disconnect
    req.on('close', () => {
      console.log(`🔌 SSE client disconnected for org: ${orgId}`);
      clearInterval(keepAlive);
      
      const connections = sseConnections.get(orgId);
      if (connections) {
        connections.delete(res);
        if (connections.size === 0) {
          sseConnections.delete(orgId);
        }
        console.log(`🔗 Remaining connections for org ${orgId}: ${connections.size}`);
      }
    });

    req.on('error', (error) => {
      console.error('❌ SSE connection error:', error);
      clearInterval(keepAlive);
      
      const connections = sseConnections.get(orgId);
      if (connections) {
        connections.delete(res);
        if (connections.size === 0) {
          sseConnections.delete(orgId);
        }
      }
    });

  } catch (error) {
    console.error('❌ SSE endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Error estableciendo conexión SSE'
    });
  }
});

// POST /v1/notifications/send - Send notification to connected clients
app.post('/v1/notifications/send', authenticateToken, (req: any, res) => {
  try {
    const notification = req.body;
    console.log('📤 Received notification to send:', notification);

    if (!notification.type || !notification.data) {
      return res.status(400).json({
        success: false,
        error: 'Notification must have type and data fields'
      });
    }

    // Extract orgId from notification data
    const orgId = notification.data.orgId;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'Notification data must include orgId'
      });
    }

    // Get connections for this organization
    const connections = sseConnections.get(orgId);
    if (!connections || connections.size === 0) {
      console.log(`📡 No active connections for org: ${orgId}`);
      return res.json({
        success: true,
        message: 'No active connections for this organization',
        sentTo: 0
      });
    }

    // Send notification to all connected clients
    let sentCount = 0;
    const deadConnections = new Set();

    connections.forEach((connection) => {
      try {
        connection.write(`data: ${JSON.stringify(notification)}\n\n`);
        sentCount++;
      } catch (error) {
        console.error('❌ Error sending to connection:', error);
        deadConnections.add(connection);
      }
    });

    // Clean up dead connections
    deadConnections.forEach(conn => connections.delete(conn));

    console.log(`✅ Notification sent to ${sentCount} connections for org: ${orgId}`);

    res.json({
      success: true,
      message: 'Notification sent successfully',
      sentTo: sentCount
    });

  } catch (error) {
    console.error('❌ Send notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Error sending notification'
    });
  }
});

// GET /v1/notifications - Get notification history for organization
app.get('/v1/notifications', authenticateToken, (req: any, res) => {
  try {
    const user = req.user;
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;

    console.log(`📖 Getting notification history for org: ${user.orgId}, user: ${user.userId}`);
    
    // Verify user is owner
    if (user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Solo los propietarios pueden ver las notificaciones'
      });
    }

    // Filter notifications for this organization
    let orgNotifications = notificationsHistory.filter(n => n.orgId === user.orgId);
    
    // Filter by read status if requested
    if (unreadOnly === 'true') {
      orgNotifications = orgNotifications.filter(n => !n.isRead);
    }

    // Sort by creation date (newest first)
    orgNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const total = orgNotifications.length;
    const paginatedNotifications = orgNotifications.slice(Number(offset), Number(offset) + Number(limit));

    console.log(`✅ Returning ${paginatedNotifications.length} notifications (${total} total)`);

    res.json({
      success: true,
      notifications: paginatedNotifications,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + Number(limit) < total
      }
    });

  } catch (error) {
    console.error('❌ Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo historial de notificaciones'
    });
  }
});

// PUT /v1/notifications/:id/read - Mark notification as read
app.put('/v1/notifications/:id/read', authenticateToken, (req: any, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const notificationIndex = notificationsHistory.findIndex(n => 
      n.id === id && n.orgId === user.orgId
    );

    if (notificationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Notificación no encontrada'
      });
    }

    notificationsHistory[notificationIndex].isRead = true;

    res.json({
      success: true,
      message: 'Notificación marcada como leída'
    });

  } catch (error) {
    console.error('❌ Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Error marcando notificación como leída'
    });
  }
});

// PUT /v1/notifications/mark-all-read - Mark all notifications as read
app.put('/v1/notifications/mark-all-read', authenticateToken, (req: any, res) => {
  try {
    const user = req.user;

    let markedCount = 0;
    notificationsHistory.forEach(notification => {
      if (notification.orgId === user.orgId && !notification.isRead) {
        notification.isRead = true;
        markedCount++;
      }
    });

    res.json({
      success: true,
      message: `${markedCount} notificaciones marcadas como leídas`,
      markedCount
    });

  } catch (error) {
    console.error('❌ Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Error marcando todas las notificaciones como leídas'
    });
  }
});

// GET /v1/notifications/unread-count - Get unread notifications count
app.get('/v1/notifications/unread-count', authenticateToken, (req: any, res) => {
  try {
    const user = req.user;

    const unreadCount = notificationsHistory.filter(n => 
      n.orgId === user.orgId && !n.isRead
    ).length;

    res.json({
      success: true,
      unreadCount
    });

  } catch (error) {
    console.error('❌ Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo contador de notificaciones sin leer'
    });
  }
});

// Helper function to save notification to history
const saveNotificationToHistory = (orgId: string, notification: any): string => {
  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const storedNotification: StoredNotification = {
    id: notificationId,
    orgId: orgId,
    type: notification.type,
    data: notification.data,
    timestamp: notification.timestamp,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  notificationsHistory.push(storedNotification);
  console.log(`💾 Notification saved to history: ${notificationId} for org: ${orgId}`);
  
  return notificationId;
};

// Helper function to broadcast notification to organization
const broadcastNotificationToOrg = (orgId: string, notification: any) => {
  const connections = sseConnections.get(orgId);
  if (!connections || connections.size === 0) {
    console.log(`📡 No active connections for org: ${orgId}`);
    return 0;
  }

  let sentCount = 0;
  const deadConnections = new Set();

  connections.forEach((connection) => {
    try {
      connection.write(`data: ${JSON.stringify(notification)}\n\n`);
      sentCount++;
    } catch (error) {
      console.error('❌ Error broadcasting to connection:', error);
      deadConnections.add(connection);
    }
  });

  // Clean up dead connections
  deadConnections.forEach(conn => connections.delete(conn));

  console.log(`📤 Broadcasted notification to ${sentCount} connections for org: ${orgId}`);
  return sentCount;
};

// Combined function to save and broadcast notification
const processNotification = (orgId: string, notification: any) => {
  // Always save to history first
  const notificationId = saveNotificationToHistory(orgId, notification);
  
  // Then try to broadcast if there are active connections
  const sentCount = broadcastNotificationToOrg(orgId, {
    ...notification,
    id: notificationId // Include the saved notification ID
  });
  
  console.log(`📋 Notification processed: saved=${notificationId}, broadcast=${sentCount} connections`);
  return { notificationId, sentCount };
};

// Get user's organization
app.get('/v1/organizations/me', authenticateToken, (req: any, res) => {
  try {
    console.log('🏢 Getting organization for user:', req.user.userId);
    
    const user = users.find(u => u.id === req.user.userId);
    if (!user || !user.orgId) {
      return res.status(404).json({ success: false, error: 'El usuario no pertenece a ninguna organización' });
    }

    const organization = organizations.find(org => org.id === user.orgId);
    if (!organization) {
      return res.status(404).json({ success: false, error: 'Organización no encontrada' });
    }

    console.log('✅ Organization found:', organization.name);

    res.json({
      success: true,
      organization: organization,
      message: 'Organización del usuario obtenida exitosamente'
    });
  } catch (error) {
    console.error('❌ Get organization error:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Update organization settings
app.put('/v1/organizations/:orgId/settings', authenticateToken, (req: any, res) => {
  try {
    const { orgId } = req.params;
    const updates = req.body;

    console.log('🔧 Updating organization settings:', orgId);

    const user = users.find(u => u.id === req.user.userId);
    if (!user || user.role !== 'owner' || user.orgId !== orgId) {
      return res.status(403).json({ success: false, error: 'No tienes permisos para modificar esta organización' });
    }

    const orgIndex = organizations.findIndex(org => org.id === orgId);
    if (orgIndex === -1) {
      return res.status(404).json({ success: false, error: 'Organización no encontrada' });
    }

    const organization = organizations[orgIndex];
    
    console.log('📦 Received updates:', JSON.stringify(updates, null, 2));
    console.log('📋 Current organization before update:', JSON.stringify(organization, null, 2));
    
    // Update organization root-level fields
    if (updates.name !== undefined) {
      organization.name = updates.name;
    }
    if (updates.address !== undefined) {
      organization.address = updates.address;
    }
    if (updates.phone !== undefined) {
      organization.phone = updates.phone;
    }
    if (updates.email !== undefined) {
      organization.email = updates.email;
    }
    if (updates.currency !== undefined) {
      organization.currency = updates.currency;
    }
    
    // Update settings
    if (updates.timezone !== undefined) {
      organization.settings.timezone = updates.timezone;
    }
    if (updates.businessHours !== undefined) {
      organization.settings.businessHours = {
        ...organization.settings.businessHours,
        ...updates.businessHours,
      };
    }
    if (updates.notifications !== undefined) {
      organization.settings.notifications = {
        ...organization.settings.notifications,
        ...updates.notifications,
      };
    }
    if (updates.appointmentSystem !== undefined) {
      // Validar límites del plan básico
      if (organization.subscription.plan === 'free') {
        if (updates.appointmentSystem.maxProfessionals && updates.appointmentSystem.maxProfessionals > 5) {
          return res.status(400).json({ 
            success: false, 
            error: 'El plan básico permite máximo 5 profesionales. Actualiza tu plan para tener más.' 
          });
        }
        if (updates.appointmentSystem.maxResources && updates.appointmentSystem.maxResources > 5) {
          return res.status(400).json({ 
            success: false, 
            error: 'El plan básico permite máximo 5 recursos. Actualiza tu plan para tener más.' 
          });
        }
      }
      
      organization.settings.appointmentSystem = updates.appointmentSystem;
    }
    if (updates.businessInfo !== undefined) {
      organization.settings.businessInfo = updates.businessInfo;
    }
    if (updates.services !== undefined) {
      organization.settings.services = updates.services;
    }
    
    // Also sync to businessConfiguration for compatibility
    if (updates.appointmentSystem !== undefined) {
      organization.settings.businessConfiguration = {
        ...organization.settings.businessConfiguration,
        ...updates.appointmentSystem,
      };
    }

    organization.updatedAt = new Date().toISOString();
    organizations[orgIndex] = organization;
    
    console.log('💾 Organization after update:', JSON.stringify(organization, null, 2));

    console.log('✅ Organization updated successfully');

    res.json({
      success: true,
      organization: organization,
      message: 'Configuraciones de la organización actualizadas exitosamente'
    });
  } catch (error) {
    console.error('❌ Update organization error:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Debug endpoints (solo para desarrollo)
app.get('/debug/users', (req, res) => {
  res.json({
    success: true,
    count: users.length,
    users: users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
      profile: user.profile,
      createdAt: user.createdAt,
    }))
  });
});

app.get('/debug/organizations', (req, res) => {
  console.log('🔍 DEBUG ORGANIZATIONS - Raw data:');
  organizations.forEach(org => {
    console.log(`  Org ${org.id}:`, {
      name: org.name,
      subscription: org.subscription,
      trial: org.subscription?.trial
    });
  });

  res.json({
    success: true,
    count: organizations.length,
    organizations: organizations.map(org => ({
      id: org.id,
      name: org.name,
      templateType: org.templateType,
      subscription: org.subscription,
      trial: org.subscription?.trial, // Show trial info explicitly
      hasSubscription: !!org.subscription,
      hasTrial: !!org.subscription?.trial,
      createdAt: org.createdAt,
    }))
  });
});

// Debug endpoints for subscriptions
app.get('/debug/subscriptions', async (req, res) => {
  try {
    const { mockSubscriptionRepository } = await import('./mocks/subscriptionRepositoryMock');
    const stats = await mockSubscriptionRepository.getSubscriptionStats();
    
    res.json({
      success: true,
      message: 'Debug: All subscriptions data',
      stats,
    });
  } catch (error) {
    console.error('Debug subscriptions error:', error);
    res.status(500).json({
      success: false,
      error: 'Error retrieving debug subscriptions'
    });
  }
});

app.delete('/debug/subscriptions', async (req, res) => {
  try {
    const { mockSubscriptionRepository } = await import('./mocks/subscriptionRepositoryMock');
    await mockSubscriptionRepository.clearAll();
    
    res.json({
      success: true,
      message: 'Debug: All subscriptions cleared'
    });
  } catch (error) {
    console.error('Debug clear subscriptions error:', error);
    res.status(500).json({
      success: false,
      error: 'Error clearing subscriptions'
    });
  }
});

// Onboarding endpoints
app.get('/onboarding/status', authenticateToken, (req: any, res) => {
  try {
    const user = users.find(u => u.id === req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const onboardingStatus = user.onboardingStatus || {
      isCompleted: false,
      currentStep: 1,
      completedSteps: [],
      startedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      onboardingStatus
    });
  } catch (error) {
    console.error('❌ Get onboarding status error:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

app.post('/onboarding/update', authenticateToken, (req: any, res) => {
  try {
    console.log(`\n=== ONBOARDING UPDATE REQUEST ===`);
    console.log(`User: ${req.user.userId}`);
    console.log(`Request body:`, JSON.stringify(req.body, null, 2));

    const { stepNumber, stepData } = req.body;
    
    if (!stepNumber || !stepData) {
      return res.status(400).json({ success: false, error: 'stepNumber y stepData son requeridos' });
    }

    if (stepNumber < 1 || stepNumber > 5) {
      return res.status(400).json({ success: false, error: 'stepNumber debe estar entre 1 y 5' });
    }

    const userIndex = users.findIndex(u => u.id === req.user.userId);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const user = users[userIndex];
    
    // Initialize onboarding status if not exists
    if (!user.onboardingStatus) {
      user.onboardingStatus = {
        isCompleted: false,
        currentStep: 1,
        completedSteps: [],
        startedAt: new Date().toISOString(),
      };
    }

    const getStepName = (step: number) => {
      switch (step) {
        case 1: return 'industry_selection';
        case 2: return 'organization_setup';
        case 3: return 'business_configuration';
        case 4: return 'services_setup';
        case 5: return 'plan_selection';
        default: return 'unknown';
      }
    };

    const stepName = getStepName(stepNumber);

    // Validate step data
    const validateStepData = (step: number, data: any): { isValid: boolean; error?: string } => {
      switch (step) {
        case 1: // Industry Selection
          if (!data.industryType) {
            return { isValid: false, error: 'industryType es requerido para el paso 1' };
          }
          const validIndustries = ['beauty_salon', 'medical_clinic', 'hyperbaric_center', 'fitness_center', 'consultant', 'custom'];
          if (!validIndustries.includes(data.industryType)) {
            return { isValid: false, error: 'industryType inválido' };
          }
          break;

        case 2: // Organization Setup
          const requiredFields = ['businessName', 'timezone', 'currency'];
          for (const field of requiredFields) {
            if (!data[field]) {
              return { isValid: false, error: `${field} es requerido para el paso 2` };
            }
          }
          break;

        case 3: // Business Configuration
          const requiredConfigFields = ['appointmentModel', 'allowClientSelection', 'bufferBetweenAppointments', 'maxAdvanceBookingDays'];
          for (const field of requiredConfigFields) {
            if (data[field] === undefined || data[field] === null) {
              return { isValid: false, error: `${field} es requerido para el paso 3` };
            }
          }
          const validModels = ['professional_based', 'resource_based', 'hybrid'];
          if (!validModels.includes(data.appointmentModel)) {
            return { isValid: false, error: 'appointmentModel inválido' };
          }
          break;

        case 4: // Services Setup
          if (!data.services || !Array.isArray(data.services)) {
            return { isValid: false, error: 'array de services es requerido para el paso 4' };
          }
          for (const service of data.services) {
            if (!service.name || !service.duration || service.price === undefined) {
              return { isValid: false, error: 'Cada servicio debe tener name, duration y price' };
            }
          }
          break;

        case 5: // Plan Selection
          if (!data.planId) {
            return { isValid: false, error: 'planId es requerido para el paso 5' };
          }
          const validPlans = ['free', 'basic', 'premium'];
          if (!validPlans.includes(data.planId)) {
            return { isValid: false, error: 'planId inválido. Planes válidos: ' + validPlans.join(', ') };
          }
          break;
      }

      return { isValid: true };
    };

    console.log(`🔍 Validating step ${stepNumber} data...`);
    const validationResult = validateStepData(stepNumber, stepData);
    if (!validationResult.isValid) {
      console.log(`❌ Validation failed: ${validationResult.error}`);
      return res.status(400).json({ success: false, error: validationResult.error });
    }
    console.log(`✅ Validation passed for step ${stepNumber}`);

    const updatedStep = {
      stepNumber,
      stepName,
      isCompleted: true,
      completedAt: new Date().toISOString(),
      data: stepData,
    };

    // Update or add step
    const existingStepIndex = user.onboardingStatus.completedSteps.findIndex(s => s.stepNumber === stepNumber);
    if (existingStepIndex >= 0) {
      user.onboardingStatus.completedSteps[existingStepIndex] = updatedStep;
    } else {
      user.onboardingStatus.completedSteps.push(updatedStep);
    }

    // Update onboarding status - only complete when ALL 5 steps are done
    const isCompleted = user.onboardingStatus.completedSteps.length === 5;
    user.onboardingStatus.isCompleted = isCompleted;
    user.onboardingStatus.currentStep = isCompleted ? 5 : Math.min(stepNumber + 1, 5);
    user.onboardingStatus.completedSteps.sort((a, b) => a.stepNumber - b.stepNumber);
    
    if (stepNumber === 1) {
      user.onboardingStatus.industry = stepData.industryType;
    }
    
    if (isCompleted && !user.onboardingStatus.completedAt) {
      user.onboardingStatus.completedAt = new Date().toISOString();
    }

    user.updatedAt = new Date().toISOString();
    users[userIndex] = user;

    // Handle step-specific logic
    if (user.orgId) {
      const orgIndex = organizations.findIndex(org => org.id === user.orgId);
      if (orgIndex >= 0) {
        const org = organizations[orgIndex];
        
        switch (stepNumber) {
          case 1: // Industry Selection
            if (stepData.industryType) {
              org.templateType = stepData.industryType;
            }
            break;

          case 2: // Organization Setup
            if (stepData.businessName) org.name = stepData.businessName;
            if (stepData.businessAddress) org.address = stepData.businessAddress;
            if (stepData.businessPhone) org.phone = stepData.businessPhone;
            if (stepData.businessEmail) org.email = stepData.businessEmail;
            if (stepData.currency) org.currency = stepData.currency;
            if (stepData.timezone) org.settings.timezone = stepData.timezone;
            
            // Update business hours if provided
            if (stepData.businessHours) {
              org.settings.businessHours = {
                ...org.settings.businessHours,
                ...stepData.businessHours
              };
            }
            break;

          case 3: // Business Configuration
            if (!org.settings.businessConfiguration) {
              org.settings.businessConfiguration = {};
            }
            if (stepData.appointmentModel) org.settings.businessConfiguration.appointmentModel = stepData.appointmentModel;
            if (stepData.allowClientSelection !== undefined) org.settings.businessConfiguration.allowClientSelection = stepData.allowClientSelection;
            if (stepData.bufferBetweenAppointments) org.settings.businessConfiguration.bufferBetweenAppointments = stepData.bufferBetweenAppointments;
            if (stepData.maxAdvanceBookingDays) org.settings.businessConfiguration.maxAdvanceBookingDays = stepData.maxAdvanceBookingDays;
            break;

          case 4: // Services Setup
            if (stepData.services && Array.isArray(stepData.services)) {
              org.settings.services = stepData.services.map((service: any) => ({
                id: service.id || uuidv4(),
                name: service.name,
                description: service.description || '',
                duration: service.duration,
                price: service.price,
                isActive: service.isActive !== false
              }));
            }
            break;

          case 5: // Plan Selection
            if (stepData.planId) {
              console.log(`🎯 ONBOARDING STEP 5: Processing plan selection for ${stepData.planId}`);
              
              const getPlanLimits = (planId: string) => {
                switch (planId) {
                  case 'basic':
                    return { plan: 'basic' as const, maxResources: 5, maxAppointmentsPerMonth: 1000, maxUsers: 2 };
                  case 'professional':
                    return { plan: 'professional' as const, maxResources: 10, maxAppointmentsPerMonth: 2500, maxUsers: 5 };
                  case 'enterprise':
                    return { plan: 'enterprise' as const, maxResources: -1, maxAppointmentsPerMonth: -1, maxUsers: -1 };
                  default:
                    return { plan: 'basic' as const, maxResources: 5, maxAppointmentsPerMonth: 1000, maxUsers: 2 };
                }
              };

              const planLimits = getPlanLimits(stepData.planId);
              
              // Create subscription with trial for basic plan
              org.subscription = {
                plan: planLimits.plan,
                limits: {
                  maxResources: planLimits.maxResources,
                  maxAppointmentsPerMonth: planLimits.maxAppointmentsPerMonth,
                  maxUsers: planLimits.maxUsers
                }
              };

              // Add trial information for basic plan
              if (stepData.planId === 'basic') {
                const now = new Date();
                const trialDays = stepData.trialDays || 30;
                const endDate = new Date(now.getTime() + (trialDays * 24 * 60 * 60 * 1000));
                
                console.log(`📅 Adding trial: ${trialDays} days from ${now.toISOString()} to ${endDate.toISOString()}`);
                
                org.subscription.trial = {
                  isActive: true,
                  startDate: now.toISOString(),
                  endDate: endDate.toISOString(),
                  daysTotal: trialDays
                };
                
                console.log(`✅ Trial added to organization ${org.id}`);
              }
            }
            break;
        }

        org.updatedAt = new Date().toISOString();
        organizations[orgIndex] = org;
        
        console.log(`✅ Step ${stepNumber} (${stepName}) completed and organization updated`);
      }
    }

    res.json({
      success: true,
      message: 'Paso de onboarding actualizado exitosamente',
      onboardingStatus: user.onboardingStatus
    });
  } catch (error) {
    console.error('❌ Update onboarding step error:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

app.post('/onboarding/reset', authenticateToken, (req: any, res) => {
  try {
    const userIndex = users.findIndex(u => u.id === req.user.userId);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const user = users[userIndex];
    
    if (user.role !== 'owner') {
      return res.status(403).json({ success: false, error: 'Solo los propietarios pueden reiniciar el onboarding' });
    }

    user.onboardingStatus = {
      isCompleted: false,
      currentStep: 1,
      completedSteps: [],
      startedAt: new Date().toISOString(),
    };
    
    user.updatedAt = new Date().toISOString();
    users[userIndex] = user;

    res.json({
      success: true,
      message: 'Onboarding reiniciado exitosamente',
      onboardingStatus: user.onboardingStatus
    });
  } catch (error) {
    console.error('❌ Reset onboarding error:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// ===== PUBLIC BOOKING ROUTES =====

// GET /public/organization/{orgId} - Get public organization data
app.get('/public/organization/:orgId', (req, res) => {
  try {
    const { orgId } = req.params;
    
    console.log(`📋 Getting public organization data for: ${orgId}`);

    const organization = organizations.find(org => org.id === orgId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organización no encontrada',
      });
    }

    // Return only public information needed for booking
    const publicOrganizationData = {
      id: organization.id,
      name: organization.name,
      address: organization.address,
      phone: organization.phone,
      email: organization.email,
      currency: organization.currency,
      settings: {
        timezone: organization.settings.timezone,
        businessHours: organization.settings.businessHours,
        appointmentSystem: {
          appointmentModel: organization.settings.appointmentSystem?.appointmentModel || 'resource_based',
          allowClientSelection: organization.settings.appointmentSystem?.allowClientSelection || false,
          bufferBetweenAppointments: organization.settings.appointmentSystem?.bufferBetweenAppointments || 15,
          maxAdvanceBookingDays: organization.settings.appointmentSystem?.maxAdvanceBookingDays || 30,
          maxResources: organization.settings.appointmentSystem?.maxResources || 1,
          maxProfessionals: organization.settings.appointmentSystem?.maxProfessionals || 1,
        }
      }
    };

    console.log('✅ Public organization data retrieved successfully');

    res.json({
      success: true,
      organization: publicOrganizationData,
    });

  } catch (error) {
    console.error('❌ Error in getPublicOrganization:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

// GET /public/organization/{orgId}/services - Get active services
app.get('/public/organization/:orgId/services', (req, res) => {
  try {
    const { orgId } = req.params;
    
    console.log(`📋 Getting public services for organization: ${orgId}`);

    const organization = organizations.find(org => org.id === orgId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organización no encontrada',
      });
    }

    // Get only active services
    const activeServices = (organization.settings.services || [])
      .filter(service => service.isActive !== false)
      .map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
      }));

    console.log(`✅ Found ${activeServices.length} active services`);

    res.json({
      success: true,
      services: activeServices,
    });

  } catch (error) {
    console.error('❌ Error in getPublicServices:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

// GET /public/organization/{orgId}/professionals - Get active professionals
app.get('/public/organization/:orgId/professionals', (req, res) => {
  try {
    const { orgId } = req.params;
    
    console.log(`📋 Getting public professionals for organization: ${orgId}`);

    const organization = organizations.find(org => org.id === orgId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organización no encontrada',
      });
    }

    // Check if organization uses professional-based system
    const appointmentModel = organization.settings.appointmentSystem?.appointmentModel;
    
    if (appointmentModel !== 'professional_based') {
      return res.json({
        success: true,
        professionals: [],
        message: 'Esta organización no utiliza sistema basado en profesionales',
      });
    }

    // Get only active professionals
    const activeProfessionals = (organization.settings.appointmentSystem?.professionals || [])
      .filter(professional => professional.isActive)
      .map(professional => ({
        id: professional.id,
        name: professional.name,
        photo: professional.photo,
      }));

    console.log(`✅ Found ${activeProfessionals.length} active professionals`);

    res.json({
      success: true,
      professionals: activeProfessionals,
    });

  } catch (error) {
    console.error('❌ Error in getPublicProfessionals:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

// GET /public/organization/{orgId}/availability/daily-counts - Get daily availability counts
app.get('/public/organization/:orgId/availability/daily-counts', (req, res) => {
  try {
    const { orgId } = req.params;
    const { professionalId, dates, serviceDuration } = req.query;
    const duration = parseInt(serviceDuration as string || '60');
    
    if (!dates) {
      return res.status(400).json({
        success: false,
        message: 'Fechas requeridas',
      });
    }

    const datesArray = (dates as string).split(',');

    console.log(`📋 Getting daily availability counts for org: ${orgId}, professional: ${professionalId}, dates: ${datesArray.join(', ')}`);

    const organization = organizations.find(org => org.id === orgId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organización no encontrada',
      });
    }

    const dailyCounts = [];

    for (const date of datesArray) {
      const requestDate = new Date(date);
      const dayName = requestDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const businessDay = organization.settings.businessHours[dayName];

      if (!businessDay?.isOpen) {
        dailyCounts.push({
          date,
          availableSlots: 0
        });
        continue;
      }

      // Generate time slots for this date
      const startTime = businessDay.openTime;
      const endTime = businessDay.closeTime;
      const buffer = organization.settings.appointmentSystem?.bufferBetweenAppointments || 15;

      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      // Get existing appointments for this date and organization
      const existingAppointments = appointments.filter(apt => 
        apt.organizationId === orgId && apt.date === date && apt.status !== 'cancelled' && apt.status !== 'no_show'
      );
      console.log(`📅 [Daily Dev] Found ${existingAppointments.length} existing appointments for ${date} in org ${orgId}`);

      let availableSlotCount = 0;
      const appointmentModel = organization.settings.appointmentSystem?.appointmentModel;

      for (let minutes = startMinutes; minutes + duration <= endMinutes; minutes += duration + buffer) {
        const hour = Math.floor(minutes / 60);
        const min = minutes % 60;
        const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        
        // Count existing appointments at this time slot
        const appointmentsAtTime = existingAppointments.filter(apt => apt.time === timeString);
        console.log(`🔍 [Daily Dev] Time slot ${timeString}: Found ${appointmentsAtTime.length} existing appointments`);
        
        if (appointmentModel === 'resource_based') {
          // For resource-based, calculate remaining slots
          const maxResources = organization.settings.appointmentSystem?.maxResources || 1;
          const occupiedSlots = appointmentsAtTime.length;
          const availableAtThisTime = Math.max(0, maxResources - occupiedSlots);
          availableSlotCount += availableAtThisTime;
          console.log(`📊 [Daily Dev Resource] ${timeString}: ${availableAtThisTime}/${maxResources} slots available`);
        } else {
          // For professional-based, check if time slot is available
          if (professionalId) {
            // Check if this specific professional is available
            const professionalBooked = appointmentsAtTime.some(apt => 
              apt.professionalId === professionalId
            );
            if (!professionalBooked) {
              availableSlotCount += 1;
            }
            console.log(`📊 [Daily Dev Prof] ${timeString}: Professional ${professionalId} ${professionalBooked ? 'booked' : 'available'}`);
          } else {
            // Check if any professional can take this slot
            const totalProfessionals = organization.settings.appointmentSystem?.maxProfessionals || 1;
            const occupiedSlots = appointmentsAtTime.length;
            const availableAtThisTime = Math.max(0, totalProfessionals - occupiedSlots);
            availableSlotCount += availableAtThisTime > 0 ? 1 : 0;
            console.log(`📊 [Daily Dev General] ${timeString}: ${occupiedSlots}/${totalProfessionals} professionals booked`);
          }
        }
      }

      dailyCounts.push({
        date,
        availableSlots: availableSlotCount
      });
    }

    console.log(`✅ Generated daily counts for ${datesArray.length} dates`);

    res.json({
      success: true,
      dailyCounts,
    });

  } catch (error) {
    console.error('❌ Error in getPublicDailyAvailabilityCounts:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

// GET /public/organization/{orgId}/availability - Get availability slots
app.get('/public/organization/:orgId/availability', (req, res) => {
  try {
    const { orgId } = req.params;
    const { professionalId, date, serviceDuration } = req.query;
    const duration = parseInt(serviceDuration as string || '60');
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Fecha requerida',
      });
    }

    console.log(`📋 Getting availability for org: ${orgId}, professional: ${professionalId}, date: ${date}`);

    const organization = organizations.find(org => org.id === orgId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organización no encontrada',
      });
    }

    // Get business hours for the requested date
    const requestDate = new Date(date as string);
    const dayName = requestDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const businessDay = organization.settings.businessHours[dayName];

    if (!businessDay?.isOpen) {
      return res.json({
        success: true,
        availability: [],
        message: 'No hay horarios disponibles para esta fecha',
      });
    }

    // Generate time slots
    const startTime = businessDay.openTime;
    const endTime = businessDay.closeTime;
    const buffer = organization.settings.appointmentSystem?.bufferBetweenAppointments || 15;

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Get existing appointments for this date and organization
    const existingAppointments = appointments.filter(apt => 
      apt.organizationId === orgId && apt.date === date && apt.status !== 'cancelled' && apt.status !== 'no_show'
    );
    console.log(`📅 [Availability Dev] Found ${existingAppointments.length} existing appointments for ${date} in org ${orgId}`);

    const availableSlots = [];
    const appointmentModel = organization.settings.appointmentSystem?.appointmentModel;

    for (let minutes = startMinutes; minutes + duration <= endMinutes; minutes += duration + buffer) {
      const hour = Math.floor(minutes / 60);
      const min = minutes % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      
      // Count existing appointments at this time slot
      const appointmentsAtTime = existingAppointments.filter(apt => apt.time === timeString);
      console.log(`🔍 [Availability Dev] Time slot ${timeString}: Found ${appointmentsAtTime.length} existing appointments`);
      
      if (appointmentModel === 'resource_based') {
        // For resource-based systems, calculate remaining slots
        const maxResources = organization.settings.appointmentSystem?.maxResources || 1;
        const occupiedSlots = appointmentsAtTime.length;
        const availableCount = Math.max(0, maxResources - occupiedSlots);
        
        availableSlots.push({
          time: timeString,
          available: availableCount > 0,
          availableCount: availableCount,
          professionalId: null,
        });
        console.log(`📊 [Availability Dev Resource] ${timeString}: ${availableCount}/${maxResources} slots available`);
      } else {
        // For professional-based systems, check availability
        let isAvailable = false;
        let availableCount = 0;
        
        if (professionalId) {
          // Check if this specific professional is available
          const professionalBooked = appointmentsAtTime.some(apt => 
            apt.professionalId === professionalId
          );
          isAvailable = !professionalBooked;
          availableCount = isAvailable ? 1 : 0;
          console.log(`📊 [Availability Dev Prof] ${timeString}: Professional ${professionalId} ${professionalBooked ? 'booked' : 'available'}`);
        } else {
          // Check if any professional can take this slot
          const totalProfessionals = organization.settings.appointmentSystem?.maxProfessionals || 1;
          const occupiedSlots = appointmentsAtTime.length;
          availableCount = Math.max(0, totalProfessionals - occupiedSlots);
          isAvailable = availableCount > 0;
          console.log(`📊 [Availability Dev General] ${timeString}: ${occupiedSlots}/${totalProfessionals} professionals booked`);
        }
        
        availableSlots.push({
          time: timeString,
          available: isAvailable,
          availableCount: availableCount,
          professionalId: professionalId || null,
        });
      }
    }

    console.log(`✅ Generated ${availableSlots.length} available slots`);

    res.json({
      success: true,
      availability: availableSlots,
      date: date,
      professionalId: professionalId || null,
    });

  } catch (error) {
    console.error('❌ Error in getPublicAvailability:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

// POST /public/organization/{orgId}/appointments - Create public appointment
app.post('/public/organization/:orgId/appointments', (req, res) => {
  try {
    const { orgId } = req.params;
    const appointmentData = req.body;
    
    // Validate required fields
    const requiredFields = ['serviceId', 'date', 'time', 'clientName', 'clientPhone', 'clientEmail'];
    const missingFields = requiredFields.filter(field => !appointmentData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Campos requeridos faltantes: ${missingFields.join(', ')}`,
      });
    }

    console.log(`📋 Creating public appointment for organization: ${orgId}`);
    console.log('Appointment data:', JSON.stringify(appointmentData, null, 2));

    const organization = organizations.find(org => org.id === orgId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organización no encontrada',
      });
    }

    // Validate service exists
    const service = organization.settings.services?.find(s => s.id === appointmentData.serviceId);
    if (!service || service.isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Servicio no encontrado o no disponible',
      });
    }

    // Validate professional if required
    if (appointmentData.professionalId) {
      const professional = organization.settings.appointmentSystem?.professionals?.find(
        p => p.id === appointmentData.professionalId && p.isActive
      );
      if (!professional) {
        return res.status(400).json({
          success: false,
          message: 'Profesional no encontrado o no disponible',
        });
      }
    }

    // Check if time slot is still available before creating
    const existingAppointments = appointments.filter(apt => 
      apt.organizationId === orgId && apt.date === appointmentData.date && apt.status !== 'cancelled' && apt.status !== 'no_show'
    );
    
    const appointmentsAtTime = existingAppointments.filter(apt => apt.time === appointmentData.time);
    const appointmentModel = organization.settings.appointmentSystem?.appointmentModel;
    let canBook = false;

    if (appointmentModel === 'resource_based') {
      const maxResources = organization.settings.appointmentSystem?.maxResources || 1;
      const occupiedSlots = appointmentsAtTime.length;
      canBook = occupiedSlots < maxResources;
      console.log(`🔍 [Create Dev Resource] Time ${appointmentData.time}: ${occupiedSlots}/${maxResources} slots occupied, can book: ${canBook}`);
    } else {
      if (appointmentData.professionalId) {
        // Check if specific professional is available
        const professionalBooked = appointmentsAtTime.some(apt => 
          apt.professionalId === appointmentData.professionalId
        );
        canBook = !professionalBooked;
        console.log(`🔍 [Create Dev Prof] Time ${appointmentData.time}: Professional ${appointmentData.professionalId} ${professionalBooked ? 'booked' : 'available'}`);
      } else {
        // Check if any professional can take this slot
        const totalProfessionals = organization.settings.appointmentSystem?.maxProfessionals || 1;
        const occupiedSlots = appointmentsAtTime.length;
        canBook = occupiedSlots < totalProfessionals;
        console.log(`🔍 [Create Dev General] Time ${appointmentData.time}: ${occupiedSlots}/${totalProfessionals} professionals booked, can book: ${canBook}`);
      }
    }

    if (!canBook) {
      return res.status(409).json({
        success: false,
        message: 'El horario seleccionado ya no está disponible. Por favor selecciona otro horario.',
      });
    }

    // Create the appointment
    const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newAppointment = {
      id: appointmentId,
      organizationId: orgId,
      serviceId: appointmentData.serviceId,
      serviceName: service.name,
      servicePrice: service.price,
      serviceDuration: service.duration,
      professionalId: appointmentData.professionalId || null,
      date: appointmentData.date,
      time: appointmentData.time,
      clientName: appointmentData.clientName,
      clientPhone: appointmentData.clientPhone,
      clientEmail: appointmentData.clientEmail,
      notes: appointmentData.notes || '',
      status: appointmentData.status || 'pending', // ✅ Usar status del frontend o default a pending
      createdAt: new Date().toISOString(),
    };

    // Save to in-memory appointments array
    console.log('🔧 Before push - appointments length:', appointments.length);
    appointments.push(newAppointment);
    console.log('✅ Public appointment created successfully:', appointmentId);
    console.log('✅ Total appointments now:', appointments.length);
    console.log('🔧 Last appointment in array:', appointments[appointments.length - 1]);

    // Send real-time notification to organization owners
    const notificationData = {
      type: 'appointment_created',
      data: {
        appointmentId: appointmentId,
        clientName: appointmentData.clientName,
        serviceName: service.name,
        professionalName: appointmentData.professionalId ? 
          organization.settings.appointmentSystem?.professionals?.find(p => p.id === appointmentData.professionalId)?.name || 'No especificado'
          : 'No especificado',
        date: appointmentData.date,
        time: appointmentData.time,
        orgId: orgId,
        title: 'Nueva cita pendiente de confirmación',
        message: `${appointmentData.clientName} ha solicitado una cita para ${service.name} - Pendiente de confirmación`,
        category: 'appointment',
        priority: 'high',
      },
      timestamp: new Date().toISOString(),
    };

    console.log('📤 Processing notification for new public appointment...');
    const result = processNotification(orgId, notificationData);
    console.log(`✅ Notification processed: ID=${result.notificationId}, sent to ${result.sentCount} connections`);

    res.status(201).json({
      success: true,
      appointment: newAppointment,
      message: 'Cita creada exitosamente',
    });

  } catch (error) {
    console.error('❌ Error in createPublicAppointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

// =============================================
// APPOINTMENT MANAGEMENT ENDPOINTS (PRIVATE)
// =============================================

// Mock appointments storage - starting empty
const appointments: any[] = [];

// GET /appointments - Get appointments with filters
app.get('/appointments', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate, staffId, resourceId, status } = req.query;
    const user = (req as any).user;
    
    console.log('🔧 GET /appointments called with:', { startDate, endDate, staffId, resourceId, status });
    console.log('🔧 User orgId:', user.orgId);
    console.log('🔧 Total appointments in array:', appointments.length);
    console.log('🔧 Sample appointments:', appointments.map(apt => ({ id: apt.id, date: apt.date, datetime: apt.datetime, orgId: apt.orgId, organizationId: apt.organizationId })));
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    // First filter by organization
    let filteredAppointments = appointments.filter(apt => {
      // Handle both orgId and organizationId fields
      const aptOrgId = apt.orgId || apt.organizationId;
      const matches = aptOrgId === user.orgId;
      console.log('🔧 Org filter - apt orgId:', aptOrgId, 'user orgId:', user.orgId, 'matches:', matches);
      return matches;
    });

    console.log('🔧 After organization filter:', filteredAppointments.length, 'appointments');

    // Filter by date range
    filteredAppointments = filteredAppointments.filter(apt => {
      // Handle both old format (datetime) and new format (date + time)
      let aptDate: string;
      if (apt.datetime) {
        aptDate = new Date(apt.datetime).toISOString().split('T')[0];
      } else if (apt.date) {
        aptDate = apt.date; // Already in YYYY-MM-DD format
      } else {
        console.error('Invalid appointment date format:', apt);
        return false;
      }
      const inRange = aptDate >= startDate && aptDate <= endDate;
      console.log('🔧 Date filter - aptDate:', aptDate, 'range:', startDate, '-', endDate, 'inRange:', inRange);
      return inRange;
    });

    console.log('🔧 After date filter:', filteredAppointments.length, 'appointments');

    // Filter by staff (handle both staffId and professionalId)
    if (staffId) {
      filteredAppointments = filteredAppointments.filter(apt => 
        apt.staffId === staffId || apt.professionalId === staffId
      );
    }

    // Filter by resource
    if (resourceId) {
      filteredAppointments = filteredAppointments.filter(apt => apt.resourceId === resourceId);
    }

    // Filter by status
    if (status) {
      filteredAppointments = filteredAppointments.filter(apt => apt.status === status);
    }

    console.log('🔧 Final result:', filteredAppointments.length, 'appointments');
    console.log('🔧 Returning appointments:', filteredAppointments.map(apt => ({ id: apt.id, date: apt.date, client: apt.clientName || apt.clientInfo?.name })));

    res.json({
      success: true,
      data: filteredAppointments,
      total: filteredAppointments.length
    });
  } catch (error) {
    console.error('Error getting appointments:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /appointments - Create appointment
app.post('/appointments', authenticateToken, (req, res) => {
  try {
    const appointmentData = req.body;
    const user = (req as any).user;

    const newAppointment = {
      id: uuidv4(),
      orgId: user.orgId,
      ...appointmentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    appointments.push(newAppointment);

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: newAppointment
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /appointments/:id - Get single appointment
app.get('/appointments/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const appointment = appointments.find(apt => apt.id === id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error getting appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PUT /appointments/:id - Update appointment
app.put('/appointments/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const appointmentIndex = appointments.findIndex(apt => apt.id === id);

    if (appointmentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    appointments[appointmentIndex] = {
      ...appointments[appointmentIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: appointments[appointmentIndex]
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /appointments/:id/cancel - Cancel appointment
app.post('/appointments/:id/cancel', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const appointmentIndex = appointments.findIndex(apt => apt.id === id);

    if (appointmentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    appointments[appointmentIndex] = {
      ...appointments[appointmentIndex],
      status: 'cancelled',
      cancelReason: reason,
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: appointments[appointmentIndex]
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /appointments/:id/confirm - Confirm appointment
app.post('/appointments/:id/confirm', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const appointmentIndex = appointments.findIndex(apt => apt.id === id);

    if (appointmentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    appointments[appointmentIndex] = {
      ...appointments[appointmentIndex],
      status: 'confirmed',
      confirmedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Appointment confirmed successfully',
      data: appointments[appointmentIndex]
    });
  } catch (error) {
    console.error('Error confirming appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /appointments/:id/complete - Complete appointment
app.post('/appointments/:id/complete', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const appointmentIndex = appointments.findIndex(apt => apt.id === id);

    if (appointmentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    appointments[appointmentIndex] = {
      ...appointments[appointmentIndex],
      status: 'completed',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Appointment completed successfully',
      data: appointments[appointmentIndex]
    });
  } catch (error) {
    console.error('Error completing appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /appointments/stats - Get appointment statistics
app.get('/appointments/stats', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const user = (req as any).user;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    // Filter appointments by date range and organization
    const orgAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.datetime).toISOString().split('T')[0];
      return apt.orgId === user.orgId && aptDate >= startDate && aptDate <= endDate;
    });

    const stats = {
      total: orgAppointments.length,
      confirmed: orgAppointments.filter(apt => apt.status === 'confirmed').length,
      pending: orgAppointments.filter(apt => apt.status === 'pending').length,
      completed: orgAppointments.filter(apt => apt.status === 'completed').length,
      cancelled: orgAppointments.filter(apt => apt.status === 'cancelled').length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting appointment stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// =============================================
// DEBUG ENDPOINTS
// =============================================

// Debug endpoint for filtered appointments (no auth for testing)
app.get('/debug/appointments/filtered', (req, res) => {
  try {
    const { startDate, endDate, staffId, resourceId, status } = req.query;
    
    console.log('🔧 Debug filtered appointments called with:', { startDate, endDate, staffId, resourceId, status });
    console.log('🔧 Total appointments in array:', appointments.length);
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    let filteredAppointments = [...appointments];

    // Filter by date range
    filteredAppointments = filteredAppointments.filter(apt => {
      // Handle both old format (datetime) and new format (date + time)
      let aptDate: string;
      if (apt.datetime) {
        aptDate = new Date(apt.datetime).toISOString().split('T')[0];
      } else if (apt.date) {
        aptDate = apt.date; // Already in YYYY-MM-DD format
      } else {
        console.error('Invalid appointment date format:', apt);
        return false;
      }
      console.log('🔧 Comparing aptDate:', aptDate, 'with range:', startDate, '-', endDate);
      return aptDate >= startDate && aptDate <= endDate;
    });

    console.log('🔧 Filtered appointments after date filter:', filteredAppointments.length);

    // Filter by staff (handle both staffId and professionalId)
    if (staffId) {
      filteredAppointments = filteredAppointments.filter(apt => 
        apt.staffId === staffId || apt.professionalId === staffId
      );
      console.log('🔧 Filtered appointments after staff filter:', filteredAppointments.length);
    }

    // Filter by resource
    if (resourceId) {
      filteredAppointments = filteredAppointments.filter(apt => apt.resourceId === resourceId);
      console.log('🔧 Filtered appointments after resource filter:', filteredAppointments.length);
    }

    // Filter by status
    if (status) {
      filteredAppointments = filteredAppointments.filter(apt => apt.status === status);
      console.log('🔧 Filtered appointments after status filter:', filteredAppointments.length);
    }

    res.json({
      success: true,
      data: filteredAppointments,
      total: filteredAppointments.length
    });
  } catch (error) {
    console.error('Error getting filtered appointments:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Debug endpoint to see all appointments (no auth required for debugging)
app.get('/debug/appointments', (req, res) => {
  try {
    console.log('🔧 Debug appointments called, length:', appointments.length);
    console.log('🔧 Appointments array:', JSON.stringify(appointments, null, 2));
    
    res.json({
      success: true,
      message: 'Debug: All appointments data',
      total: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Debug appointments error:', error);
    res.status(500).json({
      success: false,
      error: 'Error retrieving debug appointments'
    });
  }
});

// Debug endpoint to clear all appointments
app.delete('/debug/appointments', (req, res) => {
  try {
    const deletedCount = appointments.length;
    appointments.length = 0; // Clear the array
    
    res.json({
      success: true,
      message: `Debug: Cleared ${deletedCount} appointments`,
      deletedCount
    });
  } catch (error) {
    console.error('Debug clear appointments error:', error);
    res.status(500).json({
      success: false,
      error: 'Error clearing appointments'
    });
  }
});

// Debug endpoint for SSE connections
app.get('/debug/notifications/connections', (req, res) => {
  try {
    const connectionStats = {};
    
    sseConnections.forEach((connections, orgId) => {
      connectionStats[orgId] = connections.size;
    });

    res.json({
      success: true,
      message: 'Debug: SSE connections status',
      totalOrganizations: sseConnections.size,
      connectionStats,
      totalConnections: Array.from(sseConnections.values()).reduce((sum, set) => sum + set.size, 0)
    });
  } catch (error) {
    console.error('Debug SSE connections error:', error);
    res.status(500).json({
      success: false,
      error: 'Error retrieving SSE connections debug info'
    });
  }
});

// Debug endpoint to test notification sending
app.post('/debug/notifications/test', (req, res) => {
  try {
    const { orgId, message = 'Test notification' } = req.body;
    
    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'orgId is required'
      });
    }

    const testNotification = {
      type: 'appointment_created',
      data: {
        appointmentId: 'test-' + Date.now(),
        clientName: 'Cliente Test',
        serviceName: 'Servicio Test',
        professionalName: 'Profesional Test',
        date: new Date().toISOString().split('T')[0],
        time: '14:30',
        orgId: orgId,
        title: 'Test - Nueva cita agendada',
        message: message,
        category: 'appointment',
        priority: 'high',
      },
      timestamp: new Date().toISOString(),
    };

    const sentTo = broadcastNotificationToOrg(orgId, testNotification);

    res.json({
      success: true,
      message: 'Test notification sent',
      sentTo,
      notification: testNotification
    });
  } catch (error) {
    console.error('Debug test notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Error sending test notification'
    });
  }
});

// Debug endpoint to reset appointments to initial test data
app.post('/debug/appointments/reset', (req, res) => {
  try {
    // Clear existing appointments
    appointments.length = 0;
    
    // Add initial test data back
    const testAppointments = [
      {
        id: 'apt-1',
        orgId: 'org-test-123',
        staffId: 'prof-1',
        resourceId: null,
        clientInfo: {
          name: 'María González',
          phone: '+34 666 123 456',
          email: 'maria@example.com'
        },
        serviceInfo: {
          name: 'Corte y Peinado',
          duration: 90,
          price: 45
        },
        datetime: '2025-08-01T09:00:00.000Z',
        duration: 90,
        status: 'confirmed',
        assignmentType: 'staff_only',
        notes: 'Cliente regular, prefiere el estilo clásico',
        createdAt: '2025-08-01T08:00:00.000Z',
        updatedAt: '2025-08-01T08:00:00.000Z'
      },
      {
        id: 'apt-2',
        orgId: 'org-test-123',
        staffId: 'prof-2',
        resourceId: null,
        clientInfo: {
          name: 'Ana Rodríguez',
          phone: '+34 666 789 012',
          email: 'ana@example.com'
        },
        serviceInfo: {
          name: 'Coloración',
          duration: 120,
          price: 85
        },
        datetime: '2025-08-01T11:00:00.000Z',
        duration: 120,
        status: 'confirmed',
        assignmentType: 'staff_only',
        notes: 'Coloración completa con mechas',
        createdAt: '2025-08-01T08:00:00.000Z',
        updatedAt: '2025-08-01T08:00:00.000Z'
      },
      {
        id: 'apt-3',
        orgId: 'org-test-123',
        staffId: null,
        resourceId: 'res-1',
        clientInfo: {
          name: 'Carmen López',
          phone: '+34 666 345 678',
          email: 'carmen@example.com'
        },
        serviceInfo: {
          name: 'Sala de Reuniones',
          duration: 60,
          price: 30
        },
        datetime: '2025-08-01T15:00:00.000Z',
        duration: 60,
        status: 'pending',
        assignmentType: 'resource_only',
        notes: 'Reunión de equipo de 10 personas',
        createdAt: '2025-08-01T08:00:00.000Z',
        updatedAt: '2025-08-01T08:00:00.000Z'
      },
      {
        id: 'apt-4',
        orgId: 'org-test-123',
        staffId: 'prof-1',
        resourceId: null,
        clientInfo: {
          name: 'Isabel Martín',
          phone: '+34 666 901 234',
          email: 'isabel@example.com'
        },
        serviceInfo: {
          name: 'Tratamiento Facial',
          duration: 90,
          price: 65
        },
        datetime: '2025-08-01T16:30:00.000Z',
        duration: 90,
        status: 'confirmed',
        assignmentType: 'staff_only',
        notes: 'Tratamiento hidratante y rejuvenecedor',
        createdAt: '2025-08-01T08:00:00.000Z',
        updatedAt: '2025-08-01T08:00:00.000Z'
      }
    ];
    
    appointments.push(...testAppointments);
    
    res.json({
      success: true,
      message: 'Debug: Reset appointments to initial test data',
      total: appointments.length,
      data: testAppointments
    });
  } catch (error) {
    console.error('Debug reset appointments error:', error);
    res.status(500).json({
      success: false,
      error: 'Error resetting appointments'
    });
  }
});

// =============================================
// ONECLICK ENDPOINTS (LOCAL DEVELOPMENT)
// =============================================

// OneClick Start Inscription
app.post('/v1/transbank/oneclick/start-inscription', authenticateToken, async (req, res) => {
  try {
    console.log('🔷 OneClick Start Inscription (Local Dev)');
    const { username, email, returnUrl } = req.body;
    
    if (!username || !email || !returnUrl) {
      return res.status(400).json({
        success: false,
        error: 'Username, email y returnUrl requeridos'
      });
    }

    // Import and use transbankService directly
    const { transbankService } = require('./services/transbankService');
    
    const result = await transbankService.startOneclickInscription({
      username,
      email,
      returnUrl
    });
    
    res.json({
      success: true,
      message: 'Inscripción OneClick iniciada exitosamente',
      data: result
    });
  } catch (error) {
    console.error('❌ OneClick start inscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Error iniciando inscripción OneClick: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// OneClick Finish Inscription
app.post('/v1/transbank/oneclick/finish-inscription', authenticateToken, async (req, res) => {
  try {
    console.log('🔷 OneClick Finish Inscription (Local Dev)');
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token requerido'
      });
    }

    const { transbankService } = require('./services/transbankService');
    
    const result = await transbankService.finishOneclickInscription({ token });
    
    res.json({
      success: true,
      message: 'Inscripción OneClick finalizada exitosamente',
      data: result
    });
  } catch (error) {
    console.error('❌ OneClick finish inscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Error finalizando inscripción OneClick: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// Public endpoint - Complete OneClick Inscription and Start Trial 
// No authentication required as we validate using OneClick token and stored data
app.post('/public/transbank/oneclick/complete-inscription', async (req, res) => {
  try {
    console.log('🔷 Complete OneClick Inscription and Start Trial (Public - No Auth Required)');
    const { token, planData } = req.body;
    
    if (!token || !planData) {
      return res.status(400).json({
        success: false,
        error: 'Token y datos del plan requeridos'
      });
    }

    // Validate required fields in planData
    if (!planData.organizationId || !planData.planId || !planData.oneclickData?.username) {
      return res.status(400).json({
        success: false,
        error: 'Datos del plan incompletos (organizationId, planId, oneclickData requeridos)'
      });
    }

    console.log('🔹 Processing OneClick completion for org:', planData.organizationId);

    const { transbankService } = require('./services/transbankService');
    
    // 1. Finish OneClick inscription
    console.log('🔹 Step 1: Finishing OneClick inscription...');
    console.log('🔹 Token length:', token.length);
    console.log('🔹 Token prefix:', token.substring(0, 20) + '...');
    
    let inscriptionResult;
    try {
      inscriptionResult = await transbankService.finishOneclickInscription({ token });
      console.log('🔹 Inscription result:', inscriptionResult);
    } catch (inscriptionError) {
      console.error('❌ Error in finishOneclickInscription:', inscriptionError);
      return res.status(400).json({
        success: false,
        error: 'Error procesando la inscripción OneClick: ' + (inscriptionError instanceof Error ? inscriptionError.message : 'Error desconocido')
      });
    }
    
    if (!inscriptionResult.success) {
      console.error('❌ Inscription not successful:', inscriptionResult);
      return res.status(400).json({
        success: false,
        error: 'La inscripción OneClick no pudo ser completada. Respuesta: ' + JSON.stringify(inscriptionResult)
      });
    }

    // 2. Create trial subscription with OneClick data
    console.log('🔹 Step 2: Creating trial subscription...');
    const now = Math.floor(Date.now() / 1000);
    const trialDays = planData.trialDays || 30;
    const trialEnd = now + (trialDays * 24 * 60 * 60);
    const periodEnd = now + (30 * 24 * 60 * 60);

    const subscription = {
      id: `sub_trial_oneclick_${Date.now()}`,
      organizationId: planData.organizationId,
      customerId: `cus_${planData.organizationId}`,
      planId: planData.planId,
      planName: planData.planName || 'Plan Básico',
      status: 'trialing',
      current_period_start: now,
      current_period_end: periodEnd,
      trial_start: now,
      trial_end: trialEnd,
      amount: planData.transbankAmount || 14990,
      currency: 'CLP',
      interval: 'month',
      payment_method: 'transbank_oneclick',
      // OneClick specific data
      oneclick_username: planData.oneclickData?.username,
      oneclick_user_id: inscriptionResult.tbkUser,
      oneclick_inscription_token: token,
      oneclick_inscription_date: now,
      oneclick_active: true, // Now active after successful inscription
      oneclick_card_type: inscriptionResult.cardType,
      oneclick_card_number: inscriptionResult.cardNumber,
      payment_attempts: 0,
    };

    // Store subscription in development storage
    devSubscriptions.push(subscription as DevSubscription);
    
    console.log('✅ OneClick inscription completed and trial created:', {
      subscription: subscription.id,
      tbkUser: inscriptionResult.tbkUser,
      cardType: inscriptionResult.cardType,
      cardNumber: inscriptionResult.cardNumber
    });
    console.log('📊 Total devSubscriptions:', devSubscriptions.length);
    
    res.json({
      success: true,
      message: 'Inscripción OneClick completada y trial iniciado exitosamente',
      data: { 
        subscription,
        oneclick: {
          tbkUser: inscriptionResult.tbkUser,
          cardType: inscriptionResult.cardType,
          cardNumber: inscriptionResult.cardNumber,
          inscriptionDate: now
        }
      }
    });
  } catch (error) {
    console.error('❌ Complete OneClick inscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Error completando inscripción OneClick: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// Get OneClick Status for organization
app.get('/v1/transbank/oneclick/status/:organizationId', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Getting OneClick status for org:', req.params.organizationId);
    const user = (req as any).user;
    const { organizationId } = req.params;
    
    // Verify user has access to organization
    if (user.orgId !== organizationId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para esta organización'
      });
    }

    // Check if there's a subscription with OneClick data for this organization
    const oneclickSubscription = devSubscriptions.find((sub: DevSubscription) => 
      sub.organizationId === organizationId && 
      sub.oneclick_active && 
      sub.oneclick_user_id
    );

    console.log('🔍 Searching in devSubscriptions:', devSubscriptions.length, 'subscriptions');
    console.log('🔍 Looking for organizationId:', organizationId);

    if (oneclickSubscription) {
      const oneclickStatus = {
        hasOneClick: true,
        username: oneclickSubscription.oneclick_username,
        userId: oneclickSubscription.oneclick_user_id,
        inscriptionDate: oneclickSubscription.oneclick_inscription_date,
        cardType: oneclickSubscription.oneclick_card_type,
        cardNumber: oneclickSubscription.oneclick_card_number,
        authorizationCode: oneclickSubscription.oneclick_authorization_code,
        paymentMethod: 'transbank_oneclick',
        status: 'active',
        nextBillingDate: oneclickSubscription.current_period_end
      };

      console.log('✅ OneClick status found:', oneclickStatus);
      
      res.json({
        success: true,
        data: oneclickStatus
      });
    } else {
      console.log('ℹ️ No OneClick found for organization');
      
      res.json({
        success: true,
        data: {
          hasOneClick: false,
          paymentMethod: null,
          status: 'not_configured'
        }
      });
    }
  } catch (error) {
    console.error('❌ Error getting OneClick status:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estado OneClick: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// Legacy endpoint - Start Trial with OneClick (kept for compatibility)
app.post('/v1/transbank/start-trial-with-oneclick', authenticateToken, async (req, res) => {
  try {
    console.log('🔷 Start Trial with OneClick (Local Dev - Legacy)');
    const user = (req as any).user;
    const { planId, organizationId, trialDays, oneclickToken, oneclickUsername } = req.body;
    
    if (!planId || !organizationId || !trialDays) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID, Organization ID y trial days requeridos'
      });
    }

    // Verify user has access to organization
    if (user.orgId !== organizationId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para esta organización'
      });
    }

    // Create a trial subscription with OneClick data (stored in memory for dev)
    const now = Math.floor(Date.now() / 1000);
    const trialEnd = now + (trialDays * 24 * 60 * 60);
    const periodEnd = now + (30 * 24 * 60 * 60);

    const subscription = {
      id: `sub_trial_oneclick_${Date.now()}`,
      organizationId,
      customerId: `cus_${organizationId}`,
      planId,
      planName: 'Plan Básico',
      status: 'trialing',
      current_period_start: now,
      current_period_end: periodEnd,
      trial_start: now,
      trial_end: trialEnd,
      amount: 14990,
      currency: 'CLP',
      interval: 'month',
      payment_method: 'transbank_oneclick',
      oneclick_username: oneclickUsername,
      oneclick_inscription_token: oneclickToken,
      oneclick_active: false, // Still false in legacy mode
      payment_attempts: 0,
    };

    console.log('✅ Trial with OneClick created (legacy):', subscription);
    
    res.json({
      success: true,
      message: 'Trial iniciado con OneClick exitosamente',
      data: { subscription }
    });
  } catch (error) {
    console.error('❌ Start trial with OneClick error:', error);
    res.status(500).json({
      success: false,
      error: 'Error iniciando trial con OneClick: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// Start Free Trial (existing endpoint but simplified)
app.post('/v1/transbank/start-free-trial', authenticateToken, async (req, res) => {
  try {
    console.log('🔷 Start Free Trial (Local Dev)');
    const user = (req as any).user;
    const { planId, organizationId, trialDays } = req.body;
    
    if (!planId || !organizationId || !trialDays) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID, Organization ID y trial days requeridos'
      });
    }

    // Verify user has access to organization
    if (user.orgId !== organizationId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para esta organización'
      });
    }

    const { transbankService } = require('./services/transbankService');
    
    const subscription = await transbankService.startFreeTrial(
      planId,
      organizationId,
      trialDays,
      user.email
    );

    res.json({
      success: true,
      message: 'Prueba gratuita iniciada exitosamente',
      data: { subscription }
    });
  } catch (error) {
    console.error('❌ Start free trial error:', error);
    res.status(500).json({
      success: false,
      error: 'Error iniciando prueba gratuita: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// =============================================
// TRANSBANK ENDPOINTS (LOCAL IMPLEMENTATION FOR DEV)
// =============================================

// Get Subscription Status (Local Implementation)
app.get('/v1/transbank/subscription/:organizationId', authenticateToken, async (req, res) => {
  try {
    console.log('💳 Get Subscription Status (Local Dev)');
    const user = (req as any).user;
    const { organizationId } = req.params;
    
    // Debug: Log user and organization info
    console.log('🔍 Debug info:');
    console.log('- User orgId:', user.orgId);
    console.log('- Requested organizationId:', organizationId);
    console.log('- Match:', user.orgId === organizationId);
    console.log('- User role:', user.role);
    
    // Verify user has access to organization
    if (user.orgId !== organizationId) {
      console.log('❌ Access denied: orgId mismatch');
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para esta organización'
      });
    }

    // Find organization
    const organization = organizations.find(org => org.id === organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organización no encontrada'
      });
    }

    // Build subscription response similar to production
    const subscriptionData = {
      id: `sub_${organizationId}`,
      status: organization.subscription.trial?.isActive ? 'trialing' : 'active',
      plan: {
        id: organization.subscription.plan,
        name: organization.subscription.plan === 'basic' ? 'Plan Básico' : 
              organization.subscription.plan === 'professional' ? 'Plan Profesional' : 'Plan Enterprise',
        amount: organization.subscription.plan === 'basic' ? 14990 : 
                organization.subscription.plan === 'professional' ? 29990 : 59990,
        currency: organization.currency || 'CLP',
        interval: 'month'
      },
      trial_end: organization.subscription.trial?.isActive 
        ? Math.floor(new Date(organization.subscription.trial.endDate).getTime() / 1000) 
        : undefined,
      current_period_end: organization.subscription.trial?.isActive 
        ? Math.floor(new Date(organization.subscription.trial.endDate).getTime() / 1000)
        : undefined
    };

    console.log('✅ Subscription data retrieved:', subscriptionData);

    res.json({
      success: true,
      message: 'Estado de suscripción obtenido exitosamente',
      data: subscriptionData
    });

  } catch (error) {
    console.error('❌ Error getting subscription status:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo suscripción: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// Transbank middleware to handle remaining /v1/transbank/* routes  
app.use('/v1/transbank', async (req, res) => {
  try {
    console.log(`🔷 Transbank endpoint called: ${req.method} ${req.path}`);
    console.log('🔷 Headers:', req.headers);
    console.log('🔷 Body:', req.body);
    
    // Convert Express request to Lambda event
    const lambdaEvent = expressToLambdaEvent(req, res);
    
    // Call the Transbank Lambda handler
    const lambdaResponse = await transbankHandler(lambdaEvent);
    
    console.log('🔷 Lambda response:', lambdaResponse);
    
    // Send Lambda response via Express
    sendLambdaResponse(lambdaResponse, res);
  } catch (error) {
    console.error('❌ Transbank endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Error en endpoint de Transbank: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// Add metrics endpoint
app.get('/api/metrics', authenticateToken, (req, res) => {
  try {
    const user = (req as any).user;
    
    // Check if user has admin permissions
    if (user.role !== 'owner' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Permisos insuficientes. Solo owners y admins pueden ver métricas.'
      });
    }

    const stats = getRequestStats();
    const costs = estimateCosts();
    
    res.json({
      success: true,
      message: 'Métricas obtenidas correctamente',
      data: {
        stats,
        costs,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error getting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener métricas'
    });
  }
});

// Initialize test data and start server
initializeTestData(); // Re-enabled for authentication

app.listen(PORT, () => {
  console.log('🚀 BookFlow Backend Local Server');
  console.log(`📡 Running on: http://localhost:${PORT}`);
  console.log('📊 Test data initialized:');
  console.log('  - Users:', users.length);
  console.log('  - Organizations:', organizations.length);
  console.log('  - Appointments:', appointments.length, '(should be 0 - empty array)');
  console.log('🧪 Test credentials: test@example.com / password123');
  console.log('✅ UPDATED VERSION - Settings update fix applied V2');
  console.log('');
  console.log('🔗 Available endpoints:');
  console.log('  📋 GET  /health');
  console.log('  🔐 POST /v1/auth/login');
  console.log('  🔐 POST /v1/auth/register');
  console.log('  🔐 GET  /v1/auth/me');
  console.log('  🔔 GET  /v1/notifications/stream/:orgId');
  console.log('  🔔 POST /v1/notifications/send');
  console.log('  🏢 GET  /v1/organizations/me');
  console.log('  🏢 PUT  /v1/organizations/:orgId/settings');
  console.log('  🎯 GET  /onboarding/status');
  console.log('  🎯 POST /onboarding/update');
  console.log('  🎯 POST /onboarding/reset');
  console.log('  📅 GET  /appointments?startDate&endDate[&staffId][&resourceId][&status]');
  console.log('  📅 POST /appointments');
  console.log('  📅 GET  /appointments/:id');
  console.log('  📅 PUT  /appointments/:id');
  console.log('  📅 POST /appointments/:id/cancel');
  console.log('  📅 POST /appointments/:id/confirm');
  console.log('  📅 POST /appointments/:id/complete');
  console.log('  📅 GET  /appointments/stats?startDate&endDate');
  console.log('  🌐 GET  /public/organization/:orgId');
  console.log('  🌐 GET  /public/organization/:orgId/services');
  console.log('  🌐 GET  /public/organization/:orgId/professionals');
  console.log('  🌐 GET  /public/organization/:orgId/availability/daily-counts');
  console.log('  🌐 GET  /public/organization/:orgId/availability');
  console.log('  🌐 POST /public/organization/:orgId/appointments');
  console.log('  🔄 POST /public/transbank/oneclick/complete-inscription');
  console.log('  💳 GET  /v1/transbank/subscription/:organizationId');
  console.log('  💳 POST /v1/transbank/cancel-subscription');
  console.log('  💳 POST /v1/transbank/start-free-trial');
  console.log('  🔄 POST /v1/transbank/oneclick/start-inscription');
  console.log('  🔄 POST /v1/transbank/oneclick/finish-inscription');
  console.log('  🔄 POST /v1/transbank/oneclick/complete-inscription');
  console.log('  🔄 GET  /v1/transbank/oneclick/status/:organizationId');
  console.log('  🔄 POST /v1/transbank/start-trial-with-oneclick');
  console.log('  ❌ Otros endpoints de pago deshabilitados temporalmente');
  console.log('  🐛 GET  /debug/users');
  console.log('  🐛 GET  /debug/organizations');
  console.log('  🐛 GET  /debug/subscriptions');
  console.log('  🐛 DELETE /debug/subscriptions');
  console.log('  🐛 GET  /debug/appointments');
  console.log('  🐛 DELETE /debug/appointments');
  console.log('  🐛 POST /debug/appointments/reset');
  console.log('  🐛 GET  /debug/appointments/filtered?startDate&endDate - NO AUTH for testing');
  console.log('  🐛 GET  /debug/notifications/connections');
  console.log('  🐛 POST /debug/notifications/test');
});

export default app;