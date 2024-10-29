// ------------Start Rohini kamble (SCI-I771) 19/02/2021
//defualt import
const express = require('express');
const router = express.Router();
//services  import
const categoryService = require('../../services/categoryService');

router.post('/add_sub_categories', async (req, res) => {
    const { category, sub_categories } = req.body;
    await categoryService.addMultipleSubCategories(category, sub_categories);
    req.app.responseHelper.send(res, true, {invalidCategoriesArr:global.invalidCategoriesArr}, [], 200);
});

router.get('/list/:category/:page/:size', async (req, res) => {
    const { page, size, category } = req.params;
    const filters = {
        search: req.query.search || "",
        category
    }
    const result = await categoryService.getSubCategories(parseInt(page), parseInt(size), filters);
    //Start Mahalaxmi(SCI-I830) 07/05/2021
    let resultArr = [];
    const result1 = await categoryService.getSubSubCategoriesCountByCatId(result);
    result1.sort((a, b) => {
        if (a._id.sub_category < b._id.sub_category) {
            return 1;
        } 
        else {
            return -1;
        }
    });
    resultArr = [result,result1]
    req.app.responseHelper.send(res, true, resultArr, [], 200);
    //End Mahalaxmi(SCI-I830) 07/05/2021
});

router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;
    const result = await categoryService.deleteSubCategory({ id });
    if (!result) {
        let errors = [{
            "msg": "Something went wrong!"
        }];
        return req.app.responseHelper.send(res, false, errors, [], 500);
    }
    return req.app.responseHelper.send(res, true, {}, [], 200);
});

module.exports = router;
// ------------End Rohini kamble (SCI-I771) 19/02/2021