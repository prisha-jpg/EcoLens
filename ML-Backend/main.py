import os
os.environ["HF_HOME"] = "/tmp"  
os.environ["TRANSFORMERS_CACHE"] = "/tmp"
os.environ["XDG_CACHE_HOME"] = "/tmp"
from fastapi import FastAPI, HTTPException, UploadFile, File, Form,Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Union
import json
import asyncio
import logging
from datetime import datetime
import os
import tempfile
import uuid
import requests
import tempfile
import whisper
import pyttsx3
import pandas as pd
# Import your existing classes
from LCA.file1 import EnhancedLCAModel, LCAResult
from LCA.alternative import EcoFriendlyAlternativesFinder
from LCA.comparison import ProductComparisonLCA
from ocr.extraction_json import extract_label_from_image
import sys
import os
from Agents.satellite_analyst_1 import SustainabilityIntelligenceSystem
from dotenv import load_dotenv
from fastapi.responses import FileResponse
import shutil
from groq import Groq
from ocr.url import ProductNameExtractor, get_product_name
from urllib.parse import urlparse
from LCA.product_matching import CosmeticsSearcher
from ocr.barcode import EnhancedBarcodeProductPipeline
from ocr.url_final import EnhancedIntegratedProductPipeline
import os
load_dotenv()
EMISSION_PATH = os.path.join(os.path.dirname(__file__), "save.csv")
DATASET_PATH = os.path.join(os.path.dirname(__file__), "ocr", "merged_dataset.csv")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="EcoScore & Sustainability Analysis API",
    description="API for calculating eco-scores, finding alternatives, and sustainability analysis",
    version="1.0.0"
)
origins=["http://localhost:5000","http://localhost:5001","http://localhost:3000","http://localhost:3001"]
# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
lca_model = None
alternatives_finder = None
sustainability_system = None
comparison_system = None
whisper_model = None
tts_engine = None
groq_client = None
product_extractor = None
conversation_sessions = {}
audio_files_storage = {}


# Initialize models on startup
@app.on_event("startup")
async def startup_event():
    global lca_model, alternatives_finder, sustainability_system, comparison_system, whisper_model, tts_engine, groq_client, product_extractor
    try:
        logger.info("Starting system initialization...")
        
        # Initialize LCA Model first (required by comparison_system)
        try:
            logger.info("Initializing LCA Model...")
            lca_model = EnhancedLCAModel(EMISSION_PATH)
            lca_model.initialize_models()
            logger.info("✅ LCA Model initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize LCA Model: {e}")
            lca_model = None
        
        # Initialize Product Comparison System (depends on LCA model)
        try:
            if lca_model:
                logger.info("Initializing Product Comparison System...")
                comparison_system = ProductComparisonLCA(EMISSION_PATH)
                logger.info("✅ Product Comparison System initialized successfully")
            else:
                logger.warning("❌ Cannot initialize Product Comparison System: LCA Model failed to load")
                comparison_system = None
        except Exception as e:
            logger.error(f"❌ Failed to initialize Product Comparison System: {e}")
            comparison_system = None
        
        # Initialize Alternatives Finder
        try:
            logger.info("Initializing Alternatives Finder...")
            alternatives_finder = EcoFriendlyAlternativesFinder(
                csv_file_path=DATASET_PATH
            )
            logger.info("✅ Alternatives Finder initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Alternatives Finder: {e}")
            alternatives_finder = None
        
        # Initialize Groq client
        try:
            groq_key = os.getenv("GROQ_API_KEY")
            if groq_key:
                logger.info("Initializing Groq client...")
                # Try different initialization methods based on Groq library version
                try:
                    # Method 1: Standard initialization (newer versions)
                    groq_client = Groq(api_key=groq_key)
                    logger.info("✅ Groq client initialized successfully (standard method)")
                except TypeError as e:
                    logger.warning(f"Standard Groq initialization failed: {e}")
            else:
                logger.warning("❌ GROQ_API_KEY not found in environment variables")
                groq_client = None
        except Exception as e:
            logger.error(f"❌ Failed to initialize Groq client: {e}")
            # Try one more fallback method
            try:
                logger.info("Attempting final fallback Groq initialization...")
                from groq import Client
                groq_client = Client(api_key=os.getenv("GROQ_API_KEY"))
                logger.info("✅ Groq client initialized successfully (fallback method)")
            except Exception as fallback_error:
                logger.error(f"❌ All Groq initialization methods failed: {fallback_error}")
                groq_client = None
        
        # Initialize Sustainability Intelligence System (depends on API keys)
        try:
            tavily_key = os.getenv("TAVILY_API_KEY")
            if tavily_key and groq_client is not None:  # Changed condition
                logger.info("Initializing Sustainability Intelligence System...")
                sustainability_system = SustainabilityIntelligenceSystem(tavily_key, groq_key)
                logger.info("✅ Sustainability Intelligence System initialized successfully")
            else:
                missing_items = []
                if not tavily_key:
                    missing_items.append("TAVILY_API_KEY")
                if groq_client is None:
                    missing_items.append("Groq client")
                logger.warning(f"❌ Missing requirements: {', '.join(missing_items)}")
                logger.warning("Company analysis will use fallback data.")
                sustainability_system = None
        except Exception as e:
            logger.error(f"❌ Failed to initialize Sustainability Intelligence System: {e}")
            sustainability_system = None

        # Initialize Whisper model
        try:
            logger.info("Loading Whisper model...")
            whisper_model = whisper.load_model("base")
            logger.info("✅ Whisper model loaded successfully")
        except Exception as e:
            logger.warning(f"❌ Failed to load Whisper model: {e}")
            whisper_model = None

        # Initialize Text-to-Speech
        try:
            logger.info("Initializing Text-to-Speech...")
            tts_engine = pyttsx3.init()
            # Setup TTS properties
            voices = tts_engine.getProperty('voices')
            if voices:
                for voice in voices:
                    if 'female' in voice.name.lower() or 'zira' in voice.name.lower():
                        tts_engine.setProperty('voice', voice.id)
                        break
            tts_engine.setProperty('rate', 180)
            tts_engine.setProperty('volume', 0.9)
            logger.info("✅ TTS engine initialized successfully")
        except Exception as e:
            logger.warning(f"❌ Failed to initialize TTS engine: {e}")
            tts_engine = None

        # Initialize Product Name Extractor
        try:
            logger.info("Initializing Product Name Extractor...")
            product_extractor = ProductNameExtractor(headless=True)
            logger.info("✅ Product Name Extractor initialized successfully")
        except Exception as e:
            logger.warning(f"❌ Failed to initialize Product Name Extractor: {e}")
            product_extractor = None
        
        # Summary of initialization results
        logger.info("\n" + "="*50)
        logger.info("SYSTEM INITIALIZATION SUMMARY")
        logger.info("="*50)
        logger.info(f"LCA Model: {'✅ Ready' if lca_model else '❌ Failed'}")
        logger.info(f"Comparison System: {'✅ Ready' if comparison_system else '❌ Failed'}")
        logger.info(f"Sustainability System: {'✅ Ready' if sustainability_system else '❌ Failed'}")
        logger.info(f"Alternatives Finder: {'✅ Ready' if alternatives_finder else '❌ Failed'}")
        logger.info(f"Groq Client: {'✅ Ready' if groq_client else '❌ Failed'}")
        logger.info(f"Whisper Model: {'✅ Ready' if whisper_model else '❌ Failed'}")
        logger.info(f"TTS Engine: {'✅ Ready' if tts_engine else '❌ Failed'}")
        logger.info(f"Product Extractor: {'✅ Ready' if product_extractor else '❌ Failed'}")
        logger.info("="*50)
        
    except Exception as e:
        logger.error(f"Critical error during startup: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")

