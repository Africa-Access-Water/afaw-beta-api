/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Step 0: Make all existing roles valid
  await knex('users')
    .whereNotIn('role', ['admin', 'manager', 'contributor'])
    .update({ role: 'contributor' });

  // Step 1: Drop the default (so ALTER TYPE can succeed)
  await knex.raw('ALTER TABLE users ALTER COLUMN role DROP DEFAULT');

  // Step 2: Create enum type
  await knex.raw("CREATE TYPE user_role AS ENUM ('admin', 'manager', 'contributor')");

  // Step 3: Alter column to enum type
  await knex.raw('ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::user_role');

  // Step 4: Set new default
  await knex.raw("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'contributor'");
};


/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Revert back to string
  await knex.raw('ALTER TABLE users ALTER COLUMN role TYPE text USING role::text');

  // Set previous default
  await knex.raw("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'");

  // Drop enum type
  await knex.raw('DROP TYPE IF EXISTS user_role');
};
