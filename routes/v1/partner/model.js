var schema = require('./schema');
var mongoose = require('mongoose');

var findById = (id) => {
	var promise = new Promise((resolve, reject) => {
		var data = {
			_id: id
		};
		schema.findOne(data, (err, result) => {
			if (!err && result && result._id) {
				var response = { isError: false, partner: result, errors: [] };
				resolve(response);
			} else {
				var response = { isError: true, partner: {}, errors: [{ param: "id", msg: "Invalid partner id" }] };
				resolve(response);
			}
		});
	});

	return promise;
};

var create = (partner) => {
	var promise = new Promise((resolve, reject) => {
		var document = new schema(partner);
		document.save().then(function (result) {
			var response = { isError: false, partner: result, errors: [] };
			resolve(response);
		}).catch((err) => {
			var response = { isError: true, partner: {}, errors: [] };
			resolve(response);
		});
	})
	return promise;
};

var insertMany = (partners) => {
	var promise = new Promise((resolve, reject) => {
		schema.insertMany(partners, function (err, result) {
			if (!err) {
				var response = { isError: false, partners: result, errors: [] };
				resolve(response);
			} else {
				var response = { isError: true, partners: {}, errors: [] };
				resolve(response);
			}
		})
	})
	return promise;
};
// Start - Priyanka Patil (SCI-I744) 04-02-2021
//  Start- Priyanka Patil, 10-02-2021, SCI-I744
//  Start- Priyanka Patil, 10-03-2021, SCI-I821
var findByDID = (did, organizationId, batchId, moduleId, transactiontypeId) => {
	//  End- Priyanka Patil, 10-03-2021, SCI-I821
	var promise = new Promise((resolve, reject) => {
		var data = {
			code: did,
			organizationId: organizationId,
			moduleId: moduleId,
			// batchId: batchId
			//  Start- Priyanka Patil, 10-03-2021, SCI-I821
			// transactiontypeId:transactiontypeId
			//  End- Priyanka Patil, 10-03-2021, SCI-I821
		};
		//  End- Priyanka Patil, 10-02-2021, SCI-I744
		// End - Priyanka Patil (SCI-I744) 04-02-2021
		schema.findOne(data, (err, result) => {
			if (!err && result && result._id) {
				var response = { isError: false, partner: result, errors: [] };
				resolve(response);
			} else {
				var response = { isError: true, partner: {}, errors: [{ param: "id", msg: "Invalid partner id" }] };
				resolve(response);
			}
		});
	});

	return promise;
};

var list = (obj) => {
	var promise = new Promise((resolve, reject) => {
		var filter = [];

		var matchQuery = {
			organizationId: mongoose.Types.ObjectId(obj.organizationId),
		};

		if (obj.affiliateId) {
			matchQuery.affiliateId = mongoose.Types.ObjectId(obj.affiliateId)
		}

		if (obj.batchId) {
			matchQuery.batchId = mongoose.Types.ObjectId(obj.batchId)
		}

		filter.push({ $match: matchQuery }, { $sort: { createdAt: -1 } });

		filter.push({
			$lookup: {
				from: "batches",
				localField: "batchId",
				foreignField: "_id",
				as: "batch"
			}
		});


		filter.push({
			$unwind: {
				"path": "$batch",
				"preserveNullAndEmptyArrays": true
			}
		});

		var query = schema.aggregate(filter);

		query.exec((err, partners) => {
			if (!err || partners) {
				var response = { isError: false, partners: partners };
				resolve(response);
			} else {
				var response = { isError: true, partners: [] };
				resolve(response);
			}
		});
	});
	return promise;
};

