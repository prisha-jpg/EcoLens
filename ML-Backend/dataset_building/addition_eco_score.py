import pandas as pd
import numpy as np
import sys
import os

# Ensure we can import the LCA model reliably when run from different working dirs
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, os.pardir))
LCA_DIR = os.path.join(PROJECT_ROOT, "LCA")
if LCA_DIR not in sys.path:
    sys.path.insert(0, LCA_DIR)

from file1 import EnhancedLCAModel  # Import the existing model
def map_category_with_impact(category_str, brand=None):
    """Map categories with different environmental impact factors"""
    
    # High-impact categories (more chemicals, processing)
    high_impact = ['makeup', 'cosmetics', 'anti-aging', 'sunscreen', 'hair_color']
    
    # Medium-impact categories
    medium_impact = ['skincare', 'haircare', 'deodorant', 'perfume']
    
    # Low-impact categories (simpler formulations)
    low_impact = ['body', 'bodywash', 'shampoo', 'soap']
    
    category_lower = str(category_str).lower() if not pd.isna(category_str) else 'body'
    
    # Premium brands often have higher impact due to exotic ingredients
    premium_brands = ['la mer', 'sk-ii', 'estee lauder', 'lancome', 'dior', 'chanel']
    brand_lower = str(brand).lower() if not pd.isna(brand) else ''
    
    is_premium = any(pb in brand_lower for pb in premium_brands)
    
    if any(cat in category_lower for cat in high_impact):
        return 'High Impact Cosmetics' if not is_premium else 'Premium High Impact'
    elif any(cat in category_lower for cat in medium_impact):
        return 'Medium Impact Personal Care' if not is_premium else 'Premium Medium Impact'
    else:
        return 'Basic Personal Care' if not is_premium else 'Premium Basic Care'
def determine_advanced_packaging(form, size, brand, price_tier='mid'):
    """More nuanced packaging determination based on multiple factors"""
    
    form_str = str(form).lower() if not pd.isna(form) else 'cream'
    size_num = extract_numeric_size(size)
    brand_lower = str(brand).lower() if not pd.isna(brand) else ''
    
    # Luxury brands use more premium (less eco-friendly) packaging
    luxury_indicators = ['premium', 'luxury', 'gold', 'platinum', 'advanced', 'professional']
    is_luxury = any(ind in brand_lower for ind in luxury_indicators)
    
    # Size-based packaging decisions
    if size_num > 500:  # Large sizes
        if form_str in ['liquid', 'shampoo', 'bodywash']:
            return 'Large Plastic Bottle' if not is_luxury else 'Premium Plastic with Pump'
        elif form_str in ['cream', 'lotion']:
            return 'Plastic Jar' if not is_luxury else 'Glass Jar with Metal Lid'
    
    elif size_num < 50:  # Small/sample sizes
        if form_str in ['cream', 'serum']:
            return 'Small Glass Vial' if is_luxury else 'Small Plastic Tube'
        else:
            return 'Small Plastic Container'
    
    else:  # Regular sizes
        packaging_map = {
            'cream': 'Glass Jar' if is_luxury else 'Plastic Jar',
            'liquid': 'Glass Bottle' if is_luxury else 'Plastic Bottle',
            'serum': 'Glass Dropper Bottle',
            'oil': 'Dark Glass Bottle',
            'spray': 'Aluminum Spray' if is_luxury else 'Plastic Spray',
            'powder': 'Metal Compact' if is_luxury else 'Plastic Compact',
            'bar': 'Minimal Paper Wrap',
            'gel': 'Plastic Tube' if not is_luxury else 'Aluminum Tube'
        }
        return packaging_map.get(form_str, 'Standard Plastic')
