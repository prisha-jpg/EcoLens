import re
from urllib.parse import urlparse, unquote
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

import time
import os
import tempfile

# Set up environment for Hugging Face Spaces
os.environ['WDM_LOCAL'] = '1'
os.environ['WDM_CACHE'] = '/tmp/.wdm'

class ProductNameExtractor:
    def __init__(self, headless=True, driver_path=None):
        self.headless = headless
        self.driver_path = driver_path
        self.driver = None
        
        # Common URL patterns for different e-commerce sites
        self.patterns = {
            'amazon': {
                'url_pattern': r'amazon\.(com|in|co\.uk)',
                'product_patterns': [
                    r'/dp/[A-Z0-9]{10}',  # ASIN pattern
                    r'/gp/product/[A-Z0-9]{10}',
                    r'/exec/obidos/ASIN/[A-Z0-9]{10}'
                ],
                'name_from_url': r'/([^/]+)/dp/',
                'title_selectors': ['#productTitle', 'h1.a-size-large', '.product-title']
            },
            'flipkart': {
                'url_pattern': r'flipkart\.com',
                'product_patterns': [r'/p/[^/]+'],
                'name_from_url': r'flipkart\.com/([^/]+)/p/',
                'title_selectors': ['span.B_NuCI', 'h1.yhB1nd', '.pdp-product-name']
            },
            'myntra': {
                'url_pattern': r'myntra\.com',
                'product_patterns': [r'/\d+/buy'],
                'name_from_url': r'myntra\.com/([^/]+)/\d+',
                'title_selectors': ['h1.pdp-name', '.pdp-product-name', 'h1']
            },
            'ebay': {
                'url_pattern': r'ebay\.(com|in)',
                'product_patterns': [r'/itm/'],
                'name_from_url': r'/itm/([^/]+)/',
                'title_selectors': ['#x-title-label-lbl', 'h1#it-ttl', '.x-item-title-label']
            },
            'shopify': {
                'url_pattern': r'\.myshopify\.com|shopify',
                'product_patterns': [r'/products/'],
                'name_from_url': r'/products/([^/?]+)',
                'title_selectors': ['h1.product-single__title', '.product-title', 'h1']
            }
        }
    
    def extract_from_url_path(self, url):
        """Extract product name from URL path patterns"""
        try:
            parsed_url = urlparse(url)
            domain = parsed_url.netloc.lower()
            path = parsed_url.path
            
            for site, config in self.patterns.items():
                if re.search(config['url_pattern'], domain):
                    # Check if it's a product URL
                    is_product = any(re.search(pattern, path) for pattern in config['product_patterns'])
                    
                    if is_product and 'name_from_url' in config:
                        match = re.search(config['name_from_url'], url, re.IGNORECASE)
                        if match:
                            product_name = match.group(1)
                            # Clean and format the product name
                            product_name = unquote(product_name)
                            product_name = re.sub(r'[-_+]', ' ', product_name)
                            product_name = re.sub(r'\s+', ' ', product_name).strip()
                            return self.clean_product_name(product_name)
            
            # Generic extraction for other sites
            return self.generic_url_extraction(url)
            
        except Exception as e:
            print(f"Error extracting from URL path: {e}")
            return None
    
    def setup_driver(self):
        """Setup Chrome WebDriver with optimal settings for Hugging Face Spaces"""
        try:
            chrome_options = Options()
            
            # Essential options for Hugging Face Spaces
            chrome_options.add_argument('--headless=new')  # Use new headless mode
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--disable-extensions')
            chrome_options.add_argument('--disable-logging')
            chrome_options.add_argument('--disable-blink-features=AutomationControlled')
            chrome_options.add_argument('--remote-debugging-port=9222')
            chrome_options.add_argument('--disable-web-security')
            chrome_options.add_argument('--allow-running-insecure-content')
            chrome_options.add_argument('--disable-features=VizDisplayCompositor')
            chrome_options.add_argument('--single-process')  # Important for containers
            chrome_options.add_argument('--no-zygote')
            chrome_options.add_argument('--disable-background-timer-throttling')
            chrome_options.add_argument('--disable-renderer-backgrounding')
            chrome_options.add_argument('--disable-backgrounding-occluded-windows')
            
            # Set user agent
            chrome_options.add_argument(
                '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )
            
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option('useAutomationExtension', False)
            
            # Create a temporary directory for cache
            temp_dir = tempfile.mkdtemp()
            os.environ['WDM_CACHE'] = temp_dir
            
            try:
                # Method 1: Try with webdriver_manager (recommended)
                self.driver = webdriver.Chrome(
                    service=Service(ChromeDriverManager().install()),
                    options=chrome_options
                )
                print("✅ Using webdriver_manager")
                
            except Exception as e1:
                print(f"⚠️ webdriver_manager failed: {e1}")
                try:
                    # Method 2: Try system chromedriver
                    self.driver = webdriver.Chrome(
                        service=Service('/usr/bin/chromedriver'),
                        options=chrome_options
                    )
                    print("✅ Using system chromedriver")
                    
                except Exception as e2:
                    print(f"⚠️ System chromedriver failed: {e2}")
                    try:
                        # Method 3: Try without explicit service
                        self.driver = webdriver.Chrome(options=chrome_options)
                        print("✅ Using default Chrome setup")
                        
                    except Exception as e3:
                        print(f"❌ All Chrome setup methods failed: {e3}")
                        return False
    
            # Configure driver
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            self.driver.set_page_load_timeout(30)
            self.driver.implicitly_wait(10)
    
            print("✅ Chrome WebDriver setup successful")
            return True
    
        except Exception as e:
            print(f"❌ Error setting up driver: {e}")
            return False
    
    def close_driver(self):
        """Close the WebDriver"""
        if self.driver:
            try:
                self.driver.quit()
            except Exception as e:
                print(f"Warning: Error closing driver: {e}")
            finally:
                self.driver = None
    
    def extract_from_page_content(self, url):
        """Extract product name using Selenium web scraping"""
        try:
            if not self.driver and not self.setup_driver():
                print("❌ Failed to setup driver, falling back to URL extraction")
                return self.extract_from_url_path(url)
            
            print(f"🌐 Loading page: {url}")
            self.driver.get(url)
            
            # Wait for page to load
            WebDriverWait(self.driver, 15).until(
                lambda driver: driver.execute_script("return document.readyState") == "complete"
            )
            time.sleep(2)  # Reduced wait time
            
            # Try to close any popups or cookie banners
            self.close_popups()
            
            parsed_url = urlparse(url)
            domain = parsed_url.netloc.lower()
            print(f"🔍 Searching for product title on {domain}")
            
            # Try site-specific selectors first
            for site, config in self.patterns.items():
                if re.search(config['url_pattern'], domain) and 'title_selectors' in config:
                    print(f"📋 Trying {site} specific selectors...")
                    for selector in config['title_selectors']:
                        try:
                            elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                            for element in elements:
                                if element.is_displayed() and element.text.strip():
                                    title = element.text.strip()
                                    print(f"✅ Found title with selector '{selector}': {title[:50]}...")
                                    return self.clean_product_name(title)
                        except Exception as e:
                            print(f"❌ Selector '{selector}' failed: {str(e)[:50]}")
                            continue
            
            # Generic selectors if site-specific ones don't work
            print("🔄 Trying generic selectors...")
            generic_selectors = [
                'h1',
                '[data-testid*="title"]',
                '[data-testid*="product"]',
                '.product-title',
                '#product-title',
                '.pdp-product-name',
                '.product-name',
                '[class*="product"][class*="title"]',
                '[class*="product"][class*="name"]',
                'span[class*="title"]',
                'div[class*="title"]'
            ]
            
            for selector in generic_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for element in elements:
                        if element.is_displayed() and element.text.strip():
                            title = element.text.strip()
                            if len(title) > 10 and not self.is_generic_title(title):
                                print(f"✅ Found title with generic selector '{selector}': {title[:50]}...")
                                return self.clean_product_name(title)
                except Exception:
                    continue
            
            # Try getting title from page title as last resort
            try:
                page_title = self.driver.title
                if page_title and len(page_title) > 10 and not self.is_generic_title(page_title):
                    print(f"✅ Using page title: {page_title[:50]}...")
                    return self.clean_product_name(page_title)
            except Exception:
                pass
            
            print("❌ No product title found on the page")
            return None
            
        except Exception as e:
            print(f"❌ Error scraping page content: {e}")
            # Fallback to URL extraction if scraping fails
            return self.extract_from_url_path(url)
    
    def close_popups(self):
        """Try to close common popups and cookie banners"""
        popup_selectors = [
            'button[aria-label*="close"]',
            'button[data-dismiss="modal"]',
            '.modal-close',
            '[class*="popup"] button',
            '[class*="cookie"] button',
            'button:contains("Accept")',
            'button:contains("Close")',
            'button:contains("×")',
            '.close-btn',
            '.popup-close'
        ]
        
        for selector in popup_selectors:
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                for element in elements:
                    if element.is_displayed():
                        element.click()
                        time.sleep(0.5)
                        break
            except Exception:
                continue
    
    def generic_url_extraction(self, url):
        """Generic method to extract product name from any URL"""
        try:
            parsed_url = urlparse(url)
            path_parts = [part for part in parsed_url.path.split('/') if part]
            
            if not path_parts:
                return None
            
            # Look for the longest meaningful part
            potential_names = []
            for part in path_parts:
                # Skip common non-product parts
                if part.lower() in ['product', 'item', 'buy', 'p', 'dp', 'products']:
                    continue
                
                # Skip numeric IDs
                if part.isdigit():
                    continue
                
                # Skip short parts
                if len(part) < 3:
                    continue
                
                potential_names.append(part)
            
            if potential_names:
                # Take the longest part as it's likely the product name
                product_name = max(potential_names, key=len)
                product_name = unquote(product_name)
                product_name = re.sub(r'[-_+]', ' ', product_name)
                return self.clean_product_name(product_name)
            
            return None
            
        except Exception as e:
            print(f"Error in generic extraction: {e}")
            return None
    
    def clean_product_name(self, name):
        """Clean and format the extracted product name"""
        if not name:
            return None
        
        # Remove extra whitespace
        name = re.sub(r'\s+', ' ', name).strip()
        
        # Remove common suffixes/prefixes
        name = re.sub(r'\s*[-|:]\s*(Buy Online|Online Shopping|Price|Review).*$', '', name, flags=re.IGNORECASE)
        
        # Capitalize properly
        name = ' '.join(word.capitalize() for word in name.split())
        
        return name if len(name) > 2 else None
    
    def is_generic_title(self, title):
        """Check if the title is too generic"""
        generic_words = ['home', 'shop', 'store', 'buy', 'online', 'shopping', 'product']
        return any(word in title.lower() for word in generic_words) and len(title.split()) < 4
    
    def extract_product_name(self, url, method='both'):
        """
        Main method to extract product name
        
        Args:
            url (str): Product URL
            method (str): 'url' for URL parsing only, 'scrape' for web scraping only, 'both' for trying both
        
        Returns:
            str: Product name or None if not found
        """
        if method == 'url':
            # Only URL-based extraction
            return self.extract_from_url_path(url)
        
        elif method == 'scrape':
            # Only web scraping (with fallback to URL if it fails)
            return self.extract_from_page_content(url)
        
        elif method == 'both':
            # Try web scraping first (more accurate), then fallback to URL
            name = self.extract_from_page_content(url)
            if name:
                return name
            
            print("Web scraping failed, falling back to URL extraction...")
            return self.extract_from_url_path(url)
        
        return None
    
    def __enter__(self):
        """Context manager entry"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit - ensures driver is closed"""
        self.close_driver()

# Simple function for direct usage
def get_product_name(url):
    """
    Simple function to get product name from URL
    
    Args:
        url (str): Product URL
    
    Returns:
        str: Product name or None if not found
    """
    try:
        with ProductNameExtractor(headless=True) as extractor:
            return extractor.extract_product_name(url, method='both')
    except Exception as e:
        print(f"Error: {e}")
        # Fallback to URL extraction only
        try:
            extractor = ProductNameExtractor(headless=True)
            return extractor.extract_from_url_path(url)
        except Exception as e2:
            print(f"Fallback error: {e2}")
            return None

# Example usage
def main():
    # Get product URL from user
    product_url = input("Enter product URL: ").strip()
    
    if not product_url:
        print("❌ No URL provided!")  
        return
    
    # Validate URL
    if not product_url.startswith(('http://', 'https://')):
        print("❌ Please provide a valid URL starting with http:// or https://")
        return
    
    print(f"\n🔍 Extracting product name from: {product_url}")
    print("=" * 60)
    
    # Using context manager to ensure driver is properly closed
    with ProductNameExtractor(headless=True) as extractor:
        # Extract product name (tries scraping first, then URL as fallback)
        product_name = extractor.extract_product_name(product_url, method='both')
        
        print("\n" + "=" * 60)
        if product_name:
            print(f"✅ Product Name: {product_name}")
        else:
            print("❌ Could not extract product name")

if __name__ == "__main__":
    main()