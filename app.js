const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { sequelize } = require('./server/models');
const authRoutes = require('./server/routes/auth');
const taskRoutes = require('./server/routes/tasks');
const userRoutes = require('./server/routes/users');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Server working');
});

const PORT = process.env.PORT || 8000;
async function start() {
  try {
    await sequelize.sync();
    app.listen(PORT, () => {
      console.log(`app started on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start app', err);
    process.exit(1);
  }
}

start();
