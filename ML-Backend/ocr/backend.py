# backend/main.py
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import uvicorn
from barcode import lookup_upc_product  # from barcode.py
from product_matching import search_product  # from product_matching.py

# Load dataset once on startup
import os
DATASET_PATH = os.path.join(os.path.dirname(__file__), "ocr", "merged_dataset.csv")
df = pd.read_csv(DATASET_PATH)

app = FastAPI()

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/get_product")
def get_product(barcode: str = Query(..., description="Barcode number")):
    """
    1. Call barcode API to get product name
    2. Match against dataset
    3. Return matched product details
    """

    # Step 1 – Call barcode API function
    try:
        barcode_data = lookup_upc_product(barcode)  # Returns dict
        if not barcode_data:
            return {"error": "No product found for this barcode"}
        product_name = barcode_data.get("product_name", "").strip()
    except Exception as e:
        return {"error": f"Failed to fetch barcode info: {str(e)}"}

    if not product_name:
        return {"error": "No product name found for this barcode"}

    # Step 2 – Match with dataset
    try:
        match = search_product(product_name, df)
    except Exception as e:
        return {"error": f"Product matching failed: {str(e)}"}

    if match is None:
        return {"error": "No matching product found"}

    # Step 3 – Return final structured data
    return {
        "barcode": barcode,
        "barcode_product_name": product_name,
        "matched_product": match.to_dict()
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=1234)
