from typing import Dict, Any, List
import datetime
import os

class HTMLExporter:
    def generate_html(self, results: Dict[str, Any]) -> str:
        """
        Génère un rapport HTML à partir des résultats
        
        Args:
            results: Résultats du scan
            
        Returns:
            Contenu HTML du rapport
        """
        template = """
                <!DOCTYPE html>
                <html lang="fr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Rapport de Scan - HakBoardCrawler</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            margin: 0;
                            padding: 0;
                            background-color: #f5f5f5;
                            color: #333;
                        }
                        .container {
                            max-width: 1200px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .header {
                            background-color: #2c3e50;
                            color: white;
                            padding: 20px;
                            border-radius: 5px;
                            margin-bottom: 20px;
                        }
                        .section {
                            margin-bottom: 30px;
                        }
                        h1, h2, h3, h4 {
                            margin-top: 0;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 20px;
                        }
                        th, td {
                            padding: 12px 15px;
                            text-align: left;
                            border-bottom: 1px solid #ddd;
                        }
                        th {
                            background-color: #f8f9fa;
                        }
                        .severity-high {
                            color: #dc3545;
                            font-weight: bold;
                        }
                        .severity-medium {
                            color: #fd7e14;
                            font-weight: bold;
                        }
                        .severity-low {
                            color: #ffc107;
                        }
                        .severity-info {
                            color: #17a2b8;
                        }
                        .badge {
                            display: inline-block;
                            padding: 0.25em 0.4em;
                            font-size: 75%;
                            font-weight: 700;
                            line-height: 1;
                            text-align: center;
                            white-space: nowrap;
                            vertical-align: baseline;
                            border-radius: 0.25rem;
                            margin-right: 5px;
                        }
                        .badge-danger {
                            color: #fff;
                            background-color: #dc3545;
                        }
                        .badge-warning {
                            color: #212529;
                            background-color: #ffc107;
                        }
                        .badge-info {
                            color: #fff;
                            background-color: #17a2b8;
                        }
                        pre {
                            background-color: #f8f9fa;
                            padding: 15px;
                            border-radius: 5px;
                            overflow-x: auto;
                        }
                        /* Styles pour l'arborescence du site */
                        .tree {
                            list-style: none;
                            padding-left: 20px;
                        }
                        .tree li {
                            position: relative;
                            padding-left: 25px;
                            margin: 5px 0;
                        }
                        .tree li::before {
                            content: "";
                            position: absolute;
                            left: 0;
                            top: 0;
                            border-left: 1px solid #ccc;
                            height: 100%;
                        }
                        .tree li::after {
                            content: "";
                            position: absolute;
                            left: 0;
                            top: 10px;
                            width: 20px;
                            border-top: 1px solid #ccc;
                        }
                        .tree li:last-child::before {
                            height: 10px;
                        }
                        .tree ul {
                            list-style: none;
                            padding-left: 0;
                        }
                        .folder {
                            color: #2c3e50;
                            font-weight: bold;
                        }
                        .page {
                            color: #3498db;
                            text-decoration: none;
                        }
                        .page:hover {
                            text-decoration: underline;
                        }
                        .site-tree {
                            max-height: 500px;
                            overflow-y: auto;
                            border: 1px solid #eee;
                            padding: 10px;
                            border-radius: 5px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Rapport de Scan - HakBoardCrawler</h1>
                
                        <div class="section">
                            <h2>Informations Générales</h2>
                            <table>
                                <tr><th>Cible</th><td>{target}</td></tr>
                                <tr><th>Date</th><td>{timestamp}</td></tr>
                                <tr><th>Mode</th><td>{mode}</td></tr>
                            </table>
                        </div>
                
                        <div class="section">
                            <h2>Vulnérabilités Détectées</h2>
                            <table>
                                <tr>
                                    <th>Type</th>
                                    <th>Sévérité</th>
                                    <th>Description</th>
                                </tr>
                    {vulnerabilities_rows}
                            </table>
                        </div>
                    
                        <div class="section">
                            <h2>Fichiers Sensibles Exposés</h2>
                            <table>
                                <tr>
                                    <th>Chemin</th>
                                    <th>Status</th>
                                    <th>Type</th>
                                </tr>
                    {exposed_files_rows}
                            </table>
                        </div>
                    
                        <div class="section">
                            <h2>Endpoints API Détectés</h2>
                            <table>
                                <tr>
                                    <th>URL</th>
                                    <th>Méthode</th>
                                    <th>Paramètres</th>
                                </tr>
                    {api_endpoints_rows}
                            </table>
                        </div>
                    
                        <div class="section">
                            <h2>Métadonnées Intéressantes</h2>
                            <table>
                                <tr>
                                    <th>Fichier</th>
                                    <th>Type</th>
                                    <th>Champ</th>
                                    <th>Valeur</th>
                                </tr>
                    {metadata_rows}
                            </table>
                        </div>

                        <div class="section mb-5" id="sitemap">
                            <div class="card shadow">
                                <div class="card-header bg-primary text-white">
                                    <h3 class="mb-0">Arborescence du Site</h3>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <h4>Structure du site</h4>
                                            <div class="site-tree">
                                                ${self._format_site_structure(data.get('site_map', {}).get('structure', {}))}
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <h4>Statistiques</h4>
                                            <div class="table-responsive">
                                                <table class="table table-bordered table-striped">
                                                    <tbody>
                                                        <tr>
                                                            <th scope="row">Pages analysées</th>
                                                            <td>${data.get('site_map', {}).get('stats', {}).get('total_pages', 0)}</td>
                                                        </tr>
                                                        <tr>
                                                            <th scope="row">Images</th>
                                                            <td>${data.get('site_map', {}).get('stats', {}).get('total_images', 0)}</td>
                                                        </tr>
                                                        <tr>
                                                            <th scope="row">Scripts</th>
                                                            <td>${data.get('site_map', {}).get('stats', {}).get('total_scripts', 0)}</td>
                                                        </tr>
                                                        <tr>
                                                            <th scope="row">Feuilles de style</th>
                                                            <td>${data.get('site_map', {}).get('stats', {}).get('total_styles', 0)}</td>
                                                        </tr>
                                                        <tr>
                                                            <th scope="row">Formulaires</th>
                                                            <td>${data.get('site_map', {}).get('stats', {}).get('total_forms', 0)}</td>
                                                        </tr>
                                                        <tr>
                                                            <th scope="row">Liens externes</th>
                                                            <td>${self._count_external_links(data.get('site_map', {}).get('resources', {}).get('links', []))}</td>
                                                        </tr>
                                                        <tr>
                                                            <th scope="row">Profondeur maximale</th>
                                                            <td>${data.get('site_map', {}).get('stats', {}).get('max_depth', 0)}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    
                        <div class="footer">
                            <p>Généré par HakBoardCrawler</p>
                        </div>
                    </div>
                </body>
                </html>
                """
        
        # Préparation des données
        target = results.get("target", "N/A")
        timestamp = results.get("timestamp", datetime.datetime.now().isoformat())
        mode = results.get("mode", "N/A")
        
        # Vulnérabilités
        vulnerabilities_rows = ""
        header_issues = results.get("header_issues", [])
        vulnerabilities = results.get("vulnerabilities", {})
        
        if header_issues:
            for issue in header_issues:
                severity = issue.get("severity", "info")
                severity_class = self._get_severity_class(severity)
                
                vulnerabilities_rows += f"""
                            <tr>
                                <td>En-tête {issue.get('header', 'N/A')}</td>
                                <td class="{severity_class}">{severity}</td>
                                <td>{issue.get('description', 'N/A')}</td>
                            </tr>
                        """
        elif vulnerabilities:
            for issue_type in ["header_issues", "cors_issues", "csp_issues"]:
                for issue in vulnerabilities.get(issue_type, []):
                    severity = issue.get("severity", "info")
                    severity_class = self._get_severity_class(severity)
                    
                    vulnerabilities_rows += f"""
                                <tr>
                                    <td>En-tête {issue.get('header', 'N/A')}</td>
                                    <td class="{severity_class}">{severity}</td>
                                    <td>{issue.get('description', 'N/A')}</td>
                                </tr>
                            """
        
        # Fichiers sensibles exposés
        exposed_files_rows = ""
        exposed_files = results.get("exposed_files", [])
        
        if not exposed_files and "vulnerabilities" in results:
            exposed_files = results["vulnerabilities"].get("exposed_files", [])
        
        for file in exposed_files:
            exposed_files_rows += f"""
                            <tr>
                                <td>{file.get('path', 'N/A')}</td>
                                <td>{file.get('status_code', 'N/A')}</td>
                                <td>{file.get('content_type', 'N/A')}</td>
                            </tr>
                        """
        
        # Endpoints API
        api_endpoints_rows = ""
        endpoints = results.get("endpoints", {}).get("endpoints", [])
        
        for endpoint in endpoints:
            api_endpoints_rows += f"""
                            <tr>
                                <td>{endpoint.get('url', 'N/A')}</td>
                                <td>{endpoint.get('method', 'GET')}</td>
                                <td>{', '.join(endpoint.get('parameters', []))}</td>
                            </tr>
                        """
        
        # Métadonnées intéressantes
        metadata_rows = ""
        metadata = results.get("metadata", {}).get("interesting_metadata", [])
        
        for item in metadata:
            file_name = os.path.basename(item.get("url", "")) or item.get("filename", "N/A")
            
            for field, value in item.get("interesting_fields", {}).items():
                metadata_rows += f"""
                                <tr>
                                    <td>{file_name}</td>
                                    <td>{item.get('type', 'N/A')}</td>
                                    <td>{field}</td>
                                    <td>{value}</td>
                                </tr>
                            """

        # Remplacer les variables dans le template
        html = template.format(
            target=target,
            timestamp=timestamp,
            mode=mode,
            vulnerabilities_rows=vulnerabilities_rows,
            exposed_files_rows=exposed_files_rows,
            api_endpoints_rows=api_endpoints_rows,
            metadata_rows=metadata_rows
        )
        
        return html
    
    def _get_severity_class(self, severity: str) -> str:
        """
        Retourne la classe CSS pour la sévérité
        
        Args:
            severity: Niveau de sévérité
            
        Returns:
            Classe CSS correspondante
        """
        severity_map = {
            "high": "danger",
            "medium": "warning",
            "low": "info",
            "info": "info"
        }
        return severity_map.get(severity.lower(), "info")
    
    def _format_tree_view(self, structure: Dict[str, Any], prefix: str = "", is_last: bool = True) -> List[str]:
        """
        Formatte l'arborescence du site pour l'affichage
        
        Args:
            structure: Structure de l'arborescence
            prefix: Préfixe pour l'indentation
            is_last: Si c'est le dernier élément de sa branche
            
        Returns:
            Liste de lignes formatées
        """
        lines = []
        
        # Ajouter le nœud racine
        if "name" in structure:
            connector = "└── " if is_last else "├── "
            lines.append(f"{prefix}{connector}{structure['name']}")
            
            # Mise à jour du préfixe pour les enfants
            child_prefix = prefix + ("    " if is_last else "│   ")
            
            # Ajouter les URLs
            for url_data in structure.get("urls", []):
                url_title = url_data.get("title", "") or url_data.get("url", "")
                lines.append(f"{child_prefix}└── {url_title}")
            
            # Traiter les enfants
            children = sorted(structure.get("children", {}).items())
            for i, (name, child) in enumerate(children):
                is_last_child = i == len(children) - 1
                lines.extend(self._format_tree_view(child, child_prefix, is_last_child))
        
        return lines

    def _count_external_links(self, links):
        """
        Compte le nombre de liens externes
        
        Args:
            links: Liste des liens
            
        Returns:
            Nombre de liens externes
        """
        count = 0
        for link in links:
            if link.get('is_external', False):
                count += 1
        return count

    def _format_site_structure(self, structure, depth=0):
        """
        Formatte la structure du site en HTML
        
        Args:
            structure: Structure du site
            depth: Profondeur actuelle
            
        Returns:
            HTML formatté
        """
        if not structure:
            return '<div class="text-muted">Aucune structure disponible</div>'
        
        html = '<ul class="tree">'
        
        # Gérer le nœud racine
        if depth == 0:
            html += f'<li><span class="folder">{structure.get("name", "Root")}</span>'
            if structure.get("children"):
                html += self._format_site_structure_children(structure.get("children", {}), depth + 1)
            html += '</li>'
        else:
            html += self._format_site_structure_children(structure, depth)
        
        html += '</ul>'
        return html

    def _format_site_structure_children(self, children, depth):
        """
        Formatte les enfants de la structure du site
        
        Args:
            children: Enfants de la structure
            depth: Profondeur actuelle
            
        Returns:
            HTML formatté
        """
        html = '<ul>'
        
        for name, child in children.items():
            html += f'<li><span class="folder">{name}</span>'
            
            if child.get("urls"):
                html += '<ul>'
                for url_entry in child.get("urls", []):
                    title = url_entry.get("title") or url_entry.get("url")
                    html += f'<li><a href="{url_entry.get("url")}" target="_blank" class="page">{title}</a></li>'
                html += '</ul>'
            
            if child.get("children"):
                if depth < 10:  # Limiter la profondeur pour éviter les problèmes de rendu
                    html += self._format_site_structure_children(child.get("children", {}), depth + 1)
            
            html += '</li>'
        
        html += '</ul>'
        return html 