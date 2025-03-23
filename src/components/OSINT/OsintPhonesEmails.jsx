import React, { useState, useEffect } from 'react';
import { FiSearch, FiInfo, FiCheckCircle, FiXCircle, FiSettings, FiUser, FiPhone, FiMail, FiGlobe, FiList } from 'react-icons/fi';
import { apiKeysService } from '../../services/apiKeysService';
import { useNotification } from '../../context/NotificationContext';

const OsintPhonesEmails = () => {
  const { showSuccess, showError, showInfo, showWarning, showNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all'); // 'phone', 'email', 'username', 'all'
  const [apiKey, setApiKey] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  // Charger les données sauvegardées au démarrage
  useEffect(() => {
    const loadApiKeys = async () => {
      try {
        const rapidapiKey = await apiKeysService.getKey('rapidapiOsint');
        if (rapidapiKey) setApiKey(rapidapiKey);
      } catch (error) {
        console.error("Erreur lors du chargement des clés API:", error);
        showError("Impossible de charger la clé API. Veuillez la configurer manuellement.");
      }
    };
    
    loadApiKeys();
    
    // Vérifier si des données ont été passées depuis la vue Targets
    const osintData = localStorage.getItem('osintPhonesEmailsData');
    if (osintData) {
      setSearchTerm(osintData);
      // Déterminer automatiquement le type de recherche
      setSearchType(detectSearchType(osintData));
      // Supprimer les données pour éviter de les réutiliser à chaque montage
      localStorage.removeItem('osintPhonesEmailsData');
    }
  }, [showError]);

  // Fonction pour sauvegarder la clé API
  const saveApiKey = async () => {
    try {
      setSavingKey(true);
      setError('');
      setSuccessMessage('');
      
      if (apiKey) {
        await apiKeysService.saveKey('rapidapiOsint', apiKey);
        setSuccessMessage('Clé API sauvegardée avec succès !');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        showError('Veuillez entrer une clé API valide');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la clé API:', error);
      showError('Erreur lors de la sauvegarde de la clé API. Veuillez réessayer.');
    } finally {
      setSavingKey(false);
    }
  };

  // Fonction pour effectuer la recherche OSINT
  const performSearch = async () => {
    if (!searchTerm) {
      showError('Veuillez saisir un terme de recherche');
      return;
    }

    if (!apiKey) {
      showError('Veuillez configurer votre clé API RapidAPI');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResults(null);

      const options = {
        method: 'POST',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'osint-phone-email-names-search-everything.p.rapidapi.com',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request: searchTerm,
          lang: language
        })
      };

      const response = await fetch('https://osint-phone-email-names-search-everything.p.rapidapi.com/search', options);

      if (!response.ok) {
        throw new Error(`Erreur lors de la recherche: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Erreur lors de la recherche OSINT:', error);
      showError(error.message || 'Une erreur est survenue lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour déterminer le type de recherche automatiquement
  const detectSearchType = (term) => {
    // Email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(term)) {
      return 'email';
    }
    // Téléphone (+ suivi de chiffres ou chiffres uniquement)
    else if (/^\+?\d+$/.test(term)) {
      return 'phone';
    }
    // Nom d'utilisateur
    else {
      return 'username';
    }
  };

  // Gérer le changement de terme de recherche
  const handleSearchTermChange = (value) => {
    setSearchTerm(value);
    if (searchType === 'all') {
      // Mettre à jour automatiquement le type de recherche
      const detectedType = detectSearchType(value);
      setSearchType(detectedType);
    }
  };

  // Fonction pour formater et afficher les résultats
  const formatResults = () => {
    if (!results) return null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 overflow-auto">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FiList className="mr-2 text-blue-500" /> Résultats pour: {searchTerm}
        </h3>
        
        {results.error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
            <p className="flex items-center">
              <FiXCircle className="mr-2" />
              {results.error}
            </p>
          </div>
        )}
        
        {results.NumOfResults > 0 ? (
          <div className="space-y-6">
            <p className="text-gray-700 dark:text-gray-300">
              Trouvé {results.NumOfResults} résultat(s) dans {results.NumOfDatabase} base(s) de données.
              Temps de recherche: {results.search_time || results['search time']}s
            </p>
            
            {/* Parcourir toutes les bases de données dans la propriété "List" */}
            {results.List && Object.keys(results.List).map((dbName) => {
              const database = results.List[dbName];
              
              // Ne pas afficher les bases sans données
              if (!database.Data || database.Data.length === 0) return null;
              
              return (
                <div key={dbName} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-lg mb-2 text-indigo-600 dark:text-indigo-400">
                    {dbName}
                  </h4>
                  
                  {database.InfoLeak && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 p-3 mb-4 rounded text-sm">
                      <p>{database.InfoLeak}</p>
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {database.NumOfResults} entrée(s) trouvée(s)
                  </p>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          {database.Data[0] && Object.keys(database.Data[0]).map((header) => (
                            <th
                              key={header}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {database.Data.map((item, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                            {Object.entries(item).map(([key, value]) => (
                              <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            Aucun résultat trouvé pour cette recherche.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-indigo-600 dark:text-indigo-400">
        OSINT - Recherche Téléphone, Email & Nom d'utilisateur
      </h1>
      
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-8">
        {/* Configuration de la clé API */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FiSettings className="mr-2" /> Configuration API
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="apiKey">
                Clé API RapidAPI <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="apiKey"
                placeholder="Entrez votre clé API RapidAPI"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                <a 
                  href="https://rapidapi.com/datagardener-pty-ltd-datagardener-pty-ltd-default/api/osint-phone-email-names-search-everything" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  S'inscrire sur RapidAPI
                </a> pour obtenir une clé API
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={saveApiKey}
                disabled={savingKey}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {savingKey ? 'Sauvegarde en cours...' : 'Sauvegarder la clé'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Formulaire de recherche */}
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="searchTerm">
            Terme de recherche
          </label>
          <div className="flex">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                {searchType === 'email' && <FiMail className="text-gray-500" />}
                {searchType === 'phone' && <FiPhone className="text-gray-500" />}
                {(searchType === 'username' || searchType === 'all') && <FiUser className="text-gray-500" />}
              </span>
              <input
                type="text"
                id="searchTerm"
                placeholder="Email, téléphone ou nom d'utilisateur"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                value={searchTerm}
                onChange={(e) => handleSearchTermChange(e.target.value)}
              />
            </div>
            <button
              onClick={performSearch}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-r-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Recherche...' : 'Rechercher'}
            </button>
          </div>
        </div>
        
        {/* Options de recherche */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Type de recherche
            </label>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center bg-white dark:bg-gray-700 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600">
                <input
                  type="radio"
                  name="searchType"
                  value="all"
                  checked={searchType === 'all'}
                  onChange={() => setSearchType('all')}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="ml-2">Auto</span>
              </label>
              
              <label className="inline-flex items-center bg-white dark:bg-gray-700 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600">
                <input
                  type="radio"
                  name="searchType"
                  value="email"
                  checked={searchType === 'email'}
                  onChange={() => setSearchType('email')}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="ml-2">Email</span>
              </label>
              
              <label className="inline-flex items-center bg-white dark:bg-gray-700 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600">
                <input
                  type="radio"
                  name="searchType"
                  value="phone"
                  checked={searchType === 'phone'}
                  onChange={() => setSearchType('phone')}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="ml-2">Téléphone</span>
              </label>
              
              <label className="inline-flex items-center bg-white dark:bg-gray-700 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600">
                <input
                  type="radio"
                  name="searchType"
                  value="username"
                  checked={searchType === 'username'}
                  onChange={() => setSearchType('username')}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="ml-2">Nom d'utilisateur</span>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Langue des résultats
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="en">Anglais</option>
              <option value="fr">Français</option>
              <option value="es">Espagnol</option>
              <option value="de">Allemand</option>
              <option value="it">Italien</option>
              <option value="pt">Portugais</option>
              <option value="ru">Russe</option>
            </select>
          </div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 p-4 rounded">
          <p className="flex items-center">
            <FiInfo className="mr-2" />
            Cet outil recherche des informations publiquement disponibles sur les emails, numéros de téléphone et noms d'utilisateur.
            Utilisez-le de manière éthique et responsable.
          </p>
        </div>
        
        {error && (
          <div className="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            <p className="flex items-center">
              <FiXCircle className="mr-2" />
              {error}
            </p>
          </div>
        )}
        
        {successMessage && (
          <div className="mt-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
            <p className="flex items-center">
              <FiCheckCircle className="mr-2" />
              {successMessage}
            </p>
          </div>
        )}
      </div>
      
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Recherche en cours...</p>
        </div>
      )}
      
      {results && !loading && formatResults()}
    </div>
  );
};

export default OsintPhonesEmails; 