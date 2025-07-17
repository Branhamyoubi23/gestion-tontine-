const express = require('express');
const router = express.Router();
const db = require('../db');

// Recherche d'utilisateurs par nom (autocomplete)
router.get('/', async (req, res) => {
  const { search } = req.query;
  if (!search) return res.json([]);
  const [rows] = await db.execute(
    'SELECT id, name FROM users WHERE name LIKE ? LIMIT 10',
    [`%${search}%`]
  );
  res.json(rows);
});

module.exports = router;