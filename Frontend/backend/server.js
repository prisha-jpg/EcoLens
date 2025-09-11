import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js"; 
import multer from "multer";
import path from "path";
import cors from "cors";
import fs from "fs";
import { fileURLToPath } from "url";
import userRouter from './routes/userRoute.js';
import productRouter from "./routes/productRoute.js";
import uploadRoutes from "./routes/uploadRoute.js";
import ecoRoutes from "./routes/ecoRoutes.js"; // note the .js extension

dotenv.config();

// Add this debug line
console.log('🔍 ENV DEBUG:');
console.log('   BACKEND_NGROK_URL from env:', process.env.BACKEND_NGROK_URL);
console.log('   ML_NGROK_URL from env:', process.env.ML_NGROK_URL);
console.log('   PORT from env:', process.env.PORT);
console.log('   All env vars:', Object.keys(process.env).filter(key => key.includes('NGROK')));

// __dirname and __filename fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Connect to DB and Cloudinary
connectDB();
connectCloudinary();

// Create multiple upload directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const product1Dir = path.join(__dirname, 'product1');
const product2Dir = path.join(__dirname, 'product2');

[uploadsDir, product1Dir, product2Dir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const ML_BASE_URL = process.env.ML_BASE_URL;
const BACKEND_NGROK_URL = process.env.BACKEND_NGROK_URL || "https://66594fafc15d.ngrok-free.app";
const ML_NGROK_URL = process.env.ML_NGROK_URL || "https://prishaa-library-space.hf.space";
const EFFECTIVE_ML_BASE_URL = ML_BASE_URL || ML_NGROK_URL;
let extractedDataCache = new Map();

// Option 2: File-based storage (Persistent across restarts)
// const fs = require('fs').promises;
// const path = require('path');
// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from all directories
app.use('/uploads', express.static(uploadsDir));
app.use('/product1', express.static(product1Dir));
app.use('/product2', express.static(product2Dir));

// API Routes - Use the proper MVC structure
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/uploads", uploadRoutes); 
app.use("/api/eco", ecoRoutes);
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
async function saveExtractedData(sessionId, data) {
  try {
    const dataDir = path.join(__dirname, 'extracted_data');
    await fs.mkdir(dataDir, { recursive: true });
    const filePath = path.join(dataDir, `${sessionId}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`   💾 Data saved to: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(`   ❌ Failed to save data: ${error.message}`);
    throw error;
  }
}
async function loadExtractedData(sessionId) {
  try {
    const filePath = path.join(__dirname, 'extracted_data', `${sessionId}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    console.log(`   📂 Data loaded from: ${filePath}`);
    return JSON.parse(data);
  } catch (error) {
    console.error(`   ❌ Failed to load data: ${error.message}`);
    throw error;
  }
}
// Helper function to test URL reachability
const testUrlReachability = async (url) => {
  try {
    console.log(`🔍 Testing URL reachability: ${url}`);
    const response = await fetch(url, { 
      method: 'HEAD',
      timeout: 5000,
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    
    const isReachable = response.ok;
    console.log(`🔍 ${isReachable ? '✅' : '❌'} URL ${isReachable ? 'REACHABLE' : 'NOT REACHABLE'}: ${url}`);
    console.log(`   Status: ${response.status}, Headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
    
    return isReachable;
  } catch (error) {
    console.log(`❌ URL FETCH ERROR: ${url}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
};

// Helper function to get image count and existing files in directory
const getDirectoryInfo = (directory) => {
  const files = fs.readdirSync(directory).filter(file => 
    /\.(jpeg|jpg|png|webp)$/i.test(file)
  );
  
  const frontImages = files.filter(file => file.startsWith('front-'));
  const backImages = files.filter(file => file.startsWith('back-'));
  
  return {
    totalFiles: files.length,
    frontImages,
    backImages,
    allFiles: files
  };
};

// Helper function to clean up old files when limit is exceeded
const cleanupOldFiles = (directory, prefix) => {
  const files = fs.readdirSync(directory).filter(file => 
    file.startsWith(prefix) && /\.(jpeg|jpg|png|webp)$/i.test(file)
  );
  
  // Sort by creation time (based on filename timestamp)
  files.sort((a, b) => {
    const statA = fs.statSync(path.join(directory, a));
    const statB = fs.statSync(path.join(directory, b));
    return statA.mtime - statB.mtime;
  });
  
  // Remove oldest files if we have more than 1
  while (files.length > 0) {
    const oldFile = files.shift();
    fs.unlinkSync(path.join(directory, oldFile));
    console.log(`🗑️ Removed old file: ${oldFile}`);
  }
};

// Helper function to create multer storage with front/back naming logic
const createSmartStorage = (directory) => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, directory);
    },
    filename: function (req, file, cb) {
      const dirInfo = getDirectoryInfo(directory);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      
      let prefix;
      
      // Determine prefix based on existing files
      if (dirInfo.frontImages.length === 0) {
        // No front image exists, make this the front
        prefix = 'front-';
        // Clean up any existing front images (shouldn't happen, but safety measure)
        cleanupOldFiles(directory, 'front-');
      } else if (dirInfo.backImages.length === 0) {
        // Front exists but no back, make this the back
        prefix = 'back-';
        // Clean up any existing back images
        cleanupOldFiles(directory, 'back-');
      } else {
        // Both exist, replace the older one
        // Get the older file type based on modification time
        const frontFile = dirInfo.frontImages[0];
        const backFile = dirInfo.backImages[0];
        
        const frontStat = fs.statSync(path.join(directory, frontFile));
        const backStat = fs.statSync(path.join(directory, backFile));
        
        if (frontStat.mtime < backStat.mtime) {
          // Front is older, replace it
          prefix = 'front-';
          cleanupOldFiles(directory, 'front-');
        } else {
          // Back is older, replace it
          prefix = 'back-';
          cleanupOldFiles(directory, 'back-');
        }
      }
      
      const filename = prefix + uniqueSuffix + extension;
      cb(null, filename);
    }
  });
};

// Create multer instances for each directory with smart naming
const uploadToUploads = multer({ 
  storage: createSmartStorage(uploadsDir),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png, webp) are allowed'));
    }
  }
});

const uploadToProduct1 = multer({ 
  storage: createSmartStorage(product1Dir),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png, webp) are allowed'));
    }
  }
});

const uploadToProduct2 = multer({ 
  storage: createSmartStorage(product2Dir),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png, webp) are allowed'));
    }
  }
});

// Enhanced upload handler with debugging
const handleUploadWithDebug = async (req, res, folder, folderName) => {
  if (!req.file) {
    console.log(`❌ Upload failed - No file uploaded to ${folderName}`);
    return res.status(400).json({ message: 'No file uploaded or invalid file type.' });
  }
  
  console.log(`\n📤 NEW UPLOAD TO ${folderName.toUpperCase()}`);
  console.log(`   File: ${req.file.filename}`);
  console.log(`   Original: ${req.file.originalname}`);
  console.log(`   Size: ${req.file.size} bytes`);
  console.log(`   Path: ${req.file.path}`);
  
  const dirInfo = getDirectoryInfo(folder);
  const isFirstImage = req.file.filename.startsWith('front-');
  
  // Generate URLs
  const localUrl = `http://localhost:${PORT}/${folderName}/${req.file.filename}`;
  const publicUrl = `${BACKEND_NGROK_URL}/${folderName}/${req.file.filename}`;
  
  console.log(`\n🔗 GENERATED URLS:`);
  console.log(`   Local URL: ${localUrl}`);
  console.log(`   Public URL: ${publicUrl}`);
  
  // Test URL reachability
  console.log(`\n🌐 TESTING URL REACHABILITY:`);
  const localReachable = await testUrlReachability(localUrl);
  const publicReachable = await testUrlReachability(publicUrl);
  
  console.log(`\n📊 UPLOAD SUMMARY:`);
  console.log(`   Folder: ${folderName}`);
  console.log(`   Image Type: ${isFirstImage ? 'front' : 'back'}`);
  console.log(`   Total Images Now: ${dirInfo.totalFiles + 1}`);
  console.log(`   Local URL Reachable: ${localReachable ? 'YES' : 'NO'}`);
  console.log(`   Public URL Reachable: ${publicReachable ? 'YES' : 'NO'}`);
  
  res.status(200).json({
    message: `Image uploaded successfully to ${folderName} as ${isFirstImage ? 'front' : 'back'} image!`,
    fileUrl: localUrl,
    publicUrl: publicUrl,
    folder: folderName,
    imageType: isFirstImage ? 'front' : 'back',
    totalImages: dirInfo.totalFiles + 1,
    debug: {
      localUrlReachable: localReachable,
      publicUrlReachable: publicReachable,
      fileSize: req.file.size,
      mimetype: req.file.mimetype
    }
  });
};

// LEGACY ROUTES - Enhanced with debugging
// File 1 - Upload to /uploads folder (LEGACY - consider moving to controller)
app.post('/upload', uploadToUploads.single('image'), async (req, res) => {
  await handleUploadWithDebug(req, res, uploadsDir, 'uploads');
});

// File 2 - Upload to /product1 folder (LEGACY)
app.post('/upload-product1', uploadToProduct1.single('image'), async (req, res) => {
  await handleUploadWithDebug(req, res, product1Dir, 'product1');
});

// File 3 - Upload to /product2 folder (LEGACY)
app.post('/upload-product2', uploadToProduct2.single('image'), async (req, res) => {
  await handleUploadWithDebug(req, res, product2Dir, 'product2');
});

// Generic upload route with folder parameter (LEGACY)
app.post('/upload/:folder', (req, res) => {
  const folder = req.params.folder;
  let uploadMiddleware;
  let directory;
  
  switch(folder) {
    case 'uploads':
      uploadMiddleware = uploadToUploads.single('image');
      directory = uploadsDir;
      break;
    case 'product1':
      uploadMiddleware = uploadToProduct1.single('image');
      directory = product1Dir;
      break;
    case 'product2':
      uploadMiddleware = uploadToProduct2.single('image');
      directory = product2Dir;
      break;
    default:
      return res.status(400).json({ message: 'Invalid folder specified. Use: uploads, product1, or product2' });
  }
  
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      console.log(`❌ Upload middleware error for ${folder}: ${err.message}`);
      return res.status(400).json({ message: err.message });
    }
    
    await handleUploadWithDebug(req, res, directory, folder);
  });
});

app.get('/api/uploads/:id', (req, res) => {
  const bucket = new GridFSBucket(mongoose.connection.db);
  bucket.openDownloadStream(new mongoose.Types.ObjectId(req.params.id))
    .pipe(res);
});

// Route to get folder status (LEGACY)
app.get('/folder-status/:folder', (req, res) => {
  const folder = req.params.folder;
  let directory;
  
  switch(folder) {
    case 'uploads':
      directory = uploadsDir;
      break;
    case 'product1':
      directory = product1Dir;
      break;
    case 'product2':
      directory = product2Dir;
      break;
    default:
      return res.status(400).json({ message: 'Invalid folder specified. Use: uploads, product1, or product2' });
  }
  
  const dirInfo = getDirectoryInfo(directory);
  
  console.log(`\n📂 FOLDER STATUS REQUEST: ${folder}`);
  console.log(`   Directory: ${directory}`);
  console.log(`   Total Images: ${dirInfo.totalFiles}`);
  console.log(`   Front Images: ${dirInfo.frontImages.length}`);
  console.log(`   Back Images: ${dirInfo.backImages.length}`);
  console.log(`   All Files: ${dirInfo.allFiles.join(', ')}`);
  
  res.status(200).json({
    folder: folder,
    totalImages: dirInfo.totalFiles,
    frontImages: dirInfo.frontImages.length,
    backImages: dirInfo.backImages.length,
    files: {
      front: dirInfo.frontImages.map(file => ({
        filename: file,
        localUrl: `http://localhost:${PORT}/${folder}/${file}`,
        publicUrl: `${BACKEND_NGROK_URL}/${folder}/${file}`
      })),
      back: dirInfo.backImages.map(file => ({
        filename: file,
        localUrl: `http://localhost:${PORT}/${folder}/${file}`,
        publicUrl: `${BACKEND_NGROK_URL}/${folder}/${file}`
      }))
    }
  });
});

// Enhanced helper function for detailed ML API logging
const logMLApiInteraction = (stage, data, additionalInfo = {}) => {
  const timestamp = new Date().toISOString();
  const separator = '='.repeat(80);
  
  console.log(`\n${separator}`);
  console.log(`🤖 ML API INTERACTION - ${stage.toUpperCase()}`);
  console.log(`⏰ Timestamp: ${timestamp}`);
  console.log(`${separator}`);
  
  if (data) {
    console.log(`📋 Data:`, JSON.stringify(data, null, 2));
  }
  
  if (Object.keys(additionalInfo).length > 0) {
    console.log(`ℹ️ Additional Info:`);
    Object.entries(additionalInfo).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
  }
  
  console.log(`${separator}\n`);
};

// NEW ENDPOINT: Extract label information from uploaded images - SUPER ENHANCED WITH DEBUGGING
app.post('/api/extract-labels', async (req, res) => {
  const requestStartTime = Date.now();
  
  try {
    console.log(`\n🏷️ ═══════════════════════════════════════════════════════════════════════════════`);
    console.log(`🏷️ STARTING LABEL EXTRACTION PROCESS`);
    console.log(`🏷️ ═══════════════════════════════════════════════════════════════════════════════`);
    console.log(`   🕐 Start Time: ${new Date().toISOString()}`);
    console.log(`   📥 Raw Request Body:`, JSON.stringify(req.body, null, 2));
    
    const { folder = 'uploads', sessionId } = req.body;
    
    // Generate session ID if not provided
    const currentSessionId = sessionId || generateSessionId();
    console.log(`   🆔 Session ID: ${currentSessionId}`);
    
    // Validate folder parameter
    let directory;
    switch(folder) {
      case 'uploads':
        directory = uploadsDir;
        break;
      case 'product1':
        directory = product1Dir;
        break;
      case 'product2':
        directory = product2Dir;
        break;
      default:
        console.log(`❌ VALIDATION ERROR: Invalid folder specified: ${folder}`);
        return res.status(400).json({ 
          success: false,
          error: 'Invalid folder specified. Use: uploads, product1, or product2' 
        });
    }
    
    console.log(`   ✅ Folder validation passed`);
    console.log(`   📂 Target folder: ${folder}`);
    console.log(`   📁 Directory path: ${directory}`);
    
    // Get directory information
    const dirInfo = getDirectoryInfo(directory);
    console.log(`\n📁 ═══ DIRECTORY ANALYSIS ═══`);
    console.log(`   📊 Total files: ${dirInfo.totalFiles}`);
    console.log(`   🖼️ Front images: [${dirInfo.frontImages.join(', ')}]`);
    console.log(`   🖼️ Back images: [${dirInfo.backImages.join(', ')}]`);
    console.log(`   📋 All files: [${dirInfo.allFiles.join(', ')}]`);
    
    // Check if we have both front and back images
    if (dirInfo.frontImages.length === 0 && dirInfo.backImages.length === 0) {
      console.log(`❌ VALIDATION ERROR: No images found in ${folder}`);
      return res.status(400).json({ 
        success: false,
        error: 'No images found in the specified folder' 
      });
    }
    
    // Prepare image URLs for ML API
    const frontImageUrl = dirInfo.frontImages.length > 0 
      ? `${BACKEND_NGROK_URL}/${folder}/${dirInfo.frontImages[0]}`
      : "";
      
    const backImageUrl = dirInfo.backImages.length > 0 
      ? `${BACKEND_NGROK_URL}/${folder}/${dirInfo.backImages[0]}`
      : "";
    
    console.log(`\n🔗 ═══ IMAGE URL PREPARATION ═══`);
    console.log(`   🖼️ Front Image URL: ${frontImageUrl || 'NULL/EMPTY'}`);
    console.log(`   🖼️ Back Image URL: ${backImageUrl || 'NULL/EMPTY'}`);
    console.log(`   🌐 Backend NGROK URL: ${BACKEND_NGROK_URL}`);
    console.log(`   🤖 ML NGROK URL: ${ML_NGROK_URL}`);
    
    // Test URL reachability before sending to ML
    console.log(`\n🌐 ═══ URL REACHABILITY TEST ═══`);
    if (frontImageUrl) {
      const frontReachable = await testUrlReachability(frontImageUrl);
      console.log(`   🖼️ Front image reachability: ${frontReachable ? '✅ PASS' : '❌ FAIL'}`);
    } else {
      console.log(`   🖼️ Front image: ⚠️ SKIPPED (no front image)`);
    }
    
    if (backImageUrl) {
      const backReachable = await testUrlReachability(backImageUrl);
      console.log(`   🖼️ Back image reachability: ${backReachable ? '✅ PASS' : '❌ FAIL'}`);
    } else {
      console.log(`   🖼️ Back image: ⚠️ SKIPPED (no back image)`);
    }
    
    // Prepare request payload for ML API
    const mlPayload = {
      image_path1: frontImageUrl,
      image_path2: backImageUrl
    };
    
    const mlApiUrl = `${ML_NGROK_URL}/extract-picture`;
    
    // DETAILED ML API REQUEST LOGGING
    logMLApiInteraction('OUTGOING REQUEST PREPARATION', mlPayload, {
      'Target ML API URL': mlApiUrl,
      'Request Method': 'POST',
      'Content-Type': 'application/json',
      'Request Timestamp': new Date().toISOString(),
      'Frontend Folder': folder,
      'Has Front Image': !!frontImageUrl,
      'Has Back Image': !!backImageUrl,
      'Session ID': currentSessionId
    });
    
    console.log(`\n🚀 ═══ MAKING ML API CALL ═══`);
    console.log(`   🎯 Target: ${mlApiUrl}`);
    console.log(`   📤 Method: POST`);
    console.log(`   📋 Headers: Content-Type: application/json, ngrok-skip-browser-warning: true`);
    console.log(`   📦 Payload Size: ${JSON.stringify(mlPayload).length} characters`);
    console.log(`   ⏱️ Starting request at: ${new Date().toISOString()}`);
    
    const mlRequestStartTime = Date.now();
    
    // Call the ML API
    const mlResponse = await fetch(mlApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json'
      },
      body: JSON.stringify(mlPayload)
    });
    
    const mlRequestDuration = Date.now() - mlRequestStartTime;
    
    console.log(`\n📨 ═══ ML API RAW RESPONSE ═══`);
    console.log(`   ⏱️ Response received at: ${new Date().toISOString()}`);
    console.log(`   🕐 Request duration: ${mlRequestDuration}ms`);
    console.log(`   📊 Status Code: ${mlResponse.status}`);
    console.log(`   📊 Status Text: ${mlResponse.statusText}`);
    console.log(`   📋 Response Headers:`, JSON.stringify(Object.fromEntries(mlResponse.headers), null, 2));
    console.log(`   📐 Content Length: ${mlResponse.headers.get('content-length') || 'Unknown'}`);
    console.log(`   📄 Content Type: ${mlResponse.headers.get('content-type') || 'Unknown'}`);
    
    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      console.log(`\n❌ ═══ ML API ERROR RESPONSE ═══`);
      console.log(`   💥 Status: ${mlResponse.status} ${mlResponse.statusText}`);
      console.log(`   📄 Error Body:`, errorText);
      
      logMLApiInteraction('ERROR RESPONSE', { errorText }, {
        'Status Code': mlResponse.status,
        'Status Text': mlResponse.statusText,
        'Response Time': `${mlRequestDuration}ms`,
        'Session ID': currentSessionId
      });
      
      throw new Error(`ML API responded with status: ${mlResponse.status} - ${errorText}`);
    }
    
    // Parse successful response
    let mlData;
    try {
      const responseText = await mlResponse.text();
      console.log(`\n📄 ═══ ML API RAW RESPONSE BODY ═══`);
      console.log(`   📐 Response Body Length: ${responseText.length} characters`);
      console.log(`   📄 Raw Response Text:`, responseText);
      
      mlData = JSON.parse(responseText);
      
      console.log(`\n✅ ═══ ML API PARSED SUCCESS RESPONSE ═══`);
      console.log(`   📊 Parsed Response Type: ${typeof mlData}`);
      console.log(`   🏷️ Product Name: ${mlData.product_name || 'NOT FOUND'}`);
      console.log(`   🏢 Brand: ${mlData.brand || 'NOT FOUND'}`);
      console.log(`   🧪 Ingredients Length: ${mlData.ingredients?.length || 0} characters`);
      console.log(`   🏭 Manufacturer State: ${mlData.manufacturer_state || 'NOT FOUND'}`);
      console.log(`   📦 Full Parsed Data:`, JSON.stringify(mlData, null, 2));
      
      // DETAILED ML API RESPONSE LOGGING
      logMLApiInteraction('SUCCESSFUL RESPONSE RECEIVED', mlData, {
        'Response Time': `${mlRequestDuration}ms`,
        'Response Size': `${responseText.length} characters`,
        'Product Name Found': !!mlData.product_name,
        'Brand Found': !!mlData.brand,
        'Ingredients Found': !!mlData.ingredients,
        'Manufacturer State Found': !!mlData.manufacturer_state,
        'Response Valid JSON': true,
        'Session ID': currentSessionId
      });
      
    } catch (parseError) {
      console.log(`\n❌ ═══ JSON PARSING ERROR ═══`);
      console.log(`   💥 Parse Error: ${parseError.message}`);
      console.log(`   📄 Response Text: ${responseText}`);
      
      logMLApiInteraction('JSON PARSING FAILED', { parseError: parseError.message, responseText }, {
        'Response Time': `${mlRequestDuration}ms`,
        'Parse Error Type': parseError.constructor.name,
        'Session ID': currentSessionId
      });
      
      throw new Error(`Failed to parse ML API response: ${parseError.message}`);
    }
    
    // SAVE EXTRACTED DATA FOR FUTURE USE
    console.log(`\n💾 ═══ SAVING EXTRACTED DATA ═══`);
    const dataToSave = {
      sessionId: currentSessionId,
      timestamp: new Date().toISOString(),
      folder: folder,
      images: {
        front: frontImageUrl || null,
        back: backImageUrl || null
      },
      extractedData: mlData,
      metadata: {
        requestDuration: Date.now() - requestStartTime,
        mlApiDuration: mlRequestDuration,
        mlApiUrl: mlApiUrl,
        mlApiStatus: mlResponse.status
      }
    };
    
    // Save to both memory cache and file system
    extractedDataCache.set(currentSessionId, dataToSave);
    console.log(`   ✅ Data saved to memory cache`);
    
    try {
      await saveExtractedData(currentSessionId, dataToSave);
      console.log(`   ✅ Data saved to file system`);
    } catch (saveError) {
      console.log(`   ⚠️ Failed to save to file system: ${saveError.message}`);
      // Continue execution even if file save fails
    }
    
    // Return the extracted data along with session information
    const responseData = {
      success: true,
      sessionId: currentSessionId,
      folder: folder,
      images: {
        front: frontImageUrl || null,
        back: backImageUrl || null
      },
      extractedData: mlData,
      message: 'Label extraction completed successfully',
      debug: {
        requestDuration: Date.now() - requestStartTime,
        mlApiDuration: mlRequestDuration,
        mlApiUrl: mlApiUrl,
        mlApiStatus: mlResponse.status
      }
    };
    
    console.log(`\n🎯 ═══ FINAL SUCCESS RESPONSE TO CLIENT ═══`);
    console.log(`   ⏱️ Total processing time: ${Date.now() - requestStartTime}ms`);
    console.log(`   🆔 Session ID: ${currentSessionId}`);
    console.log(`   🎯 Response Data:`, JSON.stringify(responseData, null, 2));
    console.log(`🏷️ ═══════════════════════════════════════════════════════════════════════════════`);
    console.log(`🏷️ LABEL EXTRACTION PROCESS COMPLETED SUCCESSFULLY`);
    console.log(`🏷️ ═══════════════════════════════════════════════════════════════════════════════\n`);
    
    res.json(responseData);
    
  } catch (error) {
    const totalDuration = Date.now() - requestStartTime;
    
    console.log(`\n💥 ═══ LABEL EXTRACTION CRITICAL ERROR ═══`);
    console.log(`   ⏱️ Total duration before error: ${totalDuration}ms`);
    console.log(`   💥 Error Type: ${error.constructor.name}`);
    console.log(`   💥 Error Message: ${error.message}`);
    console.log(`   📍 Error Stack:`, error.stack);
    
    logMLApiInteraction('CRITICAL ERROR', { 
      errorType: error.constructor.name,
      errorMessage: error.message,
      totalDuration: totalDuration
    });
    
    console.log(`🏷️ ═══════════════════════════════════════════════════════════════════════════════`);
    console.log(`🏷️ LABEL EXTRACTION PROCESS FAILED`);
    console.log(`🏷️ ═══════════════════════════════════════════════════════════════════════════════\n`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to extract label information',
      details: error.message,
      debug: {
        errorType: error.constructor.name,
        totalDuration: totalDuration
      }
    });
  }
});