def analyze_ingredient_impact(ingredient_list):
    """Analyze ingredients for environmental impact"""
    
    if pd.isna(ingredient_list):
        return 'medium', 1.0
    
    ingredients = str(ingredient_list).lower()
    
    # High-impact ingredients
    high_impact = ['sulfate', 'paraben', 'silicone', 'mineral oil', 'petroleum', 
                   'synthetic fragrance', 'phthalate', 'formaldehyde', 'aluminum',
                   'microplastic', 'triclosan', 'oxybenzone']
    
    # Medium-impact ingredients  
    medium_impact = ['glycol', 'alcohol', 'acid', 'retinol', 'benzoyl', 
                     'chemical sunscreen', 'synthetic dye', 'preservative']
    
    # Low-impact/natural ingredients - EXPANDED
    low_impact = ['water', 'natural', 'organic', 'plant extract', 'essential oil',
                  'shea butter', 'coconut oil', 'aloe vera', 'vitamin', 'mineral sunscreen',
                  'jojoba oil', 'argan oil', 'tea tree', 'lavender', 'chamomile', 
                  'rose water', 'green tea', 'turmeric', 'honey', 'beeswax']
    
    # Organic indicators - NEW
    organic_indicators = ['organic', 'certified organic', 'bio', 'natural', 
                         'plant-based', 'botanical', 'herbal']
    
    high_count = sum(1 for ingredient in high_impact if ingredient in ingredients)
    medium_count = sum(1 for ingredient in medium_impact if ingredient in ingredients)
    low_count = sum(1 for ingredient in low_impact if ingredient in ingredients)
    organic_count = sum(1 for indicator in organic_indicators if indicator in ingredients)
    
    # Calculate impact multiplier - UPDATED
    if organic_count > 1:  # Strong organic presence
        return 'organic', 0.6  # 40% eco bonus
    elif high_count > 2:
        return 'high', 1.5  # Increased penalty
    elif high_count > 0 or medium_count > 3:
        return 'medium_high', 1.3  # Increased penalty
    elif medium_count > 0:
        return 'medium', 1.0  # neutral
    elif low_count > 3:  # More natural ingredients
        return 'natural', 0.7  # 30% bonus
    elif low_count > 1:
        return 'low', 0.85  # 15% bonus
    else:
        return 'medium', 1.0
    
def extract_numeric_size(size_str):
    """Extract numeric value from size string"""
    if pd.isna(size_str):
        return 250
    
    import re
    numbers = re.findall(r'\d+', str(size_str))
    return int(numbers[0]) if numbers else 250

def calculate_size_impact_multiplier(size_str):
    """Calculate environmental impact based on product size"""
    size_num = extract_numeric_size(size_str)
    
    # Smaller products often have higher per-unit environmental cost
    if size_num < 50:
        return 1.3  # 30% penalty for very small products
    elif size_num < 100:
        return 1.1  # 10% penalty
    elif size_num > 500:
        return 0.9  # 10% bonus for larger sizes (economies of scale)
    else:
        return 1.0  # neutral

# 5. Brand-Based Sustainability Scoring
def get_brand_sustainability_multiplier(brand):
    """Assign sustainability multipliers based on brand reputation"""
    
    if pd.isna(brand):
        return 1.0
    
    brand_lower = str(brand).lower()
    
    # Sustainable/eco-friendly brands - EXPANDED
    green_brands = ['lush', 'the body shop', 'burt\'s bees', 'seventh generation',
                    'honest', 'alba botanica', 'jason', 'avalon organics',
                    'chemist at play', 'foxtale', 'plum', 'mamaearth', 'wow']
    
    # Premium brands - EXPANDED
    premium_brands = ['la mer', 'sk-ii', 'estee lauder', 'lancome', 'dior', 
                      'chanel', 'tom ford', 'charlotte tilbury', 'ysl', 'clinique']
    
    # Mass market brands
    mass_brands = ['l\'oreal', 'maybelline', 'revlon', 'covergirl', 'neutrogena',
                   'ponds', 'yardley', 'joy', 'boroline', 'boroplus']
    
    if any(gb in brand_lower for gb in green_brands):
        return 0.65  # Increased eco bonus
    elif any(pb in brand_lower for pb in premium_brands):
        return 1.4  # Increased penalty for luxury
    elif any(mb in brand_lower for mb in mass_brands):
        return 1.15  # Slight penalty
    else:
        return 1.0  # neutral

def get_category_organic_bonus(category_str, ingredients):
    """Give additional bonus for organic/natural categories"""
    
    if pd.isna(category_str) or pd.isna(ingredients):
        return 1.0
    
    category_lower = str(category_str).lower()
    ingredients_lower = str(ingredients).lower()
    
    # Categories that benefit from organic ingredients
    natural_categories = ['skincare', 'face cream', 'hand cream', 'night cream',
                         'serum', 'oil', 'lotion', 'aftershave']
    
    organic_words = ['organic', 'natural', 'herbal', 'botanical', 'plant extract']
    
    if any(cat in category_lower for cat in natural_categories):
        if any(word in ingredients_lower for word in organic_words):
            return 0.9  # 10% additional bonus
    
    return 1.0
def map_category(category_str):
    """Map table categories to LCA model categories"""
    category_mapping = {
        'body': 'Personal Care',
        'bodywash': 'Personal Care',
        'skincare': 'Personal Care',
        'haircare': 'Personal Care',
        'cosmetics': 'Cosmetics',
        'makeup': 'Cosmetics'
    }
    
    if pd.isna(category_str):
        return 'Personal Care'
    
    return category_mapping.get(category_str.lower(), 'Personal Care')

