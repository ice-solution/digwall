require('dotenv').config();
const { connectDB } = require('./config/db');
const User = require('./models/User');

async function seed() {
  await connectDB();

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const existing = await User.findOne({ username });
  if (existing) {
    console.log(`Admin user "${username}" already exists`);
  } else {
    await User.create({ username, password, role: 'admin' });
    console.log(`Admin user "${username}" created`);
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
