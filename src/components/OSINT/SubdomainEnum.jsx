import React, { useState, useEffect } from 'react';
import { FiSearch, FiInfo, FiCheckCircle, FiXCircle, FiGlobe, FiCopy, FiDownload, FiSettings, FiExternalLink } from 'react-icons/fi';
import { apiKeysService } from '../../services/apiKeysService';

const SubdomainEnum = () => {
  const [domain, setDomain] = useState('');
  const [rapidApiKey, setRapidApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [selectedSubdomains, setSelectedSubdomains] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedApi, setSelectedApi] = useState('subdomain-scan1');

  // Charger la clé API au démarrage
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const key = await apiKeysService.getKey('rapidapiOsint');
        setRapidApiKey(key || '');
      } catch (error) {
        console.error('Erreur lors du chargement de la clé API:', error);
        setError('Impossible de charger la clé API. Veuillez la configurer manuellement.');
      }
    };
    
    loadApiKey();
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

  // Fonction pour valider le domaine
  const isValidDomain = (domain) => {
    // Regex simple pour vérifier le format du domaine
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(domain);
  };

  // Fonction pour effectuer l'énumération de sous-domaines
  const enumerateSubdomains = async () => {
    if (!domain) {
      setError('Veuillez saisir un nom de domaine');
      return;
    }

    if (!isValidDomain(domain)) {
      setError('Veuillez saisir un nom de domaine valide (ex: example.com)');
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
      setSelectedSubdomains([]);
      setSelectAll(false);

      let url, options;
      
      if (selectedApi === 'subdomain-scan1') {
        url = `https://subdomain-scan1.p.rapidapi.com/?domain=${encodeURIComponent(domain)}`;
        
        options = {
          method: 'GET',
          headers: {
            'x-rapidapi-host': 'subdomain-scan1.p.rapidapi.com',
            'x-rapidapi-key': rapidApiKey
          }
        };
      } else {
        url = `https://subdomain-finder3.p.rapidapi.com/v1/subdomain-finder/?domain=${encodeURIComponent(domain)}`;
        
        options = {
          method: 'GET',
          headers: {
            'x-rapidapi-host': 'subdomain-finder3.p.rapidapi.com',
            'x-rapidapi-key': rapidApiKey
          }
        };
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`Erreur lors de l'énumération: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Traitement spécifique selon l'API utilisée
      if (selectedApi === 'subdomain-finder3') {
        // La réponse est différente, on la normalise pour l'affichage
        if (data && data.subdomains) {
          setResults(data.subdomains.map(item => item.subdomain));
        } else {
          setResults([]);
        }
      } else {
        // Pour l'API subdomain-scan1, on prend directement le tableau
        setResults(data);
      }
    } catch (error) {
      console.error('Erreur lors de l\'énumération des sous-domaines:', error);
      setError(error.message || 'Une erreur est survenue lors de l\'énumération');
    } finally {
      setLoading(false);
    }
  };

  // Gérer la sélection d'un sous-domaine
  const toggleSubdomain = (subdomain) => {
    if (selectedSubdomains.includes(subdomain)) {
      setSelectedSubdomains(selectedSubdomains.filter((sd) => sd !== subdomain));
    } else {
      setSelectedSubdomains([...selectedSubdomains, subdomain]);
    }
  };

  // Gérer la sélection/désélection de tous les sous-domaines
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedSubdomains([]);
    } else {
      setSelectedSubdomains(results || []);
    }
    setSelectAll(!selectAll);
  };

  // Copier les sous-domaines sélectionnés
  const copySelectedSubdomains = () => {
    if (selectedSubdomains.length === 0) {
      setError('Veuillez sélectionner au moins un sous-domaine');
      return;
    }

    const textToCopy = selectedSubdomains.join('\n');
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setSuccessMessage(`${selectedSubdomains.length} sous-domaine(s) copié(s) !`);
        setTimeout(() => setSuccessMessage(''), 3000);
      })
      .catch((error) => {
        console.error('Erreur lors de la copie des sous-domaines:', error);
        setError('Impossible de copier les sous-domaines');
      });
  };

  // Télécharger les sous-domaines sélectionnés
  const downloadSelectedSubdomains = async () => {
    if (selectedSubdomains.length === 0) {
      setError('Veuillez sélectionner au moins un sous-domaine');
      return;
    }

    try {
      if (!window.electronAPI || !window.electronAPI.showSaveFileDialog) {
        throw new Error('Fonctionnalité de téléchargement non disponible');
      }

      const options = {
        title: 'Enregistrer les sous-domaines',
        defaultPath: `subdomains-${domain}.txt`,
        filters: [{ name: 'Fichiers texte', extensions: ['txt'] }]
      };

      const result = await window.electronAPI.showSaveFileDialog(options);
      
      if (!result || !result.filePath) {
        return; // L'utilisateur a annulé
      }

      const textToSave = selectedSubdomains.join('\n');
      await window.electronAPI.writeFile(result.filePath, textToSave);
      
      setSuccessMessage(`${selectedSubdomains.length} sous-domaine(s) sauvegardé(s) dans ${result.filePath} !`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Erreur lors du téléchargement des sous-domaines:', error);
      setError(`Impossible de télécharger les sous-domaines: ${error.message}`);
    }
  };

  // Ouvrir un sous-domaine dans le navigateur
  const openInBrowser = (subdomain) => {
    if (!window.electronAPI || !window.electronAPI.openExternalLink) {
      setError('Fonctionnalité d\'ouverture de lien non disponible');
      return;
    }

    const url = `https://${subdomain}`;
    window.electronAPI.openExternalLink(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-indigo-600 dark:text-indigo-400">
        Énumération de Sous-domaines
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
                  href="https://rapidapi.com/search-apis-search-apis-default/api/subdomain-scan1"
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
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="domain">
            Nom de domaine
          </label>
          <div className="flex">
            <input
              type="text"
              id="domain"
              placeholder="Exemple: example.com"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && enumerateSubdomains()}
            />
            <button
              onClick={enumerateSubdomains}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <span>Recherche...</span>
              ) : (
                <>
                  <FiSearch className="mr-2" /> Rechercher
                </>
              )}
            </button>
          </div>
          
          {/* Choix de l'API */}
          <div className="mt-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Choisir l'API à utiliser
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-indigo-600"
                  checked={selectedApi === 'subdomain-scan1'}
                  onChange={() => setSelectedApi('subdomain-scan1')}
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">API 1 (subdomain-scan1)</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-indigo-600"
                  checked={selectedApi === 'subdomain-finder3'}
                  onChange={() => setSelectedApi('subdomain-finder3')}
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">API 2 (subdomain-finder3)</span>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Choisissez l'API en fonction de vos besoins ou si l'une d'elles ne fonctionne pas.
            </p>
          </div>
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
        
        {/* Résultats */}
        {results && results.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Sous-domaines trouvés ({results.length})
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={toggleSelectAll}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                >
                  {selectAll ? 'Désélectionner tout' : 'Sélectionner tout'}
                </button>
                <button
                  onClick={copySelectedSubdomains}
                  disabled={selectedSubdomains.length === 0}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center"
                >
                  <FiCopy className="mr-1" /> Copier
                </button>
                <button
                  onClick={downloadSelectedSubdomains}
                  disabled={selectedSubdomains.length === 0}
                  className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center"
                >
                  <FiDownload className="mr-1" /> Télécharger
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md h-96 overflow-y-auto">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {results.map((subdomain, index) => (
                  <div 
                    key={index}
                    className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 mr-3"
                      checked={selectedSubdomains.includes(subdomain)}
                      onChange={() => toggleSubdomain(subdomain)}
                    />
                    <div className="flex-1 flex items-center">
                      <FiGlobe className="mr-2 text-gray-500" />
                      <span className="text-gray-700 dark:text-gray-300">{subdomain}</span>
                    </div>
                    <button
                      onClick={() => openInBrowser(subdomain)}
                      className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
                      title="Ouvrir dans le navigateur"
                    >
                      <FiExternalLink size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {results && results.length === 0 && (
          <div className="mt-6 p-6 text-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
            <FiInfo className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">Aucun sous-domaine trouvé</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Aucun sous-domaine n'a été trouvé pour ce domaine. Essayez un autre domaine ou une autre API.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubdomainEnum; 