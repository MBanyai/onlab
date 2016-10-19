(function (){
	var Worker = require('./worker')();
	var async = require('async');
	
	module.exports = function(child){
		function Manager(child){
			this._q = async.queue(function(job, gueueRelease){
				var worker = new Worker();
				worker.execute(job, function(err, result){
					job.callback(result);
					gueueRelease();
				});
			}, child);
		}
		Manager.prototype.process = function (job, callback){
			job.callback=callback;
			console.time(job.id);
			this._q.push(job, function(err){
				console.timeEnd(job.id);
			});
		};
		return new Manager(child);
	};
	
})();