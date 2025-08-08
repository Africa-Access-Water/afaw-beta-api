/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('teams', (table) => {
    table.increments('id').primary();
    table.string('type').notNullable(); // Member, Volunteer, etc.
    table.string('full_name').notNullable();
    table.string('title');
    table.string('socials'); // can store JSON or comma-separated string
    table.string('position');
    table.string('image_url');
    table.text('bio');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('teams');
};
