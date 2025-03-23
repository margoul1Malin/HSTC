"""
Module pour simuler un comportement humain et éviter la détection
"""

import logging
import time
import random
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class StealthMode:
    """
    Techniques pour simuler un comportement humain et éviter la détection
    """
    
    def __init__(self, config):
        """
        Initialise le mode furtif
        
        Args:
            config: Configuration du crawler
        """
        self.config = config
        logger.info("Mode furtif initialisé")
    
    def apply_stealth_techniques(self):
        """
        Applique les techniques de furtivité selon la configuration
        """
        if self.config.mode == "stealth":
            logger.info("Application des techniques de furtivité")
            
            # Appliquer les différentes techniques configurées
            if self.config.get("stealth_features.random_timing"):
                self._apply_random_timing()
            
            if self.config.get("stealth_features.mouse_movement"):
                self._simulate_mouse_movement()
            
            if self.config.get("stealth_features.anti_fingerprinting"):
                self._apply_anti_fingerprinting()
            
            logger.info("Techniques de furtivité appliquées")
        else:
            logger.info("Mode furtif désactivé (mode agressif)")
    
    def _apply_random_timing(self):
        """
        Applique des délais aléatoires entre les requêtes pour simuler un comportement humain
        """
        logger.debug("Application de délais aléatoires")
        
        # Calculer un délai aléatoire basé sur le délai configuré
        base_delay = self.config.request_delay
        jitter = base_delay * 0.5  # 50% de variation
        random_delay = max(0.5, random.uniform(base_delay - jitter, base_delay + jitter))
        
        logger.debug(f"Pause de {random_delay:.2f} secondes pour simuler un comportement humain")
        time.sleep(random_delay)
    
    def _simulate_mouse_movement(self):
        """
        Simule des mouvements de souris pour les sites qui détectent l'automatisation
        """
        logger.debug("Simulation de mouvements de souris")
        
        # Cette fonctionnalité nécessite PyAutoGUI en environnement graphique
        # Dans un environnement sans interface graphique, cela est simplement ignoré
        try:
            import pyautogui
            
            # Obtenir la taille de l'écran
            screen_width, screen_height = pyautogui.size()
            
            # Générer un chemin aléatoire de points
            num_points = random.randint(5, 10)
            points = [(random.randint(0, screen_width), random.randint(0, screen_height)) 
                     for _ in range(num_points)]
            
            # Déplacer la souris le long du chemin
            current_x, current_y = pyautogui.position()
            for x, y in points:
                # Calculer la distance pour que le mouvement soit plus naturel
                distance = ((x - current_x) ** 2 + (y - current_y) ** 2) ** 0.5
                duration = distance / 1000.0  # Plus la distance est grande, plus le mouvement est lent
                
                # Limite pour éviter les mouvements trop lents
                duration = min(duration, 1.0)
                
                # Déplacer la souris avec une courbe naturelle
                pyautogui.moveTo(x, y, duration=duration, tween=pyautogui.easeInOutQuad)
                
                # Mettre à jour la position actuelle
                current_x, current_y = x, y
                
                # Petite pause aléatoire
                time.sleep(random.uniform(0.1, 0.3))
            
            logger.debug("Mouvements de souris simulés avec succès")
        except ImportError:
            logger.warning("PyAutoGUI non disponible, simulation de souris ignorée")
        except Exception as e:
            logger.error(f"Erreur lors de la simulation de mouvements de souris: {str(e)}")
    
    def _apply_anti_fingerprinting(self):
        """
        Applique des techniques pour éviter la détection par fingerprinting
        """
        logger.debug("Application des techniques anti-fingerprinting")
        
        # Ces techniques sont généralement intégrées dans des outils comme Selenium ou Playwright
        # Ici, nous simulons simplement leur application dans cet exemple
        
        # Techniques courantes:
        # 1. Rotation d'User-Agent (déjà géré dans la classe principale)
        # 2. Navigation via proxy (déjà géré dans la classe principale)
        # 3. Modifications des propriétés navigator en JavaScript (nécessite un navigateur)
        # 4. Modification des Canvas fingerprints (nécessite un navigateur)
        # 5. Modification des propriétés WebGL (nécessite un navigateur)
        
        logger.info("Techniques anti-fingerprinting appliquées (simulation)")
    
    def get_random_user_agent(self) -> str:
        """
        Génère un User-Agent aléatoire
        
        Returns:
            User-Agent aléatoire
        """
        try:
            from fake_useragent import UserAgent
            ua = UserAgent()
            
            # Sélectionner un type de navigateur selon la configuration
            browser = self.config.get("emulate_browser", "random")
            
            if browser == "chrome":
                return ua.chrome
            elif browser == "firefox":
                return ua.firefox
            elif browser == "safari":
                return ua.safari
            elif browser == "edge":
                return ua.edge
            else:
                return ua.random
            
        except ImportError:
            logger.warning("Module fake_useragent non disponible")
            
            # User-Agents par défaut
            user_agents = [
                # Chrome
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
                # Firefox
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0",
                # Safari
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
                # Edge
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59"
            ]
            
            return random.choice(user_agents) 