#!/usr/bin/env python3
"""
Sustainability Intelligence Agent System with Groq and Tavily
Enhanced with LCA Result Integration for automatic company analysis
"""

import json
import re
import requests
import os
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass, asdict
import time
from dotenv import load_dotenv

load_dotenv()

# Groq imports
from groq import Groq

# Tavily imports
from tavily import TavilyClient


# Data structures for agent outputs
@dataclass
class KeyFinding:
    theme: str
    summary: str
    source_count: int

@dataclass
class SourceArticle:
    title: str
    url: str
    publication: str

@dataclass
class NewsHunterOutput:
    overall_sentiment: str
    sentiment_score: float
    key_findings: List[KeyFinding]
    source_articles: List[SourceArticle]

@dataclass
class CertificationCheckerOutput:
    material_or_practice: str
    certification_found: str
    status: str
    credibility: str
    summary: str

@dataclass
class LCAProductInfo:
    product_name: str
    brand: str
    company_name: str
    total_emissions: float
    eco_score: float
    confidence: float
    packaging_type: str
    top_ingredients: List[str]
    stage_breakdown: Dict[str, float]

@dataclass
class CompanyAnalysisParams:
    company_name: str
    keywords: List[str]
    materials: List[str]
    product_context: str

class LCAResultParser:
    """
    Parser to extract product and company information from LCA results
    """
    
    def __init__(self, groq_key: str, groq_model: str = "llama-3.1-8b-instant"):
        self.groq_client = Groq(api_key=groq_key)
        self.model = groq_model
    
    def parse_lca_text(self, lca_text: str) -> LCAProductInfo:
        """
        Parse LCA result text and extract structured product information
        """
        # Extract basic info using regex patterns
        product_name = self._extract_product_name(lca_text)
        brand = self._extract_brand(lca_text)
        total_emissions = self._extract_total_emissions(lca_text)
        eco_score = self._extract_eco_score(lca_text)
        confidence = self._extract_confidence(lca_text)
        packaging_type = self._extract_packaging_type(lca_text)
        top_ingredients = self._extract_top_ingredients(lca_text)
        stage_breakdown = self._extract_stage_breakdown(lca_text)
        
        # Use LLM to determine company name from brand/product
        company_name = self._determine_company_name(product_name, brand)
        
        return LCAProductInfo(
            product_name=product_name,
            brand=brand,
            company_name=company_name,
            total_emissions=total_emissions,
            eco_score=eco_score,
            confidence=confidence,
            packaging_type=packaging_type,
            top_ingredients=top_ingredients,
            stage_breakdown=stage_breakdown
        )
    
    def _extract_product_name(self, text: str) -> str:
        """Extract product name from LCA text"""
        # Look for patterns like "LCA Results for Product Name" or "Product: Product Name"
        patterns = [
            r"LCA Results for (.+?)(?:\n|$)",
            r"Product:\s*(.+?)(?:\s*-\s*|\n|$)",
            r"## Product:\s*(.+?)(?:\s*-\s*|\n|$)"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return "Unknown Product"
    
    def _extract_brand(self, text: str) -> str:
        """Extract brand name from LCA text"""
        # Look for brand after product name with dash separator
        patterns = [
            r"Product:\s*.+?\s*-\s*(.+?)(?:\n|$)",
            r"LCA Results for .+?\s*-\s*(.+?)(?:\n|$)",
            r"## Product:\s*.+?\s*-\s*(.+?)(?:\n|$)"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return "Unknown Brand"
    
    def _extract_total_emissions(self, text: str) -> float:
        """Extract total emissions value"""
        pattern = r"Total Emissions:\s*([\d.]+)\s*kg CO2e"
        match = re.search(pattern, text, re.IGNORECASE)
        return float(match.group(1)) if match else 0.0
    
    def _extract_eco_score(self, text: str) -> float:
        """Extract eco score"""
        pattern = r"Eco Score:\s*([\d.]+)/100"
        match = re.search(pattern, text, re.IGNORECASE)
        return float(match.group(1)) if match else 0.0
    
    def _extract_confidence(self, text: str) -> float:
        """Extract confidence percentage"""
        pattern = r"Confidence:\s*([\d.]+)%"
        match = re.search(pattern, text, re.IGNORECASE)
        return float(match.group(1)) if match else 0.0
    
    def _extract_packaging_type(self, text: str) -> str:
        """Extract packaging type"""
        pattern = r"Plastic Type:\s*(.+?)(?:\n|$)"
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
        
        # Alternative pattern for packaging design
        pattern = r"Packaging Design:\s*(.+?)(?:\n|$)"
        match = re.search(pattern, text, re.IGNORECASE)
        return match.group(1).strip() if match else "Unknown Packaging"
    
    def _extract_top_ingredients(self, text: str) -> List[str]:
        """Extract top contributing ingredients"""
        ingredients = []
        # Look for numbered ingredient list
        pattern = r"\d+\.\s*\*\*(.+?)\*\*:"
        matches = re.findall(pattern, text)
        
        for match in matches[:10]:  # Top 10 ingredients
            # Clean up ingredient name
            ingredient = match.strip().replace("(", "").replace(")", "")
            ingredients.append(ingredient)
        
        return ingredients
    
    def _extract_stage_breakdown(self, text: str) -> Dict[str, float]:
        """Extract lifecycle stage breakdown"""
        stages = {}
        # Pattern for stage breakdown like "ingredients: 0.337 kg CO2e (29.2%)"
        pattern = r"(\w+):\s*([\d.]+)\s*kg CO2e\s*\(([\d.]+)%\)"
        matches = re.findall(pattern, text)
        
        for stage, emissions, percentage in matches:
            stages[stage] = float(emissions)
        
        return stages
    
    def _determine_company_name(self, product_name: str, brand: str) -> str:
        """
        Use LLM to determine the actual company name from product and brand
        """
        prompt = f"""Given this product information:
Product: {product_name}
Brand: {brand}

Determine the actual company name that manufactures this product. Consider:
- The brand might be the company name
- The brand might be owned by a larger parent company
- Look for well-known company relationships

Respond with ONLY the company name, nothing else. If uncertain, use the brand name.

Examples:
- Brand: Dove → Company: Unilever
- Brand: Pantene → Company: Procter & Gamble
- Brand: Ahava → Company: Ahava Dead Sea Laboratories
"""
        
        try:
            response = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are an expert on company brand relationships. Respond with only the company name."},
                    {"role": "user", "content": prompt}
                ],
                model=self.model,
                temperature=0.1,
                max_tokens=50
            )
            
            company_name = response.choices[0].message.content.strip()
            return company_name if company_name else brand
        except Exception as e:
            print(f"Error determining company name: {e}")
            return brand
    
    def generate_analysis_parameters(self, lca_info: LCAProductInfo) -> CompanyAnalysisParams:
        """
        Generate appropriate keywords and materials for sustainability analysis
        based on LCA results
        """
        prompt = f"""Based on this product LCA information, generate sustainability analysis parameters:

Product: {lca_info.product_name}
Brand: {lca_info.brand}
Company: {lca_info.company_name}
Packaging: {lca_info.packaging_type}
Top Ingredients: {', '.join(lca_info.top_ingredients[:5])}
Highest Impact Stage: {max(lca_info.stage_breakdown.items(), key=lambda x: x[1])[0] if lca_info.stage_breakdown else 'unknown'}

Generate analysis parameters in JSON format:
{{
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
  "materials": ["material1", "material2", "material3", "material4"],
  "product_context": "brief context about the product type and key sustainability concerns"
}}

Keywords should focus on: packaging, emissions, ingredients, manufacturing, sustainability initiatives
Materials should focus on: packaging materials, key ingredients, sourcing practices, certifications
"""
        
        try:
            response = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are an expert sustainability analyst. Generate relevant analysis parameters in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                model=self.model,
                temperature=0.2,
                max_tokens=400
            )
            
            content = response.choices[0].message.content
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                return CompanyAnalysisParams(
                    company_name=lca_info.company_name,
                    keywords=data.get("keywords", ["sustainability", "environmental", "packaging", "emissions"]),
                    materials=data.get("materials", ["Packaging", "Ingredients", "Manufacturing", "Sourcing"]),
                    product_context=data.get("product_context", f"{lca_info.product_name} sustainability analysis")
                )
            else:
                raise ValueError("No JSON found in response")
                
        except Exception as e:
            print(f"Error generating analysis parameters: {e}")
            # Fallback parameters
            return CompanyAnalysisParams(
                company_name=lca_info.company_name,
                keywords=["sustainability", "environmental", "packaging", "emissions"],
                materials=["Packaging", "Ingredients", "Manufacturing", "Sourcing"],
                product_context=f"{lca_info.product_name} sustainability analysis"
            )

