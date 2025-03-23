import React, { useState } from 'react';
import { FiX, FiEdit, FiTarget, FiMail, FiPhone, FiLink, FiTag, FiInfo, FiCheckCircle, FiFileText, FiAlertTriangle, FiCalendar, FiTrash2 } from 'react-icons/fi';
import { PiGlobeHemisphereEastFill } from "react-icons/pi";
import { updateTargetAnalysisStatus, updateTargetStatus } from '../../services/targetsService';

const TargetDetailsPanel = ({ target, visible, onClose, onEdit, onDelete, redirectToEmailOsint, redirectToPhoneOsint, redirectToWebAnalysis }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [progressInput, setProgressInput] = useState(target?.progress || 0);
  const [analysisStatusInput, setAnalysisStatusInput] = useState(target?.analysisStatus || '');
  const [statusInput, setStatusInput] = useState(target?.status || 'unknown');
  
  if (!target) {
    return null;
  }

  // Obtenir la couleur du statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#2ecc71';
      case 'inactive':
        return '#95a5a6';
      case 'vulnerable':
        return '#e74c3c';
      case 'secure':
        return '#3498db';
      default:
        return '#f39c12';
    }
  };

  // Obtenir le libellé du statut
  const getStatusLabel = (status) => {
    const statusOptions = [
      { value: 'unknown', label: 'Inconnu' },
      { value: 'active', label: 'Actif' },
      { value: 'inactive', label: 'Inactif' },
      { value: 'vulnerable', label: 'Vulnérable' },
      { value: 'secure', label: 'Sécurisé' }
    ];
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : 'Inconnu';
  };

  // Formater la date
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Mettre à jour le statut d'analyse
  const handleUpdateAnalysis = () => {
    const result = updateTargetAnalysisStatus(target.id, analysisStatusInput, parseInt(progressInput));
    if (result.success) {
      // Recharger la page ou mettre à jour l'état local
      window.location.reload();
    }
  };

  // Mettre à jour le statut de la cible
  const handleUpdateStatus = () => {
    const result = updateTargetStatus(target.id, statusInput);
    if (result.success) {
      // Recharger la page ou mettre à jour l'état local
      window.location.reload();
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-50 z-40 ${visible ? 'block' : 'hidden'}`}
        onClick={onClose}
      ></div>
      
      <div className={`fixed top-0 right-0 w-full md:w-2/3 lg:w-1/2 xl:w-1/3 h-full bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-auto ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{target.name}</h2>
          <button 
            onClick={onClose}
            className="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span 
                className="inline-block px-2 py-1 text-xs font-medium rounded-full text-white"
                style={{ backgroundColor: getStatusColor(target.status) }}
              >
                {getStatusLabel(target.status)}
              </span>
              
              {target.progress > 0 && (
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {target.progress}% analysé
                </span>
              )}
            </div>
            
            <div className="text-right">
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => onEdit(target)}
                  className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 rounded"
                  title="Modifier"
                >
                  <FiEdit size={18} />
                </button>
                <button 
                  onClick={() => onDelete(target.id)}
                  className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                  title="Supprimer"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            className={`px-4 py-2 text-sm font-medium flex items-center whitespace-nowrap ${activeTab === 'info' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            onClick={() => setActiveTab('info')}
          >
            <FiInfo className="mr-1" /> Informations
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium flex items-center whitespace-nowrap ${activeTab === 'analysis' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            onClick={() => setActiveTab('analysis')}
          >
            <FiCheckCircle className="mr-1" /> Analyse
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium flex items-center whitespace-nowrap ${activeTab === 'notes' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            onClick={() => setActiveTab('notes')}
          >
            <FiFileText className="mr-1" /> Notes
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium flex items-center whitespace-nowrap ${activeTab === 'vulns' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            onClick={() => setActiveTab('vulns')}
          >
            <FiAlertTriangle className="mr-1" /> Vulnérabilités
          </button>
        </div>
        
        {/* Onglet Informations */}
        {activeTab === 'info' && (
          <div className="p-4 overflow-auto">
            <div className="space-y-4">
              {target.ipAddress && (
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <FiTarget className="mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="font-medium mr-2 flex-shrink-0">Adresse IP:</span>
                  <span className="break-all">{target.ipAddress}</span>
                </div>
              )}
              
              {target.hostname && (
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <PiGlobeHemisphereEastFill className="mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="font-medium mr-2 flex-shrink-0">Hostname:</span>
                  <span className="break-all">{target.hostname}</span>
                </div>
              )}
              
              {target.email && (
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <FiMail className="mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="font-medium mr-2 flex-shrink-0">Email:</span>
                  <span className="break-all flex-1">{target.email}</span>
                  <button 
                    onClick={() => redirectToEmailOsint(target.email)}
                    className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                  >
                    OSINT
                  </button>
                </div>
              )}
              
              {target.phoneNumber && (
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <FiPhone className="mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="font-medium mr-2 flex-shrink-0">Téléphone:</span>
                  <span className="flex-1">{target.phoneNumber}</span>
                  <button 
                    onClick={() => redirectToPhoneOsint(target.phoneNumber)}
                    className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50"
                  >
                    OSINT
                  </button>
                </div>
              )}
              
              {target.website && (
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <FiLink className="mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="font-medium mr-2 flex-shrink-0">Site web:</span>
                  <span className="break-all flex-1">{target.website}</span>
                  <button 
                    onClick={() => redirectToWebAnalysis(target.website)}
                    className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50"
                  >
                    Analyser
                  </button>
                </div>
              )}
              
              {target.tags && target.tags.length > 0 && (
                <div>
                  <div className="flex items-center mb-2 text-gray-700 dark:text-gray-300">
                    <FiTag className="mr-2 text-gray-500 dark:text-gray-400" />
                    <span className="font-medium">Tags:</span>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-6">
                    {target.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {target.description && (
                <div>
                  <div className="flex items-start text-gray-700 dark:text-gray-300">
                    <FiInfo className="mr-2 mt-1 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Description:</span>
                      <p className="mt-1 text-gray-600 dark:text-gray-400 whitespace-pre-line">
                        {target.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-2 text-gray-700 dark:text-gray-300">
                  <FiCalendar className="mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="font-medium mr-2">Créé le:</span>
                  <span>{formatDate(target.createdAt)}</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <FiCalendar className="mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="font-medium mr-2">Mis à jour le:</span>
                  <span>{formatDate(target.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Onglet Analyse */}
        {activeTab === 'analysis' && (
          <div className="p-4 overflow-auto">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Statut d'analyse</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Statut de la cible
                </label>
                <div className="flex space-x-2 items-center mb-3">
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="unknown">Inconnu</option>
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="vulnerable">Vulnérable</option>
                    <option value="secure">Sécurisé</option>
                  </select>
                  <button 
                    onClick={handleUpdateStatus}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Mettre à jour le statut
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Progression (%)
                </label>
                <div className="flex space-x-2 items-center">
                  <input
                    type="number"
                    value={progressInput}
                    onChange={(e) => setProgressInput(e.target.value)}
                    min="0"
                    max="100"
                    className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                      <div 
                        className="h-4 rounded-full bg-indigo-500" 
                        style={{ width: `${progressInput}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Statut d'analyse
                </label>
                <input
                  type="text"
                  value={analysisStatusInput}
                  onChange={(e) => setAnalysisStatusInput(e.target.value)}
                  placeholder="Ex: Scan réseau en cours..."
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <button 
                onClick={handleUpdateAnalysis}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
              >
                Mettre à jour le statut d'analyse
              </button>
            </div>
            
            {target.osintResults && Object.keys(target.osintResults).length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Résultats OSINT</h3>
                
                {Object.entries(target.osintResults).map(([type, data]) => (
                  <div key={type} className="mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h4 className="text-md font-medium mb-2 flex items-center text-gray-700 dark:text-gray-300">
                      {type === 'email' && <FiMail className="mr-1" />}
                      {type === 'phone' && <FiPhone className="mr-1" />}
                      {type === 'web' && <PiGlobeHemisphereEastFill className="mr-1" />}
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(data.timestamp).toLocaleDateString()}
                      </span>
                    </h4>
                    <pre className="text-xs bg-gray-50 dark:bg-gray-900/30 p-2 rounded-md overflow-x-auto text-gray-600 dark:text-gray-400">
                      {JSON.stringify(data.data, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Onglet Notes */}
        {activeTab === 'notes' && (
          <div className="p-4 overflow-auto">
            {target.notes ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {target.notes}
                </pre>
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                Aucune note pour cette cible. Modifiez la cible pour ajouter des notes.
              </div>
            )}
          </div>
        )}
        
        {/* Onglet Vulnérabilités */}
        {activeTab === 'vulns' && (
          <div className="p-4 overflow-auto">
            {target.vulnerabilities && target.vulnerabilities.length > 0 ? (
              <div className="space-y-4">
                {target.vulnerabilities.map(vuln => (
                  <div 
                    key={vuln.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      {vuln.name || 'Vulnérabilité sans nom'}
                    </h4>
                    
                    {vuln.severity && (
                      <div className="mb-2">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          vuln.severity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                          vuln.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {vuln.severity === 'high' ? 'Élevée' : 
                           vuln.severity === 'medium' ? 'Moyenne' : 'Faible'}
                        </span>
                      </div>
                    )}
                    
                    {vuln.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-2">{vuln.description}</p>
                    )}
                    
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Découvert le {new Date(vuln.discoveredAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                Aucune vulnérabilité détectée pour cette cible.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default TargetDetailsPanel; 