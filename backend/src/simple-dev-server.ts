/**
 * Simplified Local Development Server
 * A direct Express server that bypasses AWS Lambda complexity
 */

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3001;
const JWT_SECRET = 'local-development-secret-for-bookflow';

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
  businessConfiguration?: {
    appointmentModel?: string;
    allowClientSelection?: boolean;
    bufferBetweenAppointments?: number;
    maxAdvanceBookingDays?: number;
  };
  services?: Array<{
    id: string;
    name: string;
    description: string;
    duration: number;
    price: number;
    isActive: boolean;
  }>;
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
    plan: 'free' | 'premium';
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

// Initialize with test data
const initializeTestData = () => {
  const testOrg = {
    id: '74e46f50-509d-451e-bf21-df12fbda7b77',
    name: 'Mi Organización Local',
    templateType: 'beauty_salon',
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
    },
    subscription: {
      plan: 'free',
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

  if (organizations.length === 0) {
    organizations.push(testOrg);
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
        plan: 'free',
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
      organization: organization ? {
        id: organization.id,
        name: organization.name,
        templateType: organization.templateType,
      } : null,
    });
  } catch (error) {
    console.error('❌ Get current user error:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

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
    
    // Update settings
    if (updates.timezone) {
      organization.settings.timezone = updates.timezone;
    }
    if (updates.businessHours) {
      organization.settings.businessHours = {
        ...organization.settings.businessHours,
        ...updates.businessHours,
      };
    }
    if (updates.notifications) {
      organization.settings.notifications = {
        ...organization.settings.notifications,
        ...updates.notifications,
      };
    }

    organization.updatedAt = new Date().toISOString();
    organizations[orgIndex] = organization;

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
  res.json({
    success: true,
    count: organizations.length,
    organizations: organizations.map(org => ({
      id: org.id,
      name: org.name,
      templateType: org.templateType,
      createdAt: org.createdAt,
    }))
  });
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
          const validPlans = ['basic', 'professional', 'enterprise'];
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
              const getPlanLimits = (planId: string) => {
                switch (planId) {
                  case 'basic':
                    return { plan: 'free', maxResources: 1, maxAppointmentsPerMonth: 100, maxUsers: 3 };
                  case 'professional':
                    return { plan: 'premium', maxResources: 5, maxAppointmentsPerMonth: 1000, maxUsers: 10 };
                  case 'enterprise':
                    return { plan: 'premium', maxResources: -1, maxAppointmentsPerMonth: -1, maxUsers: -1 };
                  default:
                    return { plan: 'free', maxResources: 1, maxAppointmentsPerMonth: 100, maxUsers: 3 };
                }
              };

              const planLimits = getPlanLimits(stepData.planId);
              org.subscription = {
                plan: planLimits.plan,
                limits: {
                  maxResources: planLimits.maxResources,
                  maxAppointmentsPerMonth: planLimits.maxAppointmentsPerMonth,
                  maxUsers: planLimits.maxUsers
                }
              };
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

// Initialize test data and start server
initializeTestData();

app.listen(PORT, () => {
  console.log('🚀 BookFlow Backend Local Server');
  console.log(`📡 Running on: http://localhost:${PORT}`);
  console.log('📊 Test data initialized:');
  console.log('  - Users:', users.length);
  console.log('  - Organizations:', organizations.length);
  console.log('🧪 Test credentials: test@example.com / password123');
  console.log('');
  console.log('🔗 Available endpoints:');
  console.log('  📋 GET  /health');
  console.log('  🔐 POST /v1/auth/login');
  console.log('  🔐 POST /v1/auth/register');
  console.log('  🔐 GET  /v1/auth/me');
  console.log('  🏢 GET  /v1/organizations/me');
  console.log('  🏢 PUT  /v1/organizations/:orgId/settings');
  console.log('  🎯 GET  /onboarding/status');
  console.log('  🎯 POST /onboarding/update');
  console.log('  🎯 POST /onboarding/reset');
  console.log('  🐛 GET  /debug/users');
  console.log('  🐛 GET  /debug/organizations');
});

export default app;