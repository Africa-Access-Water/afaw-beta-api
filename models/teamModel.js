const knex = require('../config/db');

const TeamModel = {
  async create(data) {
    return await knex('teams').insert(data).returning('*');
  },

  async getAll() {
    return await knex('teams').select('*').orderBy('created_at', 'desc');
  },

  async getById(id) {
    return await knex('teams').where({ id }).first();
  },

  async update(id, data) {
    return await knex('teams').where({ id }).update(data).returning('*');
  },

  async delete(id) {
    return await knex('teams').where({ id }).del();
  }
};

module.exports = TeamModel;
