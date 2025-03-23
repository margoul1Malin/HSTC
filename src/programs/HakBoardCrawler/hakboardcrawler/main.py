#!/usr/bin/env python3
"""
Script principal pour le HakBoardCrawler
"""

import logging
import argparse
import sys
import os
import time
from pathlib import Path
from typing import List, Optional

from .crawler import Crawler

def setup_logging(verbosity: int) -> None:
    """
    Configure le niveau de journalisation
    
    Args:
        verbosity: Niveau de verbosité (0-3)
    """
    log_levels = {
        0: logging.ERROR,
        1: logging.WARNING,
        2: logging.INFO,
        3: logging.DEBUG
    }
    
    level = log_levels.get(verbosity, logging.INFO)
    
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

def validate_targets(targets: List[str]) -> List[str]:
    """
    Valide et normalise les cibles
    
    Args:
        targets: Liste des URLs ou chemin vers un fichier
        
    Returns:
        Liste des URLs normalisées
    """
    # Si c'est un fichier, le lire
    if len(targets) == 1 and os.path.isfile(targets[0]):
        try:
            with open(targets[0], 'r') as f:
                targets = [line.strip() for line in f if line.strip() and not line.startswith('#')]
        except Exception as e:
            logging.error(f"Erreur lors de la lecture du fichier de cibles: {str(e)}")
            sys.exit(1)
    
    # Normaliser les URLs
    normalized_targets = []
    for target in targets:
        # Enlever les espaces
        target = target.strip()
        
        # Vérifier si c'est une URL valide
        if not target:
            continue
            
        normalized_targets.append(target)
    
    return normalized_targets

def main() -> None:
    """
    Point d'entrée principal
    """
    parser = argparse.ArgumentParser(description='HakBoardCrawler - Un scanner de vulnérabilités web')
    
    # Arguments obligatoires
    parser.add_argument('targets', metavar='TARGET', nargs='+',
                        help='URL(s) ou domaine(s) cible(s), ou chemin vers un fichier contenant une liste de cibles')
    
    # Arguments facultatifs
    parser.add_argument('-m', '--mode', choices=['stealth', 'aggressive'], default='stealth',
                        help='Mode d\'exécution (stealth ou aggressive). Par défaut: stealth')
    parser.add_argument('-f', '--format', choices=['json', 'html', 'csv', 'pdf'], default='json',
                        help='Format d\'exportation. Par défaut: json')
    parser.add_argument('-o', '--output', default='rapport',
                        help='Préfixe du fichier de sortie. Par défaut: rapport')
    parser.add_argument('-c', '--config', help='Chemin vers le fichier de configuration')
    parser.add_argument('-d', '--depth', type=int, help='Profondeur maximale d\'exploration')
    parser.add_argument('-t', '--threads', type=int, help='Nombre de threads pour les requêtes parallèles')
    parser.add_argument('--delay', type=float, help='Délai entre les requêtes (en secondes)')
    parser.add_argument('--timeout', type=int, help='Délai d\'expiration des requêtes (en secondes)')
    parser.add_argument('--cookies', help='Cookies à inclure dans les requêtes (format: nom1=valeur1;nom2=valeur2)')
    parser.add_argument('--headers', help='En-têtes HTTP à inclure (format: nom1:valeur1;nom2:valeur2)')
    parser.add_argument('--user-agent', help='User-Agent à utiliser')
    parser.add_argument('--proxy', help='Proxy à utiliser (format: protocol://host:port)')
    parser.add_argument('-v', '--verbose', action='count', default=0, help='Augmente la verbosité')
    parser.add_argument('--no-metadata', action='store_true', help='Désactive l\'extraction de métadonnées')
    parser.add_argument('--no-sitemap', action='store_true', help='Désactive la génération de la carte du site')
    parser.add_argument('--no-api', action='store_true', help='Désactive la détection des API')
    parser.add_argument('--open', action='store_true', help='Ouvre le rapport dans le navigateur après le scan')
    
    args = parser.parse_args()
    
    # Configurer le logging
    setup_logging(args.verbose)
    
    # Valider et normaliser les cibles
    targets = validate_targets(args.targets)
    
    if not targets:
        logging.error("Aucune cible valide spécifiée")
        sys.exit(1)
    
    start_time = time.time()
    
    # Créer et configurer le crawler
    crawler = Crawler(targets[0], args.mode, args.config)
    
    # Appliquer les configurations supplémentaires
    if args.depth is not None:
        crawler.config.scan_depth = args.depth
    if args.threads is not None:
        crawler.config.threads = args.threads
    if args.delay is not None:
        crawler.config.delay = args.delay
    if args.timeout is not None:
        crawler.config.timeout = args.timeout
    if args.cookies:
        crawler.config.cookies = args.cookies
    if args.headers:
        crawler.config.headers = {
            k: v for k, v in [h.split(':', 1) for h in args.headers.split(';')]
        }
    if args.user_agent:
        crawler.config.user_agent = args.user_agent
    if args.proxy:
        crawler.config.proxy = args.proxy
    
    # Désactivation de certains modules
    if args.no_metadata:
        crawler.config.enable_metadata = False
    if args.no_sitemap:
        crawler.config.enable_sitemap = False
    if args.no_api:
        crawler.config.enable_api_detection = False
    
    try:
        # Scan unique ou multiple
        if len(targets) == 1:
            logging.info(f"Démarrage du scan de {targets[0]}")
            results = crawler.scan()
            report_path = crawler.export(results, args.format, args.output)
            logging.info(f"Scan terminé en {time.time() - start_time:.2f} secondes")
            logging.info(f"Rapport sauvegardé dans {report_path}")
            
            # Ouvrir le rapport si demandé
            if args.open and report_path:
                try:
                    import webbrowser
                    webbrowser.open(f"file://{os.path.abspath(report_path)}")
                except Exception as e:
                    logging.error(f"Erreur lors de l'ouverture du rapport: {str(e)}")
        else:
            logging.info(f"Démarrage du scan multiple pour {len(targets)} cibles")
            crawler.scan_target_list(targets, args.format, args.output)
            logging.info(f"Scan multiple terminé en {time.time() - start_time:.2f} secondes")
            logging.info(f"Rapports sauvegardés avec le préfixe {args.output}")
    
    except KeyboardInterrupt:
        logging.warning("Scan interrompu par l'utilisateur")
        sys.exit(1)
    except Exception as e:
        logging.error(f"Erreur lors du scan: {str(e)}")
        if args.verbose >= 3:
            import traceback
            traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main() 