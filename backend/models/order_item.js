const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class OrderItem extends Model {
    static associate(models) {
      OrderItem.belongsTo(models.orderModel, {
        foreignKey: "orderId",
        as: "order",
        onDelete: "CASCADE",
      });

      OrderItem.belongsTo(models.productModel, {
        foreignKey: "productId",
        as: "product",
        onDelete: "SET NULL",
      });

      OrderItem.belongsTo(models.departmentModel, {
        foreignKey: "departmentId",
        as: "department",
        onDelete: "SET NULL",
      });
    }
  }

  OrderItem.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      departmentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      //make department required
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 1 },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      discount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      specialInstructions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("pending", "preparing", "ready", "served","cancelled"),
        defaultValue: "pending",
      },
    },
    {
      timestamps: true,
      sequelize,
      modelName: "OrderItem",
      tableName: "order_items",
      indexes: [{ fields: ["orderId", "productId"] }],
    },
  );

  return OrderItem;
};
