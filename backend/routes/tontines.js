const express = require('express');
const router = express.Router();
const db = require('../db');

// Liste des tontines pour un utilisateur
router.get('/', async (req, res) => {
  const { userId, adminId } = req.query;
  let query = `
    SELECT t.*, m.role
    FROM tontines t
    JOIN tontine_members m ON t.id = m.tontine_id
    WHERE m.user_id = ?
  `;
  const param = adminId || userId;
  if (adminId) query += " AND m.role = 'admin'";
  const [rows] = await db.execute(query, [param]);

  // Pour chaque tontine, récupère le nombre de membres
  const tontinesWithMembers = await Promise.all(
    rows.map(async (tontine) => {
      const [members] = await db.execute(
        'SELECT COUNT(*) as count FROM tontine_members WHERE tontine_id = ?',
        [tontine.id]
      );
      return { ...tontine, memberCount: members[0].count };
    })
  );

  res.json(tontinesWithMembers);
});

// Créer une tontine
router.post('/', async (req, res) => {
  const { name, description, amount, frequency, duration, penalty, maxMembers, receivers, creatorId } = req.body;
  try {
    console.log('BODY:', req.body);
    const [result] = await db.execute(
      `INSERT INTO tontines (name, description, amount, frequency, duration, penalty, max_members, receivers, creator_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [name, description, amount, frequency, duration, penalty, maxMembers, receivers, creatorId]
    );
    await db.execute(
      'INSERT INTO tontine_members (tontine_id, user_id, role) VALUES (?, ?, ?)',
      [result.insertId, creatorId, 'admin']
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('ERREUR SQL:', err);
    res.status(500).json({ error: 'Erreur lors de la création de la tontine', details: err.message });
  }
});

// Supprimer une tontine
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await db.execute('DELETE FROM tontines WHERE id = ?', [id]);
  await db.execute('DELETE FROM tontine_members WHERE tontine_id = ?', [id]);
  res.sendStatus(204);
});

// Détails d'une tontine
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  // Membres acceptés
  const [tontineRows] = await db.execute('SELECT * FROM tontines WHERE id = ?', [id]);
  const [members] = await db.execute(
    `SELECT m.*, u.name FROM tontine_members m JOIN users u ON m.user_id = u.id WHERE m.tontine_id = ?`,
    [id]
  );
  // Invitations en attente
  const [pendingInvites] = await db.execute(
    `SELECT n.user_id, u.name, 'pending' as role
     FROM notifications n
     JOIN users u ON n.user_id = u.id
     WHERE n.tontine_id = ? AND n.type = 'invitation' AND n.read = 0`,
    [id]
  );
  res.json({
    ...tontineRows[0],
    members: members, // Seulement les membres acceptés
    pendingInvites: pendingInvites // Invitations en attente séparées
  });
});

module.exports = router;