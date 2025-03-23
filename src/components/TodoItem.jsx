import React from 'react';
import { FiTrash2, FiEdit2, FiCheck, FiX, FiMessageCircle } from 'react-icons/fi';

const TodoItem = ({
  todo,
  editingId,
  editText,
  editDescription,
  setEditText,
  setEditDescription,
  onToggle,
  onDelete,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onChangePriority,
  onChangeStatus
}) => {
  // Définir les couleurs de priorité
  const priorityColors = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  };

  // Définir les libellés de priorité
  const priorityLabels = {
    low: 'Faible',
    medium: 'Moyenne',
    high: 'Élevée'
  };

  // Définir les statuts
  const statusOptions = [
    { value: 'todo', label: 'À faire', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    { value: 'in-progress', label: 'En cours', color: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-300' },
    { value: 'done', label: 'Terminée', color: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-300' }
  ];

  // Trouver le statut actuel
  const currentStatus = statusOptions.find(status => status.value === todo.status) || statusOptions[0];

  return (
    <li className={`border-b border-gray-200 dark:border-gray-700 p-6 ${
      todo.status === 'done' ? 'bg-gray-50 dark:bg-gray-900/50' : ''
    }`}>
      {editingId === todo.id ? (
        <div className="space-y-4">
          {/* Mode édition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre
            </label>
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent dark:bg-gray-800 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent dark:bg-gray-800 min-h-[100px] focus:border-indigo-500 dark:focus:border-indigo-400 outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={onSaveEdit}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center"
            >
              <FiCheck className="mr-1" />
              Enregistrer
            </button>
            <button
              onClick={onCancelEdit}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md flex items-center"
            >
              <FiX className="mr-1" />
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Mode affichage */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${
                todo.status === 'done' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'
              }`}>
                {todo.text}
              </h3>
              
              <div className="mt-2">
                <p className={`text-sm ${
                  todo.status === 'done' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {todo.description || <span className="italic text-gray-400 dark:text-gray-500">Aucune description</span>}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <span
                className={`text-xs px-2 py-1 rounded-full ${priorityColors[todo.priority]}`}
              >
                {priorityLabels[todo.priority]}
              </span>
              
              <span
                className={`text-xs px-2 py-1 rounded-full ${currentStatus.color}`}
              >
                {currentStatus.label}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            {/* Statut */}
            <div className="flex-1 md:flex-none">
              <select
                value={todo.status}
                onChange={(e) => onChangeStatus(todo.id, e.target.value)}
                className="p-2 text-sm rounded border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-800"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Priorité */}
            <select
              value={todo.priority}
              onChange={(e) => onChangePriority(todo.id, e.target.value)}
              className="p-2 text-sm rounded border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-800"
            >
              <option value="low">Priorité: Faible</option>
              <option value="medium">Priorité: Moyenne</option>
              <option value="high">Priorité: Élevée</option>
            </select>
            
            <button
              onClick={() => onStartEdit(todo)}
              className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded-md"
              title="Modifier"
            >
              <FiEdit2 size={18} />
            </button>
            
            <button
              onClick={() => onDelete(todo.id)}
              className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-100 dark:bg-red-900/30 rounded-md"
              title="Supprimer"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        </div>
      )}
    </li>
  );
};

export default TodoItem; 