(function (){
	var Worker = require('./worker')();
	var async = require('async');
	var workers = new Array();
	
	module.exports = function(child){
		function Manager(child){
			for(var i=0; i< child; i++)
				workers.push( new Worker());

			this._q = async.queue(function(job, queueRelease){
				var worker = workers.shift();
				worker.process(job, function(err, result){
					job.callback(result);
					queueRelease();
				});
				workers.push(worker);
			}, child);
		}
		Manager.prototype.process = function (job, callback){
			job.callback = callback;
			this._q.push(job, function(err){
			});
		}
		return new Manager(child);
	};
	
})();