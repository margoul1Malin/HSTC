import React, { useState, useEffect } from 'react';
import { 
  Box, Button, TextField, Typography, FormControl, 
  InputLabel, Select, MenuItem, FormControlLabel, Switch,
  CircularProgress, Alert, Paper, Grid, Divider, Slider, Tooltip,
  Tabs, Tab
} from '@mui/material';
import { BiScan, BiDownload, BiCheckCircle, BiErrorCircle } from 'react-icons/bi';
import { FaGlobe } from 'react-icons/fa6';

// Remplacer l'import ReactJson par une fonction qui formate JSON de manière lisible
// import ReactJson from 'react-json-view';

// Fonction pour formatter le JSON en une chaîne lisible
const formatJSON = (obj, indent = 2) => {
  return JSON.stringify(obj, null, indent);
};

const defaultSettings = {
  target: '',
  depth: 2,
  mode: 'stealth',
  timeout: 10,
  threads: 5,
  delay: 1,
  checkHeaders: true,
  format: 'json',
  userAgent: 'random',
  ignoreRobots: false,
  reportPath: '',
  verboseMode: true
};

const HakBoardCrawler = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [scanStatus, setScanStatus] = useState('idle'); // idle, scanning, success, error
  const [activeTab, setActiveTab] = useState(0);
  
  useEffect(() => {
    // Charger les paramètres précédents si disponibles
    const loadSettings = async () => {
      try {
        const savedSettings = await window.electronAPI.getStoreValue('hakboardcrawler_settings');
        if (savedSettings) {
          setSettings(savedSettings);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des paramètres:', err);
      }
    };
    
    loadSettings();
  }, []);
  
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setSettings(prev => ({
      ...prev,
      [name]: newValue
    }));
  };
  
  // Gestionnaire pour les changements de Slider
  const handleSliderChange = (name) => (_, value) => {
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const saveSettings = async () => {
    try {
      await window.electronAPI.setStoreValue('hakboardcrawler_settings', settings);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des paramètres:', err);
      setError("Impossible de sauvegarder les paramètres.");
    }
  };
  
  const runScan = async () => {
    if (!settings.target) {
      setError('Veuillez entrer une cible valide');
      return;
    }
    
    setLoading(true);
    setError(null);
    setScanStatus('scanning');
    
    try {
      // Sauvegarder les paramètres actuels
      await saveSettings();
      
      // Détecter le système d'exploitation
      const isWindows = window.electronAPI && window.electronAPI.platform === 'win32';
      console.log('[HakBoardCrawler] Plateforme détectée:', isWindows ? 'Windows' : 'Linux');
      
      // S'assurer qu'un chemin de rapport est spécifié
      const reportBasePath = settings.reportPath || (isWindows ? '.\\temp\\hakboard_report' : '/tmp/hakboard_report');
      
      // Créer un timestamp pour ce scan
      const now = new Date();
      const dateStr = now.getFullYear() + 
                     ('0' + (now.getMonth() + 1)).slice(-2) + 
                     ('0' + now.getDate()).slice(-2);
      const timeStr = ('0' + now.getHours()).slice(-2) + 
                     ('0' + now.getMinutes()).slice(-2) + 
                     ('0' + now.getSeconds()).slice(-2);
      
      // Construire le nom du fichier de sortie prévu
      const targetClean = settings.target.replace(/[^a-zA-Z0-9]/g, '_');
      const expectedFilename = `${reportBasePath}_${targetClean}_${dateStr}_${timeStr}.json`;

      // Créer un marqueur temporel pour trouver facilement le fichier généré après
      const markerPath = isWindows 
        ? `.\\temp\\scan_start_marker_${timeStr}`
        : `/tmp/scan_start_marker_${timeStr}`;

      // Créer le marqueur selon l'OS
      if (isWindows) {
        await window.electronAPI.executeCommand(`echo. > "${markerPath}"`);
        console.log('[HakBoardCrawler] Marqueur Windows créé:', markerPath);
      } else {
        await window.electronAPI.executeCommand(`touch "${markerPath}"`);
        console.log('[HakBoardCrawler] Marqueur Linux créé:', markerPath);
      }
      
      // Construire la commande avec tous les arguments
      let command;
      if (isWindows) {
        command = `.\\env\\Scripts\\python.exe -m hakboardcrawler ${settings.target}`;
        console.log('[HakBoardCrawler] Commande Windows utilisée:', command);
      } else {
        command = `env/bin/hakboardcrawler ${settings.target}`;
        console.log('[HakBoardCrawler] Commande Linux utilisée:', command);
      }
      
      // Ajouter tous les paramètres configurés
      if (settings.depth) command += ` -d ${settings.depth}`;
      if (settings.mode) command += ` -m ${settings.mode}`;
      if (settings.timeout) command += ` --timeout ${settings.timeout}`;
      if (settings.threads) command += ` -t ${settings.threads}`;
      if (settings.delay) command += ` --delay ${settings.delay}`;
      command += ` -f json`; // Toujours utiliser JSON pour traiter les résultats
      
      if (settings.userAgent !== 'random') command += ` --user-agent ${settings.userAgent}`;
      if (settings.ignoreRobots) command += ` --no-robots`;
      
      command += ` -o "${reportBasePath}"`;

      if (settings.verboseMode) command += ` -v`;
      
      console.log('[HakBoardCrawler] Commande finale:', command);
      
      // Exécuter la commande
      await window.electronAPI.executeCommand(command);
      
      // Attendre un peu pour s'assurer que le fichier est bien écrit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // ====== STRATÉGIE 1: Essayer de lire le fichier prévu directement ======
      console.log('[HakBoardCrawler] Tentative de lecture du fichier prévu:', expectedFilename);
      
      let fileResult;
      try {
        const readCommand = isWindows
          ? `type "${expectedFilename}"`
          : `cat "${expectedFilename}"`;
        console.log('[HakBoardCrawler] Commande de lecture:', readCommand);
        fileResult = await window.electronAPI.executeCommand(readCommand);
        if (!fileResult.stderr) {
          console.log('[HakBoardCrawler] Succès: Fichier trouvé directement');
        }
      } catch (err) {
        console.log('[HakBoardCrawler] Fichier prévu non trouvé, passage à la stratégie 2');
      }
      
      // ====== STRATÉGIE 2: Rechercher les fichiers récents dans le répertoire ======
      if (fileResult?.stderr || !fileResult) {
        console.log('[HakBoardCrawler] Recherche des fichiers récents correspondants...');
        
        // Obtenir le répertoire de base
        const basePath = reportBasePath.substring(0, reportBasePath.lastIndexOf(isWindows ? '\\' : '/') + 1) || (isWindows ? '.\\temp\\' : '/tmp/');
        const baseFile = reportBasePath.substring(reportBasePath.lastIndexOf(isWindows ? '\\' : '/') + 1);
        
        // Rechercher les fichiers JSON récents avec le bon préfixe
        const findCommand = isWindows
          ? `dir /b /o-d "${basePath}${baseFile}_${targetClean}*.json" | findstr /n "^" | findstr "^1:"`
          : `find ${basePath} -type f -name "${baseFile}_${targetClean}*.json" -newer "${markerPath}" | sort -r | head -1`;
        
        console.log('[HakBoardCrawler] Commande de recherche:', findCommand);
        const findResult = await window.electronAPI.executeCommand(findCommand);
        
        if (findResult.stdout && findResult.stdout.trim()) {
          const foundFile = findResult.stdout.trim();
          const filePath = isWindows 
            ? `${basePath}${foundFile.replace(/^1:/, '')}`
            : foundFile;
          console.log('[HakBoardCrawler] Fichier trouvé par recherche:', filePath);
          
          const readCommand = isWindows
            ? `type "${filePath}"`
            : `cat "${filePath}"`;
          fileResult = await window.electronAPI.executeCommand(readCommand);
        } else {
          // ====== STRATÉGIE 3: Recherche générale des fichiers JSON récents ======
          console.log('[HakBoardCrawler] Aucun fichier spécifique trouvé, recherche des fichiers JSON récents...');
          const findAnyJsonCommand = isWindows
            ? `dir /b /o-d "${basePath}*.json" | findstr /n "^" | findstr "^1:"`
            : `find ${basePath} -type f -name "*.json" -newer "${markerPath}" | sort -r | head -1`;
          
          const findAnyResult = await window.electronAPI.executeCommand(findAnyJsonCommand);
          
          if (findAnyResult.stdout && findAnyResult.stdout.trim()) {
            const foundAnyFile = findAnyResult.stdout.trim();
            const filePath = isWindows 
              ? `${basePath}${foundAnyFile.replace(/^1:/, '')}`
              : foundAnyFile;
            console.log('[HakBoardCrawler] Fichier JSON récent trouvé:', filePath);
            
            const readCommand = isWindows
              ? `type "${filePath}"`
              : `cat "${filePath}"`;
            fileResult = await window.electronAPI.executeCommand(readCommand);
          } else {
            throw new Error('Aucun fichier de rapport JSON trouvé');
          }
        }
      }
      
      // Vérifier le contenu du fichier JSON
      if (!fileResult || fileResult.stderr) {
        throw new Error(`Impossible de lire le fichier de rapport: ${fileResult?.stderr || 'Erreur inconnue'}`);
      }
      
      // Parser le contenu JSON
      try {
        const jsonOutput = JSON.parse(fileResult.stdout);
        console.log('[HakBoardCrawler] Résultats du scan (aperçu):', Object.keys(jsonOutput));
        setResults(jsonOutput);
        setScanStatus('success');
      } catch (parseError) {
        console.error('[HakBoardCrawler] Erreur lors du parsing JSON:', parseError);
        console.log('[HakBoardCrawler] Début du contenu brut:', fileResult.stdout.substring(0, 200) + '...');
        throw new Error('Impossible de parser les résultats JSON');
      }
      
    } catch (err) {
      console.error('[HakBoardCrawler] Erreur lors du scan:', err);
      setError(err.message || 'Une erreur s\'est produite lors du scan');
      setScanStatus('error');
    } finally {
      setLoading(false);
    }
  };
  
  const exportResults = async () => {
    if (!results) return;
    
    try {
      // Options pour la boîte de dialogue de sauvegarde
      const options = {
        title: 'Enregistrer les résultats du scan',
        defaultPath: `hakboardcrawler_${settings.target.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}`,
        filters: [
          { name: 'Fichiers JSON', extensions: ['json'] },
          { name: 'Fichiers HTML', extensions: ['html'] },
          { name: 'Tous les fichiers', extensions: ['*'] }
        ]
      };
      
      // Afficher la boîte de dialogue de sauvegarde
      const { canceled, filePath } = await window.electronAPI.showSaveFileDialog(options);
      
      if (!canceled && filePath) {
        // Déterminer le format en fonction de l'extension
        const isHtml = filePath.toLowerCase().endsWith('.html');
        
        if (isHtml) {
          // Exécuter à nouveau le crawler avec le format HTML
          const outputPath = filePath.replace(/\.[^/.]+$/, ""); // Supprimer l'extension
          
          // Détecter la plateforme
          const isWindows = window.electronAPI && window.electronAPI.platform === 'win32';
          console.log('[HakBoardCrawler] Plateforme détectée pour export:', isWindows ? 'Windows' : 'Linux');
          
          // Construire la commande pour générer le rapport HTML avec le bon chemin selon la plateforme
          let command = isWindows
            ? `.\\env\\Scripts\\python.exe -m hakboardcrawler ${settings.target} -f html -o "${outputPath}"`
            : `env/bin/hakboardcrawler ${settings.target} -f html -o "${outputPath}"`;
          
          console.log('[HakBoardCrawler] Commande d\'export HTML:', command);
          
          // Ajouter les paramètres de base
          if (settings.depth) command += ` -d ${settings.depth}`;
          if (settings.mode) command += ` -m ${settings.mode}`;
          if (settings.timeout) command += ` --timeout ${settings.timeout}`;
          
          // Demander confirmation pour générer un nouveau rapport
          setError({ 
            type: 'info', 
            message: 'Génération du rapport HTML en cours...' 
          });
          
          // Exécuter la commande
          const result = await window.electronAPI.executeCommand(command);
          
          if (result.stderr && result.stderr.trim() !== '') {
            throw new Error(result.stderr || 'Échec de génération du rapport HTML');
          }
          
          setError({ 
            type: 'success', 
            message: `Rapport HTML généré avec succès: ${filePath}` 
          });
        } else {
          // Écrire les résultats JSON dans le fichier
          await window.electronAPI.writeFile(filePath, JSON.stringify(results, null, 2));
          setError({ 
            type: 'success', 
            message: `Résultats enregistrés dans ${filePath}` 
          });
        }
      }
    } catch (err) {
      console.error('[HakBoardCrawler] Erreur lors de l\'exportation des résultats:', err);
      setError(`Impossible d'exporter les résultats: ${err.message}`);
    }
  };
  
  const renderStatusIcon = () => {
    switch (scanStatus) {
      case 'scanning':
        return <CircularProgress size={20} />;
      case 'success':
        return <BiCheckCircle size={20} color="green" />;
      case 'error':
        return <BiErrorCircle size={20} color="red" />;
      default:
        return null;
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const renderResultsSummary = () => {
    if (!results || !results.summary) return null;
    
    return (
      <Box mb={3}>
        <Typography variant="subtitle1" gutterBottom>
          Résumé
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.paper' }}>
              <Typography variant="body2" color="text.secondary">URLs analysées</Typography>
              <Typography variant="h6">{results.summary.total_urls || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.paper' }}>
              <Typography variant="body2" color="text.secondary">Vulnérabilités</Typography>
              <Typography variant="h6">{results.summary.total_vulnerabilities || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.paper' }}>
              <Typography variant="body2" color="text.secondary">API Endpoints</Typography>
              <Typography variant="h6">{results.summary.apis_found || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.paper' }}>
              <Typography variant="body2" color="text.secondary">Durée du scan</Typography>
              <Typography variant="h6">{results.summary.scan_duration || 'N/A'}</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  const renderVulnerabilities = () => {
    if (!results || !results.vulnerabilities) return null;
    
    const vulnerabilities = results.vulnerabilities;
    const issues = [
      ...(vulnerabilities.cors_issues || []),
      ...(vulnerabilities.csp_issues || []),
      ...(vulnerabilities.potential_vulnerabilities || []),
      ...(results.header_issues || [])
    ];
    
    if (issues.length === 0) {
      return (
        <Box mt={2}>
          <Alert severity="success">Aucune vulnérabilité n'a été détectée.</Alert>
        </Box>
      );
    }
    
    return (
      <Box mt={2}>
        <Typography variant="subtitle1" gutterBottom>
          Vulnérabilités détectées
        </Typography>
        <Paper variant="outlined" sx={{ maxHeight: '400px', overflow: 'auto' }}>
          {issues.map((issue, index) => (
            <Box key={index} p={2} borderBottom="1px solid" borderColor="divider">
              <Typography variant="subtitle2" color="error">{issue.type || issue.header || 'Problème'}</Typography>
              <Typography variant="body2">Sévérité: {issue.severity || 'inconnue'}</Typography>
              <Typography variant="body2">{issue.description}</Typography>
            </Box>
          ))}
        </Paper>
      </Box>
    );
  };
  
  const renderEndpoints = () => {
    if (!results || !results.endpoints || !results.endpoints.endpoints) return null;
    
    const endpoints = results.endpoints.endpoints;
    
    if (endpoints.length === 0) {
      return (
        <Box mt={2}>
          <Alert severity="info">Aucun endpoint API n'a été détecté.</Alert>
        </Box>
      );
    }
    
    return (
      <Box mt={2}>
        <Typography variant="subtitle1" gutterBottom>
          Endpoints API détectés
        </Typography>
        <Paper variant="outlined" sx={{ maxHeight: '400px', overflow: 'auto' }}>
          {endpoints.map((endpoint, index) => (
            <Box key={index} p={2} borderBottom="1px solid" borderColor="divider">
              <Typography variant="subtitle2" color="primary">{endpoint.url}</Typography>
              <Typography variant="body2">Méthode: {endpoint.method || 'GET'}</Typography>
              {endpoint.parameters && endpoint.parameters.length > 0 && (
                <Typography variant="body2">
                  Paramètres: {endpoint.parameters.join(', ')}
                </Typography>
              )}
            </Box>
          ))}
        </Paper>
      </Box>
    );
  };
  
  const renderSiteMap = () => {
    if (!results || !results.site_map || !results.site_map.nodes) return null;
    
    const nodes = results.site_map.nodes;
    
    if (nodes.length === 0) {
      return (
        <Box mt={2}>
          <Alert severity="info">La carte du site est vide.</Alert>
        </Box>
      );
    }
    
    return (
      <Box mt={2}>
        <Typography variant="subtitle1" gutterBottom>
          Carte du site ({nodes.length} pages)
        </Typography>
        <Paper variant="outlined" sx={{ maxHeight: '400px', overflow: 'auto' }}>
          {nodes.map((node, index) => (
            <Box key={index} p={2} borderBottom="1px solid" borderColor="divider">
              <Typography variant="subtitle2" color="primary">{node.url}</Typography>
              <Typography variant="body2">
                Titre: {node.title || 'N/A'} | 
                Statut: {node.status || 'N/A'} | 
                Profondeur: {node.depth || 'N/A'}
              </Typography>
            </Box>
          ))}
        </Paper>
      </Box>
    );
  };
  
  const renderRawJson = () => {
    return (
      <Box mt={2}>
        <pre 
          style={{ 
            backgroundColor: '#272822', 
            color: '#f8f8f2', 
            padding: '16px', 
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '14px',
            overflowX: 'auto',
            maxHeight: '600px',
            overflow: 'auto'
          }}
          className="dark:bg-gray-900 dark:text-gray-200"
        >
          {formatJSON(results)}
        </pre>
      </Box>
    );
  };
  
  const renderResultsSection = () => {
    if (!results) return null;
    
    return (
      <Box mt={4}>
        <Paper elevation={3} sx={{ p: 2 }} className="dark:bg-gray-800">
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" component="h2" className="dark:text-gray-200">
              Résultats du scan
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<BiDownload />}
              onClick={exportResults}
              className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Exporter
            </Button>
          </Box>
          
          <Divider sx={{ mb: 2 }} className="dark:bg-gray-600" />
          
          {renderResultsSummary()}
          
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" className="dark:text-gray-200">
            <Tab label="Vulnérabilités" className="dark:text-gray-300" />
            <Tab label="API Endpoints" className="dark:text-gray-300" />
            <Tab label="Carte du site" className="dark:text-gray-300" />
            <Tab label="JSON brut" className="dark:text-gray-300" />
          </Tabs>
          
          <Box sx={{ mt: 2 }}>
            {activeTab === 0 && renderVulnerabilities()}
            {activeTab === 1 && renderEndpoints()}
            {activeTab === 2 && renderSiteMap()}
            {activeTab === 3 && renderRawJson()}
          </Box>
        </Paper>
      </Box>
    );
  };
  
  return (
    <Box p={3} className="dark:bg-gray-900 dark:text-gray-200">
      <Typography variant="h4" component="h1" gutterBottom display="flex" alignItems="center" className="dark:text-gray-100">
        <FaGlobe style={{ marginRight: '10px' }} />
        HakBoard Crawler
      </Typography>
      
      <Typography variant="body1" paragraph className="dark:text-gray-300">
        Analysez les sites web pour détecter les vulnérabilités, cartographier la structure et extraire des informations utiles.
      </Typography>
      
      {error && (
        <Alert 
          severity={error.type === 'success' ? 'success' : error.type === 'info' ? 'info' : 'error'} 
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
          className="dark:bg-opacity-80"
        >
          {error.message || error}
        </Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }} className="dark:bg-gray-800">
        <Typography variant="h6" component="h2" gutterBottom className="dark:text-gray-200">
          Configuration du scan
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="URL cible"
              name="target"
              value={settings.target}
              onChange={handleChange}
              placeholder="exemple.com"
              variant="outlined"
              required
              helperText="Entrez l'URL à analyser (sans http/https)"
              className="dark:bg-gray-700 dark:text-gray-200"
              InputLabelProps={{ className: "dark:text-gray-300" }}
              InputProps={{ className: "dark:text-gray-200" }}
              FormHelperTextProps={{ className: "dark:text-gray-400" }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth variant="outlined" className="dark:bg-gray-700">
              <InputLabel id="mode-label" className="dark:text-gray-300">Mode</InputLabel>
              <Select
                labelId="mode-label"
                label="Mode"
                name="mode"
                value={settings.mode}
                onChange={handleChange}
                className="dark:text-gray-200"
              >
                <MenuItem value="normal" className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Normal</MenuItem>
                <MenuItem value="stealth" className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Furtif</MenuItem>
                <MenuItem value="aggressive" className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Agressif</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth variant="outlined" className="dark:bg-gray-700">
              <InputLabel id="userAgent-label" className="dark:text-gray-300">User-Agent</InputLabel>
              <Select
                labelId="userAgent-label"
                label="User-Agent"
                name="userAgent"
                value={settings.userAgent}
                onChange={handleChange}
                className="dark:text-gray-200"
              >
                <MenuItem value="random" className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Aléatoire</MenuItem>
                <MenuItem value="chrome" className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Chrome</MenuItem>
                <MenuItem value="firefox" className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Firefox</MenuItem>
                <MenuItem value="safari" className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Safari</MenuItem>
                <MenuItem value="mobile" className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Mobile</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Chemin du rapport"
              name="reportPath"
              value={settings.reportPath}
              onChange={handleChange}
              variant="outlined"
              placeholder="Laisser vide pour générer automatiquement"
              helperText="Optionnel: chemin pour le rapport (sans extension)"
              className="dark:bg-gray-700 dark:text-gray-200"
              InputLabelProps={{ className: "dark:text-gray-300" }}
              InputProps={{ className: "dark:text-gray-200" }}
              FormHelperTextProps={{ className: "dark:text-gray-400" }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom className="dark:text-gray-300">
              Profondeur d'analyse
            </Typography>
            <Slider
              value={settings.depth}
              onChange={handleSliderChange('depth')}
              aria-labelledby="depth-slider"
              step={1}
              marks={[
                { value: 1, label: '1' },
                { value: 2, label: '2' },
                { value: 3, label: '3' },
                { value: 4, label: '4' },
                { value: 5, label: '5' }
              ]}
              min={1}
              max={5}
              valueLabelDisplay="auto"
              className="dark:text-blue-400"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom className="dark:text-gray-300">
              Nombre de threads
            </Typography>
            <Slider
              value={settings.threads}
              onChange={handleSliderChange('threads')}
              aria-labelledby="threads-slider"
              step={1}
              marks={[
                { value: 1, label: '1' },
                { value: 5, label: '5' },
                { value: 10, label: '10' },
                { value: 15, label: '15' },
                { value: 20, label: '20' }
              ]}
              min={1}
              max={20}
              valueLabelDisplay="auto"
              className="dark:text-blue-400"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom className="dark:text-gray-300">
              Délai entre requêtes (secondes)
            </Typography>
            <Slider
              value={settings.delay}
              onChange={handleSliderChange('delay')}
              aria-labelledby="delay-slider"
              step={0.1}
              marks={[
                { value: 0, label: '0' },
                { value: 1, label: '1s' },
                { value: 2, label: '2s' },
                { value: 5, label: '5s' }
              ]}
              min={0}
              max={5}
              valueLabelDisplay="auto"
              className="dark:text-blue-400"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom className="dark:text-gray-300">
              Timeout (secondes)
            </Typography>
            <Slider
              value={settings.timeout}
              onChange={handleSliderChange('timeout')}
              aria-labelledby="timeout-slider"
              step={1}
              marks={[
                { value: 5, label: '5s' },
                { value: 10, label: '10s' },
                { value: 20, label: '20s' },
                { value: 30, label: '30s' }
              ]}
              min={5}
              max={30}
              valueLabelDisplay="auto"
              className="dark:text-blue-400"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box display="flex" flexDirection="column" gap={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.ignoreRobots}
                    onChange={handleChange}
                    name="ignoreRobots"
                    color="primary"
                  />
                }
                label={<span className="dark:text-gray-300">Ignorer robots.txt</span>}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.verboseMode}
                    onChange={handleChange}
                    name="verboseMode"
                    color="primary"
                  />
                }
                label={<span className="dark:text-gray-300">Mode verbeux</span>}
              />
            </Box>
          </Grid>
        </Grid>
        
        <Box mt={3} display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <BiScan />}
            onClick={runScan}
            disabled={loading || !settings.target}
            sx={{ minWidth: '150px' }}
            className="dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            {loading ? 'Analyse en cours...' : 'Lancer le scan'}
          </Button>
          {renderStatusIcon()}
        </Box>
      </Paper>
      
      {renderResultsSection()}
    </Box>
  );
};

export default HakBoardCrawler;
