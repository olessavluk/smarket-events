const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "https://api.smarkets.com",
      logLevel: "debug",
      pathRewrite: {
        "^/api/": "/",
      },
      changeOrigin: true,
    })
  );
};
