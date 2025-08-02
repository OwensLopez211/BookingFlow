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
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-green-600 text-2xl">✓</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Correo Enviado</h2>
        <p className="text-gray-600 mb-6">
          Hemos enviado las instrucciones para restablecer tu contraseña a <strong>{email}</strong>
        </p>
        <div className="space-y-3">
          <Button variant="outline" className="w-full" onClick={() => setIsSubmitted(false)}>
            Enviar de Nuevo
          </Button>
          <Link to="/auth/login">
            <Button variant="ghost" className="w-full">
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
        <h2 className="text-2xl font-bold text-gray-900">Recuperar Contraseña</h2>
        <p className="text-gray-600 mt-2">
          Ingresa tu correo y te enviaremos las instrucciones
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          label="Correo Electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="tu@email.com"
        />

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
        >
          Enviar Instrucciones
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link to="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">
          ← Volver al Login
        </Link>
      </div>
    </div>
  );
};