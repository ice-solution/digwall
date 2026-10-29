require('dotenv').config();
const { connectDB } = require('./config/db');
const { ensureAdmin } = require('./ensureAdmin');

async function seed() {
  await connectDB();
  await ensureAdmin();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
