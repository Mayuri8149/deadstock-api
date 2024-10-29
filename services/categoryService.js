// ------------Start Rohini kamble (SCI-I771) 19/02/2021
const { Categories, ObjectId } = require('../models/categories');
const { SubCategories } = require('../models/subCategories');
const { SubSubCategories } = require('../models/subSubCategories');
const { getIncrementalCode } = require('../models/counters');
const Module = require('../routes/v1/module/schema');
// Start - Priyanka Patil (SNA-I48) 25-06-2021
const addMultipleCategories = async (categories = []) => {
// End - Priyanka Patil (SNA-I48) 25-06-2021
    const categoriesArr = [];
    let invalidCategoriesArr = []
    for (let category of categories) {
        let categoryObj = {
            code: "CAT" + Math.floor(Math.random() * 90 + 10),
            name: category
        };
        // Start - Priyanka Patil (SNA-I48) 25-06-2021
        let checkExist = await Categories.findOne({name:categoryObj.name,is_deleted:false})
        // End - Priyanka Patil (SNA-I48) 25-06-2021
        if(checkExist){
            // Start - Priyanka Patil (SNA-I48) 25-06-2021
            invalidCategoriesArr.push(categoryObj);
            // End - Priyanka Patil (SNA-I48) 25-06-2021
        }else{
            categoriesArr.push(categoryObj);
        }
    }
    global.invalidCategoriesArr = invalidCategoriesArr
    return await Categories.insertMany(categoriesArr);
}

const getCategories = async (page, size, filters = {}) => {
    let start_index = ((page * size) - size) || 0;
    let conditionObj = {
        isActive: true,
        is_deleted: false
    };
    if ("search" in filters) {
        conditionObj.name = { $regex: filters.search, $options: "i" }
    }

    const aggregateArr = [
        {
            $match: conditionObj
        },
        {
            $project: {
                name: 1,
                code: 1,
                created_on: 1
            }
        },
        {
            $sort: {
                _id: -1
            }
        }
    ];

    //pagination code
    let paginationResultArr = [];
    paginationResultArr.push({ $skip: start_index || 0 });

    if (size)
        paginationResultArr.push({ $limit: size });

    aggregateArr.push({
        $facet: {
            paginatedResults: paginationResultArr,
            totalCount: [
                {
                    $count: 'count'
                }
            ]
        }
    });

    // return await Categories.aggregate(aggregateArr).allowDiskUse(true);;
    const categoriesResultArr = await Categories.aggregate(aggregateArr).allowDiskUse(true);
    const responseObj = {
        'categories': categoriesResultArr[0]['paginatedResults'],
        'total_count': categoriesResultArr[0]['totalCount'] && categoriesResultArr[0]['totalCount'].length ? categoriesResultArr[0]['totalCount'][0]['count'] : 0
    };
    return responseObj;
}

const addMultipleSubCategories = async (category, subCategories = []) => {
    const categoriesArr = [];
    let invalidCategoriesArr = []
    for (let subCategory of subCategories) {
        let categoryObj = {
            code: "SUBCAT" + Math.floor(Math.random() * 90 + 10),
            name: subCategory,
            category
        };
        // Start - Priyanka Patil (SNA-I48) 25-06-2021
        let checkExist = await SubCategories.findOne({name:categoryObj.name,is_deleted:false})
        // End - Priyanka Patil (SNA-I48) 25-06-2021
        if(checkExist){
            // Start - Priyanka Patil (SNA-I48) 25-06-2021
            invalidCategoriesArr.push(categoryObj);
            // End - Priyanka Patil (SNA-I48) 25-06-2021
        }else{
            categoriesArr.push(categoryObj);
        }
        
    }
    global.invalidCategoriesArr = invalidCategoriesArr
    return await SubCategories.insertMany(categoriesArr);
}

