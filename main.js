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
	
	var processRunning = 0;
	var totalRun = 0;
	
	var pool = new pg.Pool(config);
	
	setInterval(function(){
		if(processRunning <= numberOfChilds){
			var jobToSend = {
				pool,
				block: 5000,
				id: uuid.v4()
			};
			manager.process(jobToSend, function done (err, jobResult){
				--processRunning;
				console.log('Worker response. I processed ' + (++totalRun)+ ' jobs');
			});
			++processRunning;
		}
	}, 500);
	
})();

