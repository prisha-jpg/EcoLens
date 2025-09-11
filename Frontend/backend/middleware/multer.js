import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'uploads', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  },
});

const upload = multer({ storage });

export default upload;



// import multer from "multer";

// const storage = multer.diskStorage({
//     filename:function(req,file,callback){
//         callback(null, file.originalname)
//     }
// })

// const upload = multer({storage})

// export default upload;