def parse_size_to_weight(size_str):
    """Convert size to weight format expected by LCA model"""
    if pd.isna(size_str):
        return '250ml'
    
    # Convert to string and clean
    size_str = str(size_str).strip()
    
    # If it's just a number, assume it's ml
    try:
        num = float(size_str)
        return f"{int(num)}ml"
    except:
        pass
    
    # If it already has units, return as is
    if any(unit in size_str.lower() for unit in ['ml', 'g', 'kg', 'l']):
        return size_str
    
    # Default fallback
    return '250ml'

def determine_packaging_from_form(form_str):
    """Determine packaging type from product form"""
    if pd.isna(form_str):
        return 'Plastic'
    
    form_str = str(form_str).lower()
    
    packaging_mapping = {
        'cream': 'Plastic',
        'liquid': 'Plastic', 
        'gel': 'Plastic',
        'foam': 'Plastic',
        'bar': 'Paper/Cardboard',
        'powder': 'Plastic',
        'spray': 'Metal',
        'oil': 'Glass'
    }
    
    return packaging_mapping.get(form_str, 'Plastic')

def save_updated_table(df, output_path):
    """Save the updated table with eco scores"""
    df.to_csv(output_path, index=False)
    print(f"Updated table saved to: {output_path}")

def process_product_table_with_eco_scores(csv_file_path, emission_factors_csv="save.csv"):
    """
    Process the product table and add enhanced eco_score columns
    """
    
    # Load the product table
    print("Loading product table...")
    df = pd.read_csv(csv_file_path)
    
    # Initialize the LCA model
    print("Initializing LCA model...")
    lca_model = EnhancedLCAModel(emission_factors_csv)
    lca_model.initialize_models()
    
    results = []
    
    print(f"Processing {len(df)} products...")
    
    for index, row in df.iterrows():
        try:
            # Build enhanced product data
            product_data = {
                'product_name': row['product_name'],
                'brand': row.get('brand', 'Unknown'),
                'category': map_category_with_impact(row.get('category'), row.get('brand')),
                'weight': f"{row.get('weight_value', 250)}{row.get('weight_unit', 'ml')}",
                'packaging_type': determine_advanced_packaging(row.get('form'), row.get('size'), row.get('brand')),
                'ingredient_list': row.get('ingredients', 'Water, Surfactants'),
                'latitude': 12.9716,
                'longitude': 77.5946,
                'usage_frequency': 'daily'
            }
            
            # Calculate base LCA
            result = lca_model.calculate_comprehensive_lca(product_data)
            base_score = result.eco_score

            # Derive robust additive adjustments (bounded) from contextual multipliers
            ingredient_impact, ingredient_multiplier = analyze_ingredient_impact(row.get('ingredients'))
            size_multiplier = calculate_size_impact_multiplier(row.get('size'))
            brand_multiplier = get_brand_sustainability_multiplier(row.get('brand'))
            organic_bonus_mult = get_category_organic_bonus(row.get('category'), row.get('ingredients'))

            def multiplier_to_delta(multiplier, max_delta):
                # multiplier > 1 => penalty, < 1 => bonus. Map linearly and cap.
                if pd.isna(multiplier) or multiplier <= 0:
                    return 0.0
                if multiplier >= 1:
                    return -min(max_delta, max_delta * (multiplier - 1))
                return min(max_delta, max_delta * (1 - multiplier))

            # Convert each multiplier to a bounded delta with calibrated weights
            delta_ingredient = multiplier_to_delta(ingredient_multiplier, 12)
            delta_size = multiplier_to_delta(size_multiplier, 8)
            delta_brand = multiplier_to_delta(brand_multiplier, 10)
            delta_organic = multiplier_to_delta(organic_bonus_mult, 6)

            # Combine additively; keep in [0, 100]
            final_score = base_score + delta_ingredient + delta_size + delta_brand + delta_organic
            final_score = float(np.clip(final_score, 0, 100))
            
            results.append({
                'packaging_type': product_data['packaging_type'],
                'eco_score': round(final_score, 1),
                'ingredient_impact': ingredient_impact,
                'size_multiplier': round(size_multiplier, 3),
                'brand_multiplier': round(brand_multiplier, 3),
                'base_score': round(base_score, 1)
            })
            
            print(f"  {index+1}/{len(df)}: {row['product_name']} - "
                  f"Base: {base_score:.1f} → Final: {final_score:.1f}")
            
        except Exception as e:
            print(f"Error processing {row['product_name']}: {e}")
            results.append({
                'packaging_type': 'Plastic',
                'eco_score': 50.0,
                'ingredient_impact': 'medium',
                'size_multiplier': 1.0,
                'brand_multiplier': 1.0,
                'base_score': 50.0
            })
    
    # Add all new columns
    for key in results[0].keys():
        df[key] = [r[key] for r in results]
    
    return df

