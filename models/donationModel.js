const knex = require('../config/db');

class Donation {
  static async create(data) {
    const [id] = await knex('donations').insert(data).returning('id');
    return id;
  }

  static async findByDonor(donorId) {
    return knex('donations').where({ donor_id: donorId }).orderBy('created_at', 'desc');
  }
}

module.exports = Donation;
