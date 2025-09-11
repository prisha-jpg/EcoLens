//src\app\components\rest\inputs\upload\UploadInput.tsx
"use client";

import { ChangeEvent, useState, useRef } from "react";
import { Upload, Camera, X, Check } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const CameraInput = dynamic(() => import("../CameraInput"), {
  ssr: false,
  loading: () => <div className="p-4 text-center">Loading camera...</div>,
});

interface UploadInputProps {
  onComplete?: (images: { front?: string; back?: string }) => void;
  uploadEndpoint?: 1 | 2 | 3;
  onUpload?: (file: File) => void;
}

export default function UploadInput({ onComplete, uploadEndpoint = 1, onUpload }: UploadInputProps) {
  console.log("UploadInput received uploadEndpoint:", uploadEndpoint);
  const router = useRouter();
  const [activeSide, setActiveSide] = useState<"front" | "back" | null>(null);
  const [images, setImages] = useState<{ front?: string; back?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getUploadUrl = () => {
    switch (uploadEndpoint) {
      case 1:
        return "http://localhost:5001/upload";
      case 2:
        return "http://localhost:5001/upload-product1";
      case 3:
        return "http://localhost:5001/upload-product2";
      default:
        return "http://localhost:5001/upload";
    }
  };

  const getFolderName = () => {
    switch (uploadEndpoint) {
      case 1:
        return "uploads";
      case 2:
        return "product1";
      case 3:
        return "product2";
      default:
        return "uploads";
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && activeSide) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      const newImages = { ...images, [activeSide]: imageUrl };
      setImages(newImages);
      setActiveSide(null);
      onComplete?.(newImages);
    }
  };

  const handleBoxClick = (side: "front" | "back") => {
    setActiveSide(side);
  };

  const handleCloseCamera = () => {
    setActiveSide(null);
  };

  const handleImageCapture = (imageUrl: string) => {
    if (activeSide) {
      const newImages = { ...images, [activeSide]: imageUrl };
      setImages(newImages);
      setActiveSide(null);
      onComplete?.(newImages);
    }
  };

  const removeImage = (side: "front" | "back") => {
    setImages((prev) => {
      const newImages = { ...prev };
      delete newImages[side];
      onComplete?.(newImages);
      return newImages;
    });
  };

const submitImages = async () => {
  if (Object.keys(images).length === 0) return;

  setIsSubmitting(true);

  try {
    const uploadedUrls: { front?: string; back?: string } = {};
    const uploadUrl = getUploadUrl();
    console.log(`Starting image upload process to ${uploadUrl}...`);

    // 1. Upload images first
    for (const [side, imageUrl] of Object.entries(images)) {
      console.log(`Processing ${side} image...`);

      let blob;
      if (imageUrl.startsWith("data:")) {
        console.log("Converting data URL to blob...");
        const res = await fetch(imageUrl);
        blob = await res.blob();
      } else {
        console.log("Getting blob from file URL...");
        const response = await fetch(imageUrl);
        blob = await response.blob();
      }

      const formData = new FormData();
      formData.append("image", blob, `${side}-image.jpg`);

      console.log(`Uploading ${side} to ${uploadUrl}...`);
      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      console.log("Upload response status:", res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Upload failed with details:", errorData);
        throw new Error(`Upload failed with status ${res.status}`);
      }

      const data = await res.json();
      console.log(`${side} upload successful, response:`, data);
      uploadedUrls[side as "front" | "back"] = data.fileUrl;
    }

    // 2. Extract labels from the uploaded images
    console.log("Calling extract-labels API with folder:", getFolderName());
    const extractLabelsResponse = await fetch(
      "http://localhost:5001/api/extract-labels",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: getFolderName() }),
      }
    );

    console.log("Extract-labels response status:", extractLabelsResponse.status);

    if (!extractLabelsResponse.ok) {
      const errorData = await extractLabelsResponse.json().catch(() => ({}));
      console.error("Extract-labels request failed:", errorData);
      throw new Error("Failed to extract labels");
    }

    const extractLabelsData = await extractLabelsResponse.json();
    console.log("Extract-labels data received:", extractLabelsData);

    // 3. Get eco-score using the extracted data
    console.log("Now fetching eco-score...");
    const ecoScoreResponse = await fetch(
      "http://localhost:5001/api/get-eco-score-proxy", // or use ML_NGROK_URL directly
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: extractLabelsData.extractedData?.product_name || "Unknown Product",
          brand: extractLabelsData.extractedData?.brand || "Unknown Brand",
          category: "Personal Care", // Default or get from user input
          weight: "100ml", // Default or get from user input
          packaging_type: "Plastic Bottle", // Default or get from user input
          ingredient_list: extractLabelsData.extractedData?.ingredients || "",
          latitude: 12.9716, // Default or get from user location
          longitude: 77.5946, // Default or get from user location
          usage_frequency: "daily", // Default or get from user input
          manufacturing_loc: extractLabelsData.extractedData?.manufacturer_state || "Mumbai",
        }),
      }
    );

    console.log("Eco-score response status:", ecoScoreResponse.status);

    if (!ecoScoreResponse.ok) {
      const errorData = await ecoScoreResponse.json().catch(() => ({}));
      console.error("Eco-score fetch failed with details:", errorData);
      throw new Error("Failed to get eco-score");
    }

    const ecoScoreData = await ecoScoreResponse.json();
    console.log("Eco-score data received:", ecoScoreData);

    onComplete?.(uploadedUrls);

    // 4. In compare flow (product1/product2), persist data instead of redirecting
    if (uploadEndpoint === 2 || uploadEndpoint === 3) {
      const keySuffix = uploadEndpoint === 2 ? 'product1' : 'product2';
      try {
        localStorage.setItem(`compare_${keySuffix}_images`, JSON.stringify(uploadedUrls));
        localStorage.setItem(`compare_${keySuffix}_extract`, JSON.stringify(extractLabelsData));
        localStorage.setItem(`compare_${keySuffix}_eco`, JSON.stringify(ecoScoreData));
        localStorage.setItem(`compare_${keySuffix}_ready`, 'true');
      } catch (e) {
        console.error('Failed to persist compare data to localStorage', e);
      }
      // Stay on the compare page
      return;
    }

    // Default flow: redirect to dashboard with all data
    const queryParams = new URLSearchParams();
    if (uploadedUrls.front) queryParams.append("front", uploadedUrls.front);
    if (uploadedUrls.back) queryParams.append("back", uploadedUrls.back);
    queryParams.append("folder", getFolderName());
    queryParams.append("ecoScore", encodeURIComponent(JSON.stringify(ecoScoreData)));
    queryParams.append("labelData", encodeURIComponent(JSON.stringify(extractLabelsData.extractedData)));
    router.push(`/dashboard?${queryParams.toString()}`);
  } catch (error) {
    console.error("Upload failed:", error);
    // You might want to show an error message to the user here
  } finally {
    setIsSubmitting(false);
  }
};
  
  return (
    <div className="flex flex-col items-center w-full">
      <div className="mb-2 text-xs text-gray-500">
        Upload destination: {getFolderName()} (Endpoint {uploadEndpoint})
      </div>

      {activeSide ? (
        <div className="w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Capture {activeSide} image</h3>
            <button
              onClick={handleCloseCamera}
              className="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>
          <CameraInput onCapture={handleImageCapture} />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload File Instead
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 w-full mb-4">
            {["front", "back"].map((side) => (
              <div
                key={side}
                onClick={() =>
                  !images[side as "front" | "back"] &&
                  handleBoxClick(side as "front" | "back")
                }
                className={`border-2 ${
                  images[side as "front" | "back"]
                    ? "border-solid border-green-500"
                    : "border-dashed border-gray-300"
                } rounded-lg p-4 flex flex-col items-center justify-center ${
                  !images[side as "front" | "back"]
                    ? "cursor-pointer hover:bg-gray-50"
                    : ""
                } transition-colors relative`}
              >
                {images[side as "front" | "back"] ? (
                  <>
                    <img
                      src={images[side as "front" | "back"]}
                      alt={`${side} view`}
                      className="w-full h-48 object-contain rounded-md"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(side as "front" | "back");
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-gray-700 font-medium capitalize">
                      {side}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Upload clear pictures of front and back
          </p>

          {Object.keys(images).length > 0 && (
            <button
              onClick={submitImages}
              disabled={isSubmitting}
              className={`px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <Check size={20} />
                  Submit Images
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