// NEW ENDPOINT: Get comprehensive product analysis (combines label extraction + eco-score)
app.post('/api/analyze-product', async (req, res) => {
  const analysisStartTime = Date.now();
  
  try {
    console.log(`\n🧪 ═══════════════════════════════════════════════════════════════════════════════`);
    console.log(`🧪 STARTING COMPREHENSIVE PRODUCT ANALYSIS`);
    console.log(`🧪 ═══════════════════════════════════════════════════════════════════════════════`);
    console.log(`   🕐 Analysis Start Time: ${new Date().toISOString()}`);
    console.log(`   📥 Full Request Body:`, JSON.stringify(req.body, null, 2));
    
    const { folder = 'uploads', additionalProductInfo = {} } = req.body;
    
    console.log(`\n🏷️ ═══ PHASE 1: LABEL EXTRACTION ═══`);
    console.log(`   📞 Making internal call to /api/extract-labels`);
    console.log(`   📂 Target folder: ${folder}`);
    
    // First, extract labels
    const labelResponse = await fetch(`http://localhost:${PORT}/api/extract-labels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ folder })
    });
    
    console.log(`   📨 Label extraction internal response status: ${labelResponse.status}`);
    
    if (!labelResponse.ok) {
      const errorText = await labelResponse.text();
      console.log(`❌ PHASE 1 FAILED: Label extraction internal call failed`);
      console.log(`   💥 Error: ${errorText}`);
      throw new Error('Failed to extract labels');
    }
    
    const labelData = await labelResponse.json();
    console.log(`✅ PHASE 1 SUCCESS: Label extraction completed`);
    console.log(`   🎯 Label Data:`, JSON.stringify(labelData, null, 2));
    
    // If label extraction was successful, get eco-score
    if (labelData.success && labelData.extractedData) {
      try {
        console.log(`\n🌱 ═══ PHASE 2: ECO-SCORE CALCULATION ═══`);
        
        // Prepare eco-score request with extracted data + additional info
        const ecoScorePayload = {
          product_name: labelData.extractedData.product_name || additionalProductInfo.product_name || "Unknown Product",
          brand: labelData.extractedData.brand || additionalProductInfo.brand || "Unknown Brand",
          category: additionalProductInfo.category || "General",
          weight: additionalProductInfo.weight || "250ml",
          packaging_type: additionalProductInfo.packaging_type || "Plastic",
          ingredient_list: labelData.extractedData.ingredients || JSON.stringify(labelData.extractedData) || "",
          latitude: additionalProductInfo.latitude || 12.9716,
          longitude: additionalProductInfo.longitude || 77.5946,
          usage_frequency: additionalProductInfo.usage_frequency || "daily",
          manufacturing_loc: labelData.extractedData.manufacturer_state || additionalProductInfo.manufacturing_loc || "Mumbai"
        };
        
        const ecoScoreApiUrl = `${ML_NGROK_URL}/api/get-eco-score`;
        
        console.log(`   🎯 Eco-score API URL: ${ecoScoreApiUrl}`);
        console.log(`   📦 Eco-score payload:`, JSON.stringify(ecoScorePayload, null, 2));
        
        logMLApiInteraction('ECO-SCORE REQUEST PREPARATION', ecoScorePayload, {
          'API URL': ecoScoreApiUrl,
          'Product Name': ecoScorePayload.product_name,
          'Brand': ecoScorePayload.brand,
          'Manufacturing Location': ecoScorePayload.manufacturing_loc,
          'Ingredient List Length': ecoScorePayload.ingredient_list.length
        });
        
        const ecoRequestStartTime = Date.now();
        
        const ecoScoreResponse = await fetch(ecoScoreApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            'Accept': 'application/json'
          },
          body: JSON.stringify(ecoScorePayload)
        });
        
        const ecoRequestDuration = Date.now() - ecoRequestStartTime;
        
        console.log(`\n📨 ═══ ECO-SCORE API RAW RESPONSE ═══`);
        console.log(`   ⏱️ Response Time: ${ecoRequestDuration}ms`);
        console.log(`   📊 Status: ${ecoScoreResponse.status} ${ecoScoreResponse.statusText}`);
        console.log(`   📋 Response Headers:`, JSON.stringify(Object.fromEntries(ecoScoreResponse.headers), null, 2));
        
        if (ecoScoreResponse.ok) {
          const ecoResponseText = await ecoScoreResponse.text();
          console.log(`   📄 Raw Response Body:`, ecoResponseText);
          
          let ecoScoreData;
          try {
            ecoScoreData = JSON.parse(ecoResponseText);
            
            console.log(`✅ PHASE 2 SUCCESS: Eco-score calculation completed`);
            console.log(`   🌱 Eco-score Data:`, JSON.stringify(ecoScoreData, null, 2));
            
            logMLApiInteraction('ECO-SCORE SUCCESSFUL RESPONSE', ecoScoreData, {
              'Response Time': `${ecoRequestDuration}ms`,
              'Response Size': `${ecoResponseText.length} characters`,
              'Eco Score Value': ecoScoreData.eco_score || 'NOT FOUND',
              'Analysis Status': 'SUCCESS'
            });
            
            const finalResponse = {
              success: true,
              folder: folder,
              images: labelData.images,
              extractedLabels: labelData.extractedData,
              ecoScoreData: ecoScoreData,
              message: 'Complete product analysis completed successfully',
              debug: {
                totalDuration: Date.now() - analysisStartTime,
                labelExtractionSuccess: true,
                ecoScoreSuccess: true,
                mlApiDuration: labelData.debug?.mlApiDuration || 0,
                ecoApiDuration: ecoRequestDuration
              }
            };
            
            console.log(`\n🎯 ═══ COMPLETE ANALYSIS SUCCESS ═══`);
            console.log(`   ⏱️ Total Analysis Time: ${Date.now() - analysisStartTime}ms`);
            console.log(`   🎯 Final Response:`, JSON.stringify(finalResponse, null, 2));
            console.log(`🧪 ═══════════════════════════════════════════════════════════════════════════════`);
            console.log(`🧪 COMPREHENSIVE PRODUCT ANALYSIS COMPLETED SUCCESSFULLY`);
            console.log(`🧪 ═══════════════════════════════════════════════════════════════════════════════\n`);
            
            return res.json(finalResponse);
          } catch (ecoParseError) {
            console.log(`❌ ECO-SCORE JSON PARSING ERROR: ${ecoParseError.message}`);
            console.log(`   📄 Raw response: ${ecoResponseText}`);
            
            logMLApiInteraction('ECO-SCORE JSON PARSING FAILED', { 
              parseError: ecoParseError.message, 
              responseText: ecoResponseText 
            });
          }
        } else {
          const ecoErrorText = await ecoScoreResponse.text();
          console.log(`❌ PHASE 2 FAILED: Eco-score API error`);
          console.log(`   💥 Status: ${ecoScoreResponse.status}`);
          console.log(`   💥 Error Body: ${ecoErrorText}`);
          
          logMLApiInteraction('ECO-SCORE API ERROR', { 
            errorText: ecoErrorText 
          }, {
            'Status Code': ecoScoreResponse.status,
            'Response Time': `${ecoRequestDuration}ms`
          });
        }
      } catch (ecoError) {
        console.error(`💥 PHASE 2 EXCEPTION: Eco-score API error`);
        console.error(`   💥 Error Type: ${ecoError.constructor.name}`);
        console.error(`   💥 Error Message: ${ecoError.message}`);
        console.error(`   📍 Error Stack:`, ecoError.stack);
        
        logMLApiInteraction('ECO-SCORE API EXCEPTION', { 
          errorType: ecoError.constructor.name,
          errorMessage: ecoError.message 
        });
        
        // Return just the label data if eco-score fails
      }
    }
    
    // Return just label extraction results if eco-score fails or wasn't attempted
    const partialResponse = {
      success: true,
      folder: folder,
      images: labelData.images,
      extractedLabels: labelData.extractedData,
      ecoScoreData: null,
      message: 'Label extraction completed successfully (eco-score analysis failed)',
      debug: {
        totalDuration: Date.now() - analysisStartTime,
        labelExtractionSuccess: true,
        ecoScoreSuccess: false
      }
    };
    
    console.log(`\n⚠️ ═══ PARTIAL ANALYSIS SUCCESS ═══`);
    console.log(`   ⏱️ Total Analysis Time: ${Date.now() - analysisStartTime}ms`);
    console.log(`   🎯 Partial Response:`, JSON.stringify(partialResponse, null, 2));
    console.log(`🧪 ═══════════════════════════════════════════════════════════════════════════════`);
    console.log(`🧪 COMPREHENSIVE PRODUCT ANALYSIS COMPLETED PARTIALLY`);
    console.log(`🧪 ═══════════════════════════════════════════════════════════════════════════════\n`);
    
    res.json(partialResponse);
    
  } catch (error) {
    const totalDuration = Date.now() - analysisStartTime;
    
    console.error(`\n💥 ═══ COMPREHENSIVE ANALYSIS CRITICAL ERROR ═══`);
    console.error(`   ⏱️ Total duration before error: ${totalDuration}ms`);
    console.error(`   💥 Error Type: ${error.constructor.name}`);
    console.error(`   💥 Error Message: ${error.message}`);
    console.error(`   📍 Error Stack:`, error.stack);
    
    logMLApiInteraction('COMPREHENSIVE ANALYSIS FAILED', {
      errorType: error.constructor.name,
      errorMessage: error.message,
      totalDuration: totalDuration
    });
    
    console.log(`🧪 ═══════════════════════════════════════════════════════════════════════════════`);
    console.log(`🧪 COMPREHENSIVE PRODUCT ANALYSIS FAILED`);
    console.log(`🧪 ═══════════════════════════════════════════════════════════════════════════════\n`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to analyze product',
      details: error.message,
      debug: {
        errorType: error.constructor.name,
        totalDuration: totalDuration
      }
    });
  }
});

// Barcode endpoint
app.post('/api/barcodes', (req, res) => {
  const { barcode } = req.body;
  
  console.log(`\n📊 BARCODE ENDPOINT:`);
  console.log(`   Received barcode: ${barcode}`);
  
  // Validate barcode
  if (!barcode || !/^\d{8,}$/.test(barcode)) {
    console.log(`❌ Invalid barcode format: ${barcode}`);
    return res.status(400).json({ error: 'Invalid barcode format' });
  }

  // Here you would typically save to a database
  console.log(`✅ Valid barcode processed: ${barcode}`);
  
  res.status(200).json({ 
    success: true,
    barcode,
    message: 'Barcode saved successfully' 
  });
});

// Placeholder routes (implement these based on your needs)
app.post('/api/upload-comparison', (req, res) => {
  console.log(`\n📋 UPLOAD COMPARISON ENDPOINT CALLED`);
  console.log(`   Request body:`, req.body);
  res.status(200).json({ message: 'Upload comparison endpoint - implement logic here' });
});

app.post('/api/compare-images', (req, res) => {
  console.log(`\n🔍 COMPARE IMAGES ENDPOINT CALLED`);
  console.log(`   Request body:`, req.body);
  res.status(200).json({ message: 'Compare images endpoint - implement logic here' });
});

// Eco-score proxy endpoint - SUPER ENHANCED WITH DEBUGGING
app.post("/api/get-eco-score-proxy", async (req, res) => {
  const proxyStartTime = Date.now();
  
  try {
    console.log(`\n🌱 ═══════════════════════════════════════════════════════════════════════════════`);
    console.log(`🌱 ECO-SCORE PROXY ENDPOINT ACTIVATED`);
    console.log(`🌱 ═══════════════════════════════════════════════════════════════════════════════`);
    console.log(`   🕐 Proxy Start Time: ${new Date().toISOString()}`);
    console.log(`   📥 Proxy Request Body:`, JSON.stringify(req.body, null, 2));
    
    const targetUrl = `${EFFECTIVE_ML_BASE_URL}/api/get-eco-score`;
    console.log(`\n🚀 ═══ PREPARING PROXY REQUEST ═══`);
    console.log(`   🎯 Target URL: ${targetUrl}`);
    console.log(`   📦 Payload Size: ${JSON.stringify(req.body).length} characters`);
    console.log(`   📋 Request Headers: Content-Type: application/json, Accept: application/json`);
    
    logMLApiInteraction('ECO-SCORE PROXY REQUEST', req.body, {
      'Proxy Target URL': targetUrl,
      'Request Method': 'POST',
      'Payload Size': `${JSON.stringify(req.body).length} characters`,
      'Timeout': '10 seconds'
    });
    
    const proxyRequestStartTime = Date.now();
    
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 second timeout
    });

    const proxyRequestDuration = Date.now() - proxyRequestStartTime;

    console.log(`\n📨 ═══ ECO-SCORE PROXY RAW RESPONSE ═══`);
    console.log(`   ⏱️ Response Time: ${proxyRequestDuration}ms`);
    console.log(`   📊 Status: ${response.status} ${response.statusText}`);
    console.log(`   📋 Response Headers:`, JSON.stringify(Object.fromEntries(response.headers), null, 2));
    console.log(`   📐 Content Length: ${response.headers.get('content-length') || 'Unknown'}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`\n❌ ═══ ECO-SCORE PROXY ERROR RESPONSE ═══`);
      console.log(`   💥 Status: ${response.status} ${response.statusText}`);
      console.log(`   📄 Error Body:`, errorText);
      
      logMLApiInteraction('ECO-SCORE PROXY ERROR', { errorText }, {
        'Status Code': response.status,
        'Status Text': response.statusText,
        'Response Time': `${proxyRequestDuration}ms`,
        'Error Body Length': `${errorText.length} characters`
      });
      
      throw new Error(`ML server responded with status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.log(`❌ ECO-SCORE CONTENT TYPE ERROR`);
      console.log(`   📄 Expected: application/json`);
      console.log(`   📄 Received: ${contentType}`);
      console.log(`   📄 Response Text (first 200 chars): ${text.substring(0, 200)}`);
      
      logMLApiInteraction('ECO-SCORE INVALID CONTENT TYPE', { 
        expectedContentType: 'application/json',
        receivedContentType: contentType,
        responseText: text.substring(0, 200)
      });
      
      return res.status(500).json({ 
        error: "ML server returned non-JSON response",
        details: text.substring(0, 200) // First 200 chars for debugging
      });
    }

    const responseText = await response.text();
    console.log(`\n📄 ═══ ECO-SCORE RAW RESPONSE BODY ═══`);
    console.log(`   📐 Response Body Length: ${responseText.length} characters`);
    console.log(`   📄 Raw Response Text:`, responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
      
      console.log(`\n✅ ═══ ECO-SCORE SUCCESS RESPONSE ═══`);
      console.log(`   📊 Parsed Response Type: ${typeof data}`);
      console.log(`   🌱 Eco Score: ${data.eco_score || 'NOT FOUND'}`);
      console.log(`   📦 Full Parsed Data:`, JSON.stringify(data, null, 2));
      
      logMLApiInteraction('ECO-SCORE SUCCESSFUL RESPONSE', data, {
        'Response Time': `${proxyRequestDuration}ms`,
        'Response Size': `${responseText.length} characters`,
        'Eco Score Value': data.eco_score || 'NOT FOUND',
        'Analysis Complete': true
      });
      
      console.log(`🌱 ═══════════════════════════════════════════════════════════════════════════════`);
      console.log(`🌱 ECO-SCORE PROXY COMPLETED SUCCESSFULLY`);
      console.log(`🌱 ═══════════════════════════════════════════════════════════════════════════════\n`);
      
    } catch (parseError) {
      console.log(`❌ ECO-SCORE JSON PARSING ERROR: ${parseError.message}`);
      console.log(`   📄 Response text: ${responseText}`);
      
      logMLApiInteraction('ECO-SCORE JSON PARSING FAILED', { 
        parseError: parseError.message, 
        responseText 
      });
      
      throw new Error(`Failed to parse eco-score response: ${parseError.message}`);
    }
    
    res.json(data);

  } catch (err) {
    const totalProxyDuration = Date.now() - proxyStartTime;
    
    console.error(`\n💥 ═══ ECO-SCORE PROXY CRITICAL ERROR ═══`);
    console.error(`   ⏱️ Total proxy duration: ${totalProxyDuration}ms`);
    console.error(`   💥 Error Type: ${err.constructor.name}`);
    console.error(`   💥 Error Message: ${err.message}`);
    console.error(`   📍 Error Stack:`, err.stack);
    
    logMLApiInteraction('ECO-SCORE PROXY CRITICAL ERROR', {
      errorType: err.constructor.name,
      errorMessage: err.message,
      totalDuration: totalProxyDuration
    });
    
    if (err.code === 'ECONNREFUSED') {
      console.log(`❌ CONNECTION REFUSED to ML server`);
      console.log(`🌱 ═══════════════════════════════════════════════════════════════════════════════`);
      console.log(`🌱 ECO-SCORE PROXY FAILED - CONNECTION REFUSED`);
      console.log(`🌱 ═══════════════════════════════════════════════════════════════════════════════\n`);
      
      return res.status(503).json({ 
        error: "Cannot connect to ML server",
        details: "ML service is not available"
      });
    }
    
    if (err.name === 'SyntaxError') {
      console.log(`❌ INVALID JSON from ML server`);
      console.log(`🌱 ═══════════════════════════════════════════════════════════════════════════════`);
      console.log(`🌱 ECO-SCORE PROXY FAILED - INVALID JSON`);
      console.log(`🌱 ═══════════════════════════════════════════════════════════════════════════════\n`);
      
      return res.status(500).json({ 
        error: "Invalid JSON response from ML server"
      });
    }
    
    console.log(`🌱 ═══════════════════════════════════════════════════════════════════════════════`);
    console.log(`🌱 ECO-SCORE PROXY FAILED - GENERAL ERROR`);
    console.log(`🌱 ═══════════════════════════════════════════════════════════════════════════════\n`);
    
    res.status(500).json({ 
      error: "Proxy request failed",
      details: err.message,
      debug: {
        errorType: err.constructor.name,
        totalDuration: totalProxyDuration
      }
    });
  }
});

// Proxy: GET /api/get_url -> forwards to ML backend /get_url?url=...
app.get('/api/get_url', async (req, res) => {
  try {
    const inputUrl = (req.query.url || '').toString().trim();
    if (!inputUrl || typeof inputUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing url query param' });
    }

    const target = `${EFFECTIVE_ML_BASE_URL}/get_url?url=${encodeURIComponent(inputUrl)}`;

    let resp;
    let lastErr;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        resp = await fetch(target, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'greenlight-backend/1.0',
            'ngrok-skip-browser-warning': 'true'
          }
        });
        break;
      } catch (e) {
        lastErr = e;
        console.log(`get_url fetch attempt ${attempt} failed:`, e instanceof Error ? e.message : String(e));
        if (attempt === 2) throw e;
        await new Promise(r => setTimeout(r, 200));
      }
    }
    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ success: false, error: 'Upstream error', details: text });
    }
    const data = await resp.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Proxy failed', details: err instanceof Error ? err.message : String(err) });
  }
});

// Proxy: GET /api/get_barcode -> forwards to ML backend /get_barcode?barcode=...
app.get('/api/get_barcode', async (req, res) => {
  try {
    const barcodeRaw = (req.query.barcode || '').toString();
    const barcode = barcodeRaw.replace(/\D+/g, '').trim();
    if (!barcode) {
      return res.status(400).json({ success: false, error: 'Missing barcode query param' });
    }

    const target = `${EFFECTIVE_ML_BASE_URL}/get_barcode?barcode=${encodeURIComponent(barcode)}`;

    let resp;
    let lastErr;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        resp = await fetch(target, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'greenlight-backend/1.0',
            'ngrok-skip-browser-warning': 'true'
          }
        });
        break;
      } catch (e) {
        lastErr = e;
        console.log(`get_barcode fetch attempt ${attempt} failed:`, e instanceof Error ? e.message : String(e));
        if (attempt === 2) throw e;
        await new Promise(r => setTimeout(r, 200));
      }
    }
    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ success: false, error: 'Upstream error', details: text });
    }
    const data = await resp.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Proxy failed', details: err instanceof Error ? err.message : String(err) });
  }
});
// POST /api/get-alternatives
app.post('/api/get-alternatives', async (req, res) => {
  const requestStartTime = Date.now();
  
  try {
    console.log(`\n🔄 ╔══════════════════════════════════════════════════════════════════════════════╗`);
    console.log(`🔄 STARTING GET ALTERNATIVES REQUEST`);
    console.log(`🔄 ╚══════════════════════════════════════════════════════════════════════════════╝`);
    console.log(`   🕐 Start Time: ${new Date().toISOString()}`);
    console.log(`   📦 Request Body:`, JSON.stringify(req.body, null, 2));
    console.log(`   🔢 Query Parameters:`, JSON.stringify(req.query, null, 2));
    
    const { sessionId, useExtractedData = false, ...manualData } = req.body;
    const numAlternatives = req.query.num_alternatives || 3;
    
    let payload;
    
    if (useExtractedData && sessionId) {
      console.log(`\n🔍 ═══ RETRIEVING PREVIOUSLY EXTRACTED DATA ═══`);
      console.log(`   🆔 Session ID: ${sessionId}`);
      
      let extractedInfo;
      
      // Try to load from memory cache first
      if (extractedDataCache.has(sessionId)) {
        extractedInfo = extractedDataCache.get(sessionId);
        console.log(`   ✅ Data found in memory cache`);
      } else {
        // Try to load from file system
        try {
          extractedInfo = await loadExtractedData(sessionId);
          console.log(`   ✅ Data loaded from file system`);
          // Also cache it in memory for future use
          extractedDataCache.set(sessionId, extractedInfo);
        } catch (loadError) {
          console.log(`   ❌ Failed to load extracted data: ${loadError.message}`);
          return res.status(404).json({
            success: false,
            error: 'No extracted data found for the provided session ID',
            sessionId: sessionId
          });
        }
      }
      
      console.log(`   📦 Retrieved extracted data:`, JSON.stringify(extractedInfo.extractedData, null, 2));
      
      // Map extracted data to the expected payload format
      const extractedData = extractedInfo.extractedData;
      payload = {
        product_name: extractedData.product_name || "",
        brand: extractedData.brand || "",
        category: extractedData.category || "Unknown", // You might need to add category detection to your ML model
        weight: extractedData.weight || "250ml",
        packaging_type: extractedData.packaging_type || "Plastic",
        ingredient_list: extractedData.ingredients || "",
        latitude: manualData.latitude || 12.9716,
        longitude: manualData.longitude || 77.5946,
        usage_frequency: manualData.usage_frequency || "daily",
        manufacturing_loc: extractedData.manufacturer_state || "Mumbai"
      };
      
      console.log(`   🔄 Mapped extracted data to payload:`, JSON.stringify(payload, null, 2));
      
    } else {
      console.log(`\n📝 ═══ USING MANUALLY PROVIDED DATA ═══`);
      
      // Validate required fields for manual data
      const requiredFields = ['product_name', 'brand', 'category'];
      const missingFields = requiredFields.filter(field => !manualData[field]);
      
      if (missingFields.length > 0) {
        console.log(`❌ VALIDATION ERROR: Missing required fields: ${missingFields.join(', ')}`);
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          missingFields: missingFields,
          requiredFields: requiredFields
        });
      }
      
      // Set default values for optional fields
      payload = {
        product_name: manualData.product_name,
        brand: manualData.brand,
        category: manualData.category,
        weight: manualData.weight || "250ml",
        packaging_type: manualData.packaging_type || "Plastic",
        ingredient_list: manualData.ingredient_list || "",
        latitude: manualData.latitude || 12.9716,
        longitude: manualData.longitude || 77.5946,
        usage_frequency: manualData.usage_frequency || "daily",
        manufacturing_loc: manualData.manufacturing_loc || "Mumbai"
      };
    }

    console.log(`\n📋 ╔═══ REQUEST VALIDATION & PROCESSING ═══╗`);
    console.log(`   ✅ Validation passed`);
    console.log(`   🔢 Number of alternatives requested: ${numAlternatives}`);
    console.log(`   🔄 Using extracted data: ${useExtractedData && sessionId ? 'YES' : 'NO'}`);
    console.log(`   📦 Final payload:`, JSON.stringify(payload, null, 2));
    
    const mlApiUrl = `${ML_NGROK_URL}/api/get-alternatives?num_alternatives=${numAlternatives}`;
    console.log(`   🎯 ML API URL: ${mlApiUrl}`);

    // Enhanced ML API interaction logging
    logMLApiInteraction('GET ALTERNATIVES REQUEST PREPARATION', payload, {
      'Target ML API URL': mlApiUrl,
      'Request Method': 'POST',
      'Number of Alternatives': numAlternatives,
      'Product Name': payload.product_name,
      'Brand': payload.brand,
      'Category': payload.category,
      'Manufacturing Location': payload.manufacturing_loc,
      'Using Extracted Data': useExtractedData && sessionId ? 'YES' : 'NO',
      'Session ID': sessionId || 'N/A'
    });

    console.log(`\n🚀 ╔═══ MAKING ML API CALL ═══╗`);
    console.log(`   🎯 Target: ${mlApiUrl}`);
    console.log(`   📤 Method: POST`);
    console.log(`   📋 Headers: Content-Type: application/json, ngrok-skip-browser-warning: true`);
    console.log(`   📦 Payload Size: ${JSON.stringify(payload).length} characters`);
    console.log(`   ⏱️ Starting request at: ${new Date().toISOString()}`);

    const mlRequestStartTime = Date.now();

    const mlResponse = await fetch(mlApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const mlRequestDuration = Date.now() - mlRequestStartTime;

    console.log(`\n📨 ╔═══ ML API RAW RESPONSE ═══╗`);
    console.log(`   ⏱️ Response received at: ${new Date().toISOString()}`);
    console.log(`   🕐 Request duration: ${mlRequestDuration}ms`);
    console.log(`   📊 Status Code: ${mlResponse.status}`);
    console.log(`   📊 Status Text: ${mlResponse.statusText}`);
    console.log(`   📋 Response Headers:`, JSON.stringify(Object.fromEntries(mlResponse.headers), null, 2));
    console.log(`   📏 Content Length: ${mlResponse.headers.get('content-length') || 'Unknown'}`);
    console.log(`   📄 Content Type: ${mlResponse.headers.get('content-type') || 'Unknown'}`);

    const mlResponseText = await mlResponse.text();
    console.log(`   📄 Raw Response Body:`, mlResponseText);

    if (!mlResponse.ok) {
      console.log(`\n❌ ╔═══ ML API ERROR RESPONSE ═══╗`);
      console.log(`   💥 Status: ${mlResponse.status} ${mlResponse.statusText}`);
      console.log(`   📄 Error Body:`, mlResponseText);
      
      logMLApiInteraction('GET ALTERNATIVES ERROR RESPONSE', { errorText: mlResponseText }, {
        'Status Code': mlResponse.status,
        'Status Text': mlResponse.statusText,
        'Response Time': `${mlRequestDuration}ms`,
        'Session ID': sessionId || 'N/A'
      });
      
      throw new Error(`ML API returned status ${mlResponse.status}: ${mlResponseText}`);
    }

    let mlData;
    try {
      mlData = JSON.parse(mlResponseText);
      
      console.log(`\n✅ ╔═══ ML API PARSED SUCCESS RESPONSE ═══╗`);
      console.log(`   📊 Parsed Response Type: ${typeof mlData}`);
      console.log(`   🔢 Number of alternatives returned: ${mlData.alternatives?.length || 0}`);
      console.log(`   📦 Full Parsed Data:`, JSON.stringify(mlData, null, 2));
      
      logMLApiInteraction('GET ALTERNATIVES SUCCESSFUL RESPONSE', mlData, {
        'Response Time': `${mlRequestDuration}ms`,
        'Response Size': `${mlResponseText.length} characters`,
        'Alternatives Count': mlData.alternatives?.length || 0,
        'Analysis Status': 'SUCCESS',
        'Session ID': sessionId || 'N/A'
      });
      
    } catch (parseError) {
      console.log(`\n❌ ╔═══ JSON PARSING ERROR ═══╗`);
      console.log(`   💥 Parse Error: ${parseError.message}`);
      console.log(`   📄 Response Text: ${mlResponseText}`);
      
      logMLApiInteraction('GET ALTERNATIVES JSON PARSING FAILED', { 
        parseError: parseError.message, 
        responseText: mlResponseText 
      }, {
        'Response Time': `${mlRequestDuration}ms`,
        'Parse Error Type': parseError.constructor.name,
        'Session ID': sessionId || 'N/A'
      });
      
      throw new Error(`Failed to parse ML API response: ${parseError.message}`);
    }

    const responseData = {
      success: true,
      sessionId: sessionId || null,
      usedExtractedData: useExtractedData && sessionId,
      data: mlData,
      requestedAlternatives: parseInt(numAlternatives),
      actualAlternatives: mlData.alternatives?.length || 0,
      message: 'Alternative products retrieved successfully',
      debug: {
        totalDuration: Date.now() - requestStartTime,
        mlApiDuration: mlRequestDuration,
        mlApiUrl: mlApiUrl,
        mlApiStatus: mlResponse.status
      }
    };

    console.log(`\n🎯 ╔═══ FINAL SUCCESS RESPONSE TO CLIENT ═══╗`);
    console.log(`   ⏱️ Total processing time: ${Date.now() - requestStartTime}ms`);
    console.log(`   🔢 Alternatives requested: ${numAlternatives}`);
    console.log(`   🔢 Alternatives returned: ${mlData.alternatives?.length || 0}`);
    console.log(`   🔄 Used extracted data: ${useExtractedData && sessionId ? 'YES' : 'NO'}`);
    console.log(`   🆔 Session ID: ${sessionId || 'N/A'}`);
    console.log(`   🎯 Response Data:`, JSON.stringify(responseData, null, 2));
    console.log(`🔄 ╔══════════════════════════════════════════════════════════════════════════════╗`);
    console.log(`🔄 GET ALTERNATIVES PROCESS COMPLETED SUCCESSFULLY`);
    console.log(`🔄 ╚══════════════════════════════════════════════════════════════════════════════╝\n`);

    res.json(responseData);

  } catch (error) {
    const totalDuration = Date.now() - requestStartTime;
    
    console.log(`\n💥 ╔═══ GET ALTERNATIVES CRITICAL ERROR ═══╗`);
    console.log(`   ⏱️ Total duration before error: ${totalDuration}ms`);
    console.log(`   💥 Error Type: ${error.constructor.name}`);
    console.log(`   💥 Error Message: ${error.message}`);
    console.log(`   📋 Error Stack:`, error.stack);
    
    logMLApiInteraction('GET ALTERNATIVES CRITICAL ERROR', { 
      errorType: error.constructor.name,
      errorMessage: error.message,
      totalDuration: totalDuration
    });
    
    console.log(`🔄 ╔══════════════════════════════════════════════════════════════════════════════╗`);
    console.log(`🔄 GET ALTERNATIVES PROCESS FAILED`);
    console.log(`🔄 ╚══════════════════════════════════════════════════════════════════════════════╝\n`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get alternative products',
      details: error.message,
      debug: {
        errorType: error.constructor.name,
        totalDuration: totalDuration
      }
    });
  }
});


// NEW ENDPOINT: Direct ML API Test - For debugging ML communication
app.post('/api/test-ml-connection', async (req, res) => {
  try {
    console.log(`\n🔧 ═══════════════════════════════════════════════════════════════════════════════`);
    console.log(`🔧 ML CONNECTION TEST ENDPOINT`);
    console.log(`🔧 ═══════════════════════════════════════════════════════════════════════════════`);
    
    const testPayload = {
      image_path1: "https://66594fafc15d.ngrok-free.app/uploads/back-test.jpg",
      image_path2: "https://66594fafc15d.ngrok-free.app/uploads/front-test.jpg"
    };
    
    const mlApiUrl = `${ML_NGROK_URL}/extract-picture`;
    
    logMLApiInteraction('ML CONNECTION TEST REQUEST', testPayload, {
      'Test URL': mlApiUrl,
      'Test Purpose': 'Connection and endpoint validation'
    });
    
    const testStartTime = Date.now();
    
    const response = await fetch(mlApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(testPayload)
    });
    
    const testDuration = Date.now() - testStartTime;
    
    const responseText = await response.text();
    
    logMLApiInteraction('ML CONNECTION TEST RESPONSE', {
      status: response.status,
      responseText: responseText
    }, {
      'Response Time': `${testDuration}ms`,
      'Status': `${response.status} ${response.statusText}`,
      'Connection Success': response.ok
    });
    
    console.log(`🔧 ═══════════════════════════════════════════════════════════════════════════════\n`);
    
    res.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseTime: testDuration,
      responseBody: responseText,
      headers: Object.fromEntries(response.headers)
    });
    
  } catch (error) {
    console.error(`💥 ML CONNECTION TEST FAILED: ${error.message}`);
    
    logMLApiInteraction('ML CONNECTION TEST FAILED', {
      errorMessage: error.message,
      errorType: error.constructor.name
    });
    
    res.status(500).json({
      success: false,
      error: error.message,
      errorType: error.constructor.name
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.log(`\n💥 ERROR MIDDLEWARE TRIGGERED:`);
  console.log(`   Error type: ${err.constructor.name}`);
  console.log(`   Error message: ${err.message}`);
  console.log(`   Error stack:`, err.stack);
  
  if (err instanceof multer.MulterError) {
    console.log(`❌ Multer error: ${err.message}`);
    return res.status(400).json({ message: err.message });
  } else if (err) {
    console.log(`❌ General error: ${err.message}`);
    return res.status(500).json({ message: err.message });
  }
  next();
});

// Debug endpoint to test URL serving
app.get('/debug/test-urls/:folder', async (req, res) => {
  const folder = req.params.folder;
  let directory;
  
  switch(folder) {
    case 'uploads':
      directory = uploadsDir;
      break;
    case 'product1':
      directory = product1Dir;
      break;
    case 'product2':
      directory = product2Dir;
      break;
    default:
      return res.status(400).json({ message: 'Invalid folder specified' });
  }
  
  console.log(`\n🔧 DEBUG URL TESTING FOR ${folder.toUpperCase()}`);
  
  const dirInfo = getDirectoryInfo(directory);
  const results = [];
  
  for (const file of dirInfo.allFiles) {
    const localUrl = `http://localhost:${PORT}/${folder}/${file}`;
    const publicUrl = `${BACKEND_NGROK_URL}/${folder}/${file}`;
    
    console.log(`\n   Testing file: ${file}`);
    const localReachable = await testUrlReachability(localUrl);
    const publicReachable = await testUrlReachability(publicUrl);
    
    results.push({
      filename: file,
      localUrl,
      publicUrl,
      localReachable,
      publicReachable
    });
  }
  
  console.log(`\n📊 DEBUG RESULTS SUMMARY:`);
  console.log(`   Total files tested: ${results.length}`);
  console.log(`   Local URLs working: ${results.filter(r => r.localReachable).length}`);
  console.log(`   Public URLs working: ${results.filter(r => r.publicReachable).length}`);
  
  res.json({
    folder,
    totalFiles: results.length,
    results,
    summary: {
      localUrlsWorking: results.filter(r => r.localReachable).length,
      publicUrlsWorking: results.filter(r => r.publicReachable).length
    }
  });
});
app.use("/api", ecoRoutes);

// NEW DEBUG ENDPOINT: Manual ML API Test with Custom URLs
app.post('/debug/test-extract-picture', async (req, res) => {
  try {
    console.log(`\n🧪 ═══════════════════════════════════════════════════════════════════════════════`);
    console.log(`🧪 MANUAL ML API EXTRACT-PICTURE TEST`);
    console.log(`🧪 ═══════════════════════════════════════════════════════════════════════════════`);
    
    const { image_path1, image_path2 } = req.body;
    
    console.log(`   📥 Test Request Body:`, JSON.stringify(req.body, null, 2));
    console.log(`   🖼️ Image Path 1: ${image_path1 || 'NULL'}`);
    console.log(`   🖼️ Image Path 2: ${image_path2 || 'NULL'}`);
    
    const mlApiUrl = `${ML_NGROK_URL}/extract-picture`;
    const testPayload = {
      image_path1: image_path1 || "",
      image_path2: image_path2 || ""
    };
    
    logMLApiInteraction('MANUAL EXTRACT-PICTURE TEST REQUEST', testPayload, {
      'API URL': mlApiUrl,
      'Test Type': 'Manual/Debug',
      'Image 1 Provided': !!image_path1,
      'Image 2 Provided': !!image_path2
    });
    
    const testStartTime = Date.now();
    
    console.log(`\n🚀 SENDING MANUAL REQUEST TO ML API...`);
    
    const mlResponse = await fetch(mlApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    const testDuration = Date.now() - testStartTime;
    
    console.log(`\n📨 ═══ MANUAL ML API RESPONSE ═══`);
    console.log(`   ⏱️ Response Time: ${testDuration}ms`);
    console.log(`   📊 Status: ${mlResponse.status} ${mlResponse.statusText}`);
    console.log(`   📋 Headers:`, JSON.stringify(Object.fromEntries(mlResponse.headers), null, 2));
    
    const responseText = await mlResponse.text();
    console.log(`   📄 Response Body:`, responseText);
    
    if (mlResponse.ok) {
      try {
        const parsedData = JSON.parse(responseText);
        
        logMLApiInteraction('MANUAL EXTRACT-PICTURE SUCCESS', parsedData, {
          'Response Time': `${testDuration}ms`,
          'Product Name': parsedData.product_name || 'NOT FOUND',
          'Brand': parsedData.brand || 'NOT FOUND',
          'Manufacturer State': parsedData.manufacturer_state || 'NOT FOUND',
          'Ingredients Length': parsedData.ingredients?.length || 0
        });
        
        console.log(`🧪 ═══════════════════════════════════════════════════════════════════════════════`);
        console.log(`🧪 MANUAL ML API TEST COMPLETED SUCCESSFULLY`);
        console.log(`🧪 ═══════════════════════════════════════════════════════════════════════════════\n`);
        
        res.json({
          success: true,
          mlApiResponse: parsedData,
          debug: {
            responseTime: testDuration,
            status: mlResponse.status,
            headers: Object.fromEntries(mlResponse.headers)
          }
        });
        
      } catch (parseError) {
        console.log(`❌ MANUAL TEST JSON PARSING ERROR: ${parseError.message}`);
        
        logMLApiInteraction('MANUAL TEST JSON PARSING FAILED', { 
          parseError: parseError.message, 
          responseText 
        });
        
        res.status(500).json({
          success: false,
          error: 'Failed to parse ML API response',
          details: parseError.message,
          rawResponse: responseText
        });
      }
    } else {
      logMLApiInteraction('MANUAL EXTRACT-PICTURE ERROR', { 
        errorText: responseText 
      }, {
        'Status Code': mlResponse.status,
        'Response Time': `${testDuration}ms`
      });
      
      console.log(`🧪 ═══════════════════════════════════════════════════════════════════════════════`);
      console.log(`🧪 MANUAL ML API TEST FAILED`);
      console.log(`🧪 ═══════════════════════════════════════════════════════════════════════════════\n`);
      
      res.status(500).json({
        success: false,
        error: `ML API returned status ${mlResponse.status}`,
        details: responseText,
        debug: {
          responseTime: testDuration,
          status: mlResponse.status,
          headers: Object.fromEntries(mlResponse.headers)
        }
      });
    }
    
  } catch (error) {
    console.error(`💥 MANUAL ML TEST CRITICAL ERROR: ${error.message}`);
    
    logMLApiInteraction('MANUAL TEST CRITICAL ERROR', {
      errorType: error.constructor.name,
      errorMessage: error.message
    });
    
    console.log(`🧪 ═══════════════════════════════════════════════════════════════════════════════`);
    console.log(`🧪 MANUAL ML API TEST EXCEPTION`);
    console.log(`🧪 ═══════════════════════════════════════════════════════════════════════════════\n`);
    
    res.status(500).json({
      success: false,
      error: 'ML API test failed',
      details: error.message,
      errorType: error.constructor.name
    });
  }
});

// Enhanced curl command generator endpoint
app.get('/debug/generate-curl/:folder', (req, res) => {
  const folder = req.params.folder;
  let directory;
  
  switch(folder) {
    case 'uploads':
      directory = uploadsDir;
      break;
    case 'product1':
      directory = product1Dir;
      break;
    case 'product2':
      directory = product2Dir;
      break;
    default:
      return res.status(400).json({ message: 'Invalid folder specified' });
  }
  
  const dirInfo = getDirectoryInfo(directory);
  
  const frontImageUrl = dirInfo.frontImages.length > 0 
    ? `${BACKEND_NGROK_URL}/${folder}/${dirInfo.frontImages[0]}`
    : "";
    
  const backImageUrl = dirInfo.backImages.length > 0 
    ? `${BACKEND_NGROK_URL}/${folder}/${dirInfo.backImages[0]}`
    : "";
  
  const curlCommand = `curl -X 'POST' \\
  '${ML_NGROK_URL}/extract-picture' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -H 'ngrok-skip-browser-warning: true' \\
  -d '{
    "image_path1": "${frontImageUrl}",
    "image_path2": "${backImageUrl}"
  }'`;
  
  console.log(`\n🔧 GENERATED CURL COMMAND FOR ${folder.toUpperCase()}:`);
  console.log(curlCommand);
  
  res.json({
    folder,
    frontImageUrl,
    backImageUrl,
    curlCommand,
    mlApiUrl: `${ML_NGROK_URL}/extract-picture`,
    payload: {
      image_path1: frontImageUrl,
      image_path2: backImageUrl
    }
  });
});

// NEW ENDPOINT: Compare two products
app.post('/api/compare-products', async (req, res) => {
  const requestStartTime = Date.now();
  
  try {
    console.log(`\n🔄 ╔══════════════════════════════════════════════════════════════════════════════╗`);
    console.log(`🔄 STARTING PRODUCT COMPARISON REQUEST`);
    console.log(`🔄 ╚══════════════════════════════════════════════════════════════════════════════╝`);
    console.log(`   🕐 Start Time: ${new Date().toISOString()}`);
    console.log(`   📦 Request Body:`, JSON.stringify(req.body, null, 2));
    
    const { product1, product2 } = req.body;
    
    // Validate required fields
    if (!product1 || !product2) {
      console.log(`❌ VALIDATION ERROR: Missing product data`);
      return res.status(400).json({
        success: false,
        error: 'Both product1 and product2 data are required',
        requiredFields: ['product1', 'product2']
      });
    }
    
    console.log(`\n📋 ╔═══ REQUEST VALIDATION & PROCESSING ═══╗`);
    console.log(`   ✅ Validation passed`);
    console.log(`   📦 Product 1:`, JSON.stringify(product1, null, 2));
    console.log(`   📦 Product 2:`, JSON.stringify(product2, null, 2));
    
    const mlApiUrl = `${ML_NGROK_URL}/api/compare-products`;
    console.log(`   🎯 ML API URL: ${mlApiUrl}`);

    // Enhanced ML API interaction logging
    logMLApiInteraction('COMPARE PRODUCTS REQUEST PREPARATION', { product1, product2 }, {
      'Target ML API URL': mlApiUrl,
      'Request Method': 'POST',
      'Product 1 Name': product1.product_name || 'Unknown',
      'Product 2 Name': product2.product_name || 'Unknown',
      'Product 1 Brand': product1.brand || 'Unknown',
      'Product 2 Brand': product2.brand || 'Unknown'
    });

    console.log(`\n🚀 ╔═══ MAKING ML API CALL ═══╗`);
    console.log(`   🎯 Target: ${mlApiUrl}`);
    console.log(`   📤 Method: POST`);
    console.log(`   📋 Headers: Content-Type: application/json, ngrok-skip-browser-warning: true`);
    console.log(`   📦 Payload Size: ${JSON.stringify({ product1, product2 }).length} characters`);
    console.log(`   ⏱️ Starting request at: ${new Date().toISOString()}`);

    const mlRequestStartTime = Date.now();

    const mlResponse = await fetch(mlApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ product1, product2 })
    });

    const mlRequestDuration = Date.now() - mlRequestStartTime;

    console.log(`\n📨 ╔═══ ML API RAW RESPONSE ═══╗`);
    console.log(`   ⏱️ Response received at: ${new Date().toISOString()}`);
    console.log(`   🕐 Request duration: ${mlRequestDuration}ms`);
    console.log(`   📊 Status Code: ${mlResponse.status}`);
    console.log(`   📊 Status Text: ${mlResponse.statusText}`);
    console.log(`   📋 Response Headers:`, JSON.stringify(Object.fromEntries(mlResponse.headers), null, 2));
    console.log(`   📏 Content Length: ${mlResponse.headers.get('content-length') || 'Unknown'}`);
    console.log(`   📄 Content Type: ${mlResponse.headers.get('content-type') || 'Unknown'}`);

    const mlResponseText = await mlResponse.text();
    console.log(`   📄 Raw Response Body:`, mlResponseText);

    if (!mlResponse.ok) {
      console.log(`\n❌ ╔═══ ML API ERROR RESPONSE ═══╗`);
      console.log(`   💥 Status: ${mlResponse.status} ${mlResponse.statusText}`);
      console.log(`   📄 Error Body:`, mlResponseText);
      
      logMLApiInteraction('COMPARE PRODUCTS ERROR RESPONSE', { errorText: mlResponseText }, {
        'Status Code': mlResponse.status,
        'Status Text': mlResponse.statusText,
        'Response Time': `${mlRequestDuration}ms`
      });
      
      throw new Error(`ML API returned status ${mlResponse.status}: ${mlResponseText}`);
    }

    let mlData;
    try {
      mlData = JSON.parse(mlResponseText);
      
      console.log(`\n✅ ╔═══ ML API PARSED SUCCESS RESPONSE ═══╗`);
      console.log(`   📊 Parsed Response Type: ${typeof mlData}`);
      console.log(`   📦 Full Parsed Data:`, JSON.stringify(mlData, null, 2));
      
      logMLApiInteraction('COMPARE PRODUCTS SUCCESSFUL RESPONSE', mlData, {
        'Response Time': `${mlRequestDuration}ms`,
        'Response Size': `${mlResponseText.length} characters`,
        'Analysis Status': 'SUCCESS'
      });
      
    } catch (parseError) {
      console.log(`\n❌ ╔═══ JSON PARSING ERROR ═══╗`);
      console.log(`   💥 Parse Error: ${parseError.message}`);
      console.log(`   📄 Response Text: ${mlResponseText}`);
      
      logMLApiInteraction('COMPARE PRODUCTS JSON PARSING FAILED', { 
        parseError: parseError.message, 
        responseText: mlResponseText 
      }, {
        'Response Time': `${mlRequestDuration}ms`,
        'Parse Error Type': parseError.constructor.name
      });
      
      throw new Error(`Failed to parse ML API response: ${parseError.message}`);
    }

    const responseData = {
      success: true,
      data: mlData,
      message: 'Product comparison completed successfully',
      debug: {
        totalDuration: Date.now() - requestStartTime,
        mlApiDuration: mlRequestDuration,
        mlApiUrl: mlApiUrl,
        mlApiStatus: mlResponse.status
      }
    };

    console.log(`\n🎯 ╔═══ FINAL SUCCESS RESPONSE TO CLIENT ═══╗`);
    console.log(`   ⏱️ Total processing time: ${Date.now() - requestStartTime}ms`);
    console.log(`   🎯 Response Data:`, JSON.stringify(responseData, null, 2));
    console.log(`🔄 ╔══════════════════════════════════════════════════════════════════════════════╗`);
    console.log(`🔄 PRODUCT COMPARISON PROCESS COMPLETED SUCCESSFULLY`);
    console.log(`🔄 ╚══════════════════════════════════════════════════════════════════════════════╝\n`);

    res.json(responseData);

  } catch (error) {
    const totalDuration = Date.now() - requestStartTime;
    
    console.log(`\n💥 ╔═══ PRODUCT COMPARISON CRITICAL ERROR ═══╗`);
    console.log(`   ⏱️ Total duration before error: ${totalDuration}ms`);
    console.log(`   💥 Error Type: ${error.constructor.name}`);
    console.log(`   💥 Error Message: ${error.message}`);
    console.log(`   📋 Error Stack:`, error.stack);
    
    logMLApiInteraction('PRODUCT COMPARISON CRITICAL ERROR', { 
      errorType: error.constructor.name,
      errorMessage: error.message,
      totalDuration: totalDuration
    });
    
    console.log(`🔄 ╔══════════════════════════════════════════════════════════════════════════════╗`);
    console.log(`🔄 PRODUCT COMPARISON PROCESS FAILED`);
    console.log(`🔄 ╚══════════════════════════════════════════════════════════════════════════════╝\n`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to compare products',
      details: error.message,
      debug: {
        errorType: error.constructor.name,
        totalDuration: totalDuration
      }
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 ═══════════════════════════════════════════════════════════════════════════════`);
  console.log(`🚀 SERVER STARTING WITH ENHANCED ML API DEBUGGING`);
  console.log(`🚀 ═══════════════════════════════════════════════════════════════════════════════`);
  console.log(`   🌐 Port: ${PORT}`);
  console.log(`   🔗 Server URL: http://localhost:${PORT}`);
  console.log(`   🔗 Backend NGROK URL: ${BACKEND_NGROK_URL}`);
  console.log(`   🤖 ML NGROK URL: ${ML_NGROK_URL}`);
  console.log(`   🤖 ML BASE URL: ${ML_BASE_URL}`);
  
  console.log(`\n📁 UPLOAD DIRECTORIES:`);
  console.log(`   📂 uploads: ${uploadsDir}`);
  console.log(`   📂 product1: ${product1Dir}`);
  console.log(`   📂 product2: ${product2Dir}`);
  
  console.log(`\n🛠️ AVAILABLE ENDPOINTS:`);
  console.log(`   📤 Upload endpoints:`);
  console.log(`     - POST /upload (saves to /uploads)`);
  console.log(`     - POST /upload-product1 (saves to /product1)`);
  console.log(`     - POST /upload-product2 (saves to /product2)`);
  console.log(`     - POST /upload/:folder (dynamic folder selection)`);
  console.log(`   📊 Status endpoints:`);
  console.log(`     - GET /folder-status/:folder (get folder status)`);
  console.log(`   🏷️ ML endpoints:`);
  console.log(`     - POST /api/extract-labels (extract label data with FULL DEBUGGING)`);
  console.log(`     - POST /api/analyze-product (complete analysis with FULL DEBUGGING)`);
  console.log(`     - POST /api/get-eco-score-proxy (eco-score proxy with FULL DEBUGGING)`);
  console.log(`     - POST /api/get-alternatives (eco-score proxy with FULL DEBUGGING)`);
  console.log(`   🔧 Debug endpoints:`);
  console.log(`     - GET /debug/test-urls/:folder (test URL reachability)`);
  console.log(`     - POST /debug/test-extract-picture (manual ML API test)`);
  console.log(`     - GET /debug/generate-curl/:folder (generate curl commands)`);
  console.log(`     - POST /api/test-ml-connection (test ML connectivity)`);
  console.log(`   📊 Other endpoints:`);
  console.log(`     - POST /api/barcodes (barcode processing)`);
  
  console.log(`\n📏 FOLDER RULES:`);
  console.log(`   Each folder maintains max 2 images: 1 front, 1 back`);
  console.log(`   Older images are automatically replaced`);
  
  console.log(`\n🔍 ENHANCED DEBUGGING FEATURES:`);
  console.log(`   ✅ Comprehensive ML API request/response logging`);
  console.log(`   ✅ Detailed /extract-picture interaction tracking`);
  console.log(`   ✅ JSON parsing error detection and logging`);
  console.log(`   ✅ URL reachability testing with detailed output`);
  console.log(`   ✅ Request/response timing measurements`);
  console.log(`   ✅ Error tracking with stack traces`);
  console.log(`   ✅ Manual ML API testing endpoints`);
  console.log(`   ✅ Curl command generation for debugging`);
  
  console.log(`\n🎯 DEBUGGING WORKFLOW:`);
  console.log(`   1. 📤 Upload images and check console for URL generation`);
  console.log(`   2. 🏷️ Call /api/extract-labels to see full ML API interaction logs`);
  console.log(`   3. 🔧 Use /debug/test-extract-picture for manual ML API testing`);
  console.log(`   4. 🌐 Use /debug/test-urls/:folder to verify URL accessibility`);
  console.log(`   5. 📋 Use /debug/generate-curl/:folder to get curl commands`);
  console.log(`   6. 🔍 Monitor console for detailed step-by-step process logging`);
  
  console.log(`\n🤖 ML API INTERACTION TRACKING:`);
  console.log(`   🎯 Every request to ${ML_NGROK_URL}/extract-picture will be logged`);
  console.log(`   📥 Input payload will be shown with image URLs`);
  console.log(`   📤 Response data will be parsed and displayed`);
  console.log(`   ⏱️ Response times will be measured and reported`);
  console.log(`   🔍 JSON parsing steps will be tracked`);
  
  console.log(`🚀 ═══════════════════════════════════════════════════════════════════════════════`);
  console.log(`🚀 SERVER READY FOR ENHANCED ML API DEBUGGING`);
  console.log(`🚀 ═══════════════════════════════════════════════════════════════════════════════\n`);
});