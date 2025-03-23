"""
HakBoardCrawler - Un scanner de vulnérabilités web avancé pour le Red et Blue Teaming
"""

__version__ = '1.0.0'
__author__ = 'HakBoard Team'

from .crawler import Crawler
from .config import CrawlerConfig

__all__ = ["Crawler", "CrawlerConfig", "__version__"] 