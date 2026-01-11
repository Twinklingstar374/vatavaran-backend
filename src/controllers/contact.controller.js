import prisma from "../services/db.service.js";

export const createContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newMessage = await prisma.contactMessage.create({
      data: { name, email, subject, message },
    });

    res.status(201).json({ message: "Message sent successfully", data: newMessage });
  } catch (error) {
    console.error("createContactMessage error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllContactMessages = async (req, res) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(messages);
  } catch (error) {
    console.error("getAllContactMessages error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
