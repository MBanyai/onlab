(function () {
	'use strict';
	module.exports = function(ID){
		function Worker(ID, datastruct){
			this._exec = require('child_process').fork;
			this.ID = ID;
			this.logger = require("./logger")('Worker'+this.ID.toString());
			this.Datastructure = datastruct;
		};
		
		Worker.prototype.process = function (job, cb){ 	//processes the given data
			try{
			this.processHeader(job);
			this.processType(job);
			this.send(job, this.Datastructure, this.logger);
			job.success=true;
			cb(0,job);
			}
			catch(Exception)
			{
				job.success=false;
				this.logger.log( "exception occured:\n"+Exception.message+"\n"+"The Stack is:\n" + Exception.stack + "\n");
			}
		};

		//reads the data until the "fields" field is reached 
		//which is the borderline between the "header" datas
		// of the message and the "body" of the message
		Worker.prototype.processHeader = function(job){
			job.strs = job.rawdata.split(":");
			job.pointer = 0;
			job.len = this.convert(job,this.Datastructure.Header.Len);
			job.yun = this.convert(job,this.Datastructure.Header.Yun_ID);
			job.time = this.timeconverter(this.convert(job,this.Datastructure.Header.TimeStamp));
			job.slave = this.convert(job,this.Datastructure.Header.Slave_ID);
			job.sensor = this.convert(job,this.Datastructure.Header.Sensor_ID);
			job.fields = this.convert(job,this.Datastructure.Header.Fields);
		}
		
		//reads the first type and decides whitch type the sensor is
		//then calls the processData function with the right parameters
		Worker.prototype.processType = function(job){
			job.typeCount = 0;
			job.types = new Array();
			job.types.push(this.convert(job,this.Datastructure.Header.TypeVariableSize));
			job.typeCount += 1;
			job.datas = new Array();
			outerLoop:
			for(var i=0; i< this.Datastructure.SensorTypes.length; i++)
				for(var j=0; j< this.Datastructure.DataFields.length; j++)
					if(this.Datastructure.SensorTypes[i].Fields === job.fields
						&& this.Datastructure.SensorTypes[i].Types[0] === job.types[0])
						{
							this.processData(job,this.Datastructure.SensorTypes[i]);
							break outerLoop;
						}
		}
		
		//processing data according to type
		Worker.prototype.processData = function(job,type){
			this.logger.log(type.Name);
			for(var i=0; i<this.Datastructure.DataFields.length; i++)
				if(this.Datastructure.DataFields[i].Type === type.Types[0])
				{
					job.datas.push(this.convert(job,this.Datastructure.DataFields[i].Name));
					break;
				}
			for(var i=1; i<type.Types.length; i++)
				for(var j=0; j< this.Datastructure.DataFields.length; j++)
				{
					this.logger.log("I is: " + i.toString()+ ", J is: "+ j.toString());
					if(type.Types[i] === this.Datastructure.DataFields[j].Type)
					{
						job.types.push(this.convert(job,this.Datastructure.Header.TypeVariableSize));
						job.typeCount += 1;
						job.datas.push(this.convert(job,this.Datastructure.DataFields[j].Name));
						break;
					}
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
		Worker.prototype.send = function(job, Datastructure, Logger){
			job.pool.connect(function(err, client, done) {
				if(err) {
					return console.error('error fetching client from pool', err);
				}
			outerLoop:
			for(var i=0; i< Datastructure.SensorTypes.length; i++)
				for(var j=0; j< Datastructure.DataFields.length; j++)
					if(Datastructure.SensorTypes[i].Fields === job.fields
						&& Datastructure.SensorTypes[i].Types[0] === job.types[0])
						{
							var argArray = new Array;
							var argString= 'INSERT INTO "'+ Datastructure.SensorTypes[i].Name + '" (';
							argArray.push(job.yun);
							argArray.push(job.slave);
							argArray.push(job.sensor);
							argArray.push(job.time);
							argString += '"Yun_ID", ';
							argString += '"Slave_ID", ';
							argString += '"Sensor_ID", ';
							argString += '"Time", "';
							for(var k=0; k < Datastructure.SensorTypes[i].Attributes.length; k++)
							{
								argString += Datastructure.SensorTypes[i].Attributes[k] + '", "';
								argArray.push(job.datas[k]);
							}
							argString = argString.substring(0, argString.length - 3);
							argString +=") values (";
							for(var k=0; k < Datastructure.SensorTypes[i].Attributes.length + 4; k++)
							{
								argString+="$"+(k+1).toString()+",";
							}
							argString = argString.substring(0, argString.length - 1);
							argString+=")";
							Logger.log("The following String will be sent:");
							Logger.log(argString);
							Logger.log(argArray.toString());
							client.query(argString,argArray,function(err, result)
							{
								Logger.log("The result will be:");
								Logger.log(JSON.stringify( err));
								done();
							});
							break outerLoop;
						}
			});
		};
		return Worker;
	}
})()