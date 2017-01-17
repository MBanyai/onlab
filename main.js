'use strict';
(function(){
	// starting init process
	var logger = require('./logger')("MainFunction");
	logger.log("Starting initialization process.");
	var async = require('async');
	var uuid = require('node-uuid');
	var _ = require('lodash');
	var numberOfChilds = 5;
	var manager = require('./manager')(numberOfChilds);
	var http = require('http');
	var port = 5000;
	
	var processRunning = 0;
	var totalRun = 0;
	

manager.reprocess(1,function(err,jobRes){	
		logger.log(JSON.stringify(job.avarage).replace(/,/g,'\n'));

});

logger.log("Finishing initialization process.");


/*
setTimeout(call, 5000);
	console.log(job.result);
	function call(){
		manager.reprocess(2,function(err,jobRes){
		
	    })
	}
*/	
	function handleRequest(request,response){
		var reqBody='';
		request.on("data", function (data){
			reqBody+=data;
			if(reqBody.length>1e7)
				reqBody='';
		});
			request.on("end", function (data){
			manager.process(reqBody, done);
		});
		response.status = 200;
		response.end();
	};


	function done (err, jobResult){ //callback for the processing
			if(job.success == true){
				logger.log("=====================================================");
				logger.log('Worker response. I processed ' + (++totalRun)+ ' jobs');
				logger.log("The length: "+jobResult.len);
				logger.log("The yunID: "+jobResult.yun);
				logger.log("The slaveID: "+jobResult.slave);
				logger.log("The fields: "+jobResult.fields);
				logger.log("The sensorID: "+jobResult.sensor);
				logger.log("The pointer's end is: " + jobResult.pointer);
				logger.log("The types: " + jobResult.types[0].toString() +" " + jobResult.types[1].toString());
				logger.log("The datas: " + jobResult.datas[0].toString() + " "+ jobResult.datas[1].toString());
				logger.log("Time: " + jobResult.time.toString());
			}
			else
				logger.log("The recived data is not compatible with one of the four datatypes.");
			};

	http.createServer(handleRequest).listen(port);

})();

