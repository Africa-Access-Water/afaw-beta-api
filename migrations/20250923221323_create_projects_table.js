/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('projects', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description');
    table.timestamps(true, true); // created_at & updated_at
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('projects');
};
