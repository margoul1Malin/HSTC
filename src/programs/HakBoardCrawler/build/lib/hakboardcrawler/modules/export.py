"""
Module d'exportation des résultats dans différents formats
"""

import logging
import json
import csv
import os
from typing import Dict, Any, List, Optional
import datetime

logger = logging.getLogger(__name__)

class Exporter:
    """
    Gère l'exportation des résultats dans différents formats
    """
    
    def __init__(self, config):
        """
        Initialise l'exportateur
        
        Args:
            config: Configuration du crawler
        """
        self.config = config
        logger.info("Exportateur initialisé")
    
    def export(self, data: Dict[str, Any], format: str = "json", output: str = "rapport") -> str:
        """
        Exporte les données dans le format spécifié
        
        Args:
            data: Données à exporter
            format: Format d'exportation (json, csv, html, pdf)
            output: Nom de fichier de sortie (sans extension)
            
        Returns:
            Chemin du fichier exporté
        """
        if not data:
            logger.warning("Aucune donnée à exporter")
            return ""
        
        format = format.lower()
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{output}_{timestamp}"
        
        if format == "json":
            return self.export_json(data, filename)
        elif format == "csv":
            return self.export_csv(data, filename)
        elif format == "html":
            return self.export_html(data, filename)
        elif format == "pdf":
            return self.export_pdf(data, filename)
        else:
            logger.warning(f"Format d'exportation non pris en charge: {format}")
            return self.export_json(data, filename)  # Format par défaut
    
    def export_json(self, data: Dict[str, Any], filename: str) -> str:
        """
        Exporte les données au format JSON
        
        Args:
            data: Données à exporter
            filename: Nom de fichier (sans extension)
            
        Returns:
            Chemin du fichier exporté
        """
        output_file = f"{filename}.json"
        logger.info(f"Exportation des données au format JSON: {output_file}")
        
        try:
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2, default=str)
            
            logger.info(f"Exportation JSON terminée: {output_file}")
            return os.path.abspath(output_file)
        
        except Exception as e:
            logger.error(f"Erreur lors de l'exportation JSON: {str(e)}")
            return ""
    
    def export_csv(self, data: Dict[str, Any], filename: str) -> str:
        """
        Exporte les données au format CSV
        
        Args:
            data: Données à exporter
            filename: Nom de fichier (sans extension)
            
        Returns:
            Chemin du fichier exporté
        """
        output_file = f"{filename}.csv"
        logger.info(f"Exportation des données au format CSV: {output_file}")
        
        try:
            # Le CSV n'est pas idéal pour les données hiérarchiques
            # Nous allons donc exporter les sections principales dans des fichiers séparés
            
            # Déterminer quelle section exporter
            if "vulnerabilities" in data:
                # Exporter les vulnérabilités
                self._export_vulnerabilities_csv(data, filename)
                return os.path.abspath(f"{filename}_vulnerabilities.csv")
            
            elif "endpoints" in data:
                # Exporter les endpoints API
                self._export_endpoints_csv(data, filename)
                return os.path.abspath(f"{filename}_endpoints.csv")
            
            elif "metadata" in data and "interesting_metadata" in data["metadata"]:
                # Exporter les métadonnées intéressantes
                self._export_metadata_csv(data, filename)
                return os.path.abspath(f"{filename}_metadata.csv")
            
            else:
                # Exportation générique (limité aux valeurs de premier niveau)
                with open(output_file, "w", newline="", encoding="utf-8") as f:
                    writer = csv.writer(f)
                    writer.writerow(["Clé", "Valeur"])
                    
                    for key, value in data.items():
                        if isinstance(value, (str, int, float, bool)):
                            writer.writerow([key, value])
                        elif value is None:
                            writer.writerow([key, ""])
                        else:
                            writer.writerow([key, str(type(value))])
                
                logger.info(f"Exportation CSV générique terminée: {output_file}")
                return os.path.abspath(output_file)
        
        except Exception as e:
            logger.error(f"Erreur lors de l'exportation CSV: {str(e)}")
            return ""
    
    def _export_vulnerabilities_csv(self, data: Dict[str, Any], base_filename: str) -> str:
        """
        Exporte les vulnérabilités au format CSV
        """
        output_file = f"{base_filename}_vulnerabilities.csv"
        
        try:
            with open(output_file, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(["Type", "Sévérité", "URL", "Description"])
                
                for vuln in data.get("potential_vulnerabilities", []):
                    writer.writerow([
                        vuln.get("type", ""),
                        vuln.get("severity", ""),
                        vuln.get("url", ""),
                        vuln.get("description", "")
                    ])
                
                for issue in data.get("header_issues", []):
                    writer.writerow([
                        f"header_{issue.get('header', '')}",
                        issue.get("severity", ""),
                        data.get("target", ""),
                        issue.get("description", "")
                    ])
            
            logger.info(f"Exportation CSV des vulnérabilités terminée: {output_file}")
            return os.path.abspath(output_file)
            
        except Exception as e:
            logger.error(f"Erreur lors de l'exportation CSV des vulnérabilités: {str(e)}")
            return ""
    
    def _export_endpoints_csv(self, data: Dict[str, Any], base_filename: str) -> str:
        """
        Exporte les endpoints API au format CSV
        """
        output_file = f"{base_filename}_endpoints.csv"
        
        try:
            with open(output_file, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(["URL", "Méthode", "Paramètres"])
                
                for endpoint in data.get("endpoints", {}).get("endpoints", []):
                    writer.writerow([
                        endpoint.get("url", ""),
                        endpoint.get("method", "GET"),
                        ", ".join(endpoint.get("parameters", []))
                    ])
            
            logger.info(f"Exportation CSV des endpoints API terminée: {output_file}")
            return os.path.abspath(output_file)
            
        except Exception as e:
            logger.error(f"Erreur lors de l'exportation CSV des endpoints: {str(e)}")
            return ""
    
    def _export_metadata_csv(self, data: Dict[str, Any], base_filename: str) -> str:
        """
        Exporte les métadonnées au format CSV
        """
        output_file = f"{base_filename}_metadata.csv"
        
        try:
            with open(output_file, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(["Fichier", "Type", "Champ", "Valeur"])
                
                for item in data.get("metadata", {}).get("interesting_metadata", []):
                    filename = item.get("filename", "")
                    filetype = item.get("type", "")
                    
                    for field, value in item.get("interesting_fields", {}).items():
                        writer.writerow([filename, filetype, field, value])
            
            logger.info(f"Exportation CSV des métadonnées terminée: {output_file}")
            return os.path.abspath(output_file)
            
        except Exception as e:
            logger.error(f"Erreur lors de l'exportation CSV des métadonnées: {str(e)}")
            return ""
    
    def export_html(self, data: Dict[str, Any], filename: str) -> str:
        """
        Exporte les données au format HTML
        
        Args:
            data: Données à exporter
            filename: Nom de fichier (sans extension)
            
        Returns:
            Chemin du fichier exporté
        """
        output_file = f"{filename}.html"
        logger.info(f"Exportation des données au format HTML: {output_file}")
        
        try:
            with open(output_file, "w", encoding="utf-8") as f:
                # Début du document HTML
                f.write("""
                <!DOCTYPE html>
                <html lang="fr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Rapport de Scan - HakBoardCrawler</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                        h1 { color: #2c3e50; }
                        h2 { color: #3498db; margin-top: 30px; }
                        h3 { color: #2980b9; }
                        .container { max-width: 1200px; margin: 0 auto; }
                        .section { margin-bottom: 30px; padding: 20px; border-radius: 5px; background-color: #f9f9f9; }
                        .info { color: #16a085; }
                        .warning { color: #f39c12; }
                        .danger { color: #c0392b; }
                        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                        th { background-color: #f2f2f2; }
                        tr:hover { background-color: #f5f5f5; }
                        .footer { margin-top: 50px; text-align: center; font-size: 0.8em; color: #7f8c8d; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Rapport de Scan - HakBoardCrawler</h1>
                """)
                
                # Informations générales
                f.write(f"""
                        <div class="section">
                            <h2>Informations Générales</h2>
                            <table>
                                <tr><th>Cible</th><td>{data.get('target', 'N/A')}</td></tr>
                                <tr><th>Date</th><td>{data.get('timestamp', 'N/A')}</td></tr>
                                <tr><th>Mode</th><td>{data.get('mode', 'N/A')}</td></tr>
                            </table>
                        </div>
                """)
                
                # Vulnérabilités détectées
                if "header_issues" in data or "potential_vulnerabilities" in data:
                    f.write("""
                        <div class="section">
                            <h2>Vulnérabilités Détectées</h2>
                            <table>
                                <tr>
                                    <th>Type</th>
                                    <th>Sévérité</th>
                                    <th>Description</th>
                                </tr>
                    """)
                    
                    for issue in data.get("header_issues", []):
                        severity_class = "info"
                        if issue.get("severity") == "high":
                            severity_class = "danger"
                        elif issue.get("severity") == "medium":
                            severity_class = "warning"
                            
                        f.write(f"""
                            <tr>
                                <td>En-tête {issue.get('header', '')}</td>
                                <td class="{severity_class}">{issue.get('severity', '')}</td>
                                <td>{issue.get('description', '')}</td>
                            </tr>
                        """)
                    
                    for vuln in data.get("potential_vulnerabilities", []):
                        severity_class = "info"
                        if vuln.get("severity") == "high":
                            severity_class = "danger"
                        elif vuln.get("severity") == "medium":
                            severity_class = "warning"
                            
                        f.write(f"""
                            <tr>
                                <td>{vuln.get('type', '')}</td>
                                <td class="{severity_class}">{vuln.get('severity', '')}</td>
                                <td>{vuln.get('description', '')}</td>
                            </tr>
                        """)
                    
                    f.write("""
                            </table>
                        </div>
                    """)
                
                # Fichiers sensibles
                if "exposed_files" in data:
                    f.write("""
                        <div class="section">
                            <h2>Fichiers Sensibles Exposés</h2>
                            <table>
                                <tr>
                                    <th>Chemin</th>
                                    <th>Status</th>
                                    <th>Type</th>
                                </tr>
                    """)
                    
                    for file in data.get("exposed_files", []):
                        f.write(f"""
                            <tr>
                                <td>{file.get('path', '')}</td>
                                <td>{file.get('status_code', '')}</td>
                                <td>{file.get('content_type', '')}</td>
                            </tr>
                        """)
                    
                    f.write("""
                            </table>
                        </div>
                    """)
                
                # Endpoints API
                if "endpoints" in data:
                    f.write("""
                        <div class="section">
                            <h2>Endpoints API Détectés</h2>
                            <table>
                                <tr>
                                    <th>URL</th>
                                    <th>Méthode</th>
                                    <th>Paramètres</th>
                                </tr>
                    """)
                    
                    for endpoint in data.get("endpoints", {}).get("endpoints", []):
                        f.write(f"""
                            <tr>
                                <td>{endpoint.get('url', '')}</td>
                                <td>{endpoint.get('method', 'GET')}</td>
                                <td>{', '.join(endpoint.get('parameters', []))}</td>
                            </tr>
                        """)
                    
                    f.write("""
                            </table>
                        </div>
                    """)
                
                # Métadonnées
                if "metadata" in data and "interesting_metadata" in data["metadata"]:
                    f.write("""
                        <div class="section">
                            <h2>Métadonnées Intéressantes</h2>
                            <table>
                                <tr>
                                    <th>Fichier</th>
                                    <th>Type</th>
                                    <th>Champ</th>
                                    <th>Valeur</th>
                                </tr>
                    """)
                    
                    for item in data.get("metadata", {}).get("interesting_metadata", []):
                        filename = item.get("filename", "")
                        filetype = item.get("type", "")
                        
                        for field, value in item.get("interesting_fields", {}).items():
                            f.write(f"""
                                <tr>
                                    <td>{filename}</td>
                                    <td>{filetype}</td>
                                    <td>{field}</td>
                                    <td>{value}</td>
                                </tr>
                            """)
                    
                    f.write("""
                            </table>
                        </div>
                    """)
                
                # Ajout de la section Site Map et Ressources
                f.write("""
                    <div class="section">
                        <h2>Carte du Site</h2>
                """)
                
                # Ajout des statistiques des ressources
                if "summary" in data and "resources" in data["summary"]:
                    resources = data["summary"]["resources"]
                    f.write(f"""
                        <h3>Statistiques des Ressources</h3>
                        <table>
                            <tr>
                                <th>Type de Ressource</th>
                                <th>Nombre</th>
                            </tr>
                            <tr>
                                <td>Pages/URLs Total</td>
                                <td>{data["summary"].get("total_urls", 0)}</td>
                            </tr>
                            <tr>
                                <td>Images</td>
                                <td>{resources.get("images", 0)}</td>
                            </tr>
                            <tr>
                                <td>Scripts</td>
                                <td>{resources.get("scripts", 0)}</td>
                            </tr>
                            <tr>
                                <td>Feuilles de style</td>
                                <td>{resources.get("stylesheets", 0)}</td>
                            </tr>
                            <tr>
                                <td>Polices</td>
                                <td>{resources.get("fonts", 0)}</td>
                            </tr>
                            <tr>
                                <td>Média</td>
                                <td>{resources.get("media", 0)}</td>
                            </tr>
                        </table>
                    """)
                
                # Ajout de la structure du site (liste des pages)
                if "site_map" in data and "nodes" in data["site_map"]:
                    f.write("""
                        <h3>Pages découvertes</h3>
                        <table>
                            <tr>
                                <th>URL</th>
                                <th>Titre</th>
                                <th>Statut</th>
                                <th>Profondeur</th>
                            </tr>
                    """)
                    
                    for node in data["site_map"]["nodes"]:
                        f.write(f"""
                            <tr>
                                <td>{node.get("url", "")}</td>
                                <td>{node.get("title", "")}</td>
                                <td>{node.get("status", "")}</td>
                                <td>{node.get("depth", "")}</td>
                            </tr>
                        """)
                    
                    f.write("""
                        </table>
                    """)
                    
                # Ajout des informations sur les liens externes
                if "site_map" in data and "nodes" in data["site_map"]:
                    external_links = []
                    for node in data["site_map"]["nodes"]:
                        for link in node.get("links", []):
                            if link.get("is_external", False):
                                external_links.append(link)
                    
                    if external_links:
                        f.write("""
                            <h3>Liens Externes</h3>
                            <table>
                                <tr>
                                    <th>URL</th>
                                    <th>Texte</th>
                                </tr>
                        """)
                        
                        for link in external_links:
                            f.write(f"""
                                <tr>
                                    <td>{link.get("url", "")}</td>
                                    <td>{link.get("text", "")}</td>
                                </tr>
                            """)
                        
                        f.write("""
                            </table>
                        """)
                
                f.write("""
                    </div>
                """)
                
                # Fin du document HTML
                f.write("""
                        <div class="footer">
                            <p>Généré par HakBoardCrawler</p>
                        </div>
                    </div>
                </body>
                </html>
                """)
            
            logger.info(f"Exportation HTML terminée: {output_file}")
            return os.path.abspath(output_file)
        
        except Exception as e:
            logger.error(f"Erreur lors de l'exportation HTML: {str(e)}")
            return ""
    
    def export_pdf(self, data: Dict[str, Any], filename: str) -> str:
        """
        Exporte les données au format PDF
        
        Args:
            data: Données à exporter
            filename: Nom de fichier (sans extension)
            
        Returns:
            Chemin du fichier exporté
        """
        output_file = f"{filename}.pdf"
        logger.info(f"Exportation des données au format PDF: {output_file}")
        
        try:
            # Générer d'abord un fichier HTML
            html_file = self.export_html(data, filename)
            
            # Convertir HTML en PDF avec pdfkit
            try:
                import pdfkit
                pdfkit.from_file(html_file, output_file)
                logger.info(f"Exportation PDF terminée: {output_file}")
                return os.path.abspath(output_file)
            except ImportError:
                logger.warning("Module pdfkit non disponible. Exportation PDF impossible.")
                return html_file
            except Exception as e:
                logger.error(f"Erreur lors de la génération du PDF: {str(e)}")
                return html_file
        
        except Exception as e:
            logger.error(f"Erreur lors de l'exportation PDF: {str(e)}")
            return "" 