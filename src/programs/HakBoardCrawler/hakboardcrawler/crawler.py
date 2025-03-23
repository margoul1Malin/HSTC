"""
Module principal du Crawler
"""

import logging
import datetime
import os
import time
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse

from .config import CrawlerConfig
from .modules.scanner import VulnerabilityScanner
from .modules.metadata import MetadataExtractor
from .modules.export import Exporter

logger = logging.getLogger(__name__)

class Crawler:
    """
    Classe principale qui coordonne l'exécution des différents modules
    """
    
    def __init__(self, target: str, mode: str = "stealth", config_file: Optional[str] = None):
        """
        Initialise le crawler
        
        Args:
            target: URL ou domaine cible
            mode: Mode d'exécution ("stealth" ou "aggressive")
            config_file: Chemin vers un fichier de configuration
        """
        # S'assurer que l'URL est complète
        if not target.startswith(("http://", "https://")):
            target = f"http://{target}"
        
        self.target = target
        self.mode = mode
        self.timestamp = datetime.datetime.now().isoformat()
        
        # Initialiser la configuration
        self.config = CrawlerConfig(config_file)
        
        # Appliquer le mode
        if mode == "aggressive":
            self.config.scan_depth = 5
            self.config.threads = 15
            self.config.timeout = 5
            self.config.delay = 0.2
        elif mode == "stealth":
            self.config.scan_depth = 2
            self.config.threads = 3
            self.config.timeout = 10
            self.config.delay = 1.5
        
        # Initialiser les modules
        self.scanner = VulnerabilityScanner(self.config)
        self.metadata_extractor = MetadataExtractor(self.config)
        self.exporter = Exporter(self.config)
        
        logger.info(f"Crawler initialisé pour {target} en mode {mode}")
    
    def scan(self) -> Dict[str, Any]:
        """
        Effectue un scan complet de la cible
        
        Returns:
            Dictionnaire des résultats du scan
        """
        start_time = time.time()
        logger.info(f"Démarrage du scan pour {self.target}")
        
        results = {
            "target": self.target,
            "timestamp": datetime.datetime.now().isoformat(),
            "mode": self.mode
        }
        
        # Scanner les vulnérabilités
        vulnerabilities = self.scanner.scan_vulnerabilities(self.target)
        results["vulnerabilities"] = vulnerabilities
        
        # Extraire les problèmes d'en-têtes pour faciliter l'accès
        results["header_issues"] = vulnerabilities.get("header_issues", [])
        results["exposed_files"] = vulnerabilities.get("exposed_files", [])
        results["potential_vulnerabilities"] = vulnerabilities.get("potential_vulnerabilities", [])
        
        # Générer la carte du site
        site_map = self.scanner.generate_site_map(self.target)
        results["site_map"] = site_map
        
        # Extraire les métadonnées
        metadata = self.metadata_extractor.extract_from_url(self.target)
        results["metadata"] = metadata
        
        # Détecter les endpoints API
        api_endpoints = self.scanner.detect_api_endpoints(self.target)
        results["endpoints"] = api_endpoints
        
        # Informations sur le framework
        results["framework_info"] = metadata.get("framework_info", {})
        results["static_resources"] = metadata.get("static_resources", {})
        
        # Générer un résumé
        results["summary"] = {
            "total_urls": site_map.get("total_pages", 0),
            "total_vulnerabilities": len(results["header_issues"]) + 
                                    len(vulnerabilities.get("cors_issues", [])) + 
                                    len(vulnerabilities.get("csp_issues", [])) + 
                                    len(results["potential_vulnerabilities"]),
            "severity_counts": self._count_vulnerabilities_by_severity(results),
            "interesting_findings": self._get_interesting_findings(results),
            "total_api_endpoints": api_endpoints.get("total_found", 0),
            "resources": {
                "images": len(results["static_resources"].get("images", [])),
                "scripts": len(results["static_resources"].get("scripts", [])),
                "stylesheets": len(results["static_resources"].get("stylesheets", [])),
                "fonts": len(results["static_resources"].get("fonts", [])),
                "media": len(results["static_resources"].get("media", []))
            },
            "scan_duration": time.time() - start_time,
            "framework": results["framework_info"].get("name", "unknown")
        }
        
        logger.info(f"Scan terminé pour {self.target} en {results['summary']['scan_duration']:.2f} secondes")
        return results
    
    def export(self, data: Dict[str, Any], format: str = "json", output: str = "rapport") -> str:
        """
        Exporte les résultats dans le format spécifié
        
        Args:
            data: Données à exporter
            format: Format d'exportation
            output: Nom de base pour le fichier de sortie
            
        Returns:
            Chemin du fichier exporté
        """
        # Ajouter le domaine au nom de fichier
        domain = urlparse(self.target).netloc
        if domain:
            output = f"{output}_{domain}"
        
        # Exporter les données
        return self.exporter.export(data, format, output)
    
    def scan_target_list(self, targets: List[str], format: str = "json", output: str = "rapport_groupe") -> List[Dict[str, Any]]:
        """
        Scanne une liste de cibles
        
        Args:
            targets: Liste des URLs ou domaines cibles
            format: Format d'exportation
            output: Nom de base pour le fichier de sortie
            
        Returns:
            Liste des résultats pour chaque cible
        """
        all_results = []
        
        for i, target in enumerate(targets):
            logger.info(f"Scan de la cible {i+1}/{len(targets)}: {target}")
            
            # Réinitialiser le crawler pour cette cible
            self.target = target if target.startswith(("http://", "https://")) else f"http://{target}"
            
            # Exécuter le scan
            results = self.scan()
            all_results.append(results)
            
            # Exporter les résultats individuels
            target_output = f"{output}_{i+1}_{urlparse(self.target).netloc}"
            self.exporter.export(results, format, target_output)
        
        # Exporter un rapport de groupe
        group_results = {
            "timestamp": datetime.datetime.now().isoformat(),
            "mode": self.mode,
            "total_targets": len(targets),
            "targets": [result["target"] for result in all_results],
            "summary": {
                "total_vulnerabilities": sum(result["summary"]["total_vulnerabilities"] for result in all_results),
                "severity_counts": {
                    "high": sum(result["summary"]["severity_counts"]["high"] for result in all_results),
                    "medium": sum(result["summary"]["severity_counts"]["medium"] for result in all_results),
                    "low": sum(result["summary"]["severity_counts"]["low"] for result in all_results),
                    "info": sum(result["summary"]["severity_counts"]["info"] for result in all_results)
                },
                "frameworks_detected": [result.get("framework_info", {}).get("name", "non détecté") for result in all_results],
                "total_api_endpoints": sum(result.get("summary", {}).get("total_api_endpoints", 0) for result in all_results),
                "total_exposed_files": sum(len(result.get("exposed_files", [])) for result in all_results)
            },
            "target_summaries": [result["summary"] for result in all_results]
        }
        
        self.exporter.export(group_results, format, f"{output}_group")
        
        return all_results
    
    def _count_vulnerabilities_by_severity(self, results: Dict[str, Any]) -> Dict[str, int]:
        """
        Compte le nombre de vulnérabilités par niveau de sévérité
        
        Args:
            results: Résultats du scan
            
        Returns:
            Dictionnaire des comptages par sévérité
        """
        counts = {"high": 0, "medium": 0, "low": 0, "info": 0}
        
        # Compter les problèmes d'en-têtes
        for issue in results.get("header_issues", []):
            severity = issue.get("severity", "info").lower()
            counts[severity] = counts.get(severity, 0) + 1
        
        # Compter les problèmes CORS
        for issue in results.get("vulnerabilities", {}).get("cors_issues", []):
            severity = issue.get("severity", "info").lower()
            counts[severity] = counts.get(severity, 0) + 1
        
        # Compter les problèmes CSP
        for issue in results.get("vulnerabilities", {}).get("csp_issues", []):
            severity = issue.get("severity", "info").lower()
            counts[severity] = counts.get(severity, 0) + 1
        
        # Compter les vulnérabilités potentielles
        for vuln in results.get("potential_vulnerabilities", []):
            severity = vuln.get("severity", "info").lower()
            counts[severity] = counts.get(severity, 0) + 1
        
        return counts
    
    def _get_interesting_findings(self, results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extrait les trouvailles les plus intéressantes des résultats
        
        Args:
            results: Résultats du scan
            
        Returns:
            Liste des trouvailles intéressantes
        """
        findings = []
        
        # Ajouter les problèmes d'en-têtes à sévérité élevée
        for issue in results.get("header_issues", []):
            severity = issue.get("severity", "info").lower()
            if severity in ["high", "medium"]:
                findings.append({
                    "type": "header_issue",
                    "severity": severity,
                    "description": issue.get("description", "")
                })
        
        # Ajouter les problèmes CORS à sévérité élevée
        for issue in results.get("vulnerabilities", {}).get("cors_issues", []):
            severity = issue.get("severity", "info").lower()
            if severity in ["high", "medium"]:
                findings.append({
                    "type": "cors_issue",
                    "severity": severity,
                    "description": issue.get("description", "")
                })
        
        # Ajouter les problèmes CSP à sévérité élevée
        for issue in results.get("vulnerabilities", {}).get("csp_issues", []):
            severity = issue.get("severity", "info").lower()
            if severity in ["high", "medium"]:
                findings.append({
                    "type": "csp_issue",
                    "severity": severity,
                    "description": issue.get("description", "")
                })
        
        # Ajouter les vulnérabilités potentielles à sévérité élevée
        for vuln in results.get("potential_vulnerabilities", []):
            severity = vuln.get("severity", "info").lower()
            if severity in ["high", "medium"]:
                findings.append({
                    "type": vuln.get("type", "vulnerability"),
                    "severity": severity,
                    "description": vuln.get("description", "")
                })
        
        # Ajouter les métadonnées intéressantes
        for item in results.get("metadata", {}).get("interesting_metadata", []):
            findings.append({
                "type": "metadata",
                "file_type": item.get("type", ""),
                "filename": item.get("filename", ""),
                "interesting_fields": item.get("interesting_fields", {})
            })
        
        # Ajouter les fichiers sensibles exposés
        for file in results.get("exposed_files", []):
            findings.append({
                "type": "exposed_file",
                "severity": "high",
                "description": f"Fichier sensible exposé: {file.get('path', '')}"
            })
        
        return findings 