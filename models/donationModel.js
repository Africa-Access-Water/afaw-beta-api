const knex = require('../config/db');

class Donation {
  static async create(data) {
    const [id] = await knex('donations').insert(data).returning('id');
    return id;
  }

  static async findByDonorId(donorId) {
    return knex('donations').where({ donor_id: donorId }).orderBy('created_at', 'desc');
  }
  static async findAll() {
    return knex('donations').orderBy('created_at', 'desc');
  }
  
  static async findById(id) {
    return knex('donations').where({ id }).first();
  }

  static async update(id, data) {
    await knex('donations').where({ id }).update(data);
    return this.findById(id);
  }

}

module.exports = Donation;
