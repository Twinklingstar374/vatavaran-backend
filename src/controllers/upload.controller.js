
import { uploadImage } from "../services/cloudinary.service.js";

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const start = Date.now();
    const result = await uploadImage(req.file.buffer, "vatavaran/pickups");
    
    console.log(`📸 Image uploaded successfully in ${Date.now() - start}ms`);

    res.status(200).json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Image upload failed", 
      error: error.message 
    });
  }
};
