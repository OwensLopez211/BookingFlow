import React, { useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNotificationStore } from '@/stores/notificationStore';
import { NotificationCenter } from './NotificationCenter';

interface NotificationBadgeProps {
  className?: string;
  showCenter?: boolean;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  className = '',
  showCenter = true 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { getUnreadCount } = useNotificationStore();
  
  const unreadCount = getUnreadCount();

  const handleClick = () => {
    if (showCenter) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`
          relative p-2 rounded-lg transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500
          ${className}
        `}
        title={`${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer`}
      >
        <BellIcon className="h-6 w-6 text-gray-600" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showCenter && (
        <NotificationCenter 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  );
};