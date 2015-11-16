var redis = require('redis')
var multer  = require('multer')
var express = require('express')
var fs      = require('fs')
var app = express()
// REDIS
var client = redis.createClient(6379, '127.0.0.1', {})
var httpProxy = require('http-proxy')
var http = require('http')


var proxy = httpProxy.createProxyServer({});

var string1 = 'http://127.0.0.1:3000';
var string2 = 'http://127.0.0.1:3001';


client.del('serverqueue');
client.lrange('serverqueue',0,-1, function (err, value) {
	console.log(value);
})

client.lpush('serverqueue',string1);
client.lpush('serverqueue',string1);
client.lpush('serverqueue',string1);
client.lpush('serverqueue',string1);
client.lpush('serverqueue',string2);

client.lrange('serverqueue',0,-1, function (err, value) {
	console.log(value);
})


app.get('/*',function(req,res) {
	client.get('monitor_canary', function(err, value) {
		if (value == 'true') {
			console.log('Removed canary server');
			client.lrem('serverqueue', 1, string2);
		}
	})
	client.rpoplpush('serverqueue','serverqueue', function(err, value) {
		console.log(value);
		proxy.web(req, res, { target: value });
		});
})


console.log("listening on port 3002")
app.listen(3002);
