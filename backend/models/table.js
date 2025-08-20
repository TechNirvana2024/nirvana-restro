const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Table extends Model {
    static associate(models) {
      Table.belongsTo(models.floorModel, {
        foreignKey: "floorId",
        as: "floor",
        onDelete: "CASCADE",
      });

      Table.hasMany(models.orderModel, {
        foreignKey: "tableId",
        as: "orders",
        onDelete: "SET NULL",
      });
    }
  }

  Table.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      floorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      sessionId:{
        type: DataTypes.UUID,
        allowNull: true,
      },
      tableNo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM("indoor", "outdoor", "vip", "regular"),
        allowNull: false,
        defaultValue: "regular",
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 4,
        validate: { min: 1 },
      },
      status: {
        type: DataTypes.ENUM(
          "available",
          "occupied",
          "reserved",
          "maintenance",
        ),
        allowNull: false,
        defaultValue: "available",
      },
      currentSessionId: {
        type: DataTypes.UUID,
        allowNull: true, 
      },
      sessionStartTime: {
        type: DataTypes.DATE,
        allowNull: true, 
      },
    },
    {
      timestamps: true,
      sequelize,
      modelName: "Table",
      tableName: "tables",
      indexes: [
        { fields: ["floorId"] },
        { fields: ["status"] },
        { fields: ["currentSessionId"] },
        { fields: ["tableNo", "floorId"], unique: true },
      ],
    },
  );

  return Table;
};
