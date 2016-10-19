(function () {
	'use strict';
	
	module.exports = function(){
		function Worker(){
			this._exec = require('child_process').fork;
		}
		Worker.prototype.execute = function (job, cb){
			this._cb = cb;
			this._job = job;
			this._proc = this._exec(
			'index.js',
			[],
			{
				cwd: '.',
				silent: true,
				stdio: [
				 'pipe', //stdin
				 'pipe', //stdout
				 'pipe'  //stderr
				]
			}
			);
			attachProcessListeners.apply(this);
			this._proc.send(job);
			
			
		};
		return Worker;
		function attachProcessListeners(){
				var that = this;
				this._proc.stdout.on('data', function (data){
					console.log(data.toString());
				});
				//send response and maybe kill the child
				this._proc.on('message', function(data){
					that._cb(null, data);
					that._proc.kill('SIGINT');
				});
				this._proc.on('error', function(err){
					console.log("FUCK!!!!" + err)
				});
			}
	}
})()