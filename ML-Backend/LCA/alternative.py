import pandas as pd
import numpy as np
from fuzzywuzzy import fuzz
from fuzzywuzzy import process
import requests
import json
import re
from typing import Dict, List, Optional, Union, Tuple
from collections import Counter
import os
from dotenv import load_dotenv

load_dotenv()

class EcoFriendlyAlternativesFinder:
    def __init__(self, csv_file_path: str, tavily_api_key: str = None):
        """
        Initialize the eco-friendly alternatives finder with CSV data
        
        Args:
            csv_file_path: Path to the merged dataset CSV file
            tavily_api_key: API key for Tavily search (optional)
        """
        self.df = pd.read_csv(csv_file_path)
        self.tavily_api_key = tavily_api_key or os.getenv('TAVILY_API_KEY')
        
        print(f"Loaded dataset with {len(self.df)} products")
        print(f"Columns: {list(self.df.columns)}")
        
        # Clean the data - strip whitespace from headers and data
        self.df.columns = self.df.columns.str.strip()
        for col in self.df.columns:
            if self.df[col].dtype == 'object':
                self.df[col] = self.df[col].astype(str).str.strip()
        
        # Handle eco_score column - adapt to your dataset structure
        eco_score_candidates = ['eco_score', 'environmental_score', 'sustainability_score', 'green_score']
        eco_col = None
        
        for candidate in eco_score_candidates:
            if candidate in self.df.columns:
                eco_col = candidate
                break
        
        if eco_col:
            print(f"Using '{eco_col}' as eco score column")
            self.df['eco_score'] = pd.to_numeric(self.df[eco_col], errors='coerce')
            # Fill missing eco_scores with median value
            median_eco_score = self.df['eco_score'].median()
            self.df['eco_score'].fillna(median_eco_score, inplace=True)
        else:
            print("Warning: No eco score column found. Adding default eco_score of 3.0")
            self.df['eco_score'] = 3.0
        
        # Handle ingredients column - adapt to your dataset structure
        ingredient_candidates = ['ingredients', 'ingredient_list', 'components', 'composition']
        ingredient_col = None
        
        for candidate in ingredient_candidates:
            if candidate in self.df.columns:
                ingredient_col = candidate
                break
        
        if ingredient_col:
            print(f"Using '{ingredient_col}' as ingredients column")
            self.df['ingredients'] = self.df[ingredient_col].fillna('')
        else:
            print("Warning: No ingredients column found. Using empty ingredients")
            self.df['ingredients'] = ''
        
        # Handle product name column - adapt to your dataset structure
        name_candidates = ['product_name', 'name', 'title', 'product', 'item_name']
        name_col = None
        
        for candidate in name_candidates:
            if candidate in self.df.columns:
                name_col = candidate
                break
        
        if name_col:
            print(f"Using '{name_col}' as product name column")
            self.df['product_name'] = self.df[name_col].fillna('Unknown Product')
        else:
            print("Error: No product name column found!")
            raise ValueError("Product name column is required")
        
        # Handle brand column
        brand_candidates = ['brand', 'manufacturer', 'company', 'brand_name']
        brand_col = None
        
        for candidate in brand_candidates:
            if candidate in self.df.columns:
                brand_col = candidate
                break
        
        if brand_col:
            print(f"Using '{brand_col}' as brand column")
            self.df['brand'] = self.df[brand_col].fillna('Unknown Brand')
        else:
            print("Warning: No brand column found. Using 'Unknown Brand'")
            self.df['brand'] = 'Unknown Brand'
        
        # Handle category column
        category_candidates = ['category', 'type', 'product_type', 'class', 'group']
        category_col = None
        
        for candidate in category_candidates:
            if candidate in self.df.columns:
                category_col = candidate
                break
        
        if category_col:
            print(f"Using '{category_col}' as category column")
            self.df['category'] = self.df[category_col].fillna('Unknown Category')
        else:
            print("Warning: No category column found. Using 'Unknown Category'")
            self.df['category'] = 'Unknown Category'
        
        # Handle size/weight column
        size_candidates = ['size', 'weight', 'volume', 'quantity', 'net_weight']
        size_col = None
        
        for candidate in size_candidates:
            if candidate in self.df.columns:
                size_col = candidate
                break
        
        if size_col:
            print(f"Using '{size_col}' as size column")
            self.df['size'] = self.df[size_col].fillna('Unknown Size')
        else:
            print("Warning: No size column found. Using 'Unknown Size'")
            self.df['size'] = 'Unknown Size'
        
        # Handle URL column (optional)
        url_candidates = ['url', 'link', 'product_url', 'title-href', 'href']
        url_col = None
        
        for candidate in url_candidates:
            if candidate in self.df.columns:
                url_col = candidate
                break
        
        if url_col:
            print(f"Using '{url_col}' as URL column")
            self.df['url'] = self.df[url_col].fillna('')
        else:
            self.df['url'] = ''
        
        # Handle form column (optional)
        form_candidates = ['form', 'format', 'type', 'physical_form']
        form_col = None
        
        for candidate in form_candidates:
            if candidate in self.df.columns:
                form_col = candidate
                break
        
        if form_col:
            print(f"Using '{form_col}' as form column")
            self.df['form'] = self.df[form_col].fillna('Unknown Form')
        else:
            self.df['form'] = 'Unknown Form'
        
        # Handle subcategory column (optional)
        subcategory_candidates = ['subcategory', 'subtype', 'subclass', 'sub_category']
        subcategory_col = None
        
        for candidate in subcategory_candidates:
            if candidate in self.df.columns:
                subcategory_col = candidate
                break
        
        if subcategory_col:
            print(f"Using '{subcategory_col}' as subcategory column")
            self.df['subcategory'] = self.df[subcategory_col].fillna('Unknown Subcategory')
        else:
            self.df['subcategory'] = 'Unknown Subcategory'
        
        # Preprocess ingredients for faster matching
        self.df['processed_ingredients'] = self.df['ingredients'].apply(self._process_ingredients)
        
        # Create processed product names for better matching
        self.df['processed_name'] = self.df['product_name'].apply(self._process_product_name)
        
        print("Dataset preprocessing completed successfully!")
        print(f"Eco score range: {self.df['eco_score'].min():.2f} - {self.df['eco_score'].max():.2f}")
    
    def _process_ingredients(self, ingredients_str: str) -> List[str]:
        """
        Process ingredients string into a list of cleaned ingredients
        
        Args:
            ingredients_str: Raw ingredients string from CSV
            
        Returns:
            List of cleaned ingredient names
        """
        if pd.isna(ingredients_str) or ingredients_str == 'nan' or ingredients_str == '':
            return []
        
        # Split by common separators and clean
        ingredients = re.split(r'[,;]\s*', str(ingredients_str).lower())
        
        # Clean each ingredient - remove parentheses content, extra spaces
        cleaned_ingredients = []
        for ingredient in ingredients:
            # Remove content in parentheses
            ingredient = re.sub(r'\([^)]*\)', '', ingredient)
            # Remove extra whitespace and convert to lowercase
            ingredient = ingredient.strip().lower()
            if ingredient and len(ingredient) > 2:  # Filter out very short strings
                cleaned_ingredients.append(ingredient)
        
        return cleaned_ingredients
    
    def _process_product_name(self, product_name: str) -> str:
        """
        Process product name for better matching by removing common words
        
        Args:
            product_name: Raw product name
            
        Returns:
            Processed product name
        """
        if pd.isna(product_name):
            return ""
        
        # Convert to lowercase and remove common words
        name = str(product_name).lower()
        
        # Remove common cosmetic words that don't add matching value
        common_words = ['for', 'with', 'and', 'the', 'of', 'in', 'a', 'an', 'by', 'natural', 'organic']
        words = name.split()
        filtered_words = [word for word in words if word not in common_words]
        
        return ' '.join(filtered_words)
    
    def _extract_size_info(self, size_str: str) -> Tuple[float, str]:
        """
        Extract numeric value and unit from size string
        
        Args:
            size_str: Size string (e.g., "250ml", "8.5oz")
            
        Returns:
            Tuple of (numeric_value, unit)
        """
        if pd.isna(size_str) or size_str == 'nan' or size_str == '':
            return (0.0, '')
        
        # Extract number and unit
        match = re.search(r'(\d+(?:\.\d+)?)\s*(ml|oz|g|kg|l|gm|gram|grams|liter|liters)', str(size_str).lower())
        if match:
            value = float(match.group(1))
            unit = match.group(2)
            
            # Normalize units to ml equivalent for comparison
            if unit in ['l', 'liter', 'liters']:
                value *= 1000
            elif unit in ['oz']:
                value *= 29.5735  # fl oz to ml
            elif unit in ['kg']:
                value *= 1000
            elif unit in ['gram', 'grams']:
                unit = 'g'
            
            return (value, unit)
        
        return (0.0, '')
    
    def _calculate_ingredient_similarity(self, user_ingredients: List[str], csv_ingredients: List[str]) -> float:
        """
        Calculate similarity between two ingredient lists
        
        Args:
            user_ingredients: User's product ingredients
            csv_ingredients: CSV product ingredients
            
        Returns:
            Similarity score between 0 and 1
        """
        if not user_ingredients or not csv_ingredients:
            return 0.0
        
        # Count matching ingredients (exact and fuzzy)
        matches = 0
        total_user_ingredients = len(user_ingredients)
        
        for user_ing in user_ingredients:
            # Check for exact matches first
            if user_ing in csv_ingredients:
                matches += 1
                continue
            
            # Check for fuzzy matches in ingredient names
            for csv_ing in csv_ingredients:
                if fuzz.ratio(user_ing, csv_ing) >= 75:  # Slightly lower threshold for alternatives
                    matches += 1
                    break
        
        return matches / total_user_ingredients if total_user_ingredients > 0 else 0.0
    
    def _calculate_size_compatibility(self, user_size: str, csv_size: str, tolerance: float = 0.4) -> bool:
        """
        Check if sizes are compatible within tolerance
        
        Args:
            user_size: User's product size
            csv_size: CSV product size
            tolerance: Acceptable size difference ratio (default 40%)
            
        Returns:
            True if sizes are compatible
        """
        user_value, user_unit = self._extract_size_info(user_size)
        csv_value, csv_unit = self._extract_size_info(csv_size)
        
        if user_value == 0.0 or csv_value == 0.0:
            return True  # If we can't determine size, don't filter out
        
        # Calculate percentage difference
        size_diff = abs(user_value - csv_value) / user_value
        return size_diff <= tolerance
    
    def _calculate_eco_bonus(self, user_eco_score: float, alternative_eco_score: float) -> float:
        """
        Calculate bonus score for eco-friendliness improvement
        
        Args:
            user_eco_score: User's product eco score
            alternative_eco_score: Alternative product eco score
            
        Returns:
            Bonus score between 0 and 1
        """
        if alternative_eco_score <= user_eco_score:
            return 0.0  # No bonus if not better
        
        # Calculate improvement ratio with higher bonus for significant improvements
        max_eco_score = self.df['eco_score'].max()
        improvement = (alternative_eco_score - user_eco_score) / max_eco_score
        return min(improvement * 1.0, 0.4)  # Cap at 40% bonus for better products
    
    def _calculate_alternative_score(self, row: pd.Series, user_product: Dict, user_eco_score: float) -> Dict:
        """
        Calculate alternative score based on similarity and eco-friendliness
        
        Args:
            row: DataFrame row with product data
            user_product: User's product information
            user_eco_score: User's product eco score
            
        Returns:
            Dictionary with scoring details
        """
        scores = {
            'name_score': 0.0,
            'ingredient_score': 0.0,
            'brand_score': 0.0,
            'category_score': 0.0,
            'size_compatible': True,
            'eco_score': row.get('eco_score', 3.0),
            'eco_bonus': 0.0,
            'similarity_score': 0.0,
            'final_score': 0.0
        }
        
        # Name similarity (using processed names for better matching)
        user_processed_name = self._process_product_name(user_product.get('product_name', ''))
        csv_processed_name = str(row.get('processed_name', ''))
        scores['name_score'] = fuzz.ratio(user_processed_name, csv_processed_name) / 100.0
        
        # Also check token sort ratio for better name matching
        token_score = fuzz.token_sort_ratio(
            user_product.get('product_name', '').lower(),
            str(row['product_name']).lower()
        ) / 100.0
        scores['name_score'] = max(scores['name_score'], token_score)
        
        # Ingredient similarity
        user_ingredients = self._process_ingredients(user_product.get('ingredient_list', ''))
        csv_ingredients = row['processed_ingredients']
        scores['ingredient_score'] = self._calculate_ingredient_similarity(user_ingredients, csv_ingredients)
        
        # Brand similarity (but don't penalize too much for different brands in alternatives)
        user_brand = user_product.get('brand', '').lower()
        csv_brand = str(row['brand']).lower()
        if user_brand and csv_brand and user_brand != 'unknown':
            brand_similarity = fuzz.ratio(user_brand, csv_brand) / 100.0
            # For alternatives, we give some weight to different brands too
            scores['brand_score'] = max(brand_similarity, 0.3)  # Minimum 30% for any brand
        else:
            scores['brand_score'] = 0.5  # Neutral score when brand unknown
        
        # Category similarity (important for alternatives)
        user_category = user_product.get('category', '').lower()
        csv_category = str(row['category']).lower()
        if user_category and csv_category:
            scores['category_score'] = fuzz.ratio(user_category, csv_category) / 100.0
        else:
            scores['category_score'] = 0.5
        
        # Size compatibility
        scores['size_compatible'] = self._calculate_size_compatibility(
            user_product.get('weight', ''),
            str(row['size'])
        )
        comprehensive_eco = self._calculate_comprehensive_eco_score(row, user_product)
        scores['comprehensive_eco_score'] = comprehensive_eco['comprehensive_eco_score']
        scores['eco_factors'] = comprehensive_eco['eco_factors']
        user_comprehensive_eco = self._calculate_comprehensive_eco_score(
            pd.Series(user_product), user_product
        )['comprehensive_eco_score']

        # Eco bonus for better eco score
        scores['eco_bonus'] = self._calculate_eco_bonus(user_comprehensive_eco, scores['comprehensive_eco_score'])
        
        # Calculate similarity score (without eco bonus)
        weights = {
            'name': 0.20,        # Reduced from 0.25
            'ingredient': 0.30,  # Reduced from 0.35
            'brand': 0.10,       # Reduced from 0.15
            'category': 0.40     # Increased from 0.25 - most important for your use case
        }
        
        scores['similarity_score'] = (
            scores['name_score'] * weights['name'] +
            scores['ingredient_score'] * weights['ingredient'] +
            scores['brand_score'] * weights['brand'] +
            scores['category_score'] * weights['category']
        )
        
        # Final score includes eco bonus
        scores['final_score'] = scores['similarity_score'] + scores['eco_bonus']
        
        return scores
    def _is_compatible_category(self, user_category: str, alternative_category: str) -> bool:
        """
        Check if categories are compatible for alternatives
        """
        if not user_category or not alternative_category:
            return False
        
        user_cat = user_category.lower().strip()
        alt_cat = alternative_category.lower().strip()
        
        # Exact match
        if user_cat == alt_cat:
            return True
        
        # Category synonyms (expand this based on your data)
        category_synonyms = {
            'soap': ['bar soap', 'liquid soap', 'body soap', 'hand soap'],
            'shampoo': ['hair shampoo', 'scalp shampoo', 'dry shampoo'],
            'lotion': ['body lotion', 'moisturizer', 'cream'],
            # Add more based on your categories
        }
        
        for main_cat, synonyms in category_synonyms.items():
            if (user_cat == main_cat and alt_cat in synonyms) or \
            (alt_cat == main_cat and user_cat in synonyms):
                return True
        
        # Fuzzy matching as fallback
        return fuzz.ratio(user_cat, alt_cat) >= 85
    def _calculate_comprehensive_eco_score(self, row: pd.Series, user_product: Dict) -> Dict:
        """
        Calculate comprehensive eco-score considering ingredients, packaging, transport, etc.
        """
        eco_factors = {
            'base_eco_score': float(row.get('eco_score', 3.0)),
            'ingredients_score': 0.0,
            'packaging_score': 0.0,
            'transport_score': 0.0,
            'manufacturing_score': 0.0
        }
        
        # Ingredients impact (harmful ingredients penalty)
        harmful_ingredients = [
            'sls', 'sodium lauryl sulfate', 'parabens', 'sulfates', 
            'phthalates', 'formaldehyde', 'triclosan', 'microbeads'
        ]
        ingredients_str = str(row.get('ingredients', '')).lower()
        
        harmful_count = sum(1 for harmful in harmful_ingredients if harmful in ingredients_str)
        eco_factors['ingredients_score'] = max(0, 1 - (harmful_count * 0.2))  # Penalty for harmful ingredients
        
        # Packaging impact
        packaging = str(row.get('packaging_type', '')).lower()
        if 'recyclable' in packaging or 'biodegradable' in packaging:
            eco_factors['packaging_score'] = 1.0
        elif 'plastic' in packaging:
            eco_factors['packaging_score'] = 0.3
        else:
            eco_factors['packaging_score'] = 0.6
        
        # Transport impact (if location data available)
        if 'manufacturing_loc' in user_product and 'manufacturing_loc' in row:
            # Simple distance-based scoring (you can enhance with actual distance calculation)
            user_loc = str(user_product.get('manufacturing_loc', '')).lower()
            prod_loc = str(row.get('manufacturing_loc', '')).lower()
            eco_factors['transport_score'] = 1.0 if user_loc == prod_loc else 0.7
        else:
            eco_factors['transport_score'] = 0.8  # Default moderate score
        
        # Manufacturing score (based on certifications or organic status)
        certifications = str(row.get('certifications', '')).lower()
        if any(cert in certifications for cert in ['organic', 'fair trade', 'cruelty-free']):
            eco_factors['manufacturing_score'] = 1.0
        else:
            eco_factors['manufacturing_score'] = 0.6
        
        # Calculate weighted comprehensive score
        weights = {
            'base_eco_score': 0.4,
            'ingredients_score': 0.3,
            'packaging_score': 0.2,
            'transport_score': 0.05,
            'manufacturing_score': 0.05
        }
        
        comprehensive_score = sum(
            eco_factors[factor] * weights[factor] 
            for factor in eco_factors
        )
        
        return {
            'comprehensive_eco_score': comprehensive_score,
            'eco_factors': eco_factors
        }
    def find_alternatives(self, user_product: Dict, num_alternatives: int = 2, 
                         min_similarity: float = 0.3, eco_boost: bool = True) -> List[Dict]:
        """
        Find eco-friendly alternatives for a given product
        
        Args:
            user_product: User's product information
            num_alternatives: Number of alternatives to return (default: 2)
            min_similarity: Minimum similarity score required (default: 0.3)
            eco_boost: Whether to boost scores for better eco scores (default: True)
            
        Returns:
            List of alternative products with scores
        """
        product_name = user_product.get('product_name', '').lower()
        user_eco_score = user_product.get('eco_score', 3.0)
        
        print(f"Finding alternatives for '{product_name}' (eco_score: {user_eco_score})")
        print(f"Looking for products with eco_score > {user_eco_score} (BETTER products only)")
        
        # Filter products with BETTER eco score only (not equal)
        if eco_boost:
            eligible_products = self.df[self.df['eco_score'] >= user_eco_score].copy()
        else:
            eligible_products = self.df.copy()
        
        # Exclude the exact same product AND similar products from same brand
        eligible_products = eligible_products[
            (eligible_products['product_name'].str.lower() != product_name) &
            ~((eligible_products['product_name'].str.lower().str.contains(
                user_product.get('product_name', '').lower().split()[0])) & 
              (eligible_products['brand'].str.lower() == user_product.get('brand', '').lower()))
        ]
        
        # Filter by category first (soap alternatives should only be soaps)
        user_category = user_product.get('category', '').lower()
        category_mask = self.df['category'].str.lower() == user_category

        # If no exact category match, try fuzzy category matching
        if not category_mask.any() and user_category:
            category_similarities = self.df['category'].str.lower().apply(
                lambda x: fuzz.ratio(user_category, x)
            )
            category_mask = category_similarities >= 85  # High threshold for category matching

        # Filter products with BETTER eco score AND same category
        if eco_boost:
            eligible_products = self.df[category_mask & (self.df['eco_score'] >= user_eco_score)].copy()
        else:
            eligible_products = self.df[category_mask].copy()

        print(f"Category filter: '{user_category}' -> {category_mask.sum()} products")
        
        # Calculate scores for all eligible products
        alternatives = []
        
        for idx, row in eligible_products.iterrows():
            scores = self._calculate_alternative_score(row, user_product, user_eco_score)
            
            # Skip if size is incompatible
            if not scores['size_compatible']:
                continue
            
            # Apply minimum similarity threshold
            if scores['similarity_score'] < min_similarity:
                continue
            
            # Create alternative product dictionary
            alternative = {
                'product_name': row['product_name'],
                'brand': row['brand'],
                'category': row['category'],
                'subcategory': row.get('subcategory', 'Unknown'),
                'size': row['size'],
                'eco_score': scores['eco_score'],
                'ingredients': row['ingredients'],
                'form': row.get('form', 'Unknown'),
                'url': row.get('url', ''),
                'scores': scores,
                'eco_improvement': scores['eco_score'] - user_eco_score
            }
            
            alternatives.append(alternative)
        
        # Sort by final score (similarity + eco bonus)
        alternatives.sort(key=lambda x: x['scores']['final_score'], reverse=True)
        
        # Return top alternatives
        top_alternatives = alternatives[:num_alternatives]
        
        print(f"Found {len(alternatives)} suitable alternatives, returning top {num_alternatives}")
        
        return top_alternatives
    
    def search_and_find_alternatives(self, user_product: Dict, num_alternatives: int = 2) -> Dict:
        """
        Main function to find alternatives for a user product
        
        Args:
            user_product: Dictionary containing user's product information
            num_alternatives: Number of alternatives to find (default: 2)
            
        Returns:
            Dictionary with search results and alternatives
        """
        product_name = user_product.get('product_name', '')
        
        # Get user's product eco score (from input or estimate)
        user_eco_score = user_product.get('eco_score', 3.0)
        
        # Find alternatives
        alternatives = self.find_alternatives(
            user_product, 
            num_alternatives=num_alternatives,
            min_similarity=0.25,  # Slightly lower threshold for more options
            eco_boost=True
        )
        
        # Prepare result
        result = {
            'user_product': {
                'name': product_name,
                'brand': user_product.get('brand', 'Unknown'),
                'category': user_product.get('category', 'Unknown'),
                'eco_score': user_eco_score,
                **{k: v for k, v in user_product.items() 
                   if k not in ['product_name', 'brand', 'category', 'eco_score']}
            },
            'alternatives_found': len(alternatives),
            'alternatives': alternatives
        }
        
        return result

    def get_dataset_info(self):
        """
        Get information about the loaded dataset
        
        Returns:
            Dictionary with dataset information
        """
        info = {
            'total_products': len(self.df),
            'columns': list(self.df.columns),
            'eco_score_stats': {
                'min': self.df['eco_score'].min(),
                'max': self.df['eco_score'].max(),
                'mean': self.df['eco_score'].mean(),
                'median': self.df['eco_score'].median()
            },
            'categories': self.df['category'].value_counts().to_dict(),
            'brands': len(self.df['brand'].unique()),
            'sample_products': self.df[['product_name', 'brand', 'category', 'eco_score']].head(5).to_dict('records')
        }
        return info


