#!/usr/bin/env python
# -*- coding: utf-8 -*-

import tweepy
import os
import json
import sys
import re
import datetime
import argparse
from typing import List, Dict, Any, Optional

# Configuration des clés d'API (seront récupérées depuis les variables d'environnement, un fichier de config ou les arguments CLI)
def get_api_credentials(cli_credentials=None):
    """
    Récupère les identifiants d'API depuis:
    1. Les arguments de ligne de commande (priorité la plus haute)
    2. Les variables d'environnement
    3. Un fichier de configuration
    
    Args:
        cli_credentials: Dictionnaire contenant les identifiants fournis via la ligne de commande
    """
    try:
        # Commencer avec des valeurs vides
        credentials = {
            "consumer_key": None,
            "consumer_secret": None,
            "access_token": None,
            "access_token_secret": None,
            "bearer_token": None
        }
        
        # 1. Essayer de charger depuis un fichier de configuration
        config_paths = [
            os.path.expanduser("~/.config/hakboard/twitter_config.json"),
            os.path.join(os.getcwd(), "twitter_config.json")
        ]
        
        for config_file in config_paths:
            if os.path.exists(config_file):
                print(f"Chargement des identifiants depuis {config_file}")
                with open(config_file, "r") as f:
                    file_credentials = json.load(f)
                    for key in credentials:
                        if key in file_credentials and file_credentials[key]:
                            credentials[key] = file_credentials[key]
                break
        
        # 2. Essayer de récupérer depuis les variables d'environnement (priorité plus élevée que le fichier)
        env_mapping = {
            "consumer_key": "TWITTER_CONSUMER_KEY",
            "consumer_secret": "TWITTER_CONSUMER_SECRET",
            "access_token": "TWITTER_ACCESS_TOKEN",
            "access_token_secret": "TWITTER_ACCESS_TOKEN_SECRET",
            "bearer_token": "TWITTER_BEARER_TOKEN"
        }
        
        for cred_key, env_var in env_mapping.items():
            env_value = os.environ.get(env_var)
            if env_value:
                credentials[cred_key] = env_value
        
        # 3. Utiliser les identifiants fournis via la ligne de commande (priorité la plus élevée)
        if cli_credentials:
            for key, value in cli_credentials.items():
                if value:
                    credentials[key] = value
        
        # Vérifier si nous avons assez d'identifiants pour l'authentification
        if credentials["bearer_token"] or (credentials["consumer_key"] and 
                                         credentials["consumer_secret"] and 
                                         credentials["access_token"] and 
                                         credentials["access_token_secret"]):
            return credentials
        
        print("Les identifiants de l'API Twitter n'ont pas été trouvés ou sont incomplets.")
        return None
    except Exception as e:
        print(f"Erreur lors de la récupération des identifiants Twitter: {str(e)}")
        return None

def create_api_client(cli_credentials=None):
    """
    Crée et retourne un client API Twitter.
    
    Args:
        cli_credentials: Identifiants fournis via la ligne de commande
    """
    credentials = get_api_credentials(cli_credentials)
    
    if not credentials:
        print("Veuillez définir les identifiants Twitter par l'une des méthodes suivantes:")
        print("1. Arguments de la ligne de commande (--consumer-key, --consumer-secret, etc.)")
        print("2. Variables d'environnement (TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, etc.)")
        print("3. Fichier de configuration (~/.config/hakboard/twitter_config.json ou twitter_config.json)")
        return None
    
    try:
        if credentials.get("bearer_token"):
            # Utiliser l'authentification OAuth 2.0 (recommandée pour l'API v2)
            client = tweepy.Client(bearer_token=credentials["bearer_token"],
                                  consumer_key=credentials.get("consumer_key"),
                                  consumer_secret=credentials.get("consumer_secret"),
                                  access_token=credentials.get("access_token"),
                                  access_token_secret=credentials.get("access_token_secret"))
            return client
        else:
            # Utiliser l'authentification OAuth 1.0a (pour l'API v1.1)
            auth = tweepy.OAuth1UserHandler(
                credentials["consumer_key"],
                credentials["consumer_secret"],
                credentials["access_token"],
                credentials["access_token_secret"]
            )
            api = tweepy.API(auth)
            # Vérifier les identifiants
            api.verify_credentials()
            return api
    except Exception as e:
        print(f"Erreur lors de l'authentification à l'API Twitter: {str(e)}")
        return None

