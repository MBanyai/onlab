(function (){
		var fs = require('fs'); //for debugging
	
	//the (raw-data)processing worker do not mix this with
	//Reworker, which is responsible for reprocessing the data
	//for more abstract information
	var Worker = require('./worker')();
	
	//the (data in database) reprocessing reworker do not mix this with
	//worker, which is responsible for reprocessing the rawdata
	//and put it into the database
	var Reworker = require('./reworker')();
	
	var async = require('async');
	
	//the (raw-data) processing workers' array do not mix
	//this with Reworkers, which is responsible for 
	//reprocessing the data for more abstract information
	var Workers = new Array();
	
	//the (data in database) processing workers' array do not mix
	//this with Workers, which is responsible for 
	//processing the rawdata and pu it into the database
	//with the size of 2 for now
	var Reworkers = new Array();
	
	//postgresql handler library
	var pg = require('pg');
	
	//configuration for (raw-data) processing
	var dataConf = { 
    user: 'mark', 
    database: 'sensor_data', 
    password: 'mark', 
    host: 'localhost', // Server hosting the postgres database
    port: 5432, 
    max: 10, // max number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
	}
	var dataPool = new pg.Pool(dataConf);//data pool for (raw-data) processing
	
	
	var reprocConf = { 
    user: 'mark', 
    database: 'sensor_data_processed', 
    password: 'mark', 
    host: 'localhost', // Server hosting the postgres database
    port: 5432, 
    max: 10, // max number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
	}
	var reprocessPool = new pg.Pool(reprocConf);
	
	function createProcessJob(data){ //remeber, you allways make a createfunction to create different instances dynamically.
			var jobToProcess = {
				pool: dataPool,
				rawdata : data
			};
		return jobToProcess;
	}
	
	function createReprocessJob(Type){
		var job = {
			rawPool: dataPool,
			repPool: reprocessPool,
			type: Type
		}
		return job;
	}
	
	module.exports = function(child){
		function Manager(child){
			for(var i=0; i< child; i++)
				Workers.push( new Worker());
			
			Reworkers.push(new Reworker());
			Reworkers.push(new Reworker());

			this.processQueue = async.queue(function(job, queueRelease){
				var worker = Workers.shift();
				worker.process(job, function(err, res){
					job.callback(null,res);
					queueRelease();
				});
				Workers.push(worker);
			}, child);
			
		
			this.reprocessQueue = async.queue(function(job, queueRelease){
				var reworker = Reworkers.shift();
				reworker.process(job, function(err, res){
					job.callback(null,res);
					queueRelease();
				});
				Reworkers.push(reworker);
			},2)
		}
		
		Manager.prototype.process = function (data, callback){
			job = createProcessJob(data);
			job.callback = callback;
			this.processQueue.push(job, function(err){
			});
		}
		
		Manager.prototype.reprocess = function(type, callback){
			job = createReprocessJob(type); 
			job.callback = callback;
			this.reprocessQueue.push(job, function(err){
			});
		}
		
		return new Manager(child);
	};
	
})();