# Pydantic models for request/response
class ProductInput(BaseModel):
    product_name: str = Field(..., description="Name of the product")
    brand: str = Field(..., description="Brand name")
    category: str = Field(..., description="Product category")
    weight: str = Field(default="250ml", description="Product weight/volume")
    packaging_type: str = Field(default="Plastic", description="Packaging material type")
    ingredient_list: str = Field(..., description="Comma-separated list of ingredients")
    latitude: float = Field(default=12.9716, description="Latitude for location-based analysis")
    longitude: float = Field(default=77.5946, description="Longitude for location-based analysis")
    usage_frequency: str = Field(default="daily", description="Usage frequency")
    manufacturing_loc: Optional[str] = Field(default="Mumbai", description="Manufacturing location")

class ProductURLInput(BaseModel):
    product_url: str = Field(..., description="Product URL to extract name from")
    extraction_method: str = Field(default="scrape", description="Extraction method: 'url', 'scrape', or 'both'")

class ProductURLResponse(BaseModel):
    success: bool
    product_url: str
    product_name: Optional[str] = None
    extraction_method: str
    message: str

class CompareProductsInput(BaseModel):
    product1: ProductInput
    product2: ProductInput

class EcoScoreResponse(BaseModel):
    success: bool
    product_info: Dict
    lca_results: Dict
    stage_breakdown_kg_co2e: Dict
    stage_percentages: Dict
    ingredient_emissions: Dict
    packaging_analysis: Dict
    recyclability_analysis: Dict
    regional_impact: Dict
    confidence_scores: Dict
    metadata: Dict
    message: Optional[str] = None

class ImagePathRequest(BaseModel):
    image_path1: str
    image_path2: str
class AlternativesResponse(BaseModel):
    success: bool
    user_product: Dict
    alternatives_found: int
    alternatives: List[Dict]
    message: Optional[str] = None

class CompanyInfoResponse(BaseModel):
    success: bool
    company_name: str
    analysis_summary: Dict
    news_analysis: Dict
    certification_analysis: List[Dict]
    evidence_based_summary: str
    sustainability_score: float
    certifications: List[str] = []
    message: Optional[str] = None

class CompareResponse(BaseModel):
    success: bool
    comparison_id: str
    frontend_data: Dict
    comparison_summary: Dict
    winner_analysis: Dict
    improvement_recommendations: Dict
    sustainability_metrics: Dict
    message: Optional[str] = None

