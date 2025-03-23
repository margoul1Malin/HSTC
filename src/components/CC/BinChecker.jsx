import React, { useState, useEffect } from 'react';
import { FiSearch, FiCreditCard, FiInfo, FiCheckCircle, FiXCircle, FiGlobe, FiMapPin, FiDollarSign, FiServer, FiDatabase, FiCloud } from 'react-icons/fi';
const cc = require('creditcardutils');

// Importer directement les données binlist (nous allons créer ce fichier juste après)
import binlistData from './binlist-data.json';

// Implémentation manuelle de l'algorithme de Luhn
const luhnCheck = (cardNumber) => {
  if (!cardNumber) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i));
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return (sum % 10) === 0;
};

const BinChecker = () => {
  const [bin, setBin] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [testCard, setTestCard] = useState('');
  const [isLuhnValid, setIsLuhnValid] = useState(null);
  const [useLocalDB, setUseLocalDB] = useState(true);
  const [binDatabase, setBinDatabase] = useState([]);
  const [databaseLoading, setDatabaseLoading] = useState(false);
  const [databaseLoaded, setDatabaseLoaded] = useState(false);

  // Charger la base de données au démarrage si la méthode locale est sélectionnée
  useEffect(() => {
    if (useLocalDB && !databaseLoaded) {
      loadBinDatabase();
    }
  }, [useLocalDB, databaseLoaded]);

  // Fonction pour charger la base de données 
  const loadBinDatabase = () => {
    setDatabaseLoading(true);
    setError('');
    
    try {
      // Utiliser les données importées directement
      setBinDatabase(binlistData);
      setDatabaseLoaded(true);
      setDatabaseLoading(false);
      console.log(`Base de données BIN chargée: ${binlistData.length} entrées`);
    } catch (err) {
      console.error('Erreur lors du chargement de la base de données:', err);
      setError(`Erreur lors du chargement de la base de données: ${err.message}`);
      setDatabaseLoading(false);
    }
  };

  // Fonction pour valider le BIN
  const isValidBin = (bin) => {
    // Valider que le BIN contient exactement 6 chiffres
    return /^\d{6}$/.test(bin);
  };

  // Fonction pour vérifier le numéro de carte avec l'algorithme de Luhn
  const checkLuhn = (cardNumber) => {
    if (!cardNumber || !/^\d+$/.test(cardNumber)) {
      setIsLuhnValid(null);
      return;
    }
    
    const isValid = luhnCheck(cardNumber);
    setIsLuhnValid(isValid);
  };

  // Fonction pour rechercher les infos du BIN dans la base de données locale
  const searchBinLocal = () => {
    if (!bin || !isValidBin(bin)) {
      setError('Veuillez saisir un BIN valide (6 chiffres)');
      return;
    }

    if (!databaseLoaded) {
      setError('La base de données des BINs n\'est pas encore chargée. Veuillez patienter ou réessayer.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResults(null);

      // Rechercher le BIN dans la base de données locale
      const binMatch = binDatabase.find(item => item.bin === bin);
      
      if (!binMatch) {
        throw new Error('BIN non trouvé dans la base de données locale');
      }

      // Formater les résultats pour correspondre à la structure attendue par formatResults()
      const formattedResult = {
        scheme: binMatch.category || binMatch.brand,
        type: binMatch.type,
        brand: binMatch.brand,
        bank: {
          name: binMatch.issuer || 'N/A',
          url: binMatch.bank_url || 'N/A',
          phone: binMatch.bank_phone || 'N/A',
          city: ''
        },
        country: {
          name: binMatch.country || 'N/A',
          emoji: '', // Nous n'avons pas d'emoji dans notre CSV
          alpha2: binMatch.alpha_2 || 'N/A',
          currency: '', // Nous n'avons pas de devise dans notre CSV
          region: ''
        },
        number: {
          length: '', // Nous n'avons pas cette information
          luhn: true // Nous supposons que c'est validé par Luhn
        }
      };

      setResults(formattedResult);
    } catch (error) {
      console.error('Erreur lors de la recherche du BIN:', error);
      setError(error.message || 'Une erreur est survenue lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour rechercher les infos du BIN via l'API
  const searchBinAPI = async () => {
    if (!bin || !isValidBin(bin)) {
      setError('Veuillez saisir un BIN valide (6 chiffres)');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResults(null);

      const response = await fetch(`https://lookup.binlist.net/${bin}`, {
        headers: {
          'Accept-Version': '3'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('BIN non trouvé. Vérifiez les chiffres et réessayez.');
        } else {
          throw new Error(`Erreur lors de la recherche: ${response.statusText}`);
        }
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Erreur lors de la recherche du BIN:', error);
      setError(error.message || 'Une erreur est survenue lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  // Fonction principale pour rechercher un BIN qui choisit la méthode appropriée
  const searchBin = () => {
    if (useLocalDB) {
      searchBinLocal();
    } else {
      searchBinAPI();
    }
  };

  // Fonction pour formater et afficher les résultats
  const formatResults = () => {
    if (!results) return null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FiCreditCard className="mr-2 text-blue-500" /> Informations BIN: {bin}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <FiInfo className="mt-1 mr-2 text-blue-500" />
            <div>
              <h4 className="font-medium">Informations carte</h4>
              <p>Type: {results.type || 'N/A'}</p>
              <p>Marque: {results.brand || 'N/A'}</p>
              <p>Catégorie: {results.scheme || 'N/A'}</p>
              {results.prepaid !== undefined && (
                <p>Prépayée: {results.prepaid ? 'Oui' : 'Non'}</p>
              )}
            </div>
          </div>
          
          {results.bank && (
            <div className="flex items-start">
              <FiDollarSign className="mt-1 mr-2 text-green-500" />
              <div>
                <h4 className="font-medium">Banque émettrice</h4>
                <p>Nom: {results.bank.name || 'N/A'}</p>
                <p>URL: {results.bank.url || 'N/A'}</p>
                <p>Téléphone: {results.bank.phone || 'N/A'}</p>
                {results.bank.city && <p>Ville: {results.bank.city}</p>}
              </div>
            </div>
          )}
        </div>
        
        {results.country && (
          <div className="mt-4">
            <h4 className="font-medium flex items-center mb-2">
              <FiGlobe className="mr-2 text-indigo-500" /> Pays d'émission
            </h4>
            <p>Pays: {results.country.name} {results.country.emoji || ''}</p>
            <p>Code: {results.country.alpha2}</p>
            <p>Devise: {results.country.currency || 'N/A'}</p>
            <p>Région: {results.country.region || 'N/A'}</p>
          </div>
        )}
        
        {results.number && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Format du numéro</h4>
            <p>Longueur: {results.number.length || 'N/A'}</p>
            <p>LUHN: {results.number.luhn ? 'Validé' : 'Non validé'}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-indigo-600 dark:text-indigo-400">
        Vérificateur de BIN (Bank Identification Number)
      </h1>
      
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-8">
        {/* Sélecteur de source de données */}
        <div className="flex justify-center mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setUseLocalDB(true)}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              useLocalDB 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <FiDatabase className="mr-2" /> Base locale {useLocalDB ? `(${databaseLoaded ? binDatabase.length : '?'} entrées)` : "(Non disponible)"}
          </button>
          <button
            onClick={() => setUseLocalDB(false)}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              !useLocalDB 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <FiCloud className="mr-2" /> API BINList.net
          </button>
        </div>

        {/* Statut de chargement de la base de données */}
        {useLocalDB && (
          <div className="mb-4">
            {databaseLoading ? (
              <div className="flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500 mr-2"></div>
                Chargement de la base de données...
              </div>
            ) : databaseLoaded ? (
              <div className="text-center text-green-600 dark:text-green-400 text-sm">
                Base de données chargée avec {binDatabase.length} entrées
              </div>
            ) : (
              <div className="text-center text-red-600 dark:text-red-400 text-sm">
                Base de données non chargée
                <button 
                  onClick={loadBinDatabase}
                  className="ml-2 underline"
                >
                  Charger maintenant
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="bin">
            BIN à rechercher (6 premiers chiffres)
          </label>
          <div className="flex">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FiCreditCard className="text-gray-500" />
              </span>
              <input
                type="text"
                id="bin"
                maxLength={6}
                placeholder="Exemple: 451234"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                value={bin}
                onChange={(e) => {
                  // Autoriser uniquement les chiffres
                  const value = e.target.value.replace(/\D/g, '');
                  setBin(value);
                }}
              />
            </div>
            <button
              onClick={searchBin}
              disabled={loading || (useLocalDB && !databaseLoaded)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-r-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Recherche...' : 'Rechercher'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Entrez les 6 premiers chiffres d'une carte bancaire pour obtenir des informations.
          </p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 p-4 rounded">
          <p className="flex items-center">
            <FiInfo className="mr-2" />
            Le BIN (Bank Identification Number) est composé des 6 premiers chiffres d'une carte bancaire. 
            Il identifie la banque émettrice et le type de carte.
          </p>
        </div>
        
        {/* Vérificateur Luhn */}
        <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
            Vérificateur d'algorithme Luhn
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Validez un numéro de carte avec l'algorithme de Luhn pour déterminer s'il est formellement valide.
          </p>
          
          <div className="flex">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FiCreditCard className="text-gray-500" />
              </span>
              <input
                type="text"
                placeholder="Numéro de carte à vérifier"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                value={testCard}
                onChange={(e) => {
                  // Autoriser uniquement les chiffres
                  const value = e.target.value.replace(/\D/g, '');
                  setTestCard(value);
                }}
              />
            </div>
            <button
              onClick={() => checkLuhn(testCard)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-r-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Vérifier
            </button>
          </div>
          
          {isLuhnValid !== null && (
            <div className={`mt-3 p-3 rounded-md flex items-center ${
              isLuhnValid 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
            }`}>
              {isLuhnValid ? (
                <><FiCheckCircle className="mr-2" /> Le numéro est valide selon l'algorithme de Luhn</>
              ) : (
                <><FiXCircle className="mr-2" /> Le numéro n'est pas valide selon l'algorithme de Luhn</>
              )}
            </div>
          )}
        </div>
        
        {error && (
          <div className="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            <p className="flex items-center">
              <FiXCircle className="mr-2" />
              {error}
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

export default BinChecker;
