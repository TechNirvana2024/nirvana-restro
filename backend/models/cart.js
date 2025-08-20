const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Cart extends Model {
    static associate(models) {
      Cart.belongsTo(models.customerModel, {
        foreignKey: "userId",
        as: "user",
      });
      Cart.hasMany(models.cartItemModel, {
        foreignKey: "cartId",
        as: "items",
        onDelete: "CASCADE",
      });
    }
  }

  Cart.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      //it is the customer
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        // defaultValue: () => new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    },
    {
      timestamps: true,
      sequelize,
      modelName: "Cart",
      tableName: "carts",
    },
  );

  return Cart;
};
