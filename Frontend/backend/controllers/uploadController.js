// import Upload from "../models/uploadModel.js";

import mongoose from 'mongoose';
import Upload from '../models/uploadModel.js';
import { GridFSBucket } from 'mongodb';

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Connect to GridFS
    const conn = mongoose.connection;
    const bucket = new GridFSBucket(conn.db, { bucketName: 'uploads' });

    // Create read stream from uploaded file
    const readStream = fs.createReadStream(req.file.path);
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      metadata: {
        originalName: req.file.originalname,
        uploadedBy: req.user?.id || 'anonymous' // Optional
      }
    });

    // Pipe file to GridFS
    readStream.pipe(uploadStream)
      .on('error', (err) => {
        fs.unlinkSync(req.file.path); // Clean up temp file
        throw err;
      })
      .on('finish', async () => {
        fs.unlinkSync(req.file.path); // Delete local temp file

        // Save metadata to MongoDB
        const newImage = new Upload({
          filename: uploadStream.filename,
          contentType: uploadStream.options.contentType,
          length: uploadStream.length,
          metadata: uploadStream.options.metadata
        });

        await newImage.save();

        res.status(201).json({
          success: true,
          image: newImage,
          fileId: uploadStream.id // GridFS file ID
        });
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
// export const uploadImage = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ success: false, message: "No file uploaded" });
//     }

//     const newImage = new Upload({
//       filename: req.file.filename,
//       path: `/uploads/${req.file.filename}`
//     });

//     await newImage.save();

//     res.status(201).json({
//       success: true,
//       image: newImage
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Server Error" });
//   }
// };

// export const getImages = async (req, res) => {
//   try {
//     const images = await Upload.find().sort({ uploadedAt: -1 });
//     res.status(200).json({ success: true, images });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Server Error" });
//   }
// };
