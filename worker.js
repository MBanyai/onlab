(function () {
	'use strict';
	module.exports = function(){
		function Worker(){
			this._exec = require('child_process').fork;
		};

		Worker.prototype.process = function (job, cb){ 	//processes the given data
			this.parser(job);
			this.send(job);
			cb();
		};

		Worker.prototype.parser = function (job){ //parse the data to a more "suitable" structure
		    var strs = job.rawdata.split(":");
		    job.len = parseInt(strs[1]+strs[0],16);
		    job.yun = parseInt(strs[3]+strs[2],16);
			job.slave = parseInt(strs[5]+strs[4],16);
			job.fields = parseInt(strs[7]+strs[6],16);
			job.sensor = parseInt(strs[9]+strs[8],16);
			job.data = new Array();

			var variableLength = ((job.len-2*4)/job.fields)-2;

			job.varileng=strs[13]+strs[12]+strs[11]+strs[10];

			if (variableLength === 4)
				for(var i=10;i<strs.length; i+= 6 ){
			        var buf = new Buffer(strs[i+3]+strs[i+2]+strs[i+1]+strs[i], "hex");
	                job.data.push( buf.readFloatBE(0));
				 }
			else if(variableLength === 2)
				for(var i=10;i<strs.length; i+= 4 ){
			        var buf = new Buffer(strs[i+1]+strs[i], "hex");
	                job.data.push( buf.readIntBE(0));
				 }
		};
			
		Worker.prototype.send = function(job){  //send data to database
			job.pool.connect(function(err, client, done) {
				if(err) {
					return console.error('error fetching client from pool', err);
				}
				client.query('INSERT INTO sensor (sensor_id,slave_id,yun_id,data1,data2) values($1,$2,$3,$4,$5)',
							[job.sensor,job.yun,job.slave,job.data[0],job.data[1]], function(err, result) {
					done();
				});
			});
		};

		return Worker;
	}
})()