//  Start- Mahalaxmi, 12-01-2021, SCI-I579
var listNew = (obj) => {
	var filter = [];
	var reviewerPartners = [];
	var managerPartners = [];
	var matchQuery = {};

	if (obj.role == 'reviewer') {
		matchQuery = { $or: [{ "status": "new" }, { "status": "under review" }] }
	} else if (obj.role == 'manager') {
		matchQuery = { $or: [{ "status": "new" }, { "status": "reviewed" }] }
	}

	if (obj.organizationId) {
		matchQuery.organizationId = mongoose.Types.ObjectId(obj.organizationId)
	}

	if (obj.batchId) {
		matchQuery.batchId = mongoose.Types.ObjectId(obj.batchId)
	}

	filter.push({ $match: matchQuery }, { $sort: { createdAt: -1 } });

	filter.push({
		$lookup: {
			from: "batches",
			localField: "batchId",
			foreignField: "_id",
			as: "batch"
		}
	});


	filter.push({
		$unwind: {
			"path": "$batch",
			"preserveNullAndEmptyArrays": true
		}
	});

	filter.push({
		$lookup: {
			from: "departments",
			localField: "batch.departmentId",
			foreignField: "_id",
			as: "department"
		}
	});

	filter.push({
		$unwind: {
			"path": "$department",
			"preserveNullAndEmptyArrays": true
		}
	});
	//  Start- Shubhangi, 11-03-2021, SCI-I823 -->
	filter.push({
		"$lookup": {
			from: "users",
			localField: "updatedBy",
			foreignField: "_id",
			as: "updatedBy"
		}
	});

	filter.push({
		$unwind: "$updatedBy"
	});

	filter.push({
		$lookup: {
			from: "users",
			localField: "createdBy",
			foreignField: "_id",
			as: "createdBy"
		}
	});

	filter.push({
		$unwind: {
			"path": "$createdBy"
		}
	});
	//  End- Shubhangi, 01-04-2021, SCI-I823 -->
	var promise = new Promise((resolve, reject) => {
		var query = schema.aggregate(filter);

		query
			.exec((err, partners) => {
				if (!err || partners) {
					//BOF- Mahalaxmi,14-12-2020 and SCI-I525
					var partner = [];
					for (var i = 0; i < partners.length; i++) {
						var records = partners[i];
						if (records) {
							if (obj.departmentId == partners[i].batch.departmentId) {
								partner.push(partners[i]);
							} else {
							}
						} else {
						}
					}
					// EOF- Mahalaxmi,14-12-2020 and SCI-I525
					var lenStud = 0;
					for (var i = 0; i < partner.length; i++) {
						if (obj.role == 'reviewer') {
							if ((partner[i].status !== 'reviewed') || (partner[i].status == 'under review') || (partner[i].status == 'new')) {
								reviewerPartners.push(partners[i]);
							}
						} else if (obj.role == "manager") {
							if (partner[i].status == 'reviewed' || partner[i].status == 'new') {
								managerPartners.push(partners[i]);
							}
						}

					}

					if (obj.role == 'reviewer') {
						lenStud = reviewerPartners.length;
					} else if (obj.role == 'manager') {
						lenStud = managerPartners.length;
					} else {
						lenStud = partner.length;
					}

					//	var response = { isError: false, partners: partners };
					resolve(lenStud);
				} else {
					//var response = { isError: true, partners: [] , totalCount:0 };
					resolve(0);
				}
			});
	}).then(function (response) {
		return new Promise((resolve, reject) => {

			var query = schema.aggregate(filter);

			query
				.skip(parseInt(obj.skip))
				.limit(parseInt(obj.limit))
				//  Start- Shubhangi, 05-02-2020, SCI-I749
				.sort({ updatedAt: -1 })
				//  End- Shubhangi, 06-02-2020, SCI-I749
				.exec((err, partners) => {

					if (!err || partners) {
						//BOF- Mahalaxmi,14-12-2020 and SCI-I525
						var partner = [];
						for (var i = 0; i < partners.length; i++) {
							var records = partners[i];
							if (records) {
								if (obj.departmentId == partners[i].batch.departmentId) {
									partner.push(partners[i]);
								} else {
								}
							} else {
							}
						}
						//EOF- Mahalaxmi,14-12-2020 and SCI-I525
						var response1 = {
							isError: false,
							partner: partner, totalCount: response
						};
						resolve(response1);

					} else {
						var response1 = {
							isError: true,
							partner: [], totalCount: 0
						};
						resolve(response1);
					}
				});
		});
	});
	return promise;
};
//  End- Mahalaxmi, 12-01-2021, SCI-I579

