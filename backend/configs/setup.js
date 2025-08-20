const router = require("express").Router();
const {
  userModel,
  roleModel,
  roleMenuModel,
  roleMenuActionModel,
  roleActionModel,
  settingModel,
  mediaCategoryModel,
  bannerModel,
  bannerItemsModel,
} = require("../models/index");
const setupData = require("./setup.json");
const { getQueryResponse } = require("../helpers/response-helper");
const internal = {};

internal.saveRoles = async (req, rolesArray) => {
  try {
    for (const role of rolesArray) {
      let checkRole = await roleModel.findOne({
        where: { title: role.title },
        raw: true,
      });
      if (!checkRole) {
        await roleModel.create({
          title: role.title,
          roleType: role.roleType,
        });
      }
    }
  } catch (err) {
    throw err;
  }
};
internal.saveUsers = async (req, usersArray) => {
  try {
    let superAdmin = await roleModel.findOne({
      where: { title: "Super Admin" },
      raw: true,
    });
    let admin = await roleModel.findOne({
      where: { title: "Admin" },
      raw: true,
    });
    for (let user of usersArray) {
      if (user.username == "superadmin") {
        user.roleId = superAdmin.id;
      }
      if (user.username == "admin") {
        user.roleId = admin.id;
      }
      let checkUser = await userModel.findOne({
        where: { email: user.email },
        raw: true,
      });
      if (!checkUser) {
        await userModel.create({
          username: user.username,
          password: user.password,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          roleId: user.roleId,
          gender: user.gender,
          mobileNo: user.mobileNo,
          mobilePrefix: user.mobilePrefix,
        });
      }
    }
  } catch (err) {
    throw err;
  }
};
internal.saveRoleMenuActions = async (
  req,
  roleMenuId,
  roleMenuTitle,
  roleMenuActionArray,
) => {
  try {
    for (const roleMenuAction of roleMenuActionArray) {
      let checkRoleMenuAction = await roleMenuActionModel.findOne({
        where: { roleMenuId, key: roleMenuAction.key },
        raw: true,
      });
      if (!(checkRoleMenuAction && checkRoleMenuAction.id)) {
        if (
          (roleMenuAction.requestMethod && !roleMenuAction.serverPath) ||
          (!roleMenuAction.requestMethod && roleMenuAction.serverPath)
        ) {
          throw `Issue With Server Path, Both Server Path and Request Method are required in pair or not, -----Role Menu: ${roleMenuTitle}-----Key: ${roleMenuAction.key}-----`;
        }
        await roleMenuActionModel.create({
          roleMenuId,
          title: roleMenuAction.title,
          key: roleMenuAction.key,
          clientPath: roleMenuAction.clientPath,
          list: roleMenuAction.list,
          serverPath: roleMenuAction.serverPath,
          requestMethod: roleMenuAction.requestMethod,
        });
      }
    }
  } catch (err) {
    throw err;
  }
};
internal.saveAllAccessToSuperAdmin = async (req) => {
  try {
    let superAdmin = await userModel.findOne({
      where: { username: "superadmin" },
      raw: true,
    });
    let allRoleMenuAction = await roleMenuActionModel.findAll({
      isDeleted: false,
    });
    let insertData = allRoleMenuAction.map((x) => ({
      roleId: superAdmin.roleId,
      roleMenuActionId: x.id,
    }));
    await roleActionModel.destroy({ where: { roleId: superAdmin.roleId } });
    await roleActionModel.bulkCreate(insertData);
  } catch (err) {
    throw err;
  }
};
internal.saveRoleMenu = async (req, roleMenuArray) => {
  try {
    for (const roleMenu of roleMenuArray) {
      let checkRoleMenu = await roleMenuModel.findOne({
        where: { key: roleMenu.key },
        raw: true,
      });
      if (!(checkRoleMenu && checkRoleMenu.id)) {
        checkRoleMenu = await roleMenuModel.create({
          title: roleMenu.title,
          key: roleMenu.key,
        });
      }
      await internal.saveRoleMenuActions(
        req,
        checkRoleMenu.id,
        checkRoleMenu.title,
        roleMenu.actions,
      );
    }
    await internal.saveAllAccessToSuperAdmin(req);
  } catch (err) {
    throw err;
  }
};
internal.saveSettings = async (setting) => {
  try {
    const isCreated = await settingModel.findOne({
      where: { id: setting.id },
      raw: true,
    });
    if (!isCreated) {
      await settingModel.create(setting);
    }
  } catch (err) {
    throw err;
  }
};
// internal.saveRTEMediaCategory = async (mediaCategory) => {
//   try {
//     const isCreated = await mediaCategoryModel.findOne({
//       where: { id: mediaCategory.id },
//       raw: true,
//     });
//     if (!isCreated) {
//       await mediaCategoryModel.create(mediaCategory);
//     }
//   } catch (err) {
//     throw err;
//   }
// };

internal.saveBannerItems = async (req, bannerItems) => {
  try {
    for (const bannerItem of bannerItems) {
      let checkBannerItem = await bannerItemsModel.findOne({
        where: { id: bannerItem.id },
        raw: true,
      });
      if (!checkBannerItem) {
        await bannerItemsModel.create({
          id: bannerItem.id,
          bannerId: bannerItem.bannerId,
          image: bannerItem.image,
          caption: bannerItem.caption,
          title: bannerItem.title,
          subTitle: bannerItem.subTitle,
          primaryButton: bannerItem.primaryButton,
          primaryButtonUrl: bannerItem.primaryButtonUrl,
          secondaryButton: bannerItem.secondaryButton,
          secondaryButtonUrl: bannerItem.secondaryButtonUrl,
        });
      }
    }
  } catch (err) {
    throw err;
  }
};

internal.saveBanner = async (req, banner) => {
  try {
    for (const bannerData of banner) {
      const isCreated = await bannerModel.findOne({
        where: { id: bannerData.id },
        raw: true,
      });
      if (!isCreated) {
        await bannerModel.create({
          id: bannerData.id,
          name: bannerData.name,
          slug: bannerData.slug,
        });
      }
      await internal.saveBannerItems(req, bannerData.bannerItems);
    }
  } catch (err) {
    throw err;
  }
};

internal.saveRTEMediaCategory = async (req, mediaCategory) => {
  console.log(mediaCategory);

  try {
    for (const mediaCat of mediaCategory) {
      const isMediaCat = await mediaCategoryModel.findOne({
        where: { id: mediaCat.id },
        raw: true,
      });
      if (!isMediaCat) {
        await mediaCategoryModel.create(mediaCat);
      }
    }
  } catch (err) {
    throw err;
  }
};

router.get("/", async (req, res, next) => {
  //save data if they don't exist
  try {
    await internal.saveRoles(req, setupData.roles);
    await internal.saveUsers(req, setupData.users);
    await internal.saveRoleMenu(req, setupData.roleMenus);
    await internal.saveSettings(setupData.setting);
    await internal.saveRTEMediaCategory(req, setupData.mediaCategory);
    await internal.saveBanner(req, setupData.banner);
    res.send(`
            <h1>Setup completed</h1>
            <br/>
            <h2>Username: superadmin</h2>
            <h2>Password: admin123</h2>
        `);
  } catch (err) {
    res.status(400).send(`
            <h1>Setup Error</h1>
            <br/>
            <h2>Error</h2>
            <p>${err}</p>
        `);
  }
});

module.exports = router;
