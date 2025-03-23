import React, { createContext, useState, useContext } from 'react';
import Notification from '../components/common/Notification';

// Création du contexte
const NotificationContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useNotification = () => useContext(NotificationContext);

// Fonction pour générer un ID unique
const generateUniqueId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Fournisseur du contexte
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [confirmDialogs, setConfirmDialogs] = useState([]);

  // Ajouter une notification
  const addNotification = (message, type = 'success', duration = 3000) => {
    const id = generateUniqueId();
    setNotifications(prev => [...prev, { id, message, type, duration }]);
    return id;
  };

  // Supprimer une notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Fonctions d'aide pour différents types de notifications
  const showSuccess = (message, duration) => addNotification(message, 'success', duration);
  const showError = (message, duration) => addNotification(message, 'error', duration);
  const showWarning = (message, duration) => addNotification(message, 'warning', duration);
  const showInfo = (message, duration) => addNotification(message, 'info', duration);
  
  // Fonction pour afficher une notification avec titre
  const showNotification = (title, message, type = 'info', duration) => {
    const formattedMessage = title ? `<strong>${title}</strong><br/>${message}` : message;
    return addNotification(formattedMessage, type, duration);
  };
  
  // Fonction pour afficher une boîte de dialogue de confirmation
  const showConfirm = (message, onConfirm, onCancel) => {
    const id = generateUniqueId();
    setConfirmDialogs(prev => [...prev, { id, message, onConfirm, onCancel }]);
    return id;
  };
  
  // Fonction pour fermer une boîte de dialogue de confirmation
  const closeConfirmDialog = (id, confirmed) => {
    const dialog = confirmDialogs.find(d => d.id === id);
    if (dialog) {
      if (confirmed && dialog.onConfirm) {
        dialog.onConfirm();
      } else if (!confirmed && dialog.onCancel) {
        dialog.onCancel();
      }
    }
    setConfirmDialogs(prev => prev.filter(d => d.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm,
        showNotification
      }}
    >
      {children}
      
      {/* Afficher les notifications */}
      <div className="fixed top-0 right-0 p-4 z-50">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            id={notification.id}
            message={notification.message}
            type={notification.type}
            duration={notification.duration}
            onClose={removeNotification}
          />
        ))}
      </div>
      
      {/* Afficher les boîtes de dialogue de confirmation */}
      {confirmDialogs.map(dialog => (
        <div key={dialog.id} className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => closeConfirmDialog(dialog.id, false)}></div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-10 max-w-md w-full">
            <div className="mb-4 text-gray-800 dark:text-gray-200">{dialog.message}</div>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
                onClick={() => closeConfirmDialog(dialog.id, false)}
              >
                Annuler
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => closeConfirmDialog(dialog.id, true)}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      ))}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider; 