const getSubCategories = async (page, size, filters = {}) => {
    let start_index = ((page * size) - size) || 0;
    let conditionObj = {
        isActive: true,
        is_deleted: false,
        category: ObjectId(filters.category)
    };
    if ("search" in filters) {
        conditionObj.name = { $regex: filters.search, $options: "i" }
    }

    const aggregateArr = [
        {
            $match: conditionObj
        },
        {
            $project: {
                //Start Mahalaxmi(SCI-I830) 10/05/2021
                category:1,
                //End Mahalaxmi(SCI-I830) 10/05/2021
                name: 1,
                code: 1,
                created_on: 1
            }
        },
        {
            $sort: {
                _id: -1
            }
        }
    ];

    //pagination code
    let paginationResultArr = [];
    paginationResultArr.push({ $skip: start_index || 0 });

    if (size)
        paginationResultArr.push({ $limit: size });

    aggregateArr.push({
        $facet: {
            paginatedResults: paginationResultArr,
            totalCount: [
                {
                    $count: 'count'
                }
            ]
        }
    });

    // return await Categories.aggregate(aggregateArr).allowDiskUse(true);;
    const categoriesResultArr = await SubCategories.aggregate(aggregateArr).allowDiskUse(true);
    const responseObj = {
        'sub_categories': categoriesResultArr[0]['paginatedResults'],
        'total_count': categoriesResultArr[0]['totalCount'] && categoriesResultArr[0]['totalCount'].length ? categoriesResultArr[0]['totalCount'][0]['count'] : 0
    };
    return responseObj;
}


const addMultipleSubSubCategories = async (category, sub_category, subSubCategories = []) => {
    const subsubcategoriesArr = [];
    let invalidCategoriesArr = []
    for (let subSubCategory of subSubCategories) {
        let categoryObj = {
            code: subSubCategory.code,
            name: subSubCategory.name,
            category,
            sub_category
        };
        // Start - Priyanka Patil (SNA-I48) 25-06-2021
        let checkExist = await Module.findOne({code:categoryObj.code,is_deleted:false})
        // End - Priyanka Patil (SNA-I48) 25-06-2021
        if(checkExist){
            invalidCategoriesArr.push(categoryObj);
        }else{
            subsubcategoriesArr.push(categoryObj);
        }
    }
    global.invalidCategoriesArr = invalidCategoriesArr
    return await Module.insertMany(subsubcategoriesArr);
}

const getSubSubCategories = async (page, size, filters = {}) => {
    let start_index = ((page * size) - size) || 0;
    let conditionObj = {
        // isActive: true,
        is_deleted: false,
        sub_category: ObjectId(filters.sub_category),
        // Start - Priyanka Patil (SNA-I11) 01-06-2021
        organizationId: undefined
        // End - Priyanka Patil (SNA-I11) 01-06-2021
    };
    if (filters.moduleCode) {
        conditionObj["code"] = { $regex: filters.moduleCode, $options: "i" }
    }
    if (filters.moduleName) {
        conditionObj["name"] = { $regex: filters.moduleName, $options: "i" }
    }
    if ("search" in filters) {
        conditionObj.name = { $regex: filters.search, $options: "i" },
        conditionObj.code = { $regex: filters.search, $options: "i" }
    }
    console.log("filters",filters)

    const aggregateArr = [
        {
            $match: conditionObj
        },
        {
            $project: {
                name: 1,
                code: 1,
                created_on: 1
            }
        },
        {
            $sort: {
                _id: -1
            }
        }
    ];

    //pagination code
    let paginationResultArr = [];
    paginationResultArr.push({ $skip: start_index || 0 });

    if (size)
        paginationResultArr.push({ $limit: size });

    aggregateArr.push({
        $facet: {
            paginatedResults: paginationResultArr,
            totalCount: [
                {
                    $count: 'count'
                }
            ]
        }
    });

    const categoriesResultArr = await Module.aggregate(aggregateArr).allowDiskUse(true);
    const responseObj = {
        'sub_sub_categories': categoriesResultArr[0]['paginatedResults'],
        'total_count': categoriesResultArr[0]['totalCount'] && categoriesResultArr[0]['totalCount'].length ? categoriesResultArr[0]['totalCount'][0]['count'] : 0
    };
    return responseObj;
}

