import requests
import base64
import os

# Load API key
GROQ_API_KEY = "your-key"
if not GROQ_API_KEY:
    raise ValueError("Please set GROQ_API_KEY in your environment.")

# Image path
def encode_image(image_path):
    if image_path.startswith("http://") or image_path.startswith("https://"):
        resp = requests.get(image_path)
        resp.raise_for_status()
        return base64.b64encode(resp.content).decode("utf-8")
    else:
        with open(image_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")

image_path = "/Users/prishabirla/Desktop/ADT/final/ocr/WhatsApp Image 2025-08-08 at 10.20.37.jpeg"  # Change as needed
def extract_label_from_image(image_path1: str, image_path2: str):
    """Extract product details from an image file or URL using Groq Vision API."""
    image_base64_1 = encode_image(image_path1)
    image_base64_2 = encode_image(image_path2)
    # Prompt
    prompt = """
    You are a product label information extraction assistant.

    From the two provided product label images, identify and extract the following fields with high accuracy by combining information from both images:

    - **Product Name**: The exact name of the product as printed on the label.
    - **Brand**: The brand name under which the product is sold.
    - **Ingredients**: A single string containing only valid ingredient names in the order they appear on the label, separated by commas. 
      - Remove any non-ingredient words such as 'Ingredients:', marketing terms, or notes like "may contain".
      - Ensure no duplicates and no extra spaces.
    - **Manufacturer State**: Only the Indian state where the product was manufactured (e.g., "Maharashtra", "Gujarat"). Do not include the manufacturer's name, city, or any other details.

    Additional rules:
    1. Do not infer or guess values; only extract what is explicitly visible in the image.
    2. Preserve the exact spellings from the label (e.g., capitalization, hyphens).
    3. If any field is not found, return an empty string for that field.
    4. Output must be **strictly valid raw JSON**, without any Markdown formatting, without triple backticks, and without the word "json".
    5. The JSON keys must be exactly: `product_name`, `brand`, `ingredients`, `manufacturer_state`.

    Example output:
    {
      "product_name": "Example Soft Cream",
      "brand": "ExampleBrand",
      "ingredients": "Aqua, Glycerin, Stearic Acid, Vitamin E",
      "manufacturer_state": "Maharashtra"
    }
    """

    # API request payload
    payload = {
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "messages": [
            {"role": "system", "content": "You are a precise product label data extractor."},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_base64_1}"
                        }
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_base64_2}"
                        }
                    }
                ]
            }
        ],
        "temperature": 0
    }

    # Headers
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    # Send request
    res = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)

    try:
        result = res.json()
        if "choices" in result and len(result["choices"]) > 0:
            return result["choices"][0]["message"]["content"]
        elif "error" in result:
            raise RuntimeError(f"Error from Groq: {result['error']}")
        else:
            raise RuntimeError("Unexpected response format")
    except Exception as e:
        raise RuntimeError(f"Failed to parse response: {e}\nRaw response: {res.text}")