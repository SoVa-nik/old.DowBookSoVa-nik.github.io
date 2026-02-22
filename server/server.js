const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'users.json');
const PORT = 3000;

let users = [];
if (fs.existsSync(DATA_FILE)) {
  try {
    users = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    console.error('Failed to load user database', err);
  }
}

function saveUsers() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

function ensureAdmin() {
  const hasAdmin = users.some(u => u.isAdmin);
  if (!hasAdmin) {
    const passwordHash = bcrypt.hashSync('admin', 10);
    users.push({ username: 'admin', passwordHash, isAdmin: true });
    saveUsers();
    console.log('Created default admin user with username "admin" and password "admin"');
  }
}

ensureAdmin();

const app = express();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..')));

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Missing username or password' });
  }
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  users.push({ username, passwordHash, isAdmin: false });
  saveUsers();
  res.json({ success: true });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  res.json({ success: true, isAdmin: user.isAdmin });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
