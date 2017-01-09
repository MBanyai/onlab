(function () {
	'use strict';
	var fs = require('fs'); //for debugging
	module.exports = function(){
		function Worker(){
			this._exec = require('child_process').fork;
		};

		Worker.prototype.process = function (job, cb){ 	//processes the given data
			try{
			this.processHeader(job);
			this.processType(job);
			this.send(job);
			job.success=true;
			cb();
			}
			catch(Exception)
			{
				job.success=false;
				fs.appendFile("log.txt", "exception occured:\n"+Exception.message+"\n\n");
			}
		};
		
		//reads the data until the "fields" field is reached 
		//which is the borderline between the "header" datas
		// of the message and the "body" of the message
		Worker.prototype.processHeader = function(job){
			job.strs = job.rawdata.split(":");
			job.pointer = 0;
			job.len = this.convert(job,"Int16");
			job.yun = this.convert(job,"Int16");
			job.time = this.timeconverter(this.convert(job,"UInt32"));
			job.slave = this.convert(job,"Int16");
			job.sensor = this.convert(job,"Int16");
			job.fields = this.convert(job,"Int16");
		}
		
		//reads the first type and decides whitch type the sensor is
		//then calls the processData function with the right parameters
		Worker.prototype.processType = function(job){
			job.typeCount = 0;
			job.types = new Array();
			job.types.push(this.convert(job,"Int16"));
			job.typeCount += 1;
			job.datas = new Array();
			
			if(job.fields === 2)
				switch (job.types[0]){
					case 0: this.processData(job,"A");
					break;
					case 4: this.processData(job,"C");
					break;
					case 6: this.processData(job,"D");
					break;
					default: 
					break;
				}
			else this.processData(job,"B");
		}
		
		//processing data according to type
		Worker.prototype.processData = function(job,type){
			switch(type){
				case "A":
					job.datas.push(this.convert(job,"Float"));
					job.types.push(this.convert(job,"Int16"));
					job.typeCount += 1;
					job.datas.push(this.convert(job,"Float"));
				break;
				case "B":
					job.datas.push(this.convert(job,"Float"));
					job.types.push(this.convert(job,"Int16"));
					job.typeCount += 1;
					job.datas.push(this.convert(job,"Int32"));
					job.types.push(this.convert(job,"Int16"));
					job.typeCount += 1;
					job.datas.push(this.convert(job,"Float"));
				break;
				case "C":
					job.datas.push(this.convert(job,"Int32"));
					job.types.push(this.convert(job,"Int16"));
					job.typeCount += 1;
					job.datas.push(this.convert(job,"Float"));
				break;
				case "D":
					job.datas.push(this.convert(job,"Float"));
					job.types.push(this.convert(job,"Int16"));
					job.typeCount += 1;
					job.datas.push(this.convert(job,"Float"));
				break;
			}
			
		}
		
		//converts the hexa string data to variable
		Worker.prototype.convert=function(job,type){
			var buff;
			switch(type){
				case "Float":
					buff = new Buffer(job.strs[job.pointer + 3] + job.strs[job.pointer + 2] +
									job.strs[job.pointer + 1] + job.strs[job.pointer], "hex");
					job.pointer += 4;
					var result = buff.readFloatBE(0)
					return result;

				case "Int16":
					buff = new Buffer(job.strs[job.pointer + 1] + job.strs[job.pointer], "hex");
					var result = buff.readInt16BE(0);
					job.pointer += 2;
					return result;

				case "Int32":
					buff = new Buffer(job.strs[job.pointer + 3] + job.strs[job.pointer + 2] +
									job.strs[job.pointer + 1] + job.strs[job.pointer], "hex");
					var result = buff.readInt32BE(0);
					job.pointer += 4;
					return result;

				case "UInt32":
					buff = new Buffer(job.strs[job.pointer + 3] + job.strs[job.pointer + 2] +
									job.strs[job.pointer + 1] + job.strs[job.pointer], "hex");
					var result = buff.readUInt32BE(0);
					job.pointer += 4;
					return result;
			}
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
		
		
		//the send function it sends the raw data to the database
		Worker.prototype.send = function(job){
			job.pool.connect(function(err, client, done) {
				if(err) {
					return console.error('error fetching client from pool', err);
				}
				if(job.fields === 2)
					switch(job.types[0]){
						case 0:
							client.query(
							'INSERT INTO "Sensor_A"("Yun_ID", "Slave_ID", "Sensor_ID", "Time", "Data_A_1", "Data_A_2") values($1,$2,$3,$4,$5,$6)'
							, [job.yun,job.slave,job.sensor,job.time,job.datas[0],job.datas[1]], function(err, result) {
								done();
							});
						break;

						case 4:
							client.query(
							'INSERT INTO "Sensor_C"("Yun_ID", "Slave_ID", "Sensor_ID", "Time", "Data_C_1", "Data_C_2") values($1,$2,$3,$4,$5,$6)'
							, [job.yun,job.slave,job.sensor,job.time,job.datas[0],job.datas[1]], function(err, result) {
								done();
							});
						break;

						case 6:
						client.query(
						'INSERT INTO "Sensor_D"("Yun_ID", "Slave_ID", "Sensor_ID", "Time", "Data_D_1", "Data_D_2") values($1,$2,$3,$4,$5,$6)'
						, [job.yun,job.slave,job.sensor,job.time,job.datas[0],job.datas[1]], function(err, result) {
							done();
						});
						break;
					}
				else
					client.query(
					'INSERT INTO "Sensor_B"("Yun_ID", "Slave_ID", "Sensor_ID", "Time", "Data_B_1", "Data_B_2", "Data_B_3") values($1,$2,$3,$4,$5,$6,$7)'
					, [job.yun,job.slave,job.sensor,job.time,job.datas[0],job.datas[1], job.datas[2]], function(err, result) {
						done();
					});
			});
		};

		return Worker;
	}
})()