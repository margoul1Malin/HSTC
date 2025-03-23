"""
Module d'extraction de métadonnées à partir de fichiers et d'URL
"""

import logging
import os
import re
import json
import tempfile
from typing import Dict, Any, List, Optional, Tuple
from urllib.parse import urlparse, urljoin
import requests
import concurrent.futures
from bs4 import BeautifulSoup

# Importer les bibliothèques d'extraction de métadonnées si disponibles
try:
    import PyPDF2
    PYPDF2_AVAILABLE = True
except ImportError:
    PYPDF2_AVAILABLE = False

try:
    import exifread
    EXIFREAD_AVAILABLE = True
except ImportError:
    EXIFREAD_AVAILABLE = False

try:
    from PIL import Image
    from PIL.ExifTags import TAGS
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    import docx
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

from ..config import CrawlerConfig

logger = logging.getLogger(__name__)

class MetadataExtractor:
    """
    Classe pour extraire les métadonnées de divers types de fichiers
    """
    
    # Extensions de fichiers prises en charge
    SUPPORTED_EXTENSIONS = {
        "pdf": [".pdf"],
        "office": [".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"],
        "image": [".jpg", ".jpeg", ".png", ".gif", ".tiff", ".bmp"],
        "audio": [".mp3", ".wav", ".flac", ".ogg", ".m4a"],
        "video": [".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv"],
        "archive": [".zip", ".rar", ".7z", ".tar", ".gz"],
        "code": [".html", ".xml", ".js", ".css", ".php", ".aspx", ".jsp"]
    }
    
    # Types MIME pris en charge
    SUPPORTED_MIMETYPES = {
        "pdf": ["application/pdf"],
        "office": [
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        ],
        "image": [
            "image/jpeg", "image/png", "image/gif", 
            "image/tiff", "image/bmp", "image/webp"
        ],
        "audio": [
            "audio/mpeg", "audio/wav", "audio/flac", 
            "audio/ogg", "audio/mp4"
        ],
        "video": [
            "video/mp4", "video/avi", "video/quicktime", 
            "video/x-ms-wmv", "video/x-flv", "video/x-matroska"
        ],
        "archive": [
            "application/zip", "application/x-rar-compressed", 
            "application/x-7z-compressed", "application/x-tar", 
            "application/gzip"
        ],
        "code": [
            "text/html", "text/xml", "application/javascript", 
            "text/css", "application/x-php", "application/x-aspx", 
            "application/x-jsp"
        ]
    }
    
    def __init__(self, config: Optional[Any] = None):
        """
        Initialise l'extracteur de métadonnées
        
        Args:
            config: Configuration du crawler
        """
        self.config = config or CrawlerConfig()
        self.session = requests.Session()
        
        # Configuration de la session
        if self.config.user_agent_rotate:
            self.session.headers.update({"User-Agent": self.config.get_user_agent()})
        else:
            self.session.headers.update({"User-Agent": self.config.user_agent or "HakBoardCrawler/1.0"})
        
        # Configuration du proxy si nécessaire
        if self.config.proxy:
            self.session.proxies = {
                "http": self.config.proxy,
                "https": self.config.proxy
            }
        
        # Avertissement si certaines bibliothèques sont manquantes
        if not PYPDF2_AVAILABLE:
            logger.warning("Module PyPDF2 non disponible. L'extraction de métadonnées PDF sera limitée.")
        if not EXIFREAD_AVAILABLE and not PIL_AVAILABLE:
            logger.warning("Modules exifread et PIL non disponibles. L'extraction de métadonnées EXIF sera limitée.")
        if not DOCX_AVAILABLE:
            logger.warning("Module python-docx non disponible. L'extraction de métadonnées DOCX sera limitée.")
        
        logger.info("Extracteur de métadonnées initialisé")
    
    def extract_from_url(self, url: str) -> Dict[str, Any]:
        """
        Extrait les métadonnées à partir d'une URL
        
        Args:
            url: URL du site à analyser
            
        Returns:
            Dictionnaire des métadonnées trouvées
        """
        logger.info(f"Extraction des métadonnées à partir de {url}")
        
        results = {
            "url": url,
            "files": [],
            "interesting_metadata": [],
            "social_metadata": {},
            "html_metadata": {},
            "framework_info": {},
            "static_resources": {
                "images": [],
                "scripts": [],
                "stylesheets": [],
                "fonts": [],
                "media": []
            }
        }
        
        try:
            # Récupérer la page
            response = self.session.get(url, timeout=self.config.timeout)
            
            # Extraire les métadonnées HTML
            html_metadata = self._extract_html_metadata(response.text, url)
            results["html_metadata"] = html_metadata
            
            # Détecter le framework
            framework_info = self._detect_framework(response.text, url)
            results["framework_info"] = framework_info
            
            # Extraire les ressources statiques
            static_resources = self._extract_static_resources(response.text, url)
            results["static_resources"] = static_resources
            
            # Rechercher des liens vers des fichiers
            files = self._find_files_in_html(response.text, url)
            
            # Ajouter les fichiers spécifiques au framework détecté
            if framework_info.get("name"):
                framework_files = self._find_framework_specific_files(url, framework_info["name"])
                files.extend(framework_files)
            
            # Extraire les métadonnées des fichiers trouvés
            extracted_files = []
            interesting_metadata = []
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                future_to_file = {
                    executor.submit(self._extract_file_metadata, file_url): file_url
                    for file_url in files[:20]  # Limiter à 20 fichiers
                }
                
                for future in concurrent.futures.as_completed(future_to_file):
                    file_url = future_to_file[future]
                    try:
                        metadata = future.result()
                        if metadata:
                            extracted_files.append(metadata)
                            
                            # Vérifier si les métadonnées sont intéressantes
                            if self._is_interesting_metadata(metadata):
                                interesting_metadata.append({
                                    "filename": metadata.get("filename", ""),
                                    "type": metadata.get("filetype", ""),
                                    "url": metadata.get("url", ""),
                                    "interesting_fields": self._get_interesting_fields(metadata)
                                })
                    except Exception as e:
                        logger.error(f"Erreur lors de l'extraction des métadonnées de {file_url}: {str(e)}")
            
            # Traiter également les images trouvées dans les ressources statiques
            for img in static_resources["images"]:
                try:
                    img_url = img["src"]
                    # Éviter de traiter deux fois la même image
                    if img_url not in [f["url"] for f in extracted_files]:
                        metadata = self._extract_file_metadata(img_url)
                        if metadata:
                            extracted_files.append(metadata)
                            if self._is_interesting_metadata(metadata):
                                interesting_metadata.append({
                                    "filename": metadata.get("filename", ""),
                                    "type": metadata.get("filetype", ""),
                                    "url": metadata.get("url", ""),
                                    "interesting_fields": self._get_interesting_fields(metadata)
                                })
                except Exception as e:
                    logger.error(f"Erreur lors de l'extraction des métadonnées de l'image {img.get('src', '')}: {str(e)}")
            
            results["files"] = extracted_files
            results["interesting_metadata"] = interesting_metadata
            
            logger.info(f"Extraction terminée. {len(extracted_files)} fichiers analysés, {len(interesting_metadata)} avec des métadonnées intéressantes.")
            
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction des métadonnées depuis {url}: {str(e)}")
        
        return results
    
    def extract_from_file(self, file_path: str) -> Dict[str, Any]:
        """
        Extrait les métadonnées à partir d'un fichier local
        
        Args:
            file_path: Chemin vers le fichier
            
        Returns:
            Dictionnaire des métadonnées extraites
        """
        logger.info(f"Extraction des métadonnées à partir du fichier {file_path}")
        
        if not os.path.exists(file_path):
            logger.error(f"Le fichier {file_path} n'existe pas")
            return {}
        
        filename = os.path.basename(file_path)
        ext = os.path.splitext(filename)[1].lower()
        
        # Déterminer le type de fichier
        filetype = None
        for type_name, extensions in self.SUPPORTED_EXTENSIONS.items():
            if ext in extensions:
                filetype = type_name
                break
        
        if not filetype:
            logger.warning(f"Type de fichier non pris en charge: {ext}")
            return {
                "filename": filename,
                "filetype": "unknown",
                "metadata": {}
            }
        
        # Extraire les métadonnées en fonction du type
        metadata = {}
        
        try:
            if filetype == "pdf" and PYPDF2_AVAILABLE:
                metadata = self._extract_pdf_metadata(file_path)
            elif filetype == "image" and (EXIFREAD_AVAILABLE or PIL_AVAILABLE):
                metadata = self._extract_image_metadata(file_path)
            elif filetype == "office" and ext == ".docx" and DOCX_AVAILABLE:
                metadata = self._extract_docx_metadata(file_path)
            
            return {
                "filename": filename,
                "filetype": filetype,
                "metadata": metadata
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction des métadonnées de {file_path}: {str(e)}")
            return {
                "filename": filename,
                "filetype": filetype,
                "metadata": {},
                "error": str(e)
            }
    
    def _find_files_in_html(self, html_content: str, base_url: str) -> List[str]:
        """
        Recherche des liens vers des fichiers dans le contenu HTML
        
        Args:
            html_content: Contenu HTML
            base_url: URL de base pour résoudre les liens relatifs
            
        Returns:
            Liste des URLs de fichiers trouvés
        """
        files = []
        
        soup = BeautifulSoup(html_content, "html.parser")
        
        # Rechercher les liens
        for link in soup.find_all("a", href=True):
            href = link["href"]
            
            # Ignorer les ancres et les liens JavaScript
            if href.startswith("#") or href.startswith("javascript:"):
                continue
            
            # Convertir en URL absolue
            if not href.startswith(("http://", "https://")):
                href = urljoin(base_url, href)
            
            # Vérifier si c'est un fichier pris en charge
            parsed_url = urlparse(href)
            path = parsed_url.path.lower()
            
            for type_name, extensions in self.SUPPORTED_EXTENSIONS.items():
                if any(path.endswith(ext) for ext in extensions):
                    files.append(href)
                    break
        
        return files
    
    def _extract_file_metadata(self, file_url: str) -> Optional[Dict[str, Any]]:
        """
        Extrait les métadonnées d'un fichier distant
        
        Args:
            file_url: URL du fichier
            
        Returns:
            Dictionnaire des métadonnées ou None en cas d'erreur
        """
        logger.info(f"Extraction des métadonnées du fichier {file_url}")
        
        try:
            # Télécharger le fichier
            response = self.session.get(
                file_url, 
                timeout=self.config.timeout, 
                stream=True
            )
            
            if response.status_code != 200:
                logger.warning(f"Impossible de télécharger {file_url}: {response.status_code}")
                return None
            
            # Vérifier le type de contenu
            content_type = response.headers.get("Content-Type", "").split(";")[0].lower()
            
            # Déterminer le type de fichier
            filetype = None
            for type_name, mimetypes in self.SUPPORTED_MIMETYPES.items():
                if content_type in mimetypes:
                    filetype = type_name
                    break
            
            if not filetype:
                # Essayer par l'extension
                parsed_url = urlparse(file_url)
                path = parsed_url.path.lower()
                ext = os.path.splitext(path)[1].lower()
                
                for type_name, extensions in self.SUPPORTED_EXTENSIONS.items():
                    if ext in extensions:
                        filetype = type_name
                        break
            
            if not filetype:
                logger.warning(f"Type de fichier non pris en charge: {content_type}")
                return None
            
            # Enregistrer dans un fichier temporaire
            with tempfile.NamedTemporaryFile(delete=False) as tmp:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        tmp.write(chunk)
                tmp_path = tmp.name
            
            # Extraire les métadonnées en fonction du type
            metadata = {}
            filename = os.path.basename(urlparse(file_url).path)
            
            if filetype == "pdf" and PYPDF2_AVAILABLE:
                metadata = self._extract_pdf_metadata(tmp_path)
            elif filetype == "image" and (EXIFREAD_AVAILABLE or PIL_AVAILABLE):
                metadata = self._extract_image_metadata(tmp_path)
            elif filetype == "office" and filename.endswith(".docx") and DOCX_AVAILABLE:
                metadata = self._extract_docx_metadata(tmp_path)
            
            # Supprimer le fichier temporaire
            os.unlink(tmp_path)
            
            return {
                "url": file_url,
                "filename": filename,
                "filetype": filetype,
                "content_type": content_type,
                "metadata": metadata
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction des métadonnées de {file_url}: {str(e)}")
            return None
    
    def _extract_html_metadata(self, html_content: str, url: str) -> Dict[str, Any]:
        """
        Extrait les métadonnées du HTML
        
        Args:
            html_content: Contenu HTML
            url: URL de la page
            
        Returns:
            Dictionnaire des métadonnées HTML
        """
        metadata = {
            "title": "",
            "description": "",
            "keywords": [],
            "author": "",
            "generator": "",
            "og": {},
            "twitter": {},
            "meta_tags": []
        }
        
        soup = BeautifulSoup(html_content, "html.parser")
        
        # Titre
        title_tag = soup.find("title")
        if title_tag:
            metadata["title"] = title_tag.text.strip()
        
        # Balises meta
        for meta in soup.find_all("meta"):
            name = meta.get("name", "").lower()
            property = meta.get("property", "").lower()
            content = meta.get("content", "")
            
            metadata["meta_tags"].append({
                "name": name or property,
                "content": content
            })
            
            if name == "description" or property == "og:description":
                metadata["description"] = content
            elif name == "keywords":
                metadata["keywords"] = [k.strip() for k in content.split(",")]
            elif name == "author":
                metadata["author"] = content
            elif name == "generator":
                metadata["generator"] = content
            
            # Open Graph
            if property.startswith("og:"):
                og_key = property[3:]
                metadata["og"][og_key] = content
            
            # Twitter Cards
            if property.startswith("twitter:"):
                twitter_key = property[8:]
                metadata["twitter"][twitter_key] = content
        
        return metadata
    
    def _extract_pdf_metadata(self, file_path: str) -> Dict[str, Any]:
        """
        Extrait les métadonnées d'un fichier PDF
        
        Args:
            file_path: Chemin vers le fichier PDF
            
        Returns:
            Dictionnaire des métadonnées PDF
        """
        if not PYPDF2_AVAILABLE:
            return {}
        
        metadata = {}
        
        try:
            with open(file_path, "rb") as f:
                pdf = PyPDF2.PdfReader(f)
                
                if pdf.metadata:
                    for key, value in pdf.metadata.items():
                        if key.startswith("/"):
                            key = key[1:]
                        metadata[key] = str(value)
                
                metadata["pages"] = len(pdf.pages)
                
                # Extraire le texte de la première page
                if pdf.pages and hasattr(pdf.pages[0], "extract_text"):
                    text = pdf.pages[0].extract_text()
                    if text:
                        metadata["first_page_text"] = text[:1000]  # Limiter à 1000 caractères
        
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction des métadonnées PDF: {str(e)}")
        
        return metadata
    
    def _extract_image_metadata(self, file_path: str) -> Dict[str, Any]:
        """
        Extrait les métadonnées d'une image
        
        Args:
            file_path: Chemin vers le fichier image
            
        Returns:
            Dictionnaire des métadonnées extraites
        """
        metadata = {}
        
        try:
            # Utiliser exifread si disponible
            if EXIFREAD_AVAILABLE:
                with open(file_path, 'rb') as f:
                    tags = exifread.process_file(f, details=True)
                    
                    # Convertir les tags en dictionnaire
                    for tag, value in tags.items():
                        # Ignorer les tags de miniature qui sont volumineux
                        if "thumbnail" not in tag.lower():
                            metadata[tag] = str(value)
            
            # Utiliser PIL comme alternative ou complément
            if PIL_AVAILABLE:
                try:
                    with Image.open(file_path) as img:
                        # Informations de base
                        metadata["ImageWidth"] = img.width
                        metadata["ImageHeight"] = img.height
                        metadata["ImageFormat"] = img.format
                        metadata["ImageMode"] = img.mode
                        
                        # Extraire les données EXIF
                        if hasattr(img, '_getexif') and img._getexif():
                            exif_data = img._getexif()
                            if exif_data:
                                for tag_id, value in exif_data.items():
                                    tag = TAGS.get(tag_id, tag_id)
                                    # Éviter les données binaires volumineuses
                                    if isinstance(value, bytes):
                                        metadata[tag] = f"[Binary data, {len(value)} bytes]"
                                    else:
                                        metadata[tag] = str(value)
                                        
                        # Recherche de métadonnées géographiques
                        geo_tags = ['GPSLatitude', 'GPSLatitudeRef', 'GPSLongitude', 'GPSLongitudeRef',
                                    'GPSAltitude', 'GPSAltitudeRef', 'GPSDateStamp', 'GPSTimeStamp']
                        
                        has_geo = False
                        for tag in geo_tags:
                            if tag in metadata:
                                has_geo = True
                        
                        metadata["HasGeoData"] = has_geo
                except Exception as e:
                    logger.debug(f"Erreur PIL lors de l'extraction des métadonnées image: {str(e)}")
        
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction des métadonnées image: {str(e)}")
        
        return metadata
    
    def _extract_docx_metadata(self, file_path: str) -> Dict[str, Any]:
        """
        Extrait les métadonnées d'un fichier DOCX
        
        Args:
            file_path: Chemin vers le fichier DOCX
            
        Returns:
            Dictionnaire des métadonnées DOCX
        """
        if not DOCX_AVAILABLE:
            return {}
        
        metadata = {}
        
        try:
            doc = docx.Document(file_path)
            
            # Propriétés du document
            core_properties = doc.core_properties
            
            if core_properties:
                metadata["author"] = core_properties.author
                metadata["created"] = str(core_properties.created) if core_properties.created else None
                metadata["last_modified_by"] = core_properties.last_modified_by
                metadata["modified"] = str(core_properties.modified) if core_properties.modified else None
                metadata["title"] = core_properties.title
                metadata["subject"] = core_properties.subject
                metadata["keywords"] = core_properties.keywords
                metadata["comments"] = core_properties.comments
                metadata["category"] = core_properties.category
                metadata["version"] = core_properties.revision
            
            # Statistiques du document
            metadata["paragraphs"] = len(doc.paragraphs)
            metadata["sections"] = len(doc.sections)
            
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction des métadonnées DOCX: {str(e)}")
        
        return metadata
    
    def _is_interesting_metadata(self, file_metadata: Dict[str, Any]) -> bool:
        """
        Détermine si les métadonnées contiennent des informations intéressantes
        
        Args:
            file_metadata: Métadonnées du fichier
            
        Returns:
            True si les métadonnées sont intéressantes, False sinon
        """
        metadata = file_metadata.get("metadata", {})
        
        # Mots-clés intéressants dans les champs
        interesting_fields = [
            "author", "creator", "producer", "last_modified_by",
            "gps", "location", "GPS", "make", "model", "software",
            "email", "company", "organization", "username"
        ]
        
        # Vérifier si des champs intéressants sont présents
        for field in interesting_fields:
            for key in metadata.keys():
                if field.lower() in key.lower():
                    return True
        
        # Vérifier les valeurs
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        for value in metadata.values():
            if isinstance(value, str) and re.search(email_pattern, value):
                return True
        
        return False
    
    def _get_interesting_fields(self, file_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extrait les champs intéressants des métadonnées
        
        Args:
            file_metadata: Métadonnées du fichier
            
        Returns:
            Dictionnaire des champs intéressants
        """
        metadata = file_metadata.get("metadata", {})
        interesting = {}
        
        # Mots-clés intéressants dans les champs
        interesting_fields = [
            "author", "creator", "producer", "last_modified_by",
            "gps", "location", "GPS", "make", "model", "software",
            "email", "company", "organization", "username", "title",
            "subject", "keywords", "comments", "category"
        ]
        
        # Extraire les champs intéressants
        for key, value in metadata.items():
            for field in interesting_fields:
                if field.lower() in key.lower():
                    interesting[key] = value
                    break
        
        # Rechercher des emails dans les valeurs
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        for key, value in metadata.items():
            if isinstance(value, str) and re.search(email_pattern, value) and key not in interesting:
                interesting[key] = value
        
        return interesting
    
    def _extract_static_resources(self, html_content: str, base_url: str) -> Dict[str, List[Dict[str, str]]]:
        """
        Extrait toutes les ressources statiques d'une page HTML
        
        Args:
            html_content: Contenu HTML
            base_url: URL de base pour résoudre les liens relatifs
            
        Returns:
            Dictionnaire des ressources statiques
        """
        resources = {
            "images": [],
            "scripts": [],
            "stylesheets": [],
            "fonts": [],
            "media": []
        }
        
        soup = BeautifulSoup(html_content, "html.parser")
        
        # Extraire les images
        for img in soup.find_all("img", src=True):
            src = img["src"]
            if not src.startswith(("http://", "https://")):
                src = urljoin(base_url, src)
            
            resources["images"].append({
                "src": src,
                "alt": img.get("alt", ""),
                "width": img.get("width", ""),
                "height": img.get("height", "")
            })
        
        # Extraire les scripts
        for script in soup.find_all("script", src=True):
            src = script["src"]
            if not src.startswith(("http://", "https://")):
                src = urljoin(base_url, src)
            
            resources["scripts"].append({
                "src": src
            })
        
        # Extraire les feuilles de style
        for link in soup.find_all("link", rel="stylesheet", href=True):
            href = link["href"]
            if not href.startswith(("http://", "https://")):
                href = urljoin(base_url, href)
            
            resources["stylesheets"].append({
                "href": href
            })
        
        # Extraire les polices
        for link in soup.find_all("link", rel=lambda r: r and "font" in r, href=True):
            href = link["href"]
            if not href.startswith(("http://", "https://")):
                href = urljoin(base_url, href)
            
            resources["fonts"].append({
                "href": href
            })
        
        # Extraire les médias (audio, video)
        for media in soup.find_all(["audio", "video"]):
            src = media.get("src", "")
            if src:
                if not src.startswith(("http://", "https://")):
                    src = urljoin(base_url, src)
                
                resources["media"].append({
                    "src": src,
                    "type": media.name
                })
            
            # Vérifier aussi les balises source dans audio/video
            for source in media.find_all("source", src=True):
                src = source["src"]
                if not src.startswith(("http://", "https://")):
                    src = urljoin(base_url, src)
                
                resources["media"].append({
                    "src": src,
                    "type": source.get("type", "")
                })
        
        # Rechercher les backgrounds dans les styles
        for style in soup.find_all("style"):
            if style.string:
                # Rechercher les URLs dans les styles
                urls = re.findall(r'url\([\'"]?([^\'"]*)[\'"]?\)', style.string)
                for url in urls:
                    if not url.startswith(("http://", "https://")):
                        url = urljoin(base_url, url)
                    
                    # Déterminer le type d'après l'extension
                    ext = os.path.splitext(url)[1].lower()
                    if ext in [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]:
                        resources["images"].append({"src": url})
                    elif ext in [".ttf", ".woff", ".woff2", ".eot"]:
                        resources["fonts"].append({"href": url})
        
        # Rechercher les images de background dans les attributs style
        for elem in soup.find_all(style=True):
            style = elem["style"]
            urls = re.findall(r'url\([\'"]?([^\'"]*)[\'"]?\)', style)
            for url in urls:
                if not url.startswith(("http://", "https://")):
                    url = urljoin(base_url, url)
                
                # Déterminer le type d'après l'extension
                ext = os.path.splitext(url)[1].lower()
                if ext in [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]:
                    resources["images"].append({"src": url})
        
        return resources
    
    def _detect_framework(self, html_content: str, url: str) -> Dict[str, Any]:
        """
        Détecte le framework utilisé par le site
        
        Args:
            html_content: Contenu HTML
            url: URL de base
            
        Returns:
            Informations sur le framework détecté
        """
        framework_info = {
            "name": "",
            "version": "",
            "indicators": []
        }
        
        soup = BeautifulSoup(html_content, "html.parser")
        
        # Détection de Next.js
        next_indicators = [
            soup.find("div", id="__next"),
            soup.find("script", src=lambda s: s and "_next/static" in s),
            soup.find("link", href=lambda h: h and "_next/static" in h)
        ]
        if any(next_indicators):
            framework_info["name"] = "next.js"
            framework_info["indicators"] = [str(i) for i in next_indicators if i]
            
            # Vérifier la version (peut être dans un fichier manifest)
            try:
                manifest_url = urljoin(url, "/_next/static/chunks/webpack.js")
                response = self.session.get(manifest_url, timeout=self.config.timeout)
                if response.status_code == 200:
                    # Essayer de trouver la version
                    version_match = re.search(r'next[\'"]?\s*:\s*[\'"]?([0-9\.]+)', response.text)
                    if version_match:
                        framework_info["version"] = version_match.group(1)
            except Exception as e:
                logger.debug(f"Erreur lors de la détection de la version Next.js: {str(e)}")
        
        # Détection de WordPress
        wp_indicators = [
            soup.find("link", attrs={"rel": "https://api.w.org/"}),
            soup.find("meta", attrs={"name": "generator", "content": lambda c: c and "WordPress" in c}),
            soup.find("script", src=lambda s: s and "wp-includes" in s)
        ]
        if any(wp_indicators):
            framework_info["name"] = "wordpress"
            framework_info["indicators"] = [str(i) for i in wp_indicators if i]
            
            # Vérifier la version dans la balise meta generator
            meta_generator = soup.find("meta", attrs={"name": "generator"})
            if meta_generator and meta_generator.get("content"):
                version_match = re.search(r'WordPress\s+([0-9\.]+)', meta_generator["content"])
                if version_match:
                    framework_info["version"] = version_match.group(1)
        
        # Détection de Django
        django_indicators = [
            soup.find("meta", attrs={"name": "generator", "content": lambda c: c and "Django" in c}),
            soup.find("script", src=lambda s: s and "django" in s)
        ]
        if any(django_indicators):
            framework_info["name"] = "django"
            framework_info["indicators"] = [str(i) for i in django_indicators if i]
        
        # Détection de Laravel
        laravel_indicators = [
            soup.find("meta", attrs={"name": "csrf-token"}),
            soup.find("script", string=lambda s: s and "Laravel" in s),
            soup.find("script", src=lambda s: s and "vendor/laravel" in s)
        ]
        if any(laravel_indicators):
            framework_info["name"] = "laravel"
            framework_info["indicators"] = [str(i) for i in laravel_indicators if i]
        
        # Détection de Vue.js / Nuxt.js
        vue_indicators = [
            soup.find("div", id="app"),
            soup.find("div", id="__nuxt"),
            soup.find("script", src=lambda s: s and "vue.js" in s)
        ]
        if any(vue_indicators):
            framework_info["name"] = "vue.js"
            # Si c'est Nuxt.js spécifiquement
            if soup.find("div", id="__nuxt"):
                framework_info["name"] = "nuxt.js"
            framework_info["indicators"] = [str(i) for i in vue_indicators if i]
        
        # Détection de React
        react_indicators = [
            soup.find("div", id="root"),
            soup.find("script", string=lambda s: s and "ReactDOM" in s),
            soup.find("script", string=lambda s: s and "React.createElement" in s)
        ]
        if any(react_indicators) and not framework_info["name"]:  # Ne pas remplacer Next.js
            framework_info["name"] = "react"
            framework_info["indicators"] = [str(i) for i in react_indicators if i]
        
        return framework_info
    
    def _find_framework_specific_files(self, url: str, framework: str) -> List[str]:
        """
        Recherche des fichiers spécifiques au framework détecté
        
        Args:
            url: URL de base
            framework: Nom du framework détecté
            
        Returns:
            Liste d'URLs de fichiers à vérifier
        """
        files = []
        parsed_url = urlparse(url)
        base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
        
        if framework == "next.js":
            # Chemins spécifiques à Next.js
            next_paths = [
                "/_next/static/chunks/framework.js",
                "/_next/static/chunks/webpack.js",
                "/_next/static/chunks/main.js",
                "/_next/static/css/",
                "/_next/static/media/",
                "/_next/data/"
            ]
            
            for path in next_paths:
                framework_url = urljoin(base_url, path)
                try:
                    # Vérifier si le chemin existe (pour _next/static/css et _next/static/media, essayer de lister le répertoire)
                    if path.endswith("/"):
                        response = self.session.get(framework_url, timeout=self.config.timeout)
                        if response.status_code == 200:
                            # Essayer de trouver des liens dans la réponse
                            soup = BeautifulSoup(response.text, "html.parser")
                            for a in soup.find_all("a", href=True):
                                href = a["href"]
                                if not href.startswith(("http://", "https://")):
                                    href = urljoin(framework_url, href)
                                files.append(href)
                    else:
                        files.append(framework_url)
                except Exception as e:
                    logger.debug(f"Erreur lors de l'exploration du chemin Next.js {path}: {str(e)}")
        
        elif framework == "wordpress":
            # Chemins spécifiques à WordPress
            wp_paths = [
                "/wp-content/uploads/",
                "/wp-includes/js/",
                "/wp-includes/css/",
                "/wp-content/themes/",
                "/wp-content/plugins/"
            ]
            
            for path in wp_paths:
                framework_url = urljoin(base_url, path)
                try:
                    response = self.session.get(framework_url, timeout=self.config.timeout)
                    if response.status_code == 200:
                        # Essayer de trouver des liens dans la réponse
                        soup = BeautifulSoup(response.text, "html.parser")
                        for a in soup.find_all("a", href=True):
                            href = a["href"]
                            if not href.startswith(("http://", "https://")):
                                href = urljoin(framework_url, href)
                            # Filtrer par extension (images, css, js)
                            if href.endswith((".jpg", ".jpeg", ".png", ".gif", ".css", ".js")):
                                files.append(href)
                except Exception as e:
                    logger.debug(f"Erreur lors de l'exploration du chemin WordPress {path}: {str(e)}")
        
        elif framework in ["vue.js", "nuxt.js"]:
            # Chemins spécifiques à Vue.js/Nuxt.js
            vue_paths = [
                "/_nuxt/",
                "/assets/",
                "/static/"
            ]
            
            for path in vue_paths:
                framework_url = urljoin(base_url, path)
                try:
                    response = self.session.get(framework_url, timeout=self.config.timeout)
                    if response.status_code == 200:
                        soup = BeautifulSoup(response.text, "html.parser")
                        for a in soup.find_all("a", href=True):
                            href = a["href"]
                            if not href.startswith(("http://", "https://")):
                                href = urljoin(framework_url, href)
                            files.append(href)
                except Exception as e:
                    logger.debug(f"Erreur lors de l'exploration du chemin Vue/Nuxt {path}: {str(e)}")
        
        return files 