class TavilySearchClient:
    """
    Client for Tavily search integration
    """
    
    def __init__(self, api_key: str):
        self.client = TavilyClient(api_key=api_key)

    def search_news(self, query: str, max_results: int = 5) -> List[Dict]:
        """
        Search for news articles using Tavily
        """
        try:
            response = self.client.search(
                query=query,
                search_depth="advanced",
                include_domains=["news", "media"],
                max_results=max_results,
                include_raw_content=True
            )
            
            articles = []
            for result in response.get("results", []):
                articles.append({
                    "title": result.get("title", ""),
                    "url": result.get("url", ""),
                    "publication": self._extract_domain(result.get("url", "")),
                    "content": result.get("content", ""),
                    "raw_content": result.get("raw_content", ""),
                    "score": result.get("score", 0.0)
                })
            return articles
            
        except Exception as e:
            print(f"Error searching news with Tavily: {e}")
            return []
    
    def search_general(self, query: str, max_results: int = 5) -> List[Dict]:
        """
        General web search using Tavily
        """
        try:
            response = self.client.search(
                query=query,
                search_depth="advanced",
                max_results=max_results,
                include_raw_content=True
            )
            
            results = []
            for result in response.get("results", []):
                results.append({
                    "title": result.get("title", ""),
                    "url": result.get("url", ""),
                    "snippet": result.get("content", ""),
                    "source": self._extract_domain(result.get("url", "")),
                    "score": result.get("score", 0.0),
                    "raw_content": result.get("raw_content", "")
                })
            return results
            
        except Exception as e:
            print(f"Error searching with Tavily: {e}")
            return []
    
    def _extract_domain(self, url: str) -> str:
        """Extract domain name from URL"""
        try:
            from urllib.parse import urlparse
            return urlparse(url).netloc
        except:
            return "Unknown"

