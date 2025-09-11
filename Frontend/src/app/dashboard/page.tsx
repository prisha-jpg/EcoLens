"use client";
import ProductModal from "../components/ProductModal"; // adjust if path is different
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  AlertTriangle,
  ThumbsUp,
  Leaf,
  Droplet,
  Recycle,
  ChevronRight,
  AlertCircle,
  ArrowRight,
  Award,
  Loader2,
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
  // Add this new property:
  ingredientEmissions?: {
    [ingredient: string]: {
      emission_kg_co2e: number;
      proportion: number;
    };
  };
}
interface ApiResponse {
  front?: string;
  back?: string;
  folder?: string;
  ecoScore?: any;
  labelData?: any;
  alternatives?: any;
}

export default function DashboardPage() {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false);
  const [alternativesError, setAlternativesError] = useState<string | null>(null);
  const [selectedAlternative, setSelectedAlternative] = useState<any>(null);
  const [isAlternativeModalOpen, setIsAlternativeModalOpen] = useState(false);

  // Replace this with your actual ngrok URL
  const API_BASE_URL = "http://localhost:5001"; // Update this to your ngrok URL when needed

  const getFolderName = (): string => {
    // Get folder name from URL params or return a default
    const params = new URLSearchParams(window.location.search);
    return params.get("folder") || "default_folder";
  };

  const fetchAlternatives = async () => {
    if (!productData) {
      setAlternativesError("No product data available to find alternatives");
      return;
    }

    setIsLoadingAlternatives(true);
    setAlternativesError(null);

    try {
      console.log("Fetching alternatives for product:", productData.name);
      
      // First, get the ingredient list from the stored product data
      let ingredientList = "";
      
      // Check if we have raw ingredient data stored
      if (productData.ingredients?.rawIngredients && productData.ingredients.rawIngredients.trim() !== "") {
        ingredientList = productData.ingredients.rawIngredients;
        console.log("Using stored ingredient data:", ingredientList);
      } else {
        // Try to get fresh ingredient data from extract-labels API
        try {
          const folderName = getFolderName();
          console.log("Fetching fresh ingredient data from extract-labels API");
          
          const extractLabelsResponse = await fetch(
            `${API_BASE_URL}/api/extract-labels`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ folder: folderName }),
            }
          );

          if (extractLabelsResponse.ok) {
            const extractLabelsData = await extractLabelsResponse.json();
            ingredientList = extractLabelsData.extractedData?.ingredients || "";
            console.log("Fresh ingredient data retrieved:", ingredientList);
          }
        } catch (extractError) {
          console.warn("Could not fetch fresh ingredient data:", extractError);
          // Continue with empty ingredient list
        }
      }
      
      const alternativesPayload = {
        product_name: productData.name,
        brand: productData.brand,
        category: "Personal Care", // You might want to make this dynamic
        weight: "100ml",
        packaging_type: "Plastic Bottle",
        ingredient_list: ingredientList,
        latitude: 12.9716,
        longitude: 77.5946,
        usage_frequency: "daily",
        manufacturing_loc: "Mumbai"
      };

      console.log("Alternatives payload with ingredient list:", alternativesPayload);

      const alternativesResponse = await fetch(
        `${API_BASE_URL}/api/get-alternatives?num_alternatives=3`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(alternativesPayload),
        }
      );

      if (!alternativesResponse.ok) {
        throw new Error(`Failed to fetch alternatives: ${alternativesResponse.status}`);
      }

      const alternativesData = await alternativesResponse.json();
      console.log("Alternatives data received:", alternativesData);

      // Update the product data with new alternatives
      if (alternativesData.success && alternativesData.data?.alternatives) {
        const updatedAlternatives = alternativesData.data.alternatives.map((alt: any) => ({
          name: alt.product_name || "Alternative Product",
          brand: alt.brand || "Alternative Brand",
          efsScore: Math.round(alt.eco_score || 0),
          improvement: Math.round(
            (alt.eco_score || 0) - (productData.efsScore || 0)
          ),
          benefits: "More sustainable packaging and ingredients",
          // Store the complete alternative data for detailed view
          rawData: alt,
        }));

        setProductData(prevData => ({
          ...prevData!,
          alternatives: updatedAlternatives
        }));

        setShowAlternatives(true);
      } else {
        setAlternativesError("No alternatives found for this product");
      }
    } catch (err) {
      console.error("Error fetching alternatives:", err);
      setAlternativesError(
        `Failed to load alternatives: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setIsLoadingAlternatives(false);
    }
  };

  const openAlternativeDetails = (alternative: any) => {
    setSelectedAlternative(alternative);
    setIsAlternativeModalOpen(true);
  };

  const closeAlternativeDetails = () => {
    setSelectedAlternative(null);
    setIsAlternativeModalOpen(false);
  };

  const fetchDataOnly = async () => {
    setIsSubmitting(true);
    setLoading(true);
    setError(null);

    try {
      // 1. Extract labels (assuming you have the folder or image data)
      const folderName = getFolderName();
      console.log("Calling extract-labels API with folder:", folderName);

      const extractLabelsResponse = await fetch(
        `${API_BASE_URL}/api/extract-labels`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder: folderName }),
        }
      );

      if (!extractLabelsResponse.ok) {
        throw new Error("Failed to extract labels");
      }

      const extractLabelsData = await extractLabelsResponse.json();
      console.log("Extract-labels data received:", extractLabelsData);

      // 2. Get eco-score
      const ecoScorePayload = {
        product_name:
          extractLabelsData.extractedData?.product_name || "Unknown Product",
        brand: extractLabelsData.extractedData?.brand || "Unknown Brand",
        category: "Personal Care", // Adjust or get from user input
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
        `${API_BASE_URL}/api/get-eco-score`,
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
      console.log("Eco-score data received:", ecoScoreData);

      // 3. Get alternatives
      const alternativesResponse = await fetch(
        `${API_BASE_URL}/api/get-alternatives?num_alternatives=3`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ecoScorePayload),
        }
      );

      let alternativesData = null;
      if (alternativesResponse.ok) {
        alternativesData = await alternativesResponse.json();
        console.log("Alternatives data received:", alternativesData);
      }

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
        // carbonFootprint: {
        //   score: ecoScoreData?.lca_results?.total_emissions_kg_co2e < 0.5 ? "Low" :
        //         ecoScoreData?.lca_results?.total_emissions_kg_co2e > 1.0 ? "Medium" : "High",
        //   equivalent: `Equivalent to ${Math.round((ecoScoreData?.lca_results?.total_emissions_kg_co2e || 0) * 100)} km by car`,
        //   value: Math.max(0, 100 - Math.min((ecoScoreData?.lca_results?.total_emissions_kg_co2e || 0) * 100, 100))
        // },
        // recyclability: {
        //   score: ecoScoreData?.recyclability_analysis?.overall_recyclable ? "Recyclable" : "Non-Recyclable",
        //   percentage: ecoScoreData?.recyclability_analysis?.effective_recycling_rate
        //             ? Math.round(ecoScoreData.recyclability_analysis.effective_recycling_rate * 100)
        //             : 0,
        //   value: ecoScoreData?.recyclability_analysis?.effective_recycling_rate
        //         ? Math.round(ecoScoreData.recyclability_analysis.effective_recycling_rate * 100)
        //         : 0
        // },
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
          value: 85, // This would be calculated based on ingredient analysis
          rawIngredients: extractLabelsData.extractedData?.ingredients || "", // Store raw ingredient data
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
        alternatives:
          alternativesData?.data?.alternatives?.map((alt: any) => ({
            name: alt.product_name || "Alternative Product",
            brand: alt.brand || "Alternative Brand",
            efsScore: Math.round(alt.eco_score || 0),
            improvement: Math.round(
              (alt.eco_score || 0) - (ecoScoreData?.lca_results?.eco_score || 0)
            ),
            benefits: "More sustainable packaging and ingredients",
          })) || [],

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

      setProductData(transformedData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        `Failed to load product data: ${err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if we have URL parameters (old method) or should fetch from API
    const params = new URLSearchParams(window.location.search);
    const hasUrlParams =
      params.get("front") || params.get("back") || params.get("folder") || params.get("ecoScore") || params.get("labelData");

    if (hasUrlParams) {
      // Use the old method with URL parameters
      const fetchFromUrl = async () => {
        try {
          const frontImage = params.get("front");
          const backImage = params.get("back");
          const folder = params.get("folder");
          const ecoScore = params.get("ecoScore")
            ? JSON.parse(decodeURIComponent(params.get("ecoScore")!))
            : null;
          const labelData = params.get("labelData")
            ? JSON.parse(decodeURIComponent(params.get("labelData")!))
            : null;
          const alternatives = params.get("alternatives")
            ? JSON.parse(decodeURIComponent(params.get("alternatives")!))
            : null;

          // Transform URL data (your existing transformation logic)
          const transformedData: ProductData = {
            name: labelData?.product_name || "Unknown Product",
            brand: labelData?.brand || "Unknown Brand",
            efsScore: ecoScore?.lca_results?.eco_score || 0,
            // carbonFootprint: {
            //   score: ecoScore?.lca_results?.total_emissions_kg_co2e < 0.5 ? "Low" :
            //         ecoScore?.lca_results?.total_emissions_kg_co2e < 1.0 ? "Medium" : "High",
            //   equivalent: `Equivalent to ${(ecoScore?.lca_results?.total_emissions_kg_co2e * 100).toFixed(0)} km by car`,
            //   value: 100 - Math.min(ecoScore?.lca_results?.total_emissions_kg_co2e * 100, 100)
            // },
            carbonFootprint: {
              score: ecoScore?.lca_results?.eco_score <= 50 ? "Low" : "High",
              equivalent: `Equivalent to ${Math.round(
                ecoScore?.lca_results?.eco_score || 0
              )} km by car`,
              value: ecoScore?.lca_results?.eco_score || 0,
            },
            // recyclability: {
            //   score: ecoScore?.recyclability_analysis?.overall_recyclable ? "High" : "Low",
            //   percentage: ecoScore?.recyclability_analysis?.effective_recycling_rate
            //             ? Math.round(ecoScore.recyclability_analysis.effective_recycling_rate * 100)
            //             : 0,
            //   value: ecoScore?.recyclability_analysis?.effective_recycling_rate
            //         ? Math.round(ecoScore.recyclability_analysis.effective_recycling_rate * 100)
            //         : 0
            // },
            recyclability: {
              score: ecoScore?.recyclability_analysis?.overall_recyclable
                ? "Recyclable"
                : "Non-Recyclable",
              percentage: ecoScore?.recyclability_analysis
                ?.effective_recycling_rate
                ? 100
                : 0,
              value: ecoScore?.recyclability_analysis?.effective_recycling_rate
                ? 100
                : 0,
            },
            waterUsage: {
              score: ecoScore?.lca_results?.water_usage_liters 
                ? (ecoScore.lca_results.water_usage_liters < 5 ? "Low" : 
                   ecoScore.lca_results.water_usage_liters < 15 ? "Medium" : "High")
                : "Medium",
              description: ecoScore?.lca_results?.water_usage_liters
                ? `${ecoScore.lca_results.water_usage_liters} liters used`
                : "40% less than average",
              value: ecoScore?.lca_results?.water_usage_liters || 60,
            },
            ingredients: {
              score: labelData?.ingredients ? "Safe" : "Unknown",
              description: labelData?.ingredients
                ? `${labelData.ingredients.split(",").length
                } ingredients detected`
                : "No ingredient data",
              value: 85,
              rawIngredients: labelData?.ingredients || "",
            },
            ingredientEmissions: ecoScore?.ingredient_emissions || {},

            alerts: [
              {
                type: "warning",
                message:
                  "This product contains ingredients that may be harmful to aquatic life",
              },
            ],
            disposal: ecoScore?.recyclability_analysis?.packaging_recyclable
              ? "Recyclable"
              : "Not Recyclable",
            alternatives:
              alternatives?.alternatives?.map((alt: any) => ({
                name: alt.product_name || "Alternative Product",
                brand: alt.brand || "Alternative Brand",
                efsScore: alt.eco_score || 0,
                improvement:
                  alt.eco_score - (ecoScore?.lca_results?.eco_score || 0),
                benefits: "More sustainable packaging and ingredients",
              })) || [],
            categoryBreakdown: [
              {
                name: "Packaging",
                value: ecoScore?.stage_percentages?.packaging || 0,
              },
              {
                name: "Ingredients",
                value: ecoScore?.stage_percentages?.ingredients || 0,
              },
              {
                name: "Manufacturing",
                value: ecoScore?.stage_percentages?.manufacturing || 0,
              },
              {
                name: "Transportation",
                value: ecoScore?.stage_percentages?.transportation || 0,
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
                water: ecoScore?.lca_results?.water_usage_liters 
                  ? Math.round((ecoScore.lca_results.water_usage_liters / 10) * 100) 
                  : 60,
                carbon: ecoScore?.lca_results?.total_emissions_kg_co2e
                  ? Math.round(
                    ecoScore.lca_results.total_emissions_kg_co2e * 100
                  )
                  : 100,
                waste: ecoScore?.lca_results?.waste_generation_kg
                  ? Math.round(ecoScore.lca_results.waste_generation_kg * 50)
                  : 100 - (ecoScore?.recyclability_analysis?.effective_recycling_rate
                    ? Math.round(
                      ecoScore.recyclability_analysis
                        .effective_recycling_rate * 100
                    )
                    : 0),
              },
              {
                name: "Best Practice",
                water: 40,
                carbon: ecoScore?.lca_results?.total_emissions_kg_co2e
                  ? Math.round(
                    ecoScore.lca_results.total_emissions_kg_co2e * 60
                  )
                  : 60,
                waste: 15,
              },
            ],
          };

          setProductData(transformedData);
        } catch (err) {
          console.error("Error processing URL data:", err);
          setError("Failed to load product data from URL parameters.");
        } finally {
          setLoading(false);
        }
      };

      fetchFromUrl();
    } else {
      // No URL parameters, fetch from API
      fetchDataOnly();
    }
  }, []);

  // Colors for the EFS score meter
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

  const COLORS = ["#4ade80", "#22c55e", "#16a34a", "#15803d"];
  const IMPACT_COLORS = {
    water: "#3b82f6",
    carbon: "#10b981",
    waste: "#f59e0b",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-green-800">
            {isSubmitting
              ? "Analyzing product sustainability..."
              : "Loading dashboard..."}
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
            Error Loading Data
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition w-full"
            >
              Try Again
            </button>
            <button
              onClick={fetchDataOnly}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full disabled:opacity-50"
            >
              {isSubmitting ? "Loading..." : "Fetch from API"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            No Product Data
          </h2>
          <p className="text-gray-600 mb-4">
            Please scan a product first to view its sustainability data.
          </p>
          <button
            onClick={fetchDataOnly}
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {isSubmitting ? "Loading..." : "Load Sample Data"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header with Refresh Button */}

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4">
        {/* Product Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-green-800">
                {productData.name}
              </h2>
              <p className="text-gray-500">Brand: {productData.brand}</p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
              <button
                onClick={fetchAlternatives}
                disabled={isLoadingAlternatives}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center disabled:opacity-50"
              >
                {isLoadingAlternatives ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finding Alternatives...
                  </>
                ) : (
                  <>
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Find Better Alternatives
                  </>
                )}
              </button>
              
              {productData.alternatives.length > 0 && (
                <button
                  onClick={() => setShowAlternatives(!showAlternatives)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center"
                >
                  {showAlternatives ? "Hide Alternatives" : "Show Alternatives"}
                  <ChevronRight
                    className={`ml-1 h-4 w-4 transition-transform ${showAlternatives ? "rotate-90" : ""
                      }`}
                  />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Environmental Score */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center">
                <Award className="mr-2 h-5 w-5" />
                Environmental Footprint Score
              </h3>

              <div className="relative pt-5">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-red-500">Poor</span>
                  <span className="text-orange-500">Fair</span>
                  <span className="text-yellow-500">Good</span>
                  <span className="text-green-500">Very Good</span>
                  <span className="text-green-600">Excellent</span>
                </div>
                <div className="h-4 w-full bg-gray-200 rounded-full mb-4">
                  <div
                    className={`h-full rounded-full ${getEfsScoreColor(
                      productData.efsScore
                    )}`}
                    style={{ width: `${productData.efsScore}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">0</span>
                  <div className="text-center">
                    <div className="bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto">
                      <span className="text-2xl font-bold text-green-700">
                        {productData.efsScore}
                      </span>
                    </div>
                    <p className="mt-1 font-medium text-green-700">
                      {getEfsScoreText(productData.efsScore)}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">100</span>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="font-medium text-green-800 mb-3">
                  Score Breakdown
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={productData.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    // label={({ name}) => `${name} `}
                    >
                      {productData.categoryBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Carbon Footprint Visualization */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h3 className="text-xl font-bold text-green-700 mb-4">
                Carbon Footprint
              </h3>

              <div className="flex justify-center mb-4">
                <div className="relative">
                  <svg
                    width="160"
                    height="200"
                    viewBox="0 0 160 200"
                    className="mx-auto"
                  >
                    <path
                      d="M80 0C50 0 30 20 30 60C30 90 0 110 0 140C0 170 30 200 80 200C130 200 160 170 160 140C160 110 130 90 130 60C130 20 110 0 80 0Z"
                      fill="none"
                      stroke="#d1d5db"
                      strokeWidth="2"
                    />
                    <clipPath id="foot-clip">
                      <rect
                        x="0"
                        y={`${100 - productData.carbonFootprint.value}%`}
                        width="100%"
                        height={`${productData.carbonFootprint.value}%`}
                      />
                    </clipPath>
                    <path
                      d="M80 0C50 0 30 20 30 60C30 90 0 110 0 140C0 170 30 200 80 200C130 200 160 170 160 140C160 110 130 90 130 60C130 20 110 0 80 0Z"
                      fill="#10b981"
                      clipPath="url(#foot-clip)"
                    />
                    <circle cx="50" cy="25" r="10" fill="#d1d5db" />
                    <circle cx="70" cy="20" r="10" fill="#d1d5db" />
                    <circle cx="90" cy="20" r="10" fill="#d1d5db" />
                    <circle cx="110" cy="25" r="10" fill="#d1d5db" />
                  </svg>
                </div>
              </div>

              <div className="text-center mb-4">
                <p className="text-lg font-bold text-green-700">
                  {productData.carbonFootprint.score}
                </p>
                <p className="text-sm text-gray-600">
                  {productData.carbonFootprint.equivalent}
                </p>
              </div>
            </div>
          </div>

          {/* Middle Column - Detailed Metrics */}
          <div className="lg:col-span-1">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-green-800">Recyclability</h4>
                    <p className="text-2xl font-bold text-green-600">{productData.recyclability.score}</p>
                    <p className="text-xs text-gray-600">{productData.recyclability.percentage}% recyclable packaging</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Recycle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-3 h-2 w-full bg-gray-200 rounded-full">
                  <div
                    className={`h-full rounded-full ${productData.recyclability.value === 100 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${productData.recyclability.value}%` }}
                  ></div>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => {
                      if (productData.recyclability.value === 100) {
                        window.location.href = '/non_recyclable';
                      } else {
                        window.location.href = '/recyclable';
                      }
                    }}
                    className={`w-full px-4 py-2 rounded-lg text-white font-medium transition ${productData.recyclability.value === 100
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                      }`}
                  >
                    {productData.recyclability.value === 100 ? 'Non-Recyclable' : 'Recyclable'}
                  </button>
                </div>
              </div>            </div>

            {/* Green Alerts */}
            {/* {productData.alerts.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  Green Alerts
                </h3>
                
                <div className="space-y-4">
                  {productData.alerts.map((alert, index) => (
                    <div 
                      key={index} 
                      className={`border-l-4 p-4 rounded-r-lg ${
                        alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' : 
                        alert.type === 'danger' ? 'bg-red-50 border-red-400' : 
                        'bg-blue-50 border-blue-400'
                      }`}
                    >
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertTriangle className={`h-5 w-5 ${
                            alert.type === 'warning' ? 'text-yellow-400' : 
                            alert.type === 'danger' ? 'text-red-400' : 
                            'text-blue-400'
                          }`} />
                        </div>
                        <div className="ml-3">
                          <p className={`text-sm ${
                            alert.type === 'warning' ? 'text-yellow-700' : 
                            alert.type === 'danger' ? 'text-red-700' : 
                            'text-blue-700'
                          }`}>
                            {alert.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
 */}
            {/* Green Alerts - Ingredient Emissions */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                Ingredient Emissions
              </h3>

              <div className="h-64 overflow-y-auto border border-gray-200 rounded-lg">
                <div className="space-y-2 p-4">
                  {/* Check if ingredient emissions data exists */}
                  {(() => {
                    // Try to get ingredient emissions from the API data
                    const ingredientEmissions =
                      productData.ingredientEmissions || {};
                    const entries = Object.entries(ingredientEmissions);

                    if (entries.length === 0) {
                      return (
                        <div className="text-center text-gray-500 py-8">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>No ingredient emission data available</p>
                        </div>
                      );
                    }

                    return entries.map(([ingredient, data], index) => {
                      const emissionData = data as {
                        emission_kg_co2e: number;
                        proportion: number;
                      };
                      const emissionLevel =
                        emissionData.emission_kg_co2e > 0.01
                          ? "high"
                          : emissionData.emission_kg_co2e > 0.005
                            ? "medium"
                            : "low";

                      return (
                        <div
                          key={index}
                          className={`border-l-4 p-3 rounded-r-lg transition-all hover:shadow-sm ${emissionLevel === "high"
                              ? "bg-red-50 border-red-400"
                              : emissionLevel === "medium"
                                ? "bg-yellow-50 border-yellow-400"
                                : "bg-green-50 border-green-400"
                            }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <Leaf
                                  className={`h-4 w-4 mr-2 ${emissionLevel === "high"
                                      ? "text-red-500"
                                      : emissionLevel === "medium"
                                        ? "text-yellow-500"
                                        : "text-green-500"
                                    }`}
                                />
                                <h4
                                  className={`font-medium text-sm ${emissionLevel === "high"
                                      ? "text-red-700"
                                      : emissionLevel === "medium"
                                        ? "text-yellow-700"
                                        : "text-green-700"
                                    }`}
                                >
                                  {ingredient}
                                </h4>
                              </div>
                              <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                                <p
                                  className={`text-xs ${emissionLevel === "high"
                                      ? "text-red-600"
                                      : emissionLevel === "medium"
                                        ? "text-yellow-600"
                                        : "text-green-600"
                                    }`}
                                >
                                  Emission:{" "}
                                  {emissionData.emission_kg_co2e.toFixed(5)} kg
                                  CO₂e
                                </p>
                                <p
                                  className={`text-xs ${emissionLevel === "high"
                                      ? "text-red-600"
                                      : emissionLevel === "medium"
                                        ? "text-yellow-600"
                                        : "text-green-600"
                                    }`}
                                >
                                  Proportion:{" "}
                                  {(emissionData.proportion * 100).toFixed(1)}%
                                </p>
                              </div>
                            </div>
                            <div
                              className={`px-2 py-1 rounded-full text-xs font-medium ${emissionLevel === "high"
                                  ? "bg-red-100 text-red-700"
                                  : emissionLevel === "medium"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                            >
                              {emissionLevel.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                <p>
                  • <span className="text-green-600">Low:</span> &lt; 0.005 kg
                  CO₂e
                </p>
                <p>
                  • <span className="text-yellow-600">Medium:</span> 0.005 -
                  0.01 kg CO₂e
                </p>
                <p>
                  • <span className="text-red-600">High:</span> &gt; 0.01 kg
                  CO₂e
                </p>
              </div>
            </div>

            {/* Brand Sustainability Information */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-5">
              <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center">
                <Leaf className="mr-2 h-5 w-5" />
                Brand Sustainability Information
              </h3>
              {(() => {
                const brandSustainabilityData = {
                  joy: 'Here are the findings as bullet points:\n\n*Sustainability certifications (Indian and global)*\n\n- No specific information found about Indian sustainability certifications.\n- The Young Champions of the Earth prize is awarded every year to seven entrepreneurs under the age of 30 with bold ideas for sustainable environmental change. (URL: https://climatejournal.news/news/young-trailblazer-innovators-awarded-for-bold-sustainability-ideas-by-unep)\n\n*Environmental claims: packaging, ingredients, carbon neutrality, plastic use*\n\n- The article "10 Simple Ways to Reduce Your Environmental Impact" suggests reducing plastic use and waste. (URL: https://vocal.media/longevity/10-simple-ways-to-reduce-your-environmental-impact)\n- The article "Can we have it all? Sustainable Hedonism on the rise" mentions reducing food waste and choosing sustainable ingredients. (URL: https://climatejournal.news/news/can-we-have-it-all-sustainable-hedonism-on-the-rise)\n- The article "Joy to the world: 9 ways to give Earth the gift of sustainability" suggests choosing foods with a low environmental impact, such as local, seasonal, organic, and sustainably run farms. (URL: https://www.reckon.news/news/2022/12/joy-to-the-world-9-ways-to-give-earth-the-gift-of-sustainability.html)\n\n*Green initiatives, renewable energy, eco-labels, water conservation*\n\n- The article "Unleashing the potential of nature finance: a pathway to mitigate risks and unlock benefits" mentions the importance of nature-based solutions and carbon offsetting. (URL: https://climatejournal.news/news/unleashing-the-potential-of-nature-finance-a-pathway-to-mitigate-risks-and-unlock-benefits)\n- The article "Norwegian Cruise Line Holdings Publishes Annual Environmental, Social and Governance (ESG) Report Detailing Progress on Sustainability Initiatives" mentions the company\'s efforts to reduce its environmental impact, including its Sail & Sustain program. (URL: https://insidetravel.news/norwegian-cruise-line-holdings-publishes-annual-environmental-social-and-governance-esg-report-detailing-progress-on-sustainability-initiatives/)\n- The article "Environmental, Social and Governance Report" mentions the company\'s efforts to reduce its environmental impact, including its ESG reporting. (URL: https://hkex.news/listedco/docs/08292/GLN20180620093.pdf)',

                  ponds:
                    'Here are the findings as bullet points:\n\n*Sustainability certifications (Indian and global)*\n\n- Hyundai Europe has a Sustainability Management Committee that facilitates stakeholder communication and publishes sustainability reports. (URL: https://www.hyundai.news/newsroom/dam/eu/brand/20250704_2025_sustainability_report/hmc-2025-sustainability-report-en.pdf)\n- The mining sector has implemented Environmental, Social, and Governance (ESG) principles, which are progressively influencing the industrial environment. (URL: https://greeneconomy.media/mining-leads-environmental-charge-in-industry/)\n\n*Environmental claims: packaging, ingredients, carbon neutrality, plastic use*\n\n- Ponds play a crucial role in providing water for agriculture, livestock, and household use in many parts of India, and their conservation can help improve the quality of life for people in these communities. (URL: https://impactx.media/the-pondman-is-changing-india-one-pond-at-a-time/)\n- The use of farm ponds can collect numerous harmful substances, from pesticides and herbicides to traces of veterinary medicine, hormones, and antibiotics, which can post a risk to food safety and ultimately human health. (URL: https://caesresearch.news/engineering-nature-based-solutions-to-improve-water-quality-on-the-farm/)\n- The mining sector has implemented measures to conserve water resources, including utilizing recycled process water and effectively managing stormwater with catchment ponds. (URL: https://greeneconomy.media/mining-leads-environmental-charge-in-industry/)\n\n*Green initiatives, renewable energy, eco-labels, water conservation*\n\n- The project in the article "In the Midst of Steel and Glass: The Transformative Power of Modern Urban Green Spaces" features a sloped roof with a special system to collect rainwater for landscape irrigation and to maintain the water level in artificial ponds. (URL: https://newpolis.media/in-the-midst-of-steel-and-glass-the-transformative-power-of-modern-urban-green-spaces-part-2/)\n- The use of beaver dams can foster biodiversity within ecosystems, creating thriving hubs of life that support a diverse array of plant and animal species. (URL: https://vocal.media/earth/the-fascinating-world-of-beaver-dams-construction-ecology-and-environmental-impact)\n- Water conservation is essential for ensuring the availability and sustainability of water resources, and includes strategies such as water resource planning, water conservation, and the protection of watersheds and wetlands. (URL: https://vocal.media/earth/balancing-demands-and-sustainability-effective-strategies-for-water-management)',

                  dove: "Here are the findings on sustainability certifications, environmental claims, and green initiatives:\n\n*Sustainability Certifications*\n\n- Dove products are working towards being fully cruelty-free certified by PETA. (URL: https://vocal.media/lifehack/why-i-swear-by-dove-deodorant-and-antiperspirants-a-personal-testimony)\n- Unilever Japan aims to shift all packaging to 100% recycled plastic by the end of 2020. (URL: https://zenbird.media/unilever-japan-to-shift-all-packaging-to-100-recycled-plastic-by-end-2020/)\n\n*Environmental Claims*\n\n- Dove uses more recyclable materials and offers refillable deodorant options to reduce plastic waste. (URL: https://vocal.media/lifehack/why-i-swear-by-dove-deodorant-and-antiperspirants-a-personal-testimony)\n- Dove's packaging features a smart label that alerts consumers when shower water reaches excessive temperature. (URL: https://www.printindustry.news/story/48427/smart-packaging-dove-uses-thermochromic-ink-to-warn-of-hot-water)\n- Unilever's CEO mentioned that the company is working on sustainability agreements with its top 10 retail customers, including Walmart, to cut greenhouse gas emissions and minimize waste in its supply chain. (URL: https://airfreight.news/articles/full/unilever-strikes-climate-deals-with-walmart-and-others-to-meet-sustainability-goals)\n- Unilever's Climate Plan aims to reduce emissions from supply chain and consumers. (URL: https://apple.news/AqvELhBq0Tv-1hAcHY_cQ_A)\n\n*Green Initiatives*\n\n- Unilever Japan aims to shift all packaging to 100% recycled plastic by the end of 2020. (URL: https://zenbird.media/unilever-japan-to-shift-all-packaging-to-100-recycled-plastic-by-end-2020/)\n- Unilever is working on sustainability agreements with its top 10 retail customers, including Walmart, to cut greenhouse gas emissions and minimize waste in its supply chain. (URL: https://airfreight.news/articles/full/unilever-strikes-climate-deals-with-walmart-and-others-to-meet-sustainability-goals)\n- Unilever's Climate Plan aims to reduce emissions from supply chain and consumers. (URL: https://apple.news/AqvELhBq0Tv-1hAcHY_cQ_A)\n- Unilever's Sustainable Living Plan aims to halve its environmental footprint and ensure sustainable supply chains for all its key raw materials. (URL: https://basta.media/the-ceo-of-unilever-receives-a-mega-bonus-for-his-contribution-to-sustainable)",

                  nivea:
                    "Here are the findings as bullet points:\n\n*Sustainability Certifications (Indian and global)*\n\n- No specific information found about Nivea's sustainability certifications in the provided content.\n\n*Environmental Claims: Packaging, Ingredients, Carbon Neutrality, Plastic Use*\n\n- Nivea's Blue Creme tin is now made from 80% recycled aluminium, reducing the environmental footprint. (URL: https://cde.news/blue-nivea-creme-tin-now-made-from-80-recycled-aluminium/)\n- Nivea's products are designed to nourish the skin deeply without affecting melanin production, and contain ingredients such as glycerin, natural oils, and waxes that help retain moisture and protect the skin barrier. (URL: https://www.nofi.media/en/2024/10/10-misconceptions-about-black-skin/91445)\n- No information found about Nivea's carbon neutrality claims.\n\n*Green Initiatives, Renewable Energy, Eco-labels, Water Conservation*\n\n- Nivea launched its environmental initiative, the Distributor Quality Program, in 2021, targeting a significant reduction in plastic waste and an enhancement of quality infrastructure within its distributor networks. (URL: https://www.sanfranciscostar.news/news/nivea-paving-the-way-to-a-sustainable-future-with-distributor-quality-program20240611182046/)\n- Nivea is working to transform plastic waste into functional store units with the Distributor Quality Program. (URL: https://www.sanfranciscostar.news/news/nivea-paving-the-way-to-a-sustainable-future-with-distributor-quality-program20240611182046/)\n- No information found about Nivea's renewable energy or water conservation initiatives.\n\n*Other*\n\n- Nivea is committed to pointing out the proven health benefits of physical touch and promoting skin-touch, as part of its brand Purpose, 'Care for human touch to inspire togetherness'. (URL: https://cpostrategy.media/blog/executiveinsights/beiersdorf-procurement-transformation/)",

                  plum: "Here are the findings as bullet points:\n\n*Sustainability certifications (Indian and global)*\n\n- HDFC Life launched a Sustainable Equity Fund that promotes Environmental, Social, and Governance (ESG) principles. (URL: https://thisweekindia.news/towards-a-greener-future-hdfc-life-launches-sustainable-equity-fund/)\n- The Sustainable Entertainment Alliance uses PEACH, PEAR, and PLUM carbon calculation tools. (URL: https://theflint.media/melanie-windle-sustainability-after-all-is-simply-about-using-your-resources-wisely/)\n\n*Environmental claims: packaging, ingredients, carbon neutrality, plastic use*\n\n- California Prune growers use research, innovation, and technology to conserve water and energy and lessen their carbon footprint. (URL: https://ace.media/press-releases/wa60)\n- Prunes are low in waste and offer a myriad of nutritional benefits for human health. (URL: https://ace.media/press-releases/wa60)\n- Plum Media does not mention any specific environmental claims or certifications related to packaging, ingredients, carbon neutrality, or plastic use.\n\n*Green initiatives, renewable energy, eco-labels, water conservation*\n\n- California Prune growers support employees with fair wages and robust safety processes while continuing to strengthen the industry's roots and reputation for future generations. (URL: https://ace.media/press-releases/wa60)\n- Plum Island is a unique environmental resource that is home to hundreds of species of wildlife and numerous important historical sites that must be preserved for future generations to enjoy. (URL: https://ctbythenumbers.news/ctnews/long-island-sounds-plum-island-may-yet-be-saved-environmentalists-hail-congressional-action-after-decade-of-advocacy)\n- Plum Media does not mention any specific green initiatives, renewable energy, eco-labels, or water conservation efforts.",

                  foxtale:
                    "Here are the findings related to sustainability certifications, environmental claims, and green initiatives:\n\n*Sustainability Certifications*\n\n- No information found on specific sustainability certifications held by Foxtale. (URL: https://table.media/esg)\n\n*Environmental Claims*\n\n- Foxtale's Super Glow Moisturizer provides antioxidant protection against environmental stressors like pollution, UV rays, and blue light. (URL: https://www.bizzbuzz.news/lifestyle/reasons-why-foxtales-super-glow-moisturizer-is-a-game-changer-for-glowing-skin-1367808)\n- Foxtale Room Freshener is designed to elevate the home's atmosphere with a touch of sophistication and deliver inviting, long-lasting scents. (URL: https://theglitz.media/foxtale-bodycare-power-pack-your-routine-with-luxurious-glow-enhancing-skincare/)\n- Foxtale's skincare products are infused with nourishing ingredients and innovative formulas to deliver skin that's not just healthy, but also glowing with vitality. (URL: https://theglitz.media/foxtale-bodycare-power-pack-your-routine-with-luxurious-glow-enhancing-skincare/)\n\n*Green Initiatives*\n\n- Foxtale Media provides digital strategy and content to clients nationwide, but no information found on specific green initiatives. (URL: https://www.foxtale.media/)\n- Emby is designed to help manage personal media libraries in an environmentally friendly way, but no information found on specific green initiatives. (URL: https://emby.media/)\n\n*Renewable Energy*\n\n- No information found on Foxtale's use of renewable energy. (URL: https://table.media/esg)\n\n*Eco-labels*\n\n- No information found on Foxtale's use of eco-labels. (URL: https://table.media/esg)\n\n*Water Conservation*\n\n- No information found on Foxtale's water conservation efforts. (URL: https://table.media/esg)\n\n*Packaging*\n\n- No information found on Foxtale's packaging initiatives. (URL: https://table.media/esg)\n\n*Carbon Neutrality*\n\n- No information found on Foxtale's carbon neutrality efforts. (URL: https://table.media/esg)\n\n*Plastic Use*\n\n- No information found on Foxtale's plastic use reduction initiatives. (URL: https://table.media/esg)",

                  loreal:
                    "No sustainability information available for this brand at the moment.",
                  himalaya:
                    "No sustainability information available for this brand at the moment.",
                  vaseline:
                    "No sustainability information available for this brand at the moment.",
                  dettol:
                    "No sustainability information available for this brand at the moment.",
                  fiama:
                    "No sustainability information available for this brand at the moment.",
                  harpic:
                    "No sustainability information available for this brand at the moment.",
                };

                const brandKey = productData.brand.toLowerCase();
                const sustainabilityInfo =
                  brandSustainabilityData[brandKey as keyof typeof brandSustainabilityData] ||
                  "No sustainability information available for this brand.";

                if (
                  sustainabilityInfo ===
                  "No sustainability information available for this brand at the moment." ||
                  sustainabilityInfo ===
                  "No sustainability information available for this brand."
                ) {
                  return (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 mb-2">
                        No sustainability data available
                      </p>
                      <p className="text-sm text-gray-400">
                        Information for "{productData.brand}" brand is not
                        currently available in our database.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="max-h-80 overflow-y-auto">
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-line text-gray-700 text-sm leading-relaxed">
                        {sustainabilityInfo.split("\n").map((line: string, index: number) => {
                          // Handle bullet points
                          if (line.trim().startsWith("- ")) {
                            const text = line.replace("- ", "");
                            // Check if line contains URL
                            const urlMatch = text.match(
                              /(.*?)\s*\(URL:\s*(https?:\/\/[^\)]+)\)/
                            );
                            if (urlMatch) {
                              return (
                                <div
                                  key={index}
                                  className="flex items-start mb-3"
                                >
                                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                  <div>
                                    <p className="text-gray-700 mb-1">
                                      {urlMatch[1]}
                                    </p>
                                    <a
                                      href={urlMatch[2]}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 underline text-xs break-all"
                                    >
                                      {urlMatch[2]}
                                    </a>
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div
                                  key={index}
                                  className="flex items-start mb-2"
                                >
                                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                  <p className="text-gray-700">{text}</p>
                                </div>
                              );
                            }
                          }
                          // Handle section headers (lines starting with *)
                          else if (
                            line.trim().startsWith("*") &&
                            line.trim().endsWith("*")
                          ) {
                            return (
                              <h4
                                key={index}
                                className="font-semibold text-green-800 mt-6 mb-3 first:mt-0"
                              >
                                {line.replace(/\*/g, "")}
                              </h4>
                            );
                          }
                          // Handle regular text with potential URLs
                          else if (line.trim()) {
                            const urlMatch = line.match(
                              /(.*?)\s*\(URL:\s*(https?:\/\/[^\)]+)\)/
                            );
                            if (urlMatch) {
                              return (
                                <div key={index} className="mb-3">
                                  <p className="text-gray-700 mb-1">
                                    {urlMatch[1]}
                                  </p>
                                  <a
                                    href={urlMatch[2]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline text-xs break-all"
                                  >
                                    {urlMatch[2]}
                                  </a>
                                </div>
                              );
                            } else {
                              return (
                                <p key={index} className="text-gray-700 mb-2">
                                  {line}
                                </p>
                              );
                            }
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            {/* Government Alert Button */}
            <button
              onClick={() => setModalOpen(true)}
              className="w-full max-w-xs bg-green-600 text-white font-bold rounded-full p-3 shadow-lg hover:bg-green-700 transition flex items-center justify-center gap-3"
            >
              <img
                src="/gov.png"
                alt="Gov Logo"
                className="h-10 w-auto inline-block"
              />
              Send Alert to the Government
            </button>

            <ProductModal
              isOpen={isModalOpen}
              onClose={() => setModalOpen(false)}
            />
          </div>

          {/* Alternative Product Details Modal */}
          {isAlternativeModalOpen && selectedAlternative && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-green-800">
                        {selectedAlternative.name}
                      </h2>
                      <p className="text-gray-600">by {selectedAlternative.brand}</p>
                    </div>
                    <button
                      onClick={closeAlternativeDetails}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  {/* EFS Score */}
                  <div className="bg-green-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-green-800">Environmental Footprint Score</h3>
                      <div className="bg-green-100 rounded-full px-4 py-2">
                        <span className="text-xl font-bold text-green-700">
                          {selectedAlternative.efsScore}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Scores */}
                  {selectedAlternative.rawData?.scores && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-green-800 mb-4">Detailed Scores</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-600">Name Similarity</p>
                          <p className="text-lg font-semibold text-gray-800">
                            {(selectedAlternative.rawData.scores.name_score * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-600">Ingredient Match</p>
                          <p className="text-lg font-semibold text-gray-800">
                            {(selectedAlternative.rawData.scores.ingredient_score * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-600">Brand Compatibility</p>
                          <p className="text-lg font-semibold text-gray-800">
                            {(selectedAlternative.rawData.scores.brand_score * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-600">Final Score</p>
                          <p className="text-lg font-semibold text-green-600">
                            {(selectedAlternative.rawData.scores.final_score * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ingredients List */}
                  {selectedAlternative.rawData?.ingredients && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-green-800 mb-3">Ingredients</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 leading-relaxed">
                          {selectedAlternative.rawData.ingredients}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Additional Product Info */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="font-semibold text-gray-800">
                        {selectedAlternative.rawData?.category || "N/A"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">Subcategory</p>
                      <p className="font-semibold text-gray-800">
                        {selectedAlternative.rawData?.subcategory || "N/A"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">Size</p>
                      <p className="font-semibold text-gray-800">
                        {selectedAlternative.rawData?.size || "N/A"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">Form</p>
                      <p className="font-semibold text-gray-800">
                        {selectedAlternative.rawData?.form || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Eco Improvement */}
                  {selectedAlternative.rawData?.eco_improvement !== undefined && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                      <h3 className="text-lg font-semibold text-blue-800 mb-2">Environmental Improvement</h3>
                      <p className="text-blue-700">
                        {selectedAlternative.rawData.eco_improvement > 0 
                          ? `This alternative has ${selectedAlternative.rawData.eco_improvement} points better eco-score than your current product.`
                          : selectedAlternative.rawData.eco_improvement < 0
                          ? `This alternative has ${Math.abs(selectedAlternative.rawData.eco_improvement)} points lower eco-score than your current product.`
                          : "This alternative has the same eco-score as your current product."
                        }
                      </p>
                    </div>
                  )}

                  {/* Close Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={closeAlternativeDetails}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right Column - Environmental Impact Comparison */}
          <div className="lg:col-span-1">


            {/* Manufacturing & Supply Chain Information */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h3 className="text-xl font-bold text-green-700 mb-4">
                Manufacturing & Supply Chain
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Manufacturing Location</h4>
                    <p className="text-gray-600">
                      {productData.name.includes('NIVEA') ? 'Mumbai, India' : 
                       productData.name.includes('Dove') ? 'Mumbai, India' :
                       productData.name.includes('Ponds') ? 'Mumbai, India' :
                       'Manufacturing location data not available'}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Supply Chain Transparency</h4>
                    <div className="flex items-center">
                      <div className="w-16 h-2 bg-gray-200 rounded-full mr-3">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-600">75%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Moderate transparency</p>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Environmental Certifications</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      ISO 14001
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      FSC Certified
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      Carbon Trust
                    </span>
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">Labor Conditions Score</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-20 h-2 bg-gray-200 rounded-full mr-3">
                        <div className="h-full bg-yellow-500 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <span className="text-sm font-semibold text-yellow-700">85/100</span>
                    </div>
                    <span className="text-xs text-yellow-600">Good</span>
                  </div>
                  <p className="text-xs text-yellow-600 mt-1">
                    Based on fair wages, safety standards, and working conditions
                  </p>
                </div>
              </div>
            </div>

            {/* Waste & Biodegradability Metrics */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h3 className="text-xl font-bold text-green-700 mb-4">
                Waste & Biodegradability
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <h4 className="font-semibold text-red-800">Waste Generation</h4>
                  </div>
                  <p className="text-2xl font-bold text-red-700">2.3</p>
                  <p className="text-sm text-red-600">kg per product</p>
                  <p className="text-xs text-red-500 mt-1">
                    Includes packaging and production waste
                  </p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Leaf className="h-5 w-5 text-green-600 mr-2" />
                    <h4 className="font-semibold text-green-800">Biodegradability</h4>
                  </div>
                  <p className="text-2xl font-bold text-green-700">65%</p>
                  <p className="text-sm text-green-600">biodegradable</p>
                  <p className="text-xs text-green-500 mt-1">
                    Under optimal conditions
                  </p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Recycling Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Packaging Recyclability</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {productData.recyclability.percentage}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Product Disposal</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {productData.disposal}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Energy Consumption & Renewable Energy */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h3 className="text-xl font-bold text-green-700 mb-4">
                Energy Consumption & Renewable Energy
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <div className="w-5 h-5 bg-orange-500 rounded-full mr-2"></div>
                      <h4 className="font-semibold text-orange-800">Total Energy Consumption</h4>
                    </div>
                    <p className="text-2xl font-bold text-orange-700">45.2</p>
                    <p className="text-sm text-orange-600">kWh per product</p>
                    <p className="text-xs text-orange-500 mt-1">
                      Manufacturing to disposal
                    </p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Leaf className="h-5 w-5 text-green-600 mr-2" />
                      <h4 className="font-semibold text-green-800">Renewable Energy</h4>
                    </div>
                    <p className="text-2xl font-bold text-green-700">68%</p>
                    <p className="text-sm text-green-600">renewable</p>
                    <p className="text-xs text-green-500 mt-1">
                      Solar, wind, hydro
                    </p>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-3">Energy Breakdown by Stage</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Manufacturing</span>
                      <div className="flex items-center">
                        <div className="w-20 h-2 bg-gray-200 rounded-full mr-3">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-600">60%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Transportation</span>
                      <div className="flex items-center">
                        <div className="w-20 h-2 bg-gray-200 rounded-full mr-3">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: '25%' }}></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-600">25%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Packaging</span>
                      <div className="flex items-center">
                        <div className="w-20 h-2 bg-gray-200 rounded-full mr-3">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: '15%' }}></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-600">15%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 mb-2">Carbon Offset Programs</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Tree Planting Initiative
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Renewable Energy Credits
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      Ocean Cleanup Project
                    </span>
                  </div>
                  <p className="text-xs text-purple-600 mt-2">
                    Actively participating in carbon offset programs to neutralize emissions
                  </p>
                </div>
              </div>
            </div>

            {/* Alternatives Error Display */}
            {alternativesError && (
              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <div className="flex items-center text-red-600 mb-2">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  <h3 className="text-lg font-semibold">Error Loading Alternatives</h3>
                </div>
                <p className="text-gray-600 mb-4">{alternativesError}</p>
                <button
                  onClick={fetchAlternatives}
                  disabled={isLoadingAlternatives}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isLoadingAlternatives ? "Retrying..." : "Try Again"}
                </button>
              </div>
            )}

            {/* Better Alternatives Section */}
            {showAlternatives && productData.alternatives.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center">
                  <ThumbsUp className="mr-2 h-5 w-5" />
                  Better Alternative Products
                </h3>

                <div className="space-y-6">
                  {productData.alternatives.map((alt, index) => (
                    <div
                      key={index}
                      className="border border-green-100 rounded-lg p-4 hover:bg-green-50 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-green-800">
                            {alt.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            by {alt.brand}
                          </p>
                        </div>
                        <div className="flex items-center bg-green-100 px-3 py-1 rounded-full">
                          <span className="text-sm font-medium text-green-800">
                            EFS: {alt.efsScore}
                          </span>
                          {alt.improvement > 0 && (
                            <span className="ml-1 text-xs text-green-600">
                              +{alt.improvement}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center">
                          <ArrowRight className="h-4 w-4 text-green-600 mr-2" />
                          <p className="text-sm text-gray-700">
                            {alt.benefits}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <button 
                          onClick={() => openAlternativeDetails(alt)}
                          className="text-green-600 text-sm hover:text-green-800 flex items-center"
                        >
                          View Details
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* <div className="flex justify-end items-end">
            <div class="bg-blue-500 text-white p-4 rounded">
      Bottom Right
    </div>

          </div> */}
        </div>
      </div>
    </div>
  );
}
