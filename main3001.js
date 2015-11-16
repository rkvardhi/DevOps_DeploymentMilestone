var redis = require('redis')
var multer  = require('multer')
var express = require('express')
var fs      = require('fs')
var os = require('os')
var app = express()
// REDIS
var client = redis.createClient(6379, '52.10.15.127', {})

///////////// WEB ROUTES
client.set('monitor_canary','false');

// HTTP SERVER
 var server = app.listen(3001, function () {

   var host = server.address().address
   var port = server.address().port

   console.log('Example app listening at http://%s:%s', host, port)
 })

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
	if (memLoad > 35) {
		//TO DO : Send email and update a flag
		// send mail with defined transport object
		transporter.sendMail(mailOptions, function(error, info){
    			if(error){
        			return console.log(error);
    			}
    		console.log('Message sent: ' + info.response);

		});
		client.set('monitor_canary','true');
		console.log('Alert raised');
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
	if (cpuAvg > 35) {
		//TO DO : Send email and update a flag
		
		// send mail with defined transport object
		transporter.sendMail(mailOptions, function(error, info){
    			if(error){
        			return console.log(error);
    			}
    		console.log('Message sent: ' + info.response);

		});
		client.set('monitor_canary','true');
		console.log('Alert raised');
	}
	return cpuAvg;
}

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

app.get('/', function(req, res) {
  res.send('<h2>From Canary instance: Hello world!!!</h2>')
})

client.set('homepageflag',true);

app.get('/homepage', function(req, res) {
  client.get('homepageflag', function(err, value) {
		if (value == 'true') {
			res.send('<h2>This is homepage.</h2>');
		}
		else {
			res.send('<h2>This feature has been turned off.</h2>');
		}
	})
})

app.get('/enableflag', function(req, res) {
  client.set('homepageflag', true);
  res.send('<h2>Feature flag for homepage has been enabled.</h2>');
})


app.get('/disableflag', function(req, res) {
  client.set('homepageflag', false)
  res.send('<h2>Feature flag for homepage has been disable.</h2>');
})

