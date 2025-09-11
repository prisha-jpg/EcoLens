import express from "express";
import multer from "multer";
import path from "path";
import { uploadImage } from "../controllers/uploadController.js";

const router = express.Router();

// Temp storage (files will be deleted after MongoDB upload)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "temp_uploads/"); // Temporary folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post("/", upload.single("image"), uploadImage);

export default router;

// import express from "express";
// import multer from "multer";
// import path from "path";
// import { uploadImage, getImages } from "../controllers/uploadController.js";

// const router = express.Router();

// // Configure multer for /uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });

// const upload = multer({ storage });

// // Routes
// router.post("/", upload.single("image"), uploadImage);
// router.get("/", getImages);

// export default router;
