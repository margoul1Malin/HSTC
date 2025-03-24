import React, { useState, useEffect } from 'react';
import { FiHome, FiCheckSquare, FiSettings, FiMenu, FiSearch, FiBookmark, FiChevronDown, FiChevronRight, FiDatabase, FiLock, FiTarget, FiServer, FiWifi, FiMail, FiSend, FiPhone, FiEye, FiMessageSquare, FiShield, FiGlobe, FiKey, FiCalendar, FiGithub, FiTool, FiFile, FiImage, FiActivity, FiCode, FiCreditCard, FiFolder, FiUser, FiPhoneCall, FiBarChart2, FiMapPin, FiRepeat, FiTwitter } from 'react-icons/fi';
import { FcKey, FcUnlock, FcTabletAndroid, FcSearch, FcViewDetails, FcCalendar, FcBiohazard, FcMoneyTransfer, FcGlobe, FcDebt, FcDataConfiguration, FcAddressBook } from "react-icons/fc";
import { PiSyringeFill, PiCreditCardFill, PiBinaryFill, PiDoorOpenFill } from "react-icons/pi";
import { SiNgrok, SiAmazonwebservices } from "react-icons/si";
import { FaQrcode } from "react-icons/fa";
import { BiScan } from "react-icons/bi";
const Sidebar = ({ activeView, setActiveView }) => {
  console.log('Sidebar - Rendu, vue active:', activeView);
  
  const [collapsed, setCollapsed] = useState(false);
  const [exploitsMenuOpen, setExploitsMenuOpen] = useState(false);
  const [targetsMenuOpen, setTargetsMenuOpen] = useState(false);
  const [scannerMenuOpen, setScannerMenuOpen] = useState(false);
  const [emailsMenuOpen, setEmailsMenuOpen] = useState(false);
  const [phonesMenuOpen, setPhonesMenuOpen] = useState(false);
  const [securityMenuOpen, setSecurityMenuOpen] = useState(false);
  const [iotSearchMenuOpen, setIotSearchMenuOpen] = useState(false);
  const [bruteForceMenuOpen, setBruteForceMenuOpen] = useState(false);
  const [systemPlanningMenuOpen, setSystemPlanningMenuOpen] = useState(false);
  const [miscellaneousMenuOpen, setMiscellaneousMenuOpen] = useState(false);
  const [sniffingMenuOpen, setSniffingMenuOpen] = useState(false);
  const [injectorMenuOpen, setInjectorMenuOpen] = useState(false);
  const [malwareMenuOpen, setMalwareMenuOpen] = useState(false);
  const [ccMenuOpen, setCcMenuOpen] = useState(false);
  const [osintMenuOpen, setOsintMenuOpen] = useState(false);

  // Vérifier si une vue d'exploits est active
  const isExploitViewActive = activeView === 'exploitdb' || activeView === 'savedexploits';
  
  // Vérifier si une vue de cibles est active
  const isTargetViewActive = activeView === 'targets';
  
  // Vérifier si une vue de scanner est active
  const isScannerViewActive = activeView === 'networkScanner' || 
                             activeView === 'webalyzer' ||
                             activeView === 'ssl_tls' ||
                             activeView === 'zapscanner';
  
  // Vérifier si une vue d'emails est active
  const isEmailViewActive = activeView === 'osintEmail' || activeView === 'phisher';
  
  // Vérifier si une vue de téléphones est active
  const isPhoneViewActive = activeView === 'phoneOsint' || activeView === 'smooding' || activeView === 'smishing';
  
  // Vérifier si une vue de sécurité est active
  const isSecurityViewActive = activeView === 'privesc';
  
  // Vérifier si une vue de recherche IoT est active
  const isIotSearchViewActive = activeView === 'shodan' || activeView === 'zoomeye' || activeView === 'censys';
  
  // Vérifier si une vue de brute force est active
  const isBruteForceViewActive = activeView === 'hydra' || activeView === 'john' || activeView === 'gobuster';

  // Vérifier si une vue de planification système est active
  const isSystemPlanningViewActive = activeView === 'plannifyer' || activeView === 'scriptgarbage';

  // Vérifier si une vue de misc est active
  const isMiscellaneousViewActive = activeView === 'exifyer' || 
                                   activeView === 'virustotal' || 
                                   activeView === 'qrcodegenerator' || 
                                   activeView === 'ipgeolocation' || 
                                   activeView === 'base64toimage' || 
                                   activeView === 'mitreattack' ||
                                   activeView === 'converter';

  // Vérifier si une vue de sniffing est active
  const isSniffingViewActive = activeView === 'shark';
  
  // Vérifier si une vue d'Injector est active
  const isInjectorViewActive = activeView === 'sqli' || activeView === 'xsser';
  
  // Vérifier si une vue de M4lwar3b1tes est active
  const isMalwareViewActive = activeView === 'msfvenom' || activeView === 'donut';
  
  // Vérifier si une vue de CC est active
  const isCcViewActive = activeView === 'ccgenerator' || activeView === 'ccchecker';

  // Ouvrir automatiquement le menu correspondant à la vue active
  useEffect(() => {
    if (isExploitViewActive) setExploitsMenuOpen(true);
    if (isTargetViewActive) setTargetsMenuOpen(true);
    if (isScannerViewActive) setScannerMenuOpen(true);
    if (isEmailViewActive) setEmailsMenuOpen(true);
    if (isPhoneViewActive) setPhonesMenuOpen(true);
    if (isSecurityViewActive) setSecurityMenuOpen(true);
    if (isIotSearchViewActive) setIotSearchMenuOpen(true);
    if (isBruteForceViewActive) setBruteForceMenuOpen(true);
    if (isSystemPlanningViewActive) setSystemPlanningMenuOpen(true);
    if (isMiscellaneousViewActive) setMiscellaneousMenuOpen(true);
    if (isSniffingViewActive) setSniffingMenuOpen(true);
    if (isInjectorViewActive) setInjectorMenuOpen(true);
    if (isMalwareViewActive) setMalwareMenuOpen(true);
    if (isCcViewActive) setCcMenuOpen(true);
  }, [activeView]);

  // Définir les éléments du menu principal
  const mainMenuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <FiHome size={20} /> },
    { id: 'todo', label: 'Tâches', icon: <FiCheckSquare size={20} /> },
    { id: 'vault', label: 'Coffre-fort', icon: <FiLock size={20} /> },
    { id: 'settings', label: 'Paramètres', icon: <FiSettings size={20} /> },
  ];

  // Définir les éléments du sous-menu Exploits
  const exploitsSubMenuItems = [
    { id: 'exploitdb', label: 'Recherche d\'Exploits', icon: <FiSearch size={18} /> },
    { id: 'savedexploits', label: 'Exploits Sauvegardés', icon: <FiBookmark size={18} /> },
    { id: 'nvd', label: 'NVD (Coming Soon...)', icon: <FiSearch size={18} />, disabled: true },
    { id: 'vuldb', label: 'VulDB (Coming Soon...)', icon: <FiSearch size={18} />, disabled: true },
  ];
  
  // Définir les éléments du sous-menu Cibles
  const targetsSubMenuItems = [
    { id: 'targets', label: 'Liste des Cibles', icon: <FiServer size={18} /> },
  ];
  
  // Définir les éléments du sous-menu Scanner
  const scannerSubMenuItems = [
    { id: 'networkScanner', label: 'Scanner Réseau', icon: <FiWifi size={18} /> },
    { id: 'webalyzer', label: 'WebAlyzer', icon: <FcGlobe size={18} /> },
    { id: 'ssl_tls', label: 'SSL/TLS', icon: <FiLock size={18} /> },
    { id: 'zapscanner', label: 'OWASP ZAP', icon: <FiShield size={18} /> },
    { id: 'hakboardcrawler', label: 'HakBoard Crawler', icon: <BiScan size={18} /> },
  ];
  
  // Définir les éléments du sous-menu E-Mails
  const emailsSubMenuItems = [
    { id: 'osintEmail', label: 'OSINT', icon: <FiSearch size={18} /> },
    { id: 'phisher', label: 'Phisher', icon: <FiSend size={18} /> },
    { id: 'sender', label: 'SendGrid Sender', icon: <FiMail size={18} /> },
    { id: 'awssender', label: 'AWS Sender (Coming Soon...)', icon: <SiAmazonwebservices size={18} />, disabled: true },
  ];
  
  // Définir les éléments du sous-menu Téléphones
  const phonesSubMenuItems = [
    { id: 'phoneOsint', label: 'OSINT', icon: <FiSearch size={18} /> },
    { id: 'smooding', label: 'Smooding', icon: <FiMessageSquare size={18} /> },
    { id: 'smishing', label: 'Smishing', icon: <FiSend size={18} /> },
  ];
  
  // Définir les éléments du sous-menu Security
  const securitySubMenuItems = [
    { id: 'privesc', label: 'PrivEsc Check', icon: <FiShield size={18} /> },
  ];
  
  // Définir les éléments du sous-menu IoT Search
  const iotSearchSubMenuItems = [
    { id: 'shodan', label: 'Shodan', icon: <FiGlobe size={18} /> },
    { id: 'zoomeye', label: 'ZoomEye', icon: <FiSearch size={18} /> },
    { id: 'censys', label: 'Censys (Coming Soon...)', icon: <FiSearch size={18} />, disabled: true },
  ];

  // Définir les éléments du sous-menu Brute Force
  const bruteForceSubMenuItems = [
    { id: 'hydra', label: 'Hydra', icon: <FcKey size={18} /> },
    { id: 'john', label: 'John The Ripper', icon: <FcUnlock size={18} /> },
    { id: 'gobuster', label: 'GoBuster', icon: <FcSearch size={18} /> },
    { id: 'intruder', label: 'Intruder (Coming Soon...)', icon: <FiLock size={18} />, disabled: true },
  ];

  // Définir les éléments du sous-menu System Planning
  const systemPlanningSubMenuItems = [
    { id: 'plannifyer', label: 'Plannifyer', icon: <FcCalendar size={18} /> },
    { id: 'scriptgarbage', label: 'Script Garbage', icon: <FiGithub size={18} /> },
  ];

  // Définir les éléments du sous-menu Miscellaneous
  const miscellaneousSubMenuItems = [
    { id: 'exifyer', label: 'Exifyer', icon: <FiImage size={18} /> },
    { id: 'virustotal', label: 'VirusTotal', icon: <FiShield size={18} /> },
    { id: 'qrcodegenerator', label: 'QR Code Generator', icon: <FaQrcode size={18} /> },
    { id: 'ipgeolocation', label: 'IP Geolocation', icon: <FiMapPin size={18} /> },
    { id: 'base64toimage', label: 'Base64 → Image', icon: <FiImage size={18} /> },
    { id: 'mitreattack', label: 'MITRE ATT&CK', icon: <FiTarget size={18} /> },
    { id: 'converter', label: 'Converter', icon: <FiRepeat size={18} /> },
  ];

  // Définir les éléments du sous-menu Sniffing
  const sniffingSubMenuItems = [
    { id: 'shark', label: 'Shark', icon: <FiActivity size={18} /> },
  ];

  // Définir les éléments du sous-menu Injector
  const injectorSubMenuItems = [
    { id: 'sqli', label: 'SQLi', icon: <FiDatabase size={18} /> },
    { id: 'xsser', label: 'XSSer', icon: <FiCode size={18} /> },
    { id: 'xxe', label: 'XXE (Coming Soon...)', icon: <FiFile size={18} />, disabled: true },
    { id: 'xsrf', label: 'XSRF (Coming Soon...)', icon: <FiGlobe size={18} />, disabled: true },
    { id: 'lfi', label: 'LFI (Coming Soon...)', icon: <FiFolder size={18} />, disabled: true },
  ];
  
  // Définir les éléments du sous-menu M4lwar3b1tes
  const malwareSubMenuItems = [
    { id: 'msfvenom', label: 'Msfvenom', icon: <FcBiohazard size={18} /> },
    { id: 'donut', label: 'Donut', icon: <FcBiohazard size={18} /> },
  ];
  
  // Définir les éléments du sous-menu CC
  const ccSubMenuItems = [
    { id: 'ccgenerator', label: 'CC Generator', icon: <PiCreditCardFill size={18} /> },
    { id: 'binchecker', label: 'BIN Checker', icon: <PiBinaryFill size={18} /> },
  ];

  // Définir les éléments du sous-menu OSINT
  const osintSubMenuItems = [
    { id: 'osintphonesemails', label: 'Phones & Emails', icon: <FiPhoneCall size={18} /> },
    { id: 'osintranking', label: 'Website Ranking', icon: <FiBarChart2 size={18} /> },
    { id: 'subdomainenum', label: 'Subdomain Enum', icon: <FiGlobe size={18} /> },
    { id: 'webtechnologies', label: 'Web Technologies', icon: <FiCode size={18} /> },
    { id: 'proxylist', label: 'Proxy List', icon: <FiServer size={18} /> },
    { id: 'twitterscraper', label: 'Twitter Scraper', icon: <FiTwitter size={18} /> },
    { id: 'featuresincoming', label: 'Features Incoming...', icon: <FiCode size={18} />, disabled: true },
  ];

  // Gérer le changement de vue
  const handleViewChange = (viewId) => {
    console.log('Sidebar - Changement de vue:', viewId);
    setActiveView(viewId);
  };

  // Basculer l'état du menu Exploits
  const toggleExploitsMenu = () => {
    if (collapsed) {
      // Si la sidebar est réduite, ouvrir directement la vue exploitdb
      handleViewChange('exploitdb');
    } else {
      setExploitsMenuOpen(!exploitsMenuOpen);
    }
  };
  
  // Basculer l'état du menu Cibles
  const toggleTargetsMenu = () => {
    if (collapsed) {
      // Si la sidebar est réduite, ouvrir directement la vue targets
      handleViewChange('targets');
    } else {
      setTargetsMenuOpen(!targetsMenuOpen);
    }
  };
  
  // Basculer l'état du menu Scanner
  const toggleScannerMenu = () => {
    if (collapsed) {
      // Si la sidebar est réduite, ouvrir directement la vue networkScanner
      handleViewChange('networkScanner');
    } else {
      setScannerMenuOpen(!scannerMenuOpen);
    }
  };
  
  // Basculer l'état du menu E-Mails
  const toggleEmailsMenu = () => {
    if (collapsed) {
      // Si la sidebar est réduite, ouvrir directement la vue osintEmail
      handleViewChange('osintEmail');
    } else {
      setEmailsMenuOpen(!emailsMenuOpen);
    }
  };
  
  // Basculer l'état du menu Téléphones
  const togglePhonesMenu = () => {
    if (collapsed) {
      // Si la sidebar est réduite, ouvrir directement la vue phoneOsint
      handleViewChange('phoneOsint');
    } else {
      setPhonesMenuOpen(!phonesMenuOpen);
    }
  };
  
  // Basculer l'état du menu Security
  const toggleSecurityMenu = () => {
    if (collapsed) {
      // Si la sidebar est réduite, ouvrir directement la vue privesc
      handleViewChange('privesc');
    } else {
      setSecurityMenuOpen(!securityMenuOpen);
    }
  };
  
  // Basculer l'état du menu IoT Search
  const toggleIotSearchMenu = () => {
    if (collapsed) {
      // Si la sidebar est réduite, ouvrir directement la vue shodan
      handleViewChange('shodan');
    } else {
      setIotSearchMenuOpen(!iotSearchMenuOpen);
    }
  };

  // Basculer l'état du menu Brute Force
  const toggleBruteForceMenu = () => {
    if (collapsed) {
      // Si la sidebar est réduite, ouvrir directement la vue hydra
      handleViewChange('hydra');
    } else {
      setBruteForceMenuOpen(!bruteForceMenuOpen);
    }
  };

  // Basculer l'état du menu System Planning
  const toggleSystemPlanningMenu = () => {
    if (collapsed) {
      // Si la sidebar est réduite, ouvrir directement la vue plannifyer
      handleViewChange('plannifyer');
    } else {
      setSystemPlanningMenuOpen(!systemPlanningMenuOpen);
    }
  };

  // Basculer l'état du menu Miscellaneous
  const toggleMiscellaneousMenu = () => {
    if (collapsed) {
      // Si la sidebar est réduite, ouvrir directement la vue exifyer
      handleViewChange('exifyer');
    } else {
      setMiscellaneousMenuOpen(!miscellaneousMenuOpen);
    }
  };

  // Basculer l'état du menu Sniffing
  const toggleSniffingMenu = () => {
    if (collapsed) {
      // Si la sidebar est réduite, ouvrir directement la vue shark
      handleViewChange('shark');
    } else {
      setSniffingMenuOpen(!sniffingMenuOpen);
    }
  };

  // Basculer l'état du menu Injector
  const toggleInjectorMenu = () => {
    if (collapsed) {
      // Si la sidebar est réduite, ouvrir directement la vue sqlinjector
      handleViewChange('sqli');
    } else {
      setInjectorMenuOpen(!injectorMenuOpen);
    }
  };
  
  // Basculer l'état du menu M4lwar3b1tes
  const toggleMalwareMenu = () => {
    if (collapsed) {
      // Si la sidebar est réduite, ouvrir directement la vue ransomware
      handleViewChange('ransomware');
    } else {
      setMalwareMenuOpen(!malwareMenuOpen);
    }
  };
  
  // Basculer l'état du menu CC
  const toggleCcMenu = () => {
    if (collapsed) {
      // Si la sidebar est réduite, ouvrir directement la vue ccgenerator
      handleViewChange('ccgenerator');
    } else {
      setCcMenuOpen(!ccMenuOpen);
    }
  };

  // Basculer l'état du menu OSINT
  const toggleOsintMenu = () => {
    if (collapsed) {
      // Si la sidebar est réduite, ouvrir directement la vue osintphonesemails
      handleViewChange('osintphonesemails');
    } else {
      setOsintMenuOpen(!osintMenuOpen);
    }
  };

  return (
    <div 
      className={`sidebar bg-white dark:bg-gray-800 shadow-lg h-screen transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            HakBoard
          </h1>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <FiMenu size={20} />
        </button>
      </div>

      <nav className="mt-6">
        <ul>
          {/* Menu principal */}
          {mainMenuItems.map((item) => (
            <li key={item.id} className="mb-2">
              <button
                onClick={() => handleViewChange(item.id)}
                className={`flex items-center w-full p-2 rounded-md ${
                  activeView === item.id
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                    : item.disabled 
                      ? 'text-gray-400 cursor-not-allowed dark:text-gray-500' 
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                } transition-colors duration-200`}
                disabled={item.disabled}
              >
                <span className="mr-4">{item.icon}</span>
                {!collapsed && (
                  <span>{item.label}</span>
                )}
              </button>
            </li>
          ))}

          {/* Menu Exploits avec sous-menu */}
          <li className="mb-2">
            <button
              onClick={toggleExploitsMenu}
              className={`flex items-center w-full p-3 ${
                isExploitViewActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              } transition-colors duration-200`}
            >
              <span className="mr-4"><FiDatabase size={20} /></span>
              {!collapsed && (
                <>
                  <span className="flex-1">Exploits</span>
                  {exploitsMenuOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </>
              )}
            </button>

            {/* Sous-menu Exploits */}
            {(exploitsMenuOpen || collapsed) && (
              <ul className={`${collapsed ? 'pl-0' : 'pl-6'} mt-1`}>
                {exploitsSubMenuItems.map((item) => (
                  <li key={item.id} className="mb-1">
                    <button
                      onClick={() => handleViewChange(item.id)}
                      className={`flex items-center w-full p-2 rounded-md ${
                        activeView === item.id
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                          : item.disabled 
                            ? 'text-gray-400 cursor-not-allowed dark:text-gray-500' 
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      } transition-colors duration-200`}
                      disabled={item.disabled}
                    >
                      <span className={`${collapsed ? 'mx-auto' : 'mr-3'}`}>{item.icon}</span>
                      {!collapsed && (
                        <span className="text-sm">{item.label}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
          
          {/* Menu Cibles avec sous-menu */}
          <li className="mb-2">
            <button
              onClick={toggleTargetsMenu}
              className={`flex items-center w-full p-3 ${
                isTargetViewActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              } transition-colors duration-200`}
            >
              <span className="mr-4"><FiTarget size={20} /></span>
              {!collapsed && (
                <>
                  <span className="flex-1">Cibles</span>
                  {targetsMenuOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </>
              )}
            </button>

            {/* Sous-menu Cibles */}
            {(targetsMenuOpen || collapsed) && (
              <ul className={`${collapsed ? 'pl-0' : 'pl-6'} mt-1`}>
                {targetsSubMenuItems.map((item) => (
                  <li key={item.id} className="mb-1">
                    <button
                      onClick={() => handleViewChange(item.id)}
                      className={`flex items-center w-full p-2 rounded-md ${
                        activeView === item.id
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                          : item.disabled 
                            ? 'text-gray-400 cursor-not-allowed dark:text-gray-500' 
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      } transition-colors duration-200`}
                      disabled={item.disabled}
                    >
                      <span className={`${collapsed ? 'mx-auto' : 'mr-3'}`}>{item.icon}</span>
                      {!collapsed && (
                        <span className="text-sm">{item.label}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
          
          {/* Menu Scanner avec sous-menu */}
          <li className="mb-2">
            <button
              onClick={toggleScannerMenu}
              className={`flex items-center w-full p-3 ${
                isScannerViewActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              } transition-colors duration-200`}
            >
              <span className="mr-4"><FiEye size={20} /></span>
              {!collapsed && (
                <>
                  <span className="flex-1">Scanner</span>
                  {scannerMenuOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </>
              )}
            </button>

            {/* Sous-menu Scanner */}
            {(scannerMenuOpen || collapsed) && (
              <ul className={`${collapsed ? 'pl-0' : 'pl-6'} mt-1`}>
                {scannerSubMenuItems.map((item) => (
                  <li key={item.id} className="mb-1">
                    <button
                      onClick={() => handleViewChange(item.id)}
                      className={`flex items-center w-full p-2 rounded-md ${
                        activeView === item.id
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                          : item.disabled 
                            ? 'text-gray-400 cursor-not-allowed dark:text-gray-500' 
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      } transition-colors duration-200`}
                      disabled={item.disabled}
                    >
                      <span className={`${collapsed ? 'mx-auto' : 'mr-3'}`}>{item.icon}</span>
                      {!collapsed && (
                        <span className="text-sm">{item.label}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
          
          {/* Menu E-Mails avec sous-menu */}
          <li className="mb-2">
            <button
              onClick={toggleEmailsMenu}
              className={`flex items-center w-full p-3 ${
                isEmailViewActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              } transition-colors duration-200`}
            >
              <span className="mr-4"><FiMail size={20} /></span>
              {!collapsed && (
                <>
                  <span className="flex-1">E-Mails</span>
                  {emailsMenuOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </>
              )}
            </button>

            {/* Sous-menu E-Mails */}
            {(emailsMenuOpen || collapsed) && (
              <ul className={`${collapsed ? 'pl-0' : 'pl-6'} mt-1`}>
                {emailsSubMenuItems.map((item) => (
                  <li key={item.id} className="mb-1">
                    <button
                      onClick={() => handleViewChange(item.id)}
                      className={`flex items-center w-full p-2 rounded-md ${
                        activeView === item.id
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                          : item.disabled 
                            ? 'text-gray-400 cursor-not-allowed dark:text-gray-500' 
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      } transition-colors duration-200`}
                      disabled={item.disabled}
                    >
                      <span className={`${collapsed ? 'mx-auto' : 'mr-3'}`}>{item.icon}</span>
                      {!collapsed && (
                        <span className="text-sm">{item.label}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
          
          {/* Menu Téléphones avec sous-menu */}
          <li className="mb-2">
            <button
              onClick={togglePhonesMenu}
              className={`flex items-center w-full p-3 ${
                isPhoneViewActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              } transition-colors duration-200`}
            >
              <span className="mr-4"><FcTabletAndroid size={20} /></span>
              {!collapsed && (
                <>
                  <span className="flex-1">Téléphones</span>
                  {phonesMenuOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </>
              )}
            </button>

            {/* Sous-menu Téléphones */}
            {(phonesMenuOpen || collapsed) && (
              <ul className={`${collapsed ? 'pl-0' : 'pl-6'} mt-1`}>
                {phonesSubMenuItems.map((item) => (
                  <li key={item.id} className="mb-1">
                    <button
                      onClick={() => handleViewChange(item.id)}
                      className={`flex items-center w-full p-2 rounded-md ${
                        activeView === item.id
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                          : item.disabled 
                            ? 'text-gray-400 cursor-not-allowed dark:text-gray-500' 
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      } transition-colors duration-200`}
                      disabled={item.disabled}
                    >
                      <span className={`${collapsed ? 'mx-auto' : 'mr-3'}`}>{item.icon}</span>
                      {!collapsed && (
                        <span className="text-sm">{item.label}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
          
          {/* Menu Security avec sous-menu */}
          <li className="mb-2">
            <button
              onClick={toggleSecurityMenu}
              className={`flex items-center w-full p-3 ${
                isSecurityViewActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              } transition-colors duration-200`}
            >
              <span className="mr-4"><FiShield size={20} /></span>
              {!collapsed && (
                <>
                  <span className="flex-1">Security</span>
                  {securityMenuOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </>
              )}
            </button>

            {/* Sous-menu Security */}
            {(securityMenuOpen || collapsed) && (
              <ul className={`${collapsed ? 'pl-0' : 'pl-6'} mt-1`}>
                {securitySubMenuItems.map((item) => (
                  <li key={item.id} className="mb-1">
                    <button
                      onClick={() => handleViewChange(item.id)}
                      className={`flex items-center w-full p-2 rounded-md ${
                        activeView === item.id
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                          : item.disabled 
                            ? 'text-gray-400 cursor-not-allowed dark:text-gray-500' 
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      } transition-colors duration-200`}
                      disabled={item.disabled}
                    >
                      <span className={`${collapsed ? 'mx-auto' : 'mr-3'}`}>{item.icon}</span>
                      {!collapsed && (
                        <span className="text-sm">{item.label}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
          
          {/* Menu IoT Search avec sous-menu */}
          <li className="mb-2">
            <button
              onClick={toggleIotSearchMenu}
              className={`flex items-center w-full p-3 justify-between ${
                isIotSearchViewActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              } transition-colors duration-200`}
            >
              <span className="mr-4"><FiGlobe size={20} /></span>
              {!collapsed && (
                <span>IoT Search</span>
              )}
              {!collapsed && (
                <span>
                  {iotSearchMenuOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </span>
              )}
            </button>
            
            {/* Sous-menu IoT Search */}
            {iotSearchMenuOpen && !collapsed && (
              <ul className="ml-6 mt-2 space-y-2">
                {iotSearchSubMenuItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => handleViewChange(item.id)}
                      className={`flex items-center w-full p-2 rounded-md ${
                        activeView === item.id
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                          : item.disabled 
                            ? 'text-gray-400 cursor-not-allowed dark:text-gray-500' 
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      } transition-colors duration-200`}
                      disabled={item.disabled}
                    >
                      <span className="mr-3">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
          
          {/* Menu Brute Force avec sous-menu */}
          <li className="mb-2">
            <button
              onClick={toggleBruteForceMenu}
              className={`flex items-center w-full p-3 ${
                isBruteForceViewActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              } transition-colors duration-200`}
            >
              <span className="mr-4"><FcKey size={20} /></span>
              {!collapsed && (
                <>
                  <span className="flex-1">Brute Force</span>
                  {bruteForceMenuOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </>
              )}
            </button>

            {/* Sous-menu Brute Force */}
            {(bruteForceMenuOpen || collapsed) && (
              <ul className={`${collapsed ? 'pl-0' : 'pl-6'} mt-1`}>
                {bruteForceSubMenuItems.map((item) => (
                  <li key={item.id} className="mb-1">
                    <button
                      onClick={() => handleViewChange(item.id)}
                      className={`flex items-center w-full p-2 rounded-md ${
                        activeView === item.id
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                          : item.disabled 
                            ? 'text-gray-400 cursor-not-allowed dark:text-gray-500' 
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      } transition-colors duration-200`}
                      disabled={item.disabled}
                    >
                      <span className={`${collapsed ? 'mx-auto' : 'mr-3'}`}>{item.icon}</span>
                      {!collapsed && (
                        <span className="text-sm">{item.label}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>

          {/* Menu System Planning avec sous-menu */}
          <li className="mb-2">
            <button
              onClick={toggleSystemPlanningMenu}
              className={`flex items-center w-full p-3 ${
                isSystemPlanningViewActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              } transition-colors duration-200`}
            >
              <span className="mr-4"><FcCalendar size={20} /></span>
              {!collapsed && (
                <>
                  <span className="flex-1">System Planning</span>
                  {systemPlanningMenuOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </>
              )}
            </button>

            {/* Sous-menu System Planning */}
            {(systemPlanningMenuOpen || collapsed) && (
              <ul className={`${collapsed ? 'pl-0' : 'pl-6'} mt-1`}>
                {systemPlanningSubMenuItems.map((item) => (
                  <li key={item.id} className="mb-1">
                    <button
                      onClick={() => handleViewChange(item.id)}
                      className={`flex items-center w-full p-2 rounded-md ${
                        activeView === item.id
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                          : item.disabled 
                            ? 'text-gray-400 cursor-not-allowed dark:text-gray-500' 
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      } transition-colors duration-200`}
                      disabled={item.disabled}
                    >
                      <span className={`${collapsed ? 'mx-auto' : 'mr-3'}`}>{item.icon}</span>
                      {!collapsed && (
                        <span className="text-sm">{item.label}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>

          {/* Menu Sniffing avec sous-menu */}
          <li className="mb-2">
            <button
              onClick={toggleSniffingMenu}
              className={`flex items-center w-full p-3 ${
                isSniffingViewActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              } transition-colors duration-200`}
            >
              <span className="mr-4"><FiActivity size={20} /></span>
              {!collapsed && (
                <>
                  <span className="flex-1">Sniffing</span>
                  {sniffingMenuOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </>
              )}
            </button>

            {/* Sous-menu Sniffing */}
            {(sniffingMenuOpen || collapsed) && (
              <ul className={`${collapsed ? 'pl-0' : 'pl-6'} mt-1`}>
                {sniffingSubMenuItems.map((item) => (
                  <li key={item.id} className="mb-1">
                    <button
                      onClick={() => handleViewChange(item.id)}
                      className={`flex items-center w-full p-2 rounded-md ${
                        activeView === item.id
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                          : item.disabled 
                            ? 'text-gray-400 cursor-not-allowed dark:text-gray-500' 
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      } transition-colors duration-200`}
                      disabled={item.disabled}
                    >
                      <span className={`${collapsed ? 'mx-auto' : 'mr-3'}`}>{item.icon}</span>
                      {!collapsed && (
                        <span className="text-sm">{item.label}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>

          {/* Menu Miscellaneous avec sous-menu */}
          <li className="mb-2">
            <button
              onClick={toggleMiscellaneousMenu}
              className={`flex items-center w-full p-3 ${
                isMiscellaneousViewActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              } transition-colors duration-200`}
            >
              <span className="mr-4"><FiTool size={20} /></span>
              {!collapsed && (
                <>
                  <span className="flex-1">Miscellaneous</span>
                  {miscellaneousMenuOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </>
              )}
            </button>

            {/* Sous-menu Miscellaneous */}
            {(miscellaneousMenuOpen || collapsed) && (
              <ul className={`${collapsed ? 'pl-0' : 'pl-6'} mt-1`}>
                {miscellaneousSubMenuItems.map((item) => (
                  <li key={item.id} className="mb-1">
                    <button
                      onClick={() => handleViewChange(item.id)}
                      className={`flex items-center w-full p-2 rounded-md ${
                        activeView === item.id
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                          : item.disabled 
                            ? 'text-gray-400 cursor-not-allowed dark:text-gray-500' 
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      } transition-colors duration-200`}
                      disabled={item.disabled}
                    >
                      <span className={`${collapsed ? 'mx-auto' : 'mr-3'}`}>{item.icon}</span>
                      {!collapsed && (
                        <span className="text-sm">{item.label}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
          
          {/* Menu Injector avec sous-menu */}
          <li className="mb-2">
            <button
              onClick={toggleInjectorMenu}
              className={`flex items-center w-full p-3 ${
                isInjectorViewActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              } transition-colors duration-200`}
            >
              <span className="mr-4"><PiSyringeFill size={20} /></span>
              {!collapsed && (
                <>
                  <span className="flex-1">Injector</span>
                  {injectorMenuOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </>
              )}
            </button>

            {/* Sous-menu Injector */}
            {(injectorMenuOpen || collapsed) && (
              <ul className={`${collapsed ? 'pl-0' : 'pl-6'} mt-1`}>
                {injectorSubMenuItems.map((item) => (
                  <li key={item.id} className="mb-1">
                    <button
                      onClick={() => !item.disabled && handleViewChange(item.id)}
                      className={`flex items-center w-full p-2 rounded-md ${
                        activeView === item.id
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                          : item.disabled 
                            ? 'text-gray-400 cursor-not-allowed dark:text-gray-500' 
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      } transition-colors duration-200`}
                      disabled={item.disabled}
                    >
                      <span className={`${collapsed ? 'mx-auto' : 'mr-3'}`}>{item.icon}</span>
                      {!collapsed && (
                        <span className="text-sm">{item.label}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
          
          {/* Menu M4lwar3b1tes avec sous-menu */}
          <li className="mb-2">
            <button
              onClick={toggleMalwareMenu}
              className={`flex items-center w-full p-3 ${
                isMalwareViewActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              } transition-colors duration-200`}
            >
              <span className="mr-4"><FcBiohazard size={20} /></span>
              {!collapsed && (
                <>
                  <span className="flex-1">M4lwar3b1tes</span>
                  {malwareMenuOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </>
              )}
            </button>

            {/* Sous-menu M4lwar3b1tes */}
            {(malwareMenuOpen || collapsed) && (
              <ul className={`${collapsed ? 'pl-0' : 'pl-6'} mt-1`}>
                {malwareSubMenuItems.map((item) => (
                  <li key={item.id} className="mb-1">
                    <button
                      onClick={() => handleViewChange(item.id)}
                      className={`flex items-center w-full p-2 rounded-md ${
                        activeView === item.id
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                          : item.disabled 
                            ? 'text-gray-400 cursor-not-allowed dark:text-gray-500' 
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      } transition-colors duration-200`}
                      disabled={item.disabled}
                    >
                      <span className={`${collapsed ? 'mx-auto' : 'mr-3'}`}>{item.icon}</span>
                      {!collapsed && (
                        <span className="text-sm">{item.label}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
          
          {/* Menu CC avec sous-menu */}
          <li className="mb-2">
            <button
              onClick={toggleCcMenu}
              className={`flex items-center w-full p-3 ${
                isCcViewActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              } transition-colors duration-200`}
            >
              <span className="mr-4"><FcMoneyTransfer size={20} /></span>
              {!collapsed && (
                <>
                  <span className="flex-1">Cards</span>
                  {ccMenuOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </>
              )}
            </button>

            {/* Sous-menu CC */}
            {(ccMenuOpen || collapsed) && (
              <ul className={`${collapsed ? 'pl-0' : 'pl-6'} mt-1`}>
                {ccSubMenuItems.map((item) => (
                  <li key={item.id} className="mb-1">
                    <button
                      onClick={() => handleViewChange(item.id)}
                      disabled={item.disabled}
                      className={`flex items-center w-full p-2 pl-3 ${
                        activeView === item.id
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-gray-700 dark:text-indigo-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      } ${
                        item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                      } text-sm rounded-md transition-colors duration-200`}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {!collapsed && <span>{item.label}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
          
          {/* Menu OSINT avec sous-menu */}
          <li className="mb-2">
            <button
              onClick={toggleOsintMenu}
              className={`flex items-center w-full p-3 ${
                activeView === 'osintphonesemails'
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              } transition-colors duration-200`}
            >
              <span className="mr-4"><FiGlobe size={20} /></span>
              {!collapsed && (
                <>
                  <span className="flex-1">OSINT</span>
                  {osintMenuOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </>
              )}
            </button>

            {/* Sous-menu OSINT */}
            {(osintMenuOpen || collapsed) && (
              <ul className={`${collapsed ? 'pl-0' : 'pl-6'} mt-1`}>
                {osintSubMenuItems.map((item) => (
                  <li key={item.id} className="mb-1">
                    <button
                      onClick={() => handleViewChange(item.id)}
                      disabled={item.disabled}
                      className={`flex items-center w-full p-2 pl-3 ${
                        activeView === item.id
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-gray-700 dark:text-indigo-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      } ${
                        item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                      } text-sm rounded-md transition-colors duration-200`}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {!collapsed && <span>{item.label}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar; 