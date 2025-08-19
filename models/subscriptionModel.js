const knex = require('../config/db');

class Subscription {
  static async create(data) {
    const [id] = await knex('subscriptions').insert(data).returning('id');
    return id;
  }

  static async findById(id) {
    return knex('subscriptions').where({ id }).first();
  }

  static async updateStatus(id, status) {
    await knex('subscriptions')
      .where({ id })
      .update({ status });
  }
}

module.exports = Subscription;
