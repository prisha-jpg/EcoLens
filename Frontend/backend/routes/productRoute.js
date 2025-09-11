// backend/routes/productRoute.js
import express from "express";
import { createProduct } from "../controllers/productController.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

// set up uploads folder same as in server.js or import existing storage config
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../uploads"); // adjust if needed

// Simple disk storage (keep in sync with your server's multer settings)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

const router = express.Router();

// POST /api/products - single image field named "image"
router.post("/", upload.single("image"), createProduct);

export default router;
