/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('donors', (table) => {
    table.string('stripe_customer_id').nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('donors', (table) => {
    table.dropColumn('stripe_customer_id');
  });
};

