exports.up = function (knex) {
  return knex.schema.table("projects", function (table) {
    table.string("pdf_document").nullable().after("media");
  });
};

exports.down = function (knex) {
  return knex.schema.table("projects", function (table) {
    table.dropColumn("pdf_document");
  });
};
