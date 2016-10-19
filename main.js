'use strict';
(function(){
	var async = require('async');
	var uuid = require('node-uuid');
	var _ = require('lodash');
	var numberOfChilds = 20;
	var manager = require('./manager')(numberOfChilds);
	
	var processRunning = 0;
	var totalRun = 0;
	
	setInterval(function(){
		if(processRunning <= numberOfChilds){
			var jobToSend = {
				block: 5000,
				id: uuid.v4()
			};
			manager.process(jobToSend, function done (err, jobResult){
				--processRunning;
				console.log('Worker response. I processed' + (++totalRun)+ 'jobs');
			});
			++processRunning;
		}
	}, 500);
	
})();

