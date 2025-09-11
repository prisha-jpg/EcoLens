'use client';

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  AlertCircle,
  Award,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  Droplet,
  Leaf,
  Recycle,
  ThumbsUp,
} from "lucide-react";

interface ProductData {
  name: string;
  brand: string;
  efsScore: number;
  carbonFootprint: {
    score: string;
    equivalent: string;
    value: number;
  };
  recyclability: {
    score: string;
    percentage: number;
    value: number;
  };
  waterUsage: {
    score: string;
    description: string;
    value: number;
  };
  ingredients: {
    score: string;
    description: string;
    value: number;
    rawIngredients?: string;
  };
  alerts: {
    type: string;
    message: string;
  }[];
  disposal: string;
  alternatives: {
    name: string;
    brand: string;
    efsScore: number;
    improvement: number;
    benefits: string;
    rawData?: any;
  }[];
  categoryBreakdown: {
    name: string;
    value: number;
  }[];
  impactComparison: {
    name: string;
    water: number;
    carbon: number;
    waste: number;
  }[];
  ingredientEmissions?: {
    [ingredient: string]: {
      emission_kg_co2e: number;
      proportion: number;
    };
  };
}

interface ComparisonData {
  product1: ProductData;
  product2: ProductData;
  comparison: {
    winner: string;
    score_difference: number;
    key_differences: string[];
    recommendations: string[];
  };
}

