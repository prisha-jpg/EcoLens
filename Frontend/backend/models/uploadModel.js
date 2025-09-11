// import mongoose from "mongoose";
import mongoose from 'mongoose';

const uploadSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  length: Number,
  uploadDate: { type: Date, default: Date.now },
  metadata: {
    originalName: String,
    uploadedBy: String // Optional: Store user info
  }
});

export default mongoose.model('Upload', uploadSchema);


// const uploadSchema = new mongoose.Schema({
//   filename: {
//     type: String,
//     required: true
//   },
//   path: {
//     type: String,
//     required: true
//   },
//   uploadedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// export default mongoose.model("Upload", uploadSchema);

// // import mongoose from 'mongoose';

// // const uploadSchema = new mongoose.Schema({
// //   imageUrl: { type: String, required: true }
// // }, { timestamps: true });

// // export default mongoose.model('Upload', uploadSchema);

