import React, { useState, useEffect } from 'react';
import { FiSearch, FiInfo, FiCheckCircle, FiXCircle, FiSettings, FiGlobe, FiList, FiTrendingUp, FiArrowDown, FiArrowUp } from 'react-icons/fi';
import { apiKeysService } from '../../services/apiKeysService';

const OsintRanking = () => {
  const [domain, setDomain] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [sortBy, setSortBy] = useState('desc');
  const [orderBy, setOrderBy] = useState('position');
  const [offset, setOffset] = useState(0);

  // Charger la clé API au démarrage
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const key = await apiKeysService.getKey('rapidapiOsint');
        setApiKey(key || '');
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
      
      if (apiKey) {
        await apiKeysService.saveKey('rapidapiOsint', apiKey);
        setSuccessMessage('Clé API sauvegardée avec succès !');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Veuillez entrer une clé API valide');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la clé API:', error);
      setError('Erreur lors de la sauvegarde de la clé API. Veuillez réessayer.');
    } finally {
      setSavingKey(false);
    }
  };

  // Fonction pour valider l'URL
  const isValidDomain = (domain) => {
    // Regex simple pour vérifier le format du domaine
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(domain);
  };

  // Fonction pour effectuer la recherche SEO
  const performSearch = async () => {
    if (!domain) {
      setError('Veuillez saisir un nom de domaine');
      return;
    }

    if (!isValidDomain(domain)) {
      setError('Veuillez saisir un nom de domaine valide (ex: example.com)');
      return;
    }

    if (!apiKey) {
      setError('Veuillez configurer votre clé API RapidAPI');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResults(null);

      const url = `https://seo-website-ranking-keywords.p.rapidapi.com/?domain=${encodeURIComponent(domain)}&offset=${offset}&order_by=${orderBy}&sort_by=${sortBy}`;
      
      const options = {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'seo-website-ranking-keywords.p.rapidapi.com'
        }
      };

      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`Erreur lors de la recherche: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Erreur lors de la recherche SEO:', error);
      setError(error.message || 'Une erreur est survenue lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour formatter les résultats
  const formatResults = () => {
    if (!results) return null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 overflow-auto">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FiList className="mr-2 text-blue-500" /> Résultats SEO pour: {domain}
        </h3>
        
        {results.error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
            <p className="flex items-center">
              <FiXCircle className="mr-2" />
              {results.error}
            </p>
          </div>
        )}
        
        {results.keywords && results.keywords.length > 0 ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-gray-700 dark:text-gray-300">
                {results.total && <span>Total de {results.total} mots-clés trouvés. </span>}
                Affichage de {results.keywords.length} résultats.
              </p>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    if (offset > 0) {
                      setOffset(offset - 10);
                      setTimeout(performSearch, 100);
                    }
                  }}
                  disabled={offset === 0 || loading}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Précédent
                </button>
                <button 
                  onClick={() => {
                    setOffset(offset + 10);
                    setTimeout(performSearch, 100);
                  }}
                  disabled={!results.keywords.length || results.keywords.length < 10 || loading}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Mot-clé
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Volume
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      CPC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      URL
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {results.keywords.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {item.keyword}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="flex items-center">
                          {item.position < 10 ? (
                            <span className="text-green-600 dark:text-green-400 flex items-center">
                              <FiTrendingUp className="mr-1" />
                              {item.position}
                            </span>
                          ) : item.position < 50 ? (
                            <span className="text-yellow-600 dark:text-yellow-400">
                              {item.position}
                            </span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400">
                              {item.position}
                            </span>
                          )}
                          
                          {item.position_change && (
                            <span className="ml-2">
                              {item.position_change > 0 ? (
                                <span className="text-green-600 dark:text-green-400 flex items-center">
                                  <FiArrowUp className="mr-1" />
                                  {item.position_change}
                                </span>
                              ) : item.position_change < 0 ? (
                                <span className="text-red-600 dark:text-red-400 flex items-center">
                                  <FiArrowDown className="mr-1" />
                                  {Math.abs(item.position_change)}
                                </span>
                              ) : null}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {item.volume || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {item.cpc ? `$${item.cpc}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.url ? (
                          <a 
                            href={item.url.startsWith('http') ? item.url : `https://${item.url}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline truncate inline-block max-w-xs"
                          >
                            {item.url}
                          </a>
                        ) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            Aucun résultat trouvé pour ce domaine.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-indigo-600 dark:text-indigo-400">
        OSINT - Analyse SEO & Mots-clés
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
                  href="https://rapidapi.com/Search-APIs-search-apis-default/api/seo-website-ranking-keywords"
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
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FiGlobe className="text-gray-500" />
              </span>
              <input
                type="text"
                id="domain"
                placeholder="exemple.com"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            <button
              onClick={performSearch}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-r-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Recherche...' : 'Analyser'}
            </button>
          </div>
        </div>
        
        {/* Options de recherche */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Trier par
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="desc">Descendant</option>
              <option value="asc">Ascendant</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Ordonner par
            </label>
            <select
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="position">Position</option>
              <option value="volume">Volume</option>
              <option value="cpc">CPC</option>
            </select>
          </div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 p-4 rounded">
          <p className="flex items-center">
            <FiInfo className="mr-2" />
            Cet outil analyse le classement SEO d'un domaine et affiche les mots-clés pour lesquels il se positionne.
            Les résultats incluent la position, le volume de recherche et le CPC (coût par clic).
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Analyse SEO en cours...</p>
        </div>
      )}
      
      {results && !loading && formatResults()}
    </div>
  );
};

export default OsintRanking; 