class ChatMessage(BaseModel):
    message: str
    message_type: str = Field(default="text", description="text or voice")
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    response_type: str = Field(default="text", description="text or voice")
    session_id: str
    audio_url: Optional[str] = None

def build_api_knowledge_context():
    """Build comprehensive context about available API functionalities"""
    api_knowledge = {
        "eco_score_calculation": {
            "endpoint": "/api/get-eco-score",
            "description": "Calculate comprehensive eco-score and LCA analysis for products",
            "capabilities": [
                "Carbon footprint calculation (kg CO2e)",
                "Ingredient-level emissions analysis", 
                "Packaging impact assessment",
                "Regional environmental impact analysis",
                "Recyclability scoring",
                "Stage-wise breakdown (Raw Materials, Manufacturing, Transportation, Use, End-of-Life)",
                "Confidence scoring for reliability"
            ],
            "input_requirements": [
                "Product name and brand",
                "Category and weight/volume", 
                "Packaging type",
                "Ingredient list",
                "Geographic coordinates",
                "Usage frequency",
                "Manufacturing location"
            ],
            "output_metrics": [
                "Total emissions (kg CO2e)",
                "Eco-score (0-100 scale)",
                "Stage percentages",
                "Recyclability rate",
                "Regional impact factors"
            ]
        },
        "alternatives_finder": {
            "endpoint": "/api/get-alternatives", 
            "description": "Find eco-friendly product alternatives from database",
            "capabilities": [
                "Search 1000+ eco-friendly products",
                "Category-based filtering",
                "Emission comparison",
                "Packaging sustainability analysis",
                "Brand sustainability scoring"
            ],
            "database_size": "1000+ products across multiple categories",
            "categories": ["Personal Care", "Cosmetics", "Hair Care", "Skin Care", "Oral Care", "Household", "Food & Beverage"]
        },
        "company_analysis": {
            "endpoint": "/api/company-info/{company_name}",
            "description": "Real-time company sustainability analysis",
            "capabilities": [
                "News sentiment analysis",
                "Certification verification",
                "Sustainability score calculation",
                "Evidence-based reporting",
                "Real-time data integration"
            ],
            "data_sources": ["News articles", "Certification databases", "Company reports", "Environmental databases"],
            "certifications_checked": ["FSC", "ISO 14001", "LEED", "Energy Star", "Organic certifications"]
        },
        "product_comparison": {
    "endpoint": "/api/compare-products",
    "description": "Comprehensive sustainability-focused product comparison",
    "capabilities": [
        "Dual LCA analysis",
        "Environmental impact scoring (0-100 scale)",
        "Green qualities analysis (8 categories)",
        "Biodegradability assessment", 
        "Renewable content evaluation",
        "Packaging sustainability scoring",
        "Winner determination algorithm",
        "Improvement recommendations",
        "Sustainability gap analysis"
    ],
    "comparison_factors": [
        "Carbon footprint", "Eco-scores", "Recyclability", 
        "Ingredient sustainability", "Packaging impact", 
        "Biodegradability", "Renewable content"
    ],
    "green_qualities": [
        "Organic ingredients", "Sustainable sourcing", "Chemical-free",
        "Eco packaging", "Renewable ingredients", "Cruelty-free",
        "Water conservation", "Climate positive"
    ]
}
    }
    return api_knowledge


