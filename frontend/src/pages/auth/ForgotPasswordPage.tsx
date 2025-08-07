import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '@/components/ui';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // TODO: Implementar forgot password con Cognito
    console.log('Forgot password for:', email);
    
    // Simulación
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1000);
  };

  if (isSubmitted) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-green-400/30">
          <span className="text-green-400 text-2xl">✓</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Correo Enviado</h2>
        <p className="text-purple-200 mb-6">
          Hemos enviado las instrucciones para restablecer tu contraseña a <strong className="text-white">{email}</strong>
        </p>
        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full border-white/20 text-white hover:bg-white/10 hover:border-white/30" 
            onClick={() => setIsSubmitted(false)}
          >
            Enviar de Nuevo
          </Button>
          <Link to="/auth/login">
            <Button 
              variant="ghost" 
              className="w-full text-purple-200 hover:text-white hover:bg-white/5"
            >
              Volver al Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Recuperar Contraseña</h2>
        <p className="text-purple-200 mt-2">
          Ingresa tu correo y te enviaremos las instrucciones
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Correo Electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tu@email.com"
            className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/10 backdrop-blur-md placeholder-purple-200 text-white"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 hover:from-purple-700 hover:via-violet-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] backdrop-blur-md border border-white/10"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Enviando...
            </div>
          ) : (
            'Enviar Instrucciones'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link 
          to="/auth/login" 
          className="text-sm text-purple-200 hover:text-white transition-colors inline-flex items-center space-x-2 group"
        >
          <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Volver al Login</span>
        </Link>
      </div>
    </div>
  );
};