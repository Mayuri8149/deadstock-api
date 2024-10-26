var schema = require('./menuSchema');

var create = (menu) => {
	var promise = new Promise((resolve, reject) => {
		var document = new schema(menu);
		document.save().then(function(result) {
			var response = { isError: false, menu: result, errors: [] };
            resolve(response);
		}).catch((err) => {
            var response = { isError: true, menu: {}, errors: [] };
            resolve(response);
        });
	})
	return promise;
};

var list = () => {
    var promise = new Promise((resolve, reject) => {
        var data = {
            // isActive: true,
            // is_deleted: false
        };
        schema.find(data, (err, result) => {
            console.log('resu',result)
            console.log('err',err)
            
            if(!err && (result && result.length) ){
                var response = {isError: false, menus: result, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, menus: {}, errors: [{msg: "Invalid Data"}]};
                resolve(response);
            }
		});
    });
    return promise;
};

var upload = () => {
    if (err) {
        onError(req, res, [], 500, {});
        return;
    } else if (!req.file) {
        var errors = [{
            'msg': 'No File Passed.'
        }];
        onError(req, res, errors, 500, {});
        return;
    } else {
        req.app.responseHelper.send(res, true, {}, [], 200);
    }
};

module.exports = {
	create,
    list,
    upload
}