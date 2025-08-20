const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class CartItem extends Model {
    static associate(models) {
      CartItem.belongsTo(models.cartModel, {
        foreignKey: "cartId",
        as: "cart",
        onDelete: "CASCADE",
      });
      CartItem.belongsTo(models.productModel, {
        foreignKey: "productId",
        as: "product",
      });
    }
  }

  CartItem.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      cartId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
    },
    {
      timestamps: true,
      sequelize,
      modelName: "CartItem",
      tableName: "cart_items",
    },
  );

  return CartItem;
};
