import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse } from '../utils/response';
import { verifyToken } from '../utils/cognito';
import { getUserByCognitoId } from '../repositories/userRepository';
import { getOrganizationById } from '../repositories/organizationRepository';

/**
 * Endpoint para probar la actualización completa de settings
 * Simula exactamente lo que envía el frontend
 */
export const testCompleteSettingsUpdate = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return createResponse(401, { error: 'Token is required' });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return createResponse(401, { error: 'Invalid token' });
    }

    const user = await getUserByCognitoId(decoded.username);
    if (!user) {
      return createResponse(404, { error: 'User not found' });
    }

    if (!user.orgId) {
      return createResponse(400, { error: 'User is not associated with an organization' });
    }

    if (user.role !== 'owner') {
      return createResponse(403, { error: 'Only owners can test settings update' });
    }

    // Obtener organización actual
    const currentOrg = await getOrganizationById(user.orgId);
    if (!currentOrg) {
      return createResponse(404, { error: 'Organization not found' });
    }

    console.log('📋 Current organization:', JSON.stringify(currentOrg, null, 2));

    // Simular exactamente los datos que envía el frontend
    const frontendData = {
      // Datos básicos de la organización (extraídos de businessInfo)
      name: 'Mi Negocio Actualizado',
      address: 'Calle Nueva 123, Santiago',
      phone: '+56 9 8765 4321',
      email: 'contacto@minegocio.com',
      currency: 'CLP',
      // Settings
      timezone: 'America/Santiago',
      businessHours: {
        monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        friday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
        saturday: { isOpen: true, openTime: '10:00', closeTime: '14:00' },
        sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' }
      },
      notifications: {
        emailReminders: true,
        smsReminders: false,
        autoConfirmation: true,
        reminderHours: 24
      },
      appointmentSystem: {
        appointmentModel: 'professional_based',
        allowClientSelection: true,
        bufferBetweenAppointments: 15,
        maxAdvanceBookingDays: 30
      },
      businessInfo: {
        businessName: 'Mi Negocio Actualizado',
        businessAddress: 'Calle Nueva 123, Santiago',
        businessPhone: '+56 9 8765 4321',
        businessEmail: 'contacto@minegocio.com'
      },
      services: [
        {
          id: 'service_1',
          name: 'Servicio Premium',
          description: 'Servicio premium con todos los beneficios',
          duration: 90,
          price: 35000,
          isActive: true
        },
        {
          id: 'service_2',
          name: 'Servicio Básico',
          description: 'Servicio básico estándar',
          duration: 60,
          price: 20000,
          isActive: true
        },
        {
          name: 'Servicio Nuevo',
          description: 'Nuevo servicio sin ID previo',
          duration: 45,
          price: 15000,
          isActive: true
        }
      ]
    };

    console.log('📦 Frontend data to send:', JSON.stringify(frontendData, null, 2));

    // Simular el procesamiento del endpoint (como lo hace organizations.ts)
    const organizationData: any = {};
    const settingsData: any = {};
    
    // Extract organization-level fields
    if (frontendData.name) organizationData.name = frontendData.name;
    if (frontendData.address !== undefined) organizationData.address = frontendData.address;
    if (frontendData.phone !== undefined) organizationData.phone = frontendData.phone;
    if (frontendData.email !== undefined) organizationData.email = frontendData.email;
    if (frontendData.currency !== undefined) organizationData.currency = frontendData.currency;
    
    // Extract settings fields
    if (frontendData.timezone) settingsData.timezone = frontendData.timezone;
    if (frontendData.businessHours) settingsData.businessHours = frontendData.businessHours;
    if (frontendData.notifications) settingsData.notifications = frontendData.notifications;
    if (frontendData.appointmentSystem) settingsData.appointmentSystem = frontendData.appointmentSystem;
    if (frontendData.businessInfo) settingsData.businessInfo = frontendData.businessInfo;
    if (frontendData.services) settingsData.services = frontendData.services;
    
    // Combine data
    const updateData = {
      ...organizationData,
      ...(Object.keys(settingsData).length > 0 && { settings: settingsData })
    };
    
    console.log('📦 Structured update data:', JSON.stringify(updateData, null, 2));

    // Usar el servicio de actualización
    const { updateOrganizationService } = await import('../services/organizationService');
    const result = await updateOrganizationService(user.orgId, user.id, updateData);

    console.log('✅ Update result:', JSON.stringify(result, null, 2));

    return createResponse(200, {
      success: true,
      message: 'Complete settings update test completed successfully',
      currentOrganization: currentOrg,
      frontendData: frontendData,
      structuredData: updateData,
      result: result
    });

  } catch (error) {
    console.error('❌ Error in testCompleteSettingsUpdate:', error);
    return createResponse(500, { 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
};