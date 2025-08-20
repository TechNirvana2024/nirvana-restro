const { Model, DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.customerModel, {
        foreignKey: "customerId",
        as: "customer",
        onDelete: "SET NULL",
      });

      Order.hasMany(models.orderItemModel, {
        foreignKey: "orderId",
        as: "orderItems",
        onDelete: "CASCADE",
      });

      Order.belongsTo(models.tableModel, {
        foreignKey: "tableId",
        as: "table",
        onDelete: "SET NULL",
      });
    }
  }

  Order.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "customers",
          key: "id",
        },
      },

      tableId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      sessionId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      billId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "confirmed",
          "preparing",
          "ready",
          "completed",
          "cancelled",
        ),
        defaultValue: "pending",
      },
      paymentStatus: {
        type: DataTypes.ENUM("pending", "paid", "failed"),
        defaultValue: "pending",
      },
      paymentMethod: {
        type: DataTypes.ENUM("cash", "card", "online"),
        defaultValue: "cash",
      },
      orderType: {
        type: DataTypes.ENUM("dineIn", "takeaway", "delivery"),
        allowNull: false,
      },
      isGuestOrder: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      orderNumber: {
        type: DataTypes.UUID,
        unique: true,
        defaultValue: Sequelize.UUIDV4,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      orderDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      orderNote: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      estimatedTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      customerName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      customerPhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      customerEmail: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      deliveryAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Order",
      tableName: "orders",
      timestamps: true,
      indexes: [
        { fields: ["customerId"] },
        { fields: ["tableId"] },
        { fields: ["sessionId"] },
        { fields: ["billId"] },
        { fields: ["orderNumber"] },
        { fields: ["status"] },
        { fields: ["orderDate"] },
        { fields: ["tableId", "sessionId"] },
        { fields: ["tableId", "billId"] },
      ],
    },
  );

  return Order;
};
