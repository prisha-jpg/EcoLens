// components/inputs/BarcodeInput.tsx
"use client";

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Barcode, Camera, Check } from 'lucide-react';
import dynamic from 'next/dynamic';
const BarcodeScanner = dynamic(() => import('./BarcodeScanner'), { ssr: false });
interface BarcodeInputProps {
  onSubmit?: (barcode: string) => void;
  onScanRequest?: () => void;
}

export default function BarcodeInput({ 
  onSubmit, 
  onScanRequest 
}: BarcodeInputProps) {
  const [barcode, setBarcode] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Auto-start scanning when the component mounts
  useEffect(() => {
    setScanning(true);
  }, []);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const isValidBarcode = validateBarcode(barcode);
    setIsValid(isValidBarcode);
    
    if (isValidBarcode && onSubmit) {
      onSubmit(barcode);
    }
    if (isValidBarcode) {
      void handleBarcodeFlow(barcode);
    }
  };

  const validateBarcode = (code: string) => {
    return /^\d{8,}$/.test(code); // Simple validation: 8+ digits
  };

  const handleScanComplete = (code: string) => {
    setScannedCode(code);
    setBarcode(code);
    setScanning(false);
    setIsValid(true);
    if (onSubmit) onSubmit(code);
    void handleBarcodeFlow(code);
  };

  const handleBarcodeFlow = async (code: string) => {
    try {
      if (isSubmitting) return;
      setIsSubmitting(true);
      // 1) Call backend proxy for ML get_barcode
      const srcResp = await fetch(`http://localhost:5001/api/get_barcode?barcode=${encodeURIComponent(code)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      let srcData: any = null;
      if (!srcResp.ok) {
        const errText = await srcResp.text().catch(() => '');
        console.error('Barcode proxy upstream error:', srcResp.status, errText);
        throw new Error(`Failed to fetch barcode source (${srcResp.status})`);
      } else {
        const text = await srcResp.text();
        try {
          srcData = JSON.parse(text);
        } catch {
          console.error('Barcode proxy returned non-JSON body:', text?.slice(0, 300));
          throw new Error('Barcode proxy returned non-JSON body');
        }
      }

      // 2) Build payload for eco-score using ML response
      const product = srcData?.product || {};

      const sanitizeSimple = (value: any, fallback: string): string => {
        const text = typeof value === 'string' ? value : fallback;
        return text
          .replace(/[\r\n\t]+/g, ' ')
          .replace(/[\u2022\u25CF\u00B7\u2027\u2219]/g, ' ')
          .replace(/[()]/g, '')
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
          .replace(/[^A-Za-z0-9,.;:\-\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 2000);
      };

      const ecoPayload = {
        product_name: sanitizeSimple(product.product_name, 'Unknown Product'),
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

      // 3) Redirect to dashboard with query params
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
      console.error('Barcode flow failed', e);
      alert((e as Error).message || 'Barcode flow failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {scanning ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
            <BarcodeScanner onDetected={handleScanComplete} />
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              Auto-scan active. Align barcode within the frame.
            </div>
          </div>
          <button
            onClick={() => setScanning(false)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel Scan
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col items-center w-full">
          <div className="w-full max-w-lg mb-4">
            <input
              type="text"
              placeholder="Enter barcode manually (8+ digits)"
              className={`w-full px-4 py-2 text-black border ${isValid ? 'border-green-300' : 'border-red-500'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500`}
              value={barcode}
              onChange={(e) => {
                setBarcode(e.target.value);
                setIsValid(true);
              }}
              inputMode="numeric"
            />
            {scannedCode && (
              <p className="mt-2 text-sm text-green-600">
                Scanned code: {scannedCode}
              </p>
            )}
            {!isValid && (
              <p className="mt-1 text-sm text-red-500">
                Please enter a valid barcode (minimum 8 digits)
              </p>
            )}
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={!barcode.trim() || isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Check size={18} />
              {isSubmitting ? 'Processing...' : 'Submit Barcode'}
            </button>
            <button
              type="button"
              className="px-6 py-2 bg-blue-100 text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-200 transition flex items-center"
              onClick={() => setScanning(true)}
            >
              <Camera size={18} className="mr-2" />
              Scan Barcode
            </button>
          </div>
        </form>
      )}
    </div>
  );
}


// "use client";

// import { FormEvent, useState } from 'react';
// import { Barcode, Camera, Check } from 'lucide-react';

// interface BarcodeInputProps {
//   onSubmit?: (barcode: string) => void;
//   onScanRequest?: () => void;
// }

// export default function BarcodeInput({ 
//   onSubmit, 
//   onScanRequest 
// }: BarcodeInputProps) {
//   const [barcode, setBarcode] = useState('');
//   const [isValid, setIsValid] = useState(true);
//   const [scanning, setScanning] = useState(false);
//   const [scannedCode, setScannedCode] = useState('');

//   const handleSubmit = (e: FormEvent) => {
//     e.preventDefault();
//     const isValidBarcode = validateBarcode(barcode);
//     setIsValid(isValidBarcode);
    
//     if (isValidBarcode && onSubmit) {
//       onSubmit(barcode);
//     }
//   };

//   const validateBarcode = (code: string) => {
//     // Basic validation - at least 8 digits
//     return /^\d{8,}$/.test(code);
//   };

//   const handleScanComplete = (code: string) => {
//     setScannedCode(code);
//     setBarcode(code);
//     setScanning(false);
//     setIsValid(true);
//   };

//   return (
//     <div className="w-full">
//       {scanning ? (
//         <div className="flex flex-col items-center gap-4">
//           <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
//             {/* Camera preview would go here */}
//             <div className="w-full h-full flex flex-col items-center justify-center gap-2">
//               <Camera className="w-12 h-12 text-gray-400" />
//               <p className="text-sm text-gray-500">Scanning barcode...</p>
//             </div>
//           </div>
//           <button
//             onClick={() => setScanning(false)}
//             className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
//           >
//             Cancel Scan
//           </button>
//           {/* In a real implementation, you'd integrate a barcode scanner library here */}
//           <div className="hidden">
//             <BarcodeScanner onDetected={handleScanComplete} />
//           </div>
//         </div>
//       ) : (
//         <form onSubmit={handleSubmit} className="flex flex-col items-center w-full">
//           <div className="w-full max-w-lg mb-4">
//             <input
//               type="text"
//               placeholder="Enter barcode manually (8+ digits)"
//               className={`w-full px-4 py-2 border ${isValid ? 'border-green-300' : 'border-red-500'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500`}
//               value={barcode}
//               onChange={(e) => {
//                 setBarcode(e.target.value);
//                 setIsValid(true);
//               }}
//               inputMode="numeric"
//             />
//             {scannedCode && (
//               <p className="mt-2 text-sm text-green-600">
//                 Scanned code: {scannedCode}
//               </p>
//             )}
//             {!isValid && (
//               <p className="mt-1 text-sm text-red-500">
//                 Please enter a valid barcode (minimum 8 digits)
//               </p>
//             )}
//           </div>
//           <div className="flex gap-4">
//             <button
//               type="submit"
//               disabled={!barcode.trim()}
//               className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
//             >
//               <Check size={18} />
//               Submit Barcode
//             </button>
//             <button
//               type="button"
//               className="px-6 py-2 bg-blue-100 text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-200 transition flex items-center"
//               onClick={() => setScanning(true)}
//             >
//               <Camera size={18} className="mr-2" />
//               Scan Barcode
//             </button>
//           </div>
//         </form>
//       )}
//     </div>
//   );
// }

// // "use client";

// // import { FormEvent, useState } from 'react';
// // import { Barcode, Camera } from 'lucide-react';

// // interface BarcodeInputProps {
// //   onSubmit?: (barcode: string) => void;
// //   onScanRequest?: () => void;
// // }

// // export default function BarcodeInput({ 
// //   onSubmit, 
// //   onScanRequest 
// // }: BarcodeInputProps) {
// //   const [barcode, setBarcode] = useState('');
// //   const [isValid, setIsValid] = useState(true);

// //   const handleSubmit = (e: FormEvent) => {
// //     e.preventDefault();
// //     const isValidBarcode = validateBarcode(barcode);
// //     setIsValid(isValidBarcode);
    
// //     if (isValidBarcode && onSubmit) {
// //       onSubmit(barcode);
// //     }
// //   };

// //   const validateBarcode = (code: string) => {
// //     // Basic validation - at least 8 digits
// //     return /^\d{8,}$/.test(code);
// //   };

// //   return (
// //     <form onSubmit={handleSubmit} className="flex flex-col items-center w-full">
// //       <div className="w-full max-w-lg">
// //         <input
// //           type="text"
// //           placeholder="Enter barcode number (8+ digits)"
// //           className={`w-full px-4 py-2 border ${isValid ? 'border-green-300' : 'border-red-500'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500`}
// //           value={barcode}
// //           onChange={(e) => {
// //             setBarcode(e.target.value);
// //             setIsValid(true);
// //           }}
// //           inputMode="numeric"
// //         />
// //         {!isValid && (
// //           <p className="mt-1 text-sm text-red-500">
// //             Please enter a valid barcode (minimum 8 digits)
// //           </p>
// //         )}
// //       </div>
// //       <div className="mt-4 flex space-x-4">
// //         <button
// //           type="submit"
// //           disabled={!barcode.trim()}
// //           className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
// //         >
// //           Search
// //         </button>
// //         <button
// //           type="button"
// //           className="px-6 py-2 bg-green-100 text-green-800 border border-green-300 rounded-lg hover:bg-green-200 transition flex items-center"
// //           onClick={onScanRequest}
// //         >
// //           <Camera size={18} className="mr-2" />
// //           Scan Barcode
// //         </button>
// //       </div>
// //     </form>
// //   );
// // }