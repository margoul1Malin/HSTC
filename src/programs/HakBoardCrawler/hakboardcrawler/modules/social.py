"""
Module de scraping des réseaux sociaux (LinkedIn, Twitter, GitHub, etc.)
"""

import logging
import re
import json
import time
from typing import Dict, List, Any, Optional
from urllib.parse import urlparse, urljoin
import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

class SocialScraper:
    """
    Effectue le scraping des réseaux sociaux pour rechercher des informations
    """
    
    def __init__(self, config):
        """
        Initialise le scraper de réseaux sociaux
        
        Args:
            config: Configuration du crawler
        """
        self.config = config
        self.session = requests.Session()
        
        # Configuration de l'user-agent
        if self.config.user_agent_rotation:
            try:
                from fake_useragent import UserAgent
                self.ua = UserAgent()
                self.session.headers.update({"User-Agent": self.ua.random})
            except ImportError:
                logger.warning("Module fake_useragent non disponible. Utilisation de l'user-agent par défaut.")
                self.session.headers.update({
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                })
        else:
            self.session.headers.update({
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            })
        
        # Configuration du proxy si nécessaire
        if self.config.proxy:
            self.session.proxies = {
                "http": self.config.proxy,
                "https": self.config.proxy
            }
        
        logger.info("Scraper de réseaux sociaux initialisé")
    
    def scrape(self, target: str) -> Dict[str, Any]:
        """
        Effectue le scraping des réseaux sociaux pour la cible
        
        Args:
            target: URL ou nom de domaine cible
            
        Returns:
            Dictionnaire des données recueillies
        """
        logger.info(f"Démarrage du scraping de réseaux sociaux pour {target}")
        
        # Extraire le domaine du site cible
        domain = target
        if target.startswith(("http://", "https://")):
            parsed_url = urlparse(target)
            domain = parsed_url.netloc
        
        # Extraire le nom de l'organisation ou de l'entreprise
        company_name = self._extract_company_name(domain, target)
        
        results = {
            "domain": domain,
            "company": company_name,
            "linkedin": self._scrape_linkedin(company_name),
            "twitter": self._scrape_twitter(company_name, domain),
            "github": self._scrape_github(company_name, domain),
            "facebook": {},
            "instagram": {},
            "profiles": [],
            "mentions": []
        }
        
        return results
    
    def _extract_company_name(self, domain: str, url: str) -> str:
        """
        Tente d'extraire le nom de l'entreprise à partir du domaine ou de la page d'accueil
        """
        # Extraire du domaine (enlever l'extension)
        company = domain.split(".")[0]
        
        # Essayer d'obtenir plus d'informations depuis la page d'accueil
        try:
            response = self.session.get(url, timeout=self.config.timeout)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")
                
                # Rechercher dans les balises meta, title, etc.
                title = soup.find("title")
                if title and title.text:
                    # Extraire le premier mot significatif (supposé être le nom de l'entreprise)
                    title_text = title.text.split("|")[0].split("-")[0].strip()
                    if len(title_text.split()) <= 3:  # Max 3 mots pour un nom d'entreprise
                        company = title_text
                
                # Rechercher dans les meta tags
                meta_org = soup.find("meta", property="og:site_name")
                if meta_org and meta_org.get("content"):
                    company = meta_org.get("content")
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction du nom de l'entreprise: {str(e)}")
        
        logger.info(f"Nom d'entreprise extrait: {company}")
        return company
    
    def _scrape_linkedin(self, company_name: str) -> Dict[str, Any]:
        """
        Recherche des informations sur LinkedIn
        
        Note: Cette méthode utilise une approche basique sans API pour éviter les limitations.
        Pour un usage professionnel, LinkedIn API serait nécessaire.
        """
        results = {
            "company_profile": "",
            "employees": [],
            "job_titles": set(),
            "locations": set()
        }
        
        # URL de recherche LinkedIn (public)
        search_url = f"https://www.linkedin.com/company/{company_name.lower().replace(' ', '-')}"
        
        try:
            logger.info(f"Recherche de profil LinkedIn pour {company_name}")
            
            # Vérifier si le profil d'entreprise existe
            response = self.session.get(search_url, timeout=self.config.timeout)
            
            if response.status_code == 200:
                results["company_profile"] = search_url
                
                # Extraire des infos basiques (limité sans JavaScript et authentification)
                soup = BeautifulSoup(response.text, "html.parser")
                
                # Extraction d'informations basiques
                description = soup.find("p", {"class": "org-about-us-organization-description__text"})
                if description:
                    results["description"] = description.text.strip()
                
                # Note: Pour une extraction plus complète, il faudrait:
                # 1. Utiliser Selenium/Playwright pour exécuter JavaScript
                # 2. S'authentifier à LinkedIn (contre les TOS de LinkedIn)
                # 3. Utiliser l'API LinkedIn officielle (nécessite une approbation)
                
                logger.info(f"Profil LinkedIn trouvé: {search_url}")
            else:
                logger.info(f"Aucun profil LinkedIn trouvé pour {company_name}")
            
            # Respecter les limites de requêtes
            time.sleep(self.config.request_delay)
            
        except Exception as e:
            logger.error(f"Erreur lors du scraping LinkedIn: {str(e)}")
        
        return results
    
    def _scrape_twitter(self, company_name: str, domain: str) -> Dict[str, Any]:
        """
        Recherche des informations sur Twitter
        """
        results = {
            "profile": "",
            "handle": "",
            "recent_tweets": [],
            "mentions": []
        }
        
        try:
            logger.info(f"Recherche de profil Twitter pour {company_name}")
            
            # Approche 1: Recherche directe par nom d'entreprise
            handles_to_try = [
                company_name.lower().replace(" ", ""),
                company_name.lower().replace(" ", "_"),
                domain.split(".")[0].lower()
            ]
            
            for handle in handles_to_try:
                profile_url = f"https://twitter.com/{handle}"
                response = self.session.get(profile_url, timeout=self.config.timeout)
                
                if response.status_code == 200 and "Account suspended" not in response.text:
                    results["profile"] = profile_url
                    results["handle"] = handle
                    
                    # Extraction basique d'informations (limité sans API)
                    soup = BeautifulSoup(response.text, "html.parser")
                    
                    # Note: Twitter utilise beaucoup de JS, donc l'extraction directe est limitée
                    # Pour une extraction complète, il faudrait:
                    # 1. Utiliser l'API Twitter (nécessite une clé API)
                    # 2. Ou utiliser SNScrape (qui simule un navigateur)
                    
                    logger.info(f"Profil Twitter trouvé: {profile_url}")
                    break
                
                time.sleep(self.config.request_delay)
            
            # Recherche de mentions récentes (nécessiterait l'API Twitter ou SNScrape)
            # Ceci est un placeholder - en production, utiliser l'API Twitter ou SNScrape
            
            if not results["profile"]:
                logger.info(f"Aucun profil Twitter trouvé pour {company_name}")
            
        except Exception as e:
            logger.error(f"Erreur lors du scraping Twitter: {str(e)}")
        
        return results
    
    def _scrape_github(self, company_name: str, domain: str) -> Dict[str, Any]:
        """
        Recherche des informations sur GitHub
        """
        results = {
            "organization": "",
            "repositories": [],
            "members": [],
            "languages": set()
        }
        
        try:
            logger.info(f"Recherche de profil GitHub pour {company_name}")
            
            # Approche 1: Recherche directe par nom d'entreprise
            org_names_to_try = [
                company_name.lower().replace(" ", ""),
                company_name.lower().replace(" ", "-"),
                domain.split(".")[0].lower()
            ]
            
            # Vérifier si nous avons une clé API GitHub
            headers = {}
            if self.config.get("api_keys.github"):
                headers["Authorization"] = f"token {self.config.get('api_keys.github')}"
            
            for org_name in org_names_to_try:
                # Utiliser l'API GitHub (même sans authentification, permet quelques requêtes)
                api_url = f"https://api.github.com/orgs/{org_name}"
                response = self.session.get(api_url, headers=headers, timeout=self.config.timeout)
                
                if response.status_code == 200:
                    org_data = response.json()
                    results["organization"] = org_data.get("html_url", "")
                    results["description"] = org_data.get("description", "")
                    
                    # Récupérer les repositories publics
                    repos_url = f"https://api.github.com/orgs/{org_name}/repos"
                    repos_response = self.session.get(repos_url, headers=headers, timeout=self.config.timeout)
                    
                    if repos_response.status_code == 200:
                        repos = repos_response.json()
                        for repo in repos[:min(10, len(repos))]:  # Limiter à 10 repos
                            results["repositories"].append({
                                "name": repo.get("name", ""),
                                "url": repo.get("html_url", ""),
                                "description": repo.get("description", ""),
                                "stars": repo.get("stargazers_count", 0),
                                "language": repo.get("language", "")
                            })
                            
                            if repo.get("language"):
                                results["languages"].add(repo.get("language"))
                    
                    logger.info(f"Profil GitHub trouvé: {results['organization']}")
                    break
                
                time.sleep(self.config.request_delay)
            
            if not results["organization"]:
                logger.info(f"Aucun profil GitHub trouvé pour {company_name}")
            
        except Exception as e:
            logger.error(f"Erreur lors du scraping GitHub: {str(e)}")
        
        # Convertir les sets en listes pour la sérialisation JSON
        results["languages"] = list(results["languages"])
        
        return results 