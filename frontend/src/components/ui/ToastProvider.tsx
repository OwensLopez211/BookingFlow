import React from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Custom Toast Component
const CustomToast = ({ 
  type, 
  message, 
  description 
}: {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
}) => {
  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircleIcon,
          gradient: 'from-emerald-500 to-green-600',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          iconColor: 'text-emerald-600',
          textColor: 'text-emerald-800'
        };
      case 'error':
        return {
          icon: XCircleIcon,
          gradient: 'from-red-500 to-rose-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          iconColor: 'text-red-600',
          textColor: 'text-red-800'
        };
      case 'warning':
        return {
          icon: ExclamationTriangleIcon,
          gradient: 'from-amber-500 to-orange-600',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          iconColor: 'text-amber-600',
          textColor: 'text-amber-800'
        };
      case 'info':
        return {
          icon: InformationCircleIcon,
          gradient: 'from-blue-500 to-indigo-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          iconColor: 'text-blue-600',
          textColor: 'text-blue-800'
        };
    }
  };

  const config = getToastConfig();
  const Icon = config.icon;

  return (
    <div className={`
      toast-container relative flex items-start space-x-4 p-4 rounded-2xl shadow-2xl backdrop-blur-lg border max-w-sm
      ${config.bg} ${config.border}
      transform transition-all duration-300
      animate-[slideInFromBottomRight_0.6s_cubic-bezier(0.68,-0.55,0.265,1.55)_forwards]
    `}>
      {/* Gradient accent line */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${config.gradient} rounded-l-2xl`} />
      
      {/* Icon with gradient background */}
      <div className={`
        flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
        bg-gradient-to-br ${config.gradient} shadow-lg
      `}>
        <Icon className="h-5 w-5 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-2">
            <h4 className={`font-semibold ${config.textColor} text-sm leading-tight`}>
              {message}
            </h4>
            {description && (
              <p className={`mt-1 text-xs ${config.textColor} opacity-80 leading-relaxed`}>
                {description}
              </p>
            )}
          </div>
          
          {/* Close button */}
          <button
            onClick={() => toast.dismiss()}
            className={`
              flex-shrink-0 p-1 rounded-lg transition-colors
              ${config.iconColor} hover:bg-white/50
            `}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Animated progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-b-2xl overflow-hidden">
        <div className={`
          h-full bg-gradient-to-r ${config.gradient} 
          animate-[shrink_4000ms_linear_forwards]
        `} />
      </div>
    </div>
  );
};

// Toast helper functions
export const showToast = {
  success: (message: string, description?: string) => {
    toast.custom((t) => (
      <CustomToast type="success" message={message} description={description} />
    ), {
      duration: 4000,
      position: 'bottom-right',
    });
  },
  
  error: (message: string, description?: string) => {
    toast.custom((t) => (
      <CustomToast type="error" message={message} description={description} />
    ), {
      duration: 5000,
      position: 'bottom-right',
    });
  },
  
  warning: (message: string, description?: string) => {
    toast.custom((t) => (
      <CustomToast type="warning" message={message} description={description} />
    ), {
      duration: 4500,
      position: 'bottom-right',
    });
  },
  
  info: (message: string, description?: string) => {
    toast.custom((t) => (
      <CustomToast type="info" message={message} description={description} />
    ), {
      duration: 3500,
      position: 'bottom-right',
    });
  }
};

// Toast Provider Component
export const ToastProvider: React.FC = () => {
  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'transparent',
            boxShadow: 'none',
            padding: 0,
            margin: 0,
          },
        }}
        containerStyle={{
          bottom: 20,
          right: 20,
        }}
        gutter={12}
      />
      
      {/* Add custom CSS for animations */}
      <style jsx global>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        
        @keyframes slideInFromBottomRight {
          0% {
            transform: translateX(120%) translateY(120%) scale(0.6) rotate(15deg);
            opacity: 0;
          }
          50% {
            transform: translateX(0) translateY(0) scale(1.05) rotate(-2deg);
            opacity: 0.8;
          }
          100% {
            transform: translateX(0) translateY(0) scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        
        /* Toast exit animation */
        .toast-exit {
          animation: slideOutToBottomRight 0.3s ease-in forwards;
        }
        
        @keyframes slideOutToBottomRight {
          0% {
            transform: translateX(0) translateY(0) scale(1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateX(120%) translateY(80%) scale(0.7) rotate(10deg);
            opacity: 0;
          }
        }
        
        /* Add a subtle bounce effect on hover */
        .toast-container:hover {
          animation: subtleBounce 0.3s ease-out;
        }
        
        @keyframes subtleBounce {
          0%, 100% {
            transform: scale(1.05);
          }
          50% {
            transform: scale(1.08);
          }
        }
      `}</style>
    </>
  );
};