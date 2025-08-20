"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("orders", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      tableId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "tables",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      sessionId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "tables",
          key: "sessionId",
        },
        onDelete: "SET NULL",
      },
      status: {
        type: Sequelize.ENUM(
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
        type: Sequelize.ENUM("pending", "paid", "failed"),
        defaultValue: "pending",
      },
      paymentMethod: {
        type: Sequelize.ENUM("cash", "card", "online"),
        defaultValue: "cash",
      },
      orderType: {
        type: Sequelize.ENUM("dineIn", "takeaway", "delivery"),
        allowNull: false,
      },
      isGuestOrder: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      orderNumber: {
        type: Sequelize.UUID,
        unique: true,
        defaultValue: Sequelize.UUIDV4,
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      orderNote: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      estimatedTime: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      orderStartTime: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      orderFinishTime: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      customerName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      customerPhone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      customerEmail: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      deliveryAddress: {
        type: Sequelize.TEXT,
        allowNull: true,
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

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("orders");
  },
};
