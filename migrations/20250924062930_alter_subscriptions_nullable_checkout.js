exports.up = function(knex) {
  return knex.schema.alterTable('subscriptions', (table) => {
    table.string('stripe_checkout_session_id').nullable().alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('subscriptions', (table) => {
    table.string('stripe_checkout_session_id').notNullable().alter();
  });
};
