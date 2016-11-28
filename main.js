'use strict';
(function(){
	var pg = require('pg');
	var config = {
    user: 'mark', //env var: PGUSER
    database: 'sensor_data', //env var: PGDATABASE
    password: 'mark', //env var: PGPASSWORD
    host: 'localhost', // Server hosting the postgres database
    port: 5432, //env var: PGPORT
    max: 10, // max number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
};
	var async = require('async');
	var uuid = require('node-uuid');
	var _ = require('lodash');
	var numberOfChilds = 5;
	var manager = require('./manager')(numberOfChilds);
	var http = require('http');
	var port = 5000;
	
	var processRunning = 0;
	var totalRun = 0;
	
	var pool = new pg.Pool(config);
	
	function handleRequest(request,response){
		console.log("===================================================");
		var reqBody='';
		request.on("data", function (data){
			reqBody+=data;
			if(reqBody.length>1e7)
				reqBody='';
		});
			request.on("end", function (data){
			console.log(reqBody);
			manager.process(createJob(reqBody), done);
		});

		response.end();
	}

	function createJob(data){ //remeber, you allways make a createfunction to create differentinstances dynamically.
			var jobToProcess = {
				pool,
				id: uuid.v4(),
				rawdata : data
			};
		return jobToProcess;
	}

	function done (err, jobResult){ //callback for the processing
				console.log('Worker response. I processed ' + (++totalRun)+ ' jobs');
			};

	http.createServer(handleRequest).listen(port);
	/*
	setInterval(function(){
		    var job = createJob( '14:00:03:00:01:00:02:00:02:00:67:66:AE:41:02:00:00:00:4E:42');
			manager.process(job, function done (err, jobResult){
				--processRunning;
				console.log('Worker response. I processed ' + (++totalRun)+ ' jobs');
		//		console.log("The length: ",job.len);
		//		console.log("The yunID: ",job.yun);
		//		console.log("The slaveID: ",job.slave);
		//		console.log("The fields: ",job.fields);
		//		console.log("The sensorID: ",job.sensor);
		//		console.log("The first float: ",job.data[0]);
		//		console.log("The second float: ",job.data[1]);
		//		console.log("temp: ", job.varileng);
			});
			++processRunning;
	}, 1);
	*/
})();

