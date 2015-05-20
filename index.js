var path = require('path'),
	_ = require('lodash'),
	fs = require('fs'),
	chalk = require('chalk'),
	mime = require('mime-types'),
	mkdirp = require('mkdirp'),
	cors = require('cors'),
	base64 = require('base64-stream'),
	connect = require('connect');

var base64Formats = [
	'png',
	'jpg',
	'jpeg'
];

function fileIOServer(params) {
	params = _.merge({
		port: 3000,
		servePath: "./staticServe",
		debugLevel: 1
	}, params || {});

	var servePath = path.resolve(params.servePath);
	if(params.debugLevel >= 1) console.log('serving ' + servePath + ' on port:', params.port );

	var serveStatic = require('serve-static');
	var app = connect();
	var allowCrossDomain = function(req, res, next) {
	    res.setHeader('Access-Control-Allow-Origin', '*');
	    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS, POST');
	    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
	    if(params.debugLevel >= 2) console.log('headers added for', req.method, req.url);
	    next();
	}
	app.use(allowCrossDomain);
	app.use(serveStatic(servePath));

	function respond(msg) {
		msg = msg || 'hello world';

		return function(req, res) {
			if(req.method == 'OPTIONS') {
				if(params.debugLevel >= 1) console.log('requesting', req.method, req.url);
				res.writeHead(200);
				res.end('preflight?');
			} else if(req.method == 'PUT') {
				if(params.debugLevel >= 1) console.log('putting', req.method, req.url);
				var filePath = path.resolve(servePath + '/' + req.url);
				var isBase64 = base64Formats.some(function(extension) {
					if(req.url.lastIndexOf('.' + extension) == req.url.length - extension.length - 1) {
						return true;
					}
					return false;
				});
				var fileExists = fs.existsSync(filePath);
				var responseStatus =  fileExists ? 200 : 201;
				var started = false;
				mkdirp(path.dirname(filePath), function(err) {
					if(err) {
						throw(err);
					} else {
						req.on('readable', function() {
							if(started) return;
							started = true;
							if(params.debugLevel >= 2) console.log('there is some data to read now');

							var writable = fs.createWriteStream(filePath);
							
							writable.on('finish', function() {
								res.writeHead(responseStatus, { 'Content-Type': mime.lookup(req.url)});
								res.end((fileExists ? 'file updated: ' : 'new file saved: ') + filePath );
								if(params.debugLevel >= 1) console.log('file put complete.');
							})

							// All the data from readable goes into 'file.txt'
							if(isBase64) {
								req.pipe(base64.decode()).pipe(writable);
							} else {
								req.pipe(writable);
							}

							req.on('data', function(chunk) {
								if(params.debugLevel >= 2) console.log('got %d bytes of data', chunk.length);
							})

							req.on('end', function() {
								if(params.debugLevel >= 2) console.log('there will be no more data.');
							});
						});
					}
				});
			} else if(req.url == '/') {
				if(params.debugLevel >= 1) console.log('requesting', req.url);
				res.writeHead(200, { 'Content-Type': mime.lookup('index.html')});
				res.end(msg);
			} else {
				if(params.debugLevel >= 1) console.log('requesting', req.url);
				res.writeHead(404, { 'Content-Type': mime.lookup(req.url)});
				res.end('not found');
			}
		}
	}

	var html = '<html>' +
	'		<head>' +
	'			<title>File IO Server Test</title>' +
	'			<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />' +
	'			<script type="text/javascript" src="test.js"></script>' +
	'		</head>' +
	'	<body>' +
	'		If you\'re seeing this message, you are running a fileserver for %%PATH on port %%PORT capable of GET and PUT requests, so please use responsibly.' +
	'	</body>' +
	'</html>';
	html = html.replace('%%PATH', servePath);
	html = html.replace('%%PORT', params.port);
	app.use(respond(html));
	app.listen(params.port);
}

module.exports = fileIOServer;
