const express = require('express');
const router = express.Router();
const db = require('../db');

// Ajouter un membre
router.post('/', async (req, res) => {
  const { tontineId, userId, role } = req.body;
  await db.execute(
    'INSERT INTO tontine_members (tontine_id, user_id, role) VALUES (?, ?, ?)',
    [tontineId, userId, role || 'member']
  );
  res.sendStatus(201);
});

// Lister les membres d'une tontine
router.get('/:tontineId', async (req, res) => {
  const { tontineId } = req.params;
  const [rows] = await db.execute(
    'SELECT * FROM tontine_members WHERE tontine_id = ?',
    [tontineId]
  );
  res.json(rows);
});

module.exports = router;