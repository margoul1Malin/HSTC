import React, { useState, useEffect } from 'react';
import { FiSearch, FiInfo, FiCheckCircle, FiXCircle, FiGlobe, FiMapPin, FiServer, FiSettings } from 'react-icons/fi';
import { apiKeysService } from '../../services/apiKeysService';

const IPGeolocation = () => {
  const [ip, setIp] = useState('');
  const [service, setService] = useState('ipapi'); // Par défaut, on utilise ipapi qui ne nécessite pas de clé API
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [criminalIpKey, setCriminalIpKey] = useState('');
  const [ipregistryKey, setIpregistryKey] = useState('');
  const [rapidApiKey, setRapidApiKey] = useState('');
  const [savingKeys, setSavingKeys] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Charger les clés API au démarrage
  useEffect(() => {
    const loadApiKeys = async () => {
      try {
        const criminalKey = await apiKeysService.getKey('criminalip');
        const registryKey = await apiKeysService.getKey('ipregistry');
        const rapidKey = await apiKeysService.getKey('rapidapiOsint');
        
        setCriminalIpKey(criminalKey || '');
        setIpregistryKey(registryKey || '');
        setRapidApiKey(rapidKey || '');
      } catch (error) {
        console.error('Erreur lors du chargement des clés API:', error);
        setError('Impossible de charger les clés API. Veuillez les configurer manuellement.');
      }
    };
    
    loadApiKeys();
  }, []);

  // Fonction pour sauvegarder les clés API
  const saveApiKeys = async () => {
    try {
      setSavingKeys(true);
      setError('');
      setSuccessMessage('');
      
      // Sauvegarder la clé Criminal IP
      if (criminalIpKey) {
        await apiKeysService.saveKey('criminalip', criminalIpKey);
      }
      
      // Sauvegarder la clé IPregistry
      if (ipregistryKey) {
        await apiKeysService.saveKey('ipregistry', ipregistryKey);
      }
      
      // Sauvegarder la clé RapidAPI
      if (rapidApiKey) {
        await apiKeysService.saveKey('rapidapiOsint', rapidApiKey);
      }
      
      setSuccessMessage('Clés API sauvegardées avec succès !');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des clés API:', error);
      setError('Erreur lors de la sauvegarde des clés API. Veuillez réessayer.');
    } finally {
      setSavingKeys(false);
    }
  };

  // Fonction pour valider l'adresse IP
  const isValidIP = (ip) => {
    const ipPattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = ip.match(ipPattern);
    
    if (!ipMatch) return false;
    
    for (let i = 1; i <= 4; i++) {
      const octet = parseInt(ipMatch[i]);
      if (octet < 0 || octet > 255) return false;
    }
    
    return true;
  };

  // Fonction pour rechercher les infos de l'IP avec ipapi (sans clé API)
  const searchWithIpapi = async (ip) => {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!response.ok) {
      throw new Error(`Erreur lors de la recherche avec ipapi: ${response.statusText}`);
    }
    return await response.json();
  };

  // Fonction pour rechercher les infos de l'IP avec CriminalIP
  const searchWithCriminalIP = async (ip) => {
    if (!criminalIpKey) {
      throw new Error('Clé API CriminalIP non configurée. Veuillez la configurer dans les paramètres.');
    }
    
    const response = await fetch(`https://api.criminalip.io/v1/asset/ip/report?ip=${ip}&full=true`, {
      method: 'GET',
      headers: {
        'x-api-key': criminalIpKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la recherche avec CriminalIP: ${response.statusText}`);
    }
    
    return await response.json();
  };

  // Fonction pour rechercher les infos de l'IP avec IPregistry
  const searchWithIPregistry = async (ip) => {
    if (!ipregistryKey) {
      throw new Error('Clé API IPregistry non configurée. Veuillez la configurer dans les paramètres.');
    }
    
    const response = await fetch(`https://api.ipregistry.co/${ip}?key=${ipregistryKey}`);
    if (!response.ok) {
      throw new Error(`Erreur lors de la recherche avec IPregistry: ${response.statusText}`);
    }
    
    return await response.json();
  };

  // Fonction pour rechercher les infos de l'IP avec FanXiangChaXun via RapidAPI
  const searchWithFanXiangChaXun = async (ip) => {
    if (!rapidApiKey) {
      throw new Error('Clé API RapidAPI non configurée. Veuillez la configurer dans les paramètres.');
    }
    
    const response = await fetch(`https://ip-ip-fan-xiang-cha-xun.p.rapidapi.com/${ip}/json`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'ip-ip-Fan-Xiang-Cha-Xun.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la recherche avec FanXiangChaXun: ${response.statusText}`);
    }
    
    return await response.json();
  };

  // Fonction principale pour effectuer la recherche
  const searchIP = async () => {
    if (!ip || !isValidIP(ip)) {
      setError('Veuillez saisir une adresse IP valide (IPv4)');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResults(null);

      let data;
      
      switch (service) {
        case 'ipapi':
          data = await searchWithIpapi(ip);
          break;
        case 'criminalip':
          data = await searchWithCriminalIP(ip);
          break;
        case 'ipregistry':
          data = await searchWithIPregistry(ip);
          break;
        case 'fanxiangchaxun':
          data = await searchWithFanXiangChaXun(ip);
          break;
        default:
          throw new Error('Service non reconnu');
      }
      
      setResults({
        data,
        service
      });
    } catch (error) {
      console.error('Erreur lors de la recherche IP:', error);
      setError(error.message || 'Une erreur est survenue lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour formater les résultats selon le service
  const formatResults = () => {
    if (!results || !results.data) return null;

    const { data, service } = results;

    switch (service) {
      case 'ipapi':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiGlobe className="mr-2 text-blue-500" /> Informations sur {data.ip}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <FiMapPin className="mt-1 mr-2 text-red-500" />
                <div>
                  <h4 className="font-medium">Localisation</h4>
                  <p>{data.city}, {data.region}, {data.country_name}</p>
                  <p>Code postal: {data.postal || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiServer className="mt-1 mr-2 text-green-500" />
                <div>
                  <h4 className="font-medium">Informations réseau</h4>
                  <p>ASN: {data.asn || 'N/A'}</p>
                  <p>Organisation: {data.org || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <p><strong>Coordonnées:</strong> {data.latitude}, {data.longitude}</p>
              <p><strong>Fuseau horaire:</strong> {data.timezone || 'N/A'}</p>
              <p><strong>Monnaie:</strong> {data.currency || 'N/A'}</p>
              <p><strong>Langue:</strong> {data.languages || 'N/A'}</p>
            </div>
          </div>
        );
        
      case 'criminalip':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiGlobe className="mr-2 text-blue-500" /> Informations CriminalIP sur {ip}
            </h3>
            
            {data.status === 200 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <FiMapPin className="mt-1 mr-2 text-red-500" />
                    <div>
                      <h4 className="font-medium">Localisation</h4>
                      {data.whois && data.whois.count > 0 && (
                        <>
                          <p>Pays: {data.whois.data[0].org_country_code || 'N/A'}</p>
                          <p>Ville: {data.whois.data[0].city || 'N/A'}</p>
                          <p>Région: {data.whois.data[0].region || 'N/A'}</p>
                          <p>Code postal: {data.whois.data[0].postal_code || 'N/A'}</p>
                          <p>Coordonnées: {data.whois.data[0].latitude}, {data.whois.data[0].longitude}</p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FiServer className="mt-1 mr-2 text-green-500" />
                    <div>
                      <h4 className="font-medium">Informations réseau</h4>
                      {data.whois && data.whois.count > 0 && (
                        <>
                          <p>ASN: {data.whois.data[0].as_no || 'N/A'}</p>
                          <p>Nom AS: {data.whois.data[0].as_name || 'N/A'}</p>
                          <p>Organisation: {data.whois.data[0].org_name || 'N/A'}</p>
                        </>
                      )}
                      {data.hostname && data.hostname.count > 0 && (
                        <p>Hostname: {data.hostname.data[0].domain_name_full || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {data.issues && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Indicateurs de sécurité</h4>
                    <div className="space-y-2">
                      {Object.entries(data.issues).map(([key, value]) => (
                        <div key={key} className="flex items-center">
                          {value ? (
                            <FiXCircle className="text-red-500 mr-2" />
                          ) : (
                            <FiCheckCircle className="text-green-500 mr-2" />
                          )}
                          <span>{key.replace(/_/g, ' ')} : {value ? 'Détecté' : 'Non détecté'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {data.score && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Score de sécurité</h4>
                    <p>Entrant (Inbound): {data.score.inbound}</p>
                    <p>Sortant (Outbound): {data.score.outbound}</p>
                  </div>
                )}
              </>
            ) : (
              <p>Aucune information détaillée disponible pour cette IP.</p>
            )}
          </div>
        );
        
      case 'ipregistry':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiGlobe className="mr-2 text-blue-500" /> Informations IPregistry sur {data.ip}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <FiMapPin className="mt-1 mr-2 text-red-500" />
                <div>
                  <h4 className="font-medium">Localisation</h4>
                  <p>Ville: {data.location?.city?.name || 'N/A'}</p>
                  <p>Région: {data.location?.region?.name || 'N/A'}</p>
                  <p>Pays: {data.location?.country?.name || 'N/A'} {data.location?.country?.flag?.emoji || ''}</p>
                  <p>Code postal: {data.location?.postal || 'N/A'}</p>
                  <p>Continent: {data.location?.continent?.name || 'N/A'}</p>
                  <p>Coordonnées: {data.location?.latitude}, {data.location?.longitude}</p>
                  {data.location?.in_eu && (
                    <p className="mt-1"><span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Dans l'Union Européenne</span></p>
                  )}
                </div>
              </div>
              
              <div className="flex items-start">
                <FiServer className="mt-1 mr-2 text-green-500" />
                <div>
                  <h4 className="font-medium">Informations réseau</h4>
                  <p>Nom: {data.connection?.domain || 'N/A'}</p>
                  <p>Organisation: {data.connection?.organization || 'N/A'}</p>
                  <p>Type: {data.connection?.type || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            {data.security && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Indicateurs de sécurité</h4>
                <div className="space-y-2">
                  {data.security.is_proxy && (
                    <div className="flex items-center">
                      <FiXCircle className="text-red-500 mr-2" />
                      <span>Proxy: Détecté</span>
                    </div>
                  )}
                  {data.security.is_vpn && (
                    <div className="flex items-center">
                      <FiXCircle className="text-red-500 mr-2" />
                      <span>VPN: Détecté</span>
                    </div>
                  )}
                  {data.security.is_tor && (
                    <div className="flex items-center">
                      <FiXCircle className="text-red-500 mr-2" />
                      <span>Tor: Détecté</span>
                    </div>
                  )}
                  {data.security.is_bot && (
                    <div className="flex items-center">
                      <FiXCircle className="text-red-500 mr-2" />
                      <span>Bot: Détecté</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {data.location?.country?.capital && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Informations sur le pays</h4>
                <p>Capitale: {data.location.country.capital}</p>
                <p>Population: {data.location.country.population?.toLocaleString()}</p>
                <p>Superficie: {data.location.country.area?.toLocaleString()} km²</p>
                <p>Densité: {data.location.country.population_density?.toFixed(2)} hab/km²</p>
                <p>Code d'appel: +{data.location.country.calling_code}</p>
                <p>TLD: {data.location.country.tld}</p>
              </div>
            )}
            
            {data.location?.language && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Langue principale</h4>
                <p>{data.location.language.name} ({data.location.language.native})</p>
              </div>
            )}
            
            {data.location?.country?.languages && data.location.country.languages.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Langues du pays</h4>
                <div className="flex flex-wrap gap-2">
                  {data.location.country.languages.map((lang, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm">
                      {lang.name} ({lang.native})
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {data.time_zone && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Fuseau horaire</h4>
                <p>{data.time_zone.name} (UTC{data.time_zone.offset_string})</p>
                {data.time_zone.current_time && (
                  <p>Heure locale: {new Date(data.time_zone.current_time).toLocaleString()}</p>
                )}
              </div>
            )}
            
            {data.carrier && data.carrier.name && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Opérateur mobile</h4>
                <p>{data.carrier.name}</p>
                {data.carrier.mcc && data.carrier.mnc && (
                  <p>MCC/MNC: {data.carrier.mcc}/{data.carrier.mnc}</p>
                )}
              </div>
            )}
          </div>
        );
      
      case 'fanxiangchaxun':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiGlobe className="mr-2 text-blue-500" /> Informations FanXiangChaXun sur {data.ip}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <FiMapPin className="mt-1 mr-2 text-red-500" />
                <div>
                  <h4 className="font-medium">Localisation</h4>
                  <p>Ville: {data.city || 'N/A'}</p>
                  <p>Région: {data.region || 'N/A'} {data.region_code ? `(${data.region_code})` : ''}</p>
                  <p>Pays: {data.country_name || 'N/A'} ({data.country || 'N/A'})</p>
                  <p>Code postal: {data.postal || 'N/A'}</p>
                  <p>Continent: {data.continent_code || 'N/A'}</p>
                  <p>Coordonnées: {data.latitude}, {data.longitude}</p>
                  {data.in_eu && (
                    <p className="mt-1"><span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Dans l'Union Européenne</span></p>
                  )}
                </div>
              </div>
              
              <div className="flex items-start">
                <FiServer className="mt-1 mr-2 text-green-500" />
                <div>
                  <h4 className="font-medium">Informations réseau</h4>
                  <p>Réseau: {data.network || 'N/A'}</p>
                  <p>Version: {data.version || 'N/A'}</p>
                  <p>ASN: {data.asn || 'N/A'}</p>
                  <p>Organisation: {data.org || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Informations sur le pays</h4>
                <p>Capitale: {data.country_capital || 'N/A'}</p>
                <p>TLD: {data.country_tld || 'N/A'}</p>
                <p>Code d'appel: {data.country_calling_code || 'N/A'}</p>
                <p>Population: {data.country_population?.toLocaleString() || 'N/A'}</p>
                <p>Superficie: {data.country_area?.toLocaleString() || 'N/A'} km²</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Fuseaux horaires et langues</h4>
                <p>Fuseau horaire: {data.timezone || 'N/A'}</p>
                <p>Décalage UTC: {data.utc_offset || 'N/A'}</p>
                <p>Langues: {data.languages || 'N/A'}</p>
                <p>Monnaie: {data.currency_name || 'N/A'} ({data.currency || 'N/A'})</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return <p>Format de résultats non pris en charge pour ce service.</p>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-indigo-600 dark:text-indigo-400">
        Géolocalisation IP
      </h1>
      
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-8">
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="ip">
            Adresse IP à rechercher
          </label>
          <div className="flex">
            <input
              type="text"
              id="ip"
              placeholder="Exemple: 8.8.8.8"
              className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
            />
            <button
              onClick={searchIP}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-r-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Recherche...' : 'Rechercher'}
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
            Service à utiliser
          </label>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center bg-white dark:bg-gray-700 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600">
              <input
                type="radio"
                name="service"
                value="ipapi"
                checked={service === 'ipapi'}
                onChange={() => setService('ipapi')}
                className="form-radio h-4 w-4 text-indigo-600"
              />
              <span className="ml-2">ipapi (sans clé API)</span>
            </label>
            
            <label className="inline-flex items-center bg-white dark:bg-gray-700 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600">
              <input
                type="radio"
                name="service"
                value="criminalip"
                checked={service === 'criminalip'}
                onChange={() => setService('criminalip')}
                className="form-radio h-4 w-4 text-indigo-600"
              />
              <span className="ml-2">CriminalIP</span>
            </label>
            
            <label className="inline-flex items-center bg-white dark:bg-gray-700 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600">
              <input
                type="radio"
                name="service"
                value="ipregistry"
                checked={service === 'ipregistry'}
                onChange={() => setService('ipregistry')}
                className="form-radio h-4 w-4 text-indigo-600"
              />
              <span className="ml-2">IPregistry</span>
            </label>
            
            <label className="inline-flex items-center bg-white dark:bg-gray-700 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600">
              <input
                type="radio"
                name="service"
                value="fanxiangchaxun"
                checked={service === 'fanxiangchaxun'}
                onChange={() => setService('fanxiangchaxun')}
                className="form-radio h-4 w-4 text-indigo-600"
              />
              <span className="ml-2">Fan Xiang Cha Xun</span>
            </label>
          </div>
        </div>
        
        {/* Configuration des clés API directement dans l'interface */}
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FiSettings className="mr-2" /> Configuration des clés API
          </h3>
          
          <div className="space-y-4">
            {/* Champ pour la clé CriminalIP */}
            <div className={service === 'criminalip' ? "bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-md" : ""}>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="criminalIpKey">
                Clé API CriminalIP {service === 'criminalip' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                id="criminalIpKey"
                placeholder="Entrez votre clé API CriminalIP"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                value={criminalIpKey}
                onChange={(e) => setCriminalIpKey(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                <a 
                  href="https://www.criminalip.io/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Créer un compte CriminalIP
                </a> pour obtenir une clé API
              </p>
            </div>
            
            {/* Champ pour la clé IPregistry */}
            <div className={service === 'ipregistry' ? "bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-md" : ""}>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="ipregistryKey">
                Clé API IPregistry {service === 'ipregistry' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                id="ipregistryKey"
                placeholder="Entrez votre clé API IPregistry"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                value={ipregistryKey}
                onChange={(e) => setIpregistryKey(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                <a 
                  href="https://ipregistry.co/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Créer un compte IPregistry
                </a> pour obtenir une clé API
              </p>
            </div>
            
            {/* Champ pour la clé RapidAPI */}
            <div className={service === 'fanxiangchaxun' ? "bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-md" : ""}>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="rapidApiKey">
                Clé API RapidAPI {service === 'fanxiangchaxun' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                id="rapidApiKey"
                placeholder="Entrez votre clé API RapidAPI"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                value={rapidApiKey}
                onChange={(e) => setRapidApiKey(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                <a 
                  href="https://rapidapi.com/hub" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Créer un compte RapidAPI
                </a> pour obtenir une clé API utilisable avec Fan Xiang Cha Xun
              </p>
            </div>
            
            <div className="flex justify-end mt-2">
              <button
                onClick={saveApiKeys}
                disabled={savingKeys}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {savingKeys ? 'Sauvegarde en cours...' : 'Sauvegarder les clés'}
              </button>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 mt-4 rounded">
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
        
        {service !== 'ipapi' && (
          ((service === 'criminalip' && !criminalIpKey) || 
           (service === 'ipregistry' && !ipregistryKey) ||
           (service === 'fanxiangchaxun' && !rapidApiKey))
        ) && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-6 mt-4 rounded">
            <p className="flex items-center">
              <FiInfo className="mr-2" />
              La clé API pour {
                service === 'criminalip' ? 'CriminalIP' : 
                service === 'ipregistry' ? 'IPregistry' : 'Fan Xiang Cha Xun (RapidAPI)'
              } n'est pas configurée. Certaines fonctionnalités peuvent ne pas être disponibles.
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

export default IPGeolocation;
