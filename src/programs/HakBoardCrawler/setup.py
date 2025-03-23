from setuptools import setup, find_packages
import os

# Lire le contenu du README.md pour la description longue
with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="hakboardcrawler",
    version="1.0.0",
    description="Scanner de vulnérabilités web avancé pour le Red et Blue Teaming",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="HakBoard Team",
    author_email="contact@hakboard.com",
    packages=find_packages(),
    install_requires=[
        "requests>=2.28.0",
        "beautifulsoup4>=4.11.0",
        "fake_useragent>=1.1.0",
        "pymupdf>=1.21.0",         # Pour les PDF
        "python-docx>=0.8.11",     # Pour les documents Word
        "Pillow>=9.2.0",           # Pour les images
        "pdfkit>=1.0.0",           # Pour l'export en PDF
        "exifread>=3.0.0",         # Pour les métadonnées d'images
        "tldextract>=3.4.0",       # Pour l'analyse des domaines
        "lxml>=4.9.0",             # Pour l'analyse XML
        "jinja2>=3.1.0",           # Pour les templates HTML
        "markupsafe>=2.1.0",       # Dépendance de Jinja2
        "markdown>=3.4.0",         # Pour les conversions Markdown
        "pyyaml>=6.0.0",           # Pour le parsing de YAML
        "python-magic>=0.4.27",    # Pour la détection de type MIME
        "argparse>=1.4.0",
        "urllib3>=1.26.12",
        "certifi>=2022.9.24",
        "chardet>=5.1.0",
        "idna>=3.4",
        "cryptography>=39.0.0",    # Pour l'analyse des certificats SSL
    ],
    entry_points={
        "console_scripts": [
            "hakboardcrawler=hakboardcrawler.main:main",
        ],
    },
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Information Technology",
        "Intended Audience :: Developers",
        "Topic :: Security",
        "Topic :: Internet :: WWW/HTTP :: Indexing/Search",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
) 