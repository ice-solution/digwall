const express = require('express');
const Message = require('../models/Message');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.use(authRequired);

/**
 * GET /api/admin/messages?status=slot|displaying|completed|all
 */
router.get('/messages', async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status !== 'all') {
      filter.status = status;
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const [messages, total] = await Promise.all([
      Message.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Message.countDocuments(filter),
    ]);

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      messages: messages.map((m) => ({
        id: m._id,
        name: m.name,
        sticker_id: m.sticker_id,
        msg_id: m.msg_id,
        optional_id: m.optional_id,
        status: m.status,
        createdAt: m.createdAt,
        completedAt: m.completedAt,
      })),
    });
  } catch (err) {
    console.error('Admin messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * GET /api/admin/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const [slot, displaying, completed, total] = await Promise.all([
      Message.countDocuments({ status: 'slot' }),
      Message.countDocuments({ status: 'displaying' }),
      Message.countDocuments({ status: 'completed' }),
      Message.countDocuments(),
    ]);

    res.json({ slot, displaying, completed, total });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
