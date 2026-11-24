import bcrypt from 'bcryptjs';
import { pool } from '../src/db/pool';
import { upsertAdmin } from './upsertAdmin';

const BCRYPT_COST = 12;

async function main(): Promise<void> {
  const email = process.argv[2];
  // The password comes from the environment so it never lands in the shell history.
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Usage: ADMIN_PASSWORD=<password> npm run seed:admin -- <email>');
  }

  const hash = await bcrypt.hash(password, BCRYPT_COST);
  const outcome = await upsertAdmin(pool, email, hash);
  console.log(outcome === 'created' ? 'admin created' : 'admin password updated');
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
