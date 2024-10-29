var validateData = (req) => {
	try {
		req.checkBody("email", "Email is required!").notEmpty();
		req.checkBody("entity", "Entity is required!").notEmpty();
		var errors = req.validationErrors();
	}catch(e) {
		var errors = [{msg: "Something went wrong!"}];
	}
	return errors;
}


module.exports = {
    validateData
}