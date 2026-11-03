const express = require('express');
const ExcelJS = require('exceljs');
const Message = require('../models/Message');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.use(authRequired);

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toISOString();
}

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
 * GET /api/admin/export.xlsx
 * Export ALL messages to an Excel file
 */
router.get('/export.xlsx', async (req, res) => {
  try {
    const messages = await Message.find({}).sort({ createdAt: -1 }).lean();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Digital Wall';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Messages', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = [
      { header: 'ID', key: 'id', width: 28 },
      { header: 'Name', key: 'name', width: 24 },
      { header: 'Sticker ID', key: 'sticker_id', width: 14 },
      { header: 'Msg ID', key: 'msg_id', width: 12 },
      { header: 'Optional ID (Agent Code)', key: 'optional_id', width: 22 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Submitted At', key: 'createdAt', width: 28 },
      { header: 'Completed At', key: 'completedAt', width: 28 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle' };

    messages.forEach((m) => {
      sheet.addRow({
        id: String(m._id),
        name: m.name,
        sticker_id: m.sticker_id,
        msg_id: m.msg_id,
        optional_id: m.optional_id || '',
        status: m.status,
        createdAt: fmtDate(m.createdAt),
        completedAt: fmtDate(m.completedAt),
      });
    });

    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const filename = `digital-wall-messages-${stamp}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Admin export error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to export xlsx' });
    }
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
