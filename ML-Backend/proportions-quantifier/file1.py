import json
import pickle
import re
from typing import Dict, List, Tuple, Optional, Union
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import torch
from transformers import AutoTokenizer, AutoModel, pipeline
import warnings
warnings.filterwarnings('ignore')

class AdvancedIngredientExpert:
    """Advanced ingredient proportion prediction system"""
    
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name)
        
        # Machine learning components
        self.proportion_predictor = RandomForestRegressor(n_estimators=100, random_state=42)
        self.feature_scaler = StandardScaler()
        self.is_trained = False
        
        # Knowledge base
        self.ingredient_knowledge = self._load_ingredient_knowledge()
        self.embedding_cache = {}
        
        print(f"Initialized AdvancedIngredientExpert with model: {model_name}")
    
    def _load_ingredient_knowledge(self) -> Dict:
        """Load comprehensive ingredient knowledge base"""
        return {
        "categories": {
            "base_flour": {
                "keywords": ["flour", "wheat", "maida", "chakki atta", "atta", "refined wheat flour", "whole wheat flour"],
                "typical_range": (0.35, 0.70),
                "primary_function": "structure"
            },
            "water": {
                "keywords": ["water", "aqua", "purified water", "distilled water"],
                "typical_range": (0.20, 0.80),
                "primary_function": "hydration"
            },
            "oils_fats": {
                "keywords": ["oil", "ghee", "butter", "fat", "coconut oil", "olive oil", "vegetable oil", "palm oil", "sunflower oil"],
                "typical_range": (0.02, 0.30),
                "primary_function": "texture"
            },
            "sugars": {
                "keywords": ["sugar", "glucose", "fructose", "honey", "jaggery", "corn syrup", "high fructose corn syrup"],
                "typical_range": (0.01, 0.25),
                "primary_function": "sweetening"
            },
            "salt": {
                "keywords": ["salt", "sodium chloride", "sea salt", "rock salt", "black salt"],
                "typical_range": (0.005, 0.035),
                "primary_function": "flavor"
            },
            "leavening": {
                "keywords": ["yeast", "baking powder", "baking soda", "sodium bicarbonate", "active dry yeast"],
                "typical_range": (0.002, 0.020),
                "primary_function": "leavening"
            },
            "emulsifiers": {
                "keywords": ["emulsifier", "lecithin", "mono and diglycerides", "polysorbate", "sorbitan"],
                "typical_range": (0.001, 0.015),
                "primary_function": "texture"
            },
            "preservatives": {
                "keywords": ["preservative", "sodium benzoate", "potassium sorbate", "citric acid", "ascorbic acid", "tocopherol"],
                "typical_range": (0.001, 0.020),
                "primary_function": "preservation"
            },
            "surfactants": {
                "keywords": ["sodium lauryl sulfate", "sodium laureth sulfate", "cocamidopropyl betaine", "cocamide"],
                "typical_range": (0.05, 0.25),
                "primary_function": "cleansing"
            },
            "thickeners": {
                "keywords": ["carbomer", "xanthan gum", "guar gum", "carrageenan", "agar", "pectin"],
                "typical_range": (0.001, 0.020),
                "primary_function": "texture"
            },
            "humectants": {
                "keywords": ["glycerin", "glycerol", "propylene glycol", "sorbitol", "hyaluronic acid"],
                "typical_range": (0.02, 0.20),
                "primary_function": "moisture"
            },
            "alcohols": {
                "keywords": ["cetyl alcohol", "stearyl alcohol", "cetearyl alcohol", "benzyl alcohol"],
                "typical_range": (0.01, 0.10),
                "primary_function": "texture"
            },
            "silicones": {
                "keywords": ["dimethicone", "cyclopentasiloxane", "dimethiconol", "siloxane"],
                "typical_range": (0.01, 0.15),
                "primary_function": "texture"
            },
            "fragrances": {
                "keywords": ["fragrance", "parfum", "essential oil", "natural fragrance", "artificial fragrance"],
                "typical_range": (0.001, 0.030),
                "primary_function": "fragrance"
            },
            "colorants": {
                "keywords": ["color", "dye", "pigment", "titanium dioxide", "iron oxide", "mica", "ci", "fd&c"],
                "typical_range": (0.001, 0.050),
                "primary_function": "coloring"
            },
            "acids": {
                "keywords": ["citric acid", "lactic acid", "phosphoric acid", "acetic acid", "malic acid"],
                "typical_range": (0.001, 0.020),
                "primary_function": "ph_adjustment"
            },
            "proteins": {
                "keywords": ["protein", "whey", "casein", "soy protein", "pea protein", "collagen"],
                "typical_range": (0.10, 0.90),
                "primary_function": "nutrition"
            },
            "vitamins": {
                "keywords": ["vitamin", "ascorbic acid", "tocopherol", "retinol", "niacin", "riboflavin", "thiamine"],
                "typical_range": (0.001, 0.020),
                "primary_function": "nutrition"
            },
            "minerals": {
                "keywords": ["iron", "calcium", "zinc", "magnesium", "potassium", "sodium"],
                "typical_range": (0.001, 0.015),
                "primary_function": "nutrition"
            },
            "spices_herbs": {
                "keywords": ["spice", "herb", "pepper", "turmeric", "cumin", "coriander", "basil", "oregano", "thyme"],
                "typical_range": (0.001, 0.080),
                "primary_function": "flavor"
            },
            "vegetables": {
                "keywords": ["tomato", "onion", "garlic", "potato", "carrot", "bell pepper", "cucumber"],
                "typical_range": (0.05, 0.70),
                "primary_function": "base"
            },
            "fruits": {
                "keywords": ["apple", "orange", "lemon", "lime", "grape", "berry", "mango", "banana"],
                "typical_range": (0.10, 0.90),
                "primary_function": "base"
            },
            "dairy": {
                "keywords": ["milk", "cream", "yogurt", "cheese", "butter", "ghee", "whey"],
                "typical_range": (0.05, 0.80),
                "primary_function": "base"
            },
            "caffeine": {
                "keywords": ["caffeine", "coffee", "tea", "guarana", "yerba mate"],
                "typical_range": (0.001, 0.010),
                "primary_function": "stimulant"
            },
            "unknown": {
                "keywords": [],
                "typical_range": (0.001, 0.100),
                "primary_function": "unknown"
            }
        },
        "product_contexts": {
            "Bakery": ["base_flour", "water", "oils_fats", "sugars", "salt", "leavening", "emulsifiers", "preservatives"],
            "Personal Care": ["water", "surfactants", "humectants", "alcohols", "silicones", "fragrances", "colorants", "preservatives", "thickeners"],
            "Food": ["vegetables", "fruits", "dairy", "oils_fats", "salt", "spices_herbs", "sugars", "preservatives", "acids"],
            "Beverages": ["water", "sugars", "acids", "fragrances", "colorants", "preservatives", "caffeine"],
            "Supplements": ["proteins", "vitamins", "minerals", "sugars", "fragrances"]
        }
    }
    
    def get_embedding(self, text: str) -> np.ndarray:
        """Get sentence embedding with caching"""
        if text in self.embedding_cache:
            return self.embedding_cache[text]
        
        inputs = self.tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
        with torch.no_grad():
            outputs = self.model(**inputs)
            embedding = outputs.last_hidden_state.mean(dim=1).numpy().flatten()
        
        self.embedding_cache[text] = embedding
        return embedding
    
    def normalize_ingredient_name(self, ingredient: str) -> str:
        """Advanced ingredient name normalization"""
        # Convert to lowercase and clean
        normalized = ingredient.lower().strip()
        
        # Remove common patterns
        normalized = re.sub(r'^(and\s+|,\s*)', '', normalized)
        normalized = re.sub(r'\s*\([^)]*\)', '', normalized)  # Remove parenthetical content
        normalized = re.sub(r'\s+', ' ', normalized)  # Normalize whitespace
        normalized = re.sub(r'[^\w\s-]', '', normalized)  # Remove special chars except hyphens
        
        return normalized.strip()
    
    def parse_ingredient_list(self, ingredient_text: str) -> List[str]:
        """Parse complex ingredient lists"""
        if isinstance(ingredient_text, list):
            return ingredient_text
        
        # Split by comma first
        ingredients = [ing.strip() for ing in ingredient_text.split(',')]
        
        # Handle compound ingredients with AND
        processed_ingredients = []
        for ing in ingredients:
            if ' AND ' in ing.upper():
                # Split by AND and take the first part as primary
                parts = re.split(r'\s+AND\s+', ing, flags=re.IGNORECASE)
                processed_ingredients.extend([part.strip() for part in parts if part.strip()])
            else:
                processed_ingredients.append(ing.strip())
        
        return [ing for ing in processed_ingredients if len(ing) > 2]
    
    def categorize_ingredient(self, ingredient: str) -> Tuple[str, float]:
        """Categorize ingredient with confidence score"""
        normalized = self.normalize_ingredient_name(ingredient)
        
        # Direct keyword matching first
        for category, info in self.ingredient_knowledge["categories"].items():
            for keyword in info["keywords"]:
                if keyword in normalized or normalized in keyword:
                    return category, 0.95
        
        # Semantic similarity matching
        ingredient_emb = self.get_embedding(normalized)
        best_category = "unknown"
        best_similarity = 0
        
        for category, info in self.ingredient_knowledge["categories"].items():
            category_similarities = []
            for keyword in info["keywords"]:
                keyword_emb = self.get_embedding(keyword)
                similarity = np.dot(ingredient_emb, keyword_emb) / (
                    np.linalg.norm(ingredient_emb) * np.linalg.norm(keyword_emb) + 1e-8
                )
                category_similarities.append(similarity)
            
            avg_similarity = np.mean(category_similarities)
            if avg_similarity > best_similarity:
                best_similarity = avg_similarity
                best_category = category
        
        confidence = min(0.9, best_similarity) if best_similarity > 0.6 else 0.3
        return best_category if best_similarity > 0.6 else "unknown", confidence
    
    def extract_advanced_features(self, ingredient: str, ingredient_list: List[str], 
                               product_category: str, known_proportions: Dict = None) -> np.ndarray:
        """Enhanced feature extraction with more sophisticated features"""
        features = []
        
        # Position-based features (more detailed)
        try:
            position = ingredient_list.index(ingredient)
            total_ingredients = len(ingredient_list)
            features.extend([
                position,  # Absolute position
                position / total_ingredients,  # Relative position
                1.0 / (position + 1),  # Inverse position weight
                np.exp(-position * 0.3),  # Exponential decay based on position
                1.0 if position == 0 else 0.0,  # Is first ingredient
                1.0 if position < 3 else 0.0,  # Is in top 3
            ])
        except ValueError:
            features.extend([0, 0, 1.0, 1.0, 0.0, 0.0])
        
        # Ingredient category features (enhanced)
        category, confidence = self.categorize_ingredient(ingredient)
        category_info = self.ingredient_knowledge["categories"].get(category, {})
        typical_range = category_info.get("typical_range", (0.01, 0.1))
        
        features.extend([
            confidence,
            typical_range[0],  # Minimum typical proportion
            typical_range[1],  # Maximum typical proportion
            (typical_range[0] + typical_range[1]) / 2,  # Average typical proportion
        ])
        
        # Product context features (enhanced)
        context_categories = self.ingredient_knowledge["product_contexts"].get(product_category, [])
        features.extend([
            1.0 if category in context_categories else 0.0,
            len(context_categories) / 10.0,  # Normalized context size
        ])
        
        # Ingredient name features (enhanced)
        normalized_name = self.normalize_ingredient_name(ingredient)
        words = normalized_name.split()
        features.extend([
            len(normalized_name),  # Name length
            len(words),  # Word count
            1.0 if any(char.isdigit() for char in normalized_name) else 0.0,  # Contains numbers
            1.0 if any(word in ['oil', 'extract', 'powder'] for word in words) else 0.0,  # Contains common suffixes
            1.0 if any(word in ['natural', 'artificial', 'synthetic'] for word in words) else 0.0,  # Contains origin indicators
        ])
        
        # Known proportion features
        if known_proportions:
            known_ingredient_count = len(known_proportions)
            total_known_proportion = sum(float(prop) for prop in known_proportions.values())
            remaining_proportion = max(0, 1.0 - total_known_proportion)
            unknown_ingredient_count = total_ingredients - known_ingredient_count
            
            features.extend([
                known_ingredient_count / total_ingredients,  # Ratio of known ingredients
                total_known_proportion,  # Total known proportion
                remaining_proportion,  # Remaining proportion for unknown
                remaining_proportion / max(1, unknown_ingredient_count),  # Average remaining per unknown
                1.0 if ingredient in known_proportions else 0.0,  # Is known ingredient
            ])
        else:
            features.extend([0.0, 0.0, 1.0, 1.0 / total_ingredients, 0.0])
        
        # Semantic features (first 8 dimensions instead of 10 to balance feature count)
        embedding = self.get_embedding(normalized_name)
        features.extend(embedding[:8].tolist())
        
        # Interaction features
        features.extend([
            confidence * (1.0 / (position + 1)),  # Confidence * inverse position
            typical_range[1] * np.exp(-position * 0.2),  # Max range * position decay
        ])
        
        return np.array(features)

    def predict_proportions_enhanced(self, ingredient_list: Union[str, List[str]], 
                               product_category: str = "Food",
                               known_proportions: Dict[str, str] = None) -> Dict[str, str]:
        """Enhanced proportion prediction with known proportions handling"""
        ingredients = self.parse_ingredient_list(ingredient_list)
        
        if not ingredients:
            return {}
        
        # Handle known proportions
        known_props = {}
        if known_proportions:
            for ing, prop in known_proportions.items():
                # Normalize ingredient names for matching
                normalized_known = self.normalize_ingredient_name(ing)
                for ingredient in ingredients:
                    normalized_ingredient = self.normalize_ingredient_name(ingredient)
                    if normalized_known in normalized_ingredient or normalized_ingredient in normalized_known:
                        known_props[ingredient] = float(prop)
                        break
        
        predictions = {}
        
        # First, set known proportions
        for ingredient in ingredients:
            if ingredient in known_props:
                predictions[ingredient] = known_props[ingredient]
        
        # Calculate remaining proportion for unknown ingredients
        total_known = sum(predictions.values())
        remaining_proportion = max(0, 1.0 - total_known)
        unknown_ingredients = [ing for ing in ingredients if ing not in predictions]
        
        if unknown_ingredients:
            if remaining_proportion <= 0:
                # If all proportions are known or exceed 1, normalize everything
                total_all = sum(predictions.values())
                predictions = {ing: prop / total_all for ing, prop in predictions.items()}
                remaining_proportion = 0
            else:
                # Predict proportions for unknown ingredients
                unknown_predictions = {}
                for ingredient in unknown_ingredients:
                    if self.is_trained:
                        # Use trained ML model
                        features = self.extract_advanced_features(ingredient, ingredients, product_category, known_props)
                        features_scaled = self.feature_scaler.transform([features])
                        proportion = self.proportion_predictor.predict(features_scaled)[0]
                    else:
                        # Use rule-based prediction
                        proportion = self._enhanced_rule_based_prediction(ingredient, ingredients, product_category)
                    
                    unknown_predictions[ingredient] = max(0.0001, proportion)
                
                # Normalize unknown predictions to fit remaining proportion
                total_unknown_raw = sum(unknown_predictions.values())
                if total_unknown_raw > 0:
                    scale_factor = remaining_proportion / total_unknown_raw
                    for ingredient, proportion in unknown_predictions.items():
                        predictions[ingredient] = proportion * scale_factor
        
        # Final validation and normalization
        total = sum(predictions.values())
        if total > 0 and abs(total - 1.0) > 0.001:  # Allow small tolerance
            predictions = {ing: prop / total for ing, prop in predictions.items()}
        
        # Format as strings with appropriate precision
        return {ing: f"{prop:.4f}" if prop < 0.01 else f"{prop:.3f}" 
                for ing, prop in predictions.items()}

    def _enhanced_rule_based_prediction(self, ingredient: str, all_ingredients: List[str], 
                                    product_category: str) -> float:
        """Enhanced rule-based proportion prediction with better logic"""
        category, confidence = self.categorize_ingredient(ingredient)
        
        # Get typical range for this category
        if category in self.ingredient_knowledge["categories"]:
            category_info = self.ingredient_knowledge["categories"][category]
            typical_range = category_info["typical_range"]
            function = category_info.get("primary_function", "unknown")
            
            # Adjust base proportion based on function
            if function in ["structure", "base"]:
                base_proportion = typical_range[1] * 0.8  # Lean towards higher end
            elif function in ["hydration", "solvent"]:
                base_proportion = (typical_range[0] + typical_range[1]) / 2
            elif function in ["flavor", "fragrance", "coloring"]:
                base_proportion = typical_range[0] * 1.5  # Lean towards lower end
            else:
                base_proportion = (typical_range[0] + typical_range[1]) / 2
        else:
            base_proportion = 0.05  # Default for unknown ingredients
        
        # Adjust based on position in ingredient list (more sophisticated)
        try:
            position = all_ingredients.index(ingredient)
            total_ingredients = len(all_ingredients)
            
            # Different position effects based on product category
            if product_category == "Bakery":
                # First few ingredients dominate in bakery
                position_factor = max(0.1, np.exp(-position * 0.4))
            elif product_category == "Personal Care":
                # More gradual decline in personal care
                position_factor = max(0.05, np.exp(-position * 0.2))
            else:
                # Standard decline
                position_factor = max(0.1, 1.0 - (position * 0.1))
            
            adjusted_proportion = base_proportion * position_factor
        except ValueError:
            adjusted_proportion = base_proportion * 0.5
        
        # Apply confidence weighting
        final_proportion = adjusted_proportion * confidence + 0.01 * (1 - confidence)
        
        # Category-specific adjustments
        if product_category == "Bakery" and category == "base_flour":
            final_proportion = min(0.7, max(0.4, final_proportion))
        elif product_category == "Personal Care" and category == "water":
            final_proportion = min(0.8, max(0.3, final_proportion))
        elif category == "preservatives":
            final_proportion = min(0.02, final_proportion)
        
        return final_proportion
    
    def extract_features(self, ingredient: str, ingredient_list: List[str], product_category: str) -> np.ndarray:
        """Updated to use the enhanced version"""
        return self.extract_advanced_features(ingredient, ingredient_list, product_category)

    # Replace the predict_proportions method in the main class  
    def predict_proportions(self, ingredient_list: Union[str, List[str]], 
                        product_category: str = "Food",
                        known_proportions: Dict[str, str] = None) -> Dict[str, str]:
        """Updated to use the enhanced version"""
        return self.predict_proportions_enhanced(ingredient_list, product_category, known_proportions)

    # Update the analyze_product method to handle known proportions
    def analyze_product(self, product_data: Dict) -> Dict[str, str]:
        """Enhanced analysis method with known proportions support"""
        ingredient_list = product_data.get('ingredient_list', [])
        category = product_data.get('category', 'Food')
        known_proportions = product_data.get('known_proportions', None)
        
        return self.predict_proportions_enhanced(ingredient_list, category, known_proportions)
    def train_model(self, training_data: List[Dict]) -> Dict:
        """Enhanced training with better feature extraction"""
        print("Training ingredient proportion prediction model...")
        
        X_features = []
        y_proportions = []
        
        for sample in training_data:
            ingredients = self.parse_ingredient_list(sample['ingredient_list'])
            proportions = sample['proportions']  # Dictionary of ingredient: proportion
            category = sample.get('category', 'Food')
            
            # Convert known proportions to the format expected by enhanced features
            known_props = {ing: float(prop) for ing, prop in proportions.items()}
            
            for ingredient in ingredients:
                if ingredient in proportions:
                    features = self.extract_advanced_features(ingredient, ingredients, category, known_props)
                    X_features.append(features)
                    y_proportions.append(float(proportions[ingredient]))
        
        X = np.array(X_features)
        y = np.array(y_proportions)
        
        print(f"Training data shape: X={X.shape}, y={y.shape}")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale features
        X_train_scaled = self.feature_scaler.fit_transform(X_train)
        X_test_scaled = self.feature_scaler.transform(X_test)
        
        # Train with better hyperparameters
        self.proportion_predictor = RandomForestRegressor(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42
        )
        
        self.proportion_predictor.fit(X_train_scaled, y_train)
        self.is_trained = True
        
        # Evaluate
        train_pred = self.proportion_predictor.predict(X_train_scaled)
        test_pred = self.proportion_predictor.predict(X_test_scaled)
        
        metrics = {
            "train_mae": mean_absolute_error(y_train, train_pred),
            "test_mae": mean_absolute_error(y_test, test_pred),
            "training_samples": len(X_train),
            "test_samples": len(X_test),
            "feature_count": X.shape[1]
        }
        
        print(f"Training completed. Test MAE: {metrics['test_mae']:.4f}")
        print(f"Feature count: {metrics['feature_count']}")
        return metrics
    
    def predict_proportions(self, ingredient_list: Union[str, List[str]], 
                          product_category: str = "Food") -> Dict[str, str]:
        """Predict ingredient proportions"""
        ingredients = self.parse_ingredient_list(ingredient_list)
        
        if not ingredients:
            return {}
        
        predictions = {}
        
        for ingredient in ingredients:
            if self.is_trained:
                # Use trained ML model
                features = self.extract_features(ingredient, ingredients, product_category)
                features_scaled = self.feature_scaler.transform([features])
                proportion = self.proportion_predictor.predict(features_scaled)[0]
            else:
                # Use rule-based prediction
                proportion = self._rule_based_prediction(ingredient, ingredients, product_category)
            
            # Ensure reasonable bounds
            proportion = max(0.0001, min(0.95, proportion))
            predictions[ingredient] = proportion
        
        # Normalize to sum to 1.0
        total = sum(predictions.values())
        if total > 0:
            predictions = {ing: prop / total for ing, prop in predictions.items()}
        
        # Format as strings with appropriate precision
        return {ing: f"{prop:.4f}" if prop < 0.01 else f"{prop:.3f}" 
                for ing, prop in predictions.items()}
    
    def _rule_based_prediction(self, ingredient: str, all_ingredients: List[str], 
                             product_category: str) -> float:
        """Rule-based proportion prediction fallback"""
        category, confidence = self.categorize_ingredient(ingredient)
        
        # Get typical range for this category
        if category in self.ingredient_knowledge["categories"]:
            typical_range = self.ingredient_knowledge["categories"][category]["typical_range"]
            base_proportion = (typical_range[0] + typical_range[1]) / 2
        else:
            base_proportion = 0.05  # Default for unknown ingredients
        
        # Adjust based on position in ingredient list
        try:
            position = all_ingredients.index(ingredient)
            # Earlier ingredients typically have higher proportions
            position_factor = max(0.1, 1.0 - (position * 0.08))
            adjusted_proportion = base_proportion * position_factor
        except ValueError:
            adjusted_proportion = base_proportion
        
        # Apply confidence weighting
        final_proportion = adjusted_proportion * confidence + 0.01 * (1 - confidence)
        
        return final_proportion
    
    def save_model(self, filepath: str):
        """Save trained model to disk"""
        model_data = {
            'proportion_predictor': self.proportion_predictor,
            'feature_scaler': self.feature_scaler,
            'is_trained': self.is_trained,
            'embedding_cache': self.embedding_cache
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath: str):
        """Load trained model from disk"""
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)
        
        self.proportion_predictor = model_data['proportion_predictor']
        self.feature_scaler = model_data['feature_scaler']
        self.is_trained = model_data['is_trained']
        self.embedding_cache = model_data.get('embedding_cache', {})
        print(f"Model loaded from {filepath}")
    
    def analyze_product(self, product_data: Dict) -> Dict[str, str]:
        """Main analysis method - matches your required interface"""
        ingredient_list = product_data.get('ingredient_list', [])
        category = product_data.get('category', 'Food')
        
        return self.predict_proportions(ingredient_list, category)

