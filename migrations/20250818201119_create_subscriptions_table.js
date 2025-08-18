/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('subscriptions', (table) => {
    table.increments('id').primary();
    table.integer('donor_id').unsigned().references('id').inTable('donors').onDelete('CASCADE');
    table.string('stripe_subscription_id').notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 10).defaultTo('usd');
    table.string('interval').notNullable(); // month, year
    table.string('status').defaultTo('active'); // active, canceled, past_due
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('subscriptions');
};

