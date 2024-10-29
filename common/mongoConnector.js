const mongodb = require('mongodb').MongoClient;
var config = require('./../config/dev');

function getMongoDBObject(callback)
{
	mongodb.connect(config.MONGODB_URI, function(err, client) {
		if (err)
		{ 
			callback(err, null, null); 
			return; 
	    }
	    else
	    {
	    	callback(err, client, dbs); 
	      	return; 
	    }
	});
}

module.exports = {
	getMongoDBObject: getMongoDBObject,
}
