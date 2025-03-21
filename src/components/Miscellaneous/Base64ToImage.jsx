import React, { useState } from 'react';
import { FiImage, FiCode, FiCopy, FiDownload, FiAlertCircle, FiCheckCircle, FiRotateCw } from 'react-icons/fi';

const Base64ToImage = () => {
  const [base64Input, setBase64Input] = useState('');
  const [imageData, setImageData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [prefix, setPrefix] = useState('data:image/jpeg;base64,');
  const [isConverting, setIsConverting] = useState(false);

  const handleConversion = () => {
    if (!base64Input.trim()) {
      setError('Veuillez entrer un code Base64');
      setImageData(null);
      setSuccess('');
      return;
    }

    setIsConverting(true);
    setError('');
    setSuccess('');

    try {
      // Si le code contient déjà un préfixe, on l'utilise tel quel
      let finalBase64;
      if (base64Input.startsWith('data:image')) {
        finalBase64 = base64Input;
        
        // Détecter le type d'image depuis le préfixe existant
        const prefixMatch = base64Input.match(/data:image\/[^;]+;base64,/);
        if (prefixMatch && prefixMatch[0]) {
          setPrefix(prefixMatch[0]);
        }
      } else {
        // Sinon, on ajoute le préfixe sélectionné
        finalBase64 = `${prefix}${base64Input}`;
      }

      setImageData(finalBase64);
      setSuccess('Image générée avec succès');
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
      setError('Le code Base64 fourni est invalide ou corrompu');
      setImageData(null);
    } finally {
      setIsConverting(false);
    }
  };

  const handlePrefixChange = (e) => {
    setPrefix(e.target.value);
  };

  const downloadImage = async () => {
    if (!imageData) {
      setError('Aucune image disponible à télécharger');
      return;
    }

    try {
      // Demander à l'utilisateur où sauvegarder l'image
      const fileExtension = prefix.includes('png') ? 'png' : 
                            prefix.includes('gif') ? 'gif' : 
                            prefix.includes('webp') ? 'webp' : 'jpg';
      
      const options = {
        title: 'Enregistrer l\'image',
        defaultPath: `image_convertie.${fileExtension}`,
        filters: [
          { name: 'Images', extensions: [fileExtension] }
        ]
      };

      const result = await window.electronAPI.showSaveFileDialog(options);
      
      if (!result || !result.filePath) {
        // L'utilisateur a annulé
        return;
      }

      // Créer un fichier HTML avec l'image pour le téléchargement
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Image Base64</title>
  <style>
    body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
    img { max-width: 100%; max-height: 100vh; }
  </style>
</head>
<body>
  <img src="${imageData}" alt="Image convertie">
  <script>
    // Télécharger automatiquement l'image
    const img = document.querySelector('img');
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = 'image.${fileExtension}';
      link.href = canvas.toDataURL('${prefix.split(';')[0]}');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  </script>
</body>
</html>`;

      await window.electronAPI.writeFile(result.filePath, htmlContent);
      setSuccess(`Image sauvegardée avec succès à ${result.filePath}.html`);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      setError(`Erreur lors de la sauvegarde: ${error.message || 'Erreur inconnue'}`);
    }
  };

  const copyToClipboard = async () => {
    if (!imageData) {
      setError('Aucune image disponible à copier');
      return;
    }

    try {
      // Créer une image temporaire pour la copier
      const tempImg = new Image();
      tempImg.src = imageData;
      tempImg.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = tempImg.naturalWidth;
        canvas.height = tempImg.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(tempImg, 0, 0);
        
        canvas.toBlob(async (blob) => {
          try {
            // Utiliser l'API du Presse-papiers pour copier l'image
            const clipboardData = new ClipboardItem({
              [blob.type]: blob
            });
            await navigator.clipboard.write([clipboardData]);
            setSuccess('Image copiée dans le presse-papiers');
          } catch (err) {
            console.error('Erreur lors de la copie:', err);
            setError('Impossible de copier l\'image dans le presse-papiers');
          }
        });
      };
      
      tempImg.onerror = () => {
        setError('Impossible de charger l\'image pour la copie');
      };
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      setError('Impossible de copier l\'image dans le presse-papiers');
    }
  };

  const resetForm = () => {
    setBase64Input('');
    setImageData(null);
    setError('');
    setSuccess('');
    setPrefix('data:image/jpeg;base64,');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-indigo-600 dark:text-indigo-400">
        Convertisseur Base64 vers Image
      </h1>
      
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-8">
        <div className="mb-6">
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="imageType">
              Type d'image
            </label>
            <select
              id="imageType"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              value={prefix}
              onChange={handlePrefixChange}
            >
              <option value="data:image/jpeg;base64,">JPEG</option>
              <option value="data:image/png;base64,">PNG</option>
              <option value="data:image/gif;base64,">GIF</option>
              <option value="data:image/webp;base64,">WEBP</option>
              <option value="data:image/svg+xml;base64,">SVG</option>
            </select>
          </div>
          
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="base64Input">
            Code Base64
          </label>
          <textarea
            id="base64Input"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white h-40"
            placeholder="Collez votre code Base64 ici..."
            value={base64Input}
            onChange={(e) => setBase64Input(e.target.value)}
          />
          
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={handleConversion}
              disabled={isConverting || !base64Input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
            >
              {isConverting ? <FiRotateCw className="animate-spin mr-2" /> : <FiImage className="mr-2" />}
              {isConverting ? 'Conversion...' : 'Convertir'}
            </button>
            
            <button
              onClick={resetForm}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-md flex items-start">
          <FiAlertCircle className="mt-1 mr-2" />
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded shadow-md flex items-start">
          <FiCheckCircle className="mt-1 mr-2" />
          <p>{success}</p>
        </div>
      )}
      
      {imageData && (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Image convertie
          </h3>
          
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg inline-block mb-6">
            <img 
              src={imageData} 
              alt="Image convertie du Base64" 
              className="max-w-full h-auto max-h-96"
              style={{ 
                maxWidth: '100%',
                height: 'auto',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            />
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={downloadImage}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <FiDownload className="mr-2" /> Télécharger
            </button>
            
            <button
              onClick={copyToClipboard}
              className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <FiCopy className="mr-2" /> Copier
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Base64ToImage; 