"use client";

import React, { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function HorizontalScrollPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.innerWidth < 768) return; // Disable horizontal scroll on mobile

      const sections = gsap.utils.toArray<HTMLElement>(".panel");
      const container = containerRef.current;
      if (!container || sections.length === 0) return;

      gsap.to(sections, {
        xPercent: -100 * (sections.length - 1),
        ease: "none",
        scrollTrigger: {
          trigger: container,
          pin: true,
          scrub: 1,
          snap: 1 / (sections.length - 1),
          end: () => `+=${container.scrollWidth - window.innerWidth}`,
          markers: false,
        },
      });

      // Refresh positions on resize
      ScrollTrigger.addEventListener("refreshInit", () => {
        gsap.set(sections, { clearProps: "all" });
      });
    },
    { scope: containerRef }
  );

  const panels = [
    {
      bg: "bg-blue-400",
      title: "🌊 The Great Pacific Garbage Patch",
      content: (
        <ul className="list-disc list-inside text-lg text-gray-800 space-y-4">
          <li>
            <strong>Location:</strong> Pacific Ocean (between Hawaii and
            California)
          </li>
          <li>
            <strong>Problem:</strong> Massive accumulation of non-recyclable
            plastics like microplastics, fishing nets, and packaging.
          </li>
          <li>
            <strong>Impact:</strong>
            <ul className="list-disc list-inside ml-6 mt-2 space-y-2 text-base">
              <li>
                Over <strong>1.8 trillion pieces</strong> of plastic covering{" "}
                <strong>1.6 million km²</strong>
              </li>
              <li>
                Marine animals ingest plastic → Over{" "}
                <strong>1 million seabirds</strong> &{" "}
                <strong>100,000 marine mammals</strong> die annually
              </li>
              <li>
                Plastics don't biodegrade; they break into microplastics,
                entering the food chain
              </li>
            </ul>
          </li>
          <li>
            <strong>Lesson:</strong> Poor recycling infrastructure + bad product
            design = severe long-term harm.
          </li>
        </ul>
      ),
    },
    {
      bg: "bg-gray-400",
      title: "📦 Multilayer Packaging in India",
      content: (
        <ul className="list-disc list-inside text-lg text-gray-800 space-y-4">
          <li>
            <strong>Location:</strong> Urban & rural India
          </li>
          <li>
            <strong>Problem:</strong> Widespread use of multi-layer flexible
            packaging
          </li>
          <li>
            <strong>Impact:</strong>
            <ul className="list-disc list-inside ml-6 mt-2 space-y-2 text-base">
              <li>
                Mixed materials (plastic + foil) → almost impossible to recycle
              </li>
              <li>Littered everywhere — clog drains, harm cattle</li>
              <li>Recycling rate under 5%</li>
            </ul>
          </li>
          <li>
            <strong>Lesson:</strong> Shelf life > recyclability = large-scale
            waste.
          </li>
        </ul>
      ),
    },
    {
      bg: "bg-purple-400",
      title: "🍼 Disposable Diapers in Landfills",
      content: (
        <ul className="list-disc list-inside text-lg text-gray-800 space-y-4">
          <li>
            <strong>Location:</strong> Global focus on US & Europe
          </li>
          <li>
            <strong>Problem:</strong> Mixed materials make recycling impossible
          </li>
          <li>
            <strong>Impact:</strong>
            <ul className="list-disc list-inside ml-6 mt-2 space-y-2 text-base">
              <li>20 billion diapers in US landfills per year</li>
              <li>Takes up to 500 years to decompose</li>
              <li>Contains multiple layers — can't be easily separated</li>
            </ul>
          </li>
          <li>
            <strong>Lesson:</strong> Convenience products = long-term waste
            challenges.
          </li>
        </ul>
      ),
    },
    {
      bg: "bg-green-500",
      title: "💻 E-Waste in Agbogbloshie, Ghana",
      content: (
        <ul className="list-disc list-inside text-lg text-gray-800 space-y-4">
          <li>
            <strong>Location:</strong> Agbogbloshie, Accra, Ghana
          </li>
          <li>
            <strong>Problem:</strong> E-waste dumping from developed countries
          </li>
          <li>
            <strong>Impact:</strong>
            <ul className="list-disc list-inside ml-6 mt-2 space-y-2 text-base">
              <li>
                Burning e-waste → toxic chemicals (lead, mercury) released
              </li>
              <li>
                Pollution affects air, water, soil, and community health
              </li>
              <li>Children exposed to neurotoxins during dismantling</li>
            </ul>
          </li>
          <li>
            <strong>Lesson:</strong> Weak global recycling standards harm
            vulnerable communities.
          </li>
        </ul>
      ),
    },
  ];

  return (
    <>
      {/* Horizontal scroll for desktop */}
      <div className="hidden md:block h-screen overflow-x-hidden" ref={containerRef}>
        <div
          className="flex h-screen"
          style={{ width: `${panels.length * 100}vw` }}
        >
          {panels.map((panel, idx) => (
            <div
              key={idx}
              className={`panel flex flex-col items-center justify-center min-h-screen w-screen px-4 sm:px-6 sm:py-12 py-6 ${panel.bg}`}
            >
              <div className="w-full max-w-3xl">
                <h1 className="text-3xl sm:text-5xl font-extrabold text-black mb-6 sm:mb-8 text-center">
                  {panel.title}
                </h1>
                {panel.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vertical stack for mobile */}
      <div className="flex flex-col md:hidden">
        {panels.map((panel, idx) => (
          <div
            key={idx}
            className={`flex flex-col items-center justify-center w-full px-4 sm:px-6 sm:py-12 py-6 ${panel.bg}`}
          >
            <div className="w-full max-w-3xl">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-black mb-4 sm:mb-6 text-center">
                {panel.title}
              </h1>
              {panel.content}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}


// "use client";

// import React, { useState } from "react";

// export default function NonRecyclableGuide() {
//   const [activeCategory, setActiveCategory] = useState("electronics");

//   const nonRecyclableData = {
//     electronics: {
//       title: "Electronic Waste",
//       color: "bg-purple-50 border-purple-200",
//       items: [
//         {
//           name: "Old Smartphones & Tablets",
//           methods: ["Take to manufacturer trade-in programs", "Find certified e-waste recyclers", "Donate to repair cafes"],
//           icon: "⬜"
//         },
//         {
//           name: "Broken Appliances",
//           methods: ["Contact manufacturer for take-back", "Schedule municipal e-waste pickup", "Salvage parts for DIY projects"],
//           icon: "⬜"
//         },
//         {
//           name: "CRT Monitors & TVs",
//           methods: ["Special hazardous waste facilities only", "Never put in regular trash", "Check retailer take-back programs"],
//           icon: "⬜"
//         }
//       ]
//     },
//     composite: {
//       title: "Composite Materials",
//       color: "bg-orange-50 border-orange-200",
//       items: [
//         {
//           name: "Chip Bags & Snack Wrappers",
//           methods: ["Collect for TerraCycle programs", "Clean and use as plant pot liners", "Send to specialized processors"],
//           icon: "🟧"
//         },
//         {
//           name: "Coffee Pods",
//           methods: ["Empty contents for composting", "Check for aluminum recycling programs", "Switch to refillable alternatives"],
//           icon: "🟧"
//         },
//         {
//           name: "Laminated Paper",
//           methods: ["Separate layers if possible", "Use for craft projects", "Compost non-plastic portions"],
//           icon: "🟧"
//         }
//       ]
//     },
//     textiles: {
//       title: "Textile Waste",
//       color: "bg-pink-50 border-pink-200",
//       items: [
//         {
//           name: "Worn-Out Clothing",
//           methods: ["Cut into cleaning rags", "Donate to textile recycling bins", "Use stuffing for pillows or pet beds"],
//           icon: "🟨"
//         },
//         {
//           name: "Old Shoes",
//           methods: ["Nike Reuse-A-Shoe program", "Donate to homeless shelters", "Use as garden planters"],
//           icon: "🟨"
//         },
//         {
//           name: "Damaged Bedding",
//           methods: ["Animal shelters often need them", "Cut into drop cloths for projects", "Repurpose as packing material"],
//           icon: "🟨"
//         }
//       ]
//     },
//     hazardous: {
//       title: "Hazardous Materials",
//       color: "bg-red-50 border-red-200",
//       items: [
//         {
//           name: "Batteries",
//           methods: ["Take to battery collection points", "Never throw in regular trash", "Check auto parts stores for take-back"],
//           icon: "🟥"
//         },
//         {
//           name: "Paint & Chemicals",
//           methods: ["Bring to hazardous waste facilities", "Use up completely before disposal", "Check with paint stores for programs"],
//           icon: "🟥"
//         },
//         {
//           name: "Light Bulbs (CFL/LED)",
//           methods: ["Hardware stores often accept them", "Special mercury-containing waste sites", "Never break - contains toxic materials"],
//           icon: "🟥"
//         }
//       ]
//     }
//   };

//   return (
//     <div className="min-h-screen bg-white">
//       {/* Header */}
//       <header className="py-16 px-8 text-center border-b border-gray-100">
//         <h1 className="text-4xl font-light text-gray-900 mb-4">
//           How to Handle Non-Recyclable Objects
//         </h1>
//         <p className="text-lg text-gray-600 max-w-3xl mx-auto">
//           When traditional recycling isn't possible, these alternatives help minimize waste and environmental impact
//         </p>
//       </header>

//       {/* Category Navigation */}
//       <nav className="py-8 px-8 border-b border-gray-100">
//         <div className="max-w-4xl mx-auto">
//           <div className="flex flex-wrap justify-center gap-4">
//             {Object.entries(nonRecyclableData).map(([key, category]) => (
//               <button
//                 key={key}
//                 onClick={() => setActiveCategory(key)}
//                 className={`px-6 py-3 rounded-full transition-all duration-200 ${
//                   activeCategory === key
//                     ? "bg-gray-900 text-white"
//                     : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//                 }`}
//               >
//                 {category.title}
//               </button>
//             ))}
//           </div>
//         </div>
//       </nav>

//       {/* Main Content */}
//       <main className="py-12 px-8">
//         <div className="max-w-6xl mx-auto">
//           <div className={`rounded-2xl p-8 ${nonRecyclableData[activeCategory].color}`}>
//             <h2 className="text-3xl font-light text-gray-900 mb-8 text-center">
//               {nonRecyclableData[activeCategory].title}
//             </h2>

//             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
//               {nonRecyclableData[activeCategory].items.map((item, index) => (
//                 <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
//                   <div className="flex items-center mb-4">
//                     <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full mr-4">
//                       <span className="text-2xl">{item.icon}</span>
//                     </div>
//                     <h3 className="text-xl font-medium text-gray-900">{item.name}</h3>
//                   </div>
                  
//                   <div className="space-y-3">
//                     {item.methods.map((method, methodIndex) => (
//                       <div key={methodIndex} className="flex items-start">
//                         <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5 flex-shrink-0">
//                           {methodIndex + 1}
//                         </div>
//                         <p className="text-gray-700">{method}</p>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Alternative Strategies Section */}
//           <div className="mt-16 bg-gray-50 rounded-2xl p-8">
//             <h2 className="text-2xl font-light text-gray-900 mb-6 text-center">
//               Alternative Disposal Strategies
//             </h2>
//             <div className="grid md:grid-cols-4 gap-6">
//               <div className="text-center">
//                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
//                   <div className="w-8 h-8 bg-blue-300 rounded"></div>
//                 </div>
//                 <h3 className="font-medium text-gray-900 mb-2">Manufacturer Programs</h3>
//                 <p className="text-gray-600 text-sm">Many brands offer take-back or trade-in services</p>
//               </div>
//               <div className="text-center">
//                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
//                   <div className="w-8 h-8 bg-green-300 rounded-full"></div>
//                 </div>
//                 <h3 className="font-medium text-gray-900 mb-2">Specialized Facilities</h3>
//                 <p className="text-gray-600 text-sm">Find certified processors for specific materials</p>
//               </div>
//               <div className="text-center">
//                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
//                   <div className="w-8 h-8 bg-yellow-300 rounded-sm"></div>
//                 </div>
//                 <h3 className="font-medium text-gray-900 mb-2">Creative Reuse</h3>
//                 <p className="text-gray-600 text-sm">Transform waste into functional or decorative items</p>
//               </div>
//               <div className="text-center">
//                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
//                   <div className="w-8 h-8 bg-purple-300 rounded"></div>
//                 </div>
//                 <h3 className="font-medium text-gray-900 mb-2">Community Programs</h3>
//                 <p className="text-gray-600 text-sm">Local collection events and swap programs</p>
//               </div>
//             </div>
//           </div>

//           {/* Important Safety Notes */}
//           <div className="mt-16 bg-red-50 border-l-4 border-red-400 rounded-2xl p-8">
//             <h2 className="text-2xl font-light text-gray-900 mb-6">
//               Safety Reminders
//             </h2>
//             <div className="grid md:grid-cols-2 gap-6">
//               <div className="space-y-4">
//                 <div className="flex items-start">
//                   <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
//                     !
//                   </div>
//                   <div>
//                     <h3 className="font-medium text-gray-900 mb-1">Never Mix Hazardous Items</h3>
//                     <p className="text-gray-700 text-sm">Keep batteries, chemicals, and electronics separate from regular waste</p>
//                   </div>
//                 </div>
//                 <div className="flex items-start">
//                   <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
//                     !
//                   </div>
//                   <div>
//                     <h3 className="font-medium text-gray-900 mb-1">Research Before Disposal</h3>
//                     <p className="text-gray-700 text-sm">Always check local regulations and available programs first</p>
//                   </div>
//                 </div>
//               </div>
//               <div className="space-y-4">
//                 <div className="flex items-start">
//                   <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
//                     !
//                   </div>
//                   <div>
//                     <h3 className="font-medium text-gray-900 mb-1">Store Safely Until Disposal</h3>
//                     <p className="text-gray-700 text-sm">Keep hazardous items in original containers in secure locations</p>
//                   </div>
//                 </div>
//                 <div className="flex items-start">
//                   <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
//                     !
//                   </div>
//                   <div>
//                     <h3 className="font-medium text-gray-900 mb-1">Consider Prevention</h3>
//                     <p className="text-gray-700 text-sm">Choose reusable or easily recyclable alternatives when possible</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </main>

//       {/* Footer */}
//       <footer className="py-8 px-8 border-t border-gray-100 text-center">
//         <p className="text-gray-500 mb-2">
//           Find local disposal programs and facilities in your area
//         </p>
//         <p className="text-gray-400 text-sm">
//           When in doubt, contact your municipal waste management office
//         </p>
//       </footer>
//     </div>
//   );
// }
