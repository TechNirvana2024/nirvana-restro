const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.productCategoryModel, {
        foreignKey: "productCategoryId",
        as: "product_category",
      });

      Product.hasMany(models.productMediaModel, {
        foreignKey: "productId",
        as: "mediaArr",
      });
      Product.hasMany(models.orderItemModel, {
        foreignKey: "productId",
        as: "orderItems",
      });
    }
  }

  Product.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      productCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      alias: {
        type: DataTypes.JSON,
      },
      description: {
        type: DataTypes.TEXT,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      stockStatus: {
        type: DataTypes.ENUM("in_stock", "out_of_stock", "low_stock"), // ✅ New column for better stock tracking
        defaultValue: "in_stock",
      },
      reservedQuantity: {
        type: DataTypes.INTEGER, // ✅ Helps track pending reservations
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      timestamps: true,
      sequelize,
      modelName: "Product",
      tableName: "products",
    },
  );

  return Product;
};
