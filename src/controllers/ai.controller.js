import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();



// Simple in-memory lock to prevent spam/concurrent requests
let isGlobalProcessing = false;

export const classifyWaste = async (req, res) => {
  console.log("📥 AI: Classification request received");

  if (isGlobalProcessing) {
      console.warn("⚠️ AI: Request blocked - Server busy. Returning fallback.");
      return res.json({
          success: true,
          suggestion: "Plastic",
          confidence: 0,
          message: "System busy. Using default category.",
      });
  }

  isGlobalProcessing = true;

  try {
    const { image } = req.body; // base64 image (with or without data URL)

    // 1️⃣ Validate input
    if (!image || typeof image !== "string") {
      console.error("❌ AI: Invalid or missing image data");
      return res.status(400).json({
        success: false,
        message: "Invalid or missing image data",
      });
    }

    // 2️⃣ Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("🔍 AI: API Key present:", !!apiKey);

    if (!apiKey) {
      console.warn("⚠️ AI: GEMINI_API_KEY missing, returning fallback value");
      return res.json({
        success: true,
        suggestion: "Plastic",
        confidence: 0,
        message: "Fallback response (API key not configured)",
      });
    }

    // 3️⃣ Extract MIME type safely
    const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    // 4️⃣ Extract base64 data safely
    let base64Data = image;
    if (image.includes(",")) {
      base64Data = image.split(",")[1];
    }

    if (!base64Data || base64Data.length < 100) {
      console.error("❌ AI: Base64 data too small or corrupted");
      return res.status(400).json({
        success: false,
        message: "Corrupted or invalid image data",
      });
    }

    console.log(
      "🧪 AI: MIME TYPE:",
      mimeType,
      "| SIZE:",
      Math.round(base64Data.length / 1024),
      "KB"
    );

    // 5️⃣ Initialize Gemini safely
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", 
    });

    // 6️⃣ Prepare image input for Gemini
    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ];

    // 7️⃣ Strict prompt (prevents hallucinations)
    const prompt = `
Identify the primary type of waste in this image.
Choose ONLY ONE from these exact categories:
Plastic, Paper, Metal, Glass, Organic, E-Waste, Clothes.
Return ONLY the category name.
`;

    console.log("🤖 AI: Calling Gemini API...");

    // 8️⃣ Call Gemini
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = result.response.text().trim();

    console.log("✅ AI: Raw Gemini response:", response);

    // 9️⃣ Validate & normalize response
    const categories = [
      "Plastic",
      "Paper",
      "Metal",
      "Glass",
      "Organic",
      "E-Waste",
      "Clothes",
    ];

    const suggestion =
      categories.find((c) =>
        response.toLowerCase().includes(c.toLowerCase())
      ) || "Plastic";

    // 🔟 Final response
    return res.json({
      success: true,
      suggestion,
      confidence: 0.95,
    });
  } catch (error) {
    if (error.response) {
       console.warn("⚠️ AI Service Warning:", await error.response.text());
    } else {
       console.warn("⚠️ AI Service Warning:", error.message);
    }

    // GRACEFUL FALLBACK: Never crash the user flow
    console.warn("⚠️ AI Failed or Rate/Quota Limited. Returning Safe Fallback.");
    return res.json({
        success: true,
        suggestion: "Plastic", // Safe default
        confidence: 0,
        message: "AI unavailable. Defaulting to Plastic.",
    });

  } finally {
      isGlobalProcessing = false;
  }
};
