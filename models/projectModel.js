const knex = require('../config/db');

class Project {
  static async create(data) {
    if (data.media && Array.isArray(data.media)) {
      data.media = JSON.stringify(data.media);
    }
    const [id] = await knex('projects').insert(data).returning('id');
    return id;
  }

  static async findAll() {
    const projects = await knex('projects').orderBy('created_at', 'desc');
    return projects.map(this._parseProject);
  }

  static async findById(id) {
    const project = await knex('projects').where({ id }).first();
    return project ? this._parseProject(project) : null;
  }

  static async update(id, data) {
    if (data.media && Array.isArray(data.media)) {
      data.media = JSON.stringify(data.media);
    }
    await knex('projects').where({ id }).update(data);
    return this.findById(id); // auto-parsed on return
  }

  static async delete(id) {
    return knex('projects').where({ id }).del();
  }

  static async addDonation(id, amount) {
    await knex('projects')
      .where({ id })
      .increment('donation_raised', amount);
    return this.findById(id);
  }

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

  // Helper to parse JSON fields consistently
  static _parseProject(project) {
    if (project.media && typeof project.media === 'string') {
      try {
        project.media = JSON.parse(project.media);
      } catch {
        project.media = [];
      }
    }
    return project;
  }
}

module.exports = Project;