var update1 = (id, partner) => {
	var promise = new Promise((resolve, reject) => {
		draftSchema.findOneAndUpdate({ '_id': id }, { $set: partner }, { new: true }, (error, result) => {
			if (error) {
				var response = { isError: true, partner: {}, errors: [{ "msg": "Enter Valid Data for each field!" }] };
				resolve(response);
			} else {
				var response = { isError: false, partner: result, errors: [] };
				resolve(response);
			}
		});
	});
	return promise;
};

var changeStatus = (data) => {
	var promise = new Promise((resolve, reject) => {
		let changes = {
			status: data.status,
			reviewers: data.reviewers,
			//  Start- Shubhangi, 05-02-2020, SCI-I749
			updatedBy: data.updatedBy
			//  End- Shubhangi, 06-02-2020, SCI-I749
		};

		if (data.comments) {
			changes.comments = data.comments;
		}

		schema.updateMany({ _id: data.partnerId }, { $set: changes }, (err, result) => {
			if (!err) {
				var response = { isError: false, errors: [] };
				resolve(response);
			} else {
				var response = { isError: true, errors: [{ msg: "failed to update the partner status" }] };
				resolve(response);
			}
		});
	});
	return promise;
};
// Start - Priyanka Patil (SCI-I824) 12-03-2021
var updateTranstype = (partnerId, transactiontypeId) => {
	var promise = new Promise((resolve, reject) => {
		schema.updateMany({ _id: { $in: partnerId } }, { $set: { transactiontypeId: transactiontypeId } }, (err, result) => {
			if (!err) {
				var response = { isError: false, errors: [] };
				resolve(response);
			} else {
				var response = { isError: true, errors: [{ msg: "failed to update the partner status" }] };
				resolve(response);
			}
		});
	});
	return promise;
};
// End - Priyanka Patil (SCI-I824) 12-03-2021

// Start - Priyanka Patil (SCI-I824) 12-03-2021
var findByCodes = (codes, organizationId, status) => {
	// End - Priyanka Patil (SCI-I824) 12-03-2021
	var promise = new Promise((resolve, reject) => {

		var filter = {};
		if (organizationId) {
			filter.organizationId = mongoose.Types.ObjectId(organizationId);
		}

		filter.code = { $in: codes };
		//  Start- Shubhangi, 30-01-2021, SCI-I516
		filter.status = 'reviewed'
		//  End- Shubhangi, 30-01-2021, SCI-I516
		schema.find(filter, (err, result) => {
			if (!err && result && result.length) {
				// Start - Priyanka Patil (SCI-I744) 02-03-2021
				var response = { isError: false, partners: result, err: [] };
				resolve(response);
			} else {
				var response = { isError: true, partners: [], err: [{ msg: "Invalid Partners" }] };
				// End - Priyanka Patil (SCI-I744) 02-03-2021
				resolve(response);
			}
		})
	})
	return promise;
};
//  Start- Priyanka Patil, 10-02-2021, SCI-I744
var findByDids = (codes, batchId, organizationId, moduleId, status) => {
	var promise = new Promise((resolve, reject) => {

		var filter = {};

		filter.did = { $in: codes };
		filter.organizationId = { $in: mongoose.Types.ObjectId(organizationId) };
		filter.moduleId = { $in: mongoose.Types.ObjectId(moduleId) };
		filter.status = { $ne: 'rejected' };
		//  End- Priyanka Patil, 10-02-2021, SCI-I744
		if (status) {
			filter.status.$eq = status;
		}
		schema.find(filter, (err, result) => {
			if (!err && result && result.length) {
				var response = { isError: false, partners: result, errors: [] };
				resolve(response);
			} else {
				var response = { isError: false, errors: [{ msg: "Invalid Partners" }], partners: [] };
				resolve(response);
			}
		})
	})
	return promise;
};

