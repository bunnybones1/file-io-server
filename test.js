var fileIOServer = require('./');

new fileIOServer({
		port: 3000,
		servePath: "./staticServe",
		debugLevel: 2
	});
