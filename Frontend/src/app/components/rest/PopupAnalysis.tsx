import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Leaf, Package, MapPin, BarChart3, Users, Award, AlertCircle, Star, CheckCircle, XCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell } from 'recharts';

interface ProductData {
  product_name: string;
  brand: string;
  category: string;
  weight: string;
  packaging_type: string;
  ingredient_list: string;
  latitude: number;
  longitude: number;
  usage_frequency: string;
  manufacturing_loc: string;
}

interface ComparisonData {
  success: boolean;
  comparison_id: string;
  frontend_data: {
    metadata: {
      comparison_id: string;
      timestamp: string;
      model_version: string;
      focus: string;
    };
    summary: {
      overall_winner: {
        product_name: string;
        score_difference: number;
        is_significant_difference: boolean;
        environmental_advantage: string;
      };
    };
    products: {
      product1: {
        basic_info: {
          name: string;
          brand: string;
          category: string;
          weight: string;
          packaging: string;
        };
        sustainability_scores: {
          overall_environmental_score: number;
          carbon_footprint_kg: number;
          eco_score: number;
          recyclability_score: number;
          ingredient_sustainability: number;
          biodegradability_score: number;
          renewable_content_score: number;
        };
        green_qualities: {
          [key: string]: number;
        };
        environmental_grade: string;
      };
      product2: {
        basic_info: {
          name: string;
          brand: string;
          category: string;
          weight: string;
          packaging: string;
        };
        sustainability_scores: {
          overall_environmental_score: number;
          carbon_footprint_kg: number;
          eco_score: number;
          recyclability_score: number;
          ingredient_sustainability: number;
          biodegradability_score: number;
          renewable_content_score: number;
        };
        green_qualities: {
          [key: string]: number;
        };
        environmental_grade: string;
      };
    };
    detailed_analysis: {
      carbon_impact: {
        winner: string;
        reduction_potential: number;
        percentage_difference: number;
      };
      sustainability_breakdown: {
        [key: string]: {
          product1_emission: number;
          product2_emission: number;
          product1_percentage: number;
          product2_percentage: number;
          winner: string;
          improvement_percentage: number;
        };
      };
    };
  };
  comparison_summary: {
    total_emissions_comparison: {
      product1_emissions: number;
      product2_emissions: number;
      difference: number;
      percentage_difference: number;
    };
    eco_score_comparison: {
      product1_score: number;
      product2_score: number;
      difference: number;
    };
    recyclability_comparison: {
      product1_recyclable: boolean;
      product2_recyclable: boolean;
      product1_rate: number;
      product2_rate: number;
    };
    overall_winner: {
      product_name: string;
      score_difference: number;
      is_significant_difference: boolean;
      environmental_advantage: string;
    };
  };
  winner_analysis: {
    carbon_footprint: string;
    overall_environmental_impact: string;
  };
  improvement_recommendations: {
    [key: string]: string[];
  };
  sustainability_metrics: {
    carbon_intensity: {
      product1_per_kg: number;
      product2_per_kg: number;
    };
    packaging_efficiency: {
      product1_ratio: number;
      product2_ratio: number;
    };
    manufacturing_efficiency: {
      product1_ratio: number;
      product2_ratio: number;
    };
    recyclability_score: {
      product1_score: number;
      product2_score: number;
    };
  };
  message: string;
}

interface PopupAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
  product1Data?: ProductData;
  product2Data?: ProductData;
}

