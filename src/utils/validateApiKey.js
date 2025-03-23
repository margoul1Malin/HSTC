/**
 * Valide une clé API SendGrid en vérifiant son format
 * @param {string} apiKey - La clé API à valider
 * @returns {boolean} - true si la clé semble valide, false sinon
 */
const validateApiKey = (apiKey) => {
  // Vérifier si la clé API est définie et a une longueur minimale
  if (!apiKey || apiKey.trim().length < 20) {
    return false;
  }
  
  // Vérifier si la clé API a un format valide pour SendGrid (SG.)
  if (apiKey.startsWith('SG.') && apiKey.length > 50) {
    return true;
  }
  
  // Vérifier si c'est un format générique de clé API
  const hasValidFormat = /^[A-Za-z0-9\-_.]{20,}$/.test(apiKey);
  
  return hasValidFormat;
};

export default validateApiKey; 