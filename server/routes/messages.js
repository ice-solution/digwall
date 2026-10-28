const express = require('express');
const Message = require('../models/Message');
const { broadcast } = require('../websocket');

const router = express.Router();

/**
 * POST /api/messages/slot
 * Guest submit → create message in slot → push to display clients via WS
 */
router.post('/slot', async (req, res) => {
  try {
    const { name, sticker_id, msg_id, optional_id } = req.body;

    if (!name || !sticker_id || !msg_id) {
      return res.status(400).json({
        error: 'name, sticker_id, and msg_id are required',
      });
    }

    const message = await Message.create({
      name,
      sticker_id,
      msg_id,
      optional_id: optional_id || '',
      status: 'slot',
    });

    // Immediately mark as displaying and push to clients
    message.status = 'displaying';
    await message.save();

    const payload = {
      type: 'new_message',
      data: {
        id: message._id,
        name: message.name,
        sticker_id: message.sticker_id,
        msg_id: message.msg_id,
        optional_id: message.optional_id,
        status: message.status,
        createdAt: message.createdAt,
      },
    };

    broadcast(payload);

    res.status(201).json({
      success: true,
      message: payload.data,
    });
  } catch (err) {
    console.error('Slot error:', err);
    res.status(500).json({ error: 'Failed to create message slot' });
  }
});

/**
 * POST /api/messages/completed
 * Display client marks a message as completed after display finishes
 */
router.post('/completed', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.status === 'completed') {
      return res.status(400).json({ error: 'Message already completed' });
    }

    message.status = 'completed';
    message.completedAt = new Date();
    await message.save();

    broadcast({
      type: 'message_completed',
      data: {
        id: message._id,
        name: message.name,
        sticker_id: message.sticker_id,
        msg_id: message.msg_id,
        optional_id: message.optional_id,
        status: message.status,
        completedAt: message.completedAt,
      },
    });

    res.json({
      success: true,
      message: {
        id: message._id,
        status: message.status,
        completedAt: message.completedAt,
      },
    });
  } catch (err) {
    console.error('Completed error:', err);
    res.status(500).json({ error: 'Failed to complete message' });
  }
});

/**
 * GET /api/messages/slot
 * List messages currently in slot / displaying (for display client bootstrap)
 */
router.get('/slot', async (req, res) => {
  try {
    const messages = await Message.find({
      status: { $in: ['slot', 'displaying'] },
    }).sort({ createdAt: 1 });

    res.json({
      messages: messages.map((m) => ({
        id: m._id,
        name: m.name,
        sticker_id: m.sticker_id,
        msg_id: m.msg_id,
        optional_id: m.optional_id,
        status: m.status,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    console.error('Get slot error:', err);
    res.status(500).json({ error: 'Failed to fetch slot messages' });
  }
});

module.exports = router;
