import React, { useState, useEffect } from 'react';
import { FiSearch, FiInfo, FiCheckCircle, FiXCircle, FiCode, FiGlobe, FiSettings, FiExternalLink } from 'react-icons/fi';
import { apiKeysService } from '../../services/apiKeysService';

const WebTechnologies = () => {
  const [url, setUrl] = useState('');
  const [rapidApiKey, setRapidApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  // Charger les clés API
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const savedKey = await apiKeysService.getKey('wappalyzerApiKey');
        if (savedKey) setRapidApiKey(savedKey);
      } catch (error) {
        console.error('Erreur lors du chargement de la clé API:', error);
        setError('Impossible de charger la clé API');
      }
    };
    
    loadApiKey();
    
    // Charger l'historique des recherches
    const savedHistory = JSON.parse(localStorage.getItem('webtechnologies_history') || '[]');
    setSearchHistory(savedHistory);
    
    // Vérifier si une URL a été passée depuis la vue Targets
    const urlData = localStorage.getItem('webTechUrl');
    if (urlData) {
      setUrl(urlData);
      console.log('[WebTechnologies] URL chargée depuis Targets:', urlData);
      // Supprimer les données pour éviter de les réutiliser à chaque montage
      localStorage.removeItem('webTechUrl');
    }
  }, []);

  // Fonction pour sauvegarder la clé API
  const saveApiKey = async () => {
    try {
      setSavingKey(true);
      setError('');
      setSuccessMessage('');
      
      if (!rapidApiKey) {
        setError('Veuillez entrer une clé API valide');
        return;
      }
      
      await apiKeysService.saveKey('rapidapiOsint', rapidApiKey);
      setSuccessMessage('Clé API sauvegardée avec succès !');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la clé API:', error);
      setError('Erreur lors de la sauvegarde de la clé API. Veuillez réessayer.');
    } finally {
      setSavingKey(false);
    }
  };

  // Fonction pour valider l'URL
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Fonction pour assurer que l'URL commence par http:// ou https://
  const formatUrl = (url) => {
    if (!url) return url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  // Fonction pour analyser les technologies web
  const analyzeWebTechnologies = async () => {
    const formattedUrl = formatUrl(url);
    
    if (!formattedUrl) {
      setError('Veuillez saisir une URL');
      return;
    }

    if (!isValidUrl(formattedUrl)) {
      setError('Veuillez saisir une URL valide (ex: https://example.com)');
      return;
    }

    if (!rapidApiKey) {
      setError('Veuillez configurer votre clé API RapidAPI');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResults(null);
      
      const apiUrl = 'https://active-cyber-defence-tools.p.rapidapi.com/capabilities/webtech/execute';
      
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': 'active-cyber-defence-tools.p.rapidapi.com',
          'x-rapidapi-key': rapidApiKey
        },
        body: JSON.stringify({
          config: {
            crawl_target: true,
            delay_sec: 0.1,
            disable_cache: false,
            prefer_https: true,
            threads: 5,
            timeout_sec: 120,
            verify_https: false
          },
          options: {},
          target: formattedUrl
        })
      };

      console.log('Envoi de la requête à l\'API WebTech avec l\'URL:', formattedUrl);
      const response = await fetch(apiUrl, options);

      if (!response.ok) {
        throw new Error(`Erreur lors de l'analyse: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Réponse de l\'API WebTech:', data);
      setResults(data);
    } catch (error) {
      console.error('Erreur lors de l\'analyse des technologies web:', error);
      setError(error.message || 'Une erreur est survenue lors de l\'analyse');
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir un lien dans le navigateur
  const openInBrowser = (url) => {
    if (!window.electronAPI || !window.electronAPI.openExternalLink) {
      setError('Fonctionnalité d\'ouverture de lien non disponible');
      return;
    }

    window.electronAPI.openExternalLink(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-indigo-600 dark:text-indigo-400">
        Analyse des Technologies Web
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
                value={rapidApiKey}
                onChange={(e) => setRapidApiKey(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                <a 
                  href="https://rapidapi.com/marketplace"
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
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="url">
            URL du site web
          </label>
          <div className="flex">
            <input
              type="text"
              id="url"
              placeholder="Exemple: example.com ou https://example.com"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && analyzeWebTechnologies()}
            />
            <button
              onClick={analyzeWebTechnologies}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <span>Analyse...</span>
              ) : (
                <>
                  <FiSearch className="mr-2" /> Analyser
                </>
              )}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Entrez l'URL complète du site web que vous souhaitez analyser
          </p>
        </div>
        
        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md flex items-center">
            <FiXCircle className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-md flex items-center">
            <FiCheckCircle className="mr-2 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        
        {/* Affichage du chargement */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Analyse des technologies en cours...</p>
            <p className="text-sm text-gray-500">Cette opération peut prendre jusqu'à 2 minutes</p>
          </div>
        )}
        
        {/* Résultats */}
        {results && (
          <div className="mt-6">
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <FiGlobe className="mr-2 text-indigo-500" />
                Résultats pour {results.target}
              </h3>
              
              {/* Informations générales */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Informations générales</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">URL analysée:</span> {results.target}</p>
                    <p><span className="font-medium">Durée de l'analyse:</span> {(results.duration_ms / 1000).toFixed(2)} secondes</p>
                    <p><span className="font-medium">Date d'analyse:</span> {new Date(results.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                
                {results.rag_analysis && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Analyse de sécurité</h4>
                    {results.rag_analysis.map((analysis, index) => (
                      <div key={index} className="mb-2 text-sm">
                        <div className="flex items-center mb-1">
                          <div className={`w-3 h-3 rounded-full mr-2 ${analysis.rag === 'green' ? 'bg-green-500' : analysis.rag === 'amber' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                          <p className="font-medium">{analysis.title}</p>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 ml-5">{analysis.advice || "Aucun conseil disponible."}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Technologies détectées */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <FiCode className="mr-2" />
                  Technologies détectées
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.result && results.result.fingerprints && results.result.fingerprints.map((tech, index) => (
                    <div 
                      key={index} 
                      className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <h5 className="font-semibold text-indigo-600 dark:text-indigo-400">{tech.technology}</h5>
                        {tech.version && <span className="bg-gray-200 dark:bg-gray-700 px-2 py-1 text-xs rounded">{tech.version}</span>}
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{tech.description}</p>
                      
                      {tech.website && (
                        <button
                          onClick={() => openInBrowser(tech.website)}
                          className="mt-3 text-blue-500 hover:text-blue-700 text-sm flex items-center"
                        >
                          <FiExternalLink className="mr-1" /> Site web officiel
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Résumé */}
              {results.summary && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Résumé</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{results.summary}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebTechnologies; 