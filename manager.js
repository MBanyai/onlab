(function (){
		this.logger = require('./logger')("Manager");
		this.logger.log("Initialization started.");
	
	//the (raw-data)processing worker do not mix this with
	//Reworker, which is responsible for reprocessing the data
	//for more abstract information
	var Worker = require('./worker')();
	
	var fs = require("fs");
	var structure = JSON.parse(fs.readFileSync('./structure.conf','utf8'));
	
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
	
	//config for raw-data database
	var dataConf = structure.Databases.Raw;
	this.logger.log("Trying to connect to raw database.");
	var dataPool = new pg.Pool(dataConf);//data pool for (raw-data) processing
	this.logger.log("Ok!");
	
	//config for processed-data database
	var reprocConf = structure.Databases.Processed;
	this.logger.log("Trying to connect to processed database.");
	var reprocessPool = new pg.Pool(reprocConf);
	this.logger.log("Ok!");
	
	this.logger.log(JSON.stringify(structure.Datastructure));
	
	function createProcessJob(data){ //remeber, you allways make a createfunction to create different instances dynamically.
			var jobToProcess = {
				pool: dataPool,
				rawdata : data,
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
				Workers.push( new Worker(i+1, structure.Datastructure));
			
			Reworkers.push(new Reworker(1));
			Reworkers.push(new Reworker(2));
			
			this.processQueue = async.queue(function(job, queueRelease){
				var worker = Workers.shift();
				worker.process(job, function(err, res){
					job.callback(err,res);
					queueRelease();
				});
				Workers.push(worker);
			}, child);
			
		
			this.reprocessQueue = async.queue(function(job, queueRelease){
				var reworker = Reworkers.shift();
				reworker.process(job, function(err, res){
					job.callback(err,res);
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
		this.logger.log("Initialization is complete.");
		return new Manager(child);
	};
	
})();