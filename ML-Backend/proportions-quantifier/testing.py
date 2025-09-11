
import json
import sys
from typing import Dict, List, Union, Optional
from pathlib import Path

class IngredientPredictor:
    """Simplified wrapper for ingredient proportion prediction"""
    
    def __init__(self, model_path: Optional[str] = None):
        """Initialize the predictor with optional pre-trained model"""
        from file1 import AdvancedIngredientExpert, create_comprehensive_training_data
        
        self.expert = AdvancedIngredientExpert()
        
        # Try to load pre-trained model or train a new one
        if model_path and Path(model_path).exists():
            try:
                self.expert.load_model(model_path)
                print(f"✓ Loaded pre-trained model from {model_path}")
            except Exception as e:
                print(f"✗ Failed to load model: {e}")
                print("Training new model...")
                self._train_model()
        else:
            print("Training new model with comprehensive data...")
            self._train_model()
    
    def _train_model(self):
        """Train the model with comprehensive training data"""
        from file1 import create_comprehensive_training_data
        
        training_data = create_comprehensive_training_data()
        metrics = self.expert.train_model(training_data)
        print(f"✓ Model trained successfully. Test MAE: {metrics['test_mae']:.4f}")
        
        # Save the trained model
        model_path = "trained_ingredient_model.pkl"
        self.expert.save_model(model_path)
        print(f"✓ Model saved to {model_path}")
    
    def predict_proportions(self, product_data: Dict) -> Dict:
        """
        Predict ingredient proportions for a product
        
        Args:
            product_data: Dictionary containing product information
                Required fields:
                - ingredient_list: List of ingredients or comma-separated string
                Optional fields:
                - category: Product category (default: "Food")
                - product_name: Name of the product
                - brand: Brand name
                - weight: Product weight
                - region: Geographic region
                - known_proportions: Dict of known ingredient proportions
        
        Returns:
            Dictionary mapping ingredients to their predicted proportions
        """
        try:
            # Validate input
            if 'ingredient_list' not in product_data:
                raise ValueError("Missing required field: ingredient_list")
            
            ingredient_list = product_data['ingredient_list']
            if not ingredient_list:
                raise ValueError("Ingredient list cannot be empty")
            
            # Set default category if not provided
            if 'category' not in product_data:
                product_data['category'] = "Food"
            
            # Make prediction using the expert system
            result = self.expert.analyze_product(product_data)
            
            if not result:
                raise ValueError("Could not predict proportions")
            
            return result
            
        except Exception as e:
            print(f"Error predicting proportions: {e}")
            return {}
    
    def predict_with_metadata(self, product_data: Dict) -> Dict:
        """
        Predict proportions and return additional metadata
        
        Returns:
            Dictionary with predictions and metadata
        """
        predictions = self.predict_proportions(product_data)
        
        if not predictions:
            return {"error": "Prediction failed", "success": False}
        
        # Calculate metadata
        total_proportion = sum(float(prop) for prop in predictions.values())
        confidence_score = 1.0 - abs(1.0 - total_proportion)
        
        return {
            "success": True,
            "product_info": {
                "name": product_data.get("product_name", "Unknown"),
                "brand": product_data.get("brand", "Unknown"),
                "weight": product_data.get("weight", "Unknown"),
                "category": product_data.get("category", "Food"),
                "region": product_data.get("region", "Unknown")
            },
            "predictions": predictions,
            "metadata": {
                "total_ingredients": len(predictions),
                "total_proportion": f"{total_proportion:.6f}",
                "confidence_score": f"{confidence_score:.4f}",
                "model_trained": self.expert.is_trained,
                "has_known_proportions": bool(product_data.get("known_proportions"))
            }
        }