function isEmptyObject(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

const deleteSubSubCategory = async (filterObj) => {
    if (isEmptyObject(filterObj)) {
        return false;
    }
    let whereObj = {};

    if ("id" in filterObj) {
        whereObj["_id"] = ObjectId(filterObj.id);
    }

    if ("category" in filterObj) {
        whereObj["category"] = ObjectId(filterObj.category);
    }

    if ("sub_category" in filterObj) {
        whereObj["sub_category"] = ObjectId(filterObj.sub_category);
    }

    return await Module.updateMany(whereObj, { $set: { is_deleted: true } });
}

const deleteSubCategory = async (filterObj) => {
    if (isEmptyObject(filterObj)) {
        return false;
    }
    let subwhereObj = {};
    let subSubWhereObj = {};

    if ("id" in filterObj) {
        subwhereObj["_id"] = ObjectId(filterObj.id);
        subSubWhereObj["sub_category"] = ObjectId(filterObj.id);
    }

    if ("category" in filterObj) {
        subwhereObj["category"] = ObjectId(filterObj.category);
        subSubWhereObj["category"] = ObjectId(filterObj.category);
    }

    await SubCategories.updateMany(subwhereObj, { $set: { is_deleted: true } });
    return await deleteSubSubCategory(subSubWhereObj);
}

const deleteCategory = async (categoryId) => {
    if (!categoryId) {
        return false;
    }
    let whereObj = {
        _id: ObjectId(categoryId)
    };
    let subWhereObj = {
        category: ObjectId(categoryId)
    };

    await Categories.updateMany(whereObj, { $set: { is_deleted: true } });
    //delete sub sub categories.
    return await deleteSubCategory(subWhereObj);
}


const searchCategories = async (page, size, filter = {}) => {
    let start_index = ((page * size) - size) || 0;
    const { category, sub_category, sub_sub_category, search } = filter;
    const whereObj = {
        // Start - Priyanka Patil (SNA-I11) 01-06-2021
        // isActive: true,
        is_deleted: false
        // End - Priyanka Patil (SNA-I11) 01-06-2021
    };

    if (category) {
        whereObj["category._id"] = ObjectId(category)
    }

    if (sub_category) {
        whereObj["sub_category._id"] = ObjectId(sub_category)
    }

    if (sub_sub_category) {
        whereObj["_id"] = ObjectId(sub_sub_category)
    }

    if (search) {
        whereObj['$and'] = [{
            $or: [
                { 'name': { $regex: `${search}`, $options: "i" } },
                { 'sub_category.name': { $regex: `${search}`, $options: "i" } },
                { 'category.name': { $regex: `${search}`, $options: "i" } }
            ]
        }]
    }

    const aggregateArr = [
        {
            $lookup: {
                'from': 'subcategories',
                'localField': 'sub_category',
                'foreignField': '_id',
                'as': 'sub_category'
            }
        },
        {
            $unwind: "$sub_category"
        },
        {
            $lookup: {
                'from': 'categories',
                'localField': 'category',
                'foreignField': '_id',
                'as': 'category'
            }
        },
        {
            $unwind: "$category"
        },
        {
            $match: whereObj
        },
        { '$match': { organizationId:  undefined } },
        {
            $project: {
                'sub_sub_category.name': '$name',
                'sub_sub_category._id': '$_id',
                'sub_sub_category.code': '$code',
                // Start - Priyanka Patil (SNA-I71) 19-06-2021
                'sub_sub_category.is_deleted': '$is_deleted',
                // End - Priyanka Patil (SNA-I71) 19-06-2021
                // Start - Priyanka Patil (SNA-I48) 25-06-2021
                'sub_sub_category.isActive': '$isActive',
                // End - Priyanka Patil (SNA-I48) 25-06-2021
                'sub_category.name': 1,
                'sub_category._id': 1,
                'category.name': 1,
                'category._id': 1,
                'credentical_type.name': 'Test Name',
                'credentical_type._id': 'test id',
                // '_id': 0
            },
        },
        {
            $sort: {
                _id: -1
            }
        }
    ];

    //pagination code
    let paginationResultArr = [];
    paginationResultArr.push({ $skip: start_index || 0 });

    if (size)
        paginationResultArr.push({ $limit: size });

    aggregateArr.push({
        $facet: {
            paginatedResults: paginationResultArr,
            totalCount: [
                {
                    $count: 'count'
                }
            ]
        }
    });

    const categoriesResultArr = await Module.aggregate(aggregateArr).allowDiskUse(true);
    const responseObj = {
        'total_count': categoriesResultArr[0]['totalCount'] && categoriesResultArr[0]['totalCount'].length ? categoriesResultArr[0]['totalCount'][0]['count'] : 0,
        'list': categoriesResultArr[0]['paginatedResults']
    };
    return responseObj;
}

 //Start Mahalaxmi(SCI-I830) 07/05/2021
const getSubCategoriesCountByCatId = async (obj) => {
    let whereObj={};
        
    whereObj.isActive = true;
    whereObj.is_deleted = false;
    
    const aggregateArr = [
        {
            $match: whereObj
        },
        {
            $project: {
                data:1,     
                category:'$category'               
            }
        },
        {
            $group: {
                _id: { category: "$category" },
                numberofCat: { $sum: 1 }
            }
        },
    ]
    const categoriesResultArr = await SubCategories.aggregate(aggregateArr).allowDiskUse(true);
    return categoriesResultArr;
};
 //End Mahalaxmi(SCI-I830) 07/05/2021

 
 //Start Mahalaxmi(SCI-I830) 08/05/2021
const getSubSubCategoriesCountByCatId = async (obj) => {
    let whereObj={};
        
    // whereObj.isActive = true;
    whereObj.is_deleted = false;
    // Start - Priyanka Patil (SNA-I48) 25-06-2021
    whereObj.organizationId = undefined;
    // End - Priyanka Patil (SNA-I48) 25-06-2021
    const aggregateArr = [
        {
            $match: whereObj
        },
        {
            $project: {
                data:1,     
                sub_category:'$sub_category'               
            }
        },
        {
            $group: {
                _id: { sub_category: "$sub_category" },
                numberofCat: { $sum: 1 }
            }
        },
    ]
    const subSubcategoriesResultArr = await Module.aggregate(aggregateArr).allowDiskUse(true);
    return subSubcategoriesResultArr;
};
 //End Mahalaxmi(SCI-I830) 08/05/2021
// Start - Priyanka Patil (SNA-I71) 19-06-2021
 var update = (id, transtype) => {
	var promise = new Promise((resolve, reject) => {
		Module.findOneAndUpdate({ '_id': id }, { $set : transtype }, { new : true }, (error, result) =>{
			if(error) {
				var response = { isError: true, transtype: {}, errors: [{"msg": "Failed to update transaction image!"}] };
            	resolve(response);
			} else {
				var response = { isError: false, transtype: result, errors: [] };
            	resolve(response);
			}
		})
	});
	return promise;
};
// End - Priyanka Patil (SNA-I71) 19-06-2021
module.exports = {
    addMultipleCategories,
    getCategories,
    addMultipleSubCategories,
    getSubCategories,
    addMultipleSubSubCategories,
    getSubSubCategories,
    deleteCategory,
    deleteSubCategory,
    deleteSubSubCategory,
    searchCategories,
    //Start Mahalaxmi(SCI-I830) 07/05/2021
    getSubCategoriesCountByCatId,
    getSubSubCategoriesCountByCatId,
    // Start - Priyanka Patil (SNA-I71) 19-06-2021
    update
    // End - Priyanka Patil (SNA-I71) 19-06-2021
    //End Mahalaxmi(SCI-I830) 07/05/2021
}
// ------------End Rohini kamble (SCI-I771) 19/02/2021