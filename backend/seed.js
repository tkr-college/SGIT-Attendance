// Creates the initial employee accounts if they don't already exist.
// Safe to run every startup — it skips any account that's already there.
// Can also still be run standalone: node seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Employee = require('./models/Employee');

const PASSWORD = 'sgit@123';

const USERS = [
  { name: 'Shiva', email: 'shiva@smartgrowinfotech.com', role: 'admin' },
  { name: 'Madhava Kukkala', email: 'madhavakukkala@smartgrowinfotech.com', role: 'employee' },
  { name: 'Pasam Balaji', email: 'pasambalaji@smartgrowinfotech.com', role: 'employee' },
  { name: 'Pedagaru Kumar', email: 'pedagarukumar@smartgrowinfotech.com', role: 'employee' },
  { name: 'Vaishnavi', email: 'vaishnavi@smartgrowinfotech.com', role: 'employee' },
  { name: 'Vinay', email: 'vinay@smartgrowinfotech.com', role: 'employee' },
  { name: 'Keerthi Naidu', email: 'keerthinaidu@smartgrowinfotech.com', role: 'employee' },
  { name: 'Harshitha', email: 'Harshitha@smartgrowinfotech.com', role: 'employee' },
  { name: 'Baji', email: 'Baji@smartgrowinfotech.com', role: 'employee' },
];

async function run() {
  for (const u of USERS) {
    const email = u.email.toLowerCase();
    const existing = await Employee.findOne({ email });
    if (existing) {
      console.log(`[seed] SKIP (already exists): ${email}`);
      continue;
    }
    const hashed = await bcrypt.hash(PASSWORD, 10);
    const employeeCode = 'EMP-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    await Employee.create({ name: u.name, email, password: hashed, role: u.role, employeeCode });
    console.log(`[seed] CREATED (${u.role}): ${email}`);
  }
  console.log('[seed] Done.');
}

module.exports = { run };

// Allow standalone use too: node seed.js (connects/disconnects on its own in that case)
if (require.main === module) {
  require('dotenv').config();
  mongoose
    .connect(process.env.MONGO_URI)
    .then(run)
    .then(() => mongoose.disconnect())
    .then(() => process.exit(0))
    .catch((e) => {
      console.error('[seed] Failed:', e.message);
      process.exit(1);
    });
}
