// controllers/pickups.controller.js
import prisma from "../services/db.service.js";
import cloudinary from "../services/cloudinary.service.js";
import { calculateRewardPoints, updateStaffRewards } from "../services/reward.service.js";

/* ----------------------
   Helpers
   ---------------------- */
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "vatavaran" },
      (err, result) => err ? reject(err) : resolve(result)
    ).end(buffer);
  });
};

const CO2_FACTOR = {
  PLASTIC: 1.7,
  DRY: 0.5,
  GREEN: 0.3,
  OTHER: 0.2
};

const parseIntSafe = (v, fallback = null) => {
  const n = parseInt(v);
  return Number.isNaN(n) ? fallback : n;
};

const parseFloatSafe = (v, fallback = null) => {
  const n = parseFloat(v);
  return Number.isNaN(n) ? fallback : n;
};

/* ==========================================================
   1) CREATE PICKUP (STAFF)
   Accepts form-data with optional file (req.file.buffer)
   Fields: category, weight, latitude, longitude, optionally image
========================================================== */
export const createPickup = async (req, res) => {
  try {
    const staffId = req.user && req.user.id;
    if (!staffId) return res.status(401).json({ message: "Unauthorized" });

    let { category, weight, latitude, longitude } = req.body;

    if (!category || !weight || !latitude || !longitude) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // upload image if present (req.file.buffer expected from multer)
    let imageUrl = req.body.imageUrl || null; // Accept imageUrl from body
    if (req.file && req.file.buffer) {
      try {
        const upload = await uploadToCloudinary(req.file.buffer);
        imageUrl = upload.secure_url;
      } catch (err) {
        console.error("Cloudinary upload failed:", err);
        // continue - image is optional; but inform client
        return res.status(500).json({ message: "Image upload failed" });
      }
    }

    const numericWeight = parseFloatSafe(weight);
    if (numericWeight === null) return res.status(400).json({ message: "Invalid weight" });

    const co2Factor = CO2_FACTOR[(category || "").toUpperCase()] ?? CO2_FACTOR.OTHER;
    const co2Saved = numericWeight * co2Factor;

    const pickup = await prisma.pickup.create({
      data: {
        staffId,
        category,
        weight: numericWeight,
        co2Saved,
        latitude: parseFloatSafe(latitude),
        longitude: parseFloatSafe(longitude),
        imageUrl,
        status: "PENDING"
      }
    });

    return res.status(201).json({ message: "Pickup created", pickup });
  } catch (error) {
    console.error("createPickup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ==========================================================
   2) GET MY PICKUPS (STAFF)
   Supports: page, limit, sortBy, order (or sortOrder), optional category filter
========================================================== */
export const getMyPickups = async (req, res) => {
  try {
    const staffId = req.user && req.user.id;
    if (!staffId) return res.status(401).json({ message: "Unauthorized" });

    const page = parseIntSafe(req.query.page, 1) || 1;
    const limit = parseIntSafe(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const sortBy = req.query.sortBy || "createdAt";
    const order = (req.query.order || req.query.sortOrder || "desc").toLowerCase() === "asc" ? "asc" : "desc";

    const where = { staffId };

    if (req.query.category) where.category = { equals: req.query.category };
    if (req.query.status) where.status = req.query.status;

    const [items, total] = await Promise.all([
      prisma.pickup.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
      }),
      prisma.pickup.count({ where })
    ]);

    return res.json(items);

  } catch (error) {
    console.error("getMyPickups error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ==========================================================
   3) GET ALL PICKUPS (Supervisor/Admin)
   Supports: page, limit, status, staffId, startDate, endDate, category, sortBy, order, search
========================================================== */
export const getAllPickups = async (req, res) => {
  try {
    // role check should already be done in middleware (authorizeRoles)
    const page = parseIntSafe(req.query.page, 1) || 1;
    const limit = parseIntSafe(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const sortBy = req.query.sortBy || "createdAt";
    const order = (req.query.order || req.query.sortOrder || "desc").toLowerCase() === "asc" ? "asc" : "desc";

    const where = {};

    if (req.query.status) where.status = req.query.status;
    if (req.query.staffId) {
      const sId = parseIntSafe(req.query.staffId);
      if (sId !== null) where.staffId = sId;
    }
    if (req.query.category) where.category = req.query.category;
    if (req.query.search) {
      // simple search on category or notes if you have notes field; adjust as needed
      where.OR = [
        { category: { contains: req.query.search, mode: "insensitive" } },
      ];
    }
    if (req.query.startDate && req.query.endDate) {
      const start = new Date(req.query.startDate);
      const end = new Date(req.query.endDate);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        where.createdAt = { gte: start, lte: end };
      }
    }

    const [pickups, total] = await prisma.$transaction([
      prisma.pickup.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: { staff: { select: { id: true, name: true, email: true } } }
      }),
      prisma.pickup.count({ where })
    ]);

    return res.json({
      pickups,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("getAllPickups error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ==========================================================
   4) UPDATE PICKUP STATUS (Supervisor/Admin)
   Body: { status: "APPROVED" | "REJECTED" | "PENDING" }
   
   REWARD SYSTEM LOGIC:
   - When a pickup is APPROVED, staff member earns reward points
   - Points are calculated based on waste category and weight
   - NO points are given for PENDING or REJECTED pickups
   - This ensures rewards are only for verified, quality collections
========================================================== */
export const updatePickupStatus = async (req, res) => {
  try {
    const id = parseIntSafe(req.params.id);
    if (id === null) return res.status(400).json({ message: "Invalid pickup id" });

    const { status } = req.body;
    if (!status || !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Use APPROVED, REJECTED or PENDING" });
    }

    const existing = await prisma.pickup.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Pickup not found" });

    // Update the pickup status
    const updated = await prisma.pickup.update({
      where: { id },
      data: { status }
    });

    // ✅ REWARD SYSTEM: Grant points ONLY on approval
    if (status === "APPROVED") {
      try {
        // Calculate reward points based on category and weight
        const rewardPoints = calculateRewardPoints(updated);
        
        // Award points to the staff member
        await updateStaffRewards(updated.staffId, rewardPoints);
        
        console.log(`✅ Pickup #${id} approved. Staff #${updated.staffId} earned ${rewardPoints} points!`);
      } catch (rewardError) {
        // Log error but don't fail the approval - rewards are secondary to the core workflow
        console.error("Failed to update rewards:", rewardError);
        // Continue - the pickup is still approved even if rewards fail
      }
    }

    return res.json({ message: `Pickup ${status.toLowerCase()}`, pickup: updated });
  } catch (error) {
    console.error("updatePickupStatus error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ==========================================================
   5) UPDATE OWN PICKUP (STAFF) - only when status=PENDING
   Accepts body fields to update (category, weight, latitude, longitude, image replacement)
   If req.file present, upload and replace imageUrl.
========================================================== */
export const updatePickup = async (req, res) => {
  try {
    const id = parseIntSafe(req.params.id);
    if (id === null) return res.status(400).json({ message: "Invalid pickup id" });

    const staffId = req.user && req.user.id;
    if (!staffId) return res.status(401).json({ message: "Unauthorized" });

    const existing = await prisma.pickup.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Pickup not found" });
    if (existing.staffId !== staffId) return res.status(403).json({ message: "Forbidden" });
    if (!["PENDING", "REJECTED"].includes(existing.status)) {
      return res.status(400).json({ message: "Only pending or rejected pickups can be edited" });
    }

    const updateData = {};
    const { category, weight, latitude, longitude } = req.body;

    if (category) updateData.category = category;
    if (weight !== undefined) {
      const f = parseFloatSafe(weight);
      if (f === null) return res.status(400).json({ message: "Invalid weight" });
      updateData.weight = f;
      updateData.co2Saved = f * (CO2_FACTOR[(category || existing.category).toUpperCase()] ?? CO2_FACTOR.OTHER);
    }
    if (latitude !== undefined) updateData.latitude = parseFloatSafe(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloatSafe(longitude);

    // If it was rejected, reset to pending for re-review
    if (existing.status === "REJECTED") {
      updateData.status = "PENDING";
    }

    // If a new image file is uploaded, replace imageUrl
    if (req.file && req.file.buffer) {
      try {
        const upload = await uploadToCloudinary(req.file.buffer);
        updateData.imageUrl = upload.secure_url;
      } catch (err) {
        console.error("Cloudinary upload in update failed:", err);
        return res.status(500).json({ message: "Image upload failed" });
      }
    } else if (req.body.imageUrl) {
        // If client uploaded image and sent URL
        updateData.imageUrl = req.body.imageUrl;
    }

    const updated = await prisma.pickup.update({
      where: { id },
      data: updateData
    });

    return res.json({ message: "Pickup updated", pickup: updated });
  } catch (error) {
    console.error("updatePickup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ==========================================================
   6) DELETE PICKUP (STAFF) - only when status=PENDING
========================================================== */
export const deletePickup = async (req, res) => {
  try {
    const id = parseIntSafe(req.params.id);
    if (id === null) return res.status(400).json({ message: "Invalid pickup id" });

    const staffId = req.user && req.user.id;
    if (!staffId) return res.status(401).json({ message: "Unauthorized" });

    const existing = await prisma.pickup.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Pickup not found" });
    if (existing.staffId !== staffId) return res.status(403).json({ message: "Forbidden" });
    if (!["PENDING", "REJECTED"].includes(existing.status)) {
      return res.status(400).json({ message: "Only pending or rejected pickups can be deleted" });
    }

    await prisma.pickup.delete({ where: { id } });
    return res.json({ message: "Pickup deleted successfully" });
  } catch (error) {
    console.error("deletePickup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getPickupById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const staffId = req.user.id;

    const pickup = await prisma.pickup.findUnique({ where: { id } });

    if (!pickup) {
      return res.status(404).json({ message: "Pickup not found" });
    }

    // Staff can only access their own pickups
    if (pickup.staffId !== staffId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(pickup);
  } catch (error) {
    console.error("Get pickup by ID error:", error);
    return res.status(500).json({ message: "Failed to load pickup" });
  }
};