class NewsHunterAgent:
    """
    News Hunter Agent for finding and analyzing sustainability-related news using Tavily and Groq
    """
    
    def __init__(self, tavily_key: str, groq_key: str, groq_model: str = "llama-3.1-8b-instant"):
        self.search_client = TavilySearchClient(tavily_key)
        self.groq_client = Groq(api_key=groq_key)
        self.model = groq_model
    
    def search_news(self, company_name: str, keywords: List[str]) -> List[Dict]:
        """
        Search for news articles using Tavily
        """
        articles = []
        
        base_queries = [
            f"{company_name} sustainability",
            f"{company_name} environmental",
            f"{company_name} ESG"
        ]
        
        for keyword in keywords:
            base_queries.append(f"{company_name} {keyword} sustainability")
            base_queries.append(f"{company_name} {keyword} environmental")
        
        print(f"🔍 Searching news with {len(base_queries)} queries...")
        
        unique_articles_map = {}
        for query in base_queries[:5]:
            print(f"   Searching: {query}")
            query_articles = self.search_client.search_news(query, max_results=5)
            for article in query_articles:
                if article.get('url'):
                    unique_articles_map[article['url']] = article
            time.sleep(0.5)
        
        return list(unique_articles_map.values())[:15]
    
    def analyze_sentiment(self, articles: List[Dict]) -> tuple:
        """Analyze sentiment of collected articles using Groq."""
        if not articles:
            return "Neutral", 50.0
        
        combined_text = "\n\n".join([
            f"Title: {article['title']}\nContent: {article.get('content', article.get('snippet', ''))}"
            for article in articles[:10]
        ])
        
        prompt = f"""Analyze the sentiment of these news articles about a company's sustainability practices.

Articles:
{combined_text}

Respond with ONLY a JSON object in this exact format:
{{
  "sentiment": "[Positive/Neutral/Negative]",
  "score": [number between 0-100]
}}
"""
        try:
            response = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are an expert analyst focused on sustainability sentiment analysis. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                model=self.model,
                temperature=0.1,
                max_tokens=200
            )
            
            content = response.choices[0].message.content
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                return data.get("sentiment", "Neutral"), float(data.get("score", 50.0))
            raise ValueError("No JSON object found")
        except Exception as e:
            print(f"Error parsing sentiment JSON from Groq, falling back. Error: {e}")
            return "Neutral", 50.0
    
    def extract_key_findings(self, articles: List[Dict], keywords: List[str]) -> List[KeyFinding]:
        """Extract key findings from articles using Groq."""
        if not articles: 
            return []
        
        combined_text = "\n\n".join([
            f"Title: {article['title']}\nContent: {article.get('content', article.get('snippet', ''))}"
            for article in articles[:10]
        ])
        
        prompt = f"""From the provided articles, extract up to 5 key sustainability themes. Focus on: {', '.join(keywords)}.

Articles:
{combined_text}

Respond with ONLY a JSON object containing a list called "findings". Format:
{{
  "findings": [
    {{"theme": "Theme Name", "summary": "Brief summary.", "source_count": 1}}
  ]
}}
"""
        try:
            response = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are an expert analyst focused on extracting sustainability themes. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                model=self.model,
                temperature=0.1,
                max_tokens=800
            )
            
            content = response.choices[0].message.content
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                return [KeyFinding(**f) for f in data.get("findings", []) if f.get("theme")]
            raise ValueError("No JSON object found")
        except Exception as e:
            print(f"Error parsing key findings JSON from Groq: {e}")
            return []

    def hunt_news(self, company_name: str, keywords: List[str]) -> Tuple[NewsHunterOutput, List[Dict]]:
        """Main method to hunt and analyze news, returns processed output and raw articles."""
        print(f"🔍 Hunting news for {company_name} with keywords: {keywords}")
        articles = self.search_news(company_name, keywords)
        print(f"   Found {len(articles)} unique articles")
        
        sentiment, score = self.analyze_sentiment(articles)
        print(f"   Sentiment: {sentiment} (Score: {score})")
        
        findings = self.extract_key_findings(articles, keywords)
        print(f"   Extracted {len(findings)} key findings")
        
        source_articles = [
            SourceArticle(title=a['title'], url=a['url'], publication=a['publication']) for a in articles
        ]
        
        hunter_output = NewsHunterOutput(
            overall_sentiment=sentiment, sentiment_score=score,
            key_findings=findings, source_articles=source_articles
        )
        return hunter_output, articles