def get_user_tweets(client, username: str, count: int = 20, include_rts: bool = False, 
                   exclude_replies: bool = False) -> List[Dict[str, Any]]:
    """
    Récupère les tweets d'un utilisateur.
    
    Args:
        client: Client tweepy API v1.1 ou v2
        username: Nom d'utilisateur Twitter (sans @)
        count: Nombre de tweets à récupérer
        include_rts: Inclure les retweets
        exclude_replies: Exclure les réponses
    
    Returns:
        Liste de tweets
    """
    results = []
    
    try:
        # Vérifier si c'est un client v2 (tweepy.Client)
        if isinstance(client, tweepy.Client):
            # Récupérer l'ID de l'utilisateur à partir du nom d'utilisateur
            user_info = client.get_user(username=username)
            if not user_info.data:
                print(f"Utilisateur {username} non trouvé.")
                return []
            
            user_id = user_info.data.id
            
            # Construire les paramètres de requête
            params = {
                "max_results": min(count, 100),  # Max 100 par requête pour v2
                "tweet.fields": "created_at,author_id,public_metrics,text,entities,source",
                "expansions": "author_id,referenced_tweets.id",
                "user.fields": "name,username,profile_image_url"
            }
            
            # Récupérer les tweets
            tweets = client.get_users_tweets(user_id, **params)
            
            if not tweets.data:
                return []
                
            # Transformer les résultats de l'API v2 en un format standard
            for tweet in tweets.data:
                is_retweet = False
                if hasattr(tweet, 'referenced_tweets') and tweet.referenced_tweets:
                    for ref in tweet.referenced_tweets:
                        if ref.type == 'retweeted':
                            is_retweet = True
                
                # Filtrer les retweets si nécessaire
                if is_retweet and not include_rts:
                    continue
                
                # Convertir le tweet en dictionnaire
                tweet_dict = {
                    'id': tweet.id,
                    'text': tweet.text,
                    'created_at': tweet.created_at.isoformat() if hasattr(tweet, 'created_at') else None,
                    'retweet_count': tweet.public_metrics.get('retweet_count', 0) if hasattr(tweet, 'public_metrics') else 0,
                    'favorite_count': tweet.public_metrics.get('like_count', 0) if hasattr(tweet, 'public_metrics') else 0,
                    'is_retweet': is_retweet,
                    'username': username,
                    'source': getattr(tweet, 'source', None),
                    'urls': []
                }
                
                # Extraire les URLs
                if hasattr(tweet, 'entities') and tweet.entities and 'urls' in tweet.entities:
                    for url in tweet.entities['urls']:
                        tweet_dict['urls'].append({
                            'url': url.get('url'),
                            'expanded_url': url.get('expanded_url'),
                            'display_url': url.get('display_url')
                        })
                
                results.append(tweet_dict)
        else:
            # API v1.1
            tweets = client.user_timeline(
                screen_name=username, 
                count=count,
                include_rts=include_rts,
                exclude_replies=exclude_replies,
                tweet_mode='extended'
            )
            
            for tweet in tweets:
                # Convertir l'objet Status en dictionnaire
                tweet_dict = {
                    'id': tweet.id,
                    'text': tweet.full_text if hasattr(tweet, 'full_text') else tweet.text,
                    'created_at': tweet.created_at.isoformat(),
                    'retweet_count': tweet.retweet_count,
                    'favorite_count': tweet.favorite_count,
                    'is_retweet': hasattr(tweet, 'retweeted_status'),
                    'username': tweet.user.screen_name,
                    'source': tweet.source,
                    'urls': []
                }
                
                # Extraire les URLs
                if hasattr(tweet, 'entities') and 'urls' in tweet.entities:
                    for url in tweet.entities['urls']:
                        tweet_dict['urls'].append({
                            'url': url.get('url'),
                            'expanded_url': url.get('expanded_url'),
                            'display_url': url.get('display_url')
                        })
                
                results.append(tweet_dict)
        
        return results
    except Exception as e:
        print(f"Erreur lors de la récupération des tweets de {username}: {str(e)}")
        return []

