import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiClock, FiAlertCircle, FiBarChart2, FiFlag, FiList, FiCalendar, FiTarget, FiUser, FiMail, FiPhone, FiLink } from 'react-icons/fi';
import { getTopTargetsByProgress } from '../services/targetsService';
import { PiGlobeHemisphereEastFill } from "react-icons/pi";

const Dashboard = () => {
  // Données pour les statistiques
  const [stats, setStats] = useState({
    todo: 0,
    inProgress: 0,
    done: 0,
    total: 0,
    lowPriority: 0,
    mediumPriority: 0,
    highPriority: 0,
    recentTasks: []
  });
  // État pour les principales cibles
  const [topTargets, setTopTargets] = useState([]);
  // État pour le chargement
  const [loading, setLoading] = useState(true);

  // Charger les données au démarrage
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        // Récupérer les todos depuis le stockage
        const todos = await window.electronAPI.getTodos();
        
        if (todos && todos.length > 0) {
          // Calculer les statistiques avec les nouveaux statuts
          const todo = todos.filter(todo => todo.status === 'todo').length;
          const inProgress = todos.filter(todo => todo.status === 'in-progress').length;
          const done = todos.filter(todo => todo.status === 'done').length;
          const total = todos.length;
          
          // Statistiques par priorité
          const lowPriority = todos.filter(todo => todo.priority === 'low').length;
          const mediumPriority = todos.filter(todo => todo.priority === 'medium').length;
          const highPriority = todos.filter(todo => todo.priority === 'high').length;
          
          // Récupérer les tâches les plus récentes
          const sortedTodos = [...todos].sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          
          const recentTasks = sortedTodos.slice(0, 3);
          
          setStats({
            todo,
            inProgress,
            done,
            total,
            lowPriority,
            mediumPriority,
            highPriority,
            recentTasks
          });
        } else {
          // Valeurs par défaut si aucun todo n'est trouvé
          setStats({
            todo: 0,
            inProgress: 0,
            done: 0,
            total: 0,
            lowPriority: 0,
            mediumPriority: 0,
            highPriority: 0,
            recentTasks: []
          });
        }
        
        // Charger les principales cibles
        const targets = getTopTargetsByProgress(5);
        setTopTargets(targets);
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Fonction pour obtenir la classe de couleur de priorité
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'low':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
    }
  };

  // Fonction pour obtenir le libellé de priorité
  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high':
        return 'Élevée';
      case 'medium':
        return 'Moyenne';
      case 'low':
        return 'Faible';
      default:
        return 'Inconnue';
    }
  };

  // Fonction pour obtenir la classe de couleur de statut
  const getStatusClass = (status) => {
    switch (status) {
      case 'done':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'in-progress':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case 'todo':
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
    }
  };

  // Fonction pour obtenir le libellé de statut
  const getStatusLabel = (status) => {
    switch (status) {
      case 'done':
        return 'Terminée';
      case 'in-progress':
        return 'En cours';
      case 'todo':
        return 'À faire';
      default:
        return 'Inconnue';
    }
  };

  // Fonction pour obtenir la classe de couleur du statut de cible
  const getTargetStatusClass = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'inactive':
        return 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50';
      case 'vulnerable':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'secure':
        return 'text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30';
      default:
        return 'text-yellow-600 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30';
    }
  };

  // Fonction pour obtenir le libellé du statut de cible
  const getTargetStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'inactive':
        return 'Inactif';
      case 'vulnerable':
        return 'Vulnérable';
      case 'secure':
        return 'Sécurisé';
      default:
        return 'Inconnu';
    }
  };

  // Fonction pour obtenir la classe de couleur de la progression
  const getProgressColorClass = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  if (loading) {
    return (
      <div className="dashboard p-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Tableau de bord</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>
      
      {/* Cartes statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center">
          <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-3 mr-4">
            <FiAlertCircle className="text-gray-500 dark:text-gray-300" size={24} />
          </div>
          <div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm">À faire</h3>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.todo}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900/50 p-3 mr-4">
            <FiClock className="text-blue-500 dark:text-blue-300" size={24} />
          </div>
          <div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm">En cours</h3>
            <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900/50 p-3 mr-4">
            <FiCheckCircle className="text-green-500 dark:text-green-300" size={24} />
          </div>
          <div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm">Terminées</h3>
            <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{stats.done}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Progression globale */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 lg:col-span-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Progression</h2>
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              {stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}% terminées
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-5 mb-6">
            <div className="flex h-5 rounded-full overflow-hidden">
              <div 
                className="bg-green-500 h-5" 
                style={{ width: `${stats.total > 0 ? (stats.done / stats.total) * 100 : 0}%` }}
              ></div>
              <div 
                className="bg-blue-500 h-5" 
                style={{ width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%` }}
              ></div>
              <div 
                className="bg-gray-400 dark:bg-gray-600 h-5" 
                style={{ width: `${stats.total > 0 ? (stats.todo / stats.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-between text-sm">
            <div className="flex items-center mb-2 mr-4">
              <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
              <span className="text-gray-600 dark:text-gray-400">Terminées ({stats.done})</span>
            </div>
            <div className="flex items-center mb-2 mr-4">
              <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
              <span className="text-gray-600 dark:text-gray-400">En cours ({stats.inProgress})</span>
            </div>
            <div className="flex items-center mb-2">
              <span className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-600 mr-2"></span>
              <span className="text-gray-600 dark:text-gray-400">À faire ({stats.todo})</span>
            </div>
          </div>
        </div>
        
        {/* Distribution par priorité */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 lg:col-span-4">
          <div className="flex items-center mb-4">
            <FiFlag className="text-gray-500 dark:text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Par priorité</h2>
          </div>
          
          {/* Graphique des priorités */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-red-600 dark:text-red-400 font-medium">Élevée</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{stats.highPriority}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-red-500 h-2.5 rounded-full" 
                  style={{ width: `${stats.total > 0 ? (stats.highPriority / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Moyenne</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{stats.mediumPriority}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-yellow-500 h-2.5 rounded-full" 
                  style={{ width: `${stats.total > 0 ? (stats.mediumPriority / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Faible</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{stats.lowPriority}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-500 h-2.5 rounded-full" 
                  style={{ width: `${stats.total > 0 ? (stats.lowPriority / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Principales cibles */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <FiTarget className="text-gray-500 dark:text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Principales cibles</h2>
          </div>
        </div>
        
        {topTargets.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            Aucune cible à afficher. Ajoutez des cibles dans la section "Gestion des Cibles".
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {topTargets.map(target => (
              <div key={target.id} className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mr-3">
                        {target.name}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getTargetStatusClass(target.status)}`}>
                        {getTargetStatusLabel(target.status)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {target.description || "Aucune description"}
                    </p>
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      {target.ipAddress && (
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <FiTarget className="mr-1" />
                          <span>{target.ipAddress}</span>
                        </div>
                      )}
                      
                      {target.hostname && (
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <PiGlobeHemisphereEastFill className="mr-1" />
                          <span>{target.hostname}</span>
                        </div>
                      )}
                      
                      {target.email && (
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <FiMail className="mr-1" />
                          <span>{target.email}</span>
                        </div>
                      )}
                      
                      {target.phoneNumber && (
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <FiPhone className="mr-1" />
                          <span>{target.phoneNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-center min-w-[150px]">
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Progression</span>
                      <span className="font-medium">{target.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-3">
                      <div 
                        className={`h-2.5 rounded-full ${getProgressColorClass(target.progress || 0)}`}
                        style={{ width: `${target.progress || 0}%` }}
                      ></div>
                    </div>
                    
                    {target.analysisStatus && (
                      <div className="text-sm text-center py-1 px-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {target.analysisStatus}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Tâches récentes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <FiList className="text-gray-500 dark:text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tâches récentes</h2>
          </div>
        </div>
        
        {stats.recentTasks.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            Aucune tâche récente à afficher
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {stats.recentTasks.map(task => (
              <div key={task.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className={`text-lg font-medium mb-1 ${
                      task.status === 'done' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                    }`}>
                      {task.text}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {task.description || "Aucune description"}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <FiCalendar className="mr-1" />
                      {formatDate(task.createdAt)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusClass(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityClass(task.priority)}`}>
                      {getPriorityLabel(task.priority)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 