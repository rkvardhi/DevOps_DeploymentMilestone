## Deployment Milestone

This repo contains the code and configuration for the Deployment Milestone in the semester project for building a pipeline. We have used a simple Nodejs application to achieve the goals of this milestone.

Summary of things that are achieved in this milestone:

* Used ansible playbooks to setup the production environment.
* Deployed the application to AWS EC2 instance using jenkins after the build has been succesful.
* The ability to enable features on the fly. Need not restart the server to enable/disable features.
* Monitored the production for two metrics (CPU and memory). Raised alerts if metrics are beyond threshold.
* Created a seperate job for canary release. Routed about 33% traffic to the new canary release using proxy.

## Team Members:
```
Nikhil Chinthapallee(nchinth)
Rishi Vardhineni(rkvardhi)
Vamsi Vikash Ankam(vankam)
```

## Screenshots

## Ansible Playbook:
![image](https://github.com/rkvardhi/DevOps_DeploymentMilestone/blob/master/Screenshots/playbook_script.jpeg)
![image](https://github.com/rkvardhi/DevOps_DeploymentMilestone/blob/master/Screenshots/ansible.png)
![image](https://github.com/rkvardhi/DevOps_DeploymentMilestone/blob/master/Screenshots/Inventory.jpeg)

## Jenkins Jobs(to deploy application to EC2 Instances):
![image](https://github.com/rkvardhi/DevOps_DeploymentMilestone/blob/master/Screenshots/JenkinsJob1.png)
![image](https://github.com/rkvardhi/DevOps_DeploymentMilestone/blob/master/Screenshots/CanaryRelease.jpeg)

## Feature flags:
* We have used redis cache to implement feature flags as below. If the feature flag is set to true then only it can be acessed.

```
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
```

## Monitoring:
* We are monitoring the EC2 Instance for 2 metrics(CPU and memory) as below. An email is configured to be sent when ever alert is raised.
```
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
		console.log('Alert raised');
	}
```
```
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
		console.log('Alert raised');
	}
```
* Email:
![image](https://github.com/rkvardhi/DevOps_DeploymentMilestone/blob/master/Screenshots/ProductionAlert.JPG)


## Canary Release:
* Created a seperate Jenkins Job for Canary Release.
![image](https://github.com/rkvardhi/DevOps_DeploymentMilestone/blob/master/Screenshots/CanaryRelease.jpeg)
* Routin 33% traffic to Canary. And if any monitoring alert is raised we are blocking up the canary instance.
```
client.lpush('serverqueue',string1);
client.lpush('serverqueue',string1);
client.lpush('serverqueue',string2);
```
```
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
```

## Screencast:
Please right click and save the gif to your system for better view .
Here is link to ![gif](https://github.com/rkvardhi/DevOps_DeploymentMilestone/blob/master/Screenshots/Deployment3.gif)
