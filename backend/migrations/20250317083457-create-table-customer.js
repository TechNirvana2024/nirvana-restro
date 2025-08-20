"use strict";
const { GENDER } = require("../constants/value-constants");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("customers", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      firstName: {
        type: Sequelize.STRING,
      },
      lastName: {
        type: Sequelize.STRING,
      },
      username: {
        type: Sequelize.STRING,
        unique: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      guest_email: {
        type: Sequelize.STRING,
        allowNull: true, // For guests, non-unique
      },
      password: {
        type: Sequelize.STRING,
      },
      imageUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      gender: {
        type: Sequelize.ENUM(...GENDER),
      },
      isGuest: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      addressPrimary: {
        type: Sequelize.STRING,
      },
      addressSecondary: {
        type: Sequelize.STRING,
      },
      city: {
        type: Sequelize.STRING,
      },
      pinCode: {
        type: Sequelize.STRING,
      },
      isEmailVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      mobileNo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      mobilePrefix: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      otpSecret: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      resetToken: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      resetTokenExpiry: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      googleId: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true, // Only populated for OAuth users
      },
      facebookId: {
        type: Sequelize.STRING,
        unique: true, // Facebook ID should be unique
        allowNull: true,
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("customers");
  },
};
