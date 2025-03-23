# HakBoardCrawler

Un crawler web avancé conçu pour les équipes Red et Blue Teams, permettant d'analyser des sites web et détecter des vulnérabilités potentielles.

## Caractéristiques

- **Scan de vulnérabilités** : Détection automatique des failles de sécurité courantes
- **Analyse des en-têtes** : Vérification des en-têtes HTTP de sécurité
- **Détection de fichiers sensibles** : Identification des fichiers sensibles exposés
- **Extraction de métadonnées** : Analyse des métadonnées des ressources statiques et des documents
- **Détection d'endpoints API** : Découverte des points d'entrée d'API, avec support spécifique pour les frameworks populaires (Next.js, Django, Vue.js, Laravel, etc.)
- **Cartographie du site** : Génération d'une carte du site complète avec extraction des ressources statiques
- **Mode furtif** : Rotation des user-agents et délais aléatoires pour éviter la détection
- **Reconnaissance de frameworks** : Détection automatique des frameworks web utilisés par la cible
- **Export de rapports** : Exportation des résultats en JSON, HTML, CSV ou PDF
- **Analyse multi-sites** : Possibilité de scanner plusieurs domaines en une seule commande
- **Hautement configurable** : Nombreuses options pour adapter le comportement selon vos besoins

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/votre-username/hakboardcrawler.git
cd hakboardcrawler

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Sur Windows : venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt
```

## Utilisation

### Via la ligne de commande

```bash
# Scan simple
python -m hakboardcrawler example.com

# Scan agressif avec export en HTML
python -m hakboardcrawler example.com --mode aggressive --format html

# Scan en mode verbeux avec sortie personnalisée
python -m hakboardcrawler example.com -v --output scan_example

# Scan de plusieurs sites à partir d'un fichier
python -m hakboardcrawler targets.txt --format html --output multi_scan

# Scan avec options personnalisées
python -m hakboardcrawler example.com --depth 5 --threads 10 --delay 0.5 --timeout 15
```

### Mode Furtif vs Agressif

- **Mode Furtif (par défaut)** : Conçu pour minimiser la détection. Utilise une rotation des user-agents, des délais plus longs entre les requêtes, et limite la profondeur d'exploration.
  ```bash
  python -m hakboardcrawler example.com --mode stealth
  ```

- **Mode Agressif** : Scan plus rapide et approfondi. Utilise plus de threads, une exploration plus profonde, et des délais plus courts.
  ```bash
  python -m hakboardcrawler example.com --mode aggressive
  ```

### Utilisation programmatique

```python
from hakboardcrawler.crawler import Crawler

# Initialiser le crawler avec une cible
crawler = Crawler(target="example.com", mode="stealth")

# Exécuter le scan
results = crawler.scan()

# Exporter les résultats en HTML
report_path = crawler.export(results, format="html", output="rapport_example")
print(f"Rapport généré: {report_path}")

# Scan de plusieurs cibles
targets = ["example1.com", "example2.com", "example3.com"]
all_results = crawler.scan_target_list(targets, format="html", output="multi_rapport")
```

## Options Avancées

### Fichier de Configuration

Vous pouvez utiliser un fichier de configuration JSON pour personnaliser le comportement du crawler :

```json
{
  "scan_depth": 5,
  "threads": 10,
  "timeout": 15,
  "delay": 0.5,
  "respect_robots": false,
  "user_agent_rotate": true,
  "verify_ssl": false,
  "exclude_patterns": ["\\.pdf$", "/admin/", "/login/"],
  "sitemap_options": {
    "extract_scripts": true,
    "extract_forms": true
  },
  "scanner_options": {
    "check_headers": true,
    "check_csp": true
  }
}
```

Utilisation :
```bash
python -m hakboardcrawler example.com --config config.json
```

### Options pour les modules spécifiques

```bash
# Désactiver l'extraction de métadonnées
python -m hakboardcrawler example.com --no-metadata

# Désactiver la génération de carte du site
python -m hakboardcrawler example.com --no-sitemap

# Désactiver la détection d'API
python -m hakboardcrawler example.com --no-api
```

## Détection des frameworks et API

HakBoardCrawler détecte automatiquement les frameworks web populaires et recherche les endpoints API spécifiques à ces frameworks :

- **Next.js** : Détection des routes API et des données statiques
- **Django** : Détection des endpoints admin et API
- **WordPress** : Détection des API REST et admin-ajax
- **Laravel, Vue.js, React, Angular**, etc.

## Améliorations récentes

- Amélioration de la détection des APIs pour divers frameworks
- Cartographie complète du site avec extraction de toutes les ressources
- Extraction améliorée des métadonnées des images et ressources statiques
- Support pour l'analyse de plusieurs cibles en une commande
- Génération de rapports récapitulatifs pour les analyses multi-sites

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à soumettre des pull requests ou à signaler des problèmes.

## Note Légale

Cet outil est destiné à être utilisé pour des fins légitimes uniquement, comme les tests de pénétration autorisés, la recherche en sécurité, ou l'analyse de sites web dont vous êtes propriétaire. L'utilisation de cet outil pour des activités non autorisées est illégale et contraire à l'éthique.

## Licence

Ce projet est sous licence MIT. 