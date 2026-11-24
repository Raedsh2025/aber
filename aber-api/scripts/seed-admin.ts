import bcrypt from 'bcryptjs';
import { pool } from '../src/db/pool';

const BCRYPT_COST = 12;

async function main(): Promise<void> {
  const email = process.argv[2];
  // The password comes from the environment so it never lands in the shell history.
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Usage: ADMIN_PASSWORD=<password> npm run seed:admin -- <email>');
  }

  const hash = await bcrypt.hash(password, BCRYPT_COST);
  await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ('System Administrator', $1, $2, 'system_admin') 
     ON CONFLICT DO NOTHING`,
    [email, hash],
  );
  console.log('admin ready');
  await pool.end();
}

void main();
