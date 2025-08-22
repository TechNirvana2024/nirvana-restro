const { floorModel, tableModel } = require("../../models");
const { Op } = require("sequelize");
const paginate = require("../../utils/paginate");

const create = async (req) => {
  try {
    const result = await floorModel.create(req.body);
    if (!result) {
      return {
        status: 500,
        success: false,
        message: `Floor create failed`,
      };
    }
    return {
      status: 200,
      success: true,
      message: `Floor create successfully`,
    };
  } catch (error) {
    throw error;
  }
};

const list = async (req) => {
  try {
    let { limit, page, slug } = req.query;
    const filters = {};
    const include = [];

    if (slug) {
      filters.slug = {
        [Op.like]: `%${slug}%`,
      };
    }

    const result = await paginate(floorModel, {
      limit,
      page,
      filters,
      include,
    });

    if (!result) {
      return {
        status: 500,
        success: false,
        message: `Floor List Failed`,
      };
    }
    return {
      status: 200,
      success: true,
      message: `Floor List successfully`,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const result = await floorModel.findByPk(+req.params.id, {});
    if (!result) {
      return {
        status: 404,
        success: false,
        message: `Floor Not Found`,
        data: null,
      };
    }
    return {
      status: 200,
      success: true,
      message: `Floor Get successfully`,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const updateById = async (req) => {
  try {
    const result = await floorModel.findByPk(+req.params.id);
    if (!result) {
      return {
        status: 404,
        success: false,
        message: `Floor Not Found`,
        data: null,
      };
    }

    const updated = await result.update(req.body);
    if (!updated) {
      return {
        status: 500,
        success: false,
        message: `Floor updated Failed`,
        data: null,
      };
    }
    return {
      status: 200,
      success: true,
      message: `Floor updated successfully`,
      data: updated,
    };
  } catch (error) {
    throw error;
  }
};

const deleteById = async (req) => {
  try {
    const result = await floorModel.findByPk(+req.params.id);
    if (!result) {
      return {
        status: 404,
        success: false,
        message: `Floor Not Found`,
        data: null,
      };
    }

    const deleted = await result.destroy();
    if (!deleted) {
      return {
        status: 500,
        success: false,
        message: `Floor delete failed`,
        data: null,
      };
    }
    return {
      status: 200,
      success: true,
      message: `Floor delete successfully`,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  create,
  list,
  getById,
  updateById,
  deleteById,
};