def get_llm_response(user_input: str, session_id: str) -> str:
    """Get response from Groq LLM with API knowledge context"""
    try:
        logger.info(f"Getting Groq LLM response for session: {session_id}")
        
        if not groq_client:
            return "Sorry, the AI service is currently unavailable. Please ensure the GROQ_API_KEY is properly configured."
        
        # Get conversation history for this session
        history = conversation_sessions.get(session_id, [])
        
        # Build context from recent conversation
        conversation_context = ""
        if history:
            conversation_context = "\n".join([
                f"User: {h['user']}\nAssistant: {h['assistant']}"
                for h in history[-3:]  # Last 3 exchanges
            ]) + "\n"
        
        # Get comprehensive API knowledge
        api_knowledge = build_api_knowledge_context()
        
        # Create detailed system context
        system_context = f"""You are ECOLENS, an expert eco-friendly assistant with comprehensive knowledge of sustainability analysis and environmental impact assessment. You have access to the following specialized capabilities:

## ECO-SCORE CALCULATION SYSTEM
- Calculates comprehensive Life Cycle Assessment (LCA) for products
- Analyzes carbon footprint across 5 stages: Raw Materials, Manufacturing, Transportation, Use Phase, End-of-Life
- Provides ingredient-level emissions analysis with confidence scoring
- Assesses packaging impact and recyclability (0-100% scale)
- Considers regional environmental factors and transportation distances
- Generates eco-scores on 0-10 scale (10 being most sustainable)
- Input requirements: Product details, ingredients, location, packaging type

## ALTERNATIVES DATABASE
- Access to 1000+ eco-friendly product alternatives
- Covers categories: Personal Care, Cosmetics, Hair Care, Skin Care, Oral Care, Household, Food & Beverage
- Provides emission comparisons and sustainability rankings
- Filters by packaging type, brand sustainability, and environmental impact

## COMPANY SUSTAINABILITY ANALYSIS
- Real-time analysis of company sustainability practices
- News sentiment analysis for environmental initiatives
- Certification verification (FSC, ISO 14001, LEED, Energy Star, Organic)
- Evidence-based sustainability scoring
- Integration with live databases and news sources

## PRODUCT COMPARISON ENGINE
- Side-by-side LCA analysis of two products
- Winner determination based on multiple environmental factors
- Improvement recommendations for both products
- Cost-benefit analysis and sustainability metrics
- Visual data generation for charts and comparisons

When users ask about:
- Product sustainability → Guide them to eco-score calculation
- Finding alternatives → Explain alternatives database capabilities  
- Company practices → Describe real-time company analysis
- Comparing products → Detail comparison engine features
- Multiple products → Mention batch processing options

Always provide specific, actionable information based on these capabilities. Be precise about metrics, methodologies, and data sources available."""

        # Prepare messages for Groq
        messages = [
            {"role": "system", "content": system_context},
        ]
        
        # Add conversation history
        if conversation_context:
            messages.append({"role": "user", "content": f"Previous conversation context:\n{conversation_context}"})
        
        # Add current user message
        messages.append({"role": "user", "content": user_input})
        
        # Get response from Groq
        chat_completion = groq_client.chat.completions.create(
            messages=messages,
            model="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=800,
            top_p=0.9
        )
        
        assistant_response = chat_completion.choices[0].message.content.strip()
        
        # Store conversation in session
        if session_id not in conversation_sessions:
            conversation_sessions[session_id] = []
        
        conversation_sessions[session_id].append({
            'user': user_input,
            'assistant': assistant_response,
            'timestamp': datetime.now().isoformat()
        })
        
        # Keep only last 10 exchanges per session
        if len(conversation_sessions[session_id]) > 10:
            conversation_sessions[session_id] = conversation_sessions[session_id][-10:]
        
        return assistant_response
        
    except Exception as e:
        logger.error(f"Error getting Groq LLM response: {e}")
        return f"I encountered an error while processing your request. Please try again. If the issue persists, check if the GROQ_API_KEY is properly configured. Error: {str(e)}"

def speech_to_text_whisper(audio_file_path: str) -> str:
    """Convert speech to text using Whisper"""
    try:
        if not whisper_model:
            raise Exception("Whisper model not initialized")
            
        logger.info("Converting speech to text with Whisper...")
        result = whisper_model.transcribe(audio_file_path)
        text = result["text"].strip()
        logger.info(f"Transcription successful: {text[:50]}...")
        return text
    except Exception as e:
        logger.error(f"Error in speech recognition: {e}")
        return None

def generate_tts_audio(text: str, session_id: str) -> str:
    """Generate TTS audio and store it for serving"""
    try:
        if not tts_engine:
            raise Exception("TTS engine not initialized")
        
        # Create a unique filename
        audio_id = str(uuid.uuid4())
        temp_audio = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        temp_audio.close()
        
        # Generate speech
        tts_engine.save_to_file(text, temp_audio.name)
        tts_engine.runAndWait()
        
        # Store the file path for later serving
        audio_files_storage[f"{session_id}_{audio_id}"] = temp_audio.name
        
        return f"{session_id}_{audio_id}"
    except Exception as e:
        logger.error(f"Error generating TTS audio: {e}")
        return None
    
@app.get("/api/startup-status")
async def startup_status():
    """Check which systems are properly initialized"""
    return {
        "lca_model": lca_model is not None,
        "alternatives_finder": alternatives_finder is not None,
        "comparison_system": comparison_system is not None,
        "sustainability_system": sustainability_system is not None,
        "groq_client": groq_client is not None,
        "product_extractor": product_extractor is not None,  # Add this line
        "timestamp": datetime.now().isoformat()
    }
@app.post("/extract-picture")
def extract_label(request: ImagePathRequest):
    try:
        # Call your updated extraction function with two image paths
        raw_result = extract_label_from_image(request.image_path1, request.image_path2)

        # Convert raw JSON string to dict for clean API output
        try:
            parsed_result = json.loads(raw_result)
        except json.JSONDecodeError:
            # If Groq returns something non-JSON, return as plain text
            parsed_result = {"raw_output": raw_result}

        return parsed_result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/get_barcode")
