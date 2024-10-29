// ------------Start Rohini kamble (SCI-I771) 19/02/2021
//defualt import
const express = require('express');
const router = express.Router();
//services  import
const categoryService = require('../../services/categoryService');

router.post('/add_sub_sub_categories', async (req, res) => {
    const { category, sub_category, sub_sub_categories } = req.body;
    await categoryService.addMultipleSubSubCategories(category, sub_category, sub_sub_categories);
    req.app.responseHelper.send(res, true, {invalidCategoriesArr:global.invalidCategoriesArr}, [], 200);
});

router.get('/list/:sub_category/:page/:size', async (req, res) => {
    const { page, size, sub_category } = req.params;
    const filters = {
        search: req.query.search || "",
        moduleName: req.query.moduleName || "",
        moduleCode: req.query.moduleCode || "",
        sub_category
    }
    const result = await categoryService.getSubSubCategories(parseInt(page), parseInt(size), filters);
    req.app.responseHelper.send(res, true, result, [], 200);
});

router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;
    const result = await categoryService.deleteSubSubCategory({ id });
    if (!result) {
        let errors = [{
            "msg": "Something went wrong!"
        }];
        return req.app.responseHelper.send(res, false, errors, [], 500);
    }
    return req.app.responseHelper.send(res, true, result, [], 200);
});
// Start - Priyanka Patil (SNA-I71) 19-06-2021
router.put("/module/:id/changeDeleteStatus", (req, res) => {
    var moduleId = req.params.id;
    var module = {
        // Start - Priyanka Patil (SNA-I48) 25-06-2021
        isActive: req.body.isActive
        // End - Priyanka Patil (SNA-I48) 25-06-2021
    }
    categoryService.update(moduleId, module).then((result) => {
        if (result.isError || !(result.transtype && result.transtype._id)) {
            onError(req, res, result.errors, 500);
        } else {
            var module = result.transtype;
            req.app.responseHelper.send(res, true, module, [], 200);
        }
    });
});
// End - Priyanka Patil (SNA-I71) 19-06-2021

module.exports = router;
// ------------End Rohini kamble (SCI-I771) 19/02/2021