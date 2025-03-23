import React, { useState } from 'react';
import { FiCreditCard, FiPlay, FiInfo, FiAlertCircle, FiCopy } from 'react-icons/fi';
const ccgen = require('creditcard-generator');
const cc = require('creditcardutils');

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

const CcGenerator = () => {
  const [cardType, setCardType] = useState('visa');
  const [customBin, setCustomBin] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [withCvv, setWithCvv] = useState(true);
  const [withExpiry, setWithExpiry] = useState(true);
  const [generatedCards, setGeneratedCards] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [useCustomBin, setUseCustomBin] = useState(false);

  const generateCards = () => {
    if (quantity <= 0 || quantity > 100) {
      setError('La quantité doit être comprise entre 1 et 100');
      return;
    }

    if (useCustomBin && (!customBin || customBin.length < 4)) {
      setError('Le BIN personnalisé doit contenir au moins 4 chiffres');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);
    setGeneratedCards([]);

    try {
      // Créer un délai artificiel pour simuler le traitement
      setTimeout(() => {
        try {
          const cards = [];
          for (let i = 0; i < quantity; i++) {
            const cardNumber = generateCardNumber();
            const card = {
              number: cardNumber,
              cvv: withCvv ? generateCvv(cardType === 'amex') : '',
              expiry: withExpiry ? generateExpiry() : '',
              isValid: luhnCheck(cardNumber)
            };
            cards.push(card);
          }
          setGeneratedCards(cards);
        } catch (err) {
          console.error("Erreur lors de la génération:", err);
          setError(`Erreur lors de la génération: ${err.message}`);
        } finally {
          setIsGenerating(false);
        }
      }, 500);
    } catch (err) {
      console.error("Erreur:", err);
      setError(`Erreur: ${err.message}`);
      setIsGenerating(false);
    }
  };

  const generateCardNumber = () => {
    let generatedNumber;

    try {
      if (useCustomBin && customBin) {
        // Utiliser le BIN personnalisé
        generatedNumber = ccgen.GenCC(customBin)[0];
      } else {
        // Utiliser un type de carte prédéfini
        switch (cardType) {
          case 'visa':
            generatedNumber = ccgen.GenCC("4")[0]; // Visa commence par 4
            break;
          case 'mastercard':
            // MasterCard commence par 51-55
            const mcPrefixes = ["51", "52", "53", "54", "55"];
            const randomPrefix = mcPrefixes[Math.floor(Math.random() * mcPrefixes.length)];
            generatedNumber = ccgen.GenCC(randomPrefix)[0];
            break;
          case 'amex':
            // American Express commence par 34 ou 37
            const amexPrefixes = ["34", "37"];
            const randomAmexPrefix = amexPrefixes[Math.floor(Math.random() * amexPrefixes.length)];
            generatedNumber = ccgen.GenCC(randomAmexPrefix)[0];
            break;
          case 'discover':
            generatedNumber = ccgen.GenCC("6011")[0]; // Discover commence par 6011
            break;
          default:
            generatedNumber = ccgen.GenCC("4")[0]; // Par défaut, générer un Visa
        }
      }

      return generatedNumber;
    } catch (err) {
      console.error("Erreur lors de la génération du numéro:", err);
      throw new Error(`Impossible de générer un numéro: ${err.message}`);
    }
  };

  const generateCvv = (isAmex = false) => {
    // American Express a un CVV à 4 chiffres, les autres cartes ont un CVV à 3 chiffres
    const length = isAmex ? 4 : 3;
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
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
              AVERTISSEMENT: Ces numéros sont générés selon l'algorithme de Luhn et valides pour les tests, mais ne sont pas de vraies cartes bancaires. 
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
        
        <div className="mb-4">
          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              id="use-custom-bin"
              checked={useCustomBin}
              onChange={(e) => setUseCustomBin(e.target.checked)}
              disabled={isGenerating}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="use-custom-bin" className="text-gray-700 dark:text-gray-300">
              Utiliser un BIN personnalisé
            </label>
          </div>
          
          {useCustomBin ? (
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                BIN personnalisé (4-8 chiffres)
              </label>
              <input
                type="text"
                value={customBin}
                onChange={(e) => {
                  // Autoriser uniquement les chiffres
                  const value = e.target.value.replace(/\D/g, '');
                  setCustomBin(value);
                }}
                maxLength={8}
                placeholder="ex: 451234"
                disabled={isGenerating}
                className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Entrez les premiers chiffres de la carte (BIN). Le reste sera généré automatiquement.
              </p>
            </div>
          ) : (
            <div className="mb-4">
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
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                    <div>
                      <div className="font-medium">{card.number}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex space-x-4">
                        {card.cvv && <span>CVV: {card.cvv}</span>}
                        {card.expiry && <span>Date: {card.expiry}</span>}
                        <span className={card.isValid ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                          {card.isValid ? "✓ Luhn valide" : "✗ Luhn invalide"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`${card.number}${card.cvv ? ' | ' + card.cvv : ''}${card.expiry ? ' | ' + card.expiry : ''}`)}
                    className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
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