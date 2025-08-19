/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('subscriptions', (table) => {
    table.increments('id').primary();
    table.integer('donor_id').unsigned().notNullable()
         .references('id').inTable('donors').onDelete('CASCADE');
    table.string('stripe_checkout_session_id').notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 10).notNullable();
    table.string('interval', 10).notNullable();
    table.string('status', 20).notNullable();
    table.timestamps(true, true); // created_at & updated_at
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('subscriptions');
};
