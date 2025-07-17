const express = require('express');
const router = express.Router();
const db = require('../db');

// Liste des caisses pour une tontine
router.get('/', async (req, res) => {
  const { tontineId } = req.query;
  if (!tontineId) return res.json([]);
  const [rows] = await db.execute(
    'SELECT * FROM caisses WHERE tontine_id = ?',
    [tontineId]
  );
  res.json(rows);
});

// Ajouter une caisse à une tontine
router.post('/', async (req, res) => {
  const { tontineId, name } = req.body;
  const [result] = await db.execute(
    'INSERT INTO caisses (tontine_id, name) VALUES (?, ?)',
    [tontineId, name]
  );
  res.json({ id: result.insertId, tontine_id: tontineId, name });
});

module.exports = router;