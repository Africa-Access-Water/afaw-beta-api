// Donor.js
const knex = require('../config/db');

class Donor {
  static async findByEmail(email) {
    return knex('donors').where({ email }).first();
  }

  static async findById(id) {
    return knex('donors').where({ id }).first();
  }

  static async create(data) {
    const [id] = await knex('donors').insert(data);
    return id;
  }

  static async updateStripeCustomerId(id, stripeCustomerId) {
    await knex('donors')
      .where({ id })
      .update({ stripe_customer_id: stripeCustomerId });
  }
}

module.exports = Donor;
