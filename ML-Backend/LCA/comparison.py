import pandas as pd
import numpy as np
import json
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import warnings
from datetime import datetime
import numpy as np
from typing import Dict, List, Tuple, Optional
import matplotlib.pyplot as plt
import seaborn as sns
import os
warnings.filterwarnings('ignore')

# Import your existing LCA model
from LCA.file1 import EnhancedLCAModel, LCAResult
EMISSION_PATH = os.path.join(os.path.dirname(__file__), "save.csv")

@dataclass
class ComparisonResult:
    """Structured comparison result between two products"""
    product1_name: str
    product2_name: str
    product1_result: LCAResult
    product2_result: LCAResult
    winner_analysis: Dict[str, str]
    improvement_recommendations: Dict[str, List[str]]
    sustainability_metrics: Dict[str, Dict[str, float]]
    detailed_comparison: Dict[str, Dict]
    green_qualities_analysis: Dict[str, Dict]
    environmental_impact_score: Dict[str, float]
def convert_numpy_types(obj):
    """Convert numpy types to Python native types for JSON serialization"""
    if isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, (np.integer, np.int64, np.int32, np.int16, np.int8)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32, np.float16)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(convert_numpy_types(item) for item in obj)
    else:
        return obj

class ProductComparisonLCA:
    """
    Enhanced Product Comparison LCA System for Indian Market
    Compares two products across multiple sustainability dimensions
    """

    def __init__(self, emission_csv_path: str = EMISSION_PATH):
        self.lca_model = EnhancedLCAModel(emission_csv_path)
        self.lca_model.initialize_models()
        
        # Comparison weights for different aspects
        self.sustainability_weights = {
            'carbon_footprint': 0.25,
            'eco_score': 0.20,
            'recyclability': 0.15,
            'ingredient_sustainability': 0.15,
            'packaging_sustainability': 0.10,
            'biodegradability': 0.10,
            'renewable_content': 0.05
        }
        self.comparison_weights = {
        'carbon_footprint': 0.30,
        'eco_score': 0.25,
        'recyclability': 0.20,
        'packaging': 0.15
        }
        self.green_quality_categories = {
            'organic_ingredients': ['organic', 'bio', 'natural', 'plant-based', 'certified organic', 'wildcrafted'],
            'sustainable_sourcing': ['fair trade', 'sustainable', 'responsibly sourced', 'ethically sourced', 'rainforest alliance'],
            'chemical_free': ['paraben-free', 'sulfate-free', 'chemical-free', 'non-toxic', 'phthalate-free', 'formaldehyde-free'],
            'eco_packaging': ['recyclable', 'biodegradable', 'compostable', 'refillable', 'minimal packaging', 'zero waste'],
            'renewable_ingredients': ['renewable', 'plant-derived', 'bio-based', 'upcycled', 'regenerative'],
            'cruelty_free': ['cruelty-free', 'not tested on animals', 'vegan', 'leaping bunny certified'],
            'water_conservation': ['water-free', 'waterless', 'concentrated', 'water-efficient'],
            'climate_positive': ['carbon-neutral', 'carbon-negative', 'climate-positive', 'tree-planted']
        }
        # Regional sustainability priorities
        self.regional_priorities = {
            'North': ['air_quality', 'water_conservation'],
            'South': ['renewable_energy', 'waste_management'],
            'West': ['industrial_efficiency', 'circular_economy'],
            'East': ['pollution_control', 'resource_efficiency'],
            'Central': ['sustainable_agriculture', 'clean_manufacturing'],
            'North-East': ['biodiversity', 'traditional_practices']
        }
    
    def _explain_carbon_advantage(self, result1: LCAResult, result2: LCAResult, 
                                product1_data: Dict, product2_data: Dict, winner: str) -> str:
        """Provide detailed explanation for carbon footprint advantage"""
        
        if winner == "product1":
            winner_result = result1
            loser_result = result2
            winner_data = product1_data
        else:
            winner_result = result2
            loser_result = result1
            winner_data = product2_data
        
        explanations = []
        
        # Analyze stage contributions
        winner_stages = winner_result.stage_breakdown
        loser_stages = loser_result.stage_breakdown
        
        # Find biggest advantages
        stage_advantages = {}
        for stage in winner_stages.keys():
            if loser_stages[stage] > winner_stages[stage]:
                advantage = ((loser_stages[stage] - winner_stages[stage]) / loser_stages[stage]) * 100
                stage_advantages[stage] = advantage
        
        # Get top 2 advantages
        top_advantages = sorted(stage_advantages.items(), key=lambda x: x[1], reverse=True)[:2]
        
        for stage, advantage in top_advantages:
            if stage == 'ingredients':
                explanations.append(f"More efficient ingredient sourcing reduces emissions by {advantage:.1f}%")
            elif stage == 'packaging':
                explanations.append(f"Sustainable packaging reduces emissions by {advantage:.1f}%")
            elif stage == 'manufacturing':
                explanations.append(f"Cleaner manufacturing processes reduce emissions by {advantage:.1f}%")
            elif stage == 'transportation':
                explanations.append(f"Optimized supply chain reduces transportation emissions by {advantage:.1f}%")
        
        return ". ".join(explanations) if explanations else "Better overall environmental efficiency"

    def _calculate_ingredient_eco_score(self, ingredient_list: str) -> float:
        """Enhanced eco-friendliness score calculation"""
        ingredients_lower = ingredient_list.lower()
        score = 0
        
        # Positive eco-friendly ingredients (expanded list)
        eco_positive = {
            # Organic & Natural
            'organic': 20, 'bio': 15, 'natural': 12, 'plant-based': 15,
            'wildcrafted': 18, 'certified organic': 25,
            
            # Sustainable sourcing
            'sustainable': 12, 'fair trade': 15, 'ethically sourced': 10,
            'rainforest alliance': 12, 'responsibly sourced': 8,
            
            # Renewable & Bio-based
            'renewable': 10, 'biodegradable': 12, 'bio-based': 10,
            'upcycled': 15, 'regenerative': 18,
            
            # Specific beneficial ingredients
            'aloe vera': 5, 'coconut oil': 4, 'jojoba oil': 5, 'argan oil': 6,
            'shea butter': 4, 'green tea': 3, 'chamomile': 3, 'lavender': 3,
            'rosehip oil': 5, 'vitamin e': 3, 'hyaluronic acid': 4,
            
            # Certifications
            'cruelty-free': 8, 'vegan': 6, 'leaping bunny': 10,
            'ecocert': 12, 'cosmos': 10, 'usda organic': 15
        }
        
        # Negative environmental impact ingredients (expanded)
        eco_negative = {
            # Petrochemicals
            'petroleum': -20, 'mineral oil': -12, 'petrolatum': -15,
            'paraffin': -10, 'microplastics': -25,
            
            # Harmful chemicals
            'paraben': -10, 'sulfate': -10, 'silicone': -6,
            'phthalate': -15, 'formaldehyde': -18, 'triclosan': -12,
            'bpa': -20, 'dioxane': -15,
            
            # Synthetic additives
            'artificial color': -6, 'synthetic fragrance': -8,
            'artificial fragrance': -8, 'synthetic dye': -6,
            
            # Environmental pollutants
            'microbeads': -25, 'palm oil': -8, 'unsustainable palm oil': -15
        }
        
        # Calculate scores
        for ingredient, points in eco_positive.items():
            if ingredient in ingredients_lower:
                score += points
        
        for ingredient, points in eco_negative.items():
            if ingredient in ingredients_lower:
                score += points
        
        return max(0, score)

    def _evaluate_packaging_sustainability(self, result: LCAResult) -> float:
        """Enhanced packaging sustainability evaluation"""
        
        # Updated material scores with more nuanced scoring
        material_scores = {
            'Glass': 95, 'Aluminum': 90, 'Paper/Cardboard': 85,
            'Bamboo': 92, 'Cork': 88, 'Wood': 80,
            'PET': 65, 'HDPE': 60, 'PP': 55, 
            'LDPE': 35, 'ABS': 25, 'PVC': 15
        }
        
        base_score = material_scores.get(result.plastic_type_info['plastic_type'], 40)
        
        # Enhanced recyclability scoring
        if result.is_recyclable:
            recycling_boost = result.recyclability_details['effective_recycling_rate'] * 30
            base_score += recycling_boost
        
        # Packaging emissions impact
        if result.packaging_emissions < 0.05:
            base_score += 15  # Very low packaging emissions
        elif result.packaging_emissions < 0.1:
            base_score += 10  # Low packaging emissions
        
        # Additional sustainability factors
        if result.plastic_type_info['plastic_type'] in ['Glass', 'Aluminum', 'Paper/Cardboard']:
            base_score += 5  # Infinitely recyclable materials bonus
            
        return min(100, base_score)

    def _explain_packaging_advantage(self, result1: LCAResult, result2: LCAResult, winner: str) -> str:
        """Explain why one product has better packaging"""
        
        if winner == "product1":
            winner_result = result1
            loser_result = result2
        else:
            winner_result = result2
            loser_result = result1
        
        explanations = []
        
        # Material advantage
        winner_material = winner_result.plastic_type_info['plastic_type']
        loser_material = loser_result.plastic_type_info['plastic_type']
        
        sustainable_materials = ['Glass', 'Aluminum', 'Paper/Cardboard']
        if winner_material in sustainable_materials and loser_material not in sustainable_materials:
            explanations.append(f"{winner_material} is more sustainable than {loser_material}")
        
        # Recyclability advantage
        if winner_result.is_recyclable and not loser_result.is_recyclable:
            explanations.append("Fully recyclable packaging vs non-recyclable")
        elif winner_result.is_recyclable and loser_result.is_recyclable:
            winner_rate = winner_result.recyclability_details['effective_recycling_rate']
            loser_rate = loser_result.recyclability_details['effective_recycling_rate']
            if winner_rate > loser_rate:
                explanations.append(f"Higher recycling effectiveness ({winner_rate:.1%} vs {loser_rate:.1%})")
        
        # Emissions advantage
        if winner_result.packaging_emissions < loser_result.packaging_emissions:
            reduction = ((loser_result.packaging_emissions - winner_result.packaging_emissions) / loser_result.packaging_emissions) * 100
            explanations.append(f"{reduction:.1f}% lower packaging emissions")
        
        return ". ".join(explanations) if explanations else "Better overall packaging sustainability"
    def _calculate_biodegradability_score(self, ingredient_list: str) -> float:
        """Calculate biodegradability score of ingredients"""
        ingredients_lower = ingredient_list.lower()
        
        biodegradable_keywords = [
            'plant-based', 'natural', 'organic', 'biodegradable',
            'coconut', 'palm', 'soy', 'corn', 'sugar', 'starch',
            'cellulose', 'algae', 'seaweed'
        ]
        
        non_biodegradable = [
            'silicone', 'plastic', 'synthetic', 'petroleum',
            'mineral oil', 'microplastic', 'polymer'
        ]
        
        score = 50  # Base score
        
        for keyword in biodegradable_keywords:
            if keyword in ingredients_lower:
                score += 8
                
        for keyword in non_biodegradable:
            if keyword in ingredients_lower:
                score -= 12
                
        return max(0, min(100, score))
    def _calculate_renewable_content_score(self, ingredient_list: str) -> float:
        """Calculate renewable content score"""
        ingredients_lower = ingredient_list.lower()
        
        renewable_keywords = [
            'plant-derived', 'bio-based', 'renewable', 'sustainable',
            'organic', 'natural', 'botanical', 'herbal',
            'fruit extract', 'seed oil', 'essential oil'
        ]
        
        non_renewable = [
            'petroleum', 'mineral oil', 'synthetic', 'artificial',
            'chemical', 'lab-made'
        ]
        
        score = 40  # Base score
        
        for keyword in renewable_keywords:
            if keyword in ingredients_lower:
                score += 10
                
        for keyword in non_renewable:
            if keyword in ingredients_lower:
                score -= 8
                
        return max(0, min(100, score))
    def _calculate_comprehensive_environmental_score(self, result: LCAResult, product_data: Dict) -> float:
        """Enhanced comprehensive environmental impact score"""
        
        # Carbon efficiency score
        max_emissions = 5.0
        carbon_score = max(0, (max_emissions - result.total_emissions) / max_emissions * 100)
        
        # Eco score (direct use)
        eco_score = result.eco_score
        
        # Enhanced recyclability score
        recyclability_score = 100 if result.is_recyclable else 15
        if result.is_recyclable:
            recyclability_score *= result.recyclability_details['effective_recycling_rate']
        
        # Ingredient sustainability score
        ingredient_score = self._calculate_ingredient_eco_score(product_data['ingredient_list'])
        ingredient_normalized = min(100, ingredient_score * 2)  # Normalize to 0-100
        
        # Packaging sustainability score
        packaging_score = self._evaluate_packaging_sustainability(result)
        
        # Biodegradability score
        biodegradability_score = self._calculate_biodegradability_score(product_data['ingredient_list'])
        
        # Renewable content score
        renewable_score = self._calculate_renewable_content_score(product_data['ingredient_list'])
        
        # Weighted environmental score
        environmental_score = (
            carbon_score * self.sustainability_weights['carbon_footprint'] +
            eco_score * self.sustainability_weights['eco_score'] +
            recyclability_score * self.sustainability_weights['recyclability'] +
            ingredient_normalized * self.sustainability_weights['ingredient_sustainability'] +
            packaging_score * self.sustainability_weights['packaging_sustainability'] +
            biodegradability_score * self.sustainability_weights['biodegradability'] +
            renewable_score * self.sustainability_weights['renewable_content']
        )
        
        return min(100, max(0, environmental_score))


    def _explain_overall_environmental_advantage(self, result1: LCAResult, result2: LCAResult,
                                               product1_data: Dict, product2_data: Dict, winner: str) -> str:
        """Provide comprehensive explanation of environmental advantage"""
        
        if winner == "product1":
            winner_result = result1
            winner_data = product1_data
            loser_result = result2
        else:
            winner_result = result2
            winner_data = product2_data
            loser_result = result1
        
        advantages = []
        
        # Carbon advantage
        if winner_result.total_emissions < loser_result.total_emissions:
            carbon_improvement = ((loser_result.total_emissions - winner_result.total_emissions) / loser_result.total_emissions) * 100
            advantages.append(f"Lower carbon footprint by {carbon_improvement:.1f}%")
        
        # Eco score advantage
        if winner_result.eco_score > loser_result.eco_score:
            eco_improvement = winner_result.eco_score - loser_result.eco_score
            advantages.append(f"Higher eco-score by {eco_improvement:.1f} points")
        
        # Recyclability advantage
        if winner_result.is_recyclable and not loser_result.is_recyclable:
            advantages.append("Fully recyclable packaging")
        
        # Ingredient advantage
        winner_ingredient_score = self._calculate_ingredient_eco_score(winner_data['ingredient_list'])
        loser_ingredient_score = self._calculate_ingredient_eco_score(product1_data['ingredient_list'] if winner == "product2" else product2_data['ingredient_list'])
        
        if winner_ingredient_score > loser_ingredient_score:
            advantages.append("More sustainable ingredient formulation")
        
        return ". ".join(advantages[:3]) if advantages else "Better overall environmental performance"


    def _analyze_sustainability_winners(self, result1: LCAResult, result2: LCAResult, 
                                      product1_data: Dict, product2_data: Dict) -> Dict[str, str]:
        """Analyze sustainability winners with detailed explanations"""
        
        winners = {}
        
        # Carbon footprint analysis with explanation
        if result1.total_emissions < result2.total_emissions:
            improvement = ((result2.total_emissions - result1.total_emissions) / result2.total_emissions) * 100
            carbon_explanation = self._explain_carbon_advantage(result1, result2, product1_data, product2_data, "product1")
            winners['carbon_footprint'] = f"🌍 {product1_data['product_name']} has {improvement:.1f}% lower carbon emissions ({result1.total_emissions:.3f} vs {result2.total_emissions:.3f} kg CO2e). {carbon_explanation}"
        elif result2.total_emissions < result1.total_emissions:
            improvement = ((result1.total_emissions - result2.total_emissions) / result1.total_emissions) * 100
            carbon_explanation = self._explain_carbon_advantage(result1, result2, product1_data, product2_data, "product2")
            winners['carbon_footprint'] = f"🌍 {product2_data['product_name']} has {improvement:.1f}% lower carbon emissions ({result2.total_emissions:.3f} vs {result1.total_emissions:.3f} kg CO2e). {carbon_explanation}"
        
        # Eco-friendly ingredients analysis
        ingredient_score1 = self._calculate_ingredient_eco_score(product1_data['ingredient_list'])
        ingredient_score2 = self._calculate_ingredient_eco_score(product2_data['ingredient_list'])
        
        if ingredient_score1 > ingredient_score2:
            winners['eco_ingredients'] = f"🌿 {product1_data['product_name']} has more eco-friendly ingredients (score: {ingredient_score1:.1f} vs {ingredient_score2:.1f}). Contains more natural, organic, and sustainable ingredients."
        elif ingredient_score2 > ingredient_score1:
            winners['eco_ingredients'] = f"🌿 {product2_data['product_name']} has more eco-friendly ingredients (score: {ingredient_score2:.1f} vs {ingredient_score1:.1f}). Contains more natural, organic, and sustainable ingredients."
        
        # Packaging sustainability with detailed analysis
        packaging_sustainability1 = self._evaluate_packaging_sustainability(result1)
        packaging_sustainability2 = self._evaluate_packaging_sustainability(result2)
        
        if packaging_sustainability1 > packaging_sustainability2:
            packaging_explanation = self._explain_packaging_advantage(result1, result2, "product1")
            winners['packaging_sustainability'] = f"📦 {product1_data['product_name']} has more sustainable packaging. {packaging_explanation}"
        elif packaging_sustainability2 > packaging_sustainability1:
            packaging_explanation = self._explain_packaging_advantage(result1, result2, "product2")
            winners['packaging_sustainability'] = f"📦 {product2_data['product_name']} has more sustainable packaging. {packaging_explanation}"
        
        # Overall environmental impact
        env_score1 = self._calculate_comprehensive_environmental_score(result1, product1_data)
        env_score2 = self._calculate_comprehensive_environmental_score(result2, product2_data)
        
        if env_score1 > env_score2:
            score_diff = env_score1 - env_score2
            overall_explanation = self._explain_overall_environmental_advantage(result1, result2, product1_data, product2_data, "product1")
            winners['overall_environmental_impact'] = f"🏆 {product1_data['product_name']} is more environmentally sustainable (Environmental Score: {env_score1:.1f} vs {env_score2:.1f}). {overall_explanation}"
        elif env_score2 > env_score1:
            score_diff = env_score2 - env_score1
            overall_explanation = self._explain_overall_environmental_advantage(result1, result2, product1_data, product2_data, "product2")
            winners['overall_environmental_impact'] = f"🏆 {product2_data['product_name']} is more environmentally sustainable (Environmental Score: {env_score2:.1f} vs {env_score1:.1f}). {overall_explanation}"
        
        return winners
    def _extract_green_qualities(self, product_data: Dict) -> Dict[str, int]:
        """Enhanced green quality extraction"""
        ingredient_list = product_data['ingredient_list'].lower()
        packaging_type = product_data.get('packaging_type', '').lower()
        
        qualities = {}
        
        for category, keywords in self.green_quality_categories.items():
            score = 0
            for keyword in keywords:
                if keyword in ingredient_list:
                    score += 1
                # Also check packaging for relevant categories
                if category == 'eco_packaging' and keyword in packaging_type:
                    score += 1
            qualities[category] = score
        
        return qualities
    def _analyze_green_qualities(self, result1: LCAResult, result2: LCAResult,
                               product1_data: Dict, product2_data: Dict) -> Dict[str, Dict]:
        """Detailed analysis of green qualities"""
        
        analysis = {
            'product1_green_qualities': self._extract_green_qualities(product1_data),
            'product2_green_qualities': self._extract_green_qualities(product2_data),
            'green_quality_comparison': {}
        }
        
        # Compare each green quality category
        for category in self.green_quality_categories.keys():
            p1_score = analysis['product1_green_qualities'].get(category, 0)
            p2_score = analysis['product2_green_qualities'].get(category, 0)
            
            if p1_score > p2_score:
                winner = 'product1'
                advantage = p1_score - p2_score
            elif p2_score > p1_score:
                winner = 'product2' 
                advantage = p2_score - p1_score
            else:
                winner = 'tie'
                advantage = 0
            
            analysis['green_quality_comparison'][category] = {
                'winner': winner,
                'advantage_score': advantage,
                'product1_score': p1_score,
                'product2_score': p2_score
            }
        
        return analysis
    def _calculate_environmental_impact_scores(self, result1: LCAResult, result2: LCAResult,
                                             product1_data: Dict, product2_data: Dict) -> Dict[str, float]:
        """Calculate detailed environmental impact scores"""
        
        return {
            'product1_environmental_score': self._calculate_comprehensive_environmental_score(result1, product1_data),
            'product2_environmental_score': self._calculate_comprehensive_environmental_score(result2, product2_data),
            'carbon_footprint_difference': abs(result1.total_emissions - result2.total_emissions),
            'eco_score_difference': abs(result1.eco_score - result2.eco_score),
            'sustainability_gap': abs(
                self._calculate_comprehensive_environmental_score(result1, product1_data) -
                self._calculate_comprehensive_environmental_score(result2, product2_data)
            )
        }
    
    def generate_sustainability_report(self, comparison_result: ComparisonResult) -> str:
        """Generate comprehensive sustainability-focused report"""
        
        report = f"""
# 🌍 COMPREHENSIVE SUSTAINABILITY COMPARISON REPORT
## Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

---

## 🌱 EXECUTIVE SUSTAINABILITY SUMMARY

### Products Analyzed:
- **Product 1**: {comparison_result.product1_name}
- **Product 2**: {comparison_result.product2_name}

### Environmental Impact Scores:
- **{comparison_result.product1_name}**: {comparison_result.environmental_impact_score['product1_environmental_score']:.1f}/100
- **{comparison_result.product2_name}**: {comparison_result.environmental_impact_score['product2_environmental_score']:.1f}/100

### Key Sustainability Findings:
"""
        
        for category, winner_info in comparison_result.winner_analysis.items():
            report += f"- **{category.replace('_', ' ').title()}**: {winner_info}\n"
        
        report += f"""

---

## 🏆 DETAILED SUSTAINABILITY ANALYSIS

### Carbon Footprint Impact
- **{comparison_result.product1_name}**: {comparison_result.product1_result.total_emissions:.4f} kg CO2e
- **{comparison_result.product2_name}**: {comparison_result.product2_result.total_emissions:.4f} kg CO2e
- **Environmental Benefit**: {comparison_result.environmental_impact_score['carbon_footprint_difference']:.4f} kg CO2e difference

### Eco-Friendliness Scores
- **{comparison_result.product1_name}**: {comparison_result.product1_result.eco_score:.1f}/100
- **{comparison_result.product2_name}**: {comparison_result.product2_result.eco_score:.1f}/100

### Packaging Sustainability
- **{comparison_result.product1_name}**: {comparison_result.product1_result.plastic_type_info['plastic_type']} 
  ({'♻️ Recyclable' if comparison_result.product1_result.is_recyclable else '❌ Non-recyclable'})
- **{comparison_result.product2_name}**: {comparison_result.product2_result.plastic_type_info['plastic_type']} 
  ({'♻️ Recyclable' if comparison_result.product2_result.is_recyclable else '❌ Non-recyclable'})

---

## 🌿 GREEN QUALITIES ANALYSIS

### {comparison_result.product1_name}
"""
        
        p1_qualities = comparison_result.green_qualities_analysis['product1_green_qualities']
        for quality, score in p1_qualities.items():
            if score > 0:
                report += f"- **{quality.replace('_', ' ').title()}**: {score} eco-friendly attributes\n"
        
        report += f"\n### {comparison_result.product2_name}\n"
        
        p2_qualities = comparison_result.green_qualities_analysis['product2_green_qualities']
        for quality, score in p2_qualities.items():
            if score > 0:
                report += f"- **{quality.replace('_', ' ').title()}**: {score} eco-friendly attributes\n"
        
        report += f"""

---

## 🎯 SUSTAINABILITY IMPROVEMENT RECOMMENDATIONS

"""
        
        for product_name, recommendations in comparison_result.improvement_recommendations.items():
            report += f"### {product_name}\n"
            for rec in recommendations:
                report += f"- {rec}\n"
            report += "\n"
        
        report += f"""
---

## 📊 ENVIRONMENTAL IMPACT BREAKDOWN

"""
        
        for stage, data in comparison_result.detailed_comparison.items():
            report += f"### {stage.replace('_', ' ').title()}\n"
            report += f"- **{comparison_result.product1_name}**: {data['product1_emission']:.6f} kg CO2e ({data['product1_percentage']:.1f}%)\n"
            report += f"- **{comparison_result.product2_name}**: {data['product2_emission']:.6f} kg CO2e ({data['product2_percentage']:.1f}%)\n"
            if data['winner'] != 'Tie':
                report += f"- **Environmental Advantage**: {data['winner']} by {data['improvement_percentage']:.1f}%\n"
            report += "\n"
        
        report += f"""
---

## ✅ SUSTAINABILITY CONCLUSIONS

🏆 **Overall Environmental Winner**: The product with higher environmental score demonstrates superior sustainability through:

1. **Lower Carbon Impact**: Reduced greenhouse gas emissions across lifecycle stages
2. **Eco-Friendly Formulation**: Higher percentage of natural, organic, and sustainable ingredients
3. **Sustainable Packaging**: More recyclable and environmentally responsible packaging choices
4. **Green Manufacturing**: Cleaner production processes with lower environmental impact

**Sustainability Gap**: {comparison_result.environmental_impact_score['sustainability_gap']:.1f} points difference in overall environmental performance.

---
*This report focuses exclusively on environmental sustainability and green qualities assessment*
"""
        
        return report
    def _generate_eco_improvements(self, result1: LCAResult, result2: LCAResult,
                             product1_data: Dict, product2_data: Dict) -> Dict[str, List[str]]:
        """Generate eco-focused improvement recommendations"""
        return self._generate_improvement_recommendations(result1, result2, product1_data, product2_data)

    def _calculate_green_metrics(self, result1: LCAResult, result2: LCAResult,
                            product1_data: Dict, product2_data: Dict) -> Dict[str, Dict[str, float]]:
        """Calculate green/sustainability metrics"""
        return self._calculate_sustainability_metrics(result1, result2, product1_data, product2_data)

    def _create_environmental_comparison(self, result1: LCAResult, result2: LCAResult,
                                    product1_data: Dict, product2_data: Dict) -> Dict[str, Dict]:
        """Create environmental comparison breakdown"""
        return self._create_detailed_comparison(result1, result2, product1_data, product2_data)

    def compare_products(self, product1_data: Dict, product2_data: Dict) -> ComparisonResult:
        """Main comparison function focusing on sustainability"""
        print(f"🌱 Starting sustainability-focused comparison...")
        
        # Calculate LCA for both products
        result1 = self.lca_model.calculate_comprehensive_lca(product1_data)
        result2 = self.lca_model.calculate_comprehensive_lca(product2_data)
        
        # Perform detailed sustainability analysis
        winner_analysis = self._analyze_sustainability_winners(result1, result2, product1_data, product2_data)
        improvement_recommendations = self._generate_improvement_recommendations(result1, result2, product1_data, product2_data)
        sustainability_metrics = self._calculate_sustainability_metrics(result1, result2, product1_data, product2_data)
        detailed_comparison = self._create_detailed_comparison(result1, result2, product1_data, product2_data)
        green_qualities = self._analyze_green_qualities(result1, result2, product1_data, product2_data)
        environmental_scores = self._calculate_environmental_impact_scores(result1, result2, product1_data, product2_data)
        
        return ComparisonResult(
            product1_name=f"{product1_data['product_name']} ({product1_data['brand']})",
            product2_name=f"{product2_data['product_name']} ({product2_data['brand']})",
            product1_result=result1,
            product2_result=result2,
            winner_analysis=winner_analysis,
            improvement_recommendations=improvement_recommendations,
            sustainability_metrics=sustainability_metrics,
            detailed_comparison=detailed_comparison,
            green_qualities_analysis=green_qualities,
            environmental_impact_score=environmental_scores,
        )
    
    def _analyze_winners(self, result1: LCAResult, result2: LCAResult, 
                        product1_data: Dict, product2_data: Dict) -> Dict[str, str]:
        """Analyze which product wins in different categories"""
        
        winners = {}
        
        # Carbon footprint comparison
        if result1.total_emissions < result2.total_emissions:
            improvement = ((result2.total_emissions - result1.total_emissions) / result2.total_emissions) * 100
            winners['carbon_footprint'] = f"🏆 {product1_data['product_name']} wins with {improvement:.1f}% lower emissions ({result1.total_emissions:.3f} vs {result2.total_emissions:.3f} kg CO2e)"
        elif result2.total_emissions < result1.total_emissions:
            improvement = ((result1.total_emissions - result2.total_emissions) / result1.total_emissions) * 100
            winners['carbon_footprint'] = f"🏆 {product2_data['product_name']} wins with {improvement:.1f}% lower emissions ({result2.total_emissions:.3f} vs {result1.total_emissions:.3f} kg CO2e)"
        else:
            winners['carbon_footprint'] = "🤝 Tie - Both products have similar carbon footprints"
        
        # Eco score comparison
        if result1.eco_score > result2.eco_score:
            improvement = result1.eco_score - result2.eco_score
            winners['eco_score'] = f"🏆 {product1_data['product_name']} wins with {improvement:.1f} points higher eco-score ({result1.eco_score:.1f} vs {result2.eco_score:.1f})"
        elif result2.eco_score > result1.eco_score:
            improvement = result2.eco_score - result1.eco_score
            winners['eco_score'] = f"🏆 {product2_data['product_name']} wins with {improvement:.1f} points higher eco-score ({result2.eco_score:.1f} vs {result1.eco_score:.1f})"
        else:
            winners['eco_score'] = "🤝 Tie - Both products have similar eco-scores"
        
        # Recyclability comparison
        if result1.is_recyclable and not result2.is_recyclable:
            winners['recyclability'] = f"🏆 {product1_data['product_name']} wins - Recyclable packaging vs Non-recyclable"
        elif result2.is_recyclable and not result1.is_recyclable:
            winners['recyclability'] = f"🏆 {product2_data['product_name']} wins - Recyclable packaging vs Non-recyclable"
        elif result1.is_recyclable and result2.is_recyclable:
            rate1 = result1.recyclability_details['effective_recycling_rate']
            rate2 = result2.recyclability_details['effective_recycling_rate']
            if rate1 > rate2:
                winners['recyclability'] = f"🏆 {product1_data['product_name']} wins - Higher effective recycling rate ({rate1:.1%} vs {rate2:.1%})"
            elif rate2 > rate1:
                winners['recyclability'] = f"🏆 {product2_data['product_name']} wins - Higher effective recycling rate ({rate2:.1%} vs {rate1:.1%})"
            else:
                winners['recyclability'] = "🤝 Tie - Both products are equally recyclable"
        else:
            winners['recyclability'] = "❌ Both products have poor recyclability"
        
        # Packaging analysis
        plastic1 = result1.plastic_type_info['plastic_type']
        plastic2 = result2.plastic_type_info['plastic_type']
        sustainable_materials = ['Glass', 'Aluminum', 'Paper/Cardboard']
        
        if plastic1 in sustainable_materials and plastic2 not in sustainable_materials:
            winners['packaging'] = f"🏆 {product1_data['product_name']} wins - More sustainable packaging material ({plastic1} vs {plastic2})"
        elif plastic2 in sustainable_materials and plastic1 not in sustainable_materials:
            winners['packaging'] = f"🏆 {product2_data['product_name']} wins - More sustainable packaging material ({plastic2} vs {plastic1})"
        elif result1.packaging_emissions < result2.packaging_emissions:
            improvement = ((result2.packaging_emissions - result1.packaging_emissions) / result2.packaging_emissions) * 100
            winners['packaging'] = f"🏆 {product1_data['product_name']} wins - {improvement:.1f}% lower packaging emissions"
        elif result2.packaging_emissions < result1.packaging_emissions:
            improvement = ((result1.packaging_emissions - result2.packaging_emissions) / result1.packaging_emissions) * 100
            winners['packaging'] = f"🏆 {product2_data['product_name']} wins - {improvement:.1f}% lower packaging emissions"
        else:
            winners['packaging'] = "🤝 Tie - Similar packaging impact"
        
        # Overall sustainability winner
        score1 = self._calculate_overall_sustainability_score(result1, product1_data)
        score2 = self._calculate_overall_sustainability_score(result2, product2_data)
        
        if score1 > score2:
            winners['overall'] = f"🏆 Overall Winner: {product1_data['product_name']} (Sustainability Score: {score1:.1f} vs {score2:.1f})"
        elif score2 > score1:
            winners['overall'] = f"🏆 Overall Winner: {product2_data['product_name']} (Sustainability Score: {score2:.1f} vs {score1:.1f})"
        else:
            winners['overall'] = "🤝 Overall Tie - Both products are equally sustainable"
        
        return winners
    
    def _calculate_overall_sustainability_score(self, result: LCAResult, product_data: Dict) -> float:
        """Calculate comprehensive sustainability score"""
        
        # Normalize carbon footprint (lower is better, scale 0-100)
        max_expected_emissions = 5.0  # kg CO2e
        carbon_score = max(0, (max_expected_emissions - result.total_emissions) / max_expected_emissions * 100)
        
        # Eco score (already 0-100)
        eco_score = result.eco_score
        
        # Recyclability score
        recyclability_score = 100 if result.is_recyclable else 20
        if result.is_recyclable:
            recyclability_score *= result.recyclability_details['effective_recycling_rate'] * 2
        
        # Packaging sustainability score
        sustainable_materials = {'Glass': 90, 'Aluminum': 85, 'Paper/Cardboard': 80, 
                               'PET': 60, 'HDPE': 55, 'PP': 50, 'LDPE': 30, 'ABS': 20}
        packaging_score = sustainable_materials.get(result.plastic_type_info['plastic_type'], 40)
        
        # Weighted overall score
        overall_score = (
            carbon_score * self.comparison_weights['carbon_footprint'] +
            eco_score * self.comparison_weights['eco_score'] +
            recyclability_score * self.comparison_weights['recyclability'] +
            packaging_score * 0.3  # Additional packaging weight
        ) / (sum(self.comparison_weights.values()) + 0.3)
        
        return min(100, max(0, overall_score))
    
    def _generate_improvement_recommendations(self, result1: LCAResult, result2: LCAResult,
                                            product1_data: Dict, product2_data: Dict) -> Dict[str, List[str]]:
        """Generate improvement recommendations for both products"""
        
        recommendations = {
            product1_data['product_name']: [],
            product2_data['product_name']: []
        }
        
        # Analyze each product for improvements
        for result, product_data, product_name in [
            (result1, product1_data, product1_data['product_name']),
            (result2, product2_data, product2_data['product_name'])
        ]:
            product_recommendations = []
            
            # Carbon footprint improvements
            if result.total_emissions > 2.0:
                product_recommendations.append("🎯 High carbon footprint - Consider ingredient optimization and local sourcing")
            
            # Packaging improvements
            if not result.is_recyclable:
                product_recommendations.append("♻️ Switch to recyclable packaging materials (PET, Glass, or Aluminum)")
            
            plastic_type = result.plastic_type_info['plastic_type']
            if plastic_type in ['LDPE', 'ABS']:
                product_recommendations.append(f"📦 Replace {plastic_type} with more sustainable alternatives (PP, PET, or Glass)")
            
            # Ingredient improvements
            highest_emission_ingredients = sorted(
                [(k, v['emission']) for k, v in result.ingredient_emissions.items() if isinstance(v, dict)],
                key=lambda x: x[1], reverse=True
            )[:3]
            
            if highest_emission_ingredients:
                top_ingredient = highest_emission_ingredients[0]
                if top_ingredient[1] > 0.1:  # Significant contributor
                    product_recommendations.append(f"🌱 Consider bio-based alternatives for {top_ingredient[0]} (highest emission ingredient)")
            
            # Regional improvements
            if result.regional_impact_factor > 0.8:
                product_recommendations.append("⚡ High grid emission factor in region - Consider renewable energy certificates")
            
            # Use phase improvements
            if result.use_phase_emissions > result.total_emissions * 0.3:
                product_recommendations.append("🚿 High use-phase impact - Consider concentrated formulations to reduce water heating")
            
            # Eco-score improvements
            if result.eco_score < 60:
                product_recommendations.append("🏆 Low eco-score - Focus on organic/natural ingredients and sustainable packaging")
            
            recommendations[product_name] = product_recommendations
        
        return recommendations
    
    
    
    def _calculate_sustainability_metrics(self, result1: LCAResult, result2: LCAResult,
                                        product1_data: Dict, product2_data: Dict) -> Dict[str, Dict[str, float]]:
        """Calculate detailed sustainability metrics for comparison"""
        
        return {
            'carbon_intensity': {
                'product1_per_kg': result1.total_emissions / self.lca_model._parse_weight_to_kg(product1_data['weight']),
                'product2_per_kg': result2.total_emissions / self.lca_model._parse_weight_to_kg(product2_data['weight']),
            },
            'packaging_efficiency': {
                'product1_ratio': result1.packaging_emissions / result1.total_emissions,
                'product2_ratio': result2.packaging_emissions / result2.total_emissions,
            },
            'manufacturing_efficiency': {
                'product1_ratio': result1.manufacturing_emissions / result1.total_emissions,
                'product2_ratio': result2.manufacturing_emissions / result2.total_emissions,
            },
            'recyclability_score': {
                'product1_score': result1.recyclability_details['effective_recycling_rate'] * 100 if result1.is_recyclable else 0,
                'product2_score': result2.recyclability_details['effective_recycling_rate'] * 100 if result2.is_recyclable else 0,
            }
        }
    
    def _create_detailed_comparison(self, result1: LCAResult, result2: LCAResult,
                                  product1_data: Dict, product2_data: Dict) -> Dict[str, Dict]:
        """Create detailed stage-by-stage comparison"""
        
        stages = ['ingredients', 'packaging', 'transportation', 'manufacturing', 'use_phase', 'end_of_life']
        
        detailed_comparison = {}
        
        for stage in stages:
            emission1 = result1.stage_breakdown[stage]
            emission2 = result2.stage_breakdown[stage]
            
            percentage1 = (emission1 / result1.total_emissions) * 100
            percentage2 = (emission2 / result2.total_emissions) * 100
            
            if emission1 < emission2:
                winner = product1_data['product_name']
                improvement = ((emission2 - emission1) / emission2) * 100
            elif emission2 < emission1:
                winner = product2_data['product_name']
                improvement = ((emission1 - emission2) / emission1) * 100
            else:
                winner = "Tie"
                improvement = 0
            
            detailed_comparison[stage] = {
                'product1_emission': emission1,
                'product2_emission': emission2,
                'product1_percentage': percentage1,
                'product2_percentage': percentage2,
                'winner': winner,
                'improvement_percentage': improvement
            }
        
        return detailed_comparison
    def _calculate_environmental_grade(self, score: float) -> str:
        """Calculate environmental grade based on score"""
        if score >= 85: return "A+"
        elif score >= 75: return "A"
        elif score >= 65: return "B+"
        elif score >= 55: return "B"
        elif score >= 45: return "C"
        elif score >= 35: return "D"
        else: return "F"

    def _identify_key_differentiators(self, comparison_result: ComparisonResult, 
                                    product1_data: Dict, product2_data: Dict) -> List[Dict]:
        """Identify key sustainability differentiators"""
        differentiators = []
        
        # Carbon footprint differentiator
        carbon_diff = abs(comparison_result.product1_result.total_emissions - comparison_result.product2_result.total_emissions)
        if carbon_diff > 0.1:  # Significant difference
            winner = "product1" if comparison_result.product1_result.total_emissions < comparison_result.product2_result.total_emissions else "product2"
            differentiators.append({
                "category": "Carbon Footprint",
                "impact": "high",
                "winner": winner,
                "description": f"Significantly lower greenhouse gas emissions"
            })
        
        # Packaging differentiator
        pkg1_sustainable = comparison_result.product1_result.plastic_type_info['plastic_type'] in ['Glass', 'Aluminum', 'Paper/Cardboard']
        pkg2_sustainable = comparison_result.product2_result.plastic_type_info['plastic_type'] in ['Glass', 'Aluminum', 'Paper/Cardboard']
        
        if pkg1_sustainable != pkg2_sustainable:
            winner = "product1" if pkg1_sustainable else "product2"
            differentiators.append({
                "category": "Sustainable Packaging",
                "impact": "medium",
                "winner": winner,
                "description": "Uses infinitely recyclable packaging materials"
            })
        
        return differentiators
    def _generate_sustainability_tips(self, comparison_result: ComparisonResult) -> List[str]:
        """Generate sustainability tips for consumers"""
        tips = [
            "Choose products with minimal, recyclable packaging",
            "Look for organic and plant-based ingredients",
            "Consider concentrated formulas to reduce packaging waste",
            "Support brands with transparent sustainability practices",
            "Recycle packaging according to local guidelines"
        ]
        
        # Add specific tips based on comparison results
        if any("recyclable" in rec.lower() for recs in comparison_result.improvement_recommendations.values() for rec in recs):
            tips.append("Prioritize products with recyclable packaging materials")
            
        return tips
    def generate_frontend_data(self, comparison_result: ComparisonResult, 
                          product1_data: Dict, product2_data: Dict) -> Dict:
        """Enhanced frontend-ready data generation"""
        
        # Calculate comprehensive scores
        score1 = self._calculate_comprehensive_environmental_score(comparison_result.product1_result, product1_data)
        score2 = self._calculate_comprehensive_environmental_score(comparison_result.product2_result, product2_data)
        
        # Enhanced frontend data structure
        frontend_data = {
            "metadata": {
                "comparison_id": f"comp_{int(datetime.now().timestamp())}",
                "timestamp": datetime.now().isoformat(),
                "model_version": "ProductComparisonLCA_v2.0",
                "focus": "comprehensive_sustainability_analysis"
            },
            
            "summary": {
                "overall_winner": {
                    "product_name": product1_data['product_name'] if score1 > score2 else product2_data['product_name'],
                    "score_difference": float(abs(score1 - score2)),  # Ensure float conversion
                    "is_significant_difference": bool(abs(score1 - score2) > 5),  # Ensure bool conversion
                    "environmental_advantage": "significant" if abs(score1 - score2) > 10 else "moderate" if abs(score1 - score2) > 5 else "minimal"
                }
            },
            
            "products": {
                "product1": {
                    "basic_info": {
                        "name": str(product1_data['product_name']),
                        "brand": str(product1_data['brand']),
                        "category": str(product1_data['category']),
                        "weight": str(product1_data['weight']),
                        "packaging": str(product1_data['packaging_type'])
                    },
                    "sustainability_scores": {
                        "overall_environmental_score": round(float(score1), 1),
                        "carbon_footprint_kg": round(float(comparison_result.product1_result.total_emissions), 4),
                        "eco_score": round(float(comparison_result.product1_result.eco_score), 1),
                        "recyclability_score": round(float(comparison_result.sustainability_metrics['recyclability_score']['product1_score']), 1),
                        "ingredient_sustainability": round(float(self._calculate_ingredient_eco_score(product1_data['ingredient_list']) * 2), 1),
                        "biodegradability_score": round(float(self._calculate_biodegradability_score(product1_data['ingredient_list'])), 1),
                        "renewable_content_score": round(float(self._calculate_renewable_content_score(product1_data['ingredient_list'])), 1)
                    },
                    "green_qualities": {k: int(v) for k, v in comparison_result.green_qualities_analysis['product1_green_qualities'].items()},
                    "environmental_grade": str(self._calculate_environmental_grade(score1))
                },
                "product2": {
                    "basic_info": {
                        "name": str(product2_data['product_name']),
                        "brand": str(product2_data['brand']),
                        "category": str(product2_data['category']),
                        "weight": str(product2_data['weight']),
                        "packaging": str(product2_data['packaging_type'])
                    },
                    "sustainability_scores": {
                        "overall_environmental_score": round(float(score2), 1),
                        "carbon_footprint_kg": round(float(comparison_result.product2_result.total_emissions), 4),
                        "eco_score": round(float(comparison_result.product2_result.eco_score), 1),
                        "recyclability_score": round(float(comparison_result.sustainability_metrics['recyclability_score']['product2_score']), 1),
                        "ingredient_sustainability": round(float(self._calculate_ingredient_eco_score(product2_data['ingredient_list']) * 2), 1),
                        "biodegradability_score": round(float(self._calculate_biodegradability_score(product2_data['ingredient_list'])), 1),
                        "renewable_content_score": round(float(self._calculate_renewable_content_score(product2_data['ingredient_list'])), 1)
                    },
                    "green_qualities": {k: int(v) for k, v in comparison_result.green_qualities_analysis['product2_green_qualities'].items()},
                    "environmental_grade": str(self._calculate_environmental_grade(score2))
                }
            },
            
            "detailed_analysis": {
                "carbon_impact": {
                    "winner": "product1" if comparison_result.product1_result.total_emissions < comparison_result.product2_result.total_emissions else "product2",
                    "reduction_potential": float(abs(comparison_result.product1_result.total_emissions - comparison_result.product2_result.total_emissions)),
                    "percentage_difference": round(float(abs(comparison_result.product1_result.total_emissions - comparison_result.product2_result.total_emissions) / max(comparison_result.product1_result.total_emissions, comparison_result.product2_result.total_emissions) * 100), 1)
                },
                "sustainability_breakdown": convert_numpy_types(comparison_result.detailed_comparison),
                "green_qualities_comparison": convert_numpy_types(comparison_result.green_qualities_analysis['green_quality_comparison'])
            },
            
            "actionable_insights": {
                "key_differentiators": convert_numpy_types(self._identify_key_differentiators(comparison_result, product1_data, product2_data)),
                "improvement_opportunities": convert_numpy_types(comparison_result.improvement_recommendations),
                "sustainability_tips": self._generate_sustainability_tips(comparison_result)
            }
        }
        
        # Apply numpy conversion to the entire structure as a final safety measure
        return convert_numpy_types(frontend_data)

    def _get_packaging_quality_score(self, plastic_type: str) -> float:
        """Get packaging quality score for radar chart"""
        quality_scores = {
            'Glass': 95, 'Aluminum': 90, 'Paper/Cardboard': 85,
            'PET': 70, 'HDPE': 65, 'PP': 60, 'LDPE': 40, 'ABS': 30
        }
        return quality_scores.get(plastic_type, 50)

    def _categorize_recommendation(self, recommendation: str) -> str:
        """Categorize recommendation for frontend display"""
        rec_lower = recommendation.lower()
        if any(word in rec_lower for word in ['carbon', 'emission', 'footprint']):
            return 'Carbon Reduction'
        elif any(word in rec_lower for word in ['packaging', 'recyclable', 'plastic']):
            return 'Packaging'
        elif any(word in rec_lower for word in ['ingredient', 'bio-based', 'organic']):
            return 'Ingredients'
        elif any(word in rec_lower for word in ['energy', 'renewable', 'grid']):
            return 'Energy'
        elif any(word in rec_lower for word in ['use', 'water', 'concentrated']):
            return 'Usage'
        else:
            return 'General'

    def _get_recommendation_icon(self, recommendation: str) -> str:
        """Get appropriate icon for recommendation"""
        rec_lower = recommendation.lower()
        if any(word in rec_lower for word in ['carbon', 'emission']):
            return 'carbon'
        elif any(word in rec_lower for word in ['recyclable', 'recycle']):
            return 'recycle'
        elif any(word in rec_lower for word in ['packaging', 'plastic']):
            return 'package'
        elif any(word in rec_lower for word in ['ingredient', 'bio']):
            return 'leaf'
        elif any(word in rec_lower for word in ['energy', 'renewable']):
            return 'energy'
        elif any(word in rec_lower for word in ['water', 'use']):
            return 'droplet'
        else:
            return 'lightbulb'

    def export_frontend_json(self, comparison_result: ComparisonResult, 
                            product1_data: Dict, product2_data: Dict, 
                            filename: str = "frontend_comparison_data.json") -> str:
        """Export frontend-ready data to JSON file"""
        
        frontend_data = self.generate_frontend_data(comparison_result, product1_data, product2_data)
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(frontend_data, f, indent=2, ensure_ascii=False)
        
        return json.dumps(frontend_data, indent=2, ensure_ascii=False)

    
    # Updated main comparison execution function
    def run_product_comparison_frontend(product1_data: Dict, product2_data: Dict, 
                                    emission_csv_path: str = EMISSION_PATH) -> Dict:
        """
        Main function to run comparison and return frontend-ready data
        """
        # Initialize comparison system
        print("🔧 Initializing Product Comparison LCA System...")
        comparison_system = ProductComparisonLCA(emission_csv_path)
        
        # Run comparison
        print("🔍 Starting comprehensive product comparison...")
        comparison_result = comparison_system.compare_products(product1_data, product2_data)
        
        # Generate frontend-ready data
        print("🎨 Generating frontend-ready data...")
        frontend_data = comparison_system.generate_frontend_data(comparison_result, product1_data, product2_data)
        
        print("✅ Frontend-ready data generated successfully!")
        
        # Return the data for immediate use
        return frontend_data

    @staticmethod
    def get_sustainability_comparison(product1_data: Dict, product2_data: Dict, 
                                    emission_csv_path: str = EMISSION_PATH) -> Dict:
        """
        Main API function for frontend integration
        Returns comprehensive sustainability comparison data
        """
        try:
            # Initialize comparison system
            comparison_system = ProductComparisonLCA(emission_csv_path)
            
            # Run comparison
            comparison_result = comparison_system.compare_products(product1_data, product2_data)
            
            # Generate frontend-ready data
            frontend_data = comparison_system.generate_frontend_data(
                comparison_result, product1_data, product2_data
            )
            
            response_data = {
                "status": "success",
                "message": "Sustainability comparison completed successfully",
                "data": frontend_data,
                "processing_info": {
                    "analysis_type": "comprehensive_environmental_assessment",
                    "sustainability_focus": True,
                    "cost_analysis": False,
                    "timestamp": datetime.now().isoformat()
                }
            }
            
            # Convert any remaining numpy types
            return convert_numpy_types(response_data)
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Comparison failed: {str(e)}",
                "data": None,
                "error_details": {
                    "error_type": type(e).__name__,
                    "timestamp": datetime.now().isoformat()
                }
            }

    def get_comparison_api_response(self,product1_data: Dict, product2_data: Dict) -> Dict:
        """
        API-style function that returns comparison data in a standardized format
        """
        try:
            frontend_data = run_product_comparison_frontend(product1_data, product2_data, EMISSION_PATH)

            return {
                "status": "success",
                "message": "Product comparison completed successfully",
                "data": frontend_data,
                "meta": {
                    "processing_time": "calculated_in_seconds",
                    "api_version": "1.0",
                    "model_version": "ProductComparisonLCA_v1.0"
                }
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Comparison failed: {str(e)}",
                "data": None,
                "meta": {
                    "error_type": type(e).__name__,
                    "api_version": "1.0"
                }
            }
    def generate_comparison_report(self, comparison_result: ComparisonResult) -> str:
        """Generate comprehensive comparison report"""
        
        report = f"""
# 🌍 COMPREHENSIVE PRODUCT SUSTAINABILITY COMPARISON REPORT
## Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

---

## 📊 EXECUTIVE SUMMARY

### Products Analyzed:
- **Product 1**: {comparison_result.product1_name}
- **Product 2**: {comparison_result.product2_name}

### Key Findings:
- **Carbon Footprint Winner**: {comparison_result.winner_analysis['carbon_footprint']}
- **Eco Score Winner**: {comparison_result.winner_analysis['eco_score']}
- **Recyclability Winner**: {comparison_result.winner_analysis['recyclability']}
- **Overall Winner**: {comparison_result.winner_analysis['overall']}

---

## 🏆 CATEGORY-WISE WINNERS

"""
        
        for category, winner_info in comparison_result.winner_analysis.items():
            report += f"### {category.replace('_', ' ').title()}\n{winner_info}\n\n"
        
        report += f"""
---

## 📈 DETAILED METRICS COMPARISON

### Carbon Footprint Analysis
- **{comparison_result.product1_name}**: {comparison_result.product1_result.total_emissions:.3f} kg CO2e
- **{comparison_result.product2_name}**: {comparison_result.product2_result.total_emissions:.3f} kg CO2e

### Eco Score Analysis
- **{comparison_result.product1_name}**: {comparison_result.product1_result.eco_score:.1f}/100
- **{comparison_result.product2_name}**: {comparison_result.product2_result.eco_score:.1f}/100

### Packaging Analysis
- **{comparison_result.product1_name}**: {comparison_result.product1_result.plastic_type_info['plastic_type']} 
  ({'Recyclable' if comparison_result.product1_result.is_recyclable else 'Non-recyclable'})
- **{comparison_result.product2_name}**: {comparison_result.product2_result.plastic_type_info['plastic_type']} 
  ({'Recyclable' if comparison_result.product2_result.is_recyclable else 'Non-recyclable'})

---

## 🎯 IMPROVEMENT RECOMMENDATIONS

"""
        
        for product_name, recommendations in comparison_result.improvement_recommendations.items():
            report += f"### {product_name}\n"
            for rec in recommendations:
                report += f"- {rec}\n"
            report += "\n"
        
        report += f"""
---

## 📊 STAGE-WISE BREAKDOWN COMPARISON

"""
        
        for stage, data in comparison_result.detailed_comparison.items():
            report += f"### {stage.replace('_', ' ').title()}\n"
            report += f"- **{comparison_result.product1_name}**: {data['product1_emission']:.4f} kg CO2e ({data['product1_percentage']:.1f}%)\n"
            report += f"- **{comparison_result.product2_name}**: {data['product2_emission']:.4f} kg CO2e ({data['product2_percentage']:.1f}%)\n"
            report += f"- **Winner**: {data['winner']}"
            if data['improvement_percentage'] > 0:
                report += f" (by {data['improvement_percentage']:.1f}%)"
            report += "\n\n"
        
        report += f"""
---

## 🌱 SUSTAINABILITY METRICS

### Carbon Intensity (per kg product)
- **{comparison_result.product1_name}**: {comparison_result.sustainability_metrics['carbon_intensity']['product1_per_kg']:.3f} kg CO2e/kg
- **{comparison_result.product2_name}**: {comparison_result.sustainability_metrics['carbon_intensity']['product2_per_kg']:.3f} kg CO2e/kg

### Recyclability Score
- **{comparison_result.product1_name}**: {comparison_result.sustainability_metrics['recyclability_score']['product1_score']:.1f}%
- **{comparison_result.product2_name}**: {comparison_result.sustainability_metrics['recyclability_score']['product2_score']:.1f}%

### Packaging Efficiency (packaging emissions as % of total)
- **{comparison_result.product1_name}**: {comparison_result.sustainability_metrics['packaging_efficiency']['product1_ratio']:.1%}
- **{comparison_result.product2_name}**: {comparison_result.sustainability_metrics['packaging_efficiency']['product2_ratio']:.1%}

---

## ✅ RECOMMENDATIONS SUMMARY

Based on this comprehensive analysis, we recommend:

1. **For Immediate Impact**: Focus on the highest-emission stages identified in the breakdown
2. **For Long-term Sustainability**: Implement packaging improvements and ingredient optimization
3. **For Market Positioning**: Leverage the eco-score and recyclability advantages

---
*This report was generated using EnhancedLCAModel v2.0 with Indian market-specific factors*
"""
        
        return report
    
    def export_comparison_to_json(self, comparison_result: ComparisonResult, 
                                 product1_data: Dict, product2_data: Dict) -> str:
        """Export comparison results to JSON format"""
        
        json_result = {
            "comparison_metadata": {
                "timestamp": datetime.now().isoformat(),
                "model_version": "ProductComparisonLCA_v1.0",
                "comparison_type": "comprehensive_sustainability_analysis"
            },
            "products": {
                "product1": {
                    "info": product1_data,
                    "results": {
                        "total_emissions_kg_co2e": round(comparison_result.product1_result.total_emissions, 4),
                        "eco_score": round(comparison_result.product1_result.eco_score, 1),
                        "is_recyclable": comparison_result.product1_result.is_recyclable,
                        "plastic_type": comparison_result.product1_result.plastic_type_info['plastic_type'],
                        "stage_breakdown": {k: round(v, 6) for k, v in comparison_result.product1_result.stage_breakdown.items()}
                    }
                },
                "product2": {
                    "info": product2_data,
                    "results": {
                        "total_emissions_kg_co2e": round(comparison_result.product2_result.total_emissions, 4),
                        "eco_score": round(comparison_result.product2_result.eco_score, 1),
                        "is_recyclable": comparison_result.product2_result.is_recyclable,
                        "plastic_type": comparison_result.product2_result.plastic_type_info['plastic_type'],
                        "stage_breakdown": {k: round(v, 6) for k, v in comparison_result.product2_result.stage_breakdown.items()}
                    }
                }
            },
            "comparison_results": {
                "winners": comparison_result.winner_analysis,
                "improvement_recommendations": comparison_result.improvement_recommendations,
                "sustainability_metrics": {
                    metric: {k: round(v, 4) for k, v in values.items()}
                    for metric, values in comparison_result.sustainability_metrics.items()
                },
                "detailed_stage_comparison": {
                    stage: {k: round(v, 6) if isinstance(v, (int, float)) else v 
                           for k, v in data.items()}
                    for stage, data in comparison_result.detailed_comparison.items()
                }
            },
            "summary": {
                "overall_winner": comparison_result.winner_analysis.get('overall', 'No clear winner'),
                "carbon_footprint_leader": "product1" if comparison_result.product1_result.total_emissions < comparison_result.product2_result.total_emissions else "product2",
                "eco_score_leader": "product1" if comparison_result.product1_result.eco_score > comparison_result.product2_result.eco_score else "product2",
                "recyclability_leader": "product1" if comparison_result.product1_result.is_recyclable and not comparison_result.product2_result.is_recyclable else "product2" if comparison_result.product2_result.is_recyclable and not comparison_result.product1_result.is_recyclable else "tie"
            }
        }
        
        return json.dumps(json_result, indent=2, ensure_ascii=False)
    
    # Missing code to complete the ProductComparisonLCA class