def create_comprehensive_training_data() -> List[Dict]:
    """Create comprehensive training data covering various product categories"""
    return [
        # BAKERY PRODUCTS
        {
            "ingredient_list": ["Chakki Atta", "Water", "Salt", "Yeast", "Vegetable Edible Oil", "Permitted Emulsifiers", "Class II Preservatives", "Improver"],
            "proportions": {
                "Chakki Atta": "0.620",
                "Water": "0.280",
                "Salt": "0.015",
                "Yeast": "0.008",
                "Vegetable Edible Oil": "0.025",
                "Permitted Emulsifiers": "0.005",
                "Class II Preservatives": "0.002",
                "Improver": "0.045"
            },
            "category": "Bakery"
        },
        {
            "ingredient_list": ["Refined Wheat Flour", "Water", "Sugar", "Vegetable Oil", "Salt", "Yeast", "Baking Powder", "Preservatives"],
            "proportions": {
                "Refined Wheat Flour": "0.550",
                "Water": "0.300",
                "Sugar": "0.080",
                "Vegetable Oil": "0.035",
                "Salt": "0.018",
                "Yeast": "0.012",
                "Baking Powder": "0.003",
                "Preservatives": "0.002"
            },
            "category": "Bakery"
        },
        {
            "ingredient_list": ["Whole Wheat Flour", "Water", "Honey", "Olive Oil", "Salt", "Active Dry Yeast"],
            "proportions": {
                "Whole Wheat Flour": "0.580",
                "Water": "0.320",
                "Honey": "0.050",
                "Olive Oil": "0.030",
                "Salt": "0.015",
                "Active Dry Yeast": "0.005"
            },
            "category": "Bakery"
        },
        {
            "ingredient_list": ["Maida", "Sugar", "Butter", "Eggs", "Baking Powder", "Vanilla Extract", "Salt"],
            "proportions": {
                "Maida": "0.450",
                "Sugar": "0.200",
                "Butter": "0.150",
                "Eggs": "0.120",
                "Baking Powder": "0.008",
                "Vanilla Extract": "0.015",
                "Salt": "0.007"
            },
            "category": "Bakery"
        },
        
        # PERSONAL CARE - SHAMPOOS
        {
            "ingredient_list": ["Water", "Sodium Laureth Sulfate", "Cocamidopropyl Betaine", "Glycerin", "Sodium Chloride", "Fragrance", "Preservatives", "Citric Acid"],
            "proportions": {
                "Water": "0.650",
                "Sodium Laureth Sulfate": "0.180",
                "Cocamidopropyl Betaine": "0.080",
                "Glycerin": "0.035",
                "Sodium Chloride": "0.025",
                "Fragrance": "0.015",
                "Preservatives": "0.010",
                "Citric Acid": "0.005"
            },
            "category": "Personal Care"
        },
        {
            "ingredient_list": ["Water", "Sodium Lauryl Sulfate", "Dimethiconol", "Guar Hydroxypropyltrimonium Chloride", "Sodium Benzoate", "Fragrance", "Colorants"],
            "proportions": {
                "Water": "0.720",
                "Sodium Lauryl Sulfate": "0.150",
                "Dimethiconol": "0.045",
                "Guar Hydroxypropyltrimonium Chloride": "0.030",
                "Sodium Benzoate": "0.020",
                "Fragrance": "0.025",
                "Colorants": "0.010"
            },
            "category": "Personal Care"
        },
        
        # PERSONAL CARE - LOTIONS/CREAMS
        {
            "ingredient_list": ["Water", "Glycerin", "Cetyl Alcohol", "Dimethicone", "Fragrance", "Preservatives", "Carbomer", "Sodium Hydroxide"],
            "proportions": {
                "Water": "0.600",
                "Glycerin": "0.150",
                "Cetyl Alcohol": "0.080",
                "Dimethicone": "0.060",
                "Fragrance": "0.020",
                "Preservatives": "0.015",
                "Carbomer": "0.010",
                "Sodium Hydroxide": "0.065"
            },
            "category": "Personal Care"
        },
        
        # BEVERAGES
        {
            "ingredient_list": ["Water", "Sugar", "Citric Acid", "Natural Flavors", "Sodium Benzoate", "Colorants"],
            "proportions": {
                "Water": "0.880",
                "Sugar": "0.090",
                "Citric Acid": "0.012",
                "Natural Flavors": "0.008",
                "Sodium Benzoate": "0.005",
                "Colorants": "0.005"
            },
            "category": "Beverages"
        },
        {
            "ingredient_list": ["Milk", "Sugar", "Cocoa Powder", "Vanilla Extract", "Salt", "Carrageenan"],
            "proportions": {
                "Milk": "0.820",
                "Sugar": "0.110",
                "Cocoa Powder": "0.040",
                "Vanilla Extract": "0.020",
                "Salt": "0.005",
                "Carrageenan": "0.005"
            },
            "category": "Beverages"
        },
        {
            "ingredient_list": ["Water", "High Fructose Corn Syrup", "Phosphoric Acid", "Natural Flavors", "Caffeine", "Caramel Color"],
            "proportions": {
                "Water": "0.890",
                "High Fructose Corn Syrup": "0.085",
                "Phosphoric Acid": "0.008",
                "Natural Flavors": "0.012",
                "Caffeine": "0.002",
                "Caramel Color": "0.003"
            },
            "category": "Beverages"
        },
        
        # FOOD PRODUCTS - SAUCES
        {
            "ingredient_list": ["Tomatoes", "Onions", "Garlic", "Olive Oil", "Salt", "Herbs", "Preservatives", "Sugar"],
            "proportions": {
                "Tomatoes": "0.550",
                "Onions": "0.180",
                "Garlic": "0.050",
                "Olive Oil": "0.080",
                "Salt": "0.025",
                "Herbs": "0.060",
                "Preservatives": "0.005",
                "Sugar": "0.050"
            },
            "category": "Food"
        },
        {
            "ingredient_list": ["Water", "Tomato Paste", "Vinegar", "Sugar", "Salt", "Spices", "Onion Powder", "Garlic Powder"],
            "proportions": {
                "Water": "0.420",
                "Tomato Paste": "0.280",
                "Vinegar": "0.120",
                "Sugar": "0.100",
                "Salt": "0.035",
                "Spices": "0.025",
                "Onion Powder": "0.012",
                "Garlic Powder": "0.008"
            },
            "category": "Food"
        },
        
        # FOOD PRODUCTS - DAIRY
        {
            "ingredient_list": ["Milk", "Bacterial Cultures", "Salt", "Enzymes"],
            "proportions": {
                "Milk": "0.965",
                "Bacterial Cultures": "0.020",
                "Salt": "0.012",
                "Enzymes": "0.003"
            },
            "category": "Food"
        },
        {
            "ingredient_list": ["Milk", "Sugar", "Cocoa", "Vanilla", "Carrageenan", "Artificial Flavors"],
            "proportions": {
                "Milk": "0.750",
                "Sugar": "0.150",
                "Cocoa": "0.060",
                "Vanilla": "0.025",
                "Carrageenan": "0.010",
                "Artificial Flavors": "0.005"
            },
            "category": "Food"
        },
        
        # SNACKS
        {
            "ingredient_list": ["Potato", "Vegetable Oil", "Salt", "Flavoring", "Antioxidants"],
            "proportions": {
                "Potato": "0.650",
                "Vegetable Oil": "0.300",
                "Salt": "0.025",
                "Flavoring": "0.020",
                "Antioxidants": "0.005"
            },
            "category": "Food"
        },
        {
            "ingredient_list": ["Corn", "Vegetable Oil", "Cheese Powder", "Salt", "Artificial Colors", "Natural Flavors"],
            "proportions": {
                "Corn": "0.580",
                "Vegetable Oil": "0.280",
                "Cheese Powder": "0.080",
                "Salt": "0.035",
                "Artificial Colors": "0.015",
                "Natural Flavors": "0.010"
            },
            "category": "Food"
        },
        
        # CEREALS
        {
            "ingredient_list": ["Wheat", "Sugar", "Salt", "Malt Extract", "Vitamins", "Iron"],
            "proportions": {
                "Wheat": "0.750",
                "Sugar": "0.150",
                "Salt": "0.035",
                "Malt Extract": "0.040",
                "Vitamins": "0.020",
                "Iron": "0.005"
            },
            "category": "Food"
        },
        {
            "ingredient_list": ["Oats", "Sugar", "Honey", "Almonds", "Sunflower Oil", "Natural Flavors", "Salt"],
            "proportions": {
                "Oats": "0.600",
                "Sugar": "0.120",
                "Honey": "0.080",
                "Almonds": "0.100",
                "Sunflower Oil": "0.070",
                "Natural Flavors": "0.025",
                "Salt": "0.005"
            },
            "category": "Food"
        },
        
        # SUPPLEMENTS
        {
            "ingredient_list": ["Whey Protein", "Cocoa Powder", "Natural Flavors", "Lecithin", "Stevia", "Salt"],
            "proportions": {
                "Whey Protein": "0.800",
                "Cocoa Powder": "0.120",
                "Natural Flavors": "0.035",
                "Lecithin": "0.025",
                "Stevia": "0.015",
                "Salt": "0.005"
            },
            "category": "Food"
        },
        
        # CLEANING PRODUCTS
        {
            "ingredient_list": ["Water", "Sodium Lauryl Sulfate", "Sodium Chloride", "Fragrance", "Colorants", "Preservatives"],
            "proportions": {
                "Water": "0.750",
                "Sodium Lauryl Sulfate": "0.200",
                "Sodium Chloride": "0.025",
                "Fragrance": "0.015",
                "Colorants": "0.005",
                "Preservatives": "0.005"
            },
            "category": "Personal Care"
        },
        
        # INDIAN SPECIFIC PRODUCTS
        {
            "ingredient_list": ["Chakki Atta", "Ghee", "Salt", "Carom Seeds", "Water"],
            "proportions": {
                "Chakki Atta": "0.680",
                "Ghee": "0.120",
                "Salt": "0.015",
                "Carom Seeds": "0.005",
                "Water": "0.180"
            },
            "category": "Food"
        },
        {
            "ingredient_list": ["Rice", "Water", "Salt", "Turmeric", "Oil"],
            "proportions": {
                "Rice": "0.400",
                "Water": "0.500",
                "Salt": "0.020",
                "Turmeric": "0.005",
                "Oil": "0.075"
            },
            "category": "Food"
        },
        {
            "ingredient_list": ["Coconut Oil", "Curry Leaves", "Hibiscus Extract", "Fenugreek", "Natural Fragrance"],
            "proportions": {
                "Coconut Oil": "0.850",
                "Curry Leaves": "0.080",
                "Hibiscus Extract": "0.040",
                "Fenugreek": "0.025",
                "Natural Fragrance": "0.005"
            },
            "category": "Personal Care"
        }
    ]



