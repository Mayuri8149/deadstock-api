// ------------Start Rohini kamble (SCI-I771) 19/02/2021
//defualt import
const express = require('express');
const router = express.Router();
//services  import
const categoryService = require('../../services/categoryService');

router.post('/add_categories', async (req, res) => {
    const categories = req.body.categories;
    await categoryService.addMultipleCategories(categories);
    req.app.responseHelper.send(res, true, {invalidCategoriesArr:global.invalidCategoriesArr}, [], 200);
});

router.get('/list/:page/:size', async (req, res) => {
    const { page, size } = req.params;
    const filters = {
        search: req.query.search || ""
    }
    const result = await categoryService.getCategories(parseInt(page), parseInt(size), filters);
    //Start Mahalaxmi(SCI-I830) 07/05/2021
    let resultArr = [];
    const result1 = await categoryService.getSubCategoriesCountByCatId(result);
    result1.sort((a, b) => {
        if (a._id.category < b._id.category) {
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
    const result = await categoryService.deleteCategory(id);
    if (!result) {
        let errors = [{
            "msg": "Something went wrong!"
        }];
        return req.app.responseHelper.send(res, false, errors, [], 500);
    }
    return req.app.responseHelper.send(res, true, {}, [], 200);
});

router.post('/search_categories/:page/:size', async (req, res) => {
    const { page, size } = req.params;
    const filters = req.body;
    const result = await categoryService.searchCategories(parseInt(page), parseInt(size), filters);
    req.app.responseHelper.send(res, true, result, [], 200);
});

module.exports = router;
// ------------End Rohini kamble (SCI-I771) 19/02/2021