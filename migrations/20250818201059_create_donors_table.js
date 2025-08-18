/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('donors', (table) => {
    table.increments('id').primary();
    table.string('name').nullable();
    table.string('email').notNullable().unique();
    table.string('stripe_customer_id').nullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('donors');
};