class EnhancedIngredientAPI:
    """Enhanced REST API wrapper for the ingredient expert"""
    
    def __init__(self, model_path: Optional[str] = None):
        self.expert = AdvancedIngredientExpert()
        
        if model_path and Path(model_path).exists():
            try:
                self.expert.load_model(model_path)
                print(f"Loaded pre-trained model from {model_path}")
            except Exception as e:
                print(f"Failed to load model from {model_path}: {e}")
                print("Training new model...")
                self._train_default_model()
        else:
            # Train on comprehensive data if no pre-trained model
            self._train_default_model()
    
    def _train_default_model(self):
        """Train model on comprehensive default data"""
        training_data = create_comprehensive_training_data()
        metrics = self.expert.train_model(training_data)
        print(f"Model trained successfully. Test MAE: {metrics['test_mae']:.4f}")
    
    def predict(self, request_data: Dict) -> Dict:
        """Enhanced API endpoint for ingredient proportion prediction"""
        try:
            # Validate input
            required_fields = ['ingredient_list']
            for field in required_fields:
                if field not in request_data:
                    return {"error": f"Missing required field: {field}", "success": False}
            
            # Validate ingredient list
            ingredient_list = request_data['ingredient_list']
            if not ingredient_list or (isinstance(ingredient_list, list) and len(ingredient_list) == 0):
                return {"error": "Ingredient list cannot be empty", "success": False}
            
            # Make prediction
            result = self.expert.analyze_product(request_data)
            
            # Additional validation
            if not result:
                return {"error": "Could not predict proportions", "success": False}
            
            # Calculate confidence metrics
            total_proportion = sum(float(prop) for prop in result.values())
            confidence_score = 1.0 - abs(1.0 - total_proportion)  # Closer to 1.0 = higher confidence
            
            return {
                "success": True,
                "predictions": result,
                "metadata": {
                    "model_trained": self.expert.is_trained,
                    "total_ingredients": len(result),
                    "category": request_data.get("category", "Unknown"),
                    "total_proportion": f"{total_proportion:.6f}",
                    "confidence_score": f"{confidence_score:.4f}",
                    "has_known_proportions": bool(request_data.get("known_proportions"))
                }
            }
            
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def retrain(self, training_data: List[Dict]) -> Dict:
        """Enhanced API endpoint for model retraining"""
        try:
            if not training_data or len(training_data) < 5:
                return {"error": "Need at least 5 training samples", "success": False}
            
            # Validate training data format
            for i, sample in enumerate(training_data):
                if 'ingredient_list' not in sample or 'proportions' not in sample:
                    return {"error": f"Sample {i} missing required fields", "success": False}
            
            metrics = self.expert.train_model(training_data)
            return {"success": True, "metrics": metrics}
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def get_model_info(self) -> Dict:
        """Get information about the current model"""
        return {
            "model_trained": self.expert.is_trained,
            "model_name": self.expert.model_name,
            "categories_supported": list(self.expert.ingredient_knowledge["categories"].keys()),
            "product_contexts": list(self.expert.ingredient_knowledge["product_contexts"].keys()),
            "embedding_cache_size": len(self.expert.embedding_cache)
        }

