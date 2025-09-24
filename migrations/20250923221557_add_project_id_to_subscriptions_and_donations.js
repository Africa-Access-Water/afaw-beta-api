/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('subscriptions', (table) => {
    table.integer('project_id').unsigned().nullable()
      .references('id').inTable('projects')
      .onDelete('SET NULL');
  });

  await knex.schema.alterTable('donations', (table) => {
    table.integer('project_id').unsigned().nullable()
      .references('id').inTable('projects')
      .onDelete('SET NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('subscriptions', (table) => {
    table.dropColumn('project_id');
  });

  await knex.schema.alterTable('donations', (table) => {
    table.dropColumn('project_id');
  });
};
