"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("product_categories", "imageUrlSecondary", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("product_categories", "description", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      "product_categories",
      "imageUrlSecondary",
    );
    await queryInterface.removeColumn("product_categories", "description");
  },
};
