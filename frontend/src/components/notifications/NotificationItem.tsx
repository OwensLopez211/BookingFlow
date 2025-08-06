import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
  BellIcon,
  CogIcon,
  CalendarIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { Notification } from '@/stores/notificationStore';

interface NotificationItemProps {
  notification: Notification;
  onDismiss: () => void;
  onMarkRead: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onDismiss,
  onMarkRead,
}) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!notification.expiresAt || notification.persistent) return;

    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const expires = new Date(notification.expiresAt!).getTime();
      const remaining = expires - now;
      
      if (remaining <= 0) {
        onDismiss();
        return;
      }
      
      setTimeLeft(remaining);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 100);

    return () => clearInterval(interval);
  }, [notification.expiresAt, notification.persistent, onDismiss]);

  const getTypeConfig = () => {
    switch (notification.type) {
      case 'success':
        return {
          icon: CheckCircleIcon,
          gradient: 'from-emerald-500 to-green-600',
          bg: 'bg-emerald-50/90',
          border: 'border-emerald-200/50',
          iconColor: 'text-emerald-600',
          textColor: 'text-emerald-800',
          accentColor: 'bg-emerald-500',
        };
      case 'error':
        return {
          icon: XCircleIcon,
          gradient: 'from-red-500 to-rose-600',
          bg: 'bg-red-50/90',
          border: 'border-red-200/50',
          iconColor: 'text-red-600',
          textColor: 'text-red-800',
          accentColor: 'bg-red-500',
        };
      case 'warning':
        return {
          icon: ExclamationTriangleIcon,
          gradient: 'from-amber-500 to-orange-600',
          bg: 'bg-amber-50/90',
          border: 'border-amber-200/50',
          iconColor: 'text-amber-600',
          textColor: 'text-amber-800',
          accentColor: 'bg-amber-500',
        };
      case 'info':
        return {
          icon: InformationCircleIcon,
          gradient: 'from-blue-500 to-indigo-600',
          bg: 'bg-blue-50/90',
          border: 'border-blue-200/50',
          iconColor: 'text-blue-600',
          textColor: 'text-blue-800',
          accentColor: 'bg-blue-500',
        };
      case 'critical':
        return {
          icon: ExclamationCircleIcon,
          gradient: 'from-purple-600 to-pink-600',
          bg: 'bg-purple-50/90',
          border: 'border-purple-200/50',
          iconColor: 'text-purple-600',
          textColor: 'text-purple-800',
          accentColor: 'bg-purple-600',
        };
    }
  };

  const getCategoryIcon = () => {
    switch (notification.category) {
      case 'system':
        return CogIcon;
      case 'user':
        return BellIcon;
      case 'appointment':
        return CalendarIcon;
      case 'billing':
        return CreditCardIcon;
      case 'security':
        return ShieldCheckIcon;
      default:
        return BellIcon;
    }
  };

  const getPriorityIndicator = () => {
    switch (notification.priority) {
      case 'critical':
        return 'animate-pulse ring-2 ring-red-500 ring-opacity-50';
      case 'high':
        return 'ring-1 ring-orange-300';
      case 'medium':
        return 'ring-1 ring-blue-200';
      case 'low':
        return 'ring-1 ring-gray-200';
      default:
        return '';
    }
  };

  const config = getTypeConfig();
  const TypeIcon = config.icon;
  const CategoryIcon = getCategoryIcon();

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead();
    }
  };

  const formatTimeLeft = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <motion.div
      layout
      onClick={handleClick}
      className={`
        relative w-full max-w-sm rounded-2xl backdrop-blur-xl border shadow-2xl cursor-pointer
        ${config.bg} ${config.border} ${getPriorityIndicator()}
        ${notification.isRead ? 'opacity-75' : ''}
        hover:shadow-3xl hover:scale-[1.02] transition-all duration-200
        group
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Priority accent line */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.accentColor} rounded-l-2xl`} />
      
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Type icon */}
            <div className={`
              flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
              bg-gradient-to-br ${config.gradient} shadow-lg
            `}>
              <TypeIcon className="h-5 w-5 text-white" />
            </div>
            
            {/* Title and category */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CategoryIcon className={`h-4 w-4 ${config.iconColor}`} />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {notification.category}
                </span>
              </div>
              <h4 className={`font-semibold ${config.textColor} text-sm leading-tight mt-1`}>
                {notification.title}
              </h4>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className={`
              flex-shrink-0 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100
              ${config.iconColor} hover:bg-white/50
            `}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Message */}
        {notification.message && (
          <p className={`text-sm ${config.textColor} opacity-90 leading-relaxed mb-3`}>
            {notification.message}
          </p>
        )}

        {/* Actions */}
        {notification.actions && notification.actions.length > 0 && (
          <div className="space-y-2 mb-3">
            {notification.actions.map((action, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  action.action();
                }}
                className={`
                  w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${action.style === 'danger' 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : action.style === 'primary'
                    ? `bg-gradient-to-r ${config.gradient} text-white hover:shadow-md`
                    : 'bg-white/50 text-gray-700 hover:bg-white/70'
                  }
                `}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs">
          <span className={`${config.textColor} opacity-60`}>
            {new Date(notification.createdAt).toLocaleTimeString()}
          </span>
          
          {timeLeft !== null && !notification.persistent && (
            <span className={`${config.textColor} opacity-60 flex items-center gap-1`}>
              <div 
                className={`w-2 h-2 rounded-full ${config.accentColor}`}
                style={{
                  animation: `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`
                }}
              />
              {formatTimeLeft(timeLeft)}
            </span>
          )}
          
          {notification.persistent && (
            <span className={`${config.textColor} opacity-60 text-xs`}>
              Persistente
            </span>
          )}
        </div>
      </div>

      {/* Progress bar for non-persistent notifications */}
      {timeLeft !== null && !notification.persistent && notification.expiresAt && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-b-2xl overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${config.gradient}`}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{
              duration: (new Date(notification.expiresAt).getTime() - new Date(notification.createdAt).getTime()) / 1000,
              ease: 'linear'
            }}
          />
        </div>
      )}
    </motion.div>
  );
};