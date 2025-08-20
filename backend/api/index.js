const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const routesDir = __dirname + "./routes";

const routesPath = path.join(__dirname, "routes");

fs.readdirSync(routesPath).forEach((file) => {
  // Automatically load the route file if it's not in the manually handled list
  const filePath = path.join(routesPath, file);

  // Check if the file is a JavaScript file and should be loaded automatically
  if (file.endsWith("-route.js")) {
    const route = require(filePath);
    const routeName = `/${file.replace("-route.js", "")}`;
    router.use(routeName, route);
  }
});

router.get("/", (req, res) => {
  res.send("api/v1 health check!");
});

module.exports = router;
