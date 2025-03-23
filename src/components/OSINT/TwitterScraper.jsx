import React, { useState, useEffect } from 'react';
import { FiTwitter, FiSearch, FiUser, FiLink, FiExternalLink, FiActivity, FiCalendar, FiHeart, FiRepeat, FiSave, FiDownload, FiSettings, FiInfo, FiMessageCircle, FiKey, FiLock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { apiKeysService } from '../../services/apiKeysService';

const TwitterScraper = () => {
  // État pour stocker les paramètres de recherche
  const [searchMode, setSearchMode] = useState('user'); // 'user' ou 'query'
  const [username, setUsername] = useState('');
  const [query, setQuery] = useState('');
  const [count, setCount] = useState(20);
  const [includeRetweets, setIncludeRetweets] = useState(false);
  const [includeReplies, setIncludeReplies] = useState(false);
  const [resultType, setResultType] = useState('mixed');
  const [language, setLanguage] = useState('fr');
  const [linksOnly, setLinksOnly] = useState(false);
  
  // État pour les clés API Twitter
  const [twitterCredentials, setTwitterCredentials] = useState({
    api_key: '',
    api_key_secret: '',
    access_token: '',
    access_token_secret: '',
    bearer_token: ''
  });
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  
  // État pour stocker les résultats et l'état de chargement
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [commandOutput, setCommandOutput] = useState('');
  
  // Charger les clés API au chargement du composant
  useEffect(() => {
    loadTwitterApiKeys();
  }, []);
  
  // Fonction pour charger les clés API Twitter
  const loadTwitterApiKeys = async () => {
    try {
      const apiKey = await apiKeysService.getKey('twitter_api_key') || '';
      const apiKeySecret = await apiKeysService.getKey('twitter_api_key_secret') || '';
      const accessToken = await apiKeysService.getKey('twitter_access_token') || '';
      const accessTokenSecret = await apiKeysService.getKey('twitter_access_token_secret') || '';
      const bearerToken = await apiKeysService.getKey('twitter_bearer_token') || '';
      
      setTwitterCredentials({
        api_key: apiKey,
        api_key_secret: apiKeySecret,
        access_token: accessToken,
        access_token_secret: accessTokenSecret,
        bearer_token: bearerToken
      });
    } catch (error) {
      console.error('Erreur lors du chargement des clés API Twitter:', error);
    }
  };
  
  // Fonction pour sauvegarder les clés API Twitter
  const saveTwitterApiKeys = async () => {
    try {
      await apiKeysService.saveKey('twitter_api_key', twitterCredentials.api_key);
      await apiKeysService.saveKey('twitter_api_key_secret', twitterCredentials.api_key_secret);
      await apiKeysService.saveKey('twitter_access_token', twitterCredentials.access_token);
      await apiKeysService.saveKey('twitter_access_token_secret', twitterCredentials.access_token_secret);
      await apiKeysService.saveKey('twitter_bearer_token', twitterCredentials.bearer_token);
      
      setApiKeySaved(true);
      setTimeout(() => setApiKeySaved(false), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des clés API Twitter:', error);
      setError('Erreur lors de la sauvegarde des clés API');
    }
  };
  
  // Handler pour mettre à jour les champs des clés API
  const handleCredentialChange = (field, value) => {
    setTwitterCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Fonction pour construire la commande à exécuter
  const buildCommand = () => {
    let cmd = 'python src/scripts/tweescrap.py';
    
    // Ajouter les clés API à la commande
    if (twitterCredentials.bearer_token) {
      cmd += ` --bearer-token "${twitterCredentials.bearer_token}"`;
    } else if (twitterCredentials.api_key && twitterCredentials.api_key_secret) {
      cmd += ` --consumer-key "${twitterCredentials.api_key}" --consumer-secret "${twitterCredentials.api_key_secret}"`;
      
      if (twitterCredentials.access_token && twitterCredentials.access_token_secret) {
        cmd += ` --access-token "${twitterCredentials.access_token}" --access-token-secret "${twitterCredentials.access_token_secret}"`;
      }
    }
    
    if (searchMode === 'user') {
      // Recherche par utilisateur
      cmd += ` user ${username}`;
      cmd += ` -c ${count}`;
      if (includeRetweets) cmd += ' -r';
      if (includeReplies) cmd += ' -p';
    } else {
      // Recherche par requête
      cmd += ` search "${query}"`;
      cmd += ` -c ${count}`;
      cmd += ` -t ${resultType}`;
      cmd += ` -l ${language}`;
    }
    
    if (linksOnly) cmd += ' --links-only';
    
    return cmd;
  };
  
  // Fonction pour exécuter la commande via Electron
  const executeSearch = async () => {
    // Validation de base
    if (searchMode === 'user' && !username) {
      setError('Veuillez entrer un nom d\'utilisateur');
      return;
    }
    if (searchMode === 'query' && !query) {
      setError('Veuillez entrer une requête de recherche');
      return;
    }
    
    // Vérifier que les clés API sont configurées
    if (!twitterCredentials.bearer_token && 
        !(twitterCredentials.api_key && twitterCredentials.api_key_secret)) {
      setError('Veuillez configurer vos clés API Twitter avant de continuer');
      setShowApiKeyForm(true);
      return;
    }
    
    setLoading(true);
    setError(null);
    setResults([]);
    
    try {
      const command = buildCommand();
      setCommandOutput(command);
      
      // Vérifier si l'API Electron est disponible
      if (!window.electronAPI) {
        throw new Error('Cette fonction n\'est disponible que dans l\'application Electron');
      }
      
      // Exécuter la commande via Electron
      const result = await window.electronAPI.executeCommand(command);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Analyser les résultats JSON
      try {
        const parsedResults = JSON.parse(result.stdout);
        setResults(Array.isArray(parsedResults) ? parsedResults : []);
      } catch (parseError) {
        console.error('Erreur lors de l\'analyse des résultats:', parseError);
        setError('Les résultats ne sont pas au format JSON valide');
        setCommandOutput(result.stdout);
      }
    } catch (err) {
      console.error('Erreur lors de l\'exécution de la recherche:', err);
      setError(err.message || 'Une erreur s\'est produite');
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour enregistrer les résultats dans un fichier JSON
  const saveResults = async () => {
    if (!results.length) return;
    
    try {
      if (!window.electronAPI) {
        throw new Error('Cette fonction n\'est disponible que dans l\'application Electron');
      }
      
      const filename = await window.electronAPI.showSaveDialog({
        title: 'Enregistrer les résultats',
        defaultPath: `twitter_${searchMode === 'user' ? username : query.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`,
        filters: [{ name: 'Fichiers JSON', extensions: ['json'] }]
      });
      
      if (!filename) return; // L'utilisateur a annulé
      
      await window.electronAPI.writeFile(filename, JSON.stringify(results, null, 2));
      
      // Afficher un message de confirmation
      window.electronAPI.showNotification({
        title: 'Résultats enregistrés',
        body: `Les résultats ont été enregistrés dans ${filename}`
      });
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement des résultats:', err);
      setError(`Erreur lors de l'enregistrement: ${err.message}`);
    }
  };
  
  // Fonction pour extraire le domaine d'une URL
  const extractDomain = (url) => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return url;
    }
  };
  
  // Fonction pour formater la date
  const formatDate = (isoDate) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    return date.toLocaleString();
  };
  
  // Fonction pour ouvrir un tweet ou un lien dans le navigateur
  const openExternalLink = async (url) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.openExternal(url);
      } else {
        window.open(url, '_blank');
      }
    } catch (err) {
      console.error('Erreur lors de l\'ouverture du lien:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-indigo-600 dark:text-indigo-400">
        <FiTwitter className="inline-block mb-1 mr-2" /> Twitter Scraper
      </h1>
      
      {/* Formulaire de configuration des clés API */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <FiKey className="mr-2" /> Configuration des clés API Twitter
          </h2>
          <button
            onClick={() => setShowApiKeyForm(!showApiKeyForm)}
            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {showApiKeyForm ? 'Masquer' : 'Afficher'}
          </button>
        </div>
        
        {showApiKeyForm && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Vous pouvez soit utiliser le jeton Bearer (recommandé pour l'API v2), soit utiliser les clés API et les jetons d'accès (API v1.1).
            </p>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border-l-4 border-yellow-500 mb-4">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <FiInfo className="inline-block mr-1" /> Vos clés API sont stockées localement et ne sont jamais partagées.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key (Consumer Key)
                </label>
                <input
                  type="password"
                  value={twitterCredentials.api_key}
                  onChange={(e) => handleCredentialChange('api_key', e.target.value)}
                  className="block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                  placeholder="API Key / Consumer Key"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key Secret (Consumer Secret)
                </label>
                <input
                  type="password"
                  value={twitterCredentials.api_key_secret}
                  onChange={(e) => handleCredentialChange('api_key_secret', e.target.value)}
                  className="block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                  placeholder="API Key Secret / Consumer Secret"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Access Token
                </label>
                <input
                  type="password"
                  value={twitterCredentials.access_token}
                  onChange={(e) => handleCredentialChange('access_token', e.target.value)}
                  className="block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                  placeholder="Access Token"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Access Token Secret
                </label>
                <input
                  type="password"
                  value={twitterCredentials.access_token_secret}
                  onChange={(e) => handleCredentialChange('access_token_secret', e.target.value)}
                  className="block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                  placeholder="Access Token Secret"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bearer Token (API v2)
                </label>
                <input
                  type="password"
                  value={twitterCredentials.bearer_token}
                  onChange={(e) => handleCredentialChange('bearer_token', e.target.value)}
                  className="block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                  placeholder="Bearer Token"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={saveTwitterApiKeys}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md flex items-center"
              >
                <FiLock className="mr-2" /> Enregistrer les clés
              </button>
            </div>
            
            {apiKeySaved && (
              <div className="mt-2 flex items-center text-green-600 dark:text-green-400">
                <FiCheckCircle className="mr-1" /> Clés API sauvegardées avec succès
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Panneau de configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <FiSettings className="mr-2" /> Configuration de la recherche
          </h2>
          
          {/* Sélecteur de mode */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSearchMode('user')}
              className={`px-4 py-2 rounded-md ${
                searchMode === 'user' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              <FiUser className="inline-block mr-1" /> Par utilisateur
            </button>
            <button
              onClick={() => setSearchMode('query')}
              className={`px-4 py-2 rounded-md ${
                searchMode === 'query' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              <FiSearch className="inline-block mr-1" /> Par mot-clé
            </button>
          </div>
        </div>
        
        {/* Formulaire de recherche par utilisateur */}
        {searchMode === 'user' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom d'utilisateur Twitter (sans @)
              </label>
              <div className="flex mt-1">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="elonmusk"
                  className="flex-1 min-w-0 block rounded-none rounded-r-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre de tweets à récupérer
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
              />
            </div>
            
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeRetweets"
                  checked={includeRetweets}
                  onChange={(e) => setIncludeRetweets(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="includeRetweets" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Inclure les retweets
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeReplies"
                  checked={includeReplies}
                  onChange={(e) => setIncludeReplies(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="includeReplies" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Inclure les réponses
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="linksOnly"
                  checked={linksOnly}
                  onChange={(e) => setLinksOnly(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="linksOnly" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Extraire uniquement les liens
                </label>
              </div>
            </div>
          </div>
        )}
        
        {/* Formulaire de recherche par mot-clé */}
        {searchMode === 'query' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Requête de recherche
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="cybersécurité OR hacking"
                className="block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre de tweets
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type de résultats
              </label>
              <select
                value={resultType}
                onChange={(e) => setResultType(e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
              >
                <option value="mixed">Mixte</option>
                <option value="recent">Récent</option>
                <option value="popular">Populaire</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Langue
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
              >
                <option value="fr">Français</option>
                <option value="en">Anglais</option>
                <option value="es">Espagnol</option>
                <option value="de">Allemand</option>
                <option value="it">Italien</option>
                <option value="">Toutes les langues</option>
              </select>
            </div>
            
            <div className="md:col-span-3 flex items-center">
              <input
                type="checkbox"
                id="linksOnlyQuery"
                checked={linksOnly}
                onChange={(e) => setLinksOnly(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="linksOnlyQuery" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Extraire uniquement les liens
              </label>
            </div>
          </div>
        )}
        
        {/* Bouton de recherche */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={executeSearch}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Recherche en cours...
              </>
            ) : (
              <>
                <FiSearch className="mr-2" /> Rechercher
              </>
            )}
          </button>
        </div>
        
        {/* Affichage de la commande (développeur uniquement) */}
        {commandOutput && (
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Commande exécutée
            </label>
            <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded-md text-xs font-mono overflow-x-auto">
              {commandOutput}
            </div>
          </div>
        )}
      </div>
      
      {/* Message d'erreur */}
      {error && (
        <div className="mb-6 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      {/* Résultats */}
      {results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {linksOnly 
                ? `${results.length} liens trouvés` 
                : `${results.length} tweets trouvés`}
            </h2>
            
            {/* Bouton pour enregistrer les résultats */}
            <button
              onClick={saveResults}
              className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-md flex items-center text-sm"
            >
              <FiSave className="mr-1" /> Enregistrer
            </button>
          </div>
          
          {/* Affichage des liens uniquement */}
          {linksOnly && (
            <div className="space-y-3">
              {results.map((link, index) => (
                <div key={index} className="border dark:border-gray-700 rounded-md p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-indigo-600 dark:text-indigo-400 font-medium break-all">
                        {link.display_url || extractDomain(link.url)}
                      </p>
                      <a 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          openExternalLink(link.url);
                        }}
                        className="text-gray-600 dark:text-gray-400 text-sm hover:underline break-all"
                      >
                        {link.url} <FiExternalLink className="inline-block ml-1 text-xs" />
                      </a>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => openExternalLink(link.url)}
                        className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                        title="Ouvrir le lien"
                      >
                        <FiExternalLink size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <p className="line-clamp-2">{link.tweet_text}</p>
                  </div>
                  
                  <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-500">
                    <FiUser className="mr-1" />
                    <span className="mr-3">{link.username}</span>
                    
                    <FiCalendar className="mr-1" />
                    <span>{formatDate(link.created_at)}</span>
                    
                    {link.tweet_id && (
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          openExternalLink(`https://twitter.com/${link.username}/status/${link.tweet_id}`);
                        }}
                        className="ml-auto text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Voir le tweet <FiExternalLink className="inline-block ml-1 text-xs" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Affichage des tweets */}
          {!linksOnly && (
            <div className="space-y-6">
              {results.map((tweet) => (
                <div key={tweet.id} className="border dark:border-gray-700 rounded-md p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <span className="font-bold text-gray-900 dark:text-white">@{tweet.username}</span>
                      {tweet.is_retweet && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full">
                          Retweet
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(tweet.created_at)}
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">{tweet.text}</p>
                  </div>
                  
                  {/* URLs dans le tweet */}
                  {tweet.urls && tweet.urls.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {tweet.urls.map((url, urlIndex) => (
                        <div key={urlIndex} className="flex items-center">
                          <FiLink className="mr-2 text-gray-400" />
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              openExternalLink(url.expanded_url || url.url);
                            }}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                          >
                            {url.display_url || extractDomain(url.expanded_url || url.url)}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
                    <div className="flex items-center">
                      <FiMessageCircle className="mr-1" />
                      <span>Réponses</span>
                    </div>
                    <div className="flex items-center">
                      <FiRepeat className="mr-1" />
                      <span>{tweet.retweet_count}</span>
                    </div>
                    <div className="flex items-center">
                      <FiHeart className="mr-1" />
                      <span>{tweet.favorite_count}</span>
                    </div>
                    <div className="ml-auto">
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          openExternalLink(`https://twitter.com/${tweet.username}/status/${tweet.id}`);
                        }}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
                      >
                        Voir sur Twitter <FiExternalLink className="ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Message informatif */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 p-4 rounded-md">
        <h3 className="font-bold mb-2 flex items-center">
          <FiInfo className="mr-2" /> Configuration requise
        </h3>
        <p className="mb-2">
          Pour utiliser cet outil, vous devez configurer vos identifiants d'API Twitter. Trois méthodes sont possibles :
        </p>
        <ol className="list-decimal ml-6 space-y-1">
          <li>Entrer vos clés API dans le formulaire ci-dessus (méthode recommandée)</li>
          <li>Définir les variables d'environnement suivantes : TWITTER_BEARER_TOKEN et/ou TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET</li>
          <li>Créer un fichier de configuration dans ~/.config/hakboard/twitter_config.json ou dans le dossier courant (twitter_config.json)</li>
        </ol>
        <p className="mt-2">
          Vous pouvez obtenir vos identifiants d'API en créant une application sur le <a href="#" onClick={(e) => { e.preventDefault(); openExternalLink('https://developer.twitter.com/'); }} className="underline">portail développeur de Twitter</a>.
        </p>
      </div>
    </div>
  );
};

export default TwitterScraper; 