class CertificationCheckerAgent:
    """
    Certification Checker Agent using Tavily to verify sustainability certifications
    """
    
    def __init__(self, tavily_key: str, groq_key: str, groq_model: str = "llama-3.1-8b-instant"):
        self.search_client = TavilySearchClient(tavily_key)
        self.groq_client = Groq(api_key=groq_key)
        self.model = groq_model
        self.certification_keywords = {
            "Packaging": ["packaging", "fsc", "greenpro", "ecomark", "recyclable", "biodegradable"],
            "Cosmetic": ["cosmetic", "ayush", "cruelty free", "organic", "natural", "paraben free"],
            "Food": ["food", "fssai", "agmark", "organic india", "natural", "millets"],
            "Textiles": ["textile", "handloom", "craftmark", "silk mark", "khadi", "gots"],
        }
    
    def _find_material_category(self, material_or_practice: str) -> str:
        """Find the best matching material category from our keyword database."""
        material_lower = material_or_practice.lower()
        for category, keywords in self.certification_keywords.items():
            if any(keyword in material_lower for keyword in keywords): 
                return category
        return material_or_practice

    def search_certifications(self, company_name: str, material_or_practice: str) -> List[Dict]:
        """Search for certification information using Tavily general search."""
        category = self._find_material_category(material_or_practice)
        queries = [
            f'"{company_name}" "{material_or_practice}" certification',
            f'"{company_name}" {category} sustainability report',
        ]
        results = []
        unique_urls = set()
        for query in queries:
            print(f"   Searching certification: {query}")
            for result in self.search_client.search_general(query, max_results=5):
                if result.get("url") and result["url"] not in unique_urls:
                    results.append(result)
                    unique_urls.add(result["url"])
            time.sleep(0.5)
        return results
    
    def analyze_certification_results(self, company_name: str, material_or_practice: str, search_results: List[Dict]) -> Dict:
        """Analyze search results to determine certification status using Groq."""
        if not search_results:
            return {"found": False, "certification": "None Found", "summary": "No information found.", "credibility": "Low"}
        
        combined_text = "\n\n".join([f"Title: {r['title']}\nSnippet: {r['snippet']}" for r in search_results[:10]])
        prompt = f"""Analyze these search results for {company_name} regarding {material_or_practice}.
Search Results:
{combined_text}

Respond with ONLY a JSON object in this format:
{{
  "found": [true/false],
  "certification": "Name of certification, or 'None Found'",
  "credibility": "[High/Medium/Low]",
  "summary": "Brief explanation."
}}
"""
        try:
            response = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are an expert analyst focused on sustainability certifications. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                model=self.model,
                temperature=0.1,
                max_tokens=400
            )
            
            content = response.choices[0].message.content
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match: 
                return json.loads(json_match.group())
            raise ValueError("No JSON object found")
        except Exception as e:
            print(f"Error parsing certification JSON from Groq: {e}")
            return {"found": False, "certification": "None Found", "summary": "Analysis error.", "credibility": "Low"}

    def check_certification(self, company_name: str, material_or_practice: str) -> CertificationCheckerOutput:
        print(f"🔍 Checking certifications for {company_name} - {material_or_practice}")
        search_results = self.search_certifications(company_name, material_or_practice)
        print(f"   Found {len(search_results)} unique search results")
        analysis = self.analyze_certification_results(company_name, material_or_practice, search_results)
        return CertificationCheckerOutput(
            material_or_practice=material_or_practice,
            certification_found=analysis.get("certification", "None Found"),
            status="Verified" if analysis.get("found") else "Not Found",
            credibility=analysis.get("credibility", "Low"),
            summary=analysis.get("summary", "Analysis incomplete.")
        )

