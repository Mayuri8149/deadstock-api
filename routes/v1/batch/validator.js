var batch = (req, module) => {
	try {
		req.checkBody("organizationId", "Organization ID is required!").notEmpty();
		//req.checkBody("affiliateId", "Affiliate ID is required!").notEmpty();
		req.checkBody("moduleId", "Module ID is required!").notEmpty();
		req.checkBody("code", "Batch ID is required!").notEmpty().trim().escape().matches(/^[ A-Za-z0-9_@./#&+-]*$/gi);
// ------------Start Rohini Kamble (SCI-I660) 22/12/2020------------------------------
		req.checkBody("year", "Batch Year cannot be less than 4 digit!").notEmpty().isNumeric().isLength({ min: 4});
		req.checkBody("year", "Batch Year cannot be more than 4 digit!").notEmpty().isNumeric().isLength({ max: 4});
// -----------End Rohini Kamble (SCI-I660) 22/12/2020----------------------------------
		req.checkBody("start", "Batch start year is required!").notEmpty().trim().escape();
		req.checkBody("end", "Batch end year is required!").notEmpty().trim().escape();
		//req.checkBody("type", "Batch type is required!").notEmpty();

		// var batchType = req.body.type;
		// if(batchType == 'Active' && (module.type !== 'Certification Program')) {
		// 	req.checkBody("minScore", "Min Score is required!").notEmpty();
		// 	req.checkBody("totalScore", "Total Score is required!").notEmpty();
		// }

		var errors = req.validationErrors();
	}catch(e) {
		var errors = [{msg: "Something went wrong!"}];
	}

	return errors;
}

module.exports = {
    batch
}