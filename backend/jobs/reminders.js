const db = require('../db');

async function sendReminders() {
  const [tontines] = await db.execute('SELECT * FROM tontines');
  const now = new Date();

  for (const tontine of tontines) {
    const createdAt = new Date(tontine.created_at);
    let nextDate;
    if (tontine.frequency === 'monthly') {
      nextDate = new Date(createdAt);
      nextDate.setMonth(createdAt.getMonth() + Math.floor((now - createdAt) / (30*24*60*60*1000)));
      nextDate.setDate(createdAt.getDate());
    } else if (tontine.frequency === 'weekly') {
      nextDate = new Date(createdAt);
      nextDate.setDate(createdAt.getDate() + 7 * Math.floor((now - createdAt) / (7*24*60*60*1000)));
    } else if (tontine.frequency === 'daily') {
      nextDate = new Date(createdAt);
      nextDate.setDate(createdAt.getDate() + Math.floor((now - createdAt) / (24*60*60*1000)));
    }
    // Si on est à 3 jours de l'échéance
    if (nextDate && (nextDate - now < 3*24*60*60*1000) && (nextDate - now > 0)) {
      // Récupère les membres
      const [members] = await db.execute(
        'SELECT user_id FROM tontine_members WHERE tontine_id = ?',
        [tontine.id]
      );
      const dateMysql = now.toISOString().slice(0, 19).replace('T', ' ');
      for (const member of members) {
        await db.execute(
          `INSERT INTO notifications (user_id, type, title, message, date, \`read\`, tontine_id)
           VALUES (?, 'rappel', 'Rappel de paiement', 'Votre paiement arrive à échéance.', ?, 0, ?)`,
          [member.user_id, dateMysql, tontine.id]
        );
      }
    }
  }
}

sendReminders().then(() => {
  console.log('Rappels envoyés');
  process.exit();
});