class SustainabilityIntelligenceSystem:
    """
    Main system combining both agents with Groq and Tavily integration
    Enhanced with LCA result processing
    """
    
    def __init__(self, tavily_key: str, groq_key: str, groq_model: str = "llama-3.1-8b-instant"):
        self.lca_parser = LCAResultParser(groq_key, groq_model)
        self.news_hunter = NewsHunterAgent(tavily_key, groq_key, groq_model)
        self.cert_checker = CertificationCheckerAgent(tavily_key, groq_key, groq_model)
        self.groq_client = Groq(api_key=groq_key)
        self.model = groq_model
    
    def analyze_from_lca_results(self, lca_text: str) -> Dict:
        """
        Analyze company sustainability based on LCA results
        """
        print("🔬 Parsing LCA results...")
        lca_info = self.lca_parser.parse_lca_text(lca_text)
        
        print(f"📋 Extracted Product Info:")
        print(f"   Product: {lca_info.product_name}")
        print(f"   Brand: {lca_info.brand}")
        print(f"   Company: {lca_info.company_name}")
        print(f"   Emissions: {lca_info.total_emissions} kg CO2e")
        print(f"   Eco Score: {lca_info.eco_score}/100")
        
        print("🎯 Generating analysis parameters...")
        analysis_params = self.lca_parser.generate_analysis_parameters(lca_info)
        
        print(f"📊 Analysis Parameters:")
        print(f"   Company: {analysis_params.company_name}")
        print(f"   Keywords: {analysis_params.keywords}")
        print(f"   Materials: {analysis_params.materials}")
        
        # Perform comprehensive analysis
        return self.analyze_company(
            analysis_params.company_name,
            analysis_params.keywords,
            analysis_params.materials,
            lca_context=lca_info,
            product_context=analysis_params.product_context
        )
    
    def analyze_company(self, company_name: str, keywords: List[str], 
                       materials: List[str], lca_context: Optional[LCAProductInfo] = None,
                       product_context: str = "") -> Dict:
        """Comprehensive analysis of a company's sustainability practices"""
        print(f"🚀 Starting comprehensive analysis for {company_name}")
        
        # Get news analysis with raw articles
        news_results, raw_articles = self.news_hunter.hunt_news(company_name, keywords)
        
        cert_results = [self.cert_checker.check_certification(company_name, m) for m in materials]
        
        # Generate evidence-based qualitative summary
        print("📝 Generating evidence-based qualitative summary...")
        evidence_summary = self._parse_analysis_with_evidence(raw_articles, company_name)
        
        analysis = {
            "company_name": company_name,
            "analysis_date": datetime.now().isoformat(),
            "product_context": product_context,
            "news_analysis": asdict(news_results),
            "certification_analysis": [asdict(cert) for cert in cert_results],
            "executive_summary": self._generate_summary(news_results, cert_results),
            "evidence_based_summary": evidence_summary
        }
        
        # Add LCA context if provided
        if lca_context:
            analysis["lca_context"] = asdict(lca_context)
            analysis["lca_sustainability_correlation"] = self._correlate_lca_with_sustainability(
                lca_context, news_results, cert_results
            )
        
        return analysis
    
    def _correlate_lca_with_sustainability(self, lca_info: LCAProductInfo, 
                                         news_results: NewsHunterOutput,
                                         cert_results: List[CertificationCheckerOutput]) -> Dict:
        """
        Correlate LCA results with sustainability analysis findings
        """
        prompt = f"""Analyze the correlation between LCA results and sustainability practices:

LCA Results:
- Product: {lca_info.product_name}
- Total Emissions: {lca_info.total_emissions} kg CO2e
- Eco Score: {lca_info.eco_score}/100
- Highest Impact Stage: {max(lca_info.stage_breakdown.items(), key=lambda x: x[1])[0] if lca_info.stage_breakdown else 'unknown'}
- Packaging: {lca_info.packaging_type}

Sustainability Sentiment: {news_results.overall_sentiment} ({news_results.sentiment_score}/100)

Key Findings: {[f.theme for f in news_results.key_findings]}

Certifications Found: {len([c for c in cert_results if c.status == 'Verified'])}/{len(cert_results)}

Provide correlation analysis in JSON format:
{{
  "alignment_score": [0-100],
  "key_correlations": ["correlation1", "correlation2"],
  "gaps_identified": ["gap1", "gap2"],
  "recommendations": ["rec1", "rec2"]
}}
"""
        
        try:
            response = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are an expert sustainability analyst. Provide correlation analysis in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                model=self.model,
                temperature=0.2,
                max_tokens=600
            )
            
            content = response.choices[0].message.content
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                raise ValueError("No JSON found in response")
                
        except Exception as e:
            print(f"Error generating LCA correlation: {e}")
            return {
                "alignment_score": 50,
                "key_correlations": ["Analysis unavailable"],
                "gaps_identified": ["Analysis unavailable"],
                "recommendations": ["Analysis unavailable"]
            }
    
    def _parse_analysis_with_evidence(self, search_results: List[Dict], brand_name: str) -> str:
        """Filters search results for sustainability content and generates a qualitative summary."""
        combined_content = ""
        
        for result in search_results:
            title = result.get("title", "")
            snippet = result.get("content", "")
            link = result.get("url", "")

            skip_domains = [
                "ndtv.com", "republicworld.com", "news18.com", "indiatoday.in", "opindia.com",
                "zeenews.india.com", "timesofindia.indiatimes.com", "hindustantimes.com",
            ]
            if any(skip in link for skip in skip_domains):
                continue

            ban_keywords = [
                "modi", "bjp", "congress", "election", "parliament", "arrest", "raid",
                "court", "police", "scam", "graft", "investigation", "protest", "riots",
                "boycott", "controversy", "ban", "sedition", "misleading ad"
            ]
            snippet_text = (title + " " + snippet).lower()
            if any(word in snippet_text for word in ban_keywords):
                continue

            combined_content += f"Title: {title}\nSnippet: {snippet}\nLink: {link}\n\n"

        if not combined_content.strip():
            return "No relevant, non-political sustainability information found in news search."

        prompt = (
            f"You are an expert analyst focused on corporate sustainability in India.\n"
            f"From the content below, extract ONLY information about:\n"
            f"- Sustainability certifications (Indian and global)\n"
            f"- Environmental claims: packaging, ingredients, carbon neutrality, plastic use\n"
            f"- Green initiatives, renewable energy, eco-labels, water conservation\n"
            f"⚠️ IMPORTANT: Do NOT mention anything political, legal, regulatory, or unrelated to environmental sustainability.\n\n"
            f"Brand: {brand_name}\n\n"
            f"---\n{combined_content}\n---\n"
            f"Summarize your findings as bullet points. For each point, cite the source URL."
            f"Example: - Company launched a 'plastic neutral' initiative for its packaging. (URL: https://...)"
        )
        
        try:
            response = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are an expert sustainability analyst. Focus only on environmental and sustainability topics."},
                    {"role": "user", "content": prompt}
                ],
                model=self.model,
                temperature=0.1,
                max_tokens=1000
            )
            
            content = response.choices[0].message.content
            return content or "No specific sustainability-related insights could be extracted."
        except Exception as e:
            print(f"Error generating evidence summary: {e}")
            return "Could not generate evidence-based summary due to an error."

    def _generate_summary(self, news_results: NewsHunterOutput, cert_results: List[CertificationCheckerOutput]) -> Dict:
        """Generate quantitative executive summary"""
        verified_certs = len([cert for cert in cert_results if cert.status == "Verified"])
        total_certs_checked = len(cert_results)
        
        return {
            "overall_sustainability_sentiment": news_results.overall_sentiment,
            "sentiment_score": news_results.sentiment_score,
            "key_themes_count": len(news_results.key_findings),
            "certifications_verified": verified_certs,
            "certifications_checked": total_certs_checked,
            "certification_rate": (verified_certs / total_certs_checked * 100) if total_certs_checked > 0 else 0
        }
    def analyze_from_company_product(self, company_name: str, product_name: str) -> Dict:
        """
        Analyze company sustainability based on company name and product name
        """
        print(f"🔍 Analyzing {company_name} - {product_name}")
        
        # Generate analysis parameters based on company and product
        print("🎯 Generating analysis parameters...")
        analysis_params = self._generate_analysis_params_from_product(company_name, product_name)
        
        print(f"📊 Analysis Parameters:")
        print(f"   Company: {analysis_params.company_name}")
        print(f"   Keywords: {analysis_params.keywords}")
        print(f"   Materials: {analysis_params.materials}")
        
        # Perform comprehensive analysis
        return self.analyze_company(
            analysis_params.company_name,
            analysis_params.keywords,
            analysis_params.materials,
            product_context=analysis_params.product_context
        )
    def _generate_analysis_params_from_product(self, company_name: str, product_name: str) -> CompanyAnalysisParams:
        """
        Generate appropriate keywords and materials for sustainability analysis
        based on company and product name
        """
        prompt = f"""Based on this company and product information, generate sustainability analysis parameters:

    Company: {company_name}
    Product: {product_name}

    Generate analysis parameters in JSON format:
    {{
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
    "materials": ["material1", "material2", "material3", "material4"],
    "product_context": "brief context about the product type and key sustainability concerns"
    }}

    Keywords should focus on: packaging, emissions, ingredients, manufacturing, sustainability initiatives
    Materials should focus on: packaging materials, key ingredients, sourcing practices, certifications

    Consider the product category (cosmetics, food, textiles, etc.) and generate relevant sustainability focus areas.
    """
        
        try:
            response = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are an expert sustainability analyst. Generate relevant analysis parameters in valid JSON format based on company and product."},
                    {"role": "user", "content": prompt}
                ],
                model=self.model,
                temperature=0.2,
                max_tokens=400
            )
            
            content = response.choices[0].message.content
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                return CompanyAnalysisParams(
                    company_name=company_name,
                    keywords=data.get("keywords", ["sustainability", "environmental", "packaging", "emissions"]),
                    materials=data.get("materials", ["Packaging", "Ingredients", "Manufacturing", "Sourcing"]),
                    product_context=data.get("product_context", f"{product_name} sustainability analysis")
                )
            else:
                raise ValueError("No JSON found in response")
                
        except Exception as e:
            print(f"Error generating analysis parameters: {e}")
            # Fallback parameters based on product type detection
            return self._get_fallback_params(company_name, product_name)

    def _get_fallback_params(self, company_name: str, product_name: str) -> CompanyAnalysisParams:
        """Fallback parameter generation based on product type detection"""
        product_lower = product_name.lower()
        
        if any(word in product_lower for word in ["soap", "shampoo", "cream", "lotion", "cosmetic"]):
            return CompanyAnalysisParams(
                company_name=company_name,
                keywords=["packaging", "ingredients", "cruelty-free", "natural"],
                materials=["Cosmetic Ingredients", "Packaging", "Chemical Safety", "Animal Testing"],
                product_context=f"{product_name} cosmetic sustainability analysis"
            )
        elif any(word in product_lower for word in ["food", "snack", "drink", "beverage"]):
            return CompanyAnalysisParams(
                company_name=company_name,
                keywords=["packaging", "organic", "sourcing", "supply chain"],
                materials=["Food Ingredients", "Packaging", "Organic Certification", "Supply Chain"],
                product_context=f"{product_name} food sustainability analysis"
            )
        else:
            return CompanyAnalysisParams(
                company_name=company_name,
                keywords=["sustainability", "environmental", "packaging", "emissions"],
                materials=["Packaging", "Ingredients", "Manufacturing", "Sourcing"],
                product_context=f"{product_name} sustainability analysis"
            )