export default function PopupAnalysis({ isOpen, onClose, product1Data, product2Data }: PopupAnalysisProps) {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && product1Data && product2Data) {
      fetchComparisonData();
    }
  }, [isOpen, product1Data, product2Data]);

  const fetchComparisonData = async () => {
    if (!product1Data || !product2Data) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5001/api/compare-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product1: product1Data,
          product2: product2Data,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setComparisonData(data.data);
      } else {
        throw new Error(data.error || 'Comparison failed');
      }
    } catch (err) {
      console.error('Comparison error:', err);
      setError(err instanceof Error ? err.message : 'Failed to compare products');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get grade color
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Helper function to format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Helper function to format carbon footprint
  const formatCarbon = (value: number) => {
    return `${value.toFixed(3)} kg CO₂e`;
  };

  // Prepare sustainability breakdown chart data
  const getSustainabilityChartData = () => {
    if (!comparisonData?.frontend_data?.detailed_analysis?.sustainability_breakdown) return [];
    
    const breakdown = comparisonData.frontend_data.detailed_analysis.sustainability_breakdown;
    return Object.entries(breakdown).map(([category, data]) => ({
      category: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      product1: data.product1_percentage,
      product2: data.product2_percentage,
      winner: data.winner
    }));
  };

  // Prepare radar chart data
  const getRadarChartData = () => {
    if (!comparisonData?.frontend_data?.products) return [];

    const p1 = comparisonData.frontend_data.products.product1.sustainability_scores;
    const p2 = comparisonData.frontend_data.products.product2.sustainability_scores;

    return [
      { 
        subject: 'Overall Score', 
        product1: p1.overall_environmental_score, 
        product2: p2.overall_environmental_score, 
        fullMark: 100 
      },
      { 
        subject: 'Eco Score', 
        product1: p1.eco_score, 
        product2: p2.eco_score, 
        fullMark: 100 
      },
      { 
        subject: 'Recyclability', 
        product1: p1.recyclability_score, 
        product2: p2.recyclability_score, 
        fullMark: 100 
      },
      { 
        subject: 'Biodegradability', 
        product1: p1.biodegradability_score, 
        product2: p2.biodegradability_score, 
        fullMark: 100 
      },
      { 
        subject: 'Renewable Content', 
        product1: p1.renewable_content_score, 
        product2: p2.renewable_content_score, 
        fullMark: 100 
      }
    ];
  };

  // Prepare emissions comparison data
  const getEmissionsChartData = () => {
    if (!comparisonData?.frontend_data?.detailed_analysis?.sustainability_breakdown) return [];
    
    const breakdown = comparisonData.frontend_data.detailed_analysis.sustainability_breakdown;
    return Object.entries(breakdown).map(([category, data]) => ({
      category: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      product1: data.product1_emission,
      product2: data.product2_emission
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center rounded-t-xl">
          <h2 className="text-2xl font-bold text-green-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Product Comparison Analysis
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              <span className="ml-4 text-lg text-gray-600">Analyzing products...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">Analysis Failed</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchComparisonData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry Analysis
              </button>
            </div>
          ) : comparisonData ? (
            <div className="space-y-6">
              {/* Winner Analysis Banner */}
              {comparisonData.frontend_data?.summary?.overall_winner && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-green-800 flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Winner Analysis
                    </h3>
                    <div className="text-sm text-gray-600">
                      Confidence Score: {comparisonData.frontend_data.summary.overall_winner.score_difference.toFixed(1)}
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">🏆</div>
                      <div className="font-semibold text-lg text-black">
                        {comparisonData.frontend_data.summary.overall_winner.product_name}
                      </div>
                      <div className="text-sm text-gray-600">Overall Winner</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {formatPercentage(comparisonData.comparison_summary.total_emissions_comparison.percentage_difference)}
                      </div>
                      <div className="text-sm text-gray-600">Lower Carbon Footprint</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {comparisonData.frontend_data.summary.overall_winner.environmental_advantage}
                      </div>
                      <div className="text-sm text-gray-600">Environmental Advantage</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Product Overview Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Product 1 Card */}
                {comparisonData.frontend_data?.products?.product1 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold text-green-800 flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        {comparisonData.frontend_data.products.product1.basic_info.name}
                      </h3>
                      <div className={`px-2 py-1 rounded text-sm font-semibold ${getGradeColor(comparisonData.frontend_data.products.product1.environmental_grade)}`}>
                        Grade {comparisonData.frontend_data.products.product1.environmental_grade}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm text-black">
                        <div><strong>Brand:</strong> {comparisonData.frontend_data.products.product1.basic_info.brand}</div>
                        <div><strong>Weight:</strong> {comparisonData.frontend_data.products.product1.basic_info.weight}</div>
                        <div><strong>Category:</strong> {comparisonData.frontend_data.products.product1.basic_info.category}</div>
                        <div><strong>Packaging:</strong> {comparisonData.frontend_data.products.product1.basic_info.packaging}</div>
                      </div>
                      
                      <div className="border-t pt-3">
                        <div className="text-sm font-medium text-gray-700 mb-2">Sustainability Metrics</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white rounded p-2">
                            <div className="font-semibold text-green-600">
                              {comparisonData.frontend_data.products.product1.sustainability_scores.overall_environmental_score}
                            </div>
                            <div className="text-gray-600">Environmental Score</div>
                          </div>
                          <div className="bg-white rounded p-2">
                            <div className="font-semibold text-blue-600">
                              {formatCarbon(comparisonData.frontend_data.products.product1.sustainability_scores.carbon_footprint_kg)}
                            </div>
                            <div className="text-gray-600">Carbon Footprint</div>
                          </div>
                          <div className="bg-white rounded p-2">
                            <div className="font-semibold text-purple-600">
                              {comparisonData.frontend_data.products.product1.sustainability_scores.eco_score}
                            </div>
                            <div className="text-gray-600">Eco Score</div>
                          </div>
                          <div className="bg-white rounded p-2">
                            <div className="font-semibold text-orange-600">
                              {comparisonData.frontend_data.products.product1.sustainability_scores.recyclability_score}%
                            </div>
                            <div className="text-gray-600">Recyclability</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Product 2 Card */}
                {comparisonData.frontend_data?.products?.product2 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        {comparisonData.frontend_data.products.product2.basic_info.name}
                      </h3>
                      <div className={`px-2 py-1 rounded text-sm font-semibold ${getGradeColor(comparisonData.frontend_data.products.product2.environmental_grade)}`}>
                        Grade {comparisonData.frontend_data.products.product2.environmental_grade}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm text-black">
                        <div><strong>Brand:</strong> {comparisonData.frontend_data.products.product2.basic_info.brand}</div>
                        <div><strong>Weight:</strong> {comparisonData.frontend_data.products.product2.basic_info.weight}</div>
                        <div><strong>Category:</strong> {comparisonData.frontend_data.products.product2.basic_info.category}</div>
                        <div><strong>Packaging:</strong> {comparisonData.frontend_data.products.product2.basic_info.packaging}</div>
                      </div>
                      
                      <div className="border-t pt-3">
                        <div className="text-sm font-medium text-gray-700 mb-2">Sustainability Metrics</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white rounded p-2">
                            <div className="font-semibold text-green-600">
                              {comparisonData.frontend_data.products.product2.sustainability_scores.overall_environmental_score}
                            </div>
                            <div className="text-gray-600">Environmental Score</div>
                          </div>
                          <div className="bg-white rounded p-2">
                            <div className="font-semibold text-blue-600">
                              {formatCarbon(comparisonData.frontend_data.products.product2.sustainability_scores.carbon_footprint_kg)}
                            </div>
                            <div className="text-gray-600">Carbon Footprint</div>
                          </div>
                          <div className="bg-white rounded p-2">
                            <div className="font-semibold text-purple-600">
                              {comparisonData.frontend_data.products.product2.sustainability_scores.eco_score}
                            </div>
                            <div className="text-gray-600">Eco Score</div>
                          </div>
                          <div className="bg-white rounded p-2">
                            <div className="font-semibold text-orange-600">
                              {comparisonData.frontend_data.products.product2.sustainability_scores.recyclability_score}%
                            </div>
                            <div className="text-gray-600">Recyclability</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Carbon Impact Analysis */}
              {comparisonData.winner_analysis && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-green-600" />
                    Carbon Impact Analysis
                  </h3>
                  <div className="space-y-3">
                    {comparisonData.winner_analysis.carbon_footprint && (
                      <div className="bg-white rounded p-4 border-l-4 border-green-500">
                        <div className="text-sm text-gray-800">{comparisonData.winner_analysis.carbon_footprint}</div>
                      </div>
                    )}
                    {comparisonData.winner_analysis.overall_environmental_impact && (
                      <div className="bg-white rounded p-4 border-l-4 border-blue-500">
                        <div className="text-sm text-gray-800">{comparisonData.winner_analysis.overall_environmental_impact}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sustainability Breakdown Chart */}
              {getSustainabilityChartData().length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Sustainability Breakdown (by Percentage)
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getSustainabilityChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '']} />
                      <Legend />
                      <Bar dataKey="product1" fill="#10B981" name={comparisonData.frontend_data?.products?.product1?.basic_info?.name || 'Product 1'} />
                      <Bar dataKey="product2" fill="#3B82F6" name={comparisonData.frontend_data?.products?.product2?.basic_info?.name || 'Product 2'} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Emissions Comparison Chart */}
              {getEmissionsChartData().length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    Emissions Comparison (kg CO₂e)
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getEmissionsChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`${value.toFixed(4)} kg CO₂e`, '']} />
                      <Legend />
                      <Bar dataKey="product1" fill="#EF4444" name={comparisonData.frontend_data?.products?.product1?.basic_info?.name || 'Product 1'} />
                      <Bar dataKey="product2" fill="#F59E0B" name={comparisonData.frontend_data?.products?.product2?.basic_info?.name || 'Product 2'} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Radar Chart */}
              {getRadarChartData().length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Overall Performance Radar
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={getRadarChartData()}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar name={comparisonData.frontend_data?.products?.product1?.basic_info?.name || 'Product 1'} dataKey="product1" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} />
                      <Radar name={comparisonData.frontend_data?.products?.product2?.basic_info?.name || 'Product 2'} dataKey="product2" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={2} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Improvement Recommendations
              {comparisonData.improvement_recommendations && Object.keys(comparisonData.improvement_recommendations).length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="font-semibold text-yellow-800 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Improvement Recommendations
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(comparisonData.improvement_recommendations).map(([productName, recommendations]) => (
                      <div key={productName} className="bg-white rounded p-4">
                        <h4 className="font-medium text-gray-800 mb-2 capitalize">
                          {productName.replace(/_/g, ' ')}
                        </h4>
                        {Array.isArray(recommendations) && recommendations.length > 0 ? (
                          <ul className="space-y-1">
                            {recommendations.map((rec, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-600 italic">No specific recommendations available</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )} */}

              {/* Sustainability Metrics Summary */}
              {comparisonData.sustainability_metrics && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    Sustainability Metrics Summary
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded p-4">
                      <h4 className="font-medium text-gray-700 mb-2">Carbon Intensity (per kg)</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between text-gray-700">
                          <span>Product 1:</span>
                          <span className="font-semibold text-yellow-900">{comparisonData.sustainability_metrics.carbon_intensity.product1_per_kg.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span>Product 2:</span>
                          <span className="font-semibold text-yellow-900">{comparisonData.sustainability_metrics.carbon_intensity.product2_per_kg.toFixed(3)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-4">
                      <h4 className="font-medium text-gray-700 mb-2">Packaging Efficiency</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between text-gray-700">
                          <span>Product 1:</span>
                          <span className="font-semibold text-yellow-900">{formatPercentage(comparisonData.sustainability_metrics.packaging_efficiency.product1_ratio * 100)}</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span>Product 2:</span>
                          <span className="font-semibold text-yellow-900">{formatPercentage(comparisonData.sustainability_metrics.packaging_efficiency.product2_ratio * 100)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-4">
                      <h4 className="font-medium text-gray-700 mb-2">Manufacturing Efficiency</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between text-gray-700">
                          <span>Product 1:</span>
                          <span className="font-semibold text-yellow-900">{formatPercentage(comparisonData.sustainability_metrics.manufacturing_efficiency.product1_ratio * 100)}</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span>Product 2:</span>
                          <span className="font-semibold text-yellow-900">{formatPercentage(comparisonData.sustainability_metrics.manufacturing_efficiency.product2_ratio * 100)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-4">
                      <h4 className="font-medium text-gray-700 mb-2">Recyclability Score</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between text-gray-700">
                          <span>Product 1:</span>
                          <span className="font-semibold text-yellow-900">{comparisonData.sustainability_metrics.recyclability_score.product1_score}</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span>Product 2:</span>
                          <span className="font-semibold text-yellow-900">{comparisonData.sustainability_metrics.recyclability_score.product2_score}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
