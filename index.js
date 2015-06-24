var express = require('express');
var unparse = require('unparse');

var config = require('./config');

var app = express();

app.use('/api', unparse(config));
app.use('/', express.static(__dirname + '/public'));

var server = app.listen(process.env.PORT || 3000, function () {
	console.log('Server listening on port '+server.address().port);
});