module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.removeColumn("email_templates", "information"),
      queryInterface.removeColumn("email_templates", "from"),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.addColumn("email_templates", "information", {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn("email_templates", "from", {
        type: Sequelize.STRING,
        allowNull: false,
      }),
    ]);
  },
};