async def get_product_by_barcode(barcode: str):
    """
    Get product information by barcode using enhanced pipeline with guaranteed ingredients
    """
    try:
        # Initialize the enhanced barcode pipeline
        pipeline = EnhancedBarcodeProductPipeline(
            csv_file_path=DATASET_PATH,
            tavily_api_key=os.environ.get('TAVILY_API_KEY')
        )
        
        # Process barcode through enhanced pipeline
        result = pipeline.process_barcode_to_product_details(barcode)
        
        if result.get('success', False):
            # Success - product found and processed
            return {
                "success": True,
                "source": {
                    "barcode": result.get('barcode_data', {}),
                    "database": {
                        "found": True,
                        "search_method": result.get('search_method'),
                        "match_confidence": result.get('match_confidence')
                    }
                },
                "product": {
                    'product_name': result.get('product_name'),
                    'brand': result.get('brand'),
                    'category': result.get('category'),
                    'ingredients': result.get('ingredient_list'),
                    'manufacturing_location': result.get('manufacturing_loc'),
                    'weight': result.get('weight'),
                    'packaging_type': result.get('packaging_type'),
                    'latitude': result.get('latitude'),
                    'longitude': result.get('longitude'),
                    'usage_frequency': result.get('usage_frequency'),
                    'match_confidence': result.get('match_confidence', 'medium'),
                    'eco_score': 'N/A'  # Can be calculated separately if needed
                },
                "metadata": {
                    "source_barcode": result.get('source_barcode'),
                    "search_method": result.get('search_method'),
                    "has_guaranteed_ingredients": True,
                    "note": result.get('note')
                }
            }
        else:
            # Error occurred during processing
            error_msg = result.get('error', 'Unknown error occurred')
            return {
                "success": False,
                "source": "enhanced_barcode_pipeline",
                "error": error_msg,
                "barcode": barcode
            }
            
    except Exception as e:
        logger.error(f"Enhanced barcode pipeline error: {e}")
        return {
            "success": False,
            "source": "enhanced_barcode_pipeline",
            "error": f"Pipeline processing failed: {str(e)}",
            "barcode": barcode
        }


@app.get("/get_url")
async def get_product_by_url(url: str):
    """
    Get product information from URL using enhanced pipeline with guaranteed ingredients
    """
    try:
        # Initialize the enhanced URL pipeline
        pipeline = EnhancedIntegratedProductPipeline(
            csv_file_path=DATASET_PATH,
            tavily_api_key=os.environ.get('TAVILY_API_KEY')
        )
        
        # Process URL through enhanced pipeline
        result = pipeline.process_url_to_product_details(url)
        
        if result.get('success', False):
            # Success - product found and processed
            return {
                "success": True,
                "source": {
                    "url": {
                        "original_url": result.get('source_url', url),
                        "extracted_name": result.get('product_name')
                    },
                    "database": {
                        "found": True,
                        "search_method": result.get('search_method'),
                        "match_confidence": result.get('match_confidence')
                    }
                },
                "product": {
                    'product_name': result.get('product_name'),
                    'brand': result.get('brand'),
                    'category': result.get('category'),
                    'ingredients': result.get('ingredient_list'),
                    'manufacturing_location': result.get('manufacturing_loc'),
                    'weight': result.get('weight'),
                    'packaging_type': result.get('packaging_type'),
                    'latitude': result.get('latitude'),
                    'longitude': result.get('longitude'),
                    'usage_frequency': result.get('usage_frequency'),
                    'match_confidence': result.get('match_confidence', 'medium'),
                    'eco_score': 'N/A'  # Can be calculated separately if needed
                },
                "metadata": {
                    "source_url": result.get('source_url'),
                    "search_method": result.get('search_method'),
                    "has_guaranteed_ingredients": True,
                    "note": result.get('note')
                }
            }
        else:
            # Product name extracted but not found in database - still has generated ingredients
            if 'product_name' in result:
                return {
                    "success": True,
                    "source": {
                        "url": {
                            "original_url": url,
                            "extracted_name": result.get('product_name')
                        },
                        "database": {
                            "found": False,
                            "search_method": result.get('search_method')
                        }
                    },
                    "product": {
                        'product_name': result.get('product_name'),
                        'brand': result.get('brand'),
                        'category': result.get('category'),
                        'ingredients': result.get('ingredient_list'),
                        'manufacturing_location': result.get('manufacturing_loc'),
                        'weight': result.get('weight'),
                        'packaging_type': result.get('packaging_type'),
                        'latitude': result.get('latitude'),
                        'longitude': result.get('longitude'),
                        'usage_frequency': result.get('usage_frequency'),
                        'match_confidence': 'generated',
                        'eco_score': 'N/A'
                    },
                    "metadata": {
                        "source_url": url,
                        "search_method": result.get('search_method'),
                        "has_guaranteed_ingredients": True,
                        "note": result.get('note', 'Product extracted but not found in database. Ingredients generated.')
                    },
                    "message": "Product name extracted from URL but not found in cosmetics database. Generated typical ingredients based on product type."
                }
            else:
                # Error occurred during processing
                error_msg = result.get('error', 'Unknown error occurred')
                return {
                    "success": False,
                    "source": "enhanced_url_pipeline",
                    "error": error_msg,
                    "url": url
                }
            
    except Exception as e:
        logger.error(f"Enhanced URL pipeline error: {e}")
        return {
            "success": False,
            "source": "enhanced_url_pipeline",
            "error": f"Pipeline processing failed: {str(e)}",
            "url": url
        }


