const knex = require('../config/db');

const PostModel = {
  async create(data) {
    return await knex('posts').insert(data).returning('*');
  },

  async getAll() {
    return await knex('posts').select('*').orderBy('created_at', 'desc');
  },

  async getById(id) {
    return await knex('posts').where({ id }).first();
  },

  async update(id, data) {
    return await knex('posts').where({ id }).update(data).returning('*');
  },

  async delete(id) {
    return await knex('posts').where({ id }).del();
  }
};

module.exports = PostModel;
