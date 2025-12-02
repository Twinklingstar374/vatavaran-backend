// import prisma from "../services/db.service.js";
// import cloudinary from "../services/cloudinary.service.js";

// // Upload buffer to Cloudinary
// const uploadToCloudinary = (buffer) => {
//   return new Promise((resolve, reject) => {
//     cloudinary.uploader.upload_stream(
//       { folder: "vatavaran" },
//       (err, result) => err ? reject(err) : resolve(result)
//     ).end(buffer);
//   });
// };

// // CO2 factors.
// const CO2_FACTOR = {
//   PLASTIC: 1.7,
//   DRY: 0.5,
//   GREEN: 0.3,
//   OTHER: 0.2
// };

// /* ==========================================================
//    1️⃣ CREATE PICKUP (STAFF)
// ========================================================== */
// export const createPickup = async (req, res) => {
//   try {
//     const staffId = req.user.id;
//     let { category, weight, latitude, longitude } = req.body;

//     if (!category || !weight || !latitude || !longitude)
//       return res.status(400).json({ message: "Missing fields" });

//     let imageUrl = null;
//     if (req.file && req.file.buffer) {
//       const upload = await uploadToCloudinary(req.file.buffer);
//       imageUrl = upload.secure_url;
//     }

//     const numericWeight = parseFloat(weight);
//     const co2Saved = numericWeight * (CO2_FACTOR[category] || 0.3);

//     const pickup = await prisma.pickup.create({
//       data: {
//         staffId,
//         category,
//         weight: numericWeight,
//         co2Saved,
//         latitude: parseFloat(latitude),
//         longitude: parseFloat(longitude),
//         imageUrl,
//         status: "PENDING"
//       }
//     });

//     return res.status(201).json({ message: "Pickup created", pickup });

//   } catch (error) {
//     console.error("createPickup error:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

// /* ==========================================================
//    2️⃣ GET MY PICKUPS (STAFF)
//    /api/pickups/my?page=1&limit=10&sortBy=createdAt&order=desc
// ========================================================== */
// export const getMyPickups = async (req, res) => {
//   try {
//     const staffId = req.user.id;

//     const page = parseInt(req.query.page || "1");
//     const limit = parseInt(req.query.limit || "5");
//     const skip = (page - 1) * limit;

//     const sortBy = req.query.sortBy || "createdAt";
//     const order = req.query.order === "asc" ? "asc" : "desc";

//     const [items, total] = await Promise.all([
//       prisma.pickup.findMany({
//         where: { staffId },
//         skip,
//         take: limit,
//         orderBy: { [sortBy]: order }
//       }),
//       prisma.pickup.count({ where: { staffId } })
//     ]);

//     return res.json({
//       pickups: items,
//       pagination: {
//         total,
//         page,
//         limit,
//         pages: Math.ceil(total / limit)
//       }
//     });

//   } catch (error) {
//     return res.status(500).json({ message: "Internal error" });
//   }
// };

// /* ==========================================================
//    3️⃣ UPDATE OWN PICKUP (ONLY IF PENDING)
// ========================================================== */
// export const updatePickup = async (req, res) => {
//   try {
//     const id = parseInt(req.params.id);
//     const staffId = req.user.id;

//     const existing = await prisma.pickup.findUnique({ where: { id } });

//     if (!existing) return res.status(404).json({ message: "Pickup not found" });
//     if (existing.staffId !== staffId)
//       return res.status(403).json({ message: "Forbidden" });
//     if (existing.status !== "PENDING")
//       return res.status(400).json({ message: "Only pending pickups can be edited" });

//     const updated = await prisma.pickup.update({
//       where: { id },
//       data: req.body
//     });

//     return res.json({ message: "Pickup updated", pickup: updated });

//   } catch (error) {
//     return res.status(500).json({ message: "Internal" });
//   }
// };

// /* ==========================================================
//    4️⃣ DELETE PICKUP (ONLY IF PENDING)
// ========================================================== */
// export const deletePickup = async (req, res) => {
//   try {
//     const id = parseInt(req.params.id);
//     const staffId = req.user.id;

//     const existing = await prisma.pickup.findUnique({ where: { id } });

//     if (!existing) return res.status(404).json({ message: "Not found" });
//     if (existing.staffId !== staffId)
//       return res.status(403).json({ message: "Forbidden" });
//     if (existing.status !== "PENDING")
//       return res.status(400).json({ message: "Only pending pickups can be deleted" });

//     await prisma.pickup.delete({ where: { id } });

//     return res.json({ message: "Deleted successfully" });

//   } catch (error) {
//     return res.status(500).json({ message: "Internal error" });
//   }
// };

