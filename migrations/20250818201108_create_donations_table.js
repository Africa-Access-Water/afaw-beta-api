/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('donations', (table) => {
    table.increments('id').primary();
    table.integer('donor_id').unsigned().references('id').inTable('donors').onDelete('CASCADE');
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 10).defaultTo('usd');
    table.string('stripe_payment_intent_id').nullable();
    table.string('status').defaultTo('pending'); // pending, succeeded, failed
    table.integer('subscription_id').unsigned().nullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('donations');
};

