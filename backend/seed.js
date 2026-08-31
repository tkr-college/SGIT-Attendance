// One-time script to create employee accounts directly in the database.
// Run this from Railway's Console tab on the backend service: node seed.js
require('dotenv').config();
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
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  for (const u of USERS) {
    const email = u.email.toLowerCase();
    const existing = await Employee.findOne({ email });
    if (existing) {
      console.log(`SKIP (already exists): ${email}`);
      continue;
    }
    const hashed = await bcrypt.hash(PASSWORD, 10);
    const employeeCode = 'EMP-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    await Employee.create({
      name: u.name,
      email,
      password: hashed,
      role: u.role,
      employeeCode,
    });
    console.log(`CREATED (${u.role}): ${email}`);
  }

  console.log('Done. You can now log in with any of the emails above and password: ' + PASSWORD);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error('Seed failed:', e.message);
  process.exit(1);
});
