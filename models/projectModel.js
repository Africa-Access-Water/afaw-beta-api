const knex = require('../config/db');

class Project {
  static async create(data) {
    const [id] = await knex('projects').insert(data).returning('id');
    return id;
  }

  static async findAll() {
    return knex('projects').orderBy('created_at', 'desc');
  }

  static async findById(id) {
    return knex('projects').where({ id }).first();
  }

  static async update(id, data) {
    await knex('projects').where({ id }).update(data);
    return this.findById(id);
  }

  static async delete(id) {
    return knex('projects').where({ id }).del();
  }

  // New: increment donation_raised
  static async addDonation(id, amount) {
    await knex('projects')
      .where({ id })
      .increment('donation_raised', amount);
    return this.findById(id);
  }

   // ✅ Fetch project + donations
  static async findWithDonations(id) {
    const project = await this.findById(id);
    if (!project) return null;

    const donations = await knex('donations')
      .where({ project_id: id })
      .orderBy('created_at', 'desc');

    return {
      ...project,
      donations,
    };
  }



}

module.exports = Project;
