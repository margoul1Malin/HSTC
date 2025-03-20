import React, { useState } from 'react';
import { FiCreditCard, FiPlay, FiInfo, FiAlertCircle, FiCopy } from 'react-icons/fi';

const CcGenerator = () => {
  const [cardType, setCardType] = useState('visa');
  const [quantity, setQuantity] = useState(10);
  const [withCvv, setWithCvv] = useState(true);
  const [withExpiry, setWithExpiry] = useState(true);
  const [generatedCards, setGeneratedCards] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const generateCards = () => {
    if (quantity <= 0 || quantity > 100) {
      setError('La quantité doit être comprise entre 1 et 100');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);
    setGeneratedCards([]);

    // Simuler la génération des cartes
    setTimeout(() => {
      const cards = [];
      for (let i = 0; i < quantity; i++) {
        const card = {
          number: generateCardNumber(cardType),
          cvv: withCvv ? generateCvv() : '',
          expiry: withExpiry ? generateExpiry() : ''
        };
        cards.push(card);
      }
      setGeneratedCards(cards);
      setIsGenerating(false);
    }, 1000);
  };

  const generateCardNumber = (type) => {
    let prefix = '4';
    let length = 16;
    
    switch (type) {
      case 'visa':
        prefix = '4';
        length = 16;
        break;
      case 'mastercard':
        prefix = '5';
        length = 16;
        break;
      case 'amex':
        prefix = '3';
        length = 15;
        break;
      case 'discover':
        prefix = '6';
        length = 16;
        break;
      default:
        prefix = '4';
        length = 16;
    }
    
    // Ceci est une simulation - dans une implémentation réelle,
    // nous devrions générer des numéros valides selon l'algorithme de Luhn
    return `${prefix}${'x'.repeat(length - 1)}`.replace(/x/g, () => Math.floor(Math.random() * 10));
  };

  const generateCvv = () => {
    return Math.floor(100 + Math.random() * 900).toString();
  };

  const generateExpiry = () => {
    const currentYear = new Date().getFullYear();
    const month = Math.floor(1 + Math.random() * 12).toString().padStart(2, '0');
    const year = (currentYear + Math.floor(Math.random() * 5)).toString().substr(2);
    return `${month}/${year}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setSuccessMessage('Copié dans le presse-papiers!');
        setTimeout(() => setSuccessMessage(null), 2000);
      },
      (err) => {
        setError('Impossible de copier: ' + err);
      }
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Générateur de CC</h1>

      {/* Description */}
      <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-md mb-6">
        <div className="flex items-start">
          <FiInfo className="mr-2 mt-1 text-blue-500" size={20} />
          <p className="text-blue-800 dark:text-blue-200">
            Un outil pour générer des numéros de cartes de crédit à des fins d'éducation et de test uniquement.
            <br />
            <span className="text-sm font-semibold mt-2 block">
              AVERTISSEMENT: Ces numéros sont générés aléatoirement et ne sont pas de vraies cartes de crédit. 
              N'utilisez jamais cet outil à des fins frauduleuses.
            </span>
          </p>
        </div>
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 mb-6 rounded">
          <div className="flex items-center">
            <FiAlertCircle className="mr-2" size={20} />
            <p>{error}</p>
          </div>
          <button 
            onClick={() => setError(null)} 
            className="text-sm underline mt-2"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Message de succès */}
      {successMessage && (
        <div className="bg-green-100 dark:bg-green-900 border-l-4 border-green-500 text-green-700 dark:text-green-200 p-4 mb-6 rounded">
          <p>{successMessage}</p>
        </div>
      )}

      {/* Formulaire de génération */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Paramètres</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Type de carte
            </label>
            <select
              value={cardType}
              onChange={(e) => setCardType(e.target.value)}
              disabled={isGenerating}
              className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="visa">Visa</option>
              <option value="mastercard">Mastercard</option>
              <option value="amex">American Express</option>
              <option value="discover">Discover</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Quantité
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              disabled={isGenerating}
              min="1"
              max="100"
              className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
        
        <div className="mb-4 flex flex-wrap gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="with-cvv"
              checked={withCvv}
              onChange={(e) => setWithCvv(e.target.checked)}
              disabled={isGenerating}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="with-cvv" className="text-gray-700 dark:text-gray-300">
              Générer CVV
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="with-expiry"
              checked={withExpiry}
              onChange={(e) => setWithExpiry(e.target.checked)}
              disabled={isGenerating}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="with-expiry" className="text-gray-700 dark:text-gray-300">
              Générer date d'expiration
            </label>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={generateCards}
            disabled={isGenerating}
            className={`flex items-center px-4 py-2 rounded-md font-medium ${
              isGenerating
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <FiPlay className="mr-2" />
            {isGenerating ? 'Génération en cours...' : 'Générer les cartes'}
          </button>
        </div>
      </div>
      
      {/* Résultats */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Cartes générées</h2>
        
        {generatedCards.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => copyToClipboard(generatedCards.map(card => 
                `${card.number}${card.cvv ? ' | ' + card.cvv : ''}${card.expiry ? ' | ' + card.expiry : ''}`
              ).join('\n'))}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <FiCopy className="mr-2" />
              Copier tout
            </button>
          </div>
        )}
        
        <div className="overflow-y-auto max-h-96 border rounded-md p-4 bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
          {generatedCards.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 italic">Les cartes générées s'afficheront ici...</p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {generatedCards.map((card, index) => (
                <div 
                  key={index} 
                  className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <FiCreditCard className="mr-2 text-gray-500" />
                    <span className="font-mono">
                      {card.number}
                      {card.cvv && <span className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">CVV: {card.cvv}</span>}
                      {card.expiry && <span className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">EXP: {card.expiry}</span>}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`${card.number}${card.cvv ? ' | ' + card.cvv : ''}${card.expiry ? ' | ' + card.expiry : ''}`)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Copier"
                  >
                    <FiCopy />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CcGenerator; 