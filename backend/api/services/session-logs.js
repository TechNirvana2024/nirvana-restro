const httpStatus = require("http-status");
const { sessionLogsModel } = require("../../models");
const ip = require("ip");
const useragent = require("useragent");
const responseHelper = require("../../helpers/response-helper");

const createSessionLog = async (sessionLogs, req) => {
  try {
    const ipAddress = ip.address();
    let userAgentInfo = {};
    const agent = useragent.parse(req.headers["user-agent"]);
    userAgentInfo.browser = agent.toAgent().toString();
    userAgentInfo.os = agent.os.toString();
    userAgentInfo.device = agent.device.toString();
    let sessionData = {
      login: new Date(),
      ipAddress,
      userId: sessionLogs.id,
      userAgent: JSON.stringify(userAgentInfo),
    };
    const sessionLog = await sessionLogsModel.create(sessionData);
    return sessionLog;
  } catch (e) {
    throw e;
  }
};

const findSingleUserLog = async (userId) => {
  try {
    const userLog = await sessionLogsModel.findOne({
      where: { userId, logout: null },
      order: [["id", "DESC"]],
      attributes: { exclude: ["updatedAt", "createdAt"] },
      raw: true,
    });
    return userLog;
  } catch (error) {
    throw error;
  }
};

const updateSessionLog = async (userSession, req, res) => {
  try {
    const userSessionRecord = await findSingleUserLog(
      userSession.userId ?? userSession.id,
    );

    if (!userSessionRecord) {
      return responseHelper.sendResponse(
        res,
        httpStatus.NOT_FOUND,
        false,
        null,
        null,
        "There is no session for this user",
        null,
      );
    }

    let sessionData = {
      logout: new Date(),
    };
    const endSession = await sessionLogsModel.update(sessionData, {
      where: {
        id: userSessionRecord.id,
      },
      order: [["id", "DESC"]],
      raw: true,
    });
    return endSession;
  } catch (error) {
    throw error;
  }
};

module.exports = { createSessionLog, findSingleUserLog, updateSessionLog };
