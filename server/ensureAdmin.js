const User = require('./models/User');

/**
 * Ensure admin from .env exists and password matches ADMIN_PASSWORD.
 * Seed previously only created once — changing .env would not update DB.
 */
async function ensureAdmin() {
  const username = (process.env.ADMIN_USERNAME || 'admin').trim();
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  if (!username || !password) {
    console.warn('ADMIN_USERNAME / ADMIN_PASSWORD missing in .env — skip ensureAdmin');
    return;
  }

  let user = await User.findOne({ username });
  if (!user) {
    await User.create({ username, password, role: 'admin' });
    console.log(`Admin user "${username}" created from .env`);
    return;
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    user.password = password;
    await user.save();
    console.log(`Admin user "${username}" password synced from .env`);
  } else {
    console.log(`Admin user "${username}" ready`);
  }
}

module.exports = { ensureAdmin };
