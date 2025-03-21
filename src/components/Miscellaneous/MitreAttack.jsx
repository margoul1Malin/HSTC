import React, { useState, useEffect } from 'react';
import { FiSearch, FiInfo, FiFilter, FiExternalLink, FiSettings, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { apiKeysService } from '../../services/apiKeysService';

const MitreAttack = () => {
  const [rapidApiKey, setRapidApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [techniques, setTechniques] = useState([]);
  const [filteredTechniques, setFilteredTechniques] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTactic, setFilterTactic] = useState('');
  const [expandedTechniques, setExpandedTechniques] = useState({});
  const [isFetching, setIsFetching] = useState(false);
  
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

  // Fonction pour récupérer les techniques MITRE ATT&CK
  const fetchMitreTechniques = async () => {
    if (!rapidApiKey) {
      setError('Veuillez configurer votre clé API RapidAPI');
      return;
    }

    try {
      setLoading(true);
      setIsFetching(true);
      setError('');
      
      const url = 'https://mitre-att-ck-framework.p.rapidapi.com/attack/list/techniques';
      
      const options = {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'mitre-att-ck-framework.p.rapidapi.com',
          'x-rapidapi-key': rapidApiKey
        }
      };

      console.log('Envoi de la requête à l\'API MITRE ATT&CK');
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des techniques: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('Réponse de l\'API MITRE ATT&CK:', responseData);
      
      // Vérifier la structure de données correcte
      if (responseData && responseData.error === false && responseData.data && responseData.data.techniques) {
        // Transformer les données dans le format attendu par notre UI
        const formattedData = responseData.data.techniques.map(technique => ({
          technique_id: technique.external_id,
          technique_name: technique.name,
          tactic: technique.tactics, // Tableau de tactiques
          description: technique.description || 'Aucune description disponible',
          platforms: technique.platforms || []
        }));
        
        setTechniques(formattedData);
        setFilteredTechniques(formattedData);
        
        // Extraire toutes les tactiques uniques pour le filtre
        const tactics = [...new Set(formattedData.flatMap(technique => 
          technique.tactic && Array.isArray(technique.tactic) 
            ? technique.tactic 
            : []
        ))].sort();
        
        console.log('Tactiques disponibles:', tactics);
      } else {
        throw new Error('Format de données inattendu');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des techniques MITRE ATT&CK:', error);
      setError(error.message || 'Une erreur est survenue lors de la récupération des données');
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  // Fonction pour filtrer les techniques
  useEffect(() => {
    if (techniques.length > 0) {
      let results = [...techniques];
      
      // Filtrer par terme de recherche
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        results = results.filter(technique => 
          (technique.technique_id && technique.technique_id.toLowerCase().includes(term)) ||
          (technique.technique_name && technique.technique_name.toLowerCase().includes(term)) ||
          (technique.description && technique.description.toLowerCase().includes(term))
        );
      }
      
      // Filtrer par tactique
      if (filterTactic) {
        results = results.filter(technique => 
          technique.tactic && 
          Array.isArray(technique.tactic) && 
          technique.tactic.includes(filterTactic)
        );
      }
      
      setFilteredTechniques(results);
    }
  }, [searchTerm, filterTactic, techniques]);

  // Fonction pour basculer l'état d'expansion d'une technique
  const toggleTechnique = (id) => {
    setExpandedTechniques(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Obtenir la liste des tactiques uniques pour le filtre
  const uniqueTactics = React.useMemo(() => {
    if (!techniques.length) return [];
    
    return [...new Set(techniques.flatMap(technique => 
      technique.tactic && Array.isArray(technique.tactic) 
        ? technique.tactic 
        : []
    ))].sort();
  }, [techniques]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-indigo-600 dark:text-indigo-400">
        MITRE ATT&CK Framework
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
        
        {/* Section de recherche et de filtrage */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="search">
                Recherche
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <FiSearch className="text-gray-400" />
                </span>
                <input
                  type="text"
                  id="search"
                  placeholder="Rechercher par ID, nom ou description..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="md:w-1/3">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="tactic">
                Filtrer par tactique
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <FiFilter className="text-gray-400" />
                </span>
                <select
                  id="tactic"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  value={filterTactic}
                  onChange={(e) => setFilterTactic(e.target.value)}
                >
                  <option value="">Toutes les tactiques</option>
                  {uniqueTactics.map(tactic => (
                    <option key={tactic} value={tactic}>{tactic}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <button
                onClick={fetchMitreTechniques}
                disabled={loading || !rapidApiKey}
                className="w-full md:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? 'Chargement...' : 'Charger les techniques'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Messages d'erreur et de succès */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
            <p>{error}</p>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded">
            <p>{successMessage}</p>
          </div>
        )}
        
        {/* Résultats de recherche */}
        {!isFetching && filteredTechniques.length > 0 && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {filteredTechniques.length} techniques trouvées
              </h3>
              <a 
                href="https://attack.mitre.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center"
              >
                <FiExternalLink className="mr-1" /> Site officiel MITRE ATT&CK
              </a>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
              {filteredTechniques.map((technique, index) => (
                <div 
                  key={technique.technique_id || index}
                  className={`border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                    index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
                  }`}
                >
                  <div 
                    onClick={() => toggleTechnique(technique.technique_id || index)}
                    className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center"
                  >
                    <div>
                      <div className="flex items-center">
                        <span className="font-mono text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded mr-3">
                          {technique.technique_id || 'ID inconnu'}
                        </span>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                          {technique.technique_name || 'Nom inconnu'}
                        </h4>
                      </div>
                      
                      {technique.tactic && Array.isArray(technique.tactic) && technique.tactic.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {technique.tactic.map(tactic => (
                            <span 
                              key={tactic} 
                              className="inline-block text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded"
                            >
                              {tactic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {expandedTechniques[technique.technique_id || index] ? (
                      <FiChevronUp className="text-gray-500" />
                    ) : (
                      <FiChevronDown className="text-gray-500" />
                    )}
                  </div>
                  
                  {expandedTechniques[technique.technique_id || index] && (
                    <div className="p-4 pt-0 bg-gray-50 dark:bg-gray-900">
                      <div className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</h5>
                        <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {technique.description || 'Aucune description disponible.'}
                        </p>
                        
                        {technique.platforms && Array.isArray(technique.platforms) && technique.platforms.length > 0 && (
                          <div className="mt-4">
                            <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Plateformes</h5>
                            <div className="flex flex-wrap gap-2">
                              {technique.platforms.map(platform => (
                                <span 
                                  key={platform} 
                                  className="inline-block text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
                                >
                                  {platform}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-4">
                          <a 
                            href={`https://attack.mitre.org/techniques/${technique.technique_id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center"
                          >
                            <FiExternalLink className="mr-1" /> Voir plus de détails sur MITRE ATT&CK
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {isFetching && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        )}
        
        {!isFetching && filteredTechniques.length === 0 && techniques.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FiInfo className="text-gray-400 dark:text-gray-600 text-6xl mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Aucune technique chargée
            </h3>
            <p className="text-gray-500 dark:text-gray-500 max-w-md">
              Cliquez sur "Charger les techniques" pour récupérer la liste des techniques du framework MITRE ATT&CK.
            </p>
          </div>
        )}
        
        {!isFetching && filteredTechniques.length === 0 && techniques.length > 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FiSearch className="text-gray-400 dark:text-gray-600 text-6xl mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Aucun résultat trouvé
            </h3>
            <p className="text-gray-500 dark:text-gray-500 max-w-md">
              Aucune technique ne correspond à vos critères de recherche. Essayez de modifier vos filtres.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MitreAttack; 