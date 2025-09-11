"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ExternalLink, X, Star, ShoppingCart, TrendingUp, Shield } from 'lucide-react';

interface UrlInputProps {
  onSubmit?: (url: string) => void;
}

interface ProductReport {
  name: string;
  category: string;
  avgRating: number;
  priceRange: string;
  popularBrands: string[];
  keyFeatures: string[];
  pros: string[];
  cons: string[];
  buyingTips: string[];
}

export default function UrlInput({ onSubmit }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [validatedUrl, setValidatedUrl] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [productReport, setProductReport] = useState<ProductReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const isValidUrl = validateUrl(url);
    setIsValid(isValidUrl);
    
    if (isValidUrl) {
      setValidatedUrl(url);
      if (onSubmit) {
        onSubmit(url);
      }
      // Call backend proxy then eco-score and redirect
      void handleUrlFlow(url);
    } else if (url.trim() && !isValidUrl) {
      // If it's not a valid URL but has content, treat it as a product search
      generateProductReport(url.trim());
    }
  };

  const validateUrl = (inputUrl: string) => {
    try {
      new URL(inputUrl);
      return true;
    } catch {
      return false;
    }
  };

  const generateProductReport = async (productName: string) => {
    setIsGeneratingReport(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate mock report based on product name
    const report = generateMockReport(productName);
    setProductReport(report);
    setShowReport(true);
    setIsGeneratingReport(false);
  };

  const generateMockReport = (productName: string): ProductReport => {
    const name = productName.toLowerCase();
    
    // Basic categorization based on keywords
    let category = 'General Product';
    let features = ['Quality materials', 'User-friendly design'];
    let pros = ['Good value for money', 'Reliable performance'];
    let cons = ['Limited color options', 'May require maintenance'];
    let brands = ['Brand A', 'Brand B', 'Brand C'];
    let priceRange = '$20 - $100';

    if (name.includes('perfume') || name.includes('fragrance')) {
      category = 'Fragrance & Beauty';
      features = ['Long-lasting scent', 'Premium ingredients', 'Elegant packaging'];
      pros = ['Unique fragrance notes', 'Good longevity', 'Attractive bottle design'];
      cons = ['Price can be high', 'Scent may not suit everyone', 'Limited availability'];
      brands = ['Plum', 'Nykaa', 'Forest Essentials', 'The Body Shop'];
      priceRange = '$15 - $80';
    } else if (name.includes('phone') || name.includes('mobile')) {
      category = 'Electronics & Technology';
      features = ['High-resolution display', 'Fast processor', 'Good camera quality'];
      pros = ['Excellent performance', 'Great camera', 'Long battery life'];
      cons = ['Can be expensive', 'May heat up during heavy use', 'Storage limitations'];
      brands = ['Apple', 'Samsung', 'OnePlus', 'Xiaomi'];
      priceRange = '$200 - $1200';
    } else if (name.includes('laptop') || name.includes('computer')) {
      category = 'Computers & Laptops';
      features = ['Fast SSD storage', 'Powerful processor', 'Full HD display'];
      pros = ['Great performance', 'Portable design', 'Good build quality'];
      cons = ['Battery life could be better', 'Can get warm', 'Limited ports'];
      brands = ['Dell', 'HP', 'Lenovo', 'MacBook'];
      priceRange = '$400 - $2000';
    } else if (name.includes('shoe') || name.includes('sneaker')) {
      category = 'Fashion & Footwear';
      features = ['Comfortable cushioning', 'Durable materials', 'Stylish design'];
      pros = ['Comfortable fit', 'Good support', 'Versatile styling'];
      cons = ['May require break-in period', 'Sizing can vary', 'Price for premium brands'];
      brands = ['Nike', 'Adidas', 'Puma', 'Reebok'];
      priceRange = '$50 - $200';
    }

    return {
      name: productName,
      category,
      avgRating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 to 5.0
      priceRange,
      popularBrands: brands,
      keyFeatures: features,
      pros,
      cons,
      buyingTips: [
        'Compare prices across multiple platforms',
        'Read user reviews and ratings',
        'Check for warranty and return policy',
        'Look for seasonal discounts and offers'
      ]
    };
  };

  const handleInputClick = () => {
    if (validatedUrl) {
      setUrl(validatedUrl);
    }
  };

  const handleViewLink = () => {
    if (validatedUrl) {
      window.open(validatedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const closeReport = () => {
    setShowReport(false);
    setProductReport(null);
  };

  const handleUrlFlow = async (productUrl: string) => {
    try {
      setIsGeneratingReport(true);
      // 1) Call backend proxy for ML get_url
      const srcResp = await fetch(`http://localhost:5001/api/get_url?url=${encodeURIComponent(productUrl)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      let srcData: any = null;
      if (!srcResp.ok) {
        const errText = await srcResp.text().catch(() => '');
        console.error('URL proxy upstream error:', srcResp.status, errText);
        throw new Error(`Failed to fetch URL source (${srcResp.status})`);
      } else {
        // Try parsing JSON, fallback to text for debugging
        const text = await srcResp.text();
        try {
          srcData = JSON.parse(text);
        } catch {
          console.error('URL proxy returned non-JSON body:', text?.slice(0, 300));
          throw new Error('URL proxy returned non-JSON body');
        }
      }

      // 2) Build payload for eco-score using ML response
      const product = srcData?.product || {};

      const sanitizeSimple = (value: any, fallback: string): string => {
        const text = typeof value === 'string' ? value : fallback;
        return text
          .replace(/[\r\n\t]+/g, ' ')
          .replace(/[\u2022\u25CF\u00B7\u2027\u2219]/g, ' ') // bullets
          .replace(/[()]/g, '') // remove parentheses to avoid regex issues upstream
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 300);
      };

      const sanitizeIngredients = (value: any): string => {
        const text = typeof value === 'string' ? value : '';
        return text
          .replace(/[\r\n\t]+/g, ' ')
          .replace(/[\u2022\u25CF\u00B7\u2027\u2219]/g, ' ')
          .replace(/[()]/g, '')
          .replace(/[^A-Za-z0-9,.;:\-\s]/g, ' ') // keep basic punctuation
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 2000);
      };

      const ecoPayload = {
        product_name: sanitizeSimple(product.product_name || product.source?.url?.extracted_name, 'Unknown Product'),
        brand: sanitizeSimple(product.brand, 'Unknown Brand'),
        category: sanitizeSimple(product.category, 'Personal Care'),
        weight: sanitizeSimple(product.weight, 'Unknown'),
        packaging_type: sanitizeSimple(product.packaging_type, 'Plastic Bottle'),
        ingredient_list: sanitizeIngredients(product.ingredients),
        latitude: product.latitude ?? 12.9716,
        longitude: product.longitude ?? 77.5946,
        usage_frequency: sanitizeSimple(product.usage_frequency, 'daily'),
        manufacturing_loc: sanitizeSimple(product.manufacturing_location, 'Mumbai')
      };

      const ecoResp = await fetch('http://localhost:5001/api/get-eco-score-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ecoPayload)
      });
      let ecoScoreData: any = null;
      if (!ecoResp.ok) {
        const errText = await ecoResp.text().catch(() => '');
        console.error('Eco-score proxy upstream error:', ecoResp.status, errText);
        throw new Error(`Failed to compute eco-score (${ecoResp.status})`);
      } else {
        const text = await ecoResp.text();
        try {
          ecoScoreData = JSON.parse(text);
        } catch {
          console.error('Eco-score proxy returned non-JSON body:', text?.slice(0, 300));
          throw new Error('Eco-score proxy returned non-JSON body');
        }
      }

      // 3) Redirect to dashboard with query params (no images/folder)
      const queryParams = new URLSearchParams();
      queryParams.append('folder', 'external');
      queryParams.append('ecoScore', encodeURIComponent(JSON.stringify(ecoScoreData)));
      queryParams.append('labelData', encodeURIComponent(JSON.stringify({
        product_name: ecoPayload.product_name,
        brand: ecoPayload.brand,
        ingredients: ecoPayload.ingredient_list
      })));
      router.push(`/dashboard?${queryParams.toString()}`);
    } catch (e) {
      console.error('URL flow failed', e);
      alert((e as Error).message || 'URL flow failed');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center w-full">
        <div className="w-full max-w-lg">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Paste product URL or enter product name (e.g., 'Plum perfume')"
              className={`w-full text-black pl-10 pr-4 py-2 border ${isValid ? 'border-green-300' : 'border-red-500'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer`}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setIsValid(true);
              }}
              onClick={handleInputClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit(e);
                }
              }}
            />
          </div>
          {!isValid && (
            <p className="mt-1 text-sm text-red-500">Enter a valid URL or product name</p>
          )}
          
          {/* Display validated URL below input */}
          {validatedUrl && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-medium mb-2">Valid URL detected:</p>
              <p className="text-sm text-gray-700 break-all">{validatedUrl}</p>
              <button
                type="button"
                onClick={handleViewLink}
                className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
              >
                <ExternalLink className="h-4 w-4" />
                View Link
              </button>
            </div>
          )}
        </div>
        
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!url.trim() || isGeneratingReport}
          className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isGeneratingReport ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating Report...
            </>
          ) : (
            'Search'
          )}
        </button>
      </div>

      {/* Product Report Popup */}
      {showReport && productReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Product Report</h2>
              <button
                onClick={closeReport}
                className="p-1 hover:bg-gray-100 rounded-full transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{productReport.name}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{productReport.category}</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{productReport.avgRating}/5.0</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShoppingCart className="h-4 w-4 text-green-600" />
                    <span>{productReport.priceRange}</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Popular Brands
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {productReport.popularBrands.map((brand, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                          {brand}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Key Features</h4>
                    <ul className="space-y-1">
                      {productReport.keyFeatures.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-green-700 mb-2">Pros</h4>
                    <ul className="space-y-1">
                      {productReport.pros.map((pro, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-red-700 mb-2">Cons</h4>
                    <ul className="space-y-1">
                      {productReport.cons.map((con, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-red-600 mt-1">✗</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Buying Tips
                </h4>
                <ul className="space-y-1">
                  {productReport.buyingTips.map((tip, index) => (
                    <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                      <span className="text-blue-600 mt-1">💡</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}