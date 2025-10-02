const knex = require('../config/db');

class Subscription {
 static async create(data) {
    const [row] = await knex('subscriptions').insert(data).returning('id');
    const id = typeof row === 'object' ? row.id : row;
    return id;
  }


  static async findById(id) {
    return knex('subscriptions').where({ id }).first();
  }

  static async findAll() {
    return knex('subscriptions')
      .leftJoin('projects', 'subscriptions.project_id', 'projects.id')
      .select(
        'subscriptions.*',
        'projects.name as project_name',
        'projects.description as project_description'
      )
      .orderBy('subscriptions.created_at', 'desc');
  }

  // ✅ New: update by ID
  static async updateById(id, data) {
    await knex('subscriptions').where({ id }).update(data);
    return this.findById(id);
  }

  // ✅ New: update by Stripe session ID
  static async updateBySessionId(sessionId, data) {
    await knex('subscriptions')
      .where({ stripe_checkout_session_id: sessionId })
      .update(data);
    return knex('subscriptions')
      .where({ stripe_checkout_session_id: sessionId })
      .first();
  }

  // ✅ New: find by Stripe subscription ID
  static async findByStripeId(stripeSubscriptionId) {
    return knex('subscriptions')
      .leftJoin('donors', 'subscriptions.donor_id', 'donors.id')
      .select(
        'subscriptions.*',
        'donors.email as donor_email',
        'donors.name as donor_name'
      )
      .where({ 'subscriptions.stripe_subscription_id': stripeSubscriptionId })
      .first();
  }

  static async delete(id) {
    return knex('subscriptions').where({ id }).del();
  }
}

module.exports = Subscription;
