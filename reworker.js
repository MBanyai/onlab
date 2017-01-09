(function () {
	'use strict';
	var fs = require('fs'); //for debugging
	
	module.exports = function(){
		function Reworker(){
			this._exec = require('child_process').fork;
		};
		
		Reworker.prototype.process = function (job, cb){ 	//processes the given data
			if (job.type === 1)
				this.avarage(job, cb);
			if (job.type === 2)
				this.getAvarage(job, cb);
		};
		
		Reworker.prototype.getAvarage = function(job, cb){
			job.result = new Array();
			job.repPool.connect(function(err, client, done) {
				clearAvarage(err,client,done);
				if(err) {
					return console.error('error fetching client from pool', err);
				}
				var query = client.query( 'select "Yun_ID", "Slave_ID", "Sensor_ID", "Date", "Daily_Awarage" from "A_1_daily_Aw";', function(err, result) {
					job.result=result;
					done();
				});
				
				query.on('end',function(){
							
					cb();
				});
			
		});
	}
			
		Reworker.prototype.avarage = function(job, cb){
			job.avarage = new Array();
			job.rawPool.connect(function(err, client, done) {
				if(err) {
					return console.error('error fetching client from pool', err);
				}
				var query = client.query( 'SELECT "Yun_ID", "Slave_ID","Sensor_ID", "Time"::date ,AVG("Data_A_1") FROM "Sensor_A"' + 
				'GROUP BY "Time"::date, "Yun_ID", "Slave_ID", "Sensor_ID"'	, function(err, result) {
					done();
				});
				query.on("row", function(row){
					job.avarage.push(row);
				});
				query.on('end',function(){	
					send(job,cb);
					});
			});
		};
		
		function send(job,cb){
			
			job.repPool.connect(function(err, client, done) {
				clearAvarage(err,client,done);
				if(err) {
					return console.error('error fetching client from pool', err);
				}
				for(var i=0; i< job.avarage.length; i++)
					client.query(
					'INSERT INTO "A_1_daily_Aw"("Yun_ID", "Slave_ID", "Sensor_ID", "Date", "Daily_Awarage") values($1,$2,$3,$4,$5)'
					, [job.avarage[i].Yun_ID,job.avarage[i].Slave_ID,job.avarage[i].Sensor_ID,job.avarage[i].Time, job.avarage[i].avg], function(err, result) {
						done();
					});
				
			});
			cb();
		};
		
		function clearAvarage(err,client,done){
			client.query(
					' DROP TABLE public."A_1_daily_Aw"; ' +
                    'CREATE TABLE public."A_1_daily_Aw" ' +
					'( ' +
					'"Yun_ID" smallint, ' +
                    '"Slave_ID" smallint, ' +
					'"Sensor_ID" smallint, ' +
					'"Date" date, ' +
					'"Daily_Awarage" numeric ' +
					') ' +
					'WITH ( ' +
					'OIDS=FALSE ' +
					'); '+
					'ALTER TABLE public."A_1_daily_Aw" ' +
					'OWNER TO mark;', function(err, result) {
						done();
					});
		}
		
		return Reworker;
	}
})()

function buildStatement (insert, rows) {
  const params = []
  const chunks = []
  rows.forEach(row => {
    const valueClause = []
    row.forEach(p => {
      params.push(p)
      valueClause.push('$' + params.length)
    })
    chunks.push('(' + valueClause.join(', ') + ')')
  })
  return {
    statement: insert + chunks.join(', '),
    params: params
  }
}