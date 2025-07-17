const express = require('express');
const router = express.Router();
const db = require('../db');

// Créer une invitation
router.post('/', async (req, res) => {
  const { tontineId, email, message, senderId } = req.body;
  try {
    await db.execute(
      'INSERT INTO invitations (tontine_id, email, message, sender_id, status) VALUES (?, ?, ?, ?, ?)',
      [tontineId, email || null, message, senderId, 'pending']
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'envoi de l'invitation" });
  }
});

router.get('/', async (req, res) => {
  const { senderId } = req.query;
  if (!senderId) return res.json([]);
  const [rows] = await db.execute(
    'SELECT * FROM invitations WHERE sender_id = ?',
    [senderId]
  );
  res.json(rows);
});

const handleCreateLinkInvitation = async () => {
  await fetch('http://localhost:3000/api/invitations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tontineId: invitationTontineId,
      email: '', // ou null
      message: inviteMessage,
      senderId: user.id,
    }),
  });
  // Refresh invitations
  fetch(`http://localhost:3000/api/invitations?senderId=${user.id}`)
    .then(res => res.json())
    .then(setSentInvitations);
};

module.exports = router;