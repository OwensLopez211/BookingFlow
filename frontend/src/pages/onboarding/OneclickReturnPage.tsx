import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { transbankService } from '../../services/transbankService';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useOnboarding } from '../../hooks/useOnboarding';

export const OneclickReturnPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateStep } = useOnboarding();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const hasProcessedRef = useRef(false);
  const [countdown, setCountdown] = useState(3);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const currentSearchParams = new URLSearchParams(window.location.search);
    const currentNavigate = navigate;
    
    const finishOneclickSetup = async () => {
      // Prevenir múltiples ejecuciones usando ref
      if (hasProcessedRef.current) {
        console.log('🔄 Already processing OneClick, skipping...');
        return;
      }
      
      console.log('🚀 Starting OneClick process...');
      hasProcessedRef.current = true;
      
      try {
        // Para OneClick, Transbank específicamente usa TBK_TOKEN (no token_ws como en Webpay Plus)
        // Puede venir por GET (URL params) o POST (form data)
        let token = currentSearchParams.get('TBK_TOKEN');
        let ordenCompra = currentSearchParams.get('TBK_ORDEN_COMPRA');
        let idSesion = currentSearchParams.get('TBK_ID_SESION');
        
        // Si no viene por GET, podría venir por POST (buscar en el body si es disponible)
        if (!token) {
          // En caso de POST, los parámetros podrían estar en el hash o en localStorage temp
          console.log('🔍 TBK_TOKEN not in URL params, checking alternatives...');
          
          // Verificar si hay datos en localStorage temporal
          const postData = sessionStorage.getItem('transbankPostData');
          if (postData) {
            try {
              const parsed = JSON.parse(postData);
              token = parsed.TBK_TOKEN;
              ordenCompra = parsed.TBK_ORDEN_COMPRA;
              idSesion = parsed.TBK_ID_SESION;
              sessionStorage.removeItem('transbankPostData');
            } catch (e) {
              console.warn('Could not parse stored POST data');
            }
          }
        }
        
        console.log('🔗 OneClick return parameters:', {
          token: token ? token.substring(0, 10) + '...' : 'null',
          tokenLength: token ? token.length : 0,
          ordenCompra,
          idSesion,
          allParams: Object.fromEntries(currentSearchParams.entries())
        });
        
        console.log('🔗 Full URL:', window.location.href);
        console.log('🔗 Search string:', window.location.search);
        
        if (!token) {
          throw new Error('Token de OneClick no encontrado en la URL de retorno');
        }

        // Verificar si es un caso de cancelación o timeout
        if (ordenCompra && idSesion) {
          console.log('⚠️ Transaction appears to be cancelled or timed out');
          throw new Error('La transacción fue cancelada o expiró. Por favor, intenta de nuevo.');
        }

        console.log('✅ Processing OneClick inscription with token:', token.substring(0, 10) + '...');

        // Recuperar los datos del plan desde localStorage
        const pendingPlanDataStr = localStorage.getItem('pendingPlanData');
        let planData;
        
        console.log('🔍 Plan data check:', {
          pendingPlanDataStr: pendingPlanDataStr ? 'presente' : 'ausente',
          userOrgId: user?.orgId
        });
        
        if (!pendingPlanDataStr) {
          
          // Intentar obtener datos del plan de otras fuentes
          console.log('⚠️ No plan data found, attempting recovery...');
          
          // Si tenemos el token pero no el plan data, podemos intentar usar datos por defecto
          // basados en lo que sabemos del usuario y organización
          if (user?.orgId) {
            console.log('🔧 Creating fallback plan data for OneClick completion...');
            const fallbackPlanData = {
              planId: 'basic', // Plan por defecto
              planName: 'Plan Básico',
              planPrice: '$14.990',
              planPeriod: 'por mes (+IVA)',
              transbankAmount: 14990,
              trialDays: 30,
              requiresPayment: true,
              enableOneClick: true,
              organizationId: user.orgId,
              oneclickData: {
                username: `u_${user.orgId.replace(/-/g, '')}`,
                email: user.email,
                returnUrl: window.location.origin + '/onboarding/oneclick-return'
              }
            };
            
            console.log('📝 Using fallback plan data:', fallbackPlanData);
            planData = fallbackPlanData;
          } else {
            throw new Error('No se encontraron los datos del plan y no se pudo recuperar la información del usuario.');
          }
        } else {
          planData = JSON.parse(pendingPlanDataStr);
        }

        if (!user?.orgId) {
          // Esperar un poco para que el user se cargue
          console.log('⏳ Waiting for user data to load...');
          setTimeout(() => {
            if (!user?.orgId) {
              throw new Error('No se pudo obtener la información del usuario. Por favor, recarga la página.');
            }
          }, 1000);
          return;
        }
        
        // Agregar organizationId a planData si no existe
        if (!planData.organizationId) {
          planData.organizationId = user.orgId;
        }

        // Usar el nuevo endpoint público que no requiere autenticación JWT
        console.log('🔹 Completing OneClick inscription and starting trial...');
        const result = await apiClient.post('/public/transbank/oneclick/complete-inscription', {
          token,
          planData
        });

        if (result.data.success) {
          console.log('✅ OneClick inscription completed:', result.data.data);
          
          // Marcar onboarding como completado
          try {
            await updateStep(5, planData);
            console.log('✅ Onboarding marked as completed successfully');
          } catch (onboardingError) {
            console.warn('⚠️ Could not update onboarding step, but OneClick was successful:', onboardingError);
            // No fallar aquí, OneClick ya fue exitoso
          }
          
          // Limpiar localStorage solo después de procesamiento exitoso
          localStorage.removeItem('pendingPlanData');
          
          const oneclickInfo = result.data.data.oneclick;
          setStatus('success');
          setMessage(`¡Método de pago configurado exitosamente! Tu tarjeta ${oneclickInfo.cardType} terminada en ${oneclickInfo.cardNumber} ha sido inscrita. Tu período de prueba ha comenzado.`);
          
          // Redirigir inmediatamente a WelcomePage
          console.log('🎉 Navigating immediately to Welcome page after OneClick success');
          currentNavigate('/welcome', { replace: true });
          return; // Salir inmediatamente
        } else {
          throw new Error(result.data.error || 'No se pudo completar la configuración del método de pago.');
        }
      } catch (error) {
        console.error('❌ Error finishing OneClick setup:', error);
        setStatus('error');
        
        // Determinar mensaje de error más específico
        let errorMessage = 'Error desconocido configurando el método de pago';
        
        if (error instanceof Error) {
          if (error.message.includes('cancelada') || error.message.includes('expiró')) {
            errorMessage = 'La transacción fue cancelada o expiró. Puedes intentar configurar tu método de pago nuevamente.';
          } else if (error.message.includes('rechazada')) {
            errorMessage = 'La configuración del método de pago fue rechazada por el banco. Por favor, verifica los datos de tu tarjeta e intenta nuevamente.';
          } else if (error.message.includes('Token')) {
            errorMessage = 'Hubo un problema con los datos de la transacción. Por favor, intenta el proceso nuevamente.';
          } else {
            errorMessage = error.message;
          }
        }
        
        setMessage(errorMessage);
        
        // Limpiar localStorage en caso de error para permitir reintento
        localStorage.removeItem('pendingPlanData');
        
        // Redirigir de vuelta al onboarding después de 5 segundos para permitir reintento
        redirectTimeoutRef.current = setTimeout(() => {
          currentNavigate('/onboarding');
        }, 5000);
      }
    };

    // Solo ejecutar si hay un token y no hemos procesado ya
    const token = currentSearchParams.get('TBK_TOKEN');
    
    // Solo procesar si hay token y no hemos procesado ya
    if (token && !hasProcessedRef.current) {
      finishOneclickSetup();
    } else if (!token && !hasProcessedRef.current) {
      // Si no hay token, probablemente llegamos aquí por error
      console.log('❌ No OneClick token found, redirecting to onboarding...');
      hasProcessedRef.current = true;
      currentNavigate('/onboarding');
    }
    
    // Cleanup function
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []); // Sin dependencias para evitar re-renders

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="text-center p-8">
          {status === 'loading' && (
            <div className="animate-fade-in">
              {/* Animated loading icon with glow effect */}
              <div className="relative mb-6">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                <div className="absolute inset-0 w-16 h-16 bg-blue-100 rounded-full mx-auto opacity-20 animate-pulse"></div>
              </div>
              
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-sm font-medium text-blue-700">Procesando...</span>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Configurando método de pago
                </h2>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-gray-700 leading-relaxed">
                    Estamos procesando de forma segura la configuración de tu método de pago con 
                    <span className="font-semibold text-blue-600"> Transbank</span>.
                    Este proceso puede tardar unos segundos.
                  </p>
                </div>
                
                <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 mt-4">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Conexión segura SSL</span>
                </div>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="animate-fade-in">
              {/* Success animation */}
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-bounce-once">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {/* Celebration rings */}
                <div className="absolute inset-0 w-20 h-20 border-4 border-green-300 rounded-full mx-auto animate-ping opacity-20"></div>
                <div className="absolute inset-0 w-24 h-24 border-2 border-green-200 rounded-full mx-auto animate-ping opacity-10" style={{animationDelay: '0.5s'}}></div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="inline-flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-full mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-green-700">¡Éxito!</span>
                  </div>
                  
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                    ¡Configuración completada!
                  </h2>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                  <p className="text-gray-700 leading-relaxed text-sm">
                    {message}
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="relative">
                      <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 w-6 h-6 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
                    </div>
                    <div className="text-center">
                      <p className="text-blue-600 text-sm font-medium">
                        Redirigiendo a tu página de bienvenida...
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Proceso completado exitosamente</span>
                </div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="animate-fade-in">
              {/* Error animation */}
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-500 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-red-300 rounded-full mx-auto animate-ping opacity-20"></div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="inline-flex items-center px-4 py-2 bg-red-50 border border-red-200 rounded-full mb-4">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-red-700">Error</span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-red-900 mb-3">
                    No se pudo configurar el método de pago
                  </h2>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                  <p className="text-red-800 leading-relaxed text-sm font-medium">
                    {message}
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-amber-800 font-semibold mb-2">¿Qué puedes hacer?</p>
                      <div className="grid grid-cols-1 gap-2 text-xs text-amber-700">
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                          <span>Verifica que tu tarjeta tenga fondos disponibles</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                          <span>Confirma que los datos ingresados sean correctos</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                          <span>Intenta con una tarjeta diferente</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                          <span>Contacta a tu banco si el problema persiste</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-blue-700 text-sm font-medium">
                      Redirigiendo para intentar nuevamente en 5 segundos...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};