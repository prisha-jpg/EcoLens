// src\app\compare\page.tsx
"use client";

import { useState } from "react";
import HeroSection from "../components/rest/HeroSection";
import SearchMethods from "../components/rest/SearchMethods";
import PopupAnalysis from "../components/rest/PopupAnalysis";
import Link from "next/link";

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

export default function Home() {
  const [showPopup, setShowPopup] = useState(false);
  const [searchMethod, setSearchMethod] = useState<"upload" | "camera" | "url" | "barcode" | null>(null);
  const [product1Data, setProduct1Data] = useState<ProductData | null>(null);
  const [product2Data, setProduct2Data] = useState<ProductData | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const extractDataFromFolder = async (folder: string): Promise<ProductData | null> => {
    try {
      console.log(`Extracting data from folder: ${folder}`);
      
      const response = await fetch('http://localhost:5001/api/extract-labels', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folder })
      });
      
      if (!response.ok) {
        console.error(`Failed to extract labels from ${folder}: ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Extracted data from ${folder}:`, data);
      
      if (!data.success) {
        throw new Error(data.error || 'Label extraction failed');
      }
      
      return {
        product_name: data.extractedData?.product_name || "Unknown Product",
        brand: data.extractedData?.brand || "Unknown Brand",
        category: "Personal Care",
        weight: "250ml",
        packaging_type: "Plastic",
        ingredient_list: data.extractedData?.ingredients || "",
        latitude: 12.9716,
        longitude: 77.5946,
        usage_frequency: "daily",
        manufacturing_loc: data.extractedData?.manufacturer_state || "Mumbai"
      };
    } catch (error) {
      console.error(`Error extracting data from ${folder}:`, error);
      return null;
    }
  };

  const handleSearchSubmit = (method: typeof searchMethod) => {
    setSearchMethod(method);
    // Remove the automatic popup trigger since we want manual comparison
  };

  const closePopup = () => {
    setShowPopup(false);
    setSearchMethod(null);
    setProduct1Data(null);
    setProduct2Data(null);
  };

  const handleCompareClick = async () => {
    setIsComparing(true);
    
    try {
      console.log('Starting product comparison...');
      
      // Extract data from both product folders
      const [data1, data2] = await Promise.all([
        extractDataFromFolder('product1'),
        extractDataFromFolder('product2')
      ]);
      
      console.log('Product 1 data:', data1);
      console.log('Product 2 data:', data2);
      
      if (!data1 && !data2) {
        alert('No product images found. Please upload images for both products before comparing.');
        return;
      }
      
      if (!data1) {
        alert('No images found for Product 1. Please upload images for the first product.');
        return;
      }
      
      if (!data2) {
        alert('No images found for Product 2. Please upload images for the second product.');
        return;
      }
      
      // Set the extracted data
      setProduct1Data(data1);
      setProduct2Data(data2);
      
      // Open the popup
      setShowPopup(true);
      
      console.log('Comparison popup opened successfully');
      
    } catch (error) {
      console.error('Comparison error:', error);
      alert('Failed to extract product data. Please make sure both products have been uploaded and try again.');
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <>
      <HeroSection />
      
      {/* Product Upload Sections */}
      <div className="flex w-full gap-4 px-4">
        <SearchMethods 
          value={2} 
          onSubmit={handleSearchSubmit} 
          className="flex-1" 
        />
        <SearchMethods 
          value={3} 
          onSubmit={handleSearchSubmit} 
          className="flex-1" 
        />
      </div>
      
      {/* Compare Button */}
      <div className="flex justify-center my-8">
        <button
          className={`px-6 py-3 text-white rounded-full shadow-lg transition ${
            isComparing 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
          onClick={handleCompareClick}
          disabled={isComparing}
        >
          {isComparing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </span>
          ) : (
            'Compare'
          )}
        </button>
      </div>

      {/* Instructions */}
      <div className="max-w-2xl mx-auto mb-8 px-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">How to Compare Products:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
            <li>Upload images for Product 1 using the left upload section</li>
            <li>Upload images for Product 2 using the right upload section</li>
            <li>Click the "Compare" button to analyze both products</li>
            <li>View the detailed comparison results in the popup</li>
          </ol>
        </div>
      </div>

      {/* Popup Analysis Component */}
      <PopupAnalysis 
        isOpen={showPopup} 
        onClose={closePopup} 
        product1Data={product1Data} 
        product2Data={product2Data} 
      />
    </>
  );