# Add this to complete the _create_detailed_comparison method visualization
    def create_comparison_visualization(self, comparison_result: ComparisonResult, 
                                    save_path: str = "product_comparison_dashboard.png"):
        """Create visualization dashboard for comparison results - COMPLETED VERSION"""
        
        # Set up the plot style
        plt.style.use('seaborn-v0_8')
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle('Product Sustainability Comparison Dashboard', fontsize=16, fontweight='bold')
        
        # 1. Total Emissions Comparison
        products = [comparison_result.product1_name.split('(')[0].strip()[:15], 
                comparison_result.product2_name.split('(')[0].strip()[:15]]
        emissions = [comparison_result.product1_result.total_emissions,
                    comparison_result.product2_result.total_emissions]
        
        colors = ['green' if emissions[0] < emissions[1] else 'orange',
                'green' if emissions[1] < emissions[0] else 'orange']
        
        bars1 = ax1.bar(products, emissions, color=colors, alpha=0.7)
        ax1.set_title('Total Carbon Footprint', fontweight='bold')
        ax1.set_ylabel('kg CO2e')
        ax1.tick_params(axis='x', rotation=45)
        
        # Add value labels on bars
        for bar, emission in zip(bars1, emissions):
            ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01,
                    f'{emission:.3f}', ha='center', va='bottom', fontweight='bold')
        
        # 2. Eco Score Comparison
        eco_scores = [comparison_result.product1_result.eco_score,
                    comparison_result.product2_result.eco_score]
        
        colors = ['green' if eco_scores[0] > eco_scores[1] else 'orange',
                'green' if eco_scores[1] > eco_scores[0] else 'orange']
        
        bars2 = ax2.bar(products, eco_scores, color=colors, alpha=0.7)
        ax2.set_title('Eco Score Comparison', fontweight='bold')
        ax2.set_ylabel('Score (0-100)')
        ax2.set_ylim(0, 100)
        ax2.tick_params(axis='x', rotation=45)
        
        # Add value labels
        for bar, score in zip(bars2, eco_scores):
            ax2.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
                    f'{score:.1f}', ha='center', va='bottom', fontweight='bold')
        
        # 3. Stage-wise Breakdown Comparison
        stages = list(comparison_result.product1_result.stage_breakdown.keys())
        p1_stages = [comparison_result.product1_result.stage_breakdown[stage] for stage in stages]
        p2_stages = [comparison_result.product2_result.stage_breakdown[stage] for stage in stages]
        
        x = np.arange(len(stages))
        width = 0.35
        
        bars3_1 = ax3.bar(x - width/2, p1_stages, width, label=products[0], alpha=0.7)
        bars3_2 = ax3.bar(x + width/2, p2_stages, width, label=products[1], alpha=0.7)
        
        ax3.set_title('Stage-wise Emissions Breakdown', fontweight='bold')
        ax3.set_ylabel('kg CO2e')
        ax3.set_xticks(x)
        ax3.set_xticklabels([stage.replace('_', '\n') for stage in stages], fontsize=8)
        ax3.legend()
        ax3.tick_params(axis='x', rotation=0)
        
        # 4. Recyclability
        recyclability_scores = [
            comparison_result.sustainability_metrics['recyclability_score']['product1_score'],
            comparison_result.sustainability_metrics['recyclability_score']['product2_score']
        ]

        
        # Recyclability bars
        bars4_1 = ax4.bar([p + ' (R)' for p in products], recyclability_scores, 
                        color='lightblue', alpha=0.7, label='Recyclability %')
        ax4.set_ylabel('Recyclability Score (%)', color='blue')
        ax4.set_ylim(0, 100)
        
        
        ax4.set_title('Recyclability ', fontweight='bold')
        ax4.tick_params(axis='x', rotation=45)
        
        # Add value labels
        for bar, score in zip(bars4_1, recyclability_scores):
            ax4.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
                    f'{score:.1f}%', ha='center', va='bottom', fontweight='bold', color='blue')
        
        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.show()
        
        print(f"✓ Comparison dashboard saved to {save_path}")