# Route 1: Get Eco Score (Dashboard redirect)
@app.post("/api/get-eco-score", response_model=EcoScoreResponse)
async def get_eco_score(product_input: ProductInput):
    """
    Calculate comprehensive eco-score and LCA analysis for a product.
    Redirects to dashboard with complete statistics.
    """
    try:
        if not lca_model:
            raise HTTPException(status_code=500, detail="LCA Model not initialized")
        
        # Convert input to dict format expected by the model
        product_data = {
            'product_name': product_input.product_name,
            'brand': product_input.brand,
            'category': product_input.category,
            'weight': product_input.weight,
            'packaging_type': product_input.packaging_type,
            'ingredient_list': product_input.ingredient_list,
            'latitude': product_input.latitude,
            'longitude': product_input.longitude,
            'usage_frequency': product_input.usage_frequency,
            'manufacturing_loc': product_input.manufacturing_loc
        }
        
        # Calculate LCA
        logger.info(f"Calculating LCA for product: {product_input.product_name}")
        lca_result = lca_model.calculate_comprehensive_lca(product_data)
        
        # Convert to JSON format
        json_output = lca_model.lca_result_to_json(lca_result, product_data)
        response_data = json.loads(json_output)
        
        return EcoScoreResponse(
            success=True,
            **response_data,
            message="Eco-score calculated successfully"
        )
        
    except Exception as e:
        logger.error(f"Error calculating eco-score: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate eco-score: {str(e)}")

# Route 2: Get Alternatives (From Dashboard)
@app.post("/api/get-alternatives", response_model=AlternativesResponse)
async def get_alternatives(product_input: ProductInput, num_alternatives: int = 3):
    """
    Find eco-friendly alternatives for a given product from the database.
    """
    try:
        if not alternatives_finder:
            raise HTTPException(status_code=500, detail="Alternatives Finder not initialized")
        
        # Convert input to dict format
        user_product = {
            'product_name': product_input.product_name,
            'brand': product_input.brand,
            'category': product_input.category,
            'weight': product_input.weight,
            'eco_score': 3.0,  # Default eco score, can be calculated separately
            'packaging_type': product_input.packaging_type,
            'ingredient_list': product_input.ingredient_list,
            'latitude': product_input.latitude,
            'longitude': product_input.longitude,
            'usage_frequency': product_input.usage_frequency,
            'manufacturing_loc': product_input.manufacturing_loc
        }
        
        logger.info(f"Finding alternatives for product: {product_input.product_name}")
        result = alternatives_finder.search_and_find_alternatives(
            user_product, 
            num_alternatives=num_alternatives
        )
        
        return AlternativesResponse(
            success=True,
            user_product=result['user_product'],
            alternatives_found=result['alternatives_found'],
            alternatives=result['alternatives'],
            message=f"Found {result['alternatives_found']} eco-friendly alternatives"
        )
        
    except Exception as e:
        logger.error(f"Error finding alternatives: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to find alternatives: {str(e)}")

# Route 3: Get Company Sustainability Info
@app.get("/api/company-info/{company_name}", response_model=CompanyInfoResponse)
async def get_company_info(company_name: str, product_name: str = ""):
    """
    Get company's comprehensive sustainability analysis using real-time data.
    Optionally provide product_name as query parameter for better analysis.
    """
    try:
        if not sustainability_system:
            logger.warning("Sustainability system not initialized, using fallback data")
            # Fallback to mock data if system not initialized
            return await get_company_info_fallback(company_name)
        
        logger.info(f"Fetching comprehensive sustainability analysis for: {company_name}")
        
        if product_name:
            # Analyze with product context
            analysis_results = sustainability_system.analyze_from_company_product(company_name, product_name)
        else:
            # Analyze with default parameters
            default_keywords = ["sustainability", "environmental", "packaging", "emissions"]
            default_materials = ["Packaging", "Ingredients", "Manufacturing", "Sourcing"]
            analysis_results = sustainability_system.analyze_company(company_name, default_keywords, default_materials)
        
        # Extract key information for API response
        news_analysis = analysis_results.get("news_analysis", {})
        cert_analysis = analysis_results.get("certification_analysis", [])
        executive_summary = analysis_results.get("executive_summary", {})
        evidence_summary = analysis_results.get("evidence_based_summary", "No evidence-based summary available.")
        
        # Calculate overall sustainability score
        sentiment_score = news_analysis.get("sentiment_score", 50.0)
        cert_rate = executive_summary.get("certification_rate", 0.0)
        sustainability_score = (sentiment_score * 0.7 + cert_rate * 0.3)  # Weighted score
        
        # Extract certifications found
        verified_certs = []
        for cert in cert_analysis:
            if cert.get("status") == "Verified":
                cert_found = cert.get("certification_found", "Unknown")
                # Handle case where certification_found is a list
                if isinstance(cert_found, list):
                    verified_certs.extend([str(c) for c in cert_found])
                else:
                    verified_certs.append(str(cert_found))
        verified_certs = list(set([cert for cert in verified_certs if cert and cert != "Unknown"]))

        
        return CompanyInfoResponse(
            success=True,
            company_name=company_name,
            analysis_summary=executive_summary,
            news_analysis=news_analysis,
            certification_analysis=cert_analysis,
            evidence_based_summary=evidence_summary,
            sustainability_score=round(sustainability_score, 1),
            certifications=verified_certs,  # Now guaranteed to be a list of strings
            message=f"Successfully retrieved real-time sustainability analysis for {company_name}"
            )
        
    except Exception as e:
        logger.error(f"Error fetching company sustainability analysis: {e}")
        # Fallback to mock data on error
        return await get_company_info_fallback(company_name)


