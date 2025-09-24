/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('projects', (table) => {
    table.string('category').nullable();
    table.string('cover_image').nullable();
    table.json('media').nullable(); // store images/videos as JSON array
    table.decimal('donation_goal', 14, 2).defaultTo(0);
    table.decimal('donation_raised', 14, 2).defaultTo(0);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('projects', (table) => {
    table.dropColumn('category');
    table.dropColumn('cover_image');
    table.dropColumn('media');
    table.dropColumn('donation_goal');
    table.dropColumn('donation_raised');
  });
};