# CORRECTED USAGE FUNCTIONS FOR FRONTEND INTEGRATION

# 1. CORRECTED: Enhanced example function using the new API method
def example_sustainability_comparison():
    """
    Example usage of the enhanced sustainability comparison system
    """
    
    # Product 1: Premium organic face cream
    product1 = {
        'product_name': 'Organic Anti-Aging Face Cream',
        'brand': 'Natural Beauty Co',
        'category': 'face cream',
        'weight': '50ml',
        'packaging_type': 'Glass',
        'ingredient_list': 'Aqua, Certified Organic Aloe Vera Extract, Fair Trade Organic Jojoba Oil, Plant-Based Hyaluronic Acid, Natural Vitamin E, Organic Rosehip Oil',
        'latitude': 12.9716,
        'longitude': 77.5946,
        'usage_frequency': 'daily'
    }
    
    # Product 2: Conventional drugstore face cream
    product2 = {
        'product_name': 'Daily Moisture Face Cream',
        'brand': 'Drugstore Brand',
        'category': 'face cream',
        'weight': '75ml',
        'packaging_type': 'Plastic',
        'ingredient_list': 'Water, Dimethicone, Glycerin, Petrolatum, Cetearyl Alcohol, Synthetic Fragrance, Parabens',
        'latitude': 28.6139,
        'longitude': 77.2090,
        'usage_frequency': 'daily'
    }
    
    # Initialize and run comparison
    comparison_system = ProductComparisonLCA(EMISSION_PATH)
    comparison_result = comparison_system.compare_products(product1, product2)
    
    # Display results
    print(f"\n{'='*70}")
    print(f"🌍 COMPREHENSIVE SUSTAINABILITY COMPARISON")
    print(f"{'='*70}")
    
    # Generate and return frontend data
    frontend_data = comparison_system.generate_frontend_data(comparison_result, product1, product2)
    return frontend_data

