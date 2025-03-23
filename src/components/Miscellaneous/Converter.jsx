import React, { useState, useRef } from 'react';
import { FiArrowRight, FiUpload, FiDownload, FiFile, FiCheck, FiAlertTriangle } from 'react-icons/fi';

const Converter = () => {
  const [sourceType, setSourceType] = useState('csv');
  const [targetType, setTargetType] = useState('json');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);
  
  // Options de types de fichiers supportés
  const fileTypes = [
    { value: 'csv', label: 'CSV', icon: '📊' },
    { value: 'json', label: 'JSON', icon: '📋' },
    { value: 'xml', label: 'XML', icon: '📝' },
    { value: 'yaml', label: 'YAML', icon: '📄' }
  ];
  
  // Filtrer les types de fichiers cibles (pour éviter de convertir vers le même format)
  const targetFileTypes = fileTypes.filter(type => type.value !== sourceType);
  
  // Gérer le changement de fichier
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
      setSuccess(false);
    }
  };
  
  // Gérer la conversion du fichier
  const handleConversion = async () => {
    if (!file) {
      setError("Veuillez sélectionner un fichier à convertir.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    setSuccess(false);
    
    try {
      // Lire le contenu du fichier
      const fileContent = await readFileContent(file);
      
      // Convertir le contenu selon les formats source et cible
      const convertedContent = await convertContent(fileContent, sourceType, targetType);
      
      // Définir le résultat
      setResult(convertedContent);
      setSuccess(true);
    } catch (err) {
      console.error('Erreur lors de la conversion:', err);
      setError(`Erreur de conversion: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour lire le contenu du fichier
  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          resolve(event.target.result);
        } catch (err) {
          reject(new Error(`Impossible de lire le fichier: ${err.message}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Erreur lors de la lecture du fichier'));
      };
      
      reader.readAsText(file);
    });
  };
  
  // Fonction pour convertir le contenu
  const convertContent = async (content, fromType, toType) => {
    try {
      // Conversion CSV -> JSON
      if (fromType === 'csv' && toType === 'json') {
        return csvToJson(content);
      }
      
      // Conversion JSON -> CSV
      if (fromType === 'json' && toType === 'csv') {
        return jsonToCsv(content);
      }
      
      // Conversion JSON -> XML
      if (fromType === 'json' && toType === 'xml') {
        return jsonToXml(content);
      }
      
      // Conversion XML -> JSON
      if (fromType === 'xml' && toType === 'json') {
        return xmlToJson(content);
      }
      
      // Conversion JSON -> YAML
      if (fromType === 'json' && toType === 'yaml') {
        return jsonToYaml(content);
      }
      
      // Conversion YAML -> JSON
      if (fromType === 'yaml' && toType === 'json') {
        return yamlToJson(content);
      }
      
      // Autres conversions à implémenter
      throw new Error(`La conversion de ${fromType} vers ${toType} n'est pas encore supportée.`);
    } catch (err) {
      throw new Error(`Erreur lors de la conversion: ${err.message}`);
    }
  };
  
  // Conversion CSV -> JSON
  const csvToJson = (csvContent) => {
    // Diviser par lignes
    const lines = csvContent.split('\n');
    // La première ligne contient les en-têtes
    const headers = lines[0].split(',').map(header => header.trim());
    
    // Convertir chaque ligne en objet JSON
    const jsonArray = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Ignorer les lignes vides
      
      const values = lines[i].split(',').map(value => value.trim());
      const obj = {};
      
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = values[j];
      }
      
      jsonArray.push(obj);
    }
    
    return JSON.stringify(jsonArray, null, 2);
  };
  
  // Conversion JSON -> CSV
  const jsonToCsv = (jsonContent) => {
    try {
      const json = JSON.parse(jsonContent);
      
      if (!Array.isArray(json) || json.length === 0) {
        throw new Error('Le JSON doit être un tableau d\'objets');
      }
      
      // Extraire les en-têtes (clés du premier objet)
      const headers = Object.keys(json[0]);
      
      // Créer la ligne d'en-tête
      let csv = headers.join(',') + '\n';
      
      // Ajouter chaque ligne de données
      json.forEach(item => {
        const values = headers.map(header => {
          // Échapper les valeurs contenant des virgules
          const value = item[header] === null || item[header] === undefined ? '' : item[header];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        });
        csv += values.join(',') + '\n';
      });
      
      return csv;
    } catch (err) {
      throw new Error(`Erreur de conversion JSON vers CSV: ${err.message}`);
    }
  };
  
  // Conversion JSON -> XML
  const jsonToXml = (jsonContent) => {
    try {
      const json = JSON.parse(jsonContent);
      
      // Fonction récursive pour convertir un objet en XML
      const convertToXml = (obj, nodeName) => {
        if (obj === null || obj === undefined) {
          return `<${nodeName}></${nodeName}>`;
        }
        
        if (typeof obj !== 'object') {
          return `<${nodeName}>${obj}</${nodeName}>`;
        }
        
        if (Array.isArray(obj)) {
          return obj.map(item => convertToXml(item, 'item')).join('');
        }
        
        let xml = `<${nodeName}>`;
        
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            xml += convertToXml(obj[key], key);
          }
        }
        
        xml += `</${nodeName}>`;
        return xml;
      };
      
      return '<?xml version="1.0" encoding="UTF-8" ?>\n' + convertToXml(json, 'root');
    } catch (err) {
      throw new Error(`Erreur de conversion JSON vers XML: ${err.message}`);
    }
  };
  
  // Conversion XML -> JSON
  const xmlToJson = (xmlContent) => {
    try {
      // Implémentation simple de conversion XML vers JSON
      // Note: Une implémentation complète nécessiterait un parser XML
      const jsonObj = { root: {} };
      
      // Extraire les balises et leur contenu
      const tagRegex = /<(\w+)>(.*?)<\/\1>/g;
      let match;
      
      while ((match = tagRegex.exec(xmlContent)) !== null) {
        const tagName = match[1];
        const content = match[2];
        
        // Vérifier si le contenu est numérique
        const isNumeric = !isNaN(content);
        jsonObj.root[tagName] = isNumeric ? Number(content) : content;
      }
      
      return JSON.stringify(jsonObj, null, 2);
    } catch (err) {
      throw new Error(`Erreur de conversion XML vers JSON: ${err.message}`);
    }
  };
  
  // Conversion JSON -> YAML
  const jsonToYaml = (jsonContent) => {
    try {
      const json = JSON.parse(jsonContent);
      
      // Fonction récursive pour convertir un objet en YAML
      const convertToYaml = (obj, indent = 0) => {
        const spaces = ' '.repeat(indent);
        let yaml = '';
        
        if (Array.isArray(obj)) {
          if (obj.length === 0) return spaces + '[]';
          
          for (const item of obj) {
            yaml += spaces + '- ';
            
            if (typeof item === 'object' && item !== null) {
              yaml += '\n' + convertToYaml(item, indent + 2);
            } else {
              yaml += formatScalarValue(item) + '\n';
            }
          }
        } else {
          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              const value = obj[key];
              
              yaml += spaces + key + ': ';
              
              if (typeof value === 'object' && value !== null) {
                yaml += '\n' + convertToYaml(value, indent + 2);
              } else {
                yaml += formatScalarValue(value) + '\n';
              }
            }
          }
        }
        
        return yaml;
      };
      
      // Formater les valeurs scalaires pour YAML
      const formatScalarValue = (value) => {
        if (typeof value === 'string') {
          // Échapper les chaînes nécessitant des guillemets
          if (value.includes('\n') || value.includes(':') || value.includes('#')) {
            return `"${value.replace(/"/g, '\\"')}"`;
          }
          return value;
        }
        
        if (value === null) return 'null';
        return String(value);
      };
      
      return convertToYaml(json);
    } catch (err) {
      throw new Error(`Erreur de conversion JSON vers YAML: ${err.message}`);
    }
  };
  
  // Conversion YAML -> JSON
  const yamlToJson = (yamlContent) => {
    try {
      // Implémentation simple de conversion YAML vers JSON
      // Note: Une implémentation complète nécessiterait un parser YAML
      const lines = yamlContent.split('\n');
      const jsonObj = {};
      
      for (const line of lines) {
        if (!line.trim() || line.trim().startsWith('#')) continue;
        
        const parts = line.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join(':').trim();
          
          // Convertir les valeurs numériques
          if (!isNaN(value)) {
            jsonObj[key] = Number(value);
          } else if (value === 'true') {
            jsonObj[key] = true;
          } else if (value === 'false') {
            jsonObj[key] = false;
          } else {
            jsonObj[key] = value;
          }
        }
      }
      
      return JSON.stringify(jsonObj, null, 2);
    } catch (err) {
      throw new Error(`Erreur de conversion YAML vers JSON: ${err.message}`);
    }
  };
  
  // Télécharger le résultat
  const downloadResult = () => {
    if (!result) return;
    
    const fileName = `converted-file.${targetType}`;
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-indigo-600 dark:text-indigo-400">
        Convertisseur de Fichiers
      </h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center mb-6">
          {/* Sélection du type source */}
          <div className="mb-4 md:mb-0 md:mr-4 flex-1">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Format source
            </label>
            <div className="relative">
              <select
                value={sourceType}
                onChange={(e) => {
                  setSourceType(e.target.value);
                  setFile(null);
                  setResult(null);
                  setError(null);
                  setSuccess(false);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="block appearance-none w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              >
                {fileTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>
          
          {/* Flèche de conversion */}
          <div className="hidden md:flex items-center justify-center md:mx-4">
            <FiArrowRight className="text-indigo-500 text-2xl" />
          </div>
          
          {/* Sélection du type cible */}
          <div className="mb-4 md:mb-0 flex-1">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Format cible
            </label>
            <div className="relative">
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                className="block appearance-none w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              >
                {targetFileTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Zone de téléchargement de fichier */}
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
            Fichier à convertir
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <FiFile className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600 dark:text-gray-400">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus-within:outline-none"
                >
                  <span className="px-2">Sélectionner un fichier</span>
                  <input 
                    id="file-upload" 
                    name="file-upload" 
                    type="file" 
                    className="sr-only"
                    accept={`.${sourceType}`}
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                </label>
                <p className="pl-1">ou glisser-déposer</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Fichier {sourceType.toUpperCase()} jusqu'à 10MB
              </p>
              
              {file && (
                <div className="mt-2 text-sm text-indigo-600 dark:text-indigo-400">
                  Fichier sélectionné: {file.name}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Bouton de conversion */}
        <div className="flex justify-center">
          <button
            onClick={handleConversion}
            disabled={!file || loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Conversion en cours...
              </>
            ) : (
              <>
                Convertir <FiArrowRight className="ml-2" />
              </>
            )}
          </button>
        </div>
        
        {/* Messages d'erreur */}
        {error && (
          <div className="mt-4 bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded">
            <p className="flex items-center">
              <FiAlertTriangle className="mr-2" />
              {error}
            </p>
          </div>
        )}
        
        {/* Message de succès */}
        {success && (
          <div className="mt-4 bg-green-100 dark:bg-green-900/20 border-l-4 border-green-500 text-green-700 dark:text-green-400 p-4 rounded">
            <p className="flex items-center">
              <FiCheck className="mr-2" />
              Conversion réussie !
            </p>
          </div>
        )}
      </div>
      
      {/* Résultat de la conversion */}
      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Résultat</h2>
            <button
              onClick={downloadResult}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center"
            >
              <FiDownload className="mr-2" /> Télécharger
            </button>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 overflow-auto max-h-64">
            <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {result}
            </pre>
          </div>
        </div>
      )}
      
      {/* Informations sur l'utilisation */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 p-4 rounded">
        <h3 className="font-bold mb-2">Conversions supportées :</h3>
        <ul className="list-disc list-inside">
          <li>CSV → JSON</li>
          <li>JSON → CSV</li>
          <li>JSON → XML</li>
          <li>XML → JSON</li>
          <li>JSON → YAML</li>
          <li>YAML → JSON</li>
        </ul>
        <p className="mt-2 text-sm">
          Note: Les conversions XML et YAML sont des implémentations simples. Pour des fichiers complexes, des résultats optimaux ne sont pas garantis.
        </p>
      </div>
    </div>
  );
};

export default Converter; 