var findByStatus = (data) => {
	var promise = new Promise((resolve, reject) => {
		var filter = {};

		filter.affiliateId = data.affiliateId;
		filter.batchId = data.batchId;
		filter.status = 'reviewed';

		schema.find(filter, (err, result) => {
			if (!err && result && result.length) {
				var response = { isError: false, errors: [], partners: result };
				resolve(response);
			} else {
				var response = { isError: false, errors: [{ msg: "Can't update batch data!" }], partners: [] };
				resolve(response);
			}
		});
	});
	return promise;
};

var update = (id, data) => {
	var promise = new Promise((resolve, reject) => {

		id = mongoose.Types.ObjectId(id);

		if (data.userId) {
			data.userId = mongoose.Types.ObjectId(data.userId);
		}

		if (data.code) {
			data.code = data.code;
		}

		schema.findOneAndUpdate({ _id: id }, { $set: data }, (err, result) => {
			if (!err) {
				var response = { isError: false, errors: [], result: result };
				resolve(response);
			} else {
				var response = { isError: true, errors: [{ msg: "failed to update the partner status" }] };
				resolve(response);
			}
		});
	});
	return promise;
};
// Start - Priyanka Patil (SCI-I744) 04-02-2021
var findByUserId = (code) => {
	var promise = new Promise((resolve, reject) => {
		//Start - Mayuri Kate - SCI-681 - 10-02-2021
		var data = {
			userId: code
		};
		//End - Mayuri Kate - SCI-681 - 10-02-2021
		schema.findOne(data, (err, result) => {
			if (!err && result && result.code) {
				// End - Priyanka Patil (SCI-I744) 04-02-2021
				var response = { isError: false, partner: result, errors: [] };
				resolve(response);
			} else {
				var response = { isError: true, partner: {}, errors: [{ param: "id", msg: "Invalid partner id" }] };
				resolve(response);
			}
		});
	});

	return promise;
};

var updateEmail = (updatedResult, data) => {
	var promise = new Promise((resolve, reject) => {

		var dataResult = {
			newEmail: data.newEmail
		}

		schema.updateOne({
			did: updatedResult.did
		}, {
			$set: dataResult
		}, (err, result) => {
			if (!err) {
				var response = {
					isError: false,
					errors: []
				};
				resolve(response);
			} else {
				var response = {
					isError: true,
					errors: [{
						msg: "failed to update the partner email"
					}]
				};
				resolve(response);
			}
		});
	});
	return promise;
};

/* Start 21-12-2020 Priyanka Patil SCI-I619 */
//  Start- Priyanka Patil, 10-02-2021, SCI-I744
var findByEmail = (data) => {
	var promise = new Promise((resolve, reject) => {

		var filter = [];

		var matchQuery = {
			email: data.email,
		};

		if (data.organizationId) {
			matchQuery.organizationId = mongoose.Types.ObjectId(data.organizationId)
		}
		//  Start- Priyanka Patil, 10-03-2021, SCI-I821
		if (data.transactiontypeId) {
			matchQuery.transactiontypeId = mongoose.Types.ObjectId(data.transactiontypeId)
		}
		//  End- Priyanka Patil, 10-03-2021, SCI-I821
		//  End- Priyanka Patil, 10-02-2021, SCI-I744
		filter.push({ $match: matchQuery });

		var query = schema.aggregate(filter);

		query.exec((err, users) => {

			if (!err || users.length) {
				var response = { isError: false, user: users[0] };
				resolve(response);
			} else {
				var response = { isError: true, user: {} };
				resolve(response);
			}
		});

	});

	return promise;
};
/* End 21-12-2020 Priyanka Patil SCI-I619 */

