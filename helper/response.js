var responseHelper = {
    send: function(res, success, data, errors, status) {
        success = (success) ? true : false;
        errors = errors || null;
        data = data || null;
        status = status || 200;

        var obj = {
            success: success,
            errors: errors
        };

        obj.data = data;
        res.status(status);
        res.json(obj);
    },
    formatResponse: function(errors) {
        var errorResponse = [];
        for (var i in errors) {
            var obj = {
                "location": "body",
                "parameter": i,
                "msg": errors[i].message
            }
            errorResponse.push(obj);
        }
        return errorResponse;
    }
}

module.exports = responseHelper;