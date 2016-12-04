(function () {
	'use strict';
	var fs = require('fs'); //for debugging
	module.exports = function(){
		function Worker(){
			this._exec = require('child_process').fork;
		};

		Worker.prototype.process = function (job, cb){ 	//processes the given data
			//this.parser(job);
			this.processHeader(job);
			this.processType(job);
			//this.check(job);
			this.send(job);
			cb();
		};
		
		//reads the data until the "fields" field is reached 
		//which is the borderline between the "header" datas
		// of the message and the "body" of the message
		Worker.prototype.processHeader = function(job){
			job.strs = job.rawdata.split(":");
			job.pointer = 0;
			job.len = this.readInt16(job);
			job.yun = this.readInt16(job);
			job.time = this.timeconverter(this.readUInt32(job));
			job.slave = this.readInt16(job);
			job.sensor = this.readInt16(job);
			job.fields = this.readInt16(job);
		}
		
		//reads the first type and decides whitch type the sensor is
		Worker.prototype.processType = function(job){
			job.typeCount = 0;
			job.types = new Array();
			job.types.push(this.readInt16(job));
			job.typeCount += 1;
			job.datas = new Array();
			
			if(job.fields === 2)
				switch (job.types[0]){
					case 0: this.processA(job);
					break;
					case 4: this.processC(job);
					break;
					case 6: this.processD(job);
					break;
					default: 
					break;
				}
			else this.processB(job);
		}
		
		//processing type "A" sensor's data
		Worker.prototype.processA = function(job){
			job.datas.push(this.readFloat(job));
			job.types.push(this.readInt16(job));
			job.typeCount += 1;
			job.datas.push(this.readFloat(job));
		};
		
		//processing type "B" sensor's data
		Worker.prototype.processB = function(job){
			job.datas.push(this.readFloat(job));
			job.types.push(this.readInt16(job));
			job.typeCount += 1;
			job.datas.push(this.readInt32(job));
			job.types.push(this.readInt16(job));
			job.typeCount += 1;
			job.datas.push(this.readFloat(job));
		};
		
		//processing type "C" sensor's data
		Worker.prototype.processC = function(job){
			job.datas.push(this.readInt16(job));
			job.types.push(this.readInt16(job));
			job.typeCount += 1;
			job.datas.push(this.readFloat(job));
		};

		//processing type "D" sensor's data
		Worker.prototype.processD = function(job){
			job.datas.push(this.readFloat(job));
			job.types.push(this.readInt16(job));
			job.typeCount += 1;
			job.datas.push(this.readFloat(job));
			
		};
		
		//reads the float from the job, that has an array of the bytes
		//in hexa strings in name of strs (strings)
		Worker.prototype.readFloat = function(job){
		 var buff = new Buffer(job.strs[job.pointer + 3] + job.strs[job.pointer + 2] +
									job.strs[job.pointer + 1] + job.strs[job.pointer], "hex");
		job.pointer += 4;
		var result = buff.readFloatBE(0)
		return result;
		}
		
		//reads the int with size of 16 from the job, that has an array of the bytes
		//in hexa strings in name of strs (strings)
		Worker.prototype.readInt16 = function(job){
			var buff = new Buffer(job.strs[job.pointer + 1] + job.strs[job.pointer], "hex");
			var result = buff.readInt16BE(0);
			job.pointer += 2;
			return result;
		}
		
		//reads the int with size of 32 from the job, that has an array of the bytes
		//in hexa strings in name of strs (strings)
		Worker.prototype.readInt32 = function(job){ //still bugged
		 var buff = new Buffer(job.strs[job.pointer + 3] + job.strs[job.pointer + 2] +
									job.strs[job.pointer + 1] + job.strs[job.pointer], "hex");
		var result = buff.readInt32BE(0);
		job.pointer += 4;
		return result;
		}
		
		//reads the unsigned int with the size of 32 from the job, that has an array of the bytes
		//in hexa strings in name of strs (strings)
		Worker.prototype.readUInt32 = function(job){
		var buff = new Buffer(job.strs[job.pointer + 3] + job.strs[job.pointer + 2] +
									job.strs[job.pointer + 1] + job.strs[job.pointer], "hex");
		var result = buff.readUInt32BE(0);
		job.pointer += 4;
		return result;
			
		}
		
		//converts timestamp to SQL date-time format
		Worker.prototype.timeconverter =function(UNIX_timestamp){
			var a = new Date(UNIX_timestamp * 1000);
			var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
			var year = a.getFullYear();
			var month = months[a.getMonth()];
			var date = a.getDate();
			var hour = a.getHours();
			var min = a.getMinutes();
			var sec = a.getSeconds();
			var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
			return time;
		}
		
		
		//The main send function. It servers as a crossroad: calls 
		//datatype specific send functions
		Worker.prototype.send = function(job){
			if(job.fields === 2)
				switch(job.types[0]){
					case 0: this.sendA(job);
					break;
					case 4: this.sendC(job);
					break;
					case 6: this.sendD(job);
					break;
				}
			else this.sendB(job);
		};
		
		//sends type "A" sensor data to the database
		Worker.prototype.sendA = function(job){
			job.pool.connect(function(err, client, done) {
				if(err) {
					return console.error('error fetching client from pool', err);
				}
				client.query(
				'INSERT INTO "Sensor_A"("Yun_ID", "Slave_ID", "Sensor_ID", "Time", "Data_A_1", "Data_A_2") values($1,$2,$3,$4,$5,$6)'
				, [job.yun,job.slave,job.sensor,job.time,job.datas[0],job.datas[1]], function(err, result) {
					done();
				});
			});
		}
	
		//sends type "B" sensor data to the database	
		Worker.prototype.sendB = function(job){
			job.pool.connect(function(err, client, done) {
				if(err) {
					return console.error('error fetching client from pool', err);
				}
				client.query(
				'INSERT INTO "Sensor_B"("Yun_ID", "Slave_ID", "Sensor_ID", "Time", "Data_B_1", "Data_B_2", "Data_B_3") values($1,$2,$3,$4,$5,$6,$7)'
				, [job.yun,job.slave,job.sensor,job.time,job.datas[0],job.datas[1]], function(err, result) {
					done();
				});
			});
		}

		//sends type "C" sensor data to the database		
		Worker.prototype.sendC = function(job){
			job.pool.connect(function(err, client, done) {
				if(err) {
					return console.error('error fetching client from pool', err);
				}
				client.query(
				'INSERT INTO "Sensor_C"("Yun_ID", "Slave_ID", "Sensor_ID", "Time", "Data_C_1", "Data_C_2") values($1,$2,$3,$4,$5,$6)'
				, [job.yun,job.slave,job.sensor,job.time,job.datas[0],job.datas[1]], function(err, result) {
					done();
				});
			});
		}

		//sends type "D" sensor data to the database		
		Worker.prototype.sendD = function(job){
			job.pool.connect(function(err, client, done) {
				if(err) {
					return console.error('error fetching client from pool', err);
				}
				client.query(
				'INSERT INTO "Sensor_D"("Yun_ID", "Slave_ID", "Sensor_ID", "Time", "Data_D_1", "Data_D_2") values($1,$2,$3,$4,$5,$6)'
				, [job.yun,job.slave,job.sensor,job.time,job.datas[0],job.datas[1]], function(err, result) {
					done();
				});
			});
		}

		return Worker;
	}
})()