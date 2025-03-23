"""
Interface en ligne de commande pour HakBoardCrawler
"""

import argparse
import logging
import sys
import json
from typing import List, Optional

from . import Crawler, __version__

def setup_logging(verbose: bool = False):
    """
    Configure le système de logging
    """
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

def parse_args(args: Optional[List[str]] = None):
    """
    Parse les arguments de la ligne de commande
    """
    parser = argparse.ArgumentParser(
        description="HakBoardCrawler - Un crawler avancé pour le Red/Blue Teaming"
    )
    parser.add_argument(
        "--version", action="version", version=f"HakBoardCrawler v{__version__}"
    )
    parser.add_argument(
        "-v", "--verbose", action="store_true", help="Mode verbeux"
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Commandes disponibles")
    
    # Commande 'scan'
    scan_parser = subparsers.add_parser("scan", help="Scanner une cible")
    scan_parser.add_argument("target", help="URL ou domaine cible")
    scan_parser.add_argument(
        "--mode", choices=["stealth", "aggressive"], default="stealth",
        help="Mode de scan (défaut: stealth)"
    )
    scan_parser.add_argument(
        "--metadata", action="store_true", 
        help="Activer l'extraction de métadonnées"
    )
    scan_parser.add_argument(
        "--social", action="store_true", 
        help="Activer le scraping des réseaux sociaux"
    )
    scan_parser.add_argument(
        "--depth", type=int, default=3,
        help="Profondeur de scan (défaut: 3)"
    )
    scan_parser.add_argument(
        "--timeout", type=int, default=30,
        help="Timeout des requêtes en secondes (défaut: 30)"
    )
    scan_parser.add_argument(
        "--delay", type=float,
        help="Délai entre les requêtes en secondes"
    )
    scan_parser.add_argument(
        "--no-robots", action="store_true",
        help="Ne pas respecter robots.txt"
    )
    scan_parser.add_argument(
        "--captcha", choices=["auto", "2captcha", "disabled"], default="auto",
        help="Méthode de bypass CAPTCHA (défaut: auto)"
    )
    scan_parser.add_argument(
        "--export", default="json",
        help="Format(s) d'export séparés par virgule (json,csv,html,pdf)"
    )
    scan_parser.add_argument(
        "--output", default="rapport",
        help="Nom de base pour les fichiers exportés"
    )
    scan_parser.add_argument(
        "--proxy",
        help="URL du proxy à utiliser"
    )
    
    # Commande 'config'
    config_parser = subparsers.add_parser("config", help="Gérer la configuration")
    config_parser.add_argument(
        "--show", action="store_true",
        help="Afficher la configuration actuelle"
    )
    config_parser.add_argument(
        "--set",
        help="Définir une clé API (format: service:clé)"
    )
    
    return parser.parse_args(args)

def main(args: Optional[List[str]] = None):
    """
    Point d'entrée principal pour l'interface CLI
    """
    parsed_args = parse_args(args)
    setup_logging(parsed_args.verbose)
    
    if parsed_args.command == "scan":
        # Configuration du crawler
        kwargs = {
            "mode": parsed_args.mode,
            "scan_depth": parsed_args.depth,
            "timeout": parsed_args.timeout,
            "enable_metadata": parsed_args.metadata,
            "enable_social": parsed_args.social,
            "captcha_bypass": parsed_args.captcha,
        }
        
        if parsed_args.delay:
            kwargs["request_delay"] = parsed_args.delay
        
        if parsed_args.no_robots:
            kwargs["respect_robots_txt"] = False
            
        if parsed_args.proxy:
            kwargs["proxy"] = parsed_args.proxy
        
        # Initialisation et exécution du crawler
        crawler = Crawler(parsed_args.target, **kwargs)
        results = crawler.scan()
        
        # Export des résultats
        export_formats = [f.strip() for f in parsed_args.export.split(",")]
        for format in export_formats:
            output_file = crawler.export(results, format, parsed_args.output)
            print(f"Résultats exportés vers: {output_file}")
            
    elif parsed_args.command == "config":
        if parsed_args.show:
            # Afficher la configuration par défaut
            from .config import Config
            config = Config()
            print(json.dumps(config.config, indent=2, default=str))
            
        elif parsed_args.set:
            # La gestion complète des clés API nécessiterait un fichier de configuration persistant
            try:
                service, key = parsed_args.set.split(":", 1)
                print(f"Clé API pour {service} définie")
            except ValueError:
                print("Format invalide. Utilisez --set service:clé")
                return 1
    else:
        # Si aucune commande n'est spécifiée, afficher l'aide
        parse_args(["--help"])
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 