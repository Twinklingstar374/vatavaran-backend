import prisma from "../services/db.service.js";

export const createImprovementSuggestion = async (req, res) => {
  try {
    const { name, email, category, priority, suggestion } = req.body;

    if (!name || !email || !category || !priority || !suggestion) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newSuggestion = await prisma.improvementSuggestion.create({
      data: { name, email, category, priority, suggestion },
    });

    res.status(201).json({ message: "Suggestion submitted successfully", data: newSuggestion });
  } catch (error) {
    console.error("createImprovementSuggestion error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllImprovementSuggestions = async (req, res) => {
  try {
    const suggestions = await prisma.improvementSuggestion.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(suggestions);
  } catch (error) {
    console.error("getAllImprovementSuggestions error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
