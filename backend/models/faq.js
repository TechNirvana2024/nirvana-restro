"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class faq extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {}
  }
  faq.init(
    {
      question: DataTypes.STRING,
      answer: DataTypes.STRING,
      pathName: DataTypes.STRING,
      pathLink: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "faq",
    },
  );
  return faq;
};
