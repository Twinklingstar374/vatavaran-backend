import multer from "multer";
const storage = multer.memoryStorage(); // keep in memory, then upload buffer to cloudinary
export const upload= multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});