# Usage examples for different deployment scenarios
def flask_app_example():
    """Example Flask application setup"""
    flask_code = '''
from flask import Flask, request, jsonify
from advanced_ingredient_model import IngredientAPI

app = Flask(__name__)
ingredient_api = IngredientAPI()

@app.route('/predict', methods=['POST'])
def predict_ingredients():
    data = request.get_json()
    result = ingredient_api.predict(data)
    return jsonify(result)

@app.route('/retrain', methods=['POST'])
def retrain_model():
    training_data = request.get_json()
    result = ingredient_api.retrain(training_data)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
    '''
    return flask_code

def fastapi_example():
    """Example FastAPI application setup"""
    fastapi_code = '''
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Union
from advanced_ingredient_model import IngredientAPI

app = FastAPI(title="Ingredient Proportion Predictor")
ingredient_api = IngredientAPI()

class PredictionRequest(BaseModel):
    product_name: str
    ingredient_list: Union[str, List[str]]
    category: str = "Food"
    brand: str = ""
    weight: str = ""
    region: str = ""

class TrainingRequest(BaseModel):
    training_data: List[Dict]

@app.post("/predict")
async def predict_ingredients(request: PredictionRequest):
    return ingredient_api.predict(request.dict())

@app.post("/retrain")
async def retrain_model(request: TrainingRequest):
    return ingredient_api.retrain(request.training_data)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_trained": ingredient_api.expert.is_trained}
    '''
    return fastapi_code

