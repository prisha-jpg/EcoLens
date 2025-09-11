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
os.environ['TAVILY_API_KEY']=os.getenv('TAVILY_API_KEY')
class CosmeticsSearcher:
    def __init__(self, csv_file_path: str, tavily_api_key: str = os.environ['TAVILY_API_KEY']):
        """
        Initialize the cosmetics searcher with CSV data and optional Tavily API key
        
        Args:
            csv_file_path: Path to the cosmetics CSV file
            tavily_api_key: API key for Tavily search (optional)
        """
        self.df = pd.read_csv(csv_file_path)
        self.tavily_api_key = tavily_api_key
        
        # Clean the data - strip whitespace from headers and data
        self.df.columns = self.df.columns.str.strip()
        for col in self.df.columns:
            if self.df[col].dtype == 'object':
                self.df[col] = self.df[col].astype(str).str.strip()
        
        # Preprocess ingredients for faster matching
        self.df['processed_ingredients'] = self.df['ingredients'].apply(self._process_ingredients)
    
    def _process_ingredients(self, ingredients_str: str) -> List[str]:
        """
        Process ingredients string into a list of cleaned ingredients
        
        Args:
            ingredients_str: Raw ingredients string from CSV
            
        Returns:
            List of cleaned ingredient names
        """
        if pd.isna(ingredients_str) or ingredients_str == 'nan':
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
    
    def _extract_size_info(self, weight_value, weight_unit=None) -> Tuple[float, str]:
        """
        Extract numeric value and unit from weight_value and weight_unit columns
        
        Args:
            weight_value: Numeric weight value
            weight_unit: Unit string (ml, oz, g, etc.)
            
        Returns:
            Tuple of (numeric_value, unit)
        """
        if pd.isna(weight_value) or weight_value == 'nan':
            return (0.0, '')
        
        try:
            value = float(weight_value)
        except (ValueError, TypeError):
            return (0.0, '')
        
        unit = str(weight_unit).lower() if weight_unit and not pd.isna(weight_unit) else ''
        
        # Normalize units to ml equivalent for comparison
        if unit in ['l']:
            value *= 1000
        elif unit in ['oz']:
            value *= 29.5735  # fl oz to ml
        elif unit in ['kg']:
            value *= 1000
        
        return (value, unit)

    
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
                if fuzz.ratio(user_ing, csv_ing) >= 80:  # High threshold for ingredients
                    matches += 1
                    break
        
        return matches / total_user_ingredients if total_user_ingredients > 0 else 0.0
    def _extract_size_info_from_string(self, size_str: str) -> Tuple[float, str]:
        """
        Extract numeric value and unit from size string (for user input)
        
        Args:
            size_str: Size string (e.g., "250ml", "8.5oz")
            
        Returns:
            Tuple of (numeric_value, unit)
        """
        if pd.isna(size_str) or size_str == 'nan':
            return (0.0, '')
        
        # Extract number and unit
        match = re.search(r'(\d+(?:\.\d+)?)\s*(ml|oz|g|kg|l|gm)', str(size_str).lower())
        if match:
            value = float(match.group(1))
            unit = match.group(2)
            
            # Normalize units to ml equivalent for comparison
            if unit in ['l']:
                value *= 1000
            elif unit in ['oz']:
                value *= 29.5735  # fl oz to ml
            elif unit in ['kg']:
                value *= 1000
            
            return (value, unit)
        
        return (0.0, '')
    def _calculate_size_compatibility(self, user_size: str, csv_weight_value, csv_weight_unit, tolerance: float = 0.3) -> bool:
        """
        Check if sizes are compatible within tolerance
        
        Args:
            user_size: User's product size (string like "250ml")
            csv_weight_value: CSV weight value (numeric)
            csv_weight_unit: CSV weight unit (string)
            tolerance: Acceptable size difference ratio (default 30%)
            
        Returns:
            True if sizes are compatible
        """
        # Extract user size info from string format
        user_value, user_unit = self._extract_size_info_from_string(user_size)
        csv_value, csv_unit = self._extract_size_info(csv_weight_value, csv_weight_unit)
        
        if user_value == 0.0 or csv_value == 0.0:
            return True  # If we can't determine size, don't filter out
        
        # Calculate percentage difference
        size_diff = abs(user_value - csv_value) / user_value
        return size_diff <= tolerance

    
    def _calculate_overall_score(self, row: pd.Series, user_product: Dict) -> Dict:
        """
        Calculate overall similarity score based on multiple criteria
        
        Args:
            row: DataFrame row with product data
            user_product: User's product information
            
        Returns:
            Dictionary with scoring details
        """
        scores = {
            'name_score': 0.0,
            'ingredient_score': 0.0,
            'brand_score': 0.0,
            'category_score': 0.0,
            'size_compatible': True,
            'overall_score': 0.0
        }
        
        # Name similarity
        scores['name_score'] = fuzz.ratio(
            user_product.get('product_name', '').lower(),
            str(row['product_name']).lower()
        ) / 100.0
        
        # Ingredient similarity
        user_ingredients = self._process_ingredients(user_product.get('ingredient_list', ''))
        csv_ingredients = row['processed_ingredients']
        scores['ingredient_score'] = self._calculate_ingredient_similarity(user_ingredients, csv_ingredients)
        
        # Brand similarity
        user_brand = user_product.get('brand', '').lower()
        csv_brand = str(row['brand']).lower()
        if user_brand and csv_brand:
            scores['brand_score'] = fuzz.ratio(user_brand, csv_brand) / 100.0
        
        # Category similarity
        user_category = user_product.get('category', '').lower()
        csv_category = str(row['category']).lower()
        if user_category and csv_category:
            scores['category_score'] = fuzz.ratio(user_category, csv_category) / 100.0
        
        # Size compatibility - Updated for new dataset structure
        scores['size_compatible'] = self._calculate_size_compatibility(
            user_product.get('weight', ''),
            row['weight_value'],
            row['weight_unit']
        )
        
        # Calculate weighted overall score
        weights = {
            'name': 0.3,
            'ingredient': 0.4,
            'brand': 0.15,
            'category': 0.15
        }
        
        scores['overall_score'] = (
            scores['name_score'] * weights['name'] +
            scores['ingredient_score'] * weights['ingredient'] +
            scores['brand_score'] * weights['brand'] +
            scores['category_score'] * weights['category']
        )
        
        return scores
    
    def direct_search(self, user_product: Dict) -> Optional[Dict]:
        """
        Enhanced direct search considering name, ingredients, and other criteria
        
        Args:
            user_product: User's product information
            
        Returns:
            Dictionary with product details or None if not found
        """
        product_name = user_product.get('product_name', '').lower()
        
        # First try exact name match
        mask = self.df['product_name'].str.lower() == product_name
        exact_matches = self.df[mask]
        
        if not exact_matches.empty:
            # Among exact name matches, find the best overall match
            best_match = None
            best_score = 0.0
            
            for idx, row in exact_matches.iterrows():
                scores = self._calculate_overall_score(row, user_product)
                
                # For exact matches, prioritize size compatibility and ingredient similarity
                if scores['size_compatible'] and scores['ingredient_score'] > best_score:
                    best_score = scores['ingredient_score']
                    best_match = row.copy()
                    best_match['search_scores'] = scores
            
            if best_match is not None:
                return best_match.to_dict()
        
        return None
    
    def enhanced_fuzzy_search(self, user_product: Dict, min_overall_score: float = 0.6) -> Optional[Dict]:
        """
        Enhanced fuzzy search with multi-criteria matching
        
        Args:
            user_product: User's product information
            min_overall_score: Minimum overall similarity score required
            
        Returns:
            Dictionary with product details or None if not found
        """
        best_match = None
        best_overall_score = 0.0
        
        # Calculate scores for all products
        for idx, row in self.df.iterrows():
            scores = self._calculate_overall_score(row, user_product)
            
            # Skip if size is incompatible
            if not scores['size_compatible']:
                continue
            
            # Adjust scoring criteria:
            # 1. If ingredients match >50%, lower name threshold
            # 2. If brand and category match well, be more lenient
            
            acceptable = False
            
            # High ingredient similarity can compensate for lower name similarity
            if scores['ingredient_score'] >= 0.5 and scores['name_score'] >= 0.4:
                acceptable = True
            
            # High name similarity with decent ingredient match
            elif scores['name_score'] >= 0.7 and scores['ingredient_score'] >= 0.3:
                acceptable = True
            
            # Exact brand and category match with moderate name similarity
            elif (scores['brand_score'] >= 0.9 and scores['category_score'] >= 0.8 and 
                  scores['name_score'] >= 0.5):
                acceptable = True
            
            # High overall score
            elif scores['overall_score'] >= min_overall_score:
                acceptable = True
            
            if acceptable and scores['overall_score'] > best_overall_score:
                best_overall_score = scores['overall_score']
                best_match = row.copy()
                best_match['search_scores'] = scores
        
        if best_match is not None:
            return best_match.to_dict()
        
        return None
    
    def tavily_search(self, user_product: Dict) -> Optional[Dict]:
        """
        Enhanced Tavily search with better information extraction
        
        Args:
            user_product: User's product information
            
        Returns:
            Dictionary with estimated product details or None if not found
        """
        if not self.tavily_api_key:
            print("Tavily API key not provided. Skipping web search.")
            return None
        
        try:
            product_name = user_product.get('product_name', '')
            brand = user_product.get('brand', '')
            category = user_product.get('category', '')
            
            # Construct more specific search query
            query_parts = [product_name, "cosmetics", "ingredients"]
            if brand and brand.lower() != 'unknown':
                query_parts.insert(1, brand)
            if category:
                query_parts.append(category)
            
            query = " ".join(query_parts)
            
            # Tavily API endpoint
            url = "https://api.tavily.com/search"
            
            payload = {
                "api_key": self.tavily_api_key,
                "query": query,
                "search_depth": "basic",
                "include_answer": True,
                "include_domains": [],
                "exclude_domains": [],
                "max_results": 5
            }
            
            response = requests.post(url, json=payload, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Extract information from search results
            result_dict = self._extract_product_info_from_tavily(data, user_product)
            
            if result_dict:
                result_dict['search_method'] = 'tavily_web_search'
                # Add search scores for consistency
                result_dict['search_scores'] = {
                    'name_score': 0.8,  # Assume good match since we found it
                    'ingredient_score': 0.6,  # Moderate since web extracted
                    'brand_score': 0.9 if brand else 0.5,
                    'category_score': 0.7,
                    'size_compatible': True,
                    'overall_score': 0.7
                }
                return result_dict
                
        except Exception as e:
            print(f"Tavily search failed: {str(e)}")
            return None
        
        return None
    
    def _extract_product_info_from_tavily(self, tavily_data: Dict, user_product: Dict) -> Optional[Dict]:
        """
        Enhanced extraction of product information from Tavily search results
        
        Args:
            tavily_data: Response data from Tavily API
            user_product: Original user product information
            
        Returns:
            Dictionary with extracted product information
        """
        product_name = user_product.get('product_name', '')
        brand = user_product.get('brand', 'Unknown')
        user_category = user_product.get('category', '').lower()
        
        # Initialize result with new CSV column structure
        result = {
            'product_name': product_name,
            'brand': brand,
            'category': 'Unknown',
            'ingredients': 'Information not available from web search',
            'manufacturing location': 'Unknown',
            'weight_value': None,
            'weight_unit': None,
        }
        
        # Extract weight info from user input
        weight_str = user_product.get('weight', 'Unknown')
        if weight_str != 'Unknown':
            weight_val, weight_unit = self._extract_size_info_from_string(weight_str)
            result['weight_value'] = weight_val if weight_val > 0 else None
            result['weight_unit'] = weight_unit if weight_unit else None
        
        # Rest of the extraction logic remains similar...
        if 'results' in tavily_data:
            all_content = ""
            for item in tavily_data['results']:
                content = item.get('content', '').lower()
                title = item.get('title', '').lower()
                all_content += " " + content + " " + title
            
            # Try to determine category from content if not provided
            category_keywords = {
                'body wash': 'body',
                'shampoo': 'hair',
                'deodorant': 'body',
                'face wash': 'face',
                'moisturizer': 'face'
            }
            
            if user_category:
                result['category'] = user_category
            else:
                for keyword, category in category_keywords.items():
                    if keyword in all_content:
                        result['category'] = category
                        break
            
            # Extract brand if not provided
            if result['brand'] == 'Unknown':
                brand_patterns = [r'by\s+(\w+)', r'from\s+(\w+)', r'(\w+)\s+brand']
                for pattern in brand_patterns:
                    match = re.search(pattern, all_content)
                    if match:
                        result['brand'] = match.group(1).title()
                        break
        
        return result
    

    def search_product(self, user_product: Dict) -> str:
        """
        Main search function with enhanced multi-criteria matching
        
        Args:
            user_product: Dictionary containing user's product information
            
        Returns:
            JSON string with search results and method used
        """
        product_name = user_product.get('product_name', '')
        
        # Define CSV columns to identify user-specific fields
        csv_columns = set(['product_name', 'brand', 'category', 'ingredients', 
                      'manufacturing location', 'weight_value', 'weight_unit'])
        
        # Extract user-specific fields (fields not in CSV)
        user_specific_fields = {k: v for k, v in user_product.items() if k not in csv_columns}

        
        search_result = {
        'search_query': product_name,
        'search_method': None,
        'found': False,
        'product_details': None,
        'user_input': user_product,
        'match_confidence': 'low',
        **user_specific_fields
    }
        
        # Method 1: Enhanced direct search
        print(f"Searching for '{product_name}' using enhanced direct search...")
        result = self.direct_search(user_product)
        
        if result:
            scores = result.get('search_scores', {})
            confidence = 'high' if scores.get('overall_score', 0) > 0.8 else 'medium'
            
            # Add URL field if not present
            if 'url' not in result:
                result['url'] = result.get('title-href', '')
            
            # Add ALL user-specific information to product details
            result.update(user_specific_fields)
            
            search_result.update({
                'search_method': 'enhanced_direct_search',
                'found': True,
                'product_details': result,
                'match_confidence': confidence
            })
            return json.dumps(search_result, indent=2)
        
        # Method 2: Enhanced fuzzy search
        print(f"Direct search failed. Trying enhanced fuzzy search...")
        result = self.enhanced_fuzzy_search(user_product, min_overall_score=0.5)
        
        if result:
            scores = result.get('search_scores', {})
            confidence = 'high' if scores.get('overall_score', 0) > 0.7 else 'medium'
            
            # Add URL field if not present
            if 'url' not in result:
                result['url'] = result.get('title-href', '')
            
            # Add ALL user-specific information to product details
            result.update(user_specific_fields)
            
            search_result.update({
                'search_method': 'enhanced_fuzzy_search',
                'found': True,
                'product_details': result,
                'match_confidence': confidence
            })
            return json.dumps(search_result, indent=2)
        
        # Method 3: Tavily web search
        print(f"Fuzzy search failed. Trying web search...")
        result = self.tavily_search(user_product)
        
        if result:
            # Add ALL user-specific information to product details
            result.update(user_specific_fields)
            
            search_result.update({
                'search_method': 'tavily_web_search',
                'found': True,
                'product_details': result,
                'match_confidence': 'medium'
            })
            return json.dumps(search_result, indent=2)
        
        # No results found
        print("✗ No sufficiently similar results found using any search method")
        print("  This prevents showing irrelevant products to the user")
        search_result['search_method'] = 'no_suitable_results'
        return json.dumps(search_result, indent=2)


def main():
    """
    Main function to demonstrate the enhanced cosmetics search functionality
    """
    # Sample user products for testing
    test_products = [
        {
            'product_name': 'Calming Bubble Bath',
            'brand': 'Shampoo & Wash',
            'category': 'Body',
            'weight': '150ml',
            'packaging_type': 'Metal',
            'ingredient_list': 'water (Agua), Organic Aloe Barbadensis (Aloe) Leaf Juice, , Decyl Glucoside, Lauryl Glucoside (from sugar), Glycerin (Vegetable), Natural Lavender-Melon Essential  Blend, Glucono Delta Lactone (natural ferment of sugar), Xanthan Gum, Organic Meadowsweet (Spiraea Ulmaria) Extract, Organic Anthemis Nobilis (chamomile) Flower Extract, Organic Nasturtium Officinale (Watercress) Extract, Organic Pueraria Lobata (Kudzo) Root Extract, Potassium Sorbate (food grade preservative), CHONDRUS CRISPUS (CARRAGEENAN) EXTRACT Certified Organic ingredients',
            'latitude': 12.9716,
            'longitude': 77.5946,
            'usage_frequency': 'daily',
            'manufacturing_loc': "Pune"
        },
        {
            'product_name': 'Nivea Body Wash',
            'brand': 'Dove',
            'category': 'Body',
            'weight': '250ml',
            'packaging_type': 'Plastic',
            'ingredient_list': 'Water, Sodium Laureth Sulfate, Cocamidopropyl Betaine, Sodium Chloride, Fragrance',
            'latitude': 12.9716,
            'longitude': 77.5946,
            'usage_frequency': 'daily',
            'manufacturing_loc': "Mumbai"
        }
    ]
    
    # Initialize the searcher
    searcher = CosmeticsSearcher(
        csv_file_path='/Users/prishabirla/Desktop/ADT/final/ocr/merged_dataset.csv',
        tavily_api_key=os.environ['TAVILY_API_KEY']
    )
    
    # Test with multiple products
    for i, test_product in enumerate(test_products, 1):
        print(f"\n{'='*60}")
        print(f"TESTING PRODUCT {i}: {test_product['product_name']}")
        print('='*60)
        
        # Perform the search
        result_json = searcher.search_product(test_product)
        
        # Parse the JSON string to dictionary
        try:
            result = json.loads(result_json)
        except json.JSONDecodeError as e:
            print(f"Error parsing search result: {e}")
            continue
        
        # Print the results
        print(f"\nSearch Method: {result.get('search_method', 'Unknown')}")
        print(f"Found: {result.get('found', False)}")
        print(f"Confidence: {result.get('match_confidence', 'Unknown')}")
        
        # Print user-specific fields from top level
        user_fields = ['latitude', 'longitude', 'usage_frequency', 'manufacturing_loc', 'packaging_type', 'weight']
        print(f"\nUSER INPUT FIELDS:")
        for field in user_fields:
            if field in result:
                print(f"{field}: {result[field]}")
        
        if result.get('found', False) and result.get('product_details'):
            print(f"\n{'-'*40}")
            print("MATCHED PRODUCT DETAILS")
            print('-'*40)
            details = result['product_details']
            
            # Print ALL fields from product details (both CSV and user fields)
            print("CSV + USER COMBINED DATA:")
            for key, value in details.items():
                if key == 'search_scores':
                    continue  # Skip scores for now
                if key == 'ingredients' and len(str(value)) > 100:
                    value = str(value)[:100] + "..."
                print(f"{key}: {value}")
            
            # Print matching scores if available
            if 'search_scores' in details:
                scores = details['search_scores']
                print(f"\nMATCH QUALITY:")
                print(f"Name similarity: {scores.get('name_score', 0):.2%}")
                print(f"Ingredient similarity: {scores.get('ingredient_score', 0):.2%}")
                print(f"Brand similarity: {scores.get('brand_score', 0):.2%}")
                print(f"Category similarity: {scores.get('category_score', 0):.2%}")
                print(f"Size compatible: {scores.get('size_compatible', False)}")
                print(f"Overall score: {scores.get('overall_score', 0):.2%}")
        else:
            print("\nNo suitable match found. This prevents showing irrelevant products.")

if __name__ == "__main__":
    main()