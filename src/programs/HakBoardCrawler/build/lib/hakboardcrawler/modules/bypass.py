"""
Module pour bypasser les protections (robots.txt, captchas, etc.)
"""

import logging
import urllib.robotparser
from urllib.parse import urlparse, urljoin
import time
import random
import re
import requests
import base64
import tempfile
import os
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)

class RobotsBypass:
    """
    Gère le bypass de robots.txt et autres protections
    """
    
    def __init__(self, config):
        """
        Initialise le gestionnaire de bypass
        
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
        
        # Dictionnaire pour stocker le résultat de l'analyse robots.txt (cache)
        self.robots_cache = {}
        
        logger.info("Gestionnaire de bypass initialisé")
    
    def check_robots(self, url: str) -> Dict[str, Any]:
        """
        Analyse le fichier robots.txt d'un site
        
        Args:
            url: URL du site à analyser
            
        Returns:
            Dictionnaire avec le résultat de l'analyse
        """
        parsed_url = urlparse(url)
        domain = f"{parsed_url.scheme}://{parsed_url.netloc}"
        
        # Vérifier si nous avons déjà analysé ce domaine
        if domain in self.robots_cache:
            logger.debug(f"Utilisation du cache robots.txt pour {domain}")
            return self.robots_cache[domain]
        
        results = {
            "domain": domain,
            "has_robots_txt": False,
            "respects_robots": self.config.respect_robots_txt,
            "disallowed_paths": [],
            "allowed_paths": [],
            "crawl_delay": None,
            "sitemaps": []
        }
        
        # Si nous sommes configurés pour ignorer robots.txt, retourner les résultats minimaux
        if not self.config.respect_robots_txt:
            logger.info(f"Ignorer robots.txt pour {domain} (configuration)")
            self.robots_cache[domain] = results
            return results
        
        try:
            robots_url = f"{domain}/robots.txt"
            logger.info(f"Vérification de robots.txt: {robots_url}")
            
            response = self.session.get(robots_url, timeout=self.config.timeout)
            
            if response.status_code == 200:
                results["has_robots_txt"] = True
                
                # Utiliser robotparser pour analyser le fichier
                rp = urllib.robotparser.RobotFileParser()
                rp.set_url(robots_url)
                rp.parse(response.text.splitlines())
                
                # Récupérer le user-agent actuel
                current_ua = self.session.headers.get("User-Agent", "*")
                
                # Extraire le crawl-delay s'il est défini
                for line in response.text.splitlines():
                    if "crawl-delay" in line.lower() and ":" in line:
                        try:
                            delay_str = line.split(":", 1)[1].strip()
                            results["crawl_delay"] = float(delay_str)
                        except (ValueError, IndexError):
                            pass
                
                # Extraire les sitemaps
                for line in response.text.splitlines():
                    if line.lower().startswith("sitemap:"):
                        try:
                            sitemap_url = line.split(":", 1)[1].strip()
                            results["sitemaps"].append(sitemap_url)
                        except IndexError:
                            pass
                
                # Tester quelques chemins communs pour voir s'ils sont autorisés
                common_paths = [
                    "/",
                    "/about",
                    "/contact",
                    "/wp-admin/",
                    "/wp-content/",
                    "/admin/",
                    "/login",
                    "/api/",
                    "/.git/",
                    "/.env",
                    "/config",
                    "/backup"
                ]
                
                for path in common_paths:
                    full_url = urljoin(domain, path)
                    if rp.can_fetch(current_ua, full_url):
                        results["allowed_paths"].append(path)
                    else:
                        results["disallowed_paths"].append(path)
                
                logger.info(f"Robots.txt analysé pour {domain}")
            else:
                logger.info(f"Pas de robots.txt trouvé pour {domain}")
        
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse de robots.txt: {str(e)}")
        
        # Mettre en cache les résultats
        self.robots_cache[domain] = results
        return results
    
    def can_access_url(self, url: str) -> bool:
        """
        Vérifie si l'URL peut être consultée selon robots.txt
        
        Args:
            url: URL à vérifier
            
        Returns:
            True si l'URL peut être consultée, False sinon
        """
        # Si nous sommes configurés pour ignorer robots.txt, toujours autoriser
        if not self.config.respect_robots_txt:
            return True
        
        parsed_url = urlparse(url)
        domain = f"{parsed_url.scheme}://{parsed_url.netloc}"
        
        # Vérifier si nous avons déjà analysé ce domaine
        if domain not in self.robots_cache:
            self.check_robots(url)
        
        # Si le site n'a pas de robots.txt, autoriser
        if not self.robots_cache[domain]["has_robots_txt"]:
            return True
        
        # Vérifier si le chemin est dans les chemins interdits
        path = parsed_url.path
        for disallowed in self.robots_cache[domain]["disallowed_paths"]:
            if path.startswith(disallowed):
                logger.debug(f"URL {url} interdite par robots.txt")
                return False
        
        return True
    
    def solve_captcha(self, url: str, html_content: str = None) -> Optional[Dict[str, Any]]:
        """
        Tente de détecter et résoudre les CAPTCHAs
        
        Args:
            url: URL de la page avec CAPTCHA
            html_content: Contenu HTML de la page (optionnel)
            
        Returns:
            Dictionnaire avec la solution du CAPTCHA ou None
        """
        # Si les CAPTCHAs sont désactivés, retourner None
        if self.config.captcha_bypass == "disabled":
            logger.info("Bypass de CAPTCHA désactivé par configuration")
            return None
        
        # Si nous n'avons pas le contenu HTML, le télécharger
        if not html_content:
            try:
                response = self.session.get(url, timeout=self.config.timeout)
                html_content = response.text
            except Exception as e:
                logger.error(f"Erreur lors du téléchargement de la page pour CAPTCHA: {str(e)}")
                return None
        
        # Détecter le type de CAPTCHA
        captcha_type = self._detect_captcha_type(html_content)
        
        if not captcha_type:
            logger.debug(f"Pas de CAPTCHA détecté sur {url}")
            return None
        
        logger.info(f"CAPTCHA de type {captcha_type} détecté sur {url}")
        
        # Essayer de résoudre selon le type
        if captcha_type == "recaptcha" and self.config.captcha_bypass == "2captcha":
            return self._solve_recaptcha_with_2captcha(url, html_content)
        elif captcha_type == "image" and self.config.captcha_bypass == "auto":
            return self._solve_image_captcha(url, html_content)
        else:
            logger.warning(f"Pas de méthode disponible pour résoudre le CAPTCHA de type {captcha_type}")
            return None
    
    def _detect_captcha_type(self, html_content: str) -> Optional[str]:
        """
        Détecte le type de CAPTCHA dans une page
        
        Args:
            html_content: Contenu HTML de la page
            
        Returns:
            Type de CAPTCHA détecté ou None
        """
        # Détecter reCAPTCHA
        if "google.com/recaptcha/api.js" in html_content:
            return "recaptcha"
        
        # Détecter hCaptcha
        if "hcaptcha.com/1/api.js" in html_content:
            return "hcaptcha"
        
        # Détecter CAPTCHA image (basique)
        if re.search(r'captcha.*?\.(?:png|jpg|jpeg|gif)', html_content, re.IGNORECASE):
            return "image"
        
        # Pas de CAPTCHA détecté
        return None
    
    def _solve_recaptcha_with_2captcha(self, url: str, html_content: str) -> Optional[Dict[str, Any]]:
        """
        Tente de résoudre un reCAPTCHA avec le service 2captcha
        
        Args:
            url: URL de la page avec reCAPTCHA
            html_content: Contenu HTML de la page
            
        Returns:
            Dictionnaire avec la solution ou None
        """
        # Vérifier si nous avons une clé API 2captcha
        api_key = self.config.get("api_keys.2captcha")
        if not api_key:
            logger.warning("Clé API 2captcha manquante pour résoudre le reCAPTCHA")
            return None
        
        try:
            # Extraire la clé du site reCAPTCHA
            site_key_match = re.search(r'data-sitekey="([^"]+)"', html_content)
            if not site_key_match:
                logger.warning("Impossible de trouver la clé du site reCAPTCHA")
                return None
            
            site_key = site_key_match.group(1)
            
            # Ici, intégration avec l'API 2captcha
            # Dans une implémentation réelle, utiliser la librairie 2captcha-python
            logger.info("Support 2captcha non implémenté complètement dans cette version de démonstration")
            
            # Simulation d'une réponse
            return {
                "type": "recaptcha",
                "solution": "03AGdBq24PBCbwiDRgC3...KlasG38",
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de la résolution du reCAPTCHA: {str(e)}")
            return None
    
    def _solve_image_captcha(self, url: str, html_content: str) -> Optional[Dict[str, Any]]:
        """
        Tente de résoudre un CAPTCHA image simple
        
        Args:
            url: URL de la page avec CAPTCHA
            html_content: Contenu HTML de la page
            
        Returns:
            Dictionnaire avec la solution ou None
        """
        try:
            # Rechercher l'URL de l'image CAPTCHA
            captcha_img_match = re.search(r'src="([^"]+captcha[^"]+\.(png|jpg|jpeg|gif))"', html_content, re.IGNORECASE)
            if not captcha_img_match:
                logger.warning("Impossible de trouver l'image CAPTCHA")
                return None
            
            captcha_img_url = captcha_img_match.group(1)
            if not (captcha_img_url.startswith("http://") or captcha_img_url.startswith("https://")):
                parsed_url = urlparse(url)
                base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
                captcha_img_url = urljoin(base_url, captcha_img_url)
            
            # Télécharger l'image
            response = self.session.get(captcha_img_url, timeout=self.config.timeout)
            if response.status_code != 200:
                logger.warning(f"Impossible de télécharger l'image CAPTCHA: {response.status_code}")
                return None
            
            # Utiliser OCR pour résoudre l'image (nécessite pytesseract)
            try:
                import pytesseract
                from PIL import Image
                from io import BytesIO
                
                img = Image.open(BytesIO(response.content))
                
                # Prétraitement de l'image (simplifié)
                img = img.convert('L')  # Conversion en niveaux de gris
                
                # OCR
                captcha_text = pytesseract.image_to_string(img, config='--psm 8 -c tessedit_char_whitelist=0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')
                captcha_text = captcha_text.strip()
                
                if captcha_text:
                    logger.info(f"CAPTCHA image résolu: {captcha_text}")
                    return {
                        "type": "image",
                        "solution": captcha_text,
                        "success": True
                    }
                else:
                    logger.warning("Échec de la résolution du CAPTCHA image")
                    return None
                
            except ImportError:
                logger.warning("pytesseract non disponible pour résoudre le CAPTCHA image")
                return None
                
        except Exception as e:
            logger.error(f"Erreur lors de la résolution du CAPTCHA image: {str(e)}")
            return None 