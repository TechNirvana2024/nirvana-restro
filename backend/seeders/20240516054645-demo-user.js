"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("users", [
      {
        username: "superadmin",
        password:
          "$2a$12$ecaL3fmZFsQmCzj.v73LDe3STxMyhBk0EJWOX2mNcf224hgj5mROe",
        firstName: "Super",
        lastName: "admin",
        email: "superadmin@technirvana.com.np",
        roleId: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: "admin",
        password:
          "$2a$12$ecaL3fmZFsQmCzj.v73LDe3STxMyhBk0EJWOX2mNcf224hgj5mROe",
        firstName: "Admin",
        lastName: "User",
        email: "admin@technirvana.com.np",
        roleId: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Users", null, {});
  },
};
