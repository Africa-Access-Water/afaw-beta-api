/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.hasTable("users").then((exists) => {
    if (!exists) {
      return knex.schema.createTable("users", (table) => {
        table.increments("id").primary();
        table.string("name").notNullable();
        table.string("email").notNullable().unique();
        table.string("password").notNullable();
        table.string("role").defaultTo("user");
        table.string("avatar_url");
        table.boolean("is_verified").defaultTo(false);
        table.string("reset_token");
        table.timestamp("reset_token_expires");
        table.timestamps(true, true);
      });
    }
  });
};


exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};
