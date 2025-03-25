import React, { useState, useEffect, useRef } from 'react';
import { FiPlay, FiInfo, FiFile, FiFolder, FiAlertCircle, FiClock, FiCheckCircle, FiDownload, FiSave, FiSquare, FiUpload, FiX } from 'react-icons/fi';

const GoBuster = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [url, setUrl] = useState('');
  const [wordlist, setWordlist] = useState('');
  const [extensions, setExtensions] = useState('');
  const [threads, setThreads] = useState(10);
  const [wordlistFile, setWordlistFile] = useState(null);
  const [output, setOutput] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [scanMode, setScanMode] = useState('dir'); // 'dir', 'vhost', 'dns', 'fuzz', 's3', 'tftp', 'gcs'
  const [isVerbose, setIsVerbose] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [processId, setProcessId] = useState(null);
  const [platform, setPlatform] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGoBusterInstalled, setIsGoBusterInstalled] = useState(false);
  
  // États pour le générateur de wordlist
  const [showWordlistGenerator, setShowWordlistGenerator] = useState(false);
  const [minLength, setMinLength] = useState('8');
  const [maxLength, setMaxLength] = useState('10');
  const [charset, setCharset] = useState('abcdefghijklmnopqrstuvwxyz0123456789');
  const [pattern, setPattern] = useState('');
  const [usePattern, setUsePattern] = useState(false);
  const [outputFilename, setOutputFilename] = useState('wordlist.txt');
  
  // Référence pour suivre les changements du wordlist
  const selectedFileRef = useRef(null);
  
  // États pour la vérification de l'installation de GoBuster
  const [checkingInstallation, setCheckingInstallation] = useState(false);
  const [goBusterInstalled, setGoBusterInstalled] = useState(false);
  const [goBusterVersion, setGoBusterVersion] = useState('');
  
  // Effect pour s'assurer que wordlist et wordlistFile sont synchronisés
  useEffect(() => {
    // Créer une fonction qui synchronise les états
    const syncWordlistStates = () => {
      if (selectedFileRef.current) {
        const filePath = selectedFileRef.current;
        setWordlist(filePath);
        setWordlistFile(filePath);
        
        console.log("États wordlist et wordlistFile synchronisés avec:", filePath);
        selectedFileRef.current = null;
      }
    };
    
    // Appeler la fonction immédiatement
    syncWordlistStates();
    
    // Pas besoin de retourner une fonction de nettoyage
  }, []); // Dépendance vide car nous utilisons la référence directement

  // Vérifier la plateforme et si GoBuster est installé au chargement
  useEffect(() => {
    const checkPlatformAndGoBuster = async () => {
      try {
        setIsLoading(true);
        
        // Vérifier la plateforme
        if (window.electronAPI && window.electronAPI.getPlatform) {
          const platformResult = await window.electronAPI.getPlatform();
          setPlatform(platformResult);
          
          // Si c'est Linux, vérifier si GoBuster est installé
          if (platformResult === 'linux') {
            try {
              const result = await window.electronAPI.executeCommand('which gobuster');
              setIsGoBusterInstalled(!!result.stdout);
              
              if (result.stdout) {
                addToOutput({ type: 'success', message: `GoBuster détecté à: ${result.stdout.trim()}` });
              } else {
                addToOutput({ type: 'error', message: 'GoBuster n\'est pas installé.' });
              }
            } catch (error) {
              console.error('Erreur lors de la vérification de GoBuster:', error);
              setIsGoBusterInstalled(false);
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de la plateforme et de GoBuster:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPlatformAndGoBuster();
  }, []);

  // Vérifier si GoBuster est installé au chargement de la page
  useEffect(() => {
    const checkGoBusterInstallation = async () => {
      if (window.electronAPI) {
        try {
          setCheckingInstallation(true);
          const response = await window.electronAPI.execCommand('which gobuster');
          setGoBusterInstalled(response.trim() !== '');
          if (response.trim() === '') {
            addLog('GoBuster n\'est pas installé.', 'error');
          } else {
            addLog(`GoBuster détecté à: ${response.trim()}`, 'success');
            
            // Récupérer la version de GoBuster
            try {
              const versionResponse = await window.electronAPI.execCommand('gobuster version');
              const versionMatch = versionResponse.match(/Version:\s*([\d.]+)/);
              if (versionMatch && versionMatch[1]) {
                setGoBusterVersion(versionMatch[1]);
                addLog(`Version de GoBuster: ${versionMatch[1]}`, 'info');
              }
            } catch (error) {
              console.error('Erreur lors de la vérification de la version:', error);
            }
          }
        } catch (error) {
          setGoBusterInstalled(false);
          addLog('Erreur lors de la vérification de GoBuster.', 'error');
          console.error('Erreur lors de la vérification de GoBuster:', error);
        } finally {
          setCheckingInstallation(false);
        }
      } else {
        addLog('L\'API Electron n\'est pas disponible. Impossible de vérifier GoBuster.', 'warning');
        setCheckingInstallation(false);
      }
    };
    
    // Charger les paramètres sauvegardés
    const loadSavedSettings = () => {
      try {
        // Charger les paramètres de GoBuster
        const savedSettings = JSON.parse(localStorage.getItem('gobuster_settings') || '{}');
        if (Object.keys(savedSettings).length > 0) {
          if (savedSettings.wordlist) setWordlist(savedSettings.wordlist);
          if (savedSettings.threads) setThreads(savedSettings.threads);
          if (savedSettings.extensions) setExtensions(savedSettings.extensions);
          if (savedSettings.statusCodes) setStatusCodes(savedSettings.statusCodes);
          if (savedSettings.timeout) setTimeout(savedSettings.timeout);
          if (savedSettings.userAgent) setUserAgent(savedSettings.userAgent);
          if (savedSettings.proxy) setProxy(savedSettings.proxy);
          if (savedSettings.cookies) setCookies(savedSettings.cookies);
          if (savedSettings.followRedirect !== undefined) setFollowRedirect(savedSettings.followRedirect);
          if (savedSettings.basicAuth) setBasicAuth(savedSettings.basicAuth);
          addLog('Paramètres de GoBuster chargés.', 'info');
        }
        
        // Charger l'historique des scans
        const savedHistory = JSON.parse(localStorage.getItem('gobuster_scan_history') || '[]');
        if (savedHistory.length > 0) {
          setScanHistory(savedHistory);
          addLog(`${savedHistory.length} scan(s) trouvé(s) dans l'historique.`, 'info');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
        addLog('Erreur lors du chargement des paramètres.', 'error');
      }
    };
    
    // Vérifier si une URL a été passée depuis la vue Targets
    const urlData = localStorage.getItem('goBusterUrl');
    if (urlData) {
      setTarget(urlData);
      addLog(`URL cible définie depuis Targets: ${urlData}`, 'info');
      // Supprimer les données pour éviter de les réutiliser à chaque montage
      localStorage.removeItem('goBusterUrl');
    }
    
    checkGoBusterInstallation();
    loadSavedSettings();
  }, []);

  // Fonction pour valider les entrées
  const validateInputs = () => {
    if (!url.trim()) {
      setError('Veuillez entrer une URL');
      return false;
    }
    
    if (!wordlist && !wordlistFile) {
      setError('Veuillez sélectionner ou spécifier une wordlist');
      return false;
    }
    
    return true;
  };

  // Fonction pour lancer GoBuster
  const runGoBuster = async () => {
    if (!validateInputs()) return;
    
    try {
      setIsRunning(true);
      setStatus('running');
      setError(null);
      setOutput([]);
      
      addToOutput({ type: 'info', message: `Démarrage de GoBuster en mode ${scanMode}...` });
      addToOutput({ type: 'info', message: `URL cible : ${url}` });
      
      // Construction de la commande GoBuster
      let command = `gobuster ${scanMode}`;
      
      // Ajout des paramètres communs
      command += ` -u ${url}`;
      
      if (wordlistFile) {
        // Utiliser le fichier sélectionné
        command += ` -w "${wordlistFile}"`;
      } else {
        // Utiliser le chemin de wordlist spécifié
        command += ` -w "${wordlist}"`;
      }
      
      // Ajout des extensions (si en mode dir)
      if (scanMode === 'dir' && extensions.trim()) {
        command += ` -x ${extensions}`;
      }
      
      // Ajout du nombre de threads
      command += ` -t ${threads}`;
      
      // Option verbose
      if (isVerbose) {
        command += ' -v';
      }
      
      addToOutput({ type: 'info', message: `Commande : ${command}` });
      
      // Exécution de la commande via l'API Electron
      if (window.electronAPI && window.electronAPI.executeCommand) {
        // On doit appeler executeCommand sans paramètre supplémentaire, car la fonction dans preload.js ne prend qu'un seul argument
        const result = await window.electronAPI.executeCommand(command);
        
        // Stockage de l'ID du processus pour pouvoir l'arrêter plus tard
        // Dans l'implémentation actuelle, le PID n'est pas retourné par la commande
        // Nous devons donc vérifier si le résultat contient un PID
        if (result && result.pid) {
          console.log("PID du processus GoBuster:", result.pid);
          setProcessId(result.pid);
        } else {
          console.error("Aucun PID retourné pour le processus GoBuster");
          addToOutput({ type: 'warning', message: "Impossible d'obtenir le PID du processus, l'arrêt pourrait ne pas fonctionner." });
        }
        
        if (result.stdout) {
          result.stdout.split('\n').forEach(line => {
            if (line.trim()) {
              const type = line.includes('Found:') || line.includes('Status:') 
                ? 'success' 
                : line.includes('Starting') || line.includes('Finished') 
                  ? 'info' 
                  : 'result';
              addToOutput({ type, message: line });
            }
          });
        }
        
        if (result.stderr) {
          result.stderr.split('\n').forEach(line => {
            if (line.trim()) {
              addToOutput({ type: 'error', message: line });
            }
          });
        }
        
        setStatus('completed');
        addToOutput({ type: 'success', message: 'Scan terminé' });
      } else {
        throw new Error("L'API Electron n'est pas disponible");
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
      setStatus('error');
      addToOutput({ type: 'error', message: `Erreur : ${err.message}` });
    } finally {
      setIsRunning(false);
      setProcessId(null);
    }
  };

  // Fonction pour arrêter GoBuster
  const stopGoBuster = async () => {
    try {
      // Marquer immédiatement comme "en cours d'arrêt" pour feedback utilisateur
      addToOutput({ type: 'warning', message: 'Arrêt du scan en cours...' });
      
      if (window.electronAPI && window.electronAPI.getPlatform) {
        const platform = await window.electronAPI.getPlatform();
        
        // Selon la plateforme, utiliser la commande appropriée
        if (platform === 'linux' || platform === 'darwin') {
          try {
            const killCmd = `pkill gobuster`;
            addToOutput({ type: 'info', message: `Tentative d'arrêt du processus: ${killCmd}` });
            await window.electronAPI.executeCommand(killCmd);
            addToOutput({ type: 'success', message: 'Processus gobuster arrêté avec succès' });
          } catch (error) {
            console.error("Erreur lors de l'arrêt du processus avec pkill:", error);
            
            // Essayer avec killall comme solution de repli
            try {
              addToOutput({ type: 'info', message: 'Nouvelle tentative avec killall...' });
              await window.electronAPI.executeCommand('killall gobuster');
              addToOutput({ type: 'success', message: 'Processus gobuster arrêté avec succès' });
            } catch (killallError) {
              console.error("Erreur lors de l'arrêt avec killall:", killallError);
              
              // Si rien ne fonctionne, essayer avec 'ps aux | grep gobuster | awk '{print $2}' | xargs kill -9'
              try {
                const complexCmd = `ps aux | grep gobuster | awk '{print $2}' | xargs kill -9`;
                addToOutput({ type: 'info', message: 'Dernière tentative...' });
                await window.electronAPI.executeCommand(complexCmd);
                addToOutput({ type: 'success', message: 'Processus gobuster arrêté avec succès' });
              } catch (finalError) {
                addToOutput({ type: 'error', message: 'Impossible d\'arrêter le processus automatiquement. Veuillez l\'arrêter manuellement.' });
              }
            }
          }
        } else if (platform === 'win32') {
          try {
            const killCmd = 'taskkill /F /IM gobuster.exe';
            addToOutput({ type: 'info', message: `Tentative d'arrêt du processus: ${killCmd}` });
            await window.electronAPI.executeCommand(killCmd);
            addToOutput({ type: 'success', message: 'Processus gobuster arrêté avec succès' });
          } catch (error) {
            console.error("Erreur lors de l'arrêt du processus sous Windows:", error);
            addToOutput({ type: 'error', message: 'Impossible d\'arrêter le processus automatiquement. Veuillez l\'arrêter manuellement.' });
          }
        }
      } else {
        addToOutput({ type: 'error', message: 'Impossible de déterminer la plateforme système' });
      }
    } catch (err) {
      console.error("Erreur générale lors de l'arrêt du processus:", err);
      setError(`Erreur lors de l'arrêt du processus : ${err.message}`);
    } finally {
      setIsRunning(false);
      setProcessId(null);
      setStatus('stopped');
    }
  };

  // Fonction pour ajouter une entrée au journal
  const addToOutput = (entry) => {
    setOutput(prev => [...prev, { ...entry, timestamp: new Date().toLocaleTimeString() }]);
  };

  // Fonction pour sélectionner un fichier wordlist
  const handleWordlistFileSelect = async () => {
    try {
      if (window.electronAPI && window.electronAPI.showOpenFileDialog) {
        const result = await window.electronAPI.showOpenFileDialog({
          title: 'Sélectionner une wordlist',
          properties: ['openFile'],
          filters: [
            { name: 'Wordlists', extensions: ['txt', 'dict', 'lst'] },
            { name: 'Tous les fichiers', extensions: ['*'] }
          ]
        });
        
        if (result && result.filePaths && result.filePaths.length > 0) {
          const selectedPath = result.filePaths[0];
          console.log("Fichier wordlist sélectionné:", selectedPath);
          
          // Mise à jour directe des deux états
          setWordlist(selectedPath);
          setWordlistFile(selectedPath);
          
          // Message de confirmation
          addToOutput({ 
            type: 'success', 
            message: `Wordlist sélectionnée : ${selectedPath}` 
          });
        }
      } else {
        setError("L'API de sélection de fichier n'est pas disponible");
      }
    } catch (err) {
      console.error("Erreur lors de la sélection du fichier:", err);
      setError(`Erreur lors de la sélection du fichier : ${err.message}`);
    }
  };

  // Fonction pour effacer la sortie
  const clearOutput = () => {
    setOutput([]);
  };

  // Fonction pour exporter les logs
  const exportLogs = async () => {
    try {
      if (output.length === 0) {
        setError("Aucun résultat à exporter");
        return;
      }

      if (window.electronAPI && window.electronAPI.showSaveFileDialog) {
        const result = await window.electronAPI.showSaveFileDialog({
          title: 'Exporter les résultats',
          defaultPath: `gobuster_${scanMode}_${new Date().toISOString().replace(/[:.]/g, '-')}.log`,
          filters: [
            { name: 'Fichiers log', extensions: ['log'] },
            { name: 'Fichiers texte', extensions: ['txt'] }
          ]
        });

        if (result && !result.canceled && result.filePath) {
          const logContent = output
            .map(item => `[${item.timestamp}] [${item.type.toUpperCase()}] ${item.message}`)
            .join('\n');

          const writeResult = await window.electronAPI.writeFile(result.filePath, logContent);
          if (writeResult && writeResult.success) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          } else {
            setError(`Erreur lors de l'écriture du fichier: ${writeResult.error || 'Erreur inconnue'}`);
          }
        }
      } else {
        setError("L'API d'exportation de fichier n'est pas disponible");
      }
    } catch (err) {
      console.error("Erreur lors de l'exportation:", err);
      setError(`Erreur lors de l'exportation des logs : ${err.message}`);
    }
  };

  // Fonction pour générer une wordlist avec Crunch
  const generateWordlist = async () => {
    try {
      setIsRunning(true);
      
      // Validation des champs
      if (!outputFilename) {
        setError('Veuillez spécifier un nom de fichier de sortie');
        setIsRunning(false);
        return;
      }
      
      // Si on utilise un pattern, il doit être spécifié
      if (usePattern && !pattern) {
        setError('Veuillez spécifier un pattern');
        setIsRunning(false);
        return;
      }
      
      // Si on n'utilise pas de pattern, les longueurs min et max sont obligatoires
      if (!usePattern && (!minLength || !maxLength)) {
        setError('Veuillez spécifier les longueurs minimale et maximale');
        setIsRunning(false);
        return;
      }
      
      addToOutput({ type: 'info', message: 'Génération de la wordlist avec Crunch...' });
      
      // Construire la commande Crunch
      let command = `crunch ${minLength} ${maxLength}`;
      
      // Ajouter le charset si spécifié
      if (charset && charset.trim() !== '') {
        command += ` "${charset}"`;
      }
      
      // Ajouter le pattern si l'option est activée
      if (usePattern && pattern) {
        command += ` -t "${pattern}"`;
      }
      
      // Ajouter le fichier de sortie
      command += ` -o ${outputFilename}`;
      
      addToOutput({ type: 'info', message: `Commande : ${command}` });
      
      // Exécuter la commande via l'API Electron
      if (window.electronAPI && window.electronAPI.executeCommand) {
        try {
          const result = await window.electronAPI.executeCommand(command);
          
          if (result.stdout) {
            result.stdout.split('\n').forEach(line => {
              if (line.trim()) {
                addToOutput({ type: 'info', message: line });
              }
            });
          }
          
          if (result.stderr) {
            result.stderr.split('\n').forEach(line => {
              if (line.trim()) {
                addToOutput({ type: 'error', message: line });
              }
            });
          }
          
          // Mettre à jour le chemin de wordlist
          setWordlist(outputFilename);
          setWordlistFile(outputFilename);
          
          addToOutput({ type: 'success', message: `Wordlist générée avec succès : ${outputFilename}` });
          
          // Fermer le formulaire de génération de wordlist
          setShowWordlistGenerator(false);
        } catch (error) {
          console.error('Erreur lors de l\'exécution de la commande Crunch:', error);
          addToOutput({ type: 'error', message: `Erreur lors de la génération de la wordlist : ${error.message}` });
          setError(`Erreur lors de la génération de la wordlist : ${error.message}`);
        }
      } else {
        throw new Error("L'API Electron n'est pas disponible");
      }
    } catch (err) {
      console.error('Erreur lors de la génération de la wordlist:', err);
      addToOutput({ type: 'error', message: `Erreur : ${err.message}` });
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsRunning(false);
    }
  };

  // Rendu des icônes en fonction du type de message
  const renderIcon = (type) => {
    switch (type) {
      case 'error':
        return <FiAlertCircle className="text-red-500" />;
      case 'warning':
        return <FiInfo className="text-yellow-500" />;
      case 'success':
        return <FiCheckCircle className="text-green-500" />;
      case 'info':
        return <FiInfo className="text-blue-500" />;
      case 'result':
        return type.includes('Status:') ? <FiCheckCircle className="text-green-500" /> : <FiFile className="text-gray-500" />;
      default:
        return <FiClock className="text-gray-500" />;
    }
  };

  // Rendu conditionnel en fonction de la plateforme
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Si ce n'est pas Linux, afficher un message d'erreur
  if (platform !== 'linux') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <div className="flex items-center">
            <FiAlertCircle className="mr-2" size={24} />
            <div>
              <p className="font-bold">Incompatible avec Windows</p>
              <p>GoBuster n'est pas compatible avec Windows. Veuillez utiliser un système Linux pour accéder à cette fonctionnalité.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si GoBuster n'est pas installé, afficher un message d'installation
  if (!isGoBusterInstalled) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
          <div className="flex items-center">
            <FiInfo className="mr-2" size={24} />
            <div>
              <p className="font-bold">GoBuster n'est pas installé</p>
              <p>Veuillez installer GoBuster pour utiliser cette fonctionnalité.</p>
              <p className="mt-2">Vous pouvez l'installer avec la commande suivante :</p>
              <pre className="bg-gray-100 p-2 mt-2 rounded">sudo apt-get install gobuster</pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">GoBuster</h1>
      
      {/* Description */}
      <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-md mb-6">
        <p className="text-blue-800 dark:text-blue-200">
          GoBuster est un outil de force brute pour les répertoires et fichiers sur les sites web, 
          la découverte de sous-domaines (vhost/dns) et plus encore.
        </p>
      </div>
      
      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 mb-6 rounded">
          <p className="font-bold">Erreur</p>
          <p>{error}</p>
          <button 
            onClick={() => setError(null)} 
            className="text-sm underline mt-2"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Message de succès pour l'exportation */}
      {showSuccess && (
        <div className="bg-green-100 dark:bg-green-900 border-l-4 border-green-500 text-green-700 dark:text-green-200 p-4 mb-6 rounded">
          <p className="font-bold">Succès</p>
          <p>Les logs ont été exportés avec succès</p>
          <button 
            onClick={() => setShowSuccess(false)} 
            className="text-sm underline mt-2"
          >
            Fermer
          </button>
        </div>
      )}
      
      {/* Paramètres du scan */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Paramètres</h2>
        
        {/* Mode de scan */}
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
            Mode de scan
          </label>
          <select
            value={scanMode}
            onChange={(e) => setScanMode(e.target.value)}
            disabled={isRunning}
            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="dir">Répertoires et fichiers (dir)</option>
            <option value="vhost">Hôtes virtuels (vhost)</option>
            <option value="dns">Sous-domaines (dns)</option>
            <option value="fuzz">Fuzzing (fuzz)</option>
            <option value="s3">Buckets S3 (s3)</option>
            <option value="tftp">TFTP (tftp)</option>
            <option value="gcs">Google Cloud Storage (gcs)</option>
          </select>
        </div>
        
        {/* URL */}
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
            URL cible
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isRunning}
            placeholder="https://example.com"
            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        
        {/* Wordlist */}
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
            Wordlist
          </label>
          <div className="flex">
            <input
              type="text"
              value={wordlist}
              onChange={(e) => setWordlist(e.target.value)}
              disabled={isRunning}
              placeholder="/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt"
              className="flex-1 p-2 border rounded-l-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <button
              onClick={handleWordlistFileSelect}
              disabled={isRunning}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500"
              title="Parcourir"
            >
              <FiUpload />
            </button>
            <button
              onClick={() => setShowWordlistGenerator(true)}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-r-md"
              title="Générer une wordlist avec Crunch"
            >
              <FiPlay className="mr-1 inline" /> Crunch
            </button>
          </div>
          {wordlistFile && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Fichier sélectionné : {wordlistFile}
            </div>
          )}
        </div>
        
        {/* Générateur de wordlist avec Crunch */}
        {showWordlistGenerator && (
          <div className="mt-4 mb-4 p-4 border border-blue-200 rounded-md bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <h3 className="text-lg font-semibold mb-3 text-blue-700 dark:text-blue-400">
              Générer une wordlist avec Crunch
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Longueur minimale *
                </label>
                <input
                  type="text"
                  value={minLength}
                  onChange={(e) => setMinLength(e.target.value)}
                  className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="8"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Longueur maximale *
                </label>
                <input
                  type="text"
                  value={maxLength}
                  onChange={(e) => setMaxLength(e.target.value)}
                  className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="10"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jeu de caractères
                </label>
                <input
                  type="text"
                  value={charset}
                  onChange={(e) => setCharset(e.target.value)}
                  className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="abcdefghijklmnopqrstuvwxyz0123456789"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Exemples: "abc123!@#" ou "abcdefghijklmnopqrstuvwxyz0123456789"
                </p>
              </div>
              
              <div className="md:col-span-2">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="use-pattern"
                    checked={usePattern}
                    onChange={(e) => setUsePattern(e.target.checked)}
                    className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="use-pattern" className="text-gray-700 dark:text-gray-300">
                    Utiliser un pattern
                  </label>
                </div>
                
                {usePattern && (
                  <>
                    <input
                      type="text"
                      value={pattern}
                      onChange={(e) => setPattern(e.target.value)}
                      className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white mt-2"
                      placeholder="!Min@@@@@t33"
                    />
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <p>Utilisez des caractères spéciaux pour définir le format :</p>
                      <ul className="list-disc list-inside mt-1">
                        <li><span className="font-mono">@</span> - Lettres minuscules (a-z)</li>
                        <li><span className="font-mono">,</span> - Lettres majuscules (A-Z)</li>
                        <li><span className="font-mono">%</span> - Chiffres (0-9)</li>
                        <li><span className="font-mono">^</span> - Caractères spéciaux (!@#$)</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom du fichier de sortie *
              </label>
              <input
                type="text"
                value={outputFilename}
                onChange={(e) => setOutputFilename(e.target.value)}
                className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="wordlist.txt"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowWordlistGenerator(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md"
              >
                Annuler
              </button>
              <button
                onClick={generateWordlist}
                disabled={isRunning}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
              >
                <FiPlay className="mr-2" /> Générer
              </button>
            </div>
          </div>
        )}
        
        {/* Extensions (seulement pour le mode dir) */}
        {scanMode === 'dir' && (
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Extensions (séparées par des virgules)
            </label>
            <input
              type="text"
              value={extensions}
              onChange={(e) => setExtensions(e.target.value)}
              disabled={isRunning}
              placeholder="php,html,txt"
              className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        )}
        
        {/* Threads */}
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
            Nombre de threads
          </label>
          <input
            type="number"
            value={threads}
            onChange={(e) => setThreads(parseInt(e.target.value) || 1)}
            disabled={isRunning}
            min="1"
            max="100"
            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Option verbose */}
        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="verbose"
            checked={isVerbose}
            onChange={(e) => setIsVerbose(e.target.checked)}
            disabled={isRunning}
            className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="verbose" className="text-gray-700 dark:text-gray-300">
            Mode verbeux (affiche plus de détails)
          </label>
        </div>
        
        {/* Boutons d'exécution et d'arrêt */}
        <div className="flex gap-2">
          <button
            onClick={runGoBuster}
            disabled={isRunning}
            className={`flex-1 py-2 px-4 rounded-md font-medium flex items-center justify-center gap-2 ${
              isRunning
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            <FiPlay />
            {isRunning ? 'En cours...' : 'Lancer GoBuster'}
          </button>
          
          {isRunning && (
            <button
              onClick={stopGoBuster}
              className="flex-1 py-2 px-4 rounded-md font-medium flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white"
            >
              <FiSquare />
              Arrêter le scan
            </button>
          )}
        </div>
      </div>
      
      {/* Résultats */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Résultats</h2>
          <div className="flex space-x-2">
            <button
              onClick={exportLogs}
              disabled={isRunning || output.length === 0}
              className={`py-1 px-3 rounded-md text-sm flex items-center gap-1 ${
                isRunning || output.length === 0
                  ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                  : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800'
              }`}
            >
              <FiSave size={14} />
              Exporter
            </button>
            <button
              onClick={clearOutput}
              disabled={isRunning || output.length === 0}
              className={`py-1 px-3 rounded-md text-sm ${
                isRunning || output.length === 0
                  ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                  : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800'
              }`}
            >
              Effacer
            </button>
          </div>
        </div>
        
        <div className="h-96 overflow-y-auto border rounded-md p-4 bg-gray-50 dark:bg-gray-900 dark:border-gray-700 font-mono text-sm">
          {output.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 italic">Les résultats s'afficheront ici...</p>
          ) : (
            output.map((item, index) => (
              <div key={index} className="flex items-start mb-1">
                <span className="mr-2 mt-1">{renderIcon(item.type)}</span>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 mr-2">[{item.timestamp}]</span>
                  <span className={`${
                    item.type === 'error' ? 'text-red-600 dark:text-red-400' : 
                    item.type === 'success' ? 'text-green-600 dark:text-green-400' : 
                    item.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : 
                    'text-gray-800 dark:text-gray-200'
                  }`}>
                    {item.message}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GoBuster;

