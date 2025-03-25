import React, { useState, useRef } from 'react';
import { FiLink, FiDownload, FiCopy, FiImage, FiFileText, FiCode } from 'react-icons/fi';

const QRCodeGenerator = () => {
  const [url, setUrl] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [size, setSize] = useState(300);
  const [darkColor, setDarkColor] = useState('#000000');
  const [lightColor, setLightColor] = useState('#ffffff');
  const [margin, setMargin] = useState(4);
  const [format, setFormat] = useState('png');
  const [successMessage, setSuccessMessage] = useState('');
  const qrCodeRef = useRef(null);
  const [formattedUrl, setFormattedUrl] = useState('');

  const generateQRCode = async () => {
    if (!url) {
      setErrorMessage('Veuillez entrer une URL');
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMessage('');
      setSuccessMessage('');

      // S'assurer que l'URL a le format correct
      let urlToUse = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        urlToUse = 'https://' + url;
      }
      
      // Stocker l'URL formatée dans l'état
      setFormattedUrl(urlToUse);

      const isWindows = window.electronAPI && window.electronAPI.platform === 'win32';
      console.log('[QRCodeGenerator] Plateforme détectée:', isWindows ? 'Windows' : 'Linux');

      // Construire la commande à exécuter avec l'URL correctement formatée
      let command;
      if (isWindows) {
        // Commande Windows pour générer le QR code
        command = `cd src && node -e "const qrcode = require('qrcode'); qrcode.toDataURL('${urlToUse}', {
          width: ${size},
          margin: ${margin},
          color: {
            dark: '${darkColor}',
            light: '${lightColor}'
          }
        }, (err, url) => { if(err) { console.error(err); process.exit(1); } else { console.log(url); } });"`;
        console.log('[QRCodeGenerator] Commande Windows utilisée:', command);
      } else {
        // Commande Linux pour générer le QR code
        command = `cd src && node -e "const qrcode = require('qrcode'); qrcode.toDataURL('${urlToUse}', {
          width: ${size},
          margin: ${margin},
          color: {
            dark: '${darkColor}',
            light: '${lightColor}'
          }
        }, (err, url) => { if(err) { console.error(err); process.exit(1); } else { console.log(url); } });"`;
        console.log('[QRCodeGenerator] Commande Linux utilisée:', command);
      }

      if (window.electronAPI && window.electronAPI.executeCommand) {
        const result = await window.electronAPI.executeCommand(command);
        
        if (result && result.stdout) {
          setQrCodeImage(result.stdout.trim());
          setSuccessMessage('QR Code généré avec succès! URL: ' + urlToUse);
          setUrl(urlToUse); // Mettre à jour l'URL avec le format corrigé
        } else if (result && result.stderr) {
          setErrorMessage(`Erreur: ${result.stderr}`);
        }
      } else {
        setErrorMessage('API Electron non disponible');
      }
    } catch (error) {
      setErrorMessage(`Erreur lors de la génération du QR Code: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToFile = async (fileType) => {
    if (!qrCodeImage) {
      setErrorMessage('Veuillez d\'abord générer un QR Code');
      return;
    }

    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Ouvrir d'abord la boîte de dialogue pour obtenir le chemin de sauvegarde
      let defaultFileName = `qrcode_${new Date().getTime()}`;
      let fileExtension = '';
      
      switch (fileType) {
        case 'png':
          fileExtension = 'png';
          break;
        case 'html':
          fileExtension = 'html';
          break;
        case 'pdf':
          fileExtension = 'pdf';
          break;
        default:
          throw new Error('Format de fichier non pris en charge');
      }
      
      defaultFileName += '.' + fileExtension;
      
      // Ouvrir la boîte de dialogue pour sauvegarder le fichier
      const options = {
        title: 'Enregistrer le QR Code',
        defaultPath: defaultFileName,
        filters: [{ name: fileType.toUpperCase(), extensions: [fileExtension] }]
      };

      const result = await window.electronAPI.showSaveFileDialog(options);
      
      if (!result || !result.filePath) {
        // L'utilisateur a annulé
        return;
      }
      
      // S'assurer que le chemin est une chaîne
      const savePath = result.filePath;
      
      // Maintenant, préparer le contenu selon le type de fichier
      switch (fileType) {
        case 'png':
          // Pour l'export PNG, utiliser une solution qui ne nécessite pas Buffer
          // Nous allons écrire directement la chaîne base64 dans un fichier HTML temporaire
          // puis demander à l'utilisateur de l'enregistrer comme image
          
          const pngExportHtml = `<!DOCTYPE html>
<html>
<head>
  <title>QR Code Export</title>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
    img { max-width: 100%; }
    .instructions { position: fixed; top: 10px; left: 0; right: 0; background: #f0f0f0; padding: 10px; text-align: center; }
  </style>
  <script>
    // Cette fonction permet de télécharger l'image au chargement de la page
    window.onload = function() {
      // Créer un lien de téléchargement
      var link = document.createElement('a');
      link.download = 'qrcode.png';
      link.href = document.getElementById('qr-img').src;
      
      // Simule un clic sur le lien pour déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Afficher un message
      document.getElementById('message').textContent = 'Téléchargement automatique démarré. Si ça ne fonctionne pas, faites un clic droit sur l\\'image et sélectionnez "Enregistrer l\\'image sous..."';
    };
  </script>
</head>
<body>
  <div class="instructions" id="message">Téléchargement en cours...</div>
  <img id="qr-img" src="${qrCodeImage}" alt="QR Code pour ${url}">
</body>
</html>`;
          
          // Écrire le fichier HTML temporaire pour l'export PNG
          await window.electronAPI.writeFile(savePath, pngExportHtml);
          setSuccessMessage(`Page HTML d'export créée. Ouvrez-la et l'image sera automatiquement téléchargée.`);
          return;
          
        case 'html':
          // Contenu HTML simplifié avec l'URL correcte
          const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>QR Code pour ${url}</title>
  <meta charset="utf-8">
</head>
<body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f0f0;">
  <div style="text-align: center; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
    <h2 style="margin-bottom: 20px; color: #333;">QR Code pour:</h2>
    <p style="margin-bottom: 20px; word-break: break-all; color: #666;">${url}</p>
    <img src="${qrCodeImage}" alt="QR Code" style="max-width: 100%; border: 1px solid #eee;">
    <p style="margin-top: 20px; font-size: 12px; color: #999;">Généré le ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`;
          
          // Écrire le fichier HTML
          await window.electronAPI.writeFile(savePath, htmlContent);
          break;
          
        case 'pdf':
          // Alternative simplifiée pour le PDF sans dépendance externe
          // On va créer un fichier HTML avec des instructions pour imprimer en PDF
          
          const pdfAlternativeHtml = `<!DOCTYPE html>
<html>
<head>
  <title>QR Code pour ${url}</title>
  <meta charset="utf-8">
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      font-family: Arial, sans-serif;
    }
    .container {
      text-align: center;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    img {
      max-width: 90%;
      height: auto;
      margin: 20px 0;
    }
    h2 {
      margin-bottom: 20px;
    }
    .url {
      margin-bottom: 20px;
      word-break: break-all;
      color: #666;
    }
    .footer {
      margin-top: 20px;
      font-size: 12px;
      color: #999;
    }
    .instructions {
      margin-top: 30px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 5px;
      text-align: left;
    }
    .instructions ol {
      margin-top: 10px;
      padding-left: 20px;
    }
    @media print {
      .instructions {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>QR Code pour:</h2>
    <div class="url">${url}</div>
    <img src="${qrCodeImage}" alt="QR Code">
    <div class="footer">Généré le ${new Date().toLocaleString()}</div>
    
    <div class="instructions">
      <h3>Pour créer un PDF:</h3>
      <ol>
        <li>Appuyez sur Ctrl+P (ou Cmd+P sur Mac)</li>
        <li>Sélectionnez "Enregistrer en PDF" comme destination</li>
        <li>Cliquez sur "Enregistrer"</li>
      </ol>
      <p><strong>Note:</strong> Ces instructions ne seront pas incluses dans le PDF.</p>
    </div>
  </div>
</body>
</html>`;
          
          // Écrire le fichier HTML alternatif pour PDF
          await window.electronAPI.writeFile(savePath, pdfAlternativeHtml);
          
          // Informer l'utilisateur sur la procédure
          setSuccessMessage(`Fichier HTML de prévisualisation enregistré. Ouvrez-le dans un navigateur puis imprimez-le en PDF (Ctrl+P).`);
          return;
          
        default:
          throw new Error('Format de fichier non pris en charge');
      }
      
      setSuccessMessage(`QR Code exporté avec succès en ${fileExtension.toUpperCase()}`);
    } catch (error) {
      setErrorMessage(`Erreur lors de l'exportation: ${error.message || 'Erreur inconnue'}`);
      console.error('Erreur détaillée:', error);
    }
  };

  const copyToClipboard = async () => {
    if (!qrCodeImage) {
      setErrorMessage('Veuillez d\'abord générer un QR Code');
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setSuccessMessage('URL copiée dans le presse-papiers');
    } catch (error) {
      setErrorMessage(`Erreur lors de la copie: ${error.message || 'Erreur inconnue'}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-indigo-600 dark:text-indigo-400">
        Générateur de QR Code
      </h1>
      
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-8">
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="url">
            URL ou texte à encoder
          </label>
          <div className="flex">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FiLink className="text-gray-500" />
              </span>
              <input
                type="text"
                id="url"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="https://exemple.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <button
              onClick={generateQRCode}
              disabled={isGenerating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-r-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isGenerating ? 'Génération...' : 'Générer'}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Taille (px)
            </label>
            <input
              type="range"
              min="100"
              max="1000"
              step="10"
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="text-center text-gray-600 dark:text-gray-400 mt-1">{size}px</div>
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Marge
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={margin}
              onChange={(e) => setMargin(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="text-center text-gray-600 dark:text-gray-400 mt-1">{margin}</div>
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Couleur principale
            </label>
            <input
              type="color"
              value={darkColor}
              onChange={(e) => setDarkColor(e.target.value)}
              className="h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Couleur de fond
            </label>
            <input
              type="color"
              value={lightColor}
              onChange={(e) => setLightColor(e.target.value)}
              className="h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
          </div>
        </div>
      </div>
      
      {errorMessage && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-md">
          <p>{errorMessage}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded shadow-md">
          <p>{successMessage}</p>
        </div>
      )}
      
      {qrCodeImage && (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Votre QR Code
          </h3>
          
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg inline-block mb-6">
            <img 
              ref={qrCodeRef}
              src={qrCodeImage} 
              alt="QR Code" 
              className="max-w-full h-auto"
              style={{ 
                maxWidth: '100%',
                height: 'auto',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            />
          </div>
          
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded shadow-md">
            <p>Pour enregistrer ce QR code en tant qu'image, vous pouvez simplement faire une capture d'écran.</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => exportToFile('pdf')}
              className="flex items-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <FiFileText className="mr-2" /> PDF
            </button>
            <button
              onClick={() => exportToFile('html')}
              className="flex items-center bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <FiCode className="mr-2" /> HTML
            </button>
            <button
              onClick={copyToClipboard}
              className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <FiCopy className="mr-2" /> Copier l'URL
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;