# Route 4: Compare Two Products
@app.post("/api/compare-products", response_model=CompareResponse)
async def compare_products(compare_input: CompareProductsInput):
    """
    Compare two products using enhanced comparison system with comprehensive analysis.
    """
    try:
        # Check if comparison system is initialized
        if not comparison_system:
            logger.error("Comparison System is not initialized")
            raise HTTPException(
                status_code=500, 
                detail="Comparison System not initialized. Please check server startup logs."
            )
        
        # Check if the comparison system has required methods
        if not hasattr(comparison_system, 'compare_products'):
            logger.error("Comparison System missing compare_products method")
            raise HTTPException(
                status_code=500, 
                detail="Comparison System is improperly configured"
            )
        
        comparison_id = str(uuid.uuid4())
        logger.info(f"Comparing products with ID: {comparison_id}")
        
        # Convert input to dict format expected by comparison system
        product1_data = {
            'product_name': compare_input.product1.product_name,
            'brand': compare_input.product1.brand,
            'category': compare_input.product1.category,
            'weight': compare_input.product1.weight,
            'packaging_type': compare_input.product1.packaging_type,
            'ingredient_list': compare_input.product1.ingredient_list,
            'latitude': compare_input.product1.latitude,
            'longitude': compare_input.product1.longitude,
            'usage_frequency': compare_input.product1.usage_frequency,
            'manufacturing_loc': compare_input.product1.manufacturing_loc
        }
        
        product2_data = {
            'product_name': compare_input.product2.product_name,
            'brand': compare_input.product2.brand,
            'category': compare_input.product2.category,
            'weight': compare_input.product2.weight,
            'packaging_type': compare_input.product2.packaging_type,
            'ingredient_list': compare_input.product2.ingredient_list,
            'latitude': compare_input.product2.latitude,
            'longitude': compare_input.product2.longitude,
            'usage_frequency': compare_input.product2.usage_frequency,
            'manufacturing_loc': compare_input.product2.manufacturing_loc
        }
        
        # Run comprehensive comparison using the enhanced system
        logger.info("Running comprehensive product comparison...")
        comparison_result = comparison_system.compare_products(product1_data, product2_data)
        
        # Generate frontend-ready data
        logger.info("Generating frontend-ready data...")
        frontend_data = comparison_system.generate_frontend_data(
            comparison_result, product1_data, product2_data
        )
        
        # Create simplified comparison summary for backward compatibility
        comparison_summary = {
    "total_emissions_comparison": {
        "product1_emissions": comparison_result.product1_result.total_emissions,
        "product2_emissions": comparison_result.product2_result.total_emissions,
        "difference": abs(comparison_result.product1_result.total_emissions - 
                        comparison_result.product2_result.total_emissions),
        "percentage_difference": abs((comparison_result.product1_result.total_emissions - 
                                   comparison_result.product2_result.total_emissions) / 
                                   max(comparison_result.product1_result.total_emissions, 
                                       comparison_result.product2_result.total_emissions)) * 100
    },
    "eco_score_comparison": {
        "product1_score": comparison_result.product1_result.eco_score,
        "product2_score": comparison_result.product2_result.eco_score,
        "difference": abs(comparison_result.product1_result.eco_score - 
                        comparison_result.product2_result.eco_score)
    },
    "recyclability_comparison": {
        "product1_recyclable": comparison_result.product1_result.is_recyclable,
        "product2_recyclable": comparison_result.product2_result.is_recyclable,
        "product1_rate": comparison_result.sustainability_metrics['recyclability_score']['product1_score'],
        "product2_rate": comparison_result.sustainability_metrics['recyclability_score']['product2_score']
    },
    "overall_winner": frontend_data['summary']['overall_winner']
}
        
        return CompareResponse(
            success=True,
            comparison_id=comparison_id,
            frontend_data=frontend_data,
            comparison_summary=comparison_summary,
            winner_analysis=comparison_result.winner_analysis,
            improvement_recommendations=comparison_result.improvement_recommendations,
            sustainability_metrics=comparison_result.sustainability_metrics,
            message="Enhanced product comparison completed successfully with comprehensive analysis"
        )
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        logger.error(f"Error comparing products: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to compare products: {str(e)}")

    
@app.get("/api/comparison/{comparison_id}/charts")
async def get_comparison_charts(comparison_id: str):
    """
    Get chart-ready data for a specific comparison (if you want to store comparisons)
    """
    # This would require storing comparison results in a database or cache
    # For now, return a placeholder response
    return {
        "comparison_id": comparison_id,
        "message": "Chart data endpoint - implement based on your storage needs",
        "charts_available": [
            "bar_chart_data",
            "radar_chart_data", 
            "stage_breakdown_chart",
            "donut_chart_data"
        ]
    }
