const express = require('express');
const router = express.Router();
const db = require('../db');

// Récupérer les notifications d'un utilisateur
router.get('/', async (req, res) => {
  const { userId } = req.query;
  console.log('userId reçu:', userId); // Pour debug
  const [rows] = await db.execute(
    `SELECT n.*, t.name AS tontine_name
     FROM notifications n
     LEFT JOIN tontines t ON n.tontine_id = t.id
     WHERE n.user_id = ?
     ORDER BY n.date DESC`,
    [userId]
  );
  res.json(rows);
});

// Ajout d'une notification
router.post('/', async (req, res) => {
  const { user_id, type, title, message, date, read, tontine_id } = req.body;
  await db.execute(
    'INSERT INTO notifications (user_id, type, title, message, date, `read`, tontine_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [user_id, type, title, message, date, read, tontine_id]
  );
  res.status(201).json({ success: true });
});

// Suppression d'une notification
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await db.execute('DELETE FROM notifications WHERE id = ?', [id]);
  res.json({ success: true });
});

module.exports = router;