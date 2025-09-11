#!/usr/bin/env python3
"""
Complete INCIDecoder Scraping System
=====================================

This script provides a comprehensive solution to scrape all cosmetic ingredient data
from incidecoder.com for building a CO2/cosmetics ingredients database.

Features:
- Intelligent URL discovery through multiple methods
- Robust ingredient data extraction
- Progress tracking and resume capability
- Multiple output formats (CSV, Excel, JSON, SQLite)
- Rate limiting and error handling
- Data validation and cleaning

Usage:
    python complete_scraper_system.py

Output files:
- cosmetic_ingredients_dataset.csv (Main dataset)
- cosmetic_ingredients_dataset.xlsx (Excel format)
- cosmetic_ingredients_dataset.json (JSON format)
- cosmetic_ingredients.db (SQLite database)
- scraping_log.txt (Detailed log)
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import numpy as np
import time
import re
import json
import sqlite3
import logging
from datetime import datetime
from urllib.parse import urljoin, urlparse
from typing import Dict, List, Optional, Set
import string
import os
from pathlib import Path

class ComprehensiveINCIDecoderScraper:
    """Complete scraping system for INCIDecoder website"""
    
    def __init__(self, delay: float = 2.0, max_retries: int = 3):
        """
        Initialize the comprehensive scraper
        
        Args:
            delay: Delay between requests in seconds
            max_retries: Maximum number of retries for failed requests
        """
        self.base_url = "https://incidecoder.com"
        self.delay = delay
        self.max_retries = max_retries
        
        # Setup session with headers
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        })
        
        # Setup logging
        self.setup_logging()
        
        # Data storage
        self.ingredients_data = []
        self.failed_urls = []
        self.processed_urls = set()
        
        # Progress tracking
        self.progress_file = 'scraping_progress.json'
        self.load_progress()
    
    def setup_logging(self):
        """Setup comprehensive logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('scraping_log.txt'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def load_progress(self):
        """Load previous scraping progress if exists"""
        if os.path.exists(self.progress_file):
            try:
                with open(self.progress_file, 'r') as f:
                    progress = json.load(f)
                    self.ingredients_data = progress.get('ingredients_data', [])
                    self.failed_urls = progress.get('failed_urls', [])
                    self.processed_urls = set(progress.get('processed_urls', []))
                self.logger.info(f"Loaded progress: {len(self.ingredients_data)} ingredients, {len(self.processed_urls)} processed URLs")
            except Exception as e:
                self.logger.error(f"Error loading progress: {e}")
    
    def save_progress(self):
        """Save current progress"""
        progress = {
            'ingredients_data': self.ingredients_data,
            'failed_urls': self.failed_urls,
            'processed_urls': list(self.processed_urls),
            'last_update': datetime.now().isoformat()
        }
        try:
            with open(self.progress_file, 'w') as f:
                json.dump(progress, f, indent=2)
        except Exception as e:
            self.logger.error(f"Error saving progress: {e}")
    
    def get_page_with_retry(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch webpage with retry logic and rate limiting"""
        for attempt in range(self.max_retries):
            try:
                time.sleep(self.delay)
                response = self.session.get(url, timeout=30)
                response.raise_for_status()
                return BeautifulSoup(response.content, 'html.parser')
            except Exception as e:
                self.logger.warning(f"Attempt {attempt + 1} failed for {url}: {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.delay * (attempt + 1))  # Exponential backoff
        
        self.logger.error(f"All attempts failed for {url}")
        return None
    
    def discover_ingredient_urls(self) -> List[str]:
        """Comprehensive URL discovery using multiple methods"""
        self.logger.info("Starting comprehensive URL discovery...")
        all_urls = set()
        
        # Method 1: Main ingredients page
        try:
            soup = self.get_page_with_retry(f"{self.base_url}/ingredients")
            if soup:
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    if '/ingredients/' in href and href != '/ingredients':
                        full_url = urljoin(self.base_url, href)
                        all_urls.add(full_url)
                self.logger.info(f"Method 1: Found {len(all_urls)} URLs from main page")
        except Exception as e:
            self.logger.error(f"Method 1 failed: {e}")
        
        # Method 2: Product pages (sample to find more ingredients)
        try:
            products_soup = self.get_page_with_retry(f"{self.base_url}/products")
            if products_soup:
                product_links = []
                for link in products_soup.find_all('a', href=True):
                    if '/products/' in link['href']:
                        product_links.append(urljoin(self.base_url, link['href']))
                
                # Sample first 50 products to avoid too many requests
                for i, product_url in enumerate(product_links[:50]):
                    if i % 10 == 0:
                        self.logger.info(f"Checking product {i+1}/50 for ingredients...")
                    
                    product_soup = self.get_page_with_retry(product_url)
                    if product_soup:
                        for link in product_soup.find_all('a', href=True):
                            if '/ingredients/' in link['href']:
                                full_url = urljoin(self.base_url, link['href'])
                                all_urls.add(full_url)
                
                self.logger.info(f"Method 2: Total URLs after product scanning: {len(all_urls)}")
        except Exception as e:
            self.logger.error(f"Method 2 failed: {e}")
        
        # Method 3: Common ingredient patterns
        common_ingredients = [
            'water', 'glycerin', 'alcohol-denat', 'sodium-chloride', 'retinol', 'niacinamide',
            'hyaluronic-acid', 'ascorbic-acid', 'salicylic-acid', 'benzoyl-peroxide',
            'ceramide-np', 'palmitoyl-pentapeptide-4', 'hydrolyzed-collagen', 'aloe-barbadensis-leaf-juice',
            'melaleuca-alternifolia-leaf-oil', 'simmondsia-chinensis-seed-oil', 'argania-spinosa-kernel-oil',
            'rosa-canina-fruit-oil', 'squalane', 'urea', 'lactic-acid', 'glycolic-acid',
            'mandelic-acid', 'azelaic-acid', 'kojic-acid', 'arbutin', 'hydroquinone',
            'zinc-oxide', 'titanium-dioxide', 'octinoxate', 'avobenzone', 'oxybenzone'
        ]
        
        for ingredient in common_ingredients:
            test_url = f"{self.base_url}/ingredients/{ingredient}"
            soup = self.get_page_with_retry(test_url)
            if soup and not self.is_404_page(soup):
                all_urls.add(test_url)
        
        self.logger.info(f"Method 3: Total URLs after common ingredients: {len(all_urls)}")
        
        # Clean and validate URLs
        valid_urls = [url for url in all_urls if self.is_valid_ingredient_url(url)]
        valid_urls = sorted(list(set(valid_urls)))
        
        self.logger.info(f"URL discovery complete: {len(valid_urls)} valid ingredient URLs found")
        
        # Save URLs for reference
        with open('discovered_ingredient_urls.json', 'w') as f:
            json.dump(valid_urls, f, indent=2)
        
        return valid_urls
    
    def is_404_page(self, soup: BeautifulSoup) -> bool:
        """Check if page is 404 or not found"""
        if not soup:
            return True
        
        title = soup.find('title')
        if title and ('not found' in title.get_text().lower() or '404' in title.get_text()):
            return True
        
        # Check for common 404 indicators
        page_text = soup.get_text().lower()
        error_indicators = ['page not found', 'not found', '404', 'does not exist']
        return any(indicator in page_text for indicator in error_indicators)
    
    def is_valid_ingredient_url(self, url: str) -> bool:
        """Validate ingredient URL format"""
        if not url.startswith(f"{self.base_url}/ingredients/"):
            return False
        
        slug = url.replace(f"{self.base_url}/ingredients/", "")
        invalid_patterns = ['', 'search', 'browse', 'category', 'letter', 'page', 'index']
        
        return slug not in invalid_patterns and re.match(r'^[a-zA-Z0-9\-_]+', slug)
    
    def extract_ingredient_data(self, url: str) -> Optional[Dict]:
        """Extract comprehensive ingredient data from a single page"""
        if url in self.processed_urls:
            return None
        
        soup = self.get_page_with_retry(url)
        if not soup or self.is_404_page(soup):
            self.failed_urls.append(url)
            return None
        
        try:
            data = {
                # Basic info
                'url': url,
                'scrape_date': datetime.now().isoformat(),
                'ingredient_name': '',
                'inci_name': '',
                'common_name': '',
                'chemical_name': '',
                
                # Classification
                'category': '',
                'subcategory': '',
                'ingredient_type': '',
                'origin': '',  # natural, synthetic, etc.
                
                # Function and properties
                'primary_function': '',
                'secondary_functions': [],
                'what_it_does': '',
                'mechanism_of_action': '',
                
                # Safety and ratings
                'safety_rating': '',
                'irritancy_level': '',
                'comedogenicity_rating': '',
                'allergen_potential': '',
                'pregnancy_safe': '',
                
                # Usage information
                'typical_concentration': '',
                'concentration_range': '',
                'usage_percentage': '',
                'recommended_usage': '',
                
                # Chemical properties
                'molecular_formula': '',
                'molecular_weight': '',
                'cas_number': '',
                'einecs_number': '',
                'chemical_structure': '',
                
                # Cosmetic properties
                'solubility': '',
                'ph_range': '',
                'stability': '',
                'incompatibilities': [],
                
                # Applications
                'product_types': [],
                'skin_types_suitable': [],
                'concerns_addressed': [],
                'benefits': [],
                'potential_side_effects': [],
                
                # Additional info
                'synonyms': [],
                'trade_names': [],
                'suppliers': [],
                'regulatory_status': '',
                'certifications': [],
                
                # Content
                'full_description': '',
                'summary': '',
                'research_notes': '',
                'references': [],
                
                # Extracted metadata
                'page_title': '',
                'meta_description': '',
                'last_updated': ''
            }
            
            # Extract page title and meta
            title_elem = soup.find('title')
            if title_elem:
                data['page_title'] = title_elem.get_text().strip()
            
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if meta_desc:
                data['meta_description'] = meta_desc.get('content', '').strip()
            
            # Extract main ingredient name (usually in h1)
            h1_elem = soup.find('h1')
            if h1_elem:
                data['ingredient_name'] = h1_elem.get_text().strip()
            
            # Look for INCI name (often in parentheses or separate field)
            page_text = soup.get_text()
            inci_match = re.search(r'INCI[:\s]*([A-Za-z\s\-,]+)', page_text, re.IGNORECASE)
            if inci_match:
                data['inci_name'] = inci_match.group(1).strip()
            
            # Extract category information
            category_patterns = [
                r'category[:\s]*([^.\n]+)',
                r'type[:\s]*([^.\n]+)',
                r'class[:\s]*([^.\n]+)'
            ]
            for pattern in category_patterns:
                match = re.search(pattern, page_text, re.IGNORECASE)
                if match and not data['category']:
                    data['category'] = match.group(1).strip()
                    break
            
            # Extract "what it does" information
            what_it_does_elem = soup.find(text=re.compile(r'what.it.does', re.I))
            if what_it_does_elem:
                parent = what_it_does_elem.parent
                next_elem = parent.find_next_sibling() if parent else None
                if next_elem:
                    data['what_it_does'] = next_elem.get_text().strip()
            
            # Extract concentration information
            conc_patterns = [
                r'concentration[:\s]*([0-9.\-% ]+)',
                r'usage[:\s]*([0-9.\-% ]+)',
                r'typically used at[:\s]*([0-9.\-% ]+)'
            ]
            for pattern in conc_patterns:
                match = re.search(pattern, page_text, re.IGNORECASE)
                if match:
                    data['typical_concentration'] = match.group(1).strip()
                    break
            
            # Extract safety ratings
            safety_keywords = {
                'goodie': 'good',
                'superstar': 'excellent',
                'icky': 'poor',
                'avoid': 'avoid'
            }
            
            for keyword, rating in safety_keywords.items():
                if keyword in page_text.lower():
                    data['safety_rating'] = rating
                    break
            
            # Extract functions
            function_keywords = [
                'moisturizer', 'emollient', 'humectant', 'surfactant', 'cleanser',
                'preservative', 'antioxidant', 'anti-aging', 'fragrance', 'colorant',
                'thickener', 'emulsifier', 'ph adjuster', 'exfoliant', 'brightening',
                'soothing', 'anti-inflammatory', 'antimicrobial', 'sunscreen', 'uv filter'
            ]
            
            found_functions = []
            for function in function_keywords:
                if function.replace('-', ' ') in page_text.lower():
                    found_functions.append(function)
            
            data['secondary_functions'] = found_functions
            if found_functions:
                data['primary_function'] = found_functions[0]
            
            # Extract product types
            product_keywords = [
                'serum', 'cream', 'lotion', 'cleanser', 'toner', 'mask', 'sunscreen',
                'foundation', 'concealer', 'lipstick', 'lip balm', 'shampoo', 'conditioner',
                'body wash', 'moisturizer', 'eye cream', 'night cream', 'day cream'
            ]
            
            found_products = []
            for product in product_keywords:
                if product in page_text.lower():
                    found_products.append(product)
            data['product_types'] = found_products
            
            # Extract skin concerns
            concern_keywords = [
                'acne', 'anti-aging', 'wrinkles', 'fine lines', 'dryness', 'oily skin',
                'sensitive skin', 'hyperpigmentation', 'dark spots', 'redness',
                'inflammation', 'eczema', 'rosacea', 'blackheads', 'enlarged pores'
            ]
            
            found_concerns = []
            for concern in concern_keywords:
                if concern in page_text.lower():
                    found_concerns.append(concern)
            data['concerns_addressed'] = found_concerns
            
            # Extract main description (usually the longest paragraph)
            paragraphs = soup.find_all('p')
            if paragraphs:
                longest_p = max(paragraphs, key=lambda p: len(p.get_text()))
                data['full_description'] = longest_p.get_text().strip()
                
                # Create summary from first paragraph or first 200 chars
                first_p = paragraphs[0].get_text().strip()
                data['summary'] = first_p[:200] + '...' if len(first_p) > 200 else first_p
            
            # Look for chemical information
            cas_match = re.search(r'CAS[:\s#]*([0-9\-]+)', page_text, re.IGNORECASE)
            if cas_match:
                data['cas_number'] = cas_match.group(1).strip()
            
            molecular_match = re.search(r'molecular formula[:\s]*([A-Za-z0-9]+)', page_text, re.IGNORECASE)
            if molecular_match:
                data['molecular_formula'] = molecular_match.group(1).strip()
            
            # Extract synonyms (often listed as "also called" or "also known as")
            synonym_patterns = [
                r'also called[:\s]*([^.\n]+)',
                r'also known as[:\s]*([^.\n]+)',
                r'synonyms?[:\s]*([^.\n]+)'
            ]
            
            for pattern in synonym_patterns:
                match = re.search(pattern, page_text, re.IGNORECASE)
                if match:
                    synonyms = [s.strip() for s in match.group(1).split(',')]
                    data['synonyms'] = synonyms
                    break
            
            # Look for research references
            ref_links = soup.find_all('a', href=re.compile(r'pubmed|doi|ncbi|research', re.I))
            data['references'] = [link.get('href') for link in ref_links]
            
            self.processed_urls.add(url)
            return data
            
        except Exception as e:
            self.logger.error(f"Error extracting data from {url}: {e}")
            self.failed_urls.append(url)
            return None
    
    def scrape_all_ingredients(self) -> pd.DataFrame:
        """Main scraping method"""
        self.logger.info("Starting comprehensive ingredient scraping...")
        
        # Discover URLs if not already done
        ingredient_urls = self.discover_ingredient_urls()
        
        # Filter out already processed URLs
        remaining_urls = [url for url in ingredient_urls if url not in self.processed_urls]
        self.logger.info(f"Processing {len(remaining_urls)} new URLs (already processed: {len(self.processed_urls)})")
        
        # Process each ingredient
        for i, url in enumerate(remaining_urls):
            self.logger.info(f"Processing ingredient {i+1}/{len(remaining_urls)}: {url}")
            
            ingredient_data = self.extract_ingredient_data(url)
            if ingredient_data:
                self.ingredients_data.append(ingredient_data)
                self.logger.info(f"✓ Successfully extracted: {ingredient_data.get('ingredient_name', 'Unknown')}")
            
            # Save progress every 25 ingredients
            if (i + 1) % 25 == 0:
                self.save_progress()
                self.logger.info(f"Progress saved. Total ingredients: {len(self.ingredients_data)}")
        
        # Final save
        self.save_progress()
        
        # Create DataFrame
        if self.ingredients_data:
            df = pd.DataFrame(self.ingredients_data)
            df = self.clean_and_validate_data(df)
            return df
        else:
            self.logger.warning("No ingredient data was extracted!")
            return pd.DataFrame()
    
    def clean_and_validate_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and validate the extracted data"""
        self.logger.info("Cleaning and validating data...")
        
        # Remove duplicates based on ingredient name
        df = df.drop_duplicates(subset=['ingredient_name'], keep='first')
        
        # Clean text fields
        text_columns = [
            'ingredient_name', 'inci_name', 'common_name', 'chemical_name',
            'category', 'what_it_does', 'full_description', 'summary'
        ]
        
        for col in text_columns:
            if col in df.columns:
                df[col] = df[col].astype(str).str.strip()
                df[col] = df[col].replace(['nan', 'None', ''], pd.NA)
        
        # Standardize ratings
        rating_columns = ['safety_rating', 'irritancy_level', 'comedogenicity_rating']
        for col in rating_columns:
            if col in df.columns:
                df[col] = df[col].astype(str).str.lower().str.strip()
        
        # Convert list columns from strings back to lists where needed
        list_columns = [
            'secondary_functions', 'product_types', 'concerns_addressed',
            'synonyms', 'benefits', 'potential_side_effects', 'references'
        ]
        
        for col in list_columns:
            if col in df.columns:
                # Ensure they're properly formatted lists
                df[col] = df[col].apply(lambda x: x if isinstance(x, list) else [])
        
        self.logger.info(f"Data cleaning complete. Final dataset: {len(df)} ingredients")
        return df
    
    def save_comprehensive_dataset(self, df: pd.DataFrame):
        """Save dataset in multiple formats"""
        if df.empty:
            self.logger.warning("No data to save!")
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_filename = f"cosmetic_ingredients_dataset_{timestamp}"
        
        # Save as CSV (main format)
        csv_file = f"{base_filename}.csv"
        df.to_csv(csv_file, index=False)
        self.logger.info(f"✓ Saved CSV: {csv_file}")
        
        # Save as Excel with multiple sheets
        excel_file = f"{base_filename}.xlsx"
        with pd.ExcelWriter(excel_file, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='All_Ingredients', index=False)
            
            # Create summary sheets
            if 'category' in df.columns:
                category_summary = df['category'].value_counts().reset_index()
                category_summary.columns = ['Category', 'Count']
                category_summary.to_excel(writer, sheet_name='Categories_Summary', index=False)
            
            if 'primary_function' in df.columns:
                function_summary = df['primary_function'].value_counts().reset_index()
                function_summary.columns = ['Function', 'Count']
                function_summary.to_excel(writer, sheet_name='Functions_Summary', index=False)
        
        self.logger.info(f"✓ Saved Excel: {excel_file}")
        
        # Save as JSON
        json_file = f"{base_filename}.json"
        df.to_json(json_file, orient='records', indent=2)
        self.logger.info(f"✓ Saved JSON: {json_file}")
        
        # Save to SQLite database
        db_file = f"cosmetic_ingredients_{timestamp}.db"
        conn = sqlite3.connect(db_file)
        
        # Convert list columns to JSON strings for database
        df_db = df.copy()
        list_columns = ['secondary_functions', 'product_types', 'concerns_addressed', 
                       'synonyms', 'benefits', 'potential_side_effects', 'references']
        
        for col in list_columns:
            if col in df_db.columns:
                df_db[col] = df_db[col].apply(lambda x: json.dumps(x) if isinstance(x, list) else x)
        
        df_db.to_sql('ingredients', conn, if_exists='replace', index=False)
        
        # Create indexes for faster queries
        conn.execute('CREATE INDEX IF NOT EXISTS idx_ingredient_name ON ingredients(ingredient_name)')
        conn.execute('CREATE INDEX IF NOT EXISTS idx_category ON ingredients(category)')
        conn.execute('CREATE INDEX IF NOT EXISTS idx_primary_function ON ingredients(primary_function)')
        
        conn.close()
        self.logger.info(f"✓ Saved SQLite database: {db_file}")
        
        # Create a simple CSV without timestamp for easy access
        df.to_csv('cosmetic_ingredients_dataset.csv', index=False)
        self.logger.info("✓ Saved main dataset: cosmetic_ingredients_dataset.csv")
    
    def generate_summary_report(self, df: pd.DataFrame):
        """Generate a summary report of the scraped data"""
        if df.empty:
            return
        
        report = []
        report.append("=" * 60)
        report.append("COSMETIC INGREDIENTS DATASET SUMMARY")
        report.append("=" * 60)
        report.append(f"Scraping completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"Total ingredients scraped: {len(df)}")
        report.append(f"Failed URLs: {len(self.failed_urls)}")
        report.append("")
        
        # Column completeness
        report.append("DATA COMPLETENESS:")
        report.append("-" * 30)
        for col in df.columns:
            non_null = df[col].notna().sum()
            percentage = (non_null / len(df)) * 100
            report.append(f"{col:25}: {non_null:4}/{len(df)} ({percentage:5.1f}%)")
        report.append("")
        
        # Category breakdown
        if 'category' in df.columns:
            report.append("TOP CATEGORIES:")
            report.append("-" * 20)
            top_categories = df['category'].value_counts().head(10)
            for category, count in top_categories.items():
                if pd.notna(category):
                    report.append(f"{category:20}: {count}")
            report.append("")
        
        # Function breakdown
        if 'primary_function' in df.columns:
            report.append("TOP FUNCTIONS:")
            report.append("-" * 20)
            top_functions = df['primary_function'].value_counts().head(10)
            for function, count in top_functions.items():
                if pd.notna(function):
                    report.append(f"{function:20}: {count}")
            report.append("")
        
        report.append("FILES GENERATED:")
        report.append("-" * 20)
        report.append("• cosmetic_ingredients_dataset.csv (Main dataset)")
        report.append("• cosmetic_ingredients_dataset_[timestamp].xlsx (Excel with summaries)")
        report.append("• cosmetic_ingredients_dataset_[timestamp].json (JSON format)")
        report.append("• cosmetic_ingredients_[timestamp].db (SQLite database)")
        report.append("• scraping_log.txt (Detailed scraping log)")
        report.append("• scraping_summary_report.txt (This report)")
        
        # Save report
        report_text = "\n".join(report)
        with open('scraping_summary_report.txt', 'w') as f:
            f.write(report_text)
        
        # Print to console
        print("\n" + report_text)
    
    def run_complete_scraping(self):
        """Run the complete scraping process"""
        try:
            self.logger.info("Starting complete INCIDecoder scraping process...")
            start_time = datetime.now()
            
            # Scrape all ingredients
            df = self.scrape_all_ingredients()
            
            if not df.empty:
                # Save in multiple formats
                self.save_comprehensive_dataset(df)
                
                # Generate summary report
                self.generate_summary_report(df)
                
                end_time = datetime.now()
                duration = end_time - start_time
                
                self.logger.info(f"✅ Scraping completed successfully!")
                self.logger.info(f"Total time: {duration}")
                self.logger.info(f"Total ingredients: {len(df)}")
                self.logger.info(f"Success rate: {len(df)/(len(df) + len(self.failed_urls))*100:.1f}%")
                
                return df
            else:
                self.logger.error("❌ No data was scraped!")
                return None
                
        except KeyboardInterrupt:
            self.logger.info("⏸️  Scraping interrupted by user")
            self.save_progress()
            
        except Exception as e:
            self.logger.error(f"❌ Critical error during scraping: {e}")
            self.save_progress()
            raise

def main():
    """Main function to run the complete scraping system"""
    print("🧴 INCIDecoder Comprehensive Scraping System")
    print("=" * 50)
    print("This will scrape ALL cosmetic ingredients from incidecoder.com")
    print("Expected time: 2-4 hours depending on network speed")
    print("The scraper will:")
    print("• Discover all ingredient URLs")
    print("• Extract comprehensive data for each ingredient")
    print("• Save progress periodically (can be resumed)")
    print("• Generate multiple output formats")
    print("=" * 50)
    
    response = input("Do you want to proceed? (y/N): ").strip().lower()
    if response not in ['y', 'yes']:
        print("Scraping cancelled.")
        return
    
    # Initialize and run scraper
    scraper = ComprehensiveINCIDecoderScraper(delay=2.0, max_retries=3)
    
    try:
        df = scraper.run_complete_scraping()
        
        if df is not None and not df.empty:
            print("\n🎉 Scraping completed successfully!")
            print(f"📊 Dataset ready: {len(df)} cosmetic ingredients")
            print("📁 Check the generated files in the current directory")
        else:
            print("\n❌ Scraping failed or no data extracted")
            
    except Exception as e:
        print(f"\n💥 Error during scraping: {e}")
        print("Check scraping_log.txt for detailed error information")

if __name__ == "__main__":
    main()