# 2. CORRECTED: Enhanced interactive function for frontend testing
def interactive_sustainability_comparison():
    """
    Interactive version for testing sustainability comparison
    Returns frontend-ready JSON data
    """
    print("🌍 ADVANCED SUSTAINABILITY PRODUCT COMPARISON TOOL")
    print("=" * 60)
    print("This tool analyzes products based on:")
    print("• Carbon footprint & environmental impact")
    print("• Ingredient sustainability & safety")
    print("• Packaging recyclability & materials")
    print("• Biodegradability & renewable content")
    print("• Green certifications & eco-qualities")
    print("\nPlease provide details for two products:\n")
    
    products = []
    
    for i in range(2):
        print(f"📝 PRODUCT {i+1} DETAILS:")
        print("-" * 30)
        
        product_data = {
            'product_name': input("Product Name: ").strip(),
            'brand': input("Brand: ").strip(),
            'category': input("Category (face cream, shampoo, body wash, etc.): ").strip().lower(),
            'weight': input("Weight/Volume (e.g., 50ml, 250g): ").strip(),
            'packaging_type': input("Packaging Material (Glass/Plastic/Metal/Paper/Bamboo): ").strip(),
            'ingredient_list': input("Ingredient List (comma-separated, include certifications like 'organic', 'natural'): ").strip(),
            'usage_frequency': input("Usage Frequency (daily/weekly/monthly) [default: daily]: ").strip() or 'daily'
        }
        
        # Enhanced location input with defaults for major Indian cities
        print("\n📍 Location (for regional environmental factors):")
        location_choice = input("Choose: (1) Mumbai (2) Delhi (3) Bangalore (4) Custom [default: Bangalore]: ").strip()
        
        if location_choice == '1':
            product_data.update({'latitude': 19.0760, 'longitude': 72.8777})
        elif location_choice == '2':
            product_data.update({'latitude': 28.6139, 'longitude': 77.2090})
        elif location_choice == '4':
            try:
                product_data['latitude'] = float(input("Latitude: ") or "12.9716")
                product_data['longitude'] = float(input("Longitude: ") or "77.5946")
            except ValueError:
                product_data.update({'latitude': 12.9716, 'longitude': 77.5946})
        else:  # Default to Bangalore
            product_data.update({'latitude': 12.9716, 'longitude': 77.5946})
        
        products.append(product_data)
        print("\n" + "="*50 + "\n")
    
    # CORRECTED: Run comparison using the new API method
    print("🔄 Running comprehensive sustainability analysis...")
    result = ProductComparisonLCA.get_sustainability_comparison(products[0], products[1])
    
    if result['status'] == 'success':
        # Display results
        example_sustainability_comparison_display(result)
        
        # CORRECTED: Export frontend-ready JSON
        export_filename = f"sustainability_comparison_{int(datetime.now().timestamp())}.json"
        with open(export_filename, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        print(f"\n📁 Frontend-ready data exported to: {export_filename}")
        print("🔗 This JSON can be directly used by your frontend application!")
        
    return result

# 3. NEW: Display helper function for better formatting
def example_sustainability_comparison_display(result_data):
    """Helper function to display sustainability comparison results"""
    
    if result_data['status'] != 'success':
        print(f"❌ Error: {result_data['message']}")
        return
    
    data = result_data['data']
    
    print(f"\n{'🌍 SUSTAINABILITY ANALYSIS COMPLETE'}")
    print("=" * 70)
    
    # Summary section
    summary = data['summary']['overall_winner']
    print(f"\n🏆 OVERALL SUSTAINABILITY WINNER: {summary['product_name']}")
    print(f"   Environmental Advantage: {summary['environmental_advantage'].upper()}")
    print(f"   Score Difference: {summary['score_difference']:.1f} points")
    
    # Detailed scores comparison
    print(f"\n📊 DETAILED SUSTAINABILITY SCORES:")
    print("-" * 50)
    
    for i, (product_key, product_name) in enumerate([('product1', 'Product 1'), ('product2', 'Product 2')], 1):
        product = data['products'][product_key]
        scores = product['sustainability_scores']
        
        print(f"\n{product_name}: {product['basic_info']['name']}")
        print(f"   Grade: {product['environmental_grade']} | Overall Score: {scores['overall_environmental_score']}/100")
        print(f"   Carbon: {scores['carbon_footprint_kg']} kg CO2e | Eco: {scores['eco_score']}/100")
        print(f"   Recyclability: {scores['recyclability_score']}% | Ingredients: {scores['ingredient_sustainability']}/100")
        print(f"   Biodegradable: {scores['biodegradability_score']}/100 | Renewable: {scores['renewable_content_score']}/100")
    
    # Green qualities
    print(f"\n🌿 GREEN QUALITIES COMPARISON:")
    print("-" * 40)
    
    green_comparison = data['detailed_analysis']['green_qualities_comparison']
    for category, comparison in green_comparison.items():
        category_name = category.replace('_', ' ').title()
        winner = comparison['winner']
        if winner != 'tie':
            winner_product = data['products'][winner]['basic_info']['name']
            print(f"   {category_name}: {winner_product} wins ({comparison['advantage_score']} advantage)")
        else:
            print(f"   {category_name}: Tie")
    
    # Key recommendations
    print(f"\n💡 IMPROVEMENT RECOMMENDATIONS:")
    print("-" * 40)
    
    improvements = data['actionable_insights']['improvement_opportunities']
    for product_name, recommendations in improvements.items():
        if recommendations:
            print(f"\n   {product_name}:")
            for rec in recommendations[:3]:  # Top 3 recommendations
                print(f"   • {rec}")

# 4. CORRECTED: Main execution function for testing
def run_sustainability_comparison_test():
    """
    Main function for testing the sustainability comparison system
    Can be used for both example and interactive modes
    """
    
    print("🌍 SUSTAINABILITY COMPARISON SYSTEM")
    print("=" * 50)
    
    mode = input("Choose mode: (1) Example Comparison (2) Interactive Input [default: 1]: ").strip()
    
    if mode == '2':
        print("\n🔧 Starting Interactive Mode...")
        result = interactive_sustainability_comparison()
    else:
        print("\n🔧 Running Example Comparison...")
        result = example_sustainability_comparison()
    
    # CORRECTED: Additional analysis for frontend developers
    if result['status'] == 'success':
        print(f"\n{'🔧 FRONTEND INTEGRATION INFO'}")
        print("=" * 40)
        print("✅ Status: Ready for frontend integration")
        print("📦 Data Structure: Complete JSON with all sustainability metrics")
        print("🎨 UI Elements: Scores, grades, recommendations, and insights included")
        print("📊 Charts Data: Available for visualization components")
        print(f"⚡ Processing: {result['processing_info']['analysis_type']}")
        print(f"🌱 Focus: Environmental sustainability (no cost analysis)")
        
        # Show data structure for frontend devs
        data_keys = list(result['data'].keys())
        print(f"\n📋 Main Data Sections: {', '.join(data_keys)}")
        
    return result

# 5. CORRECTED: Batch comparison function for multiple products
def batch_sustainability_comparison(products_list: List[Dict]) -> List[Dict]:
    """
    Compare multiple products in batch for frontend applications
    Returns list of comparison results
    """
    
    if len(products_list) < 2:
        return [{"status": "error", "message": "At least 2 products required for comparison"}]
    
    results = []
    
    # Compare each product with every other product
    for i in range(len(products_list)):
        for j in range(i + 1, len(products_list)):
            comparison_result = ProductComparisonLCA.get_sustainability_comparison(
                products_list[i], products_list[j]
            )
            
            # Add comparison metadata
            if comparison_result['status'] == 'success':
                comparison_result['comparison_info'] = {
                    'product_indices': [i, j],
                    'comparison_id': f"batch_comp_{i}_{j}_{int(datetime.now().timestamp())}"
                }
            
            results.append(comparison_result)
    
    return results

# 6. NEW: Export function for frontend integration
def export_for_frontend(result_data: Dict, filename: str = None) -> str:
    """
    Export comparison results in frontend-optimized format
    """
    
    if not filename:
        filename = f"frontend_sustainability_data_{int(datetime.now().timestamp())}.json"
    
    # Add frontend-specific metadata
    if result_data['status'] == 'success':
        result_data['frontend_config'] = {
            'chart_colors': {
                'primary': '#4ECDC4',
                'secondary': '#45B7D1', 
                'success': '#96CEB4',
                'warning': '#FECA57',
                'danger': '#FF6B6B'
            },
            'display_preferences': {
                'show_detailed_breakdown': True,
                'highlight_winner': True,
                'show_recommendations': True,
                'enable_tooltips': True
            },
            'api_version': '2.0',
            'data_format': 'sustainability_focused'
        }
    
    # Convert numpy booleans and other non-serializable types to Python native types
    def convert_to_serializable(obj):
        if hasattr(obj, 'item'):  # numpy types
            return obj.item()
        elif isinstance(obj, np.bool_):
            return bool(obj)
        elif isinstance(obj, (np.int_, np.intc, np.intp, np.int8, np.int16, np.int32, np.int64)):
            return int(obj)
        elif isinstance(obj, (np.float64, np.float16, np.float32, np.float64)):
            return float(obj)
        elif isinstance(obj, dict):
            return {key: convert_to_serializable(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [convert_to_serializable(item) for item in obj]
        elif isinstance(obj, tuple):
            return tuple(convert_to_serializable(item) for item in obj)
        else:
            return obj
    
    # Convert the entire result_data to ensure all values are JSON serializable
    serializable_data = convert_to_serializable(result_data)
    
    # Export to file
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(serializable_data, f, indent=2, ensure_ascii=False)
    
    print(f"📁 Frontend-ready data exported to: {filename}")
    return filename

# 7. CORRECTED: Main execution block
if __name__ == "__main__":
    try:
        print("🚀 Starting Sustainability Comparison System...")
        result = example_sustainability_comparison()
        print("✅ Comparison completed successfully!")
        
        # Optional: Save results to JSON
        with open("comparison_results.json", 'w') as f:
            json.dump(result, f, indent=2, default=str)
        print("📁 Results saved to comparison_results.json")
        
    except Exception as e:
        print(f"❌ Error occurred: {str(e)}")
        print("Please check your LCA model dependencies and CSV file.")