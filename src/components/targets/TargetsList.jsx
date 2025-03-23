import React, { useState, useEffect } from 'react';
import { FiGrid, FiList, FiSearch, FiPlus, FiFilter, FiRefreshCw, FiArrowUp, FiArrowDown, FiTag } from 'react-icons/fi';
import { getAllTargets, addTarget, updateTarget, deleteTarget, searchTargets, filterTargetsByTag, filterTargetsByStatus } from '../../services/targetsService';
import TargetDetailsPanel from './TargetDetailsPanel';
import TargetForm from './TargetForm';

const TargetsList = () => {
  // États
  const [targets, setTargets] = useState([]);
  const [filteredTargets, setFilteredTargets] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [view, setView] = useState('grid');
  const [expandedTargets, setExpandedTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Options de statut
  const statusOptions = [
    { value: 'unknown', label: 'Inconnu' },
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
    { value: 'vulnerable', label: 'Vulnérable' },
    { value: 'secure', label: 'Sécurisé' }
  ];

  // Charger les cibles au montage du composant
  useEffect(() => {
    loadTargets();
  }, []);

  // Filtrer les cibles quand les critères changent
  useEffect(() => {
    filterTargets();
  }, [targets, searchTerm, filterTag, filterStatus, sortBy, sortOrder]);

  // Charger toutes les cibles
  const loadTargets = async () => {
    setLoading(true);
    try {
      const fetchedTargets = getAllTargets();
      setTargets(fetchedTargets);
    } catch (err) {
      setError("Erreur lors du chargement des cibles");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les cibles
  const filterTargets = () => {
    let result = [...targets];
    
    // Appliquer la recherche
    if (searchTerm) {
      result = searchTargets(searchTerm).filter(target => 
        targets.some(t => t.id === target.id)
      );
    }
    
    // Appliquer le filtre par tag
    if (filterTag) {
      result = filterTargetsByTag(filterTag).filter(target => 
        result.some(t => t.id === target.id)
      );
    }
    
    // Appliquer le filtre par statut
    if (filterStatus) {
      result = filterTargetsByStatus(filterStatus).filter(target => 
        result.some(t => t.id === target.id)
      );
    }
    
    // Trier les résultats
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'status') {
        return sortOrder === 'asc'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      } else if (sortBy === 'progress') {
        return sortOrder === 'asc'
          ? a.progress - b.progress
          : b.progress - a.progress;
      } else {
        // Par défaut, trier par date de mise à jour
        return sortOrder === 'asc'
          ? new Date(a.updatedAt) - new Date(b.updatedAt)
          : new Date(b.updatedAt) - new Date(a.updatedAt);
      }
    });
    
    setFilteredTargets(result);
  };

  // Basculer l'expansion d'une cible
  const toggleExpandTarget = (id) => {
    setExpandedTargets(prev => 
      prev.includes(id) 
        ? prev.filter(targetId => targetId !== id)
        : [...prev, id]
    );
  };

  // Changer le tri
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Ajouter une cible
  const handleAddTarget = (newTarget) => {
    try {
      const result = addTarget(newTarget);
      if (result.success) {
        setSuccess("Cible ajoutée avec succès");
        setShowAddForm(false);
        loadTargets();
      } else {
        setError(result.message || "Erreur lors de l'ajout de la cible");
      }
    } catch (err) {
      setError("Erreur lors de l'ajout de la cible");
      console.error(err);
    }
  };

  // Mettre à jour une cible
  const handleUpdateTarget = (updatedTarget) => {
    try {
      const result = updateTarget(updatedTarget.id, updatedTarget);
      if (result.success) {
        setSuccess("Cible mise à jour avec succès");
        setSelectedTarget(null);
        loadTargets();
      } else {
        setError(result.message || "Erreur lors de la mise à jour de la cible");
      }
    } catch (err) {
      setError("Erreur lors de la mise à jour de la cible");
      console.error(err);
    }
  };

  // Supprimer une cible
  const handleDeleteTarget = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette cible ?")) {
      try {
        const result = deleteTarget(id);
        if (result.success) {
          setSuccess("Cible supprimée avec succès");
          setSelectedTarget(null);
          loadTargets();
        } else {
          setError(result.message || "Erreur lors de la suppression de la cible");
        }
      } catch (err) {
        setError("Erreur lors de la suppression de la cible");
        console.error(err);
      }
    }
  };

  // Redirection vers les outils OSINT
  const redirectToEmailOsint = (email) => {
    console.log(`Redirection vers OSINT email pour: ${email}`);
    localStorage.setItem('osintEmailAddress', email);
    window.setActiveView('osintEmail');
  };

  const redirectToPhoneOsint = (phone) => {
    console.log(`Redirection vers OSINT téléphone pour: ${phone}`);
    localStorage.setItem('osintPhoneNumber', phone);
    window.setActiveView('phoneOsint');
  };

  const redirectToWebAnalysis = (url) => {
    console.log(`Redirection vers Web Analysis pour: ${url}`);
    localStorage.setItem('webTechUrl', url);
    window.setActiveView('webalyzer');
  };

  // Nouvelles fonctions de redirection
  const redirectToOsintPhonesEmails = (data) => {
    console.log(`Redirection vers OSINT Phones & Emails pour: ${data}`);
    localStorage.setItem('osintPhonesEmailsData', data);
    window.setActiveView('osintphonesemails');
  };

  const redirectToSmishing = (phone) => {
    console.log(`Redirection vers Smishing pour: ${phone}`);
    localStorage.setItem('smishingPhone', phone);
    window.setActiveView('smishing');
  };

  const redirectToSmooding = (phone) => {
    console.log(`Redirection vers Smooding pour: ${phone}`);
    localStorage.setItem('smoodingPhone', phone);
    window.setActiveView('smooding');
  };

  const redirectToPhisher = (email) => {
    console.log(`Redirection vers Phisher pour: ${email}`);
    localStorage.setItem('phisherEmail', email);
    window.setActiveView('phisher');
  };

  const redirectToSender = (email) => {
    console.log(`Redirection vers SendGrid Sender pour: ${email}`);
    localStorage.setItem('senderEmail', email);
    window.setActiveView('sender');
  };

  const redirectToZapScanner = (url) => {
    console.log(`Redirection vers OWASP ZAP pour: ${url}`);
    localStorage.setItem('zapScannerUrl', url);
    window.setActiveView('zapscanner');
  };

  const redirectToSslTls = (url) => {
    console.log(`Redirection vers SSL/TLS Scanner pour: ${url}`);
    localStorage.setItem('sslTlsUrl', url);
    window.setActiveView('ssl_tls');
  };

  const redirectToShodan = (url) => {
    console.log(`Redirection vers Shodan pour: ${url}`);
    localStorage.setItem('shodanUrl', url);
    window.setActiveView('shodan');
  };

  const redirectToZoomEye = (url) => {
    console.log(`Redirection vers ZoomEye pour: ${url}`);
    localStorage.setItem('zoomEyeUrl', url);
    window.setActiveView('zoomeye');
  };

  const redirectToHydra = (url) => {
    console.log(`Redirection vers Hydra pour: ${url}`);
    localStorage.setItem('hydraUrl', url);
    window.setActiveView('hydra');
  };

  const redirectToGoBuster = (url) => {
    console.log(`Redirection vers GoBuster pour: ${url}`);
    localStorage.setItem('goBusterUrl', url);
    window.setActiveView('gobuster');
  };

  const redirectToVirusTotal = (url) => {
    console.log(`Redirection vers VirusTotal pour: ${url}`);
    localStorage.setItem('virusTotalUrl', url);
    window.setActiveView('virustotal');
  };

  const redirectToSqli = (url) => {
    console.log(`Redirection vers SQLi pour: ${url}`);
    localStorage.setItem('sqliUrl', url);
    window.setActiveView('sqli');
  };

  const redirectToXsser = (url) => {
    console.log(`Redirection vers XSSer pour: ${url}`);
    localStorage.setItem('xsserUrl', url);
    window.setActiveView('xsser');
  };

  const redirectToRanking = (url) => {
    console.log(`Redirection vers Website Ranking pour: ${url}`);
    localStorage.setItem('rankingUrl', url);
    window.setActiveView('osintranking');
  };

  const redirectToSubdomainEnum = (url) => {
    console.log(`Redirection vers Subdomain Enum pour: ${url}`);
    localStorage.setItem('subdomainUrl', url);
    window.setActiveView('subdomainenum');
  };

  const redirectToWebAlyzer = (url) => {
    console.log(`Redirection vers WebAlyzer pour: ${url}`);
    localStorage.setItem('webTechUrl', url);
    window.setActiveView('webalyzer');
  };

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

  // Obtenir l'étiquette du statut
  const getStatusLabel = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : 'Inconnu';
  };

  // Formater la date
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  return (
    <div className="w-full max-w-full bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Barre d'outils */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-3 flex-grow">
          <div className="relative w-full md:w-64">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher des cibles..."
              className="w-full pl-10 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="relative w-full md:w-auto">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full md:w-48 pl-10 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tous les statuts</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="relative w-full md:w-auto">
              <FiTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                placeholder="Filtrer par tag..."
                className="w-full md:w-48 pl-10 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
            <button
              className={`p-2 ${view === 'grid' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
              onClick={() => setView('grid')}
              title="Vue grille"
            >
              <FiGrid />
            </button>
            <button
              className={`p-2 ${view === 'list' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
              onClick={() => setView('list')}
              title="Vue liste"
            >
              <FiList />
            </button>
          </div>
          
          <button 
            className="p-2 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={loadTargets}
            title="Rafraîchir"
          >
            <FiRefreshCw />
          </button>
          
          <button 
            className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            onClick={() => setShowAddForm(true)}
          >
            <FiPlus className="mr-1" />
            Ajouter une cible
          </button>
        </div>
      </div>
      
      {/* Messages d'erreur et de succès */}
      {error && (
        <div className="m-4 p-3 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-md flex justify-between items-center">
          {error}
          <button onClick={() => setError('')} className="text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 font-bold">×</button>
        </div>
      )}
      
      {success && (
        <div className="m-4 p-3 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 rounded-md flex justify-between items-center">
          {success}
          <button onClick={() => setSuccess('')} className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 font-bold">×</button>
        </div>
      )}
      
      {/* Affichage des cibles */}
      <div className="p-4">
        {loading ? (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
            <p className="mt-3 text-gray-600 dark:text-gray-400">Chargement des cibles...</p>
          </div>
        ) : filteredTargets.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 dark:bg-gray-900/20 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Aucune cible trouvée</p>
            <button 
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
              onClick={() => setShowAddForm(true)}
            >
              <FiPlus className="mr-2" />
              Ajouter une cible
            </button>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTargets.map(target => (
              <div key={target.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white cursor-pointer truncate" onClick={() => setSelectedTarget(target)}>
                    {target.name}
                  </h3>
                  <button 
                    onClick={() => toggleExpandTarget(target.id)} 
                    className="ml-2 p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    {expandedTargets.includes(target.id) ? '−' : '+'}
                  </button>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span 
                      className="px-2 py-1 text-xs font-medium rounded-full text-white"
                      style={{ backgroundColor: getStatusColor(target.status) }}
                    >
                      {getStatusLabel(target.status)}
                    </span>
                    
                    {target.progress > 0 && (
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${target.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{target.progress}%</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    {target.ipAddress && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium mr-2">IP:</span>
                        <span className="truncate">{target.ipAddress}</span>
                      </div>
                    )}
                    
                    {target.hostname && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium mr-2">Host:</span>
                        <span className="truncate">{target.hostname}</span>
                      </div>
                    )}
                    
                    {target.email && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium mr-2">Email:</span>
                        <span className="truncate">{target.email}</span>
                      </div>
                    )}
                    
                    {target.phoneNumber && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium mr-2">Tél:</span>
                        <span>{target.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                  
                  {target.tags && target.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {target.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {tag}
                        </span>
                      ))}
                      {target.tags.length > 3 && (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          +{target.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {target.description && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{target.description}</p>
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900/20 px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                  Mis à jour: {formatDate(target.updatedAt)}
                </div>
                
                {expandedTargets.includes(target.id) && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/20 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
                    <button 
                      onClick={() => setSelectedTarget(target)} 
                      className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
                    >
                      Détails
                    </button>
                    
                    {/* Email Actions */}
                    {target.email && (
                      <>
                        <button 
                          onClick={() => redirectToEmailOsint(target.email)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                        >
                          OSINT Email
                        </button>
                        <button 
                          onClick={() => redirectToOsintPhonesEmails(target.email)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                        >
                          OSINT P&E
                        </button>
                        <button 
                          onClick={() => redirectToPhisher(target.email)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                        >
                          Phisher
                        </button>
                        <button 
                          onClick={() => redirectToSender(target.email)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                        >
                          Sender
                        </button>
                      </>
                    )}
                    
                    {/* Phone Actions */}
                    {target.phoneNumber && (
                      <>
                        <button 
                          onClick={() => redirectToPhoneOsint(target.phoneNumber)}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50"
                        >
                          OSINT Tél
                        </button>
                        <button 
                          onClick={() => redirectToOsintPhonesEmails(target.phoneNumber)}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50"
                        >
                          OSINT P&E
                        </button>
                        <button 
                          onClick={() => redirectToSmishing(target.phoneNumber)}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50"
                        >
                          Smishing
                        </button>
                        <button 
                          onClick={() => redirectToSmooding(target.phoneNumber)}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50"
                        >
                          Smooding
                        </button>
                      </>
                    )}
                    
                    {/* Web Actions */}
                    {(target.website || target.hostname) && (
                      <>
                        <button 
                          onClick={() => redirectToWebAnalysis(target.website || target.hostname)}
                          className="px-2 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50"
                        >
                          WebAlyzer
                        </button>
                        <button 
                          onClick={() => redirectToZapScanner(target.website || target.hostname)}
                          className="px-2 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50"
                        >
                          ZAP
                        </button>
                        <button 
                          onClick={() => redirectToSslTls(target.website || target.hostname)}
                          className="px-2 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50"
                        >
                          SSL/TLS
                        </button>
                        <button 
                          onClick={() => redirectToShodan(target.website || target.hostname)}
                          className="px-2 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50"
                        >
                          Shodan
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/20">
                <tr>
                  <th onClick={() => handleSort('name')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900/50">
                    Nom
                    {sortBy === 'name' && (
                      sortOrder === 'asc' ? <FiArrowUp className="inline ml-1" /> : <FiArrowDown className="inline ml-1" />
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    IP / Hostname
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contacts
                  </th>
                  <th onClick={() => handleSort('status')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900/50">
                    Statut
                    {sortBy === 'status' && (
                      sortOrder === 'asc' ? <FiArrowUp className="inline ml-1" /> : <FiArrowDown className="inline ml-1" />
                    )}
                  </th>
                  <th onClick={() => handleSort('progress')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900/50">
                    Progression
                    {sortBy === 'progress' && (
                      sortOrder === 'asc' ? <FiArrowUp className="inline ml-1" /> : <FiArrowDown className="inline ml-1" />
                    )}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTargets.map(target => (
                  <tr key={target.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/10">
                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => setSelectedTarget(target)}>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {target.name}
                      </div>
                      {target.tags && target.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {target.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {tag}
                            </span>
                          ))}
                          {target.tags.length > 2 && (
                            <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              +{target.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {target.ipAddress && <div>{target.ipAddress}</div>}
                        {target.hostname && <div className="text-xs mt-1">{target.hostname}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {target.email && <div className="truncate max-w-[150px]">{target.email}</div>}
                        {target.phoneNumber && <div className="text-xs mt-1">{target.phoneNumber}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className="px-2 py-1 text-xs font-medium rounded-full text-white"
                        style={{ backgroundColor: getStatusColor(target.status) }}
                      >
                        {getStatusLabel(target.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {target.progress > 0 ? (
                        <div>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>{target.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full" 
                              style={{ width: `${target.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">Non démarré</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => setSelectedTarget(target)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                      >
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Panneau de détails de la cible */}
      <TargetDetailsPanel
        target={selectedTarget}
        visible={selectedTarget !== null}
        onClose={() => setSelectedTarget(null)}
        onEdit={(target) => {
          setShowAddForm(true);
          setSelectedTarget(target);
        }}
        onDelete={handleDeleteTarget}
        redirectToEmailOsint={redirectToEmailOsint}
        redirectToPhoneOsint={redirectToPhoneOsint}
        redirectToWebAnalysis={redirectToWebAnalysis}
      />
      
      {/* Formulaire d'ajout/modification de cible */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={() => setShowAddForm(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <TargetForm
              target={selectedTarget}
              onSubmit={selectedTarget ? handleUpdateTarget : handleAddTarget}
              onCancel={() => {
                setShowAddForm(false);
                setSelectedTarget(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TargetsList; 