const express = require('express');
const router = express.Router();
const db = require('../db');

// Liste des paiements d'une tontine
router.get('/', async (req, res) => {
  const { tontineId } = req.query;
  if (!tontineId) return res.json([]);
  const [rows] = await db.execute(
    'SELECT p.*, c.name as caisse_name FROM payments p LEFT JOIN caisses c ON p.caisse_id = c.id WHERE p.tontine_id = ?',
    [tontineId]
  );
  res.json(rows);
});

// Paiements à valider pour l'admin
router.get('/admin', async (req, res) => {
  const { adminId } = req.query;
  if (!adminId) return res.json([]);
  // Récupère les tontines où l'user est admin
  const [tontines] = await db.execute(
    "SELECT tontine_id FROM tontine_members WHERE user_id = ? AND role = 'admin'",
    [adminId]
  );
  if (tontines.length === 0) return res.json([]);
  const tontineIds = tontines.map(t => t.tontine_id);
  const [rows] = await db.execute(
    `SELECT p.*, 
            c.name as caisse_name, 
            t.name as tontine_name,
            u.name as user_name, 
            u.email as user_email
      FROM payments p
      LEFT JOIN caisses c ON p.caisse_id = c.id
      LEFT JOIN tontines t ON p.tontine_id = t.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.tontine_id IN (${tontineIds.map(() => '?').join(',')}) AND p.status = 'pending'`,
    tontineIds
  );
  res.json(rows);
});

// Création d'un paiement
router.post('/', async (req, res) => {
  const { userId, tontineId, caisseId, amount } = req.body;
  await db.execute(
    'INSERT INTO payments (user_id, tontine_id, caisse_id, amount, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
    [userId, tontineId, caisseId, amount, 'pending']
  );
  res.status(201).json({ success: true });
});

router.patch('/:id/validate', async (req, res) => {
  const { id } = req.params;
  await db.execute(
    "UPDATE payments SET status = 'validated' WHERE id = ?",
    [id]
  );
  res.json({ success: true });
});

router.patch('/:id/decline', async (req, res) => {
  const { id } = req.params;
  await db.execute(
    "UPDATE payments SET status = 'refused' WHERE id = ?",
    [id]
  );
  res.json({ success: true });
});

module.exports = router;