# Fix 2: Update DataFrame processing function
def add_eco_scores_to_dataframe(df, emission_factors_csv="save.csv"):
    """
    Add enhanced eco scores directly to an existing DataFrame
    """
    
    # Initialize the LCA model
    print("Initializing LCA model...")
    lca_model = EnhancedLCAModel(emission_factors_csv)
    lca_model.initialize_models()
    
    results = []
    
    print(f"Processing {len(df)} products...")
    
    for index, row in df.iterrows():
        try:
            # Enhanced categorization
            enhanced_category = map_category_with_impact(
                row.get('category'), row.get('brand')
            )
            
            # Advanced packaging assessment
            form = 'cream' if 'cream' in str(row.get('category', '')).lower() else 'liquid'
            size_str = f"{row.get('weight_value', 250)}{row.get('weight_unit', 'ml')}"

            packaging_type = determine_advanced_packaging(
                form, size_str, row.get('brand')
            )
            
            product_data = {
                'product_name': row['product_name'],
                'brand': row.get('brand', 'Unknown'),
                'category': enhanced_category,
                'weight': parse_size_to_weight(row.get('size', '250')),
                'packaging_type': packaging_type,
                'ingredient_list': row.get('ingredients', 'Water, Surfactants'),
                'latitude': 12.9716,
                'longitude': 77.5946,
                'usage_frequency': 'daily'
            }
            
            result = lca_model.calculate_comprehensive_lca(product_data)
            base_score = result.eco_score

            # Compute multipliers post base_score to avoid uninitialized usage
            ingredient_impact, ingredient_multiplier = analyze_ingredient_impact(row.get('ingredients'))
            size_multiplier = calculate_size_impact_multiplier(size_str)
            brand_multiplier = get_brand_sustainability_multiplier(row.get('brand'))
            organic_bonus_mult = get_category_organic_bonus(row.get('category'), row.get('ingredients'))

            def multiplier_to_delta(multiplier, max_delta):
                if pd.isna(multiplier) or multiplier <= 0:
                    return 0.0
                if multiplier >= 1:
                    return -min(max_delta, max_delta * (multiplier - 1))
                return min(max_delta, max_delta * (1 - multiplier))

            delta_ingredient = multiplier_to_delta(ingredient_multiplier, 12)
            delta_size = multiplier_to_delta(size_multiplier, 8)
            delta_brand = multiplier_to_delta(brand_multiplier, 10)
            delta_organic = multiplier_to_delta(organic_bonus_mult, 6)

            final_score = base_score + delta_ingredient + delta_size + delta_brand + delta_organic
            final_score = float(np.clip(final_score, 0, 100))
            
            results.append({
                'packaging_type': packaging_type,
                'eco_score': round(final_score, 1),
                'ingredient_impact': ingredient_impact,
                'size_multiplier': round(size_multiplier, 3),
                'brand_multiplier': round(brand_multiplier, 3),
                'base_score': round(base_score, 1)
            })
            
            if index % 5 == 0:
                print(f"  Processed {index+1}/{len(df)} products...")
            
        except Exception as e:
            print(f"  Error processing row {index}: {e}")
            results.append({
                'packaging_type': 'Plastic',
                'eco_score': 50.0,
                'ingredient_impact': 'medium',
                'size_multiplier': 1.0,
                'brand_multiplier': 1.0,
                'base_score': 50.0
            })
    
    # Add the new columns
    df_copy = df.copy()
    for key in results[0].keys():
        df_copy[key] = [r[key] for r in results]
    
    return df_copy


def main():
    """Main function to process the table"""
    
    # File paths - UPDATE THESE TO MATCH YOUR FILES
    input_csv = "/Users/prishabirla/Desktop/ADT/final/ocr/merged_dataset.csv"  # Replace with your CSV file path
    emission_csv = "save.csv"  # Your emission factors CSV
    output_csv = "product_table_with_eco_scores.csv"  # Output file
    
    try:
        # Process the table
        updated_df = process_product_table_with_eco_scores(input_csv, emission_csv)
        
        # Display sample results
        print("\nSample results:")
        print(updated_df[['product_name', 'brand', 'eco_score']].head(10))
        
        # Save updated table
        save_updated_table(updated_df, output_csv)
        
        # Display statistics
        print(f"\nEco Score Statistics:")
        print(f"Mean: {updated_df['eco_score'].mean():.1f}")
        print(f"Median: {updated_df['eco_score'].median():.1f}")
        print(f"Min: {updated_df['eco_score'].min():.1f}")
        print(f"Max: {updated_df['eco_score'].max():.1f}")
        print(f"Std Dev: {updated_df['eco_score'].std():.1f}")
        
        return updated_df
        
    except FileNotFoundError as e:
        print(f"Error: Could not find file. Please check the file paths.")
        print(f"Looking for: {input_csv}")
        return None
    except Exception as e:
        print(f"Error processing table: {e}")
        return None

if __name__ == "__main__":
    main()