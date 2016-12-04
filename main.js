'use strict';
(function(){

	var fs = require('fs'); //for debugging
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
console.log(job.avarage);
});

/*
setTimeout(call, 5000);
	console.log(job.result);
	function call(){
		manager.reprocess(2,function(err,jobRes){
		
	    })
	}
*/	
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
			manager.process(reqBody, done);
		});

		response.end();
	};


	function done (err, jobResult){ //callback for the processing
				console.log('Worker response. I processed ' + (++totalRun)+ ' jobs');
				console.log("The length: ",job.len);
				console.log("The yunID: ",job.yun);
				console.log("The slaveID: ",job.slave);
				console.log("The fields: ",job.fields);
				console.log("The sensorID: ",job.sensor);
				console.log("The pointer's end is: ",job.pointer);
				console.log("Tht types: " + job.types[0].toString() +" " + job.types[1].toString());
				console.log("The datas: " + job.datas[0].toString() + " "+ job.datas[1].toString());
				console.log("Time: " + job.time.toString());
			};

	http.createServer(handleRequest).listen(port);

})();

