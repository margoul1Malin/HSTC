"""
Module de configuration pour HakBoardCrawler
"""

import json
import logging
import os
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

class CrawlerConfig:
    """
    Gère la configuration du crawler
    """
    
    def __init__(self, config_file: Optional[str] = None):
        """
        Initialise la configuration
        
        Args:
            config_file: Chemin vers un fichier de configuration JSON (optionnel)
        """
        # Configuration par défaut
        self.scan_depth = 3             # Profondeur maximale d'exploration
        self.threads = 5                # Nombre de threads pour les requêtes parallèles
        self.timeout = 10               # Timeout des requêtes (secondes)
        self.delay = 1.0                # Délai entre les requêtes (secondes)
        self.user_agent_rotate = True   # Rotation des user-agents
        self.user_agent = None          # User-agent spécifique (si rotation désactivée)
        self.respect_robots = True      # Respecter robots.txt
        self.proxy = None               # Proxy à utiliser
        self.cookies = None             # Cookies à inclure dans les requêtes
        self.headers = {}               # En-têtes HTTP additionnelles
        self.verify_ssl = True          # Vérifier les certificats SSL
        self.follow_redirects = True    # Suivre les redirections
        self.max_file_size = 10485760   # Taille maximale des fichiers à télécharger (10 MB)
        self.output_dir = "reports"     # Répertoire de sortie
        self.log_file = None            # Fichier de log
        self.exclude_patterns = []      # Patterns d'URL à exclure
        self.include_patterns = []      # Patterns d'URL à inclure
        self.sensitive_extensions = [   # Extensions de fichiers sensibles à vérifier
            ".env", ".git", ".svn", ".htaccess", ".htpasswd", 
            ".bak", ".backup", ".swp", ".old", ".orig", ".tmp",
            ".sql", ".db", ".sqlite", ".sqlite3", ".mdb", ".psql",
            ".log", ".conf", ".config", ".xml", ".json", ".yml", ".yaml",
            ".ini", ".csv", ".bat", ".sh", "wp-config.php", "config.php"
        ]
        
        # Options d'activation des modules
        self.enable_metadata = True      # Activer l'extraction de métadonnées
        self.enable_sitemap = True       # Activer la génération de la carte du site
        self.enable_api_detection = True # Activer la détection des API
        self.enable_stealth = True       # Activer le mode furtif (rotation des user-agents, etc.)
        
        # Options spécifiques pour la génération de la carte du site
        self.sitemap_options = {
            "extract_scripts": True,     # Extraire les scripts JS
            "extract_styles": True,      # Extraire les feuilles de style
            "extract_images": True,      # Extraire les images
            "extract_links": True,       # Extraire les liens
            "extract_forms": True,       # Extraire les formulaires
            "extract_frames": True,      # Extraire les iframes
            "extract_meta": True         # Extraire les métadonnées
        }
        
        # Options spécifiques pour l'extraction des métadonnées
        self.metadata_options = {
            "extract_images": True,      # Extraire les métadonnées des images
            "extract_pdfs": True,        # Extraire les métadonnées des PDFs
            "extract_docs": True,        # Extraire les métadonnées des documents
            "extract_archives": False,   # Extraire les métadonnées des archives
            "download_files": True,      # Télécharger les fichiers pour extraction
            "max_files": 50              # Nombre maximum de fichiers à analyser
        }
        
        # Options spécifiques pour le scanner de vulnérabilités
        self.scanner_options = {
            "check_headers": True,       # Vérifier les en-têtes de sécurité
            "check_cors": True,          # Vérifier la configuration CORS
            "check_csp": True,           # Vérifier la politique de sécurité du contenu
            "check_exposed_files": True, # Vérifier les fichiers exposés
            "check_sensitive_data": True # Vérifier les données sensibles (emails, tokens, etc.)
        }
        
        # Frameworks à détecter
        self.frameworks = [
            "wordpress", "drupal", "joomla", "magento", "nextjs", "nuxtjs", 
            "react", "angular", "vue", "laravel", "django", "flask", "symfony", 
            "spring", "express", "rails", "aspnet"
        ]
        
        # Chemins des API à vérifier par framework
        self.framework_apis = {
            "wordpress": ["/wp-json/", "/wp-admin/admin-ajax.php"],
            "drupal": ["/jsonapi/", "/user/login", "/node/"],
            "nextjs": ["/_next/data/"],
            "django": ["/admin/", "/api/"],
            "laravel": ["/api/"],
            "springboot": ["/actuator/"],
            "express": ["/api/", "/graphql"],
            "aspnet": ["/api/"]
        }
        
        # Charger la configuration depuis un fichier
        if config_file and os.path.isfile(config_file):
            self.load_config(config_file)
        
    def load_config(self, config_file: str) -> None:
        """
        Charge la configuration depuis un fichier JSON
        
        Args:
            config_file: Chemin vers le fichier de configuration
        """
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
                
            # Mettre à jour les paramètres
            for key, value in config.items():
                if hasattr(self, key):
                    setattr(self, key, value)
                    
            logger.info(f"Configuration chargée depuis {config_file}")
        except Exception as e:
            logger.error(f"Erreur lors du chargement de la configuration: {str(e)}")
    
    def save_config(self, config_file: str) -> None:
        """
        Sauvegarde la configuration dans un fichier JSON
        
        Args:
            config_file: Chemin vers le fichier de sortie
        """
        try:
            # Créer le dictionnaire de configuration
            config = {}
            for key in dir(self):
                if not key.startswith('__') and not callable(getattr(self, key)):
                    config[key] = getattr(self, key)
            
            # Supprimer les méthodes
            for key in list(config.keys()):
                if callable(config[key]):
                    del config[key]
            
            # Écrire dans le fichier
            with open(config_file, 'w') as f:
                json.dump(config, f, indent=4)
                
            logger.info(f"Configuration sauvegardée dans {config_file}")
        except Exception as e:
            logger.error(f"Erreur lors de la sauvegarde de la configuration: {str(e)}")
    
    def update(self, config_dict: Dict[str, Any]) -> None:
        """
        Met à jour la configuration avec les valeurs fournies
        
        Args:
            config_dict: Dictionnaire des paramètres à mettre à jour
        """
        for key, value in config_dict.items():
            if hasattr(self, key):
                setattr(self, key, value)
                logger.debug(f"Paramètre {key} mis à jour à {value}")
            else:
                logger.warning(f"Paramètre inconnu: {key}")
    
    def get_user_agent(self) -> str:
        """
        Retourne un user-agent aléatoire ou celui défini par l'utilisateur
        
        Returns:
            User-agent à utiliser pour les requêtes
        """
        if not self.user_agent_rotate or self.user_agent:
            return self.user_agent or "HakBoardCrawler/1.0"
        
        # Liste de User-Agents populaires
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
            "Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59"
        ]
        
        import random
        return random.choice(user_agents)
    
    def get_proxy_dict(self) -> Optional[Dict[str, str]]:
        """
        Retourne la configuration du proxy au format attendu par requests
        
        Returns:
            Dictionnaire de configuration du proxy ou None
        """
        if not self.proxy:
            return None
            
        return {
            "http": self.proxy,
            "https": self.proxy
        }
    
    def get_headers(self) -> Dict[str, str]:
        """
        Retourne les en-têtes HTTP pour les requêtes
        
        Returns:
            Dictionnaire des en-têtes HTTP
        """
        headers = {
            "User-Agent": self.get_user_agent(),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "DNT": "1"
        }
        
        # Ajouter les en-têtes personnalisées
        headers.update(self.headers or {})
        
        return headers
    
    def is_url_allowed(self, url: str) -> bool:
        """
        Vérifie si une URL est autorisée selon les patterns d'inclusion/exclusion
        
        Args:
            url: URL à vérifier
            
        Returns:
            True si l'URL est autorisée, False sinon
        """
        import re
        
        # Vérifier les patterns d'exclusion
        for pattern in self.exclude_patterns:
            if re.search(pattern, url):
                return False
        
        # Vérifier les patterns d'inclusion si définis
        if self.include_patterns:
            for pattern in self.include_patterns:
                if re.search(pattern, url):
                    return True
            return False
        
        # Si aucun pattern d'inclusion n'est défini, autoriser par défaut
        return True 