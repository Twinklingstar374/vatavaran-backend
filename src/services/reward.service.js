// services/reward.service.js
// Reward calculation service for VātāvaranTrack
// Rewards are ONLY granted after supervisor approval of pickups

import prisma from "./db.service.js";

/**
 * Reward Points Calculation
 * 
 * Rewards are based on waste category and weight collected.
 * Higher impact categories earn more points per kg.
 * 
 * IMPORTANT: Rewards are ONLY applied when a pickup is APPROVED by a supervisor.
 * Staff do NOT earn points for pending or rejected pickups.
 */

// Points per kg for each waste category
const REWARD_RATES = {
  PLASTIC: 10,   // High reward - plastic recycling has major environmental impact
  EWASTE: 15,    // Highest reward - e-waste requires specialized handling
  METAL: 8,      // Good reward - metals are highly recyclable
  GLASS: 6,      // Moderate reward - glass is recyclable but heavy
  PAPER: 5,      // Standard reward - common recyclable
  ORGANIC: 4,    // Lower reward - composting is simpler
  DRY: 3,        // Base reward - mixed dry waste
  OTHER: 2       // Minimal reward - uncategorized waste
};

/**
 * Calculate reward points for a pickup
 * @param {Object} pickup - Pickup object with category and weight
 * @returns {number} - Calculated reward points (rounded to nearest integer)
 */
export const calculateRewardPoints = (pickup) => {
  if (!pickup || !pickup.category || !pickup.weight) {
    console.warn("Invalid pickup data for reward calculation:", pickup);
    return 0;
  }

  // Get the reward rate for this category (case-insensitive)
  const category = pickup.category.toUpperCase();
  const ratePerKg = REWARD_RATES[category] || REWARD_RATES.OTHER;

  // Calculate: points = weight * rate per kg
  const points = pickup.weight * ratePerKg;

  // Round to nearest integer
  return Math.round(points);
};

/**
 * Update staff reward points after pickup approval
 * This should ONLY be called when a supervisor approves a pickup
 * 
 * @param {number} staffId - ID of the staff member
 * @param {number} pointsToAdd - Points to add to staff's total
 * @returns {Promise<Object>} - Updated staff record
 */
export const updateStaffRewards = async (staffId, pointsToAdd) => {
  try {
    // Validate inputs
    if (!staffId || typeof staffId !== 'number') {
      throw new Error(`Invalid staffId: ${staffId}`);
    }

    if (typeof pointsToAdd !== 'number' || pointsToAdd < 0) {
      throw new Error(`Invalid points amount: ${pointsToAdd}`);
    }

    // Update staff reward points atomically
    const updatedStaff = await prisma.staff.update({
      where: { id: staffId },
      data: {
        rewardPoints: {
          increment: pointsToAdd
        }
      },
      select: {
        id: true,
        name: true,
        rewardPoints: true
      }
    });

    console.log(`✅ Rewarded ${pointsToAdd} points to staff ${updatedStaff.name} (ID: ${staffId}). New total: ${updatedStaff.rewardPoints}`);

    return updatedStaff;
  } catch (error) {
    console.error("Error updating staff rewards:", error);
    throw error;
  }
};

/**
 * Get staff reward points
 * @param {number} staffId - ID of the staff member
 * @returns {Promise<number>} - Current reward points
 */
export const getStaffRewards = async (staffId) => {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { rewardPoints: true }
    });

    return staff?.rewardPoints || 0;
  } catch (error) {
    console.error("Error fetching staff rewards:", error);
    return 0;
  }
};