export default function CompareDashboardPage() {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Replace this with your actual ngrok URL
  const API_BASE_URL = "http://localhost:5001";

  const fetchProductData = async (folder: string): Promise<ProductData> => {
    try {
      // 1. Extract labels
      const extractLabelsResponse = await fetch(
        `${API_BASE_URL}/api/extract-labels`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder }),
        }
      );

      if (!extractLabelsResponse.ok) {
        throw new Error("Failed to extract labels");
      }

      const extractLabelsData = await extractLabelsResponse.json();

      // 2. Get eco-score
      const ecoScorePayload = {
        product_name:
          extractLabelsData.extractedData?.product_name || "Unknown Product",
        brand: extractLabelsData.extractedData?.brand || "Unknown Brand",
        category: "Personal Care",
        weight: "100ml",
        packaging_type: "Plastic Bottle",
        ingredient_list: extractLabelsData.extractedData?.ingredients || "",
        latitude: 12.9716,
        longitude: 77.5946,
        usage_frequency: "daily",
        manufacturing_loc:
          extractLabelsData.extractedData?.manufacturer_state || "Mumbai",
      };

      const ecoScoreResponse = await fetch(
        `${API_BASE_URL}/api/get-eco-score-proxy`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ecoScorePayload),
        }
      );

      if (!ecoScoreResponse.ok) {
        throw new Error("Failed to get eco-score");
      }

      const ecoScoreData = await ecoScoreResponse.json();

      // Transform API data into dashboard format
      const transformedData: ProductData = {
        name:
          extractLabelsData.extractedData?.product_name || "Unknown Product",
        brand: extractLabelsData.extractedData?.brand || "Unknown Brand",
        efsScore: Math.round(ecoScoreData?.lca_results?.eco_score || 0),
        carbonFootprint: {
          score: ecoScoreData?.lca_results?.eco_score <= 50 ? "Low" : "High",
          equivalent: `Equivalent to ${Math.round(
            ecoScoreData?.lca_results?.eco_score || 0
          )} km by car`,
          value: ecoScoreData?.lca_results?.eco_score || 0,
        },
        recyclability: {
          score: ecoScoreData?.recyclability_analysis?.overall_recyclable
            ? "Recyclable"
            : "Non-Recyclable",
          percentage: ecoScoreData?.recyclability_analysis
            ?.effective_recycling_rate
            ? 100
            : 0,
          value: ecoScoreData?.recyclability_analysis?.effective_recycling_rate
            ? 100
            : 0,
        },
        waterUsage: {
          score: ecoScoreData?.lca_results?.water_usage_liters 
            ? (ecoScoreData.lca_results.water_usage_liters < 5 ? "Low" : 
               ecoScoreData.lca_results.water_usage_liters < 15 ? "Medium" : "High")
            : "Medium",
          description: ecoScoreData?.lca_results?.water_usage_liters
            ? `${ecoScoreData.lca_results.water_usage_liters} liters used`
            : "40% less than average",
          value: ecoScoreData?.lca_results?.water_usage_liters || 60,
        },
        ingredients: {
          score: extractLabelsData.extractedData?.ingredients
            ? "Safe"
            : "Unknown",
          description: extractLabelsData.extractedData?.ingredients
            ? `${extractLabelsData.extractedData.ingredients.split(",").length
            } ingredients detected`
            : "No ingredient data",
          value: 85,
          rawIngredients: extractLabelsData.extractedData?.ingredients || "",
        },
        ingredientEmissions: ecoScoreData?.ingredient_emissions || {},
        alerts: [
          {
            type: "warning",
            message:
              "This product contains ingredients that may be harmful to aquatic life",
          },
        ],
        disposal: ecoScoreData?.recyclability_analysis?.packaging_recyclable
          ? "Recyclable"
          : "Not Recyclable",
        alternatives: [],
        categoryBreakdown: [
          {
            name: "Packaging",
            value: Math.round(ecoScoreData?.stage_percentages?.packaging || 0),
          },
          {
            name: "Ingredients",
            value: Math.round(
              ecoScoreData?.stage_percentages?.ingredients || 0
            ),
          },
          {
            name: "Manufacturing",
            value: Math.round(
              ecoScoreData?.stage_percentages?.manufacturing || 0
            ),
          },
          {
            name: "Transportation",
            value: Math.round(
              ecoScoreData?.stage_percentages?.transportation || 0
            ),
          },
        ],
        impactComparison: [
          {
            name: "Industry Average",
            water: 100,
            carbon: 100,
            waste: 100,
          },
          {
            name: "This Product",
            water: ecoScoreData?.lca_results?.water_usage_liters 
              ? Math.round((ecoScoreData.lca_results.water_usage_liters / 10) * 100) 
              : 60,
            carbon: ecoScoreData?.lca_results?.total_emissions_kg_co2e
              ? Math.round(
                ecoScoreData.lca_results.total_emissions_kg_co2e * 100
              )
              : 100,
            waste: ecoScoreData?.lca_results?.waste_generation_kg
              ? Math.round(ecoScoreData.lca_results.waste_generation_kg * 50)
              : 100 - (ecoScoreData?.recyclability_analysis?.effective_recycling_rate
                ? Math.round(
                  ecoScoreData.recyclability_analysis
                    .effective_recycling_rate * 100
                )
                : 0),
          },
          {
            name: "Best Practice",
            water: 40,
            carbon: ecoScoreData?.lca_results?.total_emissions_kg_co2e
              ? Math.round(
                ecoScoreData.lca_results.total_emissions_kg_co2e * 60
              )
              : 60,
            waste: 15,
          },
        ],
      };

      return transformedData;
    } catch (err) {
      console.error(`Error fetching data for ${folder}:`, err);
      throw err;
    }
  };

  const compareProducts = async () => {
    setIsComparing(true);
    setError(null);

    try {
      console.log("Starting product comparison...");

      // Fetch data for both products
      const [product1Data, product2Data] = await Promise.all([
        fetchProductData("product1"),
        fetchProductData("product2"),
      ]);

      console.log("Product 1 data:", product1Data);
      console.log("Product 2 data:", product2Data);

      // Prepare comparison payload
      const comparisonPayload = {
        product1: {
          product_name: product1Data.name,
          brand: product1Data.brand,
          category: "Personal Care",
          weight: "100ml",
          packaging_type: "Plastic Bottle",
          ingredient_list: product1Data.ingredients.rawIngredients || "",
          latitude: 12.9716,
          longitude: 77.5946,
          usage_frequency: "daily",
          manufacturing_loc: "Mumbai",
          eco_score: product1Data.efsScore,
          carbon_footprint: product1Data.carbonFootprint.value,
          water_usage: product1Data.waterUsage.value,
          recyclability: product1Data.recyclability.value,
        },
        product2: {
          product_name: product2Data.name,
          brand: product2Data.brand,
          category: "Personal Care",
          weight: "100ml",
          packaging_type: "Plastic Bottle",
          ingredient_list: product2Data.ingredients.rawIngredients || "",
          latitude: 12.9716,
          longitude: 77.5946,
          usage_frequency: "daily",
          manufacturing_loc: "Mumbai",
          eco_score: product2Data.efsScore,
          carbon_footprint: product2Data.carbonFootprint.value,
          water_usage: product2Data.waterUsage.value,
          recyclability: product2Data.recyclability.value,
        },
      };

      console.log("Comparison payload:", comparisonPayload);

      // Call comparison API
      const comparisonResponse = await fetch(
        `${API_BASE_URL}/api/compare-products`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(comparisonPayload),
        }
      );

      if (!comparisonResponse.ok) {
        throw new Error(`Failed to compare products: ${comparisonResponse.status}`);
      }

      const comparisonResult = await comparisonResponse.json();
      console.log("Comparison result:", comparisonResult);

      // Create comparison data structure
      const finalComparisonData: ComparisonData = {
        product1: product1Data,
        product2: product2Data,
        comparison: comparisonResult.data || {
          winner: product1Data.efsScore > product2Data.efsScore ? "product1" : "product2",
          score_difference: Math.abs(product1Data.efsScore - product2Data.efsScore),
          key_differences: [
            `Product 1 has ${product1Data.efsScore} EFS score vs Product 2's ${product2Data.efsScore}`,
            `Product 1 uses ${product1Data.waterUsage.value}L water vs Product 2's ${product2Data.waterUsage.value}L`,
            `Product 1 has ${product1Data.recyclability.percentage}% recyclability vs Product 2's ${product2Data.recyclability.percentage}%`,
          ],
          recommendations: [
            "Consider the product with higher EFS score for better environmental impact",
            "Check recyclability percentages for waste management",
            "Compare water usage for sustainability",
          ],
        },
      };

      setComparisonData(finalComparisonData);
    } catch (err) {
      console.error("Error comparing products:", err);
      setError(
        `Failed to compare products: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setIsComparing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if we have comparison data from localStorage first
    const storedData = localStorage.getItem("comparisonData");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setComparisonData(parsedData);
        setLoading(false);
        return;
      } catch (error) {
        console.error("Error parsing stored comparison data:", error);
      }
    }
    
    // If no stored data, fetch from API
    compareProducts();
  }, []);

  // Colors for charts
  const PRODUCT1_COLOR = "#3b82f6";
  const PRODUCT2_COLOR = "#ef4444";

  const getEfsScoreColor = (score: number) => {
    if (score < 30) return "bg-red-500";
    if (score < 50) return "bg-orange-500";
    if (score < 70) return "bg-yellow-500";
    if (score < 90) return "bg-green-500";
    return "bg-green-600";
  };

  const getEfsScoreText = (score: number) => {
    if (score < 30) return "Poor";
    if (score < 50) return "Fair";
    if (score < 70) return "Good";
    if (score < 90) return "Very Good";
    return "Excellent";
  };

  const getTrendIcon = (product1Value: number, product2Value: number) => {
    if (product1Value > product2Value) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (product1Value < product2Value) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  if (loading || isComparing) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-green-800">
            {isComparing ? "Comparing products..." : "Loading comparison dashboard..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Error Loading Comparison
          </h2>
          <p className="text-gray-600 mb-4">{error || (typeof window !== 'undefined' ? localStorage.getItem('comparisonError') : '')}</p>
          <button
            onClick={compareProducts}
            disabled={isComparing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {isComparing ? "Comparing..." : "Try Again"}
          </button>
        </div>
      </div>
    );
  }

  if (!comparisonData) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            No Comparison Data
          </h2>
          <p className="text-gray-600 mb-4">
            Please ensure both products are uploaded and analyzed.
          </p>
          <button
            onClick={compareProducts}
            disabled={isComparing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {isComparing ? "Comparing..." : "Start Comparison"}
          </button>
        </div>
      </div>
    );
  }

  const { product1, product2, comparison } = comparisonData;

  // Prepare data for comparison charts
  const comparisonChartData = [
    {
      metric: "EFS Score",
      product1: product1.efsScore,
      product2: product2.efsScore,
    },
    {
      metric: "Water Usage (L)",
      product1: product1.waterUsage.value,
      product2: product2.waterUsage.value,
    },
    {
      metric: "Carbon Footprint",
      product1: product1.carbonFootprint.value,
      product2: product2.carbonFootprint.value,
    },
    {
      metric: "Recyclability (%)",
      product1: product1.recyclability.percentage,
      product2: product2.recyclability.percentage,
    },
  ];

  const lifecycleComparisonData = [
    {
      stage: "Packaging",
      product1: product1.categoryBreakdown[0]?.value || 0,
      product2: product2.categoryBreakdown[0]?.value || 0,
    },
    {
      stage: "Ingredients",
      product1: product1.categoryBreakdown[1]?.value || 0,
      product2: product2.categoryBreakdown[1]?.value || 0,
    },
    {
      stage: "Manufacturing",
      product1: product1.categoryBreakdown[2]?.value || 0,
      product2: product2.categoryBreakdown[2]?.value || 0,
    },
    {
      stage: "Transportation",
      product1: product1.categoryBreakdown[3]?.value || 0,
      product2: product2.categoryBreakdown[3]?.value || 0,
    },
  ];

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-green-800">Product Comparison Dashboard</h1>
            <button
              onClick={compareProducts}
              disabled={isComparing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center"
            >
              {isComparing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Comparing...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Refresh Comparison
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4">
        {/* Winner Announcement */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Award className="h-8 w-8 text-yellow-500 mr-2" />
              <h2 className="text-2xl font-bold text-green-800">Comparison Winner</h2>
            </div>
            <div className={`inline-flex items-center px-6 py-3 rounded-full text-xl font-bold ${
              comparison.winner === "product1" 
                ? "bg-blue-100 text-blue-800" 
                : "bg-red-100 text-red-800"
            }`}>
              {comparison.winner === "product1" ? product1.name : product2.name}
              <span className="ml-2 text-sm font-normal">
                by {comparison.winner === "product1" ? product1.brand : product2.brand}
              </span>
            </div>
            <p className="text-gray-600 mt-2">
              Score difference: {comparison.score_difference} points
            </p>
          </div>
        </div>

        {/* Main Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product 1 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-blue-800 mb-2">{product1.name}</h3>
              <p className="text-gray-600">by {product1.brand}</p>
            </div>

            {/* EFS Score */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800">Environmental Footprint Score</h4>
                <span className="text-2xl font-bold text-blue-600">{product1.efsScore}</span>
              </div>
              <div className="h-4 w-full bg-gray-200 rounded-full">
                <div
                  className={`h-full rounded-full ${getEfsScoreColor(product1.efsScore)}`}
                  style={{ width: `${product1.efsScore}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">{getEfsScoreText(product1.efsScore)}</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center mb-1">
                  <Droplet className="h-4 w-4 text-blue-600 mr-1" />
                  <span className="text-sm font-medium text-blue-800">Water Usage</span>
                </div>
                <p className="text-lg font-bold text-blue-700">{product1.waterUsage.value}L</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex items-center mb-1">
                  <Leaf className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm font-medium text-green-800">Carbon Footprint</span>
                </div>
                <p className="text-lg font-bold text-green-700">{product1.carbonFootprint.value}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="flex items-center mb-1">
                  <Recycle className="h-4 w-4 text-purple-600 mr-1" />
                  <span className="text-sm font-medium text-purple-800">Recyclability</span>
                </div>
                <p className="text-lg font-bold text-purple-700">{product1.recyclability.percentage}%</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="flex items-center mb-1">
                  <Package className="h-4 w-4 text-orange-600 mr-1" />
                  <span className="text-sm font-medium text-orange-800">Disposal</span>
                </div>
                <p className="text-sm font-bold text-orange-700">{product1.disposal}</p>
              </div>
            </div>
          </div>

          {/* Product 2 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-red-800 mb-2">{product2.name}</h3>
              <p className="text-gray-600">by {product2.brand}</p>
            </div>

            {/* EFS Score */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800">Environmental Footprint Score</h4>
                <span className="text-2xl font-bold text-red-600">{product2.efsScore}</span>
              </div>
              <div className="h-4 w-full bg-gray-200 rounded-full">
                <div
                  className={`h-full rounded-full ${getEfsScoreColor(product2.efsScore)}`}
                  style={{ width: `${product2.efsScore}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">{getEfsScoreText(product2.efsScore)}</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center mb-1">
                  <Droplet className="h-4 w-4 text-blue-600 mr-1" />
                  <span className="text-sm font-medium text-blue-800">Water Usage</span>
                </div>
                <p className="text-lg font-bold text-blue-700">{product2.waterUsage.value}L</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex items-center mb-1">
                  <Leaf className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm font-medium text-green-800">Carbon Footprint</span>
                </div>
                <p className="text-lg font-bold text-green-700">{product2.carbonFootprint.value}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="flex items-center mb-1">
                  <Recycle className="h-4 w-4 text-purple-600 mr-1" />
                  <span className="text-sm font-medium text-purple-800">Recyclability</span>
                </div>
                <p className="text-lg font-bold text-purple-700">{product2.recyclability.percentage}%</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="flex items-center mb-1">
                  <Package className="h-4 w-4 text-orange-600 mr-1" />
                  <span className="text-sm font-medium text-orange-800">Disposal</span>
                </div>
                <p className="text-sm font-bold text-orange-700">{product2.disposal}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Side-by-Side Comparison Chart */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-green-700 mb-4">Key Metrics Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="product1" fill={PRODUCT1_COLOR} name={product1.name} />
                <Bar dataKey="product2" fill={PRODUCT2_COLOR} name={product2.name} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Lifecycle Stage Comparison */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-green-700 mb-4">Lifecycle Stage Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={lifecycleComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="product1" fill={PRODUCT1_COLOR} name={product1.name} />
                <Bar dataKey="product2" fill={PRODUCT2_COLOR} name={product2.name} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Comparison Table */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-xl font-bold text-green-700 mb-4">Detailed Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-800">Metric</th>
                  <th className="text-center py-3 px-4 font-semibold text-blue-800">{product1.name}</th>
                  <th className="text-center py-3 px-4 font-semibold text-red-800">{product2.name}</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-800">Winner</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium text-gray-800">EFS Score</td>
                  <td className="py-3 px-4 text-center font-semibold text-blue-600">{product1.efsScore}</td>
                  <td className="py-3 px-4 text-center font-semibold text-red-600">{product2.efsScore}</td>
                  <td className="py-3 px-4 text-center">
                    {getTrendIcon(product1.efsScore, product2.efsScore)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium text-gray-800">Water Usage (L)</td>
                  <td className="py-3 px-4 text-center font-semibold text-blue-600">{product1.waterUsage.value}</td>
                  <td className="py-3 px-4 text-center font-semibold text-red-600">{product2.waterUsage.value}</td>
                  <td className="py-3 px-4 text-center">
                    {getTrendIcon(product2.waterUsage.value, product1.waterUsage.value)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium text-gray-800">Carbon Footprint</td>
                  <td className="py-3 px-4 text-center font-semibold text-blue-600">{product1.carbonFootprint.value}</td>
                  <td className="py-3 px-4 text-center font-semibold text-red-600">{product2.carbonFootprint.value}</td>
                  <td className="py-3 px-4 text-center">
                    {getTrendIcon(product2.carbonFootprint.value, product1.carbonFootprint.value)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium text-gray-800">Recyclability (%)</td>
                  <td className="py-3 px-4 text-center font-semibold text-blue-600">{product1.recyclability.percentage}</td>
                  <td className="py-3 px-4 text-center font-semibold text-red-600">{product2.recyclability.percentage}</td>
                  <td className="py-3 px-4 text-center">
                    {getTrendIcon(product1.recyclability.percentage, product2.recyclability.percentage)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-800">Disposal Method</td>
                  <td className="py-3 px-4 text-center font-semibold text-blue-600">{product1.disposal}</td>
                  <td className="py-3 px-4 text-center font-semibold text-red-600">{product2.disposal}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-gray-500">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Raw comparison payload (full depth from API) */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-xl font-bold text-green-700 mb-4">Full Comparison Data (API)</h3>
          <pre className="max-h-96 overflow-auto text-xs bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-800">
{JSON.stringify((typeof window !== 'undefined' && JSON.parse(localStorage.getItem('comparisonData') || '{}')?.comparisonRaw) || comparison, null, 2)}
          </pre>
        </div>

        {/* Key Differences and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Key Differences */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-green-700 mb-4">Key Differences</h3>
            <div className="space-y-3">
              {comparison.key_differences.map((difference, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-gray-700">{difference}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-green-700 mb-4">Recommendations</h3>
            <div className="space-y-3">
              {comparison.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start">
                  <ThumbsUp className="h-4 w-4 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <p className="text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