def search_tweets(client, query: str, count: int = 50, result_type: str = "mixed", 
                 lang: Optional[str] = "fr") -> List[Dict[str, Any]]:
    """
    Recherche des tweets par mot-clé.
    
    Args:
        client: Client tweepy API v1.1 ou v2
        query: Requête de recherche
        count: Nombre maximum de tweets à récupérer
        result_type: Type de résultat ('mixed', 'recent', 'popular')
        lang: Langue des tweets (None pour toutes les langues)
    
    Returns:
        Liste de tweets
    """
    results = []
    
    try:
        # Vérifier si c'est un client v2 (tweepy.Client)
        if isinstance(client, tweepy.Client):
            # API v2
            params = {
                "max_results": min(count, 100),
                "tweet.fields": "created_at,author_id,public_metrics,text,entities,source",
                "expansions": "author_id",
                "user.fields": "name,username,profile_image_url",
            }
            
            # Ajouter le filtre de langue si spécifié
            if lang:
                query += f" lang:{lang}"
            
            # En API v2, le type de résultat est géré différemment
            if result_type == "recent":
                params["recency"] = "recent"
            
            tweets = client.search_recent_tweets(query, **params)
            
            if not tweets.data:
                return []
            
            # Créer un dictionnaire pour associer les IDs d'utilisateurs aux objets utilisateurs
            users_map = {user.id: user for user in tweets.includes.get('users', [])} if tweets.includes else {}
            
            for tweet in tweets.data:
                username = None
                if hasattr(tweet, 'author_id') and tweet.author_id in users_map:
                    username = users_map[tweet.author_id].username
                
                tweet_dict = {
                    'id': tweet.id,
                    'text': tweet.text,
                    'created_at': tweet.created_at.isoformat() if hasattr(tweet, 'created_at') else None,
                    'retweet_count': tweet.public_metrics.get('retweet_count', 0) if hasattr(tweet, 'public_metrics') else 0,
                    'favorite_count': tweet.public_metrics.get('like_count', 0) if hasattr(tweet, 'public_metrics') else 0,
                    'username': username,
                    'query': query,
                    'source': getattr(tweet, 'source', None),
                    'urls': []
                }
                
                # Extraire les URLs
                if hasattr(tweet, 'entities') and tweet.entities and 'urls' in tweet.entities:
                    for url in tweet.entities['urls']:
                        tweet_dict['urls'].append({
                            'url': url.get('url'),
                            'expanded_url': url.get('expanded_url'),
                            'display_url': url.get('display_url')
                        })
                
                results.append(tweet_dict)
        else:
            # API v1.1
            tweets = client.search_tweets(
                q=query,
                count=count,
                result_type=result_type,
                lang=lang,
                tweet_mode='extended'
            )
            
            for tweet in tweets:
                tweet_dict = {
                    'id': tweet.id,
                    'text': tweet.full_text if hasattr(tweet, 'full_text') else tweet.text,
                    'created_at': tweet.created_at.isoformat(),
                    'retweet_count': tweet.retweet_count,
                    'favorite_count': tweet.favorite_count,
                    'username': tweet.user.screen_name,
                    'query': query,
                    'source': tweet.source,
                    'urls': []
                }
                
                # Extraire les URLs
                if hasattr(tweet, 'entities') and 'urls' in tweet.entities:
                    for url in tweet.entities['urls']:
                        tweet_dict['urls'].append({
                            'url': url.get('url'),
                            'expanded_url': url.get('expanded_url'),
                            'display_url': url.get('display_url')
                        })
                
                results.append(tweet_dict)
        
        return results
    except Exception as e:
        print(f"Erreur lors de la recherche de tweets pour '{query}': {str(e)}")
        return []

