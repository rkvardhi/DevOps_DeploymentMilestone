var redis = require('redis')
var multer  = require('multer')
var express = require('express')
var fs      = require('fs')
var app = express()
// REDIS
var client = redis.createClient(6379, '127.0.0.1', {})

///////////// WEB ROUTES

// HTTP SERVER
 var server = app.listen(3000, function () {

   var host = server.address().address
   var port = server.address().port

   console.log('Example app listening at http://%s:%s', host, port)
 })

var sio = require('socket.io')
  , http = require('http')
  , request = require('request')
  , os = require('os')
  ;


//Sending Mail

var nodemailer = require('nodemailer');

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'devopsdeployment@gmail.com',
        pass: 'devops123456'
    }
});

// setup e-mail data with unicode symbols
var mailOptions = {
    from: 'Monitor Mail <devopsdeployment@gmail.com>', // sender address
    to: 'nchinth@ncsu.edu, rkvardhi@ncsu.edu', // list of receivers
    subject: 'Production Alert', // Subject line
    text: 'CPUAverage or MemoryLoad exceeds 35%', // plaintext body
    html: '<b>CPUAverage or MemoryLoad exceeds 35%</b>' // html body
};

//End - Sending Mail




function memoryLoad()
{
	var total = os.totalmem();
	var freemem = os.freemem();
	console.log( 'Used mem : ' + total + 'Free mem : ' + freemem);
	var memLoad = 100*(total-freemem)/total;
	console.log('MemLoad : ' + memLoad);
	if (memLoad > 45) {
		//TO DO : Send email and update a flag
		// send mail with defined transport object
		transporter.sendMail(mailOptions, function(error, info){
    			if(error){
        			return console.log(error);
    			}
    		console.log('Message sent: ' + info.response);

		});

	}
	return memLoad;
}


// Create function to get CPU information
function cpuTicksAcrossCores() 
{
  //Initialise sum of idle and time of cores and fetch CPU info
  var totalIdle = 0, totalTick = 0;
  var cpus = os.cpus();
 
  //Loop through CPU cores
  for(var i = 0, len = cpus.length; i < len; i++) 
  {
		//Select CPU core
		var cpu = cpus[i];
		//Total up the time in the cores tick
		for(type in cpu.times) 
		{
			totalTick += cpu.times[type];
		}     
		//Total up the idle time of the core
		totalIdle += cpu.times.idle;
  }
 
  //Return the average Idle and Tick times
  return {idle: totalIdle / cpus.length,  total: totalTick / cpus.length};
}

var startMeasure = cpuTicksAcrossCores();

function cpuAverage()
{
	var endMeasure = cpuTicksAcrossCores(); 
 
	//Calculate the difference in idle and total time between the measures
	var idleDifference = endMeasure.idle - startMeasure.idle;
	var totalDifference = endMeasure.total - startMeasure.total;
 	console.log ('Total CPU time : ' + totalDifference + ' Total idle time : ' + idleDifference);
	//Calculate the average percentage CPU usage
	var cpuAvg = 100*(totalDifference-idleDifference)/totalDifference;
	console.log('CPU Average : ' + cpuAvg);
	if (cpuAvg > 45) {
		//TO DO : Send email and update a flag
		// send mail with defined transport object
		transporter.sendMail(mailOptions, function(error, info){
    			if(error){
        			return console.log(error);
    			}
    		console.log('Message sent: ' + info.response);

		});

	}
	return cpuAvg;
}


///////////////
//// Broadcast heartbeat over websockets
//////////////
setInterval( function () 
{
	cpuAverage();
	memoryLoad();

}, 2000);

app.get('/monitor',function (req,res) {
	res.writeHead(200, {'content-type':'text/html'});
	res.write("<h1>CPU Average : "+cpuAverage()+"</h1><br/>");
	res.write("<h1>Memory Load : "+memoryLoad()+"</h1>");

})


// Add hook to make it easier to get all visited URLS.
app.use(function(req, res, next) 
{
	console.log(req.method, req.url);

	// ... INSERT HERE.
	client.lpush('queue',req.protocol + "://" + req.hostname + req.url);

	next(); // Passing the request to the next handler in the stack.
});

client.set("key", "value");
client.get("key", function(err,value){ console.log(value)});

 app.post('/upload',[ multer({ dest: './uploads/'}), function(req, res){

    console.log(req.body) // form fields
    console.log(req.files) // form files

    if( req.files.image )
    {
 	   fs.readFile( req.files.image.path, function (err, data) {
 	  		if (err) throw err;
 	  		var img = new Buffer(data).toString('base64');
			client.lpush('imgqueue', img);
 	  		console.log("Image uploaded successfully");
 		});
 	}

    res.status(204).end()
 }]);

 app.get('/meow', function(req, res) {
 	{
		console.log("Meow invoked");
 		res.writeHead(200, {'content-type':'text/html'});

		//Remove the recently pushed element from the imgqueue
		client.rpop('imgqueue', function(err, imagedata){
			res.write("<h1>\n<img src='data:my_pic.jpg;base64,"+imagedata+"'/>");
			res.end();
			});
		
 	}
 })






app.get('/', function(req, res) {
  res.send('From port 3000\nhello world')
})


app.get('/set', function(req, res) {
  client.set("newkey1","This message will self destruct in 10 seconds")
  client.expire("newkey1",10)
  res.send("From port 3000\nnewkey1")
})

app.get('/get', function(req, res) {
  client.get("newkey1",function(err,value){res.send('From port 3000\n'+value)});
})

client.set('homepageflag',true);

app.get('/homepage', function(req, res) {
  client.get('homepageflag', function(err, value) {
		if (value == 'true') {
			res.send('This is homepage');
		}
		else {
			res.send('This feature has been turned off');
		}
	})
})

app.get('/setflag', function(req, res) {
  client.set('homepageflag', true)
})


app.get('/disableflag', function(req, res) {
  client.set('homepageflag', false)
})


