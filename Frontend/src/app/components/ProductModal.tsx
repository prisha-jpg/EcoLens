"use client";

import { useState } from "react";

interface Product {
  product_name: string;
  brand: string;
  category: string;
  eco_score: string;
  ideal_eco_score: string;
  eco_status: string;
  ["manufacturing location"]?: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductModal({ isOpen, onClose }: ProductModalProps) {
  const [query, setQuery] = useState<string>("");
  const [product, setProduct] = useState<Product | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [loadingLookup, setLoadingLookup] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);

  if (!isOpen) return null;

  const lookupProduct = async () => {
    setLoadingLookup(true);
    setStatusMsg("");
    setProduct(null);
    try {
      const res = await fetch("http://localhost:5001/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_name: query }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg(data.error || "Not found");
      } else {
        setProduct(data.product);
      }
    } catch (err) {
      setStatusMsg("Server error");
    } finally {
      setLoadingLookup(false);
    }
  };

  const sendAlert = async () => {
    if (!product) return;
    setSending(true);
    setStatusMsg("");
    try {
      const res = await fetch("http://localhost:5001/api/send-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });
      const data = await res.json();
      if (!res.ok) setStatusMsg(data.error || "Error sending alert");
      else setStatusMsg(data.message || "Alert sent");
    } catch (err) {
      setStatusMsg("Server error sending alert");
    } finally {
      setSending(false);
    }
  };

  const resetModal = () => {
    setQuery("");
    setProduct(null);
    setStatusMsg("");
    setLoadingLookup(false);
    setSending(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
          onClick={resetModal}
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-green-700 mb-4">Eco Lens — Scan & Alert</h2>

        <p className="text-gray-600 mb-4">
          Paste the product name extracted by your OCR or barcode lookup.
        </p>

        <div className="flex gap-3 mb-4">
          <input
            className="flex-1 border p-2 rounded text-gray-800"
            placeholder="e.g. 'Ponds Men Bright...'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={lookupProduct}
            className="bg-green-600 text-black px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            disabled={loadingLookup || !query.trim()}
          >
            {loadingLookup ? "Searching..." : "Lookup"}
          </button>
        </div>

        {statusMsg && <p className="mb-4 text-red-600">{statusMsg}</p>}

        {product && (
          <div className="border rounded p-4 bg-gray-50 mb-4">
            <h3 className="font-semibold text-black text-lg">{product.product_name}</h3>
            <p className="text-sm text-gray-600 mb-2">
              {product.brand} • {product.category}
            </p>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <div className="text-xs text-gray-500">Eco Score</div>
                <div className="font-medium text-black">{product.eco_score}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Category Ideal</div>
                <div className="font-medium text-black">{product.ideal_eco_score}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Status</div>
                <div className={`font-semibold ${product.eco_status === 'Bad' ? 'text-red-600' : 'text-green-600'}`}>
                  {product.eco_status}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Manufactured at</div>
                <div className="font-medium text-black">{product["manufacturing location"] || "—"}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={sendAlert}
                disabled={product.eco_status !== "Bad" || sending}
                className={`px-4 py-2 rounded font-semibold text-black ${
                  product.eco_status === "Bad"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-red-800 cursor-not-allowed"
                }`}
              >
                {sending ? "Sending..." : "Send Alert to Government"}
              </button>

              <button
                onClick={resetModal}
                className="px-4 py-2 rounded border"
              >
                Clear & Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