def main():
    """Example usage of the Enhanced Sustainability Intelligence System"""
    tavily_key = os.getenv("TAVILY_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")
    
    if not tavily_key or not groq_key:
        print("⚠️  Please set your TAVILY_API_KEY and GROQ_API_KEY in environment variables.")
        return
    
    try:
        # Test Groq connection
        groq_client = Groq(api_key=groq_key)
        test_response = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": "Hello"}],
            model="llama-3.1-8b-instant",
            max_tokens=10
        )
        print("✅ Groq connection successful")
    except Exception as e:
        print(f"❌ Error connecting to Groq: {e}")
        return
    
    system = SustainabilityIntelligenceSystem(tavily_key, groq_key)
    
    # NEW: Simple company and product input
    company_name = "Ahava"  # or input("Enter company name: ")
    product_name = "Dead Sea Mud Soap"  # or input("Enter product name: ")
    
    try:
        print(f"🔬 Starting sustainability analysis for {company_name} - {product_name}...")
        results = system.analyze_from_company_product(company_name, product_name)
        
        # [Rest of the display code remains the same]
        print("\n" + "="*80)
        print(f"SUSTAINABILITY ANALYSIS REPORT: {company_name} - {product_name}")
        print("="*80)
        
        # [Continue with existing display logic...]
        
    except Exception as e:
        print(f"❌ An unexpected error occurred during analysis: {e}")

# Additional utility function for standalone LCA parsing
def parse_lca_only(lca_text: str, groq_key: str) -> Dict:
    """
    Utility function to parse LCA results without running full sustainability analysis
    """
    parser = LCAResultParser(groq_key)
    lca_info = parser.parse_lca_text(lca_text)
    analysis_params = parser.generate_analysis_parameters(lca_info)
    
    return {
        "lca_info": asdict(lca_info),
        "suggested_analysis_params": asdict(analysis_params)
    }

if __name__ == "__main__":
    main()