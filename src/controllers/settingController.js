const Setting = require('../models/settingModel');
const { successResponse, errorResponse } = require('../utils/responseHelper');

exports.getTimeSlots = async (req, res) => {
  try {
    const slots = await Setting.get('time_slots');
    return successResponse(res, slots || ["09:00-12:00", "12:00-15:00", "15:00-18:00", "18:00-21:00", "21:00-00:00"]);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

exports.updateTimeSlots = async (req, res) => {
  try {
    const { slots } = req.body;
    
    if (!Array.isArray(slots) || slots.length === 0) {
      return errorResponse(res, 'Time slots must be a non-empty array', 400);
    }

    // Basic format validation (HH:mm-HH:mm)
    const isValid = slots.every(s => typeof s === 'string' && /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(s));
    if (!isValid) {
      return errorResponse(res, 'Invalid time slot format. Use HH:mm-HH:mm', 400);
    }

    const updatedSlots = await Setting.update('time_slots', slots);
    return successResponse(res, updatedSlots, 200, 'Time slots updated successfully');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};
