import { useEffect, useRef, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { realTimeNotificationService } from '@/services/realTimeNotificationService';

export const useRealTimeNotifications = () => {
  const { user, organization, isAuthenticated } = useAuthStore();
  const isConnectedRef = useRef(false);
  const currentOrgRef = useRef<string | null>(null);

  // ✅ Usar useMemo para evitar re-renders innecesarios
  const shouldConnect = useMemo(() => {
    return isAuthenticated && 
           organization?.id && 
           user?.role === 'owner' && 
           !!localStorage.getItem('accessToken');
  }, [isAuthenticated, organization?.id, user?.role]);

  useEffect(() => {
    // Solo ejecutar si tenemos los datos básicos necesarios
    if (!shouldConnect) {
      if (isConnectedRef.current) {
        console.log('❌ Disconnecting - conditions not met');
        realTimeNotificationService.disconnect();
        isConnectedRef.current = false;
        currentOrgRef.current = null;
      }
      return;
    }

    // ✅ Evitar reconexiones innecesarias a la misma organización
    if (currentOrgRef.current === organization!.id && isConnectedRef.current) {
      return;
    }

    // Verificar si ya estamos conectados a la organización correcta
    const serviceStatus = realTimeNotificationService.getConnectionStatus();
    const isAlreadyConnected = serviceStatus.isConnected && serviceStatus.orgId === organization!.id;
    
    if (isAlreadyConnected) {
      isConnectedRef.current = true;
      currentOrgRef.current = organization!.id;
      return;
    }

    // Conectar
    console.log('✅ Connecting to real-time notifications for org:', organization!.id);
    currentOrgRef.current = organization!.id;
    
    const connectAsync = async () => {
      try {
        await realTimeNotificationService.connect(organization!.id);
        isConnectedRef.current = true;
        console.log('✅ Successfully connected to real-time notifications');
      } catch (error) {
        console.error('❌ Error connecting to real-time notifications:', error);
        isConnectedRef.current = false;
        currentOrgRef.current = null;
      }
    };
    connectAsync();

    return () => {
      if (isConnectedRef.current) {
        realTimeNotificationService.disconnect();
        isConnectedRef.current = false;
        currentOrgRef.current = null;
      }
    };
  }, [shouldConnect, organization?.id]);

  return {
    isConnected: isConnectedRef.current,
    connectionStatus: realTimeNotificationService.getConnectionStatus(),
    notifyAppointmentCreated: realTimeNotificationService.notifyAppointmentCreated.bind(realTimeNotificationService),
    addListener: realTimeNotificationService.addListener.bind(realTimeNotificationService),
  };
};