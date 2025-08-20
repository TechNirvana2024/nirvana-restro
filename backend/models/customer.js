"use strict";
const { Model } = require("sequelize");
const { GENDER } = require("../constants/value-constants");
module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    static associate(models) {
      Customer.hasMany(models.orderModel, {
        foreignKey: "customerId",
        as: "orders",
      });
      Customer.hasMany(models.cartModel, {
        foreignKey: "userId",
        as: "carts",
      });
      // define association here
    }
  }
  Customer.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      firstName: {
        type: DataTypes.STRING,
      },
      lastName: {
        type: DataTypes.STRING,
      },
      username: {
        type: DataTypes.STRING,
        unique: false,
        allowNull: true, // Randomly generated for guests
      },
      email: {
        type: DataTypes.STRING,
      },
      guest_email: {
        type: DataTypes.STRING,
        allowNull: true, // For guests, non-unique
      },
      password: {
        type: DataTypes.STRING,
      },
      imageUrl: {
        type: DataTypes.STRING,
      },
      gender: {
        type: DataTypes.ENUM(...GENDER),
        allowNull: true,
      },
      isGuest: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, // True for guests
      },
      addressPrimary: {
        type: DataTypes.STRING,
      },
      addressSecondary: {
        type: DataTypes.STRING,
      },
      loyaltyPoints: {
        type: DataTypes.STRING,
      },
      city: {
        type: DataTypes.STRING,
      },
      pinCode: {
        type: DataTypes.STRING,
      },
      isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      mobileNo: {
        type: DataTypes.STRING,
      },
      mobilePrefix: {
        type: DataTypes.STRING,
      },
      otpSecret: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetTokenExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      googleId: {
        type: DataTypes.STRING,
        unique: true, // Google ID should be unique
        allowNull: true, // Only populated for OAuth users
      },
      facebookId: {
        type: DataTypes.STRING,
        unique: true, // Facebook ID should be unique
        allowNull: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Customer",
      tableName: "customers",
    },
  );
  return Customer;
};

//customer guest user details
// after customer create put on user model
//
