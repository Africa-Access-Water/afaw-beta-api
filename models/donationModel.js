const knex = require('../config/db');
const Project = require('./projectModel');

class Donation {
  static async create(data) {
    const [row] = await knex('donations').insert(data).returning('id');
    const id = typeof row === 'object' ? row.id : row;

    // Update project donation_raised
    // if (data.project_id && data.amount) {
    //   await Project.addDonation(data.project_id, data.amount);
    // }

    return id;
  }

  static async findById(id) {
    return knex('donations').where({ id }).first();
  }

  static async findAll() {
      return knex('donations')
        .leftJoin('projects', 'donations.project_id', 'projects.id')
        .select(
          'donations.*',
          'projects.name as project_name',
          'projects.description as project_description'
        )
        .orderBy('donations.created_at', 'desc');
    }

  static async findByDonorId(donorId) {
    return knex('donations').where({ donor_id: donorId }).orderBy('created_at', 'desc');
  }

  // ✅ New: update by ID
  static async updateById(id, data) {
    await knex('donations').where({ id }).update(data);

    if (data.project_id && data.amount) {
      const total = await knex('donations')
        .where({ project_id: data.project_id })
        .sum('amount as total')
        .first();
      await knex('projects')
        .where({ id: data.project_id })
        .update({ donation_raised: total.total || 0 });
    }

    return this.findById(id);
  }

  // ✅ New: update by Stripe session ID
  static async updateBySessionId(sessionId, data) {
    await knex('donations')
      .where({ stripe_checkout_session_id: sessionId })
      .update(data);
    return knex('donations').where({ stripe_checkout_session_id: sessionId }).first();
  }
}

module.exports = Donation;