var findByDetail = (payload) => {
	var promise = new Promise((resolve, reject) => {

		var filter = [];

		var matchQuery = {
			email: payload.emailId.value,
			firstName: payload.FirstName.value,
			lastName: payload.LastName.value,
			batchId: payload.batchId,
			affiliateId: payload.affiliateId,
			organizationId: payload.organizationId,
			//moduleId: payload.moduleId,
			//isActive:true

		};

		filter.push({ $match: matchQuery });

		var query = schema.aggregate(filter);

		query.exec((err, users) => {

			if (!err && users && users.length) {
				var response = { isError: false, user: users[0] };
				resolve(response);
			} else {
				var response = { isError: true, user: {} };
				resolve(response);
			}
		});

	});

	return promise;
};

var findByPartnerCodes = (codes, status) => {
	var promise = new Promise((resolve, reject) => {

		var filter = {};
		// if(batchId) {
		// 	filter.batchId = mongoose.Types.ObjectId(batchId);
		// }
		// if(organizationId) {
		// 	filter.organizationId = mongoose.Types.ObjectId(organizationId);
		// }
		// if(affiliateId) {
		// 	filter.affiliateId = mongoose.Types.ObjectId(affiliateId);
		// }
		filter.code = { $in: codes };
		filter.status = { $ne: 'rejected' };

		if (status) {
			//filter.status.$eq = status;
		}
		schema.find(filter, (err, result) => {

			if (!err && result && result.length) {
				var response = { isError: false, partners: result, errors: [] };
				resolve(response);
			} else {
				var response = { isError: false, errors: [{ msg: "Invalid Partners" }], partners: [] };
				resolve(response);
			}
		})
	})
	return promise;
};

//Start- Mahalaxmi Nakade, 18-02-2021, SCI-I782
var findstudByDID = (did) => {
	var promise = new Promise((resolve, reject) => {
		var data = {
			code: did
		};
		schema.findOne(data, (err, result) => {
			if (!err && result && result._id) {
				var response = { isError: false, partner: result, errors: [] };
				resolve(response);
			} else {
				var response = { isError: true, partner: {}, errors: [{ param: "id", msg: "Invalid partner id" }] };
				resolve(response);
			}
		});
	});

	return promise;
};
//  End- Mahalaxmi Nakade, 18-02-2021, SCI-I782
var addUpdatePartnerDetail = async (partner_data, emailDID, requiredData) => {

	const filter = { email: partner_data.email };

	const insertDoc = {
		code: emailDID, did: emailDID, batchId: requiredData.batch_id,
		organizationId: requiredData.organization_id
	};

	for (var key in partner_data) {
		if (partner_data.hasOwnProperty(key) && partner_data[key] != '') {
			insertDoc[key] = partner_data[key];
		}
	}

	let partnerData = await schema.findOneAndUpdate(filter,
		{ $setOnInsert: insertDoc },
		{
			new: true,
			upsert: true // Make this update into an upsert
		});

	return partnerData;

}

module.exports = {
	create,
	insertMany,
	list,
	update,
	findById,
	changeStatus,
	findByCodes,
	findByStatus,
	findByUserId,
	findByDID,
	findByDids,
	updateEmail,
	listNew,
	findByEmail,
	findByDetail,
	findByPartnerCodes,
	//  Start- Mahalaxmi Nakade, 18-02-2021, SCI-I782
	findstudByDID,
	//  End- Mahalaxmi Nakade, 18-02-2021, SCI-I782

	// Start - Priyanka Patil (SCI-I824) 12-03-2021
	updateTranstype,
	// End - Priyanka Patil (SCI-I824) 12-03-2021
	addUpdatePartnerDetail
};