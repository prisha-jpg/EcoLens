// backend/controllers/productController.js
import Product from "../models/productModel.js";

export const createProduct = async (req, res) => {
  try {
    // If you used multer.single('image'), file lives in req.file
    const file = req.file;
    // Fields from form-data (text)
    const {
      product_name,
      brand,
      category,
      weight,
      packaging_type,
      ingredient_list,
      manufacturing_loc,
      usage_frequency,
      // location could be passed as JSON string or lat/lng fields
    } = req.body;

    // parse location: allow two patterns:
    // 1) location as JSON string: {"type":"Point","coordinates":[lng,lat]}
    // 2) lat & lng fields passed separately
    let locationObj;
    if (req.body.location) {
      try {
        locationObj = typeof req.body.location === "string"
          ? JSON.parse(req.body.location)
          : req.body.location;
      } catch (err) {
        // ignore parse error
      }
    } else if (req.body.lng && req.body.lat) {
      const lng = parseFloat(req.body.lng);
      const lat = parseFloat(req.body.lat);
      if (!isNaN(lng) && !isNaN(lat)) {
        locationObj = { type: "Point", coordinates: [lng, lat] };
      }
    }

    // compose image URL pointing to uploads folder (if file uploaded)
    let imageUrl;
    if (file) {
      // if server runs on http://localhost:5001 and you serve '/uploads'
      imageUrl = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
      // Note: req.protocol may be undefined in some setups; fallback:
      if (!imageUrl.startsWith("http")) {
        imageUrl = `http://${req.get("host")}/uploads/${file.filename}`;
      }
    }

    // create product
    const newProduct = new Product({
      product_name,
      brand,
      category,
      weight,
      packaging_type,
      ingredient_list,
      manufacturing_loc,
      usage_frequency,
      location: locationObj, // optional: validate existence
      imageUrl,
    });

    const saved = await newProduct.save();
    res.status(201).json({ success: true, product: saved });
  } catch (err) {
    console.error("createProduct error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