# Route 5: Voice-Assisted Chatbot
@app.post("/api/chatbot", response_model=ChatResponse)
async def chatbot_interaction(chat_message: ChatMessage):
    """
    Handle voice-assisted chatbot interactions with Ollama LLM integration.
    Accepts both text and voice input, responds with text and optionally voice.
    """
    try:
        audio_url = None
        response_type = "text"
        session_id = chat_message.session_id or str(uuid.uuid4())
        
        logger.info(f"Chatbot interaction - Session: {session_id}, Type: {chat_message.message_type}")
        
        # Process the message using Ollama LLM
        user_message = chat_message.message
        
        # Get intelligent response from LLM
        response = get_llm_response(user_message, session_id)
        
        # For voice responses, generate TTS audio
        audio_url = None
        response_type = "text"
        
        if chat_message.message_type == "voice" and tts_engine:
            try:
                audio_id = generate_tts_audio(response, session_id)
                if audio_id:
                    # Return actual downloadable URL
                    audio_url = f"/api/audio/{audio_id}"
                    response_type = "voice"
                    logger.info("TTS audio generated successfully")
            except Exception as e:
                logger.warning(f"TTS generation failed: {e}")
        
        return ChatResponse(
            response=response,
            response_type=response_type,
            session_id=session_id,
            audio_url=audio_url
        )
        
    except Exception as e:
        logger.error(f"Error in chatbot interaction: {e}")
        # Return a fallback response instead of raising an exception
        return ChatResponse(
            response="I'm sorry, I encountered an error processing your request. Please try again.",
            response_type="text",
            session_id=chat_message.session_id or str(uuid.uuid4()),
            audio_url=None
        )

@app.get("/api/audio/{audio_id}")
async def get_audio_file(audio_id: str):
    """Serve generated audio files"""
    try:
        if audio_id not in audio_files_storage:
            raise HTTPException(status_code=404, detail="Audio file not found")
        
        file_path = audio_files_storage[audio_id]
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Audio file not found on disk")
        
        return FileResponse(
            path=file_path,
            media_type="audio/wav",
            filename=f"response_{audio_id}.wav",
            headers={"Cache-Control": "no-cache"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving audio file: {e}")
        raise HTTPException(status_code=500, detail="Error serving audio file")

# Route 6: Upload Voice File for Chatbot
@app.post("/api/chatbot/voice-upload")
async def upload_voice_message(audio_file: UploadFile = File(...), session_id: str = Form(None)):
    """
    Handle voice file uploads for the chatbot with Whisper STT.
    """
    try:
        if not audio_file.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="File must be an audio file")
        
        session_id = session_id or str(uuid.uuid4())
        
        # Save the uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            content = await audio_file.read()
            temp_file.write(content)
            temp_audio_path = temp_file.name
        
        # Convert speech to text using Whisper
        transcribed_text = speech_to_text_whisper(temp_audio_path)
        
        # Clean up temp file
        os.unlink(temp_audio_path)
        
        if not transcribed_text:
            return ChatResponse(
                response="I couldn't understand the audio. Could you please try again?",
                response_type="text",
                session_id=session_id,
                audio_url=None
            )
        
        # Process the transcribed message
        chat_message = ChatMessage(
            message=transcribed_text,
            message_type="voice",
            session_id=session_id
        )
        
        return await chatbot_interaction(chat_message)
        
    except Exception as e:
        logger.error(f"Error processing voice upload: {e}")
        raise HTTPException(status_code=500, detail=f"Voice processing error: {str(e)}")



async def get_company_info_fallback(company_name: str):
    """Fallback method with mock data when sustainability system is unavailable"""
    mock_analysis_summary = {
        "overall_sustainability_sentiment": "Neutral",
        "sentiment_score": 65.0,
        "key_themes_count": 3,
        "certifications_verified": 2,
        "certifications_checked": 4,
        "certification_rate": 50.0
    }
    
    mock_news_analysis = {
        "overall_sentiment": "Neutral",
        "sentiment_score": 65.0,
        "key_findings": [
            {"theme": "Packaging Innovation", "summary": "Company investing in sustainable packaging solutions", "source_count": 2},
            {"theme": "Carbon Footprint", "summary": "Initiatives to reduce manufacturing emissions", "source_count": 1}
        ]
    }
    
    mock_certifications = [
        {
            "material_or_practice": "Packaging",
            "certification_found": "FSC Certified",
            "status": "Verified",
            "credibility": "High",
            "summary": "Forest Stewardship Council certification for packaging materials"
        },
        {
            "material_or_practice": "Manufacturing",
            "certification_found": "ISO 14001",
            "status": "Verified", 
            "credibility": "High",
            "summary": "Environmental Management System certification"
        }
    ]
    
    return CompanyInfoResponse(
        success=True,
        company_name=company_name,
        analysis_summary=mock_analysis_summary,
        news_analysis=mock_news_analysis,
        certification_analysis=mock_certifications,
        evidence_based_summary="Fallback analysis: Company shows moderate commitment to sustainability with verified certifications in packaging and manufacturing processes.",
        sustainability_score=65.0,
        certifications=["FSC Certified", "ISO 14001"],
        message=f"Retrieved sustainability analysis for {company_name} (using fallback data due to system unavailability)"
    )
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)