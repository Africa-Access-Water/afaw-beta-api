const knex = require('../config/db');

class Subscription {
  static async create(data) {
    const [id] = await knex('subscriptions').insert(data).returning('id');
    return id;
  }

  static async findByDonor(donorId) {
    return knex('subscriptions').where({ donor_id: donorId });
  }

  static async updateStripeSubscriptionId(sessionId, subscriptionId, status) {
  await knex('subscriptions')
    .where({ stripe_checkout_session_id: sessionId })
    .update({ stripe_subscription_id: subscriptionId, status });
}


}

module.exports = Subscription;
