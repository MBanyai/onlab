'use strict';

var fs = require('fs'); 
module.exports = function (own){
	fs.writeFile("./logs/"+own+".log","Logger is created for "+own +"\n");
	return{
		owner: own,
		log: function (message){
			if(typeof message === "string")
				fs.appendFile("./logs/"+this.owner+".log", message + "\n");
			else
				fs.appendFile("./logs/"+this.owner+".log", "It's not a string!\n");
		}
	}
}

		
		
