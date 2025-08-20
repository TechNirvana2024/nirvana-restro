"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("email_templates", "activeTemplateId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "active_templates",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("email_templates", "activeTemplateId");
  },
};
