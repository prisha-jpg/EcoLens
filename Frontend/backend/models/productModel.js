// import mongoose, { mongo } from "mongoose";

// const productSchema = new mongoose.Schema({
//     product_name: {
//         type: String,
//         required: true,
//         trim: true
//     },
//     brand: {
//         type: String,
//         required: true,
//         trim: true
//     },
//     category: {
//         type: String,
//         required: true,
//         trim: true
//     },
//     weight: {
//         type: String,  // Stored as string since examples like "250ml" are mixed units
//         required: true
//     },
//     packaging_type: {
//         type: String,
//         enum: ["Plastic", "Glass", "Metal", "Paper", "Other"],
//         default: "Plastic"
//     },
//     ingredient_list: {
//         type: String,
//         required: true
//     },
//     location: {
//         type: {
//             type: String,
//             default: "Point"
//         },
//         coordinates: {
//             type: [Number],  // [longitude, latitude]
//             required: true
//         }
//     },
//     usage_frequency: {
//         type: String,
//         enum: ["daily", "weekly", "monthly", "occasionally"],
//         default: "daily"
//     },
//     manufacturing_loc: {
//         type: String,
//         required: true
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now
//     }
// });

// // Create 2dsphere index for geospatial queries
// productSchema.index({ location: "2dsphere" });

// const productModel = mongoose.models.product || mongoose.model("product", productSchema)

// export default productModel;

// backend/models/productModel.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  product_name: { type: String, required: true, trim: true },
  brand: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  weight: { type: String, required: true },
  packaging_type: {
    type: String,
    enum: ["Plastic", "Glass", "Metal", "Paper", "Other"],
    default: "Plastic",
  },
  ingredient_list: { type: String, required: true },
  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  usage_frequency: {
    type: String,
    enum: ["daily", "weekly", "monthly", "occasionally"],
    default: "daily",
  },
  manufacturing_loc: { type: String, required: true },
  imageUrl: { type: String }, // <-- add this
  createdAt: { type: Date, default: Date.now },
});

productSchema.index({ location: "2dsphere" });

const productModel = mongoose.models.product || mongoose.model("product", productSchema);
export default productModel;
