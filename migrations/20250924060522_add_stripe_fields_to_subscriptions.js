exports.up = async function(knex) {
  await knex.schema.alterTable('subscriptions', table => {
    table.string('stripe_checkout_session_id').nullable();
    table.string('stripe_subscription_id').nullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('subscriptions', table => {
    table.dropColumn('stripe_checkout_session_id');
    table.dropColumn('stripe_subscription_id');
  });
};
