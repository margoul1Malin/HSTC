import React, { useState, useEffect } from 'react';
import { FiPlus, FiFilter, FiX, FiLayers } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';
import TodoItem from './TodoItem';

const TodoList = () => {
  // État pour les todos
  const [todos, setTodos] = useState([]);
  // État pour le nouveau todo
  const [newTodo, setNewTodo] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  // État pour le mode ajout
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  // État pour le filtre
  const [filter, setFilter] = useState('all');
  // État pour le mode édition
  const [editingId, setEditingId] = useState(null);
  // État pour le texte d'édition
  const [editText, setEditText] = useState('');
  const [editDescription, setEditDescription] = useState('');
  // État pour le chargement
  const [loading, setLoading] = useState(true);

  // Charger les todos au démarrage
  useEffect(() => {
    const loadTodos = async () => {
      try {
        setLoading(true);
        // Récupérer les todos depuis le stockage
        const storedTodos = await window.electronAPI.getTodos();
        
        if (storedTodos && storedTodos.length > 0) {
          // Migrations des anciens todos si nécessaire
          const migratedTodos = storedTodos.map(todo => ({
            ...todo,
            description: todo.description || '',
            status: todo.status || (todo.completed ? 'done' : 'todo')
          }));
          setTodos(migratedTodos);
          
          // Mettre à jour si la migration a été effectuée
          if (migratedTodos.some(todo => todo.status !== todo.completed)) {
            for (const todo of migratedTodos) {
              await window.electronAPI.updateTodo(todo);
            }
          }
        } else {
          // Données de démonstration si aucun todo n'est trouvé
          const demoTodos = [
            { 
              id: uuidv4(), 
              text: 'Créer un design moderne pour le tableau de bord', 
              description: 'Implémenter une interface utilisateur intuitive avec Tailwind CSS',
              status: 'done', 
              priority: 'high',
              createdAt: new Date().toISOString()
            },
            { 
              id: uuidv4(), 
              text: 'Implémenter la fonctionnalité de drag and drop', 
              description: 'Utiliser react-beautiful-dnd pour permettre aux utilisateurs de réorganiser les tâches',
              status: 'in-progress', 
              priority: 'medium',
              createdAt: new Date().toISOString()
            },
            { 
              id: uuidv4(), 
              text: 'Ajouter le mode sombre', 
              description: 'Créer un thème sombre qui s\'active automatiquement selon les préférences système',
              status: 'todo', 
              priority: 'low',
              createdAt: new Date().toISOString()
            },
            { 
              id: uuidv4(), 
              text: 'Optimiser les performances', 
              description: 'Analyser et améliorer les temps de chargement et la réactivité de l\'application',
              status: 'todo', 
              priority: 'high',
              createdAt: new Date().toISOString()
            },
          ];
          setTodos(demoTodos);
          
          // Sauvegarder les todos de démonstration
          for (const todo of demoTodos) {
            await window.electronAPI.addTodo(todo);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des todos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTodos();
  }, []);

  // Filtrer les todos
  const filteredTodos = todos.filter(todo => {
    if (filter === 'all') return true;
    if (filter === 'todo') return todo.status === 'todo';
    if (filter === 'in-progress') return todo.status === 'in-progress';
    if (filter === 'done') return todo.status === 'done';
    return true;
  });

  // Ouvrir le formulaire d'ajout
  const handleOpenAddForm = () => {
    setIsAddingTodo(true);
    setNewTodo('');
    setNewDescription('');
  };

  // Annuler l'ajout d'un todo
  const handleCancelAdd = () => {
    setIsAddingTodo(false);
    setNewTodo('');
    setNewDescription('');
  };

  // Ajouter un nouveau todo
  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (newTodo.trim() === '') return;

    const todo = {
      id: uuidv4(),
      text: newTodo,
      description: newDescription,
      status: 'todo',
      priority: newPriority,
      createdAt: new Date().toISOString()
    };

    try {
      await window.electronAPI.addTodo(todo);
      setTodos([...todos, todo]);
      setNewTodo('');
      setNewDescription('');
      setNewPriority('medium');
      setIsAddingTodo(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du todo:', error);
    }
  };

  // Supprimer un todo
  const handleDeleteTodo = async (id) => {
    try {
      await window.electronAPI.deleteTodo(id);
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression du todo:', error);
    }
  };

  // Changer le statut d'un todo
  const handleChangeStatus = async (id, status) => {
    try {
      const todoToUpdate = todos.find(todo => todo.id === id);
      if (!todoToUpdate) return;

      const updatedTodo = { ...todoToUpdate, status };
      await window.electronAPI.updateTodo(updatedTodo);
      
      setTodos(
        todos.map(todo =>
          todo.id === id ? updatedTodo : todo
        )
      );
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  // Commencer l'édition d'un todo
  const handleStartEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
    setEditDescription(todo.description || '');
  };

  // Sauvegarder l'édition d'un todo
  const handleSaveEdit = async () => {
    if (editText.trim() === '') return;

    try {
      const todoToUpdate = todos.find(todo => todo.id === editingId);
      if (!todoToUpdate) return;

      const updatedTodo = { 
        ...todoToUpdate, 
        text: editText,
        description: editDescription
      };
      
      await window.electronAPI.updateTodo(updatedTodo);
      
      setTodos(
        todos.map(todo =>
          todo.id === editingId ? updatedTodo : todo
        )
      );
      setEditingId(null);
      setEditText('');
      setEditDescription('');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'édition:', error);
    }
  };

  // Annuler l'édition
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditDescription('');
  };

  // Changer la priorité d'un todo
  const handleChangePriority = async (id, priority) => {
    try {
      const todoToUpdate = todos.find(todo => todo.id === id);
      if (!todoToUpdate) return;

      const updatedTodo = { ...todoToUpdate, priority };
      await window.electronAPI.updateTodo(updatedTodo);
      
      setTodos(
        todos.map(todo =>
          todo.id === id ? updatedTodo : todo
        )
      );
    } catch (error) {
      console.error('Erreur lors du changement de priorité:', error);
    }
  };

  if (loading) {
    return (
      <div className="todo-list p-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Gestion des tâches</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">Chargement des tâches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="todo-list p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des tâches</h1>
        
        {!isAddingTodo && (
          <button
            onClick={handleOpenAddForm}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <FiPlus className="mr-2" />
            Nouvelle tâche
          </button>
        )}
      </div>
      
      {/* Formulaire d'ajout */}
      {isAddingTodo && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-5 border-l-4 border-indigo-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ajouter une nouvelle tâche</h2>
            <button 
              onClick={handleCancelAdd}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FiX size={20} />
            </button>
          </div>
          
          <form onSubmit={handleAddTodo}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Titre
              </label>
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Titre de la tâche"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent dark:bg-gray-800 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none"
                autoFocus
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description détaillée de la tâche"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent dark:bg-gray-800 min-h-[100px] focus:border-indigo-500 dark:focus:border-indigo-400 outline-none"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priorité
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent dark:bg-gray-800"
              >
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Élevée</option>
              </select>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCancelAdd}
                className="mr-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                <FiPlus className="mr-2" />
                Ajouter
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <FiFilter className="text-gray-500 mr-2" />
          <span className="text-gray-600 dark:text-gray-400 mr-2">Filtrer:</span>
          
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md ${
              filter === 'all'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Toutes
          </button>
          
          <button
            onClick={() => setFilter('todo')}
            className={`px-3 py-1 rounded-md ${
              filter === 'todo'
                ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            À faire
          </button>
          
          <button
            onClick={() => setFilter('in-progress')}
            className={`px-3 py-1 rounded-md ${
              filter === 'in-progress'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            En cours
          </button>
          
          <button
            onClick={() => setFilter('done')}
            className={`px-3 py-1 rounded-md ${
              filter === 'done'
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Terminées
          </button>
        </div>
      </div>
      
      {/* Liste des todos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-4">
        {filteredTodos.length === 0 ? (
          <div className="p-8 text-center">
            <FiLayers className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
            <p className="text-gray-500 dark:text-gray-400 mb-2">Aucune tâche à afficher</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {filter === 'all' 
                ? 'Ajoutez une nouvelle tâche pour commencer' 
                : 'Essayez de changer le filtre pour voir d\'autres tâches'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTodos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                editingId={editingId}
                editText={editText}
                editDescription={editDescription}
                setEditText={setEditText}
                setEditDescription={setEditDescription}
                onToggle={() => handleChangeStatus(todo.id, todo.status === 'done' ? 'todo' : 'done')}
                onDelete={handleDeleteTodo}
                onStartEdit={handleStartEdit}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onChangePriority={handleChangePriority}
                onChangeStatus={handleChangeStatus}
              />
            ))}
          </ul>
        )}
      </div>
      
      {/* Statistiques */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Statistiques</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
            <div className="text-gray-500 dark:text-gray-400 text-sm">À faire</div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              {todos.filter(todo => todo.status === 'todo').length}
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="text-blue-500 dark:text-blue-400 text-sm">En cours</div>
            <div className="text-xl font-semibold text-blue-600 dark:text-blue-300">
              {todos.filter(todo => todo.status === 'in-progress').length}
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="text-green-500 dark:text-green-400 text-sm">Terminées</div>
            <div className="text-xl font-semibold text-green-600 dark:text-green-300">
              {todos.filter(todo => todo.status === 'done').length}
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 flex justify-between items-center">
          <p>
            Total: {todos.length} tâches
          </p>
          <div className="text-right">
            <span className="inline-block w-3 h-3 rounded-full bg-indigo-500 mr-1"></span>
            {Math.round((todos.filter(todo => todo.status === 'done').length / (todos.length || 1)) * 100)}% terminées
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoList; 