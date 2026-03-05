const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/etudiant', require('./routes/etudiant'));
app.use('/api/jury', require('./routes/jury'));
app.use('/api/admin', require('./routes/admin'));

app.use('/api/documents', require('./routes/documents'));

app.get('/', (req, res) => res.json({ message: 'GradFlow API v1.0' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Erreur interne' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ GradFlow API running on port ${PORT}`));