def main():
    """
    Main function to demonstrate the eco-friendly alternatives finder
    """
    # Initialize the alternatives finder with your merged dataset
    try:
        finder = EcoFriendlyAlternativesFinder(
            csv_file_path='/Users/prishabirla/Desktop/ADT/final/LCA/product_table_with_eco_scores.csv'  # Updated path
        )
        
        # Get dataset information
        print("\n" + "="*80)
        print("DATASET INFORMATION")
        print("="*80)
        dataset_info = finder.get_dataset_info()
        print(f"Total products: {dataset_info['total_products']}")
        print(f"Unique brands: {dataset_info['brands']}")
        print(f"Eco score range: {dataset_info['eco_score_stats']['min']:.2f} - {dataset_info['eco_score_stats']['max']:.2f}")
        print(f"Average eco score: {dataset_info['eco_score_stats']['mean']:.2f}")
        
        print("\nTop categories:")
        for category, count in list(dataset_info['categories'].items())[:10]:
            print(f"  {category}: {count}")
        
        print("\nSample products:")
        for i, product in enumerate(dataset_info['sample_products'], 1):
            print(f"  {i}. {product['product_name']} ({product['brand']}) - Eco: {product['eco_score']}")
        
    except FileNotFoundError:
        print("Error: Could not find 'ocr/merged_dataset.csv'")
        print("Please make sure the file exists and the path is correct.")
        return
    except Exception as e:
        print(f"Error loading dataset: {str(e)}")
        return
    
    # Sample user products for testing (adapt these to your dataset structure)
    test_products = [
        {
            'product_name': 'Chemist at Play Men \'s Exfoliating Toner. (Chemist at Play)',  # Replace with actual product name from your dataset
            'brand': 'Chemist at Play',
            'category': 'Personal Care',
            'weight': '250ml',
            'eco_score': 53.1,
            'packaging_type': 'Plastic',
            'ingredient_list': 'water, sodium laureth sulfate, cocamidopropyl betaine',
            'latitude': 12.9716,
            'longitude': 77.5946,
            'usage_frequency': 'daily',
            'manufacturing_loc': "Mumbai"
        }
    ]
    
    # Test with sample products
    for i, test_product in enumerate(test_products, 1):
        print(f"\n{'='*80}")
        print(f"FINDING ECO-FRIENDLY ALTERNATIVES FOR PRODUCT {i}")
        print('='*80)
        print(f"Product: {test_product['product_name']}")
        print(f"Brand: {test_product['brand']}")
        print(f"Current Eco Score: {test_product['eco_score']}")
        print('-'*80)
        
        try:
            # Find alternatives
            result = finder.search_and_find_alternatives(test_product, num_alternatives=3)
            
            # Display results
            print(f"\nAlternatives found: {result['alternatives_found']}")
            
            if result['alternatives']:
                for j, alt in enumerate(result['alternatives'], 1):
                    print(f"\n{'-'*50}")
                    print(f"ALTERNATIVE {j}")
                    print('-'*50)
                    print(f"Product: {alt['product_name']}")
                    print(f"Brand: {alt['brand']}")
                    print(f"Category: {alt['category']} / {alt['subcategory']}")
                    print(f"Size: {alt['size']}")
                    print(f"Form: {alt['form']}")
                    print(f"Eco Score: {alt['eco_score']} (improvement: +{alt['eco_improvement']:.1f})")
                    
                    # Display ingredients (truncated)
                    ingredients = alt['ingredients']
                    if len(str(ingredients)) > 150:
                        ingredients = str(ingredients)[:150] + "..."
                    print(f"Ingredients: {ingredients}")
                    
                    # Display matching scores
                    scores = alt['scores']
                    print(f"\nMATCH QUALITY:")
                    print(f"  Name similarity: {scores['name_score']:.1%}")
                    print(f"  Ingredient similarity: {scores['ingredient_score']:.1%}")
                    print(f"  Brand similarity: {scores['brand_score']:.1%}")
                    print(f"  Category similarity: {scores['category_score']:.1%}")
                    print(f"  Size compatible: {scores['size_compatible']}")
                    print(f"  Eco bonus: {scores['eco_bonus']:.1%}")
                    print(f"  Overall similarity: {scores['similarity_score']:.1%}")
                    print(f"  Final score: {scores['final_score']:.1%}")
                    print(f"Base Eco Score: {alt['eco_score']}")
                    print(f"Comprehensive Eco Score: {alt['scores']['comprehensive_eco_score']:.2f}")
                    print(f"Eco Factors:")
                    for factor, score in alt['scores']['eco_factors'].items():
                        print(f"  - {factor.replace('_', ' ').title()}: {score:.2f}")
                    if alt['url']:
                        print(f"URL: {alt['url']}")
            else:
                print("\nNo suitable eco-friendly alternatives found.")
                print("This could mean:")
                print("1. No products have better eco scores than the input product")
                print("2. The similarity threshold is too strict")
                print("3. Size compatibility requirements are too strict")
        
        except Exception as e:
            print(f"Error finding alternatives: {str(e)}")


if __name__ == "__main__":
    main()