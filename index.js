(function () {
	'use strict';
	process.on('message', function(data){
		console.time(data.id);
		setTimeout(function(){
			console.timeEnd(data.id);
			process.send(data);
		}, data.block);
	});
})();