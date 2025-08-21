const { v4: uuidv4 } = "uuid";

const generateUUID = () => {
  return uuidv4();
};

module.exports = { generateUUID };