def extract_links_from_tweets(tweets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Extrait les liens présents dans une liste de tweets.
    
    Args:
        tweets: Liste de tweets
    
    Returns:
        Liste de liens avec méta-informations
    """
    links = []
    
    for tweet in tweets:
        for url_info in tweet.get('urls', []):
            link = {
                'url': url_info.get('expanded_url', url_info.get('url')),
                'display_url': url_info.get('display_url'),
                'tweet_id': tweet.get('id'),
                'tweet_text': tweet.get('text'),
                'username': tweet.get('username'),
                'created_at': tweet.get('created_at')
            }
            links.append(link)
    
    return links

def save_results_to_json(data: Any, filename: str):
    """Sauvegarde les résultats dans un fichier JSON."""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Résultats sauvegardés dans {filename}")
    except Exception as e:
        print(f"Erreur lors de la sauvegarde des résultats: {str(e)}")

def main():
    parser = argparse.ArgumentParser(description="TweeScrap - Outil d'extraction de données Twitter")
    
    # Arguments pour les identifiants API
    parser.add_argument('--consumer-key', '--api-key', help='Clé API / Consumer Key')
    parser.add_argument('--consumer-secret', '--api-key-secret', help='Secret de clé API / Consumer Secret')
    parser.add_argument('--access-token', help="Jeton d'accès")
    parser.add_argument('--access-token-secret', help="Secret du jeton d'accès")
    parser.add_argument('--bearer-token', help="Jeton Bearer (pour l'API v2)")
    
    subparsers = parser.add_subparsers(dest='command', help='Commande à exécuter')
    
    # Commande pour obtenir les tweets d'un utilisateur
    user_parser = subparsers.add_parser('user', help='Récupérer les tweets d\'un utilisateur')
    user_parser.add_argument('username', help='Nom d\'utilisateur Twitter (sans @)')
    user_parser.add_argument('-c', '--count', type=int, default=20, help='Nombre de tweets à récupérer')
    user_parser.add_argument('-r', '--retweets', action='store_true', help='Inclure les retweets')
    user_parser.add_argument('-p', '--replies', action='store_true', help='Inclure les réponses')
    user_parser.add_argument('-o', '--output', help='Fichier de sortie (JSON)')
    user_parser.add_argument('--links-only', action='store_true', help='Extraire uniquement les liens')
    
    # Commande pour rechercher des tweets
    search_parser = subparsers.add_parser('search', help='Rechercher des tweets')
    search_parser.add_argument('query', help='Requête de recherche')
    search_parser.add_argument('-c', '--count', type=int, default=50, help='Nombre de tweets à récupérer')
    search_parser.add_argument('-t', '--type', choices=['mixed', 'recent', 'popular'], 
                              default='mixed', help='Type de résultats')
    search_parser.add_argument('-l', '--lang', default='fr', help='Langue des tweets (ex: fr, en)')
    search_parser.add_argument('-o', '--output', help='Fichier de sortie (JSON)')
    search_parser.add_argument('--links-only', action='store_true', help='Extraire uniquement les liens')
    
    args = parser.parse_args()
    
    # Préparer les identifiants de ligne de commande
    cli_credentials = {
        "consumer_key": args.consumer_key,
        "consumer_secret": args.consumer_secret,
        "access_token": args.access_token,
        "access_token_secret": args.access_token_secret,
        "bearer_token": args.bearer_token
    }
    
    # Créer le client API avec les identifiants fournis
    client = create_api_client(cli_credentials)
    if not client:
        sys.exit(1)
    
    # Exécuter la commande appropriée
    if args.command == 'user':
        tweets = get_user_tweets(
            client, 
            args.username, 
            count=args.count, 
            include_rts=args.retweets, 
            exclude_replies=not args.replies
        )
        
        if args.links_only:
            result = extract_links_from_tweets(tweets)
        else:
            result = tweets
            
        # Afficher les résultats
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
        # Sauvegarder les résultats si demandé
        if args.output:
            save_results_to_json(result, args.output)
    
    elif args.command == 'search':
        tweets = search_tweets(
            client, 
            args.query, 
            count=args.count, 
            result_type=args.type, 
            lang=args.lang
        )
        
        if args.links_only:
            result = extract_links_from_tweets(tweets)
        else:
            result = tweets
            
        # Afficher les résultats
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
        # Sauvegarder les résultats si demandé
        if args.output:
            save_results_to_json(result, args.output)
    
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
