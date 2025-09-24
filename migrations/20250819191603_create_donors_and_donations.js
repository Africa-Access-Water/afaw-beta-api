// migrations/20250819_create_donors_and_donations.js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
/**
 * Knex migration: create donors and donations tables
 */

exports.up = async function (knex) {
  // Donors table
  await knex.schema.createTable('donors', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email').notNullable().unique();
    table.timestamps(true, true); // created_at, updated_at
  });

  // Donations table
  await knex.schema.createTable('donations', (table) => {
    table.increments('id').primary();
    table.integer('donor_id').unsigned().notNullable()
      .references('id').inTable('donors')
      .onDelete('CASCADE');
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency').defaultTo('usd');
    table.string('status').defaultTo('initiated'); // pending, completed, active, etc.
    table.string('interval'); // day, week, month, year (for recurring)
    table.string('stripe_checkout_session_id');
    table.string('stripe_subscription_id');
    table.string('stripe_payment_intent');
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('donations');
  await knex.schema.dropTableIfExists('donors');
};
