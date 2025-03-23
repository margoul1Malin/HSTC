"""
Module de détection des vulnérabilités et analyse de sécurité
"""

import logging
import re
import json
import time
import os
from urllib.parse import urlparse, urljoin, parse_qs
import requests
from typing import Dict, List, Any, Optional, Set, Tuple
from bs4 import BeautifulSoup
import concurrent.futures

from ..config import CrawlerConfig

logger = logging.getLogger(__name__)

class VulnerabilityScanner:
    """
    Scanner de vulnérabilités et d'exposés sensibles
    """
    
    # Listes de chemins sensibles à vérifier
    SENSITIVE_FILES = [
        "/.git/HEAD",
        "/.git/config",
        "/.env",
        "/.env.local",
        "/.env.development",
        "/.env.production",
        "/wp-config.php",
        "/config.php",
        "/configuration.php",
        "/config.js",
        "/config.json",
        "/credentials.json",
        "/database.yml",
        "/settings.json",
        "/app.json",
        "/backup.sql",
        "/backup.zip",
        "/backup.tar.gz",
        "/dump.sql",
        "/phpinfo.php",
        "/info.php",
        "/test.php",
        "/admin/login",
        "/login.html",
        "/robots.txt",
        "/crossdomain.xml",
        "/sitemap.xml",
        "/.htaccess",
        "/.dockerignore",
        "/Dockerfile",
        "/docker-compose.yml",
        "/package.json",
        "/package-lock.json",
        "/composer.json",
        "/composer.lock",
        "/yarn.lock",
        "/README.md",
        "/CHANGELOG.md",
        "/LICENSE",
        "/node_modules/",
        "/vendor/",
        "/logs/",
        "/debug/",
        "/temp/",
        "/uploads/",
        "/backups/"
    ]
    
    # En-têtes HTTP à vérifier pour les problèmes de sécurité
    SECURITY_HEADERS = {
        "Content-Security-Policy": {
            "required": False,
            "description": "Empêche les attaques XSS en spécifiant les sources de contenu autorisées."
        },
        "X-Content-Type-Options": {
            "required": True,
            "description": "Empêche le navigateur d'interpréter les fichiers comme un type MIME différent."
        },
        "X-Frame-Options": {
            "required": True,
            "description": "Protège contre les attaques de clickjacking."
        },
        "X-XSS-Protection": {
            "required": True,
            "description": "Filtre de base pour les attaques XSS dans les navigateurs plus anciens."
        },
        "Strict-Transport-Security": {
            "required": True,
            "description": "Force les connexions via HTTPS plutôt que HTTP."
        },
        "Referrer-Policy": {
            "required": False,
            "description": "Contrôle la quantité d'informations envoyées dans l'en-tête Referer."
        },
        "Permissions-Policy": {
            "required": False,
            "description": "Contrôle les fonctionnalités du navigateur autorisées (remplace Feature-Policy)."
        },
        "Access-Control-Allow-Origin": {
            "required": False,
            "description": "Indique si la ressource peut être partagée avec une autre origine."
        }
    }
    
    def __init__(self, config: Optional[Any] = None):
        """
        Initialise le scanner de vulnérabilités.
        
        Args:
            config: Configuration du scanner
        """
        self.config = config or CrawlerConfig()
        self.session = requests.Session()
        
        # Configuration de la session
        if self.config.user_agent_rotate:
            self.session.headers.update({"User-Agent": self.config.get_user_agent()})
        else:
            self.session.headers.update({"User-Agent": self.config.user_agent or "HakBoardCrawler/1.0"})
        
        # Configuration du proxy si nécessaire
        if self.config.proxy:
            self.session.proxies = {
                "http": self.config.proxy,
                "https": self.config.proxy
            }
        
        # Ensemble pour stocker les URLs déjà visitées
        self.visited_urls = set()
        
        # Ensemble pour stocker les endpoints d'API détectés
        self.api_endpoints = set()
        
        # Dictionnaire pour le mapping du site
        self.site_map = {}
        
        logger.info("Scanner de vulnérabilités initialisé")
    
    def scan_vulnerabilities(self, target: str) -> Dict[str, Any]:
        """
        Effectue un scan de vulnérabilités sur la cible
        
        Args:
            target: URL ou domaine cible
            
        Returns:
            Dictionnaire des vulnérabilités trouvées
        """
        logger.info(f"Démarrage du scan de vulnérabilités pour {target}")
        
        # S'assurer que l'URL est complète
        if not target.startswith(("http://", "https://")):
            target = f"http://{target}"
        
        results = {
            "target": target,
            "cors_issues": [],
            "csp_issues": [],
            "header_issues": [],
            "exposed_files": [],
            "potential_vulnerabilities": []
        }
        
        # Analyser les en-têtes de sécurité
        headers_analysis = self.analyze_headers(target)
        results["header_issues"] = headers_analysis.get("issues", [])
        
        # Scanner les fichiers sensibles
        sensitive_files = self.scan_sensitive_files(target)
        results["exposed_files"] = sensitive_files.get("exposed_files", [])
        
        # Rechercher d'autres vulnérabilités potentielles
        self._scan_for_vulnerabilities(target, results)
        
        logger.info(f"Scan de vulnérabilités terminé pour {target}")
        return results
    
    def analyze_headers(self, url: str) -> Dict[str, Any]:
        """
        Analyse les en-têtes HTTP pour les problèmes de sécurité
        
        Args:
            url: URL à analyser
            
        Returns:
            Dictionnaire des problèmes d'en-têtes trouvés
        """
        logger.info(f"Analyse des en-têtes de sécurité pour {url}")
        
        results = {
            "url": url,
            "headers": {},
            "issues": [],
            "score": 0,
            "max_score": len([h for h in self.SECURITY_HEADERS.values() if h["required"]])
        }
        
        try:
            # Effectuer une requête HEAD pour récupérer les en-têtes
            response = self.session.head(url, timeout=self.config.timeout)
            
            # Analyser chaque en-tête de sécurité
            for header, details in self.SECURITY_HEADERS.items():
                header_value = response.headers.get(header)
                results["headers"][header] = header_value
                
                if details["required"] and not header_value:
                    results["issues"].append({
                        "severity": "high" if details["required"] else "medium",
                        "header": header,
                        "description": f"En-tête {header} manquant. {details['description']}"
                    })
                elif header_value:
                    # Incrémenter le score de sécurité si l'en-tête est présent
                    if details["required"]:
                        results["score"] += 1
                    
                    # Analyse spécifique pour certains en-têtes
                    if header == "Content-Security-Policy":
                        csp_issues = self._analyze_csp(header_value)
                        for issue in csp_issues:
                            results["issues"].append({
                                "severity": "medium",
                                "header": header,
                                "description": issue
                            })
                    
                    elif header == "Access-Control-Allow-Origin":
                        if header_value == "*":
                            results["issues"].append({
                                "severity": "medium",
                                "header": header,
                                "description": "CORS est configuré pour autoriser toutes les origines (*), ce qui peut présenter un risque de sécurité."
                            })
            
            # Rechercher des en-têtes potentiellement risqués
            for header, value in response.headers.items():
                if header.lower() in ["server", "x-powered-by", "x-aspnet-version", "x-aspnetmvc-version"]:
                    results["headers"][header] = value
                    results["issues"].append({
                        "severity": "low",
                        "header": header,
                        "description": f"L'en-tête {header} révèle des informations sur la technologie utilisée: {value}"
                    })
            
            logger.info(f"Analyse des en-têtes terminée avec un score de {results['score']}/{results['max_score']}")
        
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse des en-têtes: {str(e)}")
            results["issues"].append({
                "severity": "error",
                "header": "N/A",
                "description": f"Erreur lors de l'analyse: {str(e)}"
            })
        
        return results
    
    def _analyze_csp(self, csp_value: str) -> List[str]:
        """
        Analyse la politique de sécurité du contenu (CSP)
        
        Args:
            csp_value: Valeur de l'en-tête CSP
            
        Returns:
            Liste des problèmes détectés
        """
        issues = []
        
        # Vérifier si unsafe-inline est utilisé
        if "unsafe-inline" in csp_value:
            issues.append("La directive 'unsafe-inline' est utilisée dans le CSP, ce qui peut permettre des attaques XSS.")
        
        # Vérifier si unsafe-eval est utilisé
        if "unsafe-eval" in csp_value:
            issues.append("La directive 'unsafe-eval' est utilisée dans le CSP, ce qui peut permettre l'exécution de code arbitraire.")
        
        # Vérifier si des sources génériques sont utilisées
        if "http:" in csp_value or "*" in csp_value:
            issues.append("Des sources génériques (http: ou *) sont utilisées dans le CSP, ce qui réduit son efficacité.")
        
        return issues
        
    def scan_sensitive_files(self, url: str) -> Dict[str, Any]:
        """
        Recherche des fichiers sensibles exposés
        
        Args:
            url: URL de base à scanner
            
        Returns:
            Dictionnaire des fichiers sensibles trouvés
        """
        logger.info(f"Recherche de fichiers sensibles pour {url}")
        
        results = {
            "url": url,
            "exposed_files": [],
            "total_checked": 0,
            "total_found": 0
        }
        
        # S'assurer que l'URL se termine par un slash
        if not url.endswith("/"):
            url = url + "/"
        
        # Créer une liste d'URLs à vérifier
        urls_to_check = [urljoin(url, path) for path in self.SENSITIVE_FILES]
        results["total_checked"] = len(urls_to_check)
        
        # Définir une fonction pour vérifier une URL spécifique
        def check_url(target_url):
            try:
                # Utiliser HEAD d'abord pour être moins intrusif
                response = self.session.head(target_url, timeout=self.config.timeout, allow_redirects=False)
                
                # Si le serveur ne supporte pas HEAD ou renvoie un code 405, essayer GET
                if response.status_code == 405:
                    response = self.session.get(target_url, timeout=self.config.timeout, allow_redirects=False, stream=True)
                    # Lire juste le début pour éviter de télécharger des fichiers volumineux
                    response.raw.read(1024)
                    response.close()
                
                # Vérifier le code de statut
                if 200 <= response.status_code < 300:
                    path = urlparse(target_url).path
                    return {
                        "url": target_url,
                        "path": path,
                        "status_code": response.status_code,
                        "content_type": response.headers.get("Content-Type", ""),
                        "content_length": response.headers.get("Content-Length", "")
                    }
                
                return None
                
            except Exception as e:
                logger.debug(f"Erreur lors de la vérification de {target_url}: {str(e)}")
                return None
        
        # Utiliser un ThreadPoolExecutor pour vérifier plusieurs URLs simultanément
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(check_url, url) for url in urls_to_check]
            
            for future in concurrent.futures.as_completed(futures):
                try:
                    result = future.result()
                    if result:
                        results["exposed_files"].append(result)
                except Exception as e:
                    logger.error(f"Erreur dans le thread de vérification: {str(e)}")
        
        results["total_found"] = len(results["exposed_files"])
        logger.info(f"Scan terminé. {results['total_found']} fichiers sensibles trouvés sur {results['total_checked']} vérifiés.")
        
        return results
    
    def detect_api_endpoints(self, url: str) -> Dict[str, Any]:
        """
        Détecte les endpoints d'API potentiels
        
        Args:
            url: URL de base à scanner
            
        Returns:
            Dictionnaire des endpoints API détectés
        """
        logger.info(f"Recherche d'endpoints API pour {url}")
        
        results = {
            "url": url,
            "endpoints": [],
            "total_found": 0
        }
        
        # Réinitialiser les endpoints détectés
        self.api_endpoints = set()
        
        # Exploration du site pour trouver des endpoints API
        try:
            self._crawl_for_api_endpoints(url, depth=0, max_depth=self.config.scan_depth)
            
            # Convertir les résultats
            for endpoint in self.api_endpoints:
                results["endpoints"].append({
                    "url": endpoint,
                    "method": "GET",  # Par défaut, nous ne pouvons pas déterminer les méthodes sans tests
                    "parameters": self._extract_url_params(endpoint)
                })
            
            results["total_found"] = len(results["endpoints"])
            logger.info(f"Détection d'API terminée. {results['total_found']} endpoints trouvés.")
        
        except Exception as e:
            logger.error(f"Erreur lors de la détection d'endpoints API: {str(e)}")
        
        return results
    
    def _crawl_for_api_endpoints(self, url: str, depth: int = 0, max_depth: int = 3):
        """
        Explore récursivement le site pour trouver des endpoints API
        
        Args:
            url: URL à explorer
            depth: Profondeur actuelle
            max_depth: Profondeur maximale d'exploration
        """
        # Vérifier si nous sommes trop profonds ou si l'URL a déjà été visitée
        if depth > max_depth or url in self.visited_urls:
            return
        
        # Marquer l'URL comme visitée
        self.visited_urls.add(url)
        
        try:
            # Télécharger la page
            response = self.session.get(url, timeout=self.config.timeout)
            if response.status_code != 200:
                return
            
            # Analyser le contenu
            soup = BeautifulSoup(response.text, "html.parser")
            
            # Rechercher des motifs d'API dans les scripts
            scripts = soup.find_all("script")
            for script in scripts:
                if script.string:
                    # Rechercher des patterns d'URL d'API
                    api_patterns = [
                        r'["\'](https?:\/\/[^"\']*api[^"\']*)["\']',
                        r'["\'](\/api\/[^"\']*)["\']',
                        r'["\'](\/v\d+\/[^"\']*)["\']',
                        r'["\'](\/rest\/[^"\']*)["\']',
                        r'["\'](\/graphql[^"\']*)["\']',
                        r'["\'](\/gql[^"\']*)["\']'
                    ]
                    
                    # Patterns spécifiques aux frameworks
                    framework_patterns = [
                        # Next.js
                        r'["\'](\/\_next\/data\/[^"\']*)["\']',
                        r'["\'](\/\_next\/static\/[^"\']*)["\']',
                        r'["\'](\/pages\/api\/[^"\']*)["\']',
                        # Django
                        r'["\'](\/admin\/api\/[^"\']*)["\']',
                        r'["\'](\/django-admin\/[^"\']*)["\']',
                        # WordPress
                        r'["\'](\/wp-json\/[^"\']*)["\']',
                        r'["\'](\/wp-admin\/admin-ajax.php)["\']',
                        # Vue/Vite
                        r'["\'](\/src\/api\/[^"\']*)["\']',
                        r'["\'](\/assets\/[^"\']*\.js)["\']',
                        # Laravel
                        r'["\'](\/api\/[^"\']*)["\']',
                        r'["\'](\/sanctum\/csrf-cookie)["\']',
                        # React
                        r'["\'](\/static\/js\/[^"\']*)["\']',
                        # Angular
                        r'["\'](\/assets\/[^"\']*)["\']',
                        r'["\'](\/api\/[^"\']*)["\']'
                    ]
                    
                    # Ajouter les patterns de frameworks
                    api_patterns.extend(framework_patterns)
                    
                    for pattern in api_patterns:
                        for match in re.finditer(pattern, script.string):
                            api_url = match.group(1)
                            if not api_url.startswith(("http://", "https://")):
                                parsed_url = urlparse(url)
                                base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
                                api_url = urljoin(base_url, api_url)
                            
                            self.api_endpoints.add(api_url)
            
            # Détecter les frameworks courants
            self._detect_frameworks(soup, url)
            
            # Collecter les liens pour exploration
            links = []
            for a in soup.find_all("a", href=True):
                href = a["href"]
                if not href.startswith(("http://", "https://")):
                    parsed_url = urlparse(url)
                    base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
                    href = urljoin(base_url, href)
                
                # Vérifier si le lien est sur le même domaine
                if urlparse(url).netloc == urlparse(href).netloc:
                    links.append(href)
            
            # Explorer les liens trouvés
            for link in links[:10]:  # Limiter à 10 liens par page pour éviter l'explosion
                self._crawl_for_api_endpoints(link, depth + 1, max_depth)
        
        except Exception as e:
            logger.error(f"Erreur lors de l'exploration pour API endpoints: {str(e)}")
    
    def _detect_frameworks(self, soup: BeautifulSoup, url: str):
        """
        Détecte les frameworks utilisés et explore les chemins spécifiques
        
        Args:
            soup: Objet BeautifulSoup de la page
            url: URL de base
        """
        parsed_url = urlparse(url)
        base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
        
        # Détection de Next.js
        next_indicators = [
            soup.find("div", id="__next"),
            soup.find("script", src=lambda s: s and "_next/static" in s),
            soup.find("link", href=lambda h: h and "_next/static" in h)
        ]
        if any(next_indicators):
            logger.info(f"Framework Next.js détecté sur {url}")
            # Explorer les chemins spécifiques à Next.js
            next_paths = ["/_next/data/", "/_next/static/", "/api/"]
            for path in next_paths:
                api_url = urljoin(base_url, path)
                self.api_endpoints.add(api_url)
        
        # Détection de WordPress
        wp_indicators = [
            soup.find("link", attrs={"rel": "https://api.w.org/"}),
            soup.find("meta", attrs={"name": "generator", "content": lambda c: c and "WordPress" in c}),
            soup.find("script", src=lambda s: s and "wp-includes" in s)
        ]
        if any(wp_indicators):
            logger.info(f"Framework WordPress détecté sur {url}")
            # Explorer les chemins spécifiques à WordPress
            wp_paths = ["/wp-json/wp/v2/", "/wp-admin/admin-ajax.php"]
            for path in wp_paths:
                api_url = urljoin(base_url, path)
                self.api_endpoints.add(api_url)
        
        # Détection de Django
        django_indicators = [
            soup.find("meta", attrs={"name": "generator", "content": lambda c: c and "Django" in c}),
            soup.find("script", src=lambda s: s and "django" in s)
        ]
        if any(django_indicators):
            logger.info(f"Framework Django détecté sur {url}")
            # Explorer les chemins spécifiques à Django
            django_paths = ["/admin/", "/api/", "/static/"]
            for path in django_paths:
                api_url = urljoin(base_url, path)
                self.api_endpoints.add(api_url)
        
        # Détection de Laravel
        laravel_indicators = [
            soup.find("meta", attrs={"name": "csrf-token"}),
            soup.find("script", string=lambda s: s and "Laravel" in s),
            soup.find("script", src=lambda s: s and "vendor/laravel" in s)
        ]
        if any(laravel_indicators):
            logger.info(f"Framework Laravel détecté sur {url}")
            # Explorer les chemins spécifiques à Laravel
            laravel_paths = ["/api/", "/sanctum/csrf-cookie", "/storage/"]
            for path in laravel_paths:
                api_url = urljoin(base_url, path)
                self.api_endpoints.add(api_url)
        
        # Détection de Vue/Vite
        vue_indicators = [
            soup.find("div", id="app"),
            soup.find("script", src=lambda s: s and ".vue" in s),
            soup.find("script", src=lambda s: s and "vue.js" in s),
            soup.find("script", src=lambda s: s and "vite" in s)
        ]
        if any(vue_indicators):
            logger.info(f"Framework Vue.js/Vite détecté sur {url}")
            # Explorer les chemins spécifiques à Vue.js/Vite
            vue_paths = ["/src/api/", "/assets/"]
            for path in vue_paths:
                api_url = urljoin(base_url, path)
                self.api_endpoints.add(api_url)
    
    def _extract_url_params(self, url: str) -> List[str]:
        """
        Extrait les paramètres d'une URL
        
        Args:
            url: URL à analyser
            
        Returns:
            Liste des paramètres détectés
        """
        parsed_url = urlparse(url)
        params = []
        
        if parsed_url.query:
            query_params = parse_qs(parsed_url.query)
            for param in query_params.keys():
                params.append(param)
        
        return params
    
    def _scan_for_vulnerabilities(self, url: str, results: Dict[str, Any]):
        """
        Recherche d'autres vulnérabilités potentielles
        
        Args:
            url: URL à scanner
            results: Dictionnaire pour stocker les résultats
        """
        # Ce code serait plus complexe dans une implémentation réelle
        # Ici, nous simulons la détection de quelques vulnérabilités courantes
        
        try:
            # Simuler la détection de certaines vulnérabilités
            # Dans une implémentation réelle, il y aurait des tests plus poussés
            
            response = self.session.get(url, timeout=self.config.timeout)
            
            # Vérifier les formulaires sans CSRF protection
            soup = BeautifulSoup(response.text, "html.parser")
            forms = soup.find_all("form")
            
            for form in forms:
                # Vérifier si un token CSRF est présent
                csrf_fields = form.find_all("input", attrs={"name": re.compile("csrf|token", re.I)})
                if not csrf_fields:
                    results["potential_vulnerabilities"].append({
                        "type": "csrf",
                        "severity": "medium",
                        "url": url,
                        "description": "Formulaire potentiellement vulnérable aux attaques CSRF"
                    })
            
            # Vérifier les cookies sans attributs de sécurité
            if "Set-Cookie" in response.headers:
                cookies = response.headers.get("Set-Cookie")
                if "secure" not in cookies.lower() or "httponly" not in cookies.lower():
                    results["potential_vulnerabilities"].append({
                        "type": "insecure_cookie",
                        "severity": "medium",
                        "url": url,
                        "description": "Cookies sans attributs de sécurité (Secure, HttpOnly)"
                    })
            
            logger.info(f"Scan de vulnérabilités supplémentaires terminé pour {url}")
            
        except Exception as e:
            logger.error(f"Erreur lors du scan de vulnérabilités: {str(e)}")
    
    def generate_site_map(self, url: str) -> Dict[str, Any]:
        """
        Génère une carte du site
        
        Args:
            url: URL de base à explorer
            
        Returns:
            Dictionnaire contenant la carte du site
        """
        logger.info(f"Génération de la carte du site pour {url}")
        
        site_map = {
            "url": url,
            "nodes": [],
            "resources": {
                "images": [],
                "scripts": [],
                "stylesheets": [],
                "links": [],
                "forms": [],
                "frames": [],
                "fonts": [],
                "media": []
            },
            "total_pages": 0,
            "structure": {
                "name": "Root",
                "children": {}
            }
        }
        
        visited = set()
        queue = [(url, 0)]  # (url, depth)
        
        max_depth = self.config.scan_depth
        max_pages = 100  # Limiter le nombre de pages pour éviter une exploration trop longue
        
        # Structure pour organiser l'arborescence
        def add_to_structure(url_path: str, page_url: str, title: str = ""):
            parts = url_path.strip('/').split('/')
            current = site_map["structure"]
            
            # Ajouter chaque partie du chemin dans l'arborescence
            for i, part in enumerate(parts):
                if not part:  # Ignorer les parties vides
                    continue
                    
                # Si cette partie n'existe pas encore, la créer
                if part not in current["children"]:
                    current["children"][part] = {
                        "name": part,
                        "children": {},
                        "urls": []
                    }
                
                current = current["children"][part]
            
            # Ajouter l'URL au nœud actuel
            if "urls" not in current:
                current["urls"] = []
                
            current["urls"].append({
                "url": page_url,
                "title": title or page_url
            })
        
        while queue and len(visited) < max_pages:
            current_url, depth = queue.pop(0)
            
            if current_url in visited or depth > max_depth:
                continue
                
            visited.add(current_url)
            
            try:
                response = self.session.get(
                    current_url, 
                    timeout=self.config.timeout,
                    allow_redirects=self.config.follow_redirects
                )
                
                if response.status_code != 200:
                    continue
                
                # Vérifier si c'est une page HTML
                content_type = response.headers.get("Content-Type", "").lower()
                if "text/html" not in content_type:
                    continue
                
                # Parser le HTML
                soup = BeautifulSoup(response.text, "html.parser")
                
                # Extraire le titre
                title = soup.find("title")
                title_text = title.text.strip() if title else ""
                
                # Ajouter à la structure
                parsed_url = urlparse(current_url)
                path = parsed_url.path or "/"
                add_to_structure(path, current_url, title_text)
                
                # Ajouter aux nœuds
                node = {
                    "url": current_url,
                    "title": title_text,
                    "depth": depth,
                    "status": response.status_code,
                    "content_type": content_type,
                    "links": []
                }
                
                # Extraire les liens
                for a in soup.find_all("a", href=True):
                    href = a["href"]
                    
                    # Ignorer les ancres et les liens JavaScript
                    if href.startswith("#") or href.startswith("javascript:"):
                        continue
                    
                    # Résoudre les URLs relatives
                    if not href.startswith(("http://", "https://")):
                        href = urljoin(current_url, href)
                    
                    # Filtrer pour ne garder que les liens du même domaine
                    href_parsed = urlparse(href)
                    current_parsed = urlparse(current_url)
                    
                    is_external = href_parsed.netloc != current_parsed.netloc
                    
                    link = {
                        "url": href,
                        "text": a.text.strip(),
                        "is_external": is_external
                    }
                    
                    node["links"].append(link)
                    site_map["resources"]["links"].append(link)
                    
                    # Ajouter à la file d'attente si c'est un lien interne
                    if not is_external and href not in visited:
                        queue.append((href, depth + 1))
                
                # Extraire les images (si activé)
                if self.config.sitemap_options.get("extract_images", True):
                    for img in soup.find_all("img", src=True):
                        src = img["src"]
                        if not src.startswith(("http://", "https://")):
                            src = urljoin(current_url, src)
                        
                        site_map["resources"]["images"].append({
                            "src": src,
                            "alt": img.get("alt", ""),
                            "page": current_url
                        })
                
                # Extraire les scripts (si activé)
                if self.config.sitemap_options.get("extract_scripts", True):
                    for script in soup.find_all("script", src=True):
                        src = script["src"]
                        if not src.startswith(("http://", "https://")):
                            src = urljoin(current_url, src)
                        
                        site_map["resources"]["scripts"].append({
                            "src": src,
                            "page": current_url
                        })
                
                # Extraire les feuilles de style (si activé)
                if self.config.sitemap_options.get("extract_styles", True):
                    for link in soup.find_all("link", rel="stylesheet", href=True):
                        href = link["href"]
                        if not href.startswith(("http://", "https://")):
                            href = urljoin(current_url, href)
                        
                        site_map["resources"]["stylesheets"].append({
                            "href": href,
                            "page": current_url
                        })
                
                # Extraire les formulaires (si activé)
                if self.config.sitemap_options.get("extract_forms", True):
                    for form in soup.find_all("form"):
                        action = form.get("action", "")
                        if action and not action.startswith(("http://", "https://")):
                            action = urljoin(current_url, action)
                        
                        site_map["resources"]["forms"].append({
                            "action": action,
                            "method": form.get("method", "get"),
                            "page": current_url,
                            "fields": len(form.find_all(["input", "select", "textarea"]))
                        })
                
                # Extraire les iframes (si activé)
                if self.config.sitemap_options.get("extract_frames", True):
                    for iframe in soup.find_all("iframe", src=True):
                        src = iframe["src"]
                        if not src.startswith(("http://", "https://")):
                            src = urljoin(current_url, src)
                        
                        site_map["resources"]["frames"].append({
                            "src": src,
                            "page": current_url
                        })
                
                # Ajouter le nœud à la carte du site
                site_map["nodes"].append(node)
                
                # Respecter le délai entre les requêtes
                time.sleep(self.config.delay)
                
            except Exception as e:
                logger.error(f"Erreur lors de l'exploration de {current_url}: {str(e)}")
        
        # Mettre à jour le nombre total de pages
        site_map["total_pages"] = len(site_map["nodes"])
        
        # Ajouter des statistiques
        resources = site_map["resources"]
        site_map["stats"] = {
            "total_pages": len(site_map["nodes"]),
            "total_links": len(resources["links"]),
            "total_images": len(resources["images"]),
            "total_scripts": len(resources["scripts"]),
            "total_styles": len(resources["stylesheets"]),
            "total_forms": len(resources["forms"]),
            "total_frames": len(resources["frames"]),
            "max_depth": max(node["depth"] for node in site_map["nodes"]) if site_map["nodes"] else 0
        }
        
        logger.info(f"Carte du site générée avec {site_map['total_pages']} pages")
        return site_map 