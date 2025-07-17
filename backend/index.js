const express = require('express');
const cors = require('cors');
const tontinesRoutes = require('./routes/tontines');
const tontineMembersRoutes = require('./routes/tontineMembers');
const invitationsRouter = require('./routes/invitations');
const usersRoutes = require('./routes/users'); // AJOUTE CETTE LIGNE
const notificationsRoutes = require('./routes/notifications'); // déjà présent ?
const authRoutes = require('./routes/auth');
const caissesRouter = require('./routes/caisses');
const paymentsRouter = require('./routes/payments');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/tontines', tontinesRoutes);
app.use('/api/tontine-members', tontineMembersRoutes);
app.use('/api/invitations', invitationsRouter);
app.use('/api/users', usersRoutes); // AJOUTE CETTE LIGNE
app.use('/api/notifications', notificationsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/caisses', caissesRouter);
app.use('/api/payments', paymentsRouter);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});