const knex = require("../config/db");

const UserModel = {
  async create(userData) {
    return await knex("users").insert(userData).returning("*");
  },

  async findByEmail(email) {
    return await knex("users").where({ email }).first();
  },

  async findById(id) {
    return await knex("users").where({ id }).first();
  }
};

module.exports = UserModel;
