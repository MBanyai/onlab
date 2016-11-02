(function () {
	'use strict';
	process.on('message', function(data){
		//console.time(data.id);
//		setTimeout(function(){
			//console.timeEnd(data.id);
		/*	
			data.pool.connect(function(err, client, done) {
				if(err) {
					return console.error('error fetching client from pool', err);
				}
				client.query('INSERT INTO sensor (name) values($1)', [data.id], function(err, result) {
					//call `done()` to release the client back to the pool
					done();

				//	if(err) {
				//		return console.error('error running query', err);
				//	} 
				});
			});
			
			process.send(data.id);*/
			process.send(data);
			
//		}, data.block);
	});
})();