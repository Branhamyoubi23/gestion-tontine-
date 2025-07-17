const express = require('express');
const router = express.Router();
const db = require('../db');

// Inscription
router.post('/register', async (req, res) => {
  const { name, email, phone, password, language, invite } = req.body;
  try {
    if (email) {
      const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(400).json({ error: "Cet email est déjà utilisé." });
      }
    }
    // Création de l'utilisateur
    const [result] = await db.execute(
      'INSERT INTO users (name, email, phone, password, language) VALUES (?, ?, ?, ?, ?)',
      [name, email || null, phone, password, language]
    );
    const userId = result.insertId;

    // Ajout via lien d'invitation (invite = tontine_id)
    if (invite) {
      await db.execute(
        'INSERT IGNORE INTO tontine_members (tontine_id, user_id, role) VALUES (?, ?, ?)',
        [invite, userId, 'member']
      );
    }

    // Ajout via invitation email (optionnel)
    if (email) {
      const [invitations] = await db.execute(
        'SELECT * FROM invitations WHERE email = ? AND status = "pending"',
        [email]
      );
      for (const invitation of invitations) {
        await db.execute(
          'INSERT IGNORE INTO tontine_members (tontine_id, user_id, role) VALUES (?, ?, ?)',
          [invitation.tontine_id, userId, 'member']
        );
        await db.execute(
          'UPDATE invitations SET status = "accepted", acceptedDate = NOW() WHERE id = ?',
          [invitation.id]
        );
      }
    }

    res.status(201).json({ id: userId, name, email, phone, language });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'inscription" });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  try {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE phone = ? AND password = ?',
      [phone, password]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    const user = rows[0];
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      language: user.language
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

module.exports = router;