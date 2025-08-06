import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { transbankService } from '../../services/transbankService';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useOnboarding } from '../../hooks/useOnboarding';

export const OneclickReturnPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { onboardingStatus, updateStep } = useOnboarding();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    const finishOneclickSetup = async () => {
      // Prevenir múltiples ejecuciones
      if (isProcessing || hasProcessed) {
        console.log('🔄 Already processing OneClick, skipping...');
        return;
      }
      
      setIsProcessing(true);
      
      try {
        // Para OneClick, Transbank específicamente usa TBK_TOKEN (no token_ws como en Webpay Plus)
        // Puede venir por GET (URL params) o POST (form data)
        let token = searchParams.get('TBK_TOKEN');
        let ordenCompra = searchParams.get('TBK_ORDEN_COMPRA');
        let idSesion = searchParams.get('TBK_ID_SESION');
        
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
          allParams: Object.fromEntries(searchParams.entries())
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
        
        console.log('🔍 Plan data check:', {
          pendingPlanDataStr: pendingPlanDataStr ? 'presente' : 'ausente',
          userOrgId: user?.orgId,
          onboardingStep: onboardingStatus?.currentStep,
          onboardingCompleted: onboardingStatus?.isCompleted
        });
        
        if (!pendingPlanDataStr) {
          // Si no hay datos del plan pero ya completamos el onboarding, redirigir al dashboard
          if (onboardingStatus?.currentStep === 5 && onboardingStatus?.isCompleted) {
            console.log('✅ OneClick already completed, redirecting to dashboard...');
            setStatus('success');
            setMessage('¡Tu método de pago ya está configurado!');
            setTimeout(() => navigate('/dashboard'), 2000);
            return;
          }
          
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
            var planData = fallbackPlanData;
          } else {
            throw new Error('No se encontraron los datos del plan y no se pudo recuperar la información del usuario.');
          }
        } else {
          var planData = JSON.parse(pendingPlanDataStr);
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
          
          // Marcar como procesado para evitar múltiples ejecuciones
          setHasProcessed(true);
          
          // Intentar completar el onboarding si el token JWT sigue válido
          try {
            await updateStep(5, planData);
            console.log('✅ Onboarding step updated successfully');
          } catch (onboardingError) {
            console.warn('⚠️ Could not update onboarding step (token expired?), but OneClick was successful:', onboardingError);
            // No fallar aquí, OneClick ya fue exitoso
          }
          
          // Limpiar localStorage solo después de procesamiento exitoso
          localStorage.removeItem('pendingPlanData');
          
          const oneclickInfo = result.data.data.oneclick;
          setStatus('success');
          setMessage(`¡Método de pago configurado exitosamente! Tu tarjeta ${oneclickInfo.cardType} terminada en ${oneclickInfo.cardNumber} ha sido inscrita. Tu período de prueba ha comenzado.`);
          
          // Redirigir al dashboard después de 3 segundos
          setTimeout(() => {
            console.log('🏠 Navigating to dashboard after OneClick success');
            navigate('/dashboard', { replace: true });
          }, 3000);
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
        setTimeout(() => {
          navigate('/onboarding');
        }, 5000);
      } finally {
        setIsProcessing(false);
      }
    };

    // Solo ejecutar si hay un token y no hemos procesado ya
    const token = searchParams.get('TBK_TOKEN');
    if (token && !hasProcessed) {
      finishOneclickSetup();
    } else if (!token && !hasProcessed) {
      // Si no hay token, probablemente llegamos aquí por error
      console.log('❌ No OneClick token found, redirecting to onboarding...');
      navigate('/onboarding');
    }
  }, [searchParams, navigate, isProcessing, hasProcessed, user?.orgId, updateStep, onboardingStatus]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          {status === 'loading' && (
            <div>
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Configurando método de pago...
              </h2>
              <p className="text-gray-600">
                Estamos procesando la configuración de tu método de pago. Por favor espera.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-green-900 mb-2">
                ¡Configuración completada!
              </h2>
              <p className="text-gray-600 mb-4">
                {message}
              </p>
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-700">
                  Serás redirigido al dashboard en unos segundos...
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-red-900 mb-2">
                No se pudo configurar el método de pago
              </h2>
              <p className="text-gray-600 mb-4">
                {message}
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                <p className="text-sm text-yellow-800 font-medium mb-1">¿Qué puedes hacer?</p>
                <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                  <li>Verifica que tu tarjeta tenga fondos disponibles</li>
                  <li>Confirma que los datos ingresados sean correctos</li>
                  <li>Intenta con una tarjeta diferente</li>
                  <li>Contacta a tu banco si el problema persiste</li>
                </ul>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700">
                  Serás redirigido de vuelta para intentar nuevamente en 5 segundos...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};