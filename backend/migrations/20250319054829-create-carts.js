"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("carts", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "customers", // Assuming a `users` table exists
          key: "id",
        },
        onDelete: "CASCADE",
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true, // Required field, default set in application
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
        // Note: ON UPDATE CURRENT_TIMESTAMP not directly supported here; managed in app
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("carts");
  },
};
