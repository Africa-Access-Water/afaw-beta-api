const knex = require('../config/db');

class Donor {

  static async findAll() {
    return knex('donors').orderBy('created_at', 'desc');
  }

  static async findByEmail(email) {
    return knex('donors').where({ email }).first();
  }

  static async findById(id) {
    return knex('donors').where({ id }).first();
  }

  static async create(data) {
    // Use .returning('id') for Postgres; for SQLite it will just return the inserted id
    if (knex.client.config.client === 'pg') {
      const [result] = await knex('donors').insert(data).returning('id');
      return result.id;
    } else {
      return await knex('donors').insert(data);
    }
  }

  static async updateStripeCustomerId(id, stripeCustomerId) {
    await knex('donors')
      .where({ id })
      .update({ stripe_customer_id: stripeCustomerId });
  }
}

module.exports = Donor;
