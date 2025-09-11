"use client";
import React, { useState } from "react";

export default function RecyclingGuide() {
  const [activeCategory, setActiveCategory] = useState("plastic");

  const recyclingData = {
    plastic: {
      title: "Plastic Items",
      color: "bg-blue-50 border-blue-200",
      items: [
        {
          name: "Bottles & Containers",
          steps: ["Remove caps and labels", "Rinse thoroughly", "Place in recycling bin"],
          icon: "🟦"
        },
        {
          name: "Food Packaging",
          steps: ["Clean off food residue", "Check recycling number", "Sort by type"],
          icon: "🟦"
        }
      ]
    },
    paper: {
      title: "Paper Products",
      color: "bg-green-50 border-green-200",
      items: [
        {
          name: "Newspapers & Magazines",
          steps: ["Remove plastic wrapping", "Keep dry and clean", "Bundle together"],
          icon: "🟩"
        },
        {
          name: "Cardboard Boxes",
          steps: ["Remove tape and staples", "Flatten boxes", "Keep clean and dry"],
          icon: "🟩"
        }
      ]
    },
    glass: {
      title: "Glass Materials",
      color: "bg-amber-50 border-amber-200",
      items: [
        {
          name: "Jars & Bottles",
          steps: ["Remove lids and labels", "Rinse clean", "Sort by color if required"],
          icon: "🟨"
        }
      ]
    },
    metal: {
      title: "Metal Objects",
      color: "bg-gray-50 border-gray-200",
      items: [
        {
          name: "Aluminum Cans",
          steps: ["Empty completely", "Rinse if needed", "Crush to save space"],
          icon: "⬜"
        },
        {
          name: "Steel Containers",
          steps: ["Remove labels", "Clean thoroughly", "Check for magnetic properties"],
          icon: "⬜"
        }
      ]
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="py-16 px-8 text-center border-b border-gray-100">
        <h1 className="text-4xl font-light text-gray-900 mb-4">
          How to Recycle Objects
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          A simple visual guide to properly prepare and sort your recyclable materials
        </p>
      </header>

      {/* Category Navigation */}
      <nav className="py-8 px-8 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4">
            {Object.entries(recyclingData).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`px-6 py-3 rounded-full transition-all duration-200 ${
                  activeCategory === key
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.title}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-12 px-8">
        <div className="max-w-6xl mx-auto">
          <div className={`rounded-2xl p-8 ${recyclingData[activeCategory].color}`}>
            <h2 className="text-3xl font-light text-gray-900 mb-8 text-center">
              {recyclingData[activeCategory].title}
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {recyclingData[activeCategory].items.map((item, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full mr-4">
                      <span className="text-2xl">{item.icon}</span>
                    </div>
                    <h3 className="text-xl font-medium text-gray-900">{item.name}</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {item.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="flex items-start">
                        <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5 flex-shrink-0">
                          {stepIndex + 1}
                        </div>
                        <p className="text-gray-700">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* General Tips Section */}
          <div className="mt-16 bg-gray-50 rounded-2xl p-8">
            <h2 className="text-2xl font-light text-gray-900 mb-6 text-center">
              General Recycling Tips
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-green-400 rounded"></div>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Clean First</h3>
                <p className="text-gray-600 text-sm">Always clean containers before recycling to avoid contamination</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-yellow-300 rounded-full"></div>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Check Locally</h3>
                <p className="text-gray-600 text-sm">Recycling rules vary by location, check your local guidelines</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-orange-300 rounded-sm"></div>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Sort Properly</h3>
                <p className="text-gray-600 text-sm">Separate materials correctly to ensure effective recycling</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-gray-100 text-center">
        <p className="text-gray-500">
          Remember: When in doubt, check with your local recycling center
        </p>
      </footer>
    </div>
  );
}

