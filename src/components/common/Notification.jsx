import React, { useEffect, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiAlertTriangle, FiX } from 'react-icons/fi';

const Notification = ({ id, message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  // Configurer un timer pour fermer la notification après la durée spécifiée
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(id), 300); // Donner du temps pour l'animation de sortie
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  // Gérer la fermeture manuelle
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300); // Donner du temps pour l'animation de sortie
  };

  // Définir l'icône et les couleurs en fonction du type
  const getNotificationStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <FiCheckCircle className="w-5 h-5" />,
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-800 dark:text-green-200',
          borderColor: 'border-green-500 dark:border-green-700'
        };
      case 'error':
        return {
          icon: <FiAlertCircle className="w-5 h-5" />,
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-800 dark:text-red-200',
          borderColor: 'border-red-500 dark:border-red-700'
        };
      case 'warning':
        return {
          icon: <FiAlertTriangle className="w-5 h-5" />,
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          borderColor: 'border-yellow-500 dark:border-yellow-700'
        };
      case 'info':
      default:
        return {
          icon: <FiInfo className="w-5 h-5" />,
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-800 dark:text-blue-200',
          borderColor: 'border-blue-500 dark:border-blue-700'
        };
    }
  };

  const { icon, bgColor, textColor, borderColor } = getNotificationStyles();

  return (
    <div
      className={`flex items-start p-3 mb-3 rounded-md shadow-md border-l-4 transition-opacity duration-300 ${bgColor} ${textColor} ${borderColor} ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      role="alert"
    >
      <div className="flex-shrink-0 mr-3">{icon}</div>
      
      <div className="flex-1 mr-2" dangerouslySetInnerHTML={{ __html: message }} />
      
      <button
        className="flex-shrink-0 opacity-70 hover:opacity-100 focus:outline-none"
        onClick={handleClose}
      >
        <FiX className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Notification; 