const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function (app) {
    // if (import.meta.env.VITE_APP_PROXY_URL) {
    app.use(
        /\/(api|auth|version|env|diseaseName|feedback)/,
        createProxyMiddleware({
            // Proxy API requests to curator service.
            target: 'http://curator:3001/',
            changeOrigin: true,
        }),
        // app.use(
        //     createProxyMiddleware(/\/(api|auth|version|env|diseaseName|feedback)/, {
        //         target: 'http://curator:3001/',
        //         changeOrigin: true
        //     })
        // )
    );
    // }
};