"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("orders", "isLoyaltyIssued", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    await queryInterface.addColumn("orders", "deliveryType", {
      type: Sequelize.ENUM("selfPick", "delivery"),
      allowNull: false,
      defaultValue: "delivery",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("orders", "isLoyaltyIssued");

    await queryInterface.removeColumn("orders", "deliveryType");
  },
};
