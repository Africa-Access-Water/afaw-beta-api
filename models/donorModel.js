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
    let id;
    // Use .returning('id') for Postgres; for SQLite it will just return the inserted id
    if (knex.client.config.client === 'pg') {
      [id] = await knex('donors').insert(data).returning('id');
    } else {
      id = await knex('donors').insert(data);
    }

    return { id, ...data };
  }

  static async updateStripeCustomerId(id, stripeCustomerId) {
    await knex('donors')
      .where({ id })
      .update({ stripe_customer_id: stripeCustomerId });
  }
}

module.exports = Donor;
