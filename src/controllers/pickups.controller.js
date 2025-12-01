import prisma from '../services/db.service.js';

// Create a new pickup (Staff only)
export const createPickup = async (req, res) => {
  try {
    const { category, weight, latitude, longitude, imageUrl } = req.body;
    const staffId = req.user.id;

    // Basic validation
    if (!category || !weight || !latitude || !longitude) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Calculate CO2 saved (Example logic: 1kg waste = 0.5kg CO2 saved)
    const co2Saved = weight * 0.5;

    const pickup = await prisma.pickup.create({
      data: {
        staffId,
        category,
        weight: parseFloat(weight),
        co2Saved,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        imageUrl,
        status: "PENDING"
      }
    });

    res.status(201).json({ message: "Pickup created successfully", pickup });
  } catch (error) {
    console.error("Create pickup error:", error);
    res.status(500).json({ message: "Server error creating pickup" });
  }
};

// Get my pickups (Staff only)
export const getMyPickups = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Validate sortBy field
    const validSortFields = ['createdAt', 'weight', 'category', 'status'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    
    const pickups = await prisma.pickup.findMany({
      where: { staffId },
      orderBy: { [sortField]: order }
    });
    
    res.json(pickups);
  } catch (error) {
    console.error("Get my pickups error:", error);
    res.status(500).json({ message: "Server error fetching pickups" });
  }
};

// Get all pickups (Supervisor/Admin) with filters and pagination
export const getAllPickups = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, staffId, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (staffId) where.staffId = parseInt(staffId);
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [pickups, total] = await prisma.$transaction([
      prisma.pickup.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: { staff: { select: { name: true, email: true } } }
      }),
      prisma.pickup.count({ where })
    ]);

    res.json({
      pickups,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get all pickups error:", error);
    res.status(500).json({ message: "Server error fetching pickups" });
  }
};

// Approve or Reject pickup (Supervisor/Admin)
export const updatePickupStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Use APPROVED, REJECTED, or PENDING." });
    }

    // Check if pickup exists
    const existingPickup = await prisma.pickup.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingPickup) {
      return res.status(404).json({ message: "Pickup not found" });
    }

    const pickup = await prisma.pickup.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    res.json({ message: `Pickup ${status.toLowerCase()}`, pickup });
  } catch (error) {
    console.error("Update pickup status error:", error);
    
    // Handle Prisma errors
    if (error.code === 'P2025') {
      return res.status(404).json({ message: "Pickup not found" });
    }
    
    res.status(500).json({ message: "Server error updating pickup" });
  }
};

// Update pickup (Staff only, only if PENDING)
export const updatePickup = async (req, res) => {
  try {
    const { id } = req.params;
    const staffId = req.user.id;
    const { category, weight, latitude, longitude, imageUrl } = req.body;

    const pickup = await prisma.pickup.findUnique({ where: { id: parseInt(id) } });

    if (!pickup) {
      return res.status(404).json({ message: "Pickup not found" });
    }

    if (pickup.staffId !== staffId) {
      return res.status(403).json({ message: "Unauthorized to update this pickup" });
    }

    if (pickup.status !== "PENDING") {
      return res.status(400).json({ message: "Cannot update processed pickup" });
    }

    // Prepare update data
    const updateData = {};
    if (category) updateData.category = category;
    if (weight) {
      updateData.weight = parseFloat(weight);
      updateData.co2Saved = parseFloat(weight) * 0.5; // Recalculate CO2
    }
    if (latitude) updateData.latitude = parseFloat(latitude);
    if (longitude) updateData.longitude = parseFloat(longitude);
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl; // Allow null

    const updatedPickup = await prisma.pickup.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({ message: "Pickup updated successfully", pickup: updatedPickup });
  } catch (error) {
    console.error("Update pickup error:", error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ message: "Pickup not found" });
    }
    
    res.status(500).json({ message: "Server error updating pickup" });
  }
};

// Delete pickup (Staff only, only if PENDING)
export const deletePickup = async (req, res) => {
  try {
    const { id } = req.params;
    const staffId = req.user.id;

    const pickup = await prisma.pickup.findUnique({ where: { id: parseInt(id) } });

    if (!pickup) {
      return res.status(404).json({ message: "Pickup not found" });
    }

    if (pickup.staffId !== staffId) {
      return res.status(403).json({ message: "Unauthorized to delete this pickup" });
    }

    if (pickup.status !== "PENDING") {
      return res.status(400).json({ message: "Cannot delete processed pickup" });
    }

    await prisma.pickup.delete({ where: { id: parseInt(id) } });

    res.json({ message: "Pickup deleted successfully" });
  } catch (error) {
    console.error("Delete pickup error:", error);
    res.status(500).json({ message: "Server error deleting pickup" });
  }
};

