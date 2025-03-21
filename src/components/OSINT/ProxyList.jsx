import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiRefreshCw, FiDownload, FiCheckCircle, FiXCircle, FiGlobe, FiSettings } from 'react-icons/fi';
import { apiKeysService } from '../../services/apiKeysService';

const ProxyList = () => {
  const [rapidApiKey, setRapidApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [proxies, setProxies] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [totalProxies, setTotalProxies] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [sortBy, setSortBy] = useState('lastChecked');
  const [sortType, setSortType] = useState('desc');
  const [filterProtocol, setFilterProtocol] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterAnonymity, setFilterAnonymity] = useState('');
  const [availableCountries, setAvailableCountries] = useState([]);
  const [copySuccess, setCopySuccess] = useState('');

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

  // Extraire les pays disponibles à partir des proxies chargés
  useEffect(() => {
    if (proxies.length > 0) {
      const countries = [...new Set(proxies.map(proxy => proxy.country))].filter(Boolean).sort();
      setAvailableCountries(countries);
    }
  }, [proxies]);

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

  // Fonction pour récupérer les proxies
  const fetchProxies = async () => {
    if (!rapidApiKey) {
      setError('Veuillez configurer votre clé API RapidAPI');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const url = `https://proxy-list4.p.rapidapi.com/proxy-list?limit=${limit}&page=${currentPage}&sort_by=${sortBy}&sort_type=${sortType}`;
      
      // Ajouter des filtres si spécifiés
      let finalUrl = url;
      if (filterProtocol) finalUrl += `&protocol=${filterProtocol}`;
      if (filterCountry) finalUrl += `&country=${filterCountry}`;
      if (filterAnonymity) finalUrl += `&anonymityLevel=${filterAnonymity}`;
      
      const options = {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'proxy-list4.p.rapidapi.com',
          'x-rapidapi-key': rapidApiKey
        }
      };

      console.log('Envoi de la requête à l\'API ProxyList:', finalUrl);
      const response = await fetch(finalUrl, options);

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des proxies: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Réponse de l\'API ProxyList:', data);
      
      setProxies(data.data || []);
      setTotalProxies(data.total || 0);
    } catch (error) {
      console.error('Erreur lors de la récupération des proxies:', error);
      setError(error.message || 'Une erreur est survenue lors de la récupération des proxies');
    } finally {
      setLoading(false);
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Date inconnue';
    }
  };

  // Formater les protocoles pour l'affichage
  const formatProtocols = (protocols) => {
    if (!protocols || !Array.isArray(protocols)) return 'N/A';
    return protocols.join(', ');
  };

  // Télécharger la liste de proxies au format CSV
  const downloadCSV = () => {
    if (proxies.length === 0) {
      setError('Aucun proxy à télécharger');
      return;
    }

    try {
      // Créer les en-têtes du CSV
      const headers = ['IP', 'Port', 'Protocoles', 'Anonymité', 'Pays', 'Ville', 'Temps de réponse (ms)', 'Vitesse', 'Dernière vérification'];
      
      // Créer les lignes de données
      const rows = proxies.map(proxy => [
        proxy.ip,
        proxy.port,
        formatProtocols(proxy.protocols),
        proxy.anonymityLevel || 'N/A',
        proxy.country || 'N/A',
        proxy.city || 'N/A',
        proxy.responseTime || 'N/A',
        proxy.speed || 'N/A',
        formatDate(proxy.lastChecked)
      ]);
      
      // Combiner les en-têtes et les lignes
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Créer un Blob avec le contenu CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Créer un lien de téléchargement et le cliquer automatiquement
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `proxy_list_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccessMessage('Liste de proxies téléchargée avec succès');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Erreur lors du téléchargement du CSV:', error);
      setError('Erreur lors du téléchargement du CSV');
    }
  };

  // Copier l'adresse IP:port d'un proxy
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopySuccess(`${text} copié!`);
        setTimeout(() => setCopySuccess(''), 2000);
      })
      .catch(err => {
        console.error('Erreur de copie:', err);
        setError('Impossible de copier le texte');
      });
  };

  // Créer un lien de configuration pour un proxy spécifique
  const getProxySetupLink = (proxy) => {
    if (!proxy || !proxy.ip || !proxy.port || !proxy.protocols || proxy.protocols.length === 0) {
      return null;
    }

    const protocol = proxy.protocols[0].toLowerCase();
    const connectionString = `${protocol}://${proxy.ip}:${proxy.port}`;
    
    return connectionString;
  };

  // Rendu de l'interface utilisateur
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-indigo-600 dark:text-indigo-400">
        Liste de Proxies
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
        
        {/* Options de filtrage et tri */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FiFilter className="mr-2" /> Filtres et Options
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="protocol">
                Protocole
              </label>
              <select
                id="protocol"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                value={filterProtocol}
                onChange={(e) => setFilterProtocol(e.target.value)}
              >
                <option value="">Tous</option>
                <option value="http">HTTP</option>
                <option value="socks4">SOCKS4</option>
                <option value="socks5">SOCKS5</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="country">
                Pays
              </label>
              <select
                id="country"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
              >
                <option value="">Tous</option>
                {availableCountries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="anonymity">
                Niveau d'anonymat
              </label>
              <select
                id="anonymity"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                value={filterAnonymity}
                onChange={(e) => setFilterAnonymity(e.target.value)}
              >
                <option value="">Tous</option>
                <option value="elite">Elite</option>
                <option value="anonymous">Anonymous</option>
                <option value="transparent">Transparent</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="sortBy">
                Trier par
              </label>
              <select
                id="sortBy"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="lastChecked">Dernière vérification</option>
                <option value="responseTime">Temps de réponse</option>
                <option value="speed">Vitesse</option>
                <option value="upTime">Temps de fonctionnement</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="sortType">
                Ordre de tri
              </label>
              <select
                id="sortType"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                value={sortType}
                onChange={(e) => setSortType(e.target.value)}
              >
                <option value="desc">Décroissant</option>
                <option value="asc">Croissant</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="limit">
                Résultats par page
              </label>
              <select
                id="limit"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Boutons d'action */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={fetchProxies}
            disabled={loading || !rapidApiKey}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <span>Chargement...</span>
            ) : (
              <>
                <FiSearch className="mr-2" /> Rechercher des proxies
              </>
            )}
          </button>
          
          <button
            onClick={downloadCSV}
            disabled={loading || proxies.length === 0}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            <FiDownload className="mr-2" /> Télécharger CSV
          </button>
          
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchProxies();
            }}
            disabled={loading || !rapidApiKey}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <FiRefreshCw className="mr-2" /> Actualiser
          </button>
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
        
        {copySuccess && (
          <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-md flex items-center">
            <FiCheckCircle className="mr-2 flex-shrink-0" />
            <span>{copySuccess}</span>
          </div>
        )}
        
        {/* Tableau des résultats */}
        {proxies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">IP:Port</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Protocoles</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Anonymat</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Localisation</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Temps de réponse</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dernière vérification</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {proxies.map((proxy, index) => (
                  <tr 
                    key={proxy._id || index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {proxy.ip}:{proxy.port}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatProtocols(proxy.protocols)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${proxy.anonymityLevel === 'elite' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          proxy.anonymityLevel === 'anonymous' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                        {proxy.anonymityLevel || 'Inconnu'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2">{proxy.country || 'N/A'}</span>
                        {proxy.city && <span className="text-sm text-gray-500 dark:text-gray-400">{proxy.city}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {proxy.responseTime ? (
                        <span className={`text-sm ${
                          proxy.responseTime < 1000 ? 'text-green-500 dark:text-green-400' :
                          proxy.responseTime < 3000 ? 'text-yellow-500 dark:text-yellow-400' :
                          'text-red-500 dark:text-red-400'
                        }`}>
                          {proxy.responseTime} ms
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(proxy.lastChecked)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => copyToClipboard(`${proxy.ip}:${proxy.port}`)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                      >
                        Copier
                      </button>
                      {getProxySetupLink(proxy) && (
                        <button
                          onClick={() => copyToClipboard(getProxySetupLink(proxy))}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Config
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement des proxies...</p>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FiGlobe className="mx-auto text-4xl mb-4" />
            <p>Aucun proxy trouvé. Veuillez lancer une recherche.</p>
          </div>
        )}
        
        {/* Pagination */}
        {totalProxies > 0 && (
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Affichage de <span className="font-medium">{proxies.length}</span> proxies sur <span className="font-medium">{totalProxies}</span>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                    fetchProxies();
                  }
                }}
                disabled={currentPage === 1 || loading}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
              >
                Précédent
              </button>
              
              <span className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                {currentPage}
              </span>
              
              <button
                onClick={() => {
                  if (currentPage * limit < totalProxies) {
                    setCurrentPage(currentPage + 1);
                    fetchProxies();
                  }
                }}
                disabled={(currentPage * limit) >= totalProxies || loading}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProxyList; 