def main():
    """Main function with example usage"""
    print("=== Ingredient Proportion Predictor ===\n")
    
    # Initialize predictor
    predictor = IngredientPredictor("trained_ingredient_model.pkl")
    
    # Example 1: Simple bread analysis
    print("Example 1: Whole Wheat Bread")
    bread_data = {
        "product_name": "Artisan Whole Wheat Bread",
        "brand": "Golden Bakery",
        "weight": "400g",
        "ingredient_list": [
            "Chakki Atta",
            "Water",
            "Salt", 
            "Yeast",
            "Vegetable Oil",
            "Emulsifiers",
            "Preservatives",
            "Improver"
        ],
        "category": "Bakery",
        "region": "India"
    }
    
    result1 = predictor.predict_with_metadata(bread_data)
    print(json.dumps(result1, indent=2))
    print("\n" + "="*50 + "\n")
    
    # Example 2: With known proportions
    print("Example 2: Bread with Known Proportions")
    bread_data_known = {
        "product_name": "Premium Bread",
        "ingredient_list": ["Flour", "Water", "Salt", "Yeast", "Oil", "Sugar"],
        "category": "Bakery",
        "known_proportions": {
            "Flour": "0.600",
            "Water": "0.300"
        }
    }
    
    result2 = predictor.predict_with_metadata(bread_data_known)
    print(json.dumps(result2, indent=2))
    print("\n" + "="*50 + "\n")
    
    # Example 3: Personal care product
    print("Example 3: Shampoo")
    shampoo_data = {
        "product_name": "Natural Hair Shampoo",
        "brand": "HairCare Pro",
        "weight": "250ml",
        "ingredient_list": "Water, Sodium Laureth Sulfate, Cocamidopropyl Betaine, Glycerin, Fragrance, Preservatives, Citric Acid",
        "category": "Personal Care"
    }
    
    result3 = predictor.predict_with_metadata(shampoo_data)
    print(json.dumps(result3, indent=2))
    print("\n" + "="*50 + "\n")
    
    # Example 4: Indian snack
    print("Example 4: Indian Snack")
    snack_data = {
        "product_name": "Masala Chips",
        "weight": "50g",
        "ingredient_list": [
            "Potato",
            "Palm Oil", 
            "Salt",
            "Red Chili Powder",
            "Turmeric",
            "Spices",
            "Citric Acid"
        ],
        "category": "Food",
        "region": "India"
    }
    
    result4 = predictor.predict_with_metadata(snack_data)
    print(json.dumps(result4, indent=2))

def predict_from_json_file(json_file_path: str, output_file: Optional[str] = None):
    """
    Predict proportions from a JSON file
    
    Args:
        json_file_path: Path to JSON file containing product data
        output_file: Optional output file path for results
    """
    try:
        with open(json_file_path, 'r') as f:
            product_data = json.load(f)
        
        predictor = IngredientPredictor()
        result = predictor.predict_with_metadata(product_data)
        
        if output_file:
            with open(output_file, 'w') as f:
                json.dump(result, f, indent=2)
            print(f"Results saved to {output_file}")
        else:
            print(json.dumps(result, indent=2))
            
    except Exception as e:
        print(f"Error processing file: {e}")

def predict_interactive():
    """Interactive mode for entering product data"""
    print("=== Interactive Ingredient Proportion Predictor ===")
    
    predictor = IngredientPredictor()
    
    while True:
        print("\nEnter product information:")
        
        product_name = input("Product name (optional): ").strip()
        brand = input("Brand (optional): ").strip()
        weight = input("Weight (optional): ").strip()
        category = input("Category (Food/Bakery/Personal Care/Beverages): ").strip() or "Food"
        
        print("Enter ingredients separated by commas:")
        ingredients_input = input("Ingredients: ").strip()
        
        if not ingredients_input:
            print("No ingredients provided. Exiting.")
            break
        
        # Parse ingredients
        ingredient_list = [ing.strip() for ing in ingredients_input.split(',')]
        
        # Ask for known proportions
        known_props = {}
        print("\nDo you have any known proportions? (y/n)")
        if input().lower() == 'y':
            print("Enter known proportions (ingredient:proportion), press Enter when done:")
            while True:
                prop_input = input("Proportion (e.g., 'Flour:0.6'): ").strip()
                if not prop_input:
                    break
                try:
                    ing, prop = prop_input.split(':')
                    known_props[ing.strip()] = prop.strip()
                except ValueError:
                    print("Invalid format. Use 'ingredient:proportion'")
        
        # Create product data
        product_data = {
            "product_name": product_name or "Unknown Product",
            "brand": brand,
            "weight": weight,
            "ingredient_list": ingredient_list,
            "category": category
        }
        
        if known_props:
            product_data["known_proportions"] = known_props
        
        # Make prediction
        result = predictor.predict_with_metadata(product_data)
        print("\n" + "="*50)
        print("PREDICTION RESULTS:")
        print("="*50)
        print(json.dumps(result, indent=2))
        
        print("\nAnalyze another product? (y/n)")
        if input().lower() != 'y':
            break

if __name__ == "__main__":
    main()