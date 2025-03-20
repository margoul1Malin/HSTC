import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiCheckCircle, FiX, FiPlay, FiSlash, FiFile, FiSave } from 'react-icons/fi';

const XSSer = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [url, setUrl] = useState('');
  const [param, setParam] = useState('XSS');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [useAuto, setUseAuto] = useState(true);
  const [saveReport, setSaveReport] = useState(true);
  const [reportPath, setReportPath] = useState('');
  const [vulnerabilitiesCount, setVulnerabilitiesCount] = useState(0);
  const [processId, setProcessId] = useState(null);

  // Fonction pour exécuter XSSer
  const runXSSer = async () => {
    if (!url) {
      setError('Veuillez entrer une URL');
      return;
    }

    try {
      setIsRunning(true);
      setOutput('');
      setError('');
      setStatus('Lancement de XSSer...');
      setVulnerabilitiesCount(0);

      const targetUrl = param ? `${url}?param=${param}` : url;
      const options = [];
      
      if (useAuto) options.push('--auto');
      if (saveReport) options.push('--save');

      // Construction de la commande avec changement de répertoire 
      // Le problème est que xsser cherche les fichiers relatifs à son répertoire d'exécution
      const command = `cd src/programs/xsser && ./xsser -u '${targetUrl}' ${options.join(' ')}`;
      
      // Version simplifiée et compatible avec l'API disponible
      if (window.electronAPI && window.electronAPI.executeCommand) {
        try {
          const result = await window.electronAPI.executeCommand(command);
          
          if (result && result.stdout) {
            const output = result.stdout;
            setOutput(output);
            
            // Analyse de la sortie - ne regarder que le statut
            if (output.includes('[!] Status: XSS FAILED!')) {
              setStatus('Test XSS échoué - Pas de vulnérabilité trouvée');
              setVulnerabilitiesCount(0);
            } else if (output.includes('[!] Status:')) {
              // Si le statut n'est pas FAILED, c'est qu'une vulnérabilité a été trouvée
              setVulnerabilitiesCount(1);
              setStatus('Vulnérabilité XSS détectée');
            }
          } else {
            if (result && result.stderr) {
              setError(`Erreur: ${result.stderr}`);
            }
          }
          
          setIsRunning(false);
        } catch (execError) {
          setError('Erreur lors de l\'exécution: ' + (execError.message || 'Une erreur est survenue'));
          setIsRunning(false);
          setStatus('Erreur');
        }
      } else {
        throw new Error('API Electron executeCommand non disponible');
      }
    } catch (err) {
      setError('Erreur: ' + (err.message || 'Une erreur est survenue'));
      setIsRunning(false);
      setStatus('Erreur');
    }
  };

  // Fonction pour arrêter XSSer
  const stopXSSer = async () => {
    try {
      setStatus('Arrêt de XSSer...');
      
      // Utilisez un processus différent selon le système d'exploitation
      const platform = window.navigator.platform.toLowerCase();
      
      let killCommand;
      
      if (platform.includes('linux') || platform.includes('mac')) {
        killCommand = `pkill -f "xsser -u" || true`;  // Le || true empêche l'erreur si aucun processus n'est trouvé
      } else if (platform.includes('win')) {
        killCommand = `taskkill /F /IM xsser.exe /T`;
      } else {
        // Fallback si on ne peut pas détecter la plateforme
        setError('Impossible de détecter la plateforme. Veuillez arrêter manuellement le processus.');
        return;
      }
      
      // Exécuter la commande d'arrêt
      if (window.electronAPI && window.electronAPI.executeCommand) {
        try {
          await window.electronAPI.executeCommand(killCommand);
          
          // Même si la commande échoue avec SIGTERM, considérer que le processus est arrêté
          setStatus('XSSer arrêté');
          setIsRunning(false);
          setProcessId(null);
          
          // Si le rapport a été généré, le lire automatiquement
          if (saveReport) {
            await readReport();
          }
        } catch (stopError) {
          // Ne pas afficher l'erreur à l'utilisateur, car le processus peut s'être terminé normalement
          setStatus('XSSer arrêté');
          setIsRunning(false);
          setProcessId(null);
          
          // Si le rapport a été généré, le lire automatiquement
          if (saveReport) {
            await readReport();
          }
        }
      } else {
        throw new Error('API Electron non disponible');
      }
    } catch (err) {
      // Ne pas afficher l'erreur à l'utilisateur
      setStatus('XSSer arrêté');
      setIsRunning(false);
    }
  };

  // Fonction pour lire le rapport généré
  const readReport = async () => {
    try {
      // Si un rapport a été généré, on va le lire
      if (window.electronAPI && window.electronAPI.executeCommand) {
        try {
          const result = await window.electronAPI.executeCommand('cat src/programs/xsser/XSSreport.raw');
          
          if (result && result.stdout) {
            const reportData = result.stdout;
            
            // Analyse du rapport - ne regarder que le statut
            if (reportData.includes('[!] Status: XSS FAILED!')) {
              setStatus('Test XSS échoué - Pas de vulnérabilité trouvée');
              setVulnerabilitiesCount(0);
            } else if (reportData.includes('[!] Status:')) {
              // Si le statut n'est pas FAILED, c'est qu'une vulnérabilité a été trouvée
              setVulnerabilitiesCount(1);
              setStatus('Vulnérabilité XSS détectée');
            }
            
            // Ajouter les données du rapport à la sortie console
            setOutput(prev => prev + "\n\n=== RAPPORT ===\n" + reportData);
          }
        } catch (readError) {
          // Ne pas afficher l'erreur à l'utilisateur si le rapport n'existe pas encore
        }
      }
    } catch (err) {
      // Ne pas afficher l'erreur à l'utilisateur si le rapport n'existe pas encore
    }
  };

  // Nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      if (isRunning) {
        stopXSSer();
      }
    };
  }, [isRunning]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">XSSer - Scanner de vulnérabilités XSS</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">URL Cible</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full p-2 border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              disabled={isRunning}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Paramètre à tester</label>
            <input
              type="text"
              value={param}
              onChange={(e) => setParam(e.target.value)}
              placeholder="XSS"
              className="w-full p-2 border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              disabled={isRunning}
            />
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="auto"
              checked={useAuto}
              onChange={(e) => setUseAuto(e.target.checked)}
              className="mr-2"
              disabled={isRunning}
            />
            <label htmlFor="auto" className="text-sm">Mode Auto (--auto)</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="save"
              checked={saveReport}
              onChange={(e) => setSaveReport(e.target.checked)}
              className="mr-2"
              disabled={isRunning}
            />
            <label htmlFor="save" className="text-sm">Sauvegarder Rapport (--save)</label>
          </div>
        </div>
        
        <div className="mt-4 flex gap-2">
          <button
            onClick={runXSSer}
            disabled={isRunning || !url}
            className={`flex items-center px-4 py-2 rounded-md ${
              isRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            <FiPlay className="mr-2" /> Lancer XSSer
          </button>
          
          <button
            onClick={stopXSSer}
            disabled={!isRunning}
            className={`flex items-center px-4 py-2 rounded-md ${
              !isRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
            } text-white`}
          >
            <FiSlash className="mr-2" /> Arrêter
          </button>
        </div>
      </div>
      
      {/* Statut et erreurs */}
      {status && (
        <div className={`p-3 mb-4 rounded-md ${status.includes('Erreur') || status.includes('échoué') ? 'bg-red-100 text-red-800' : status.includes('vulnérabilités') ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
          {status}
        </div>
      )}
      
      {error && (
        <div className="p-3 mb-4 bg-red-100 text-red-800 rounded-md flex items-center">
          <FiAlertCircle className="mr-2" />
          {error}
        </div>
      )}
      
      {/* Section résumé des vulnérabilités */}
      {vulnerabilitiesCount > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 mb-6">
          <h2 className="text-xl font-bold mb-3 flex items-center text-yellow-600">
            <FiAlertCircle className="mr-2" /> Vulnérabilités Détectées
          </h2>
          <p className="text-lg">
            {vulnerabilitiesCount} vulnérabilités XSS ont été détectées. Veuillez consulter la console pour plus de détails.
          </p>
        </div>
      )}
      
      {/* Sortie de la console */}
      <div className="bg-black text-white rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Sortie Console</h2>
          <button 
            onClick={() => setOutput('')}
            className="text-gray-400 hover:text-white"
          >
            <FiX />
          </button>
        </div>
        <pre className="whitespace-pre-wrap text-sm font-mono h-64 overflow-y-auto">
          {output || 'En attente de la sortie...'}
        </pre>
      </div>
    </div>
  );
};

export default XSSer;

