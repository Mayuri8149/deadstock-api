var express = require('express');
var router = express.Router();

router.use("/api/v1/user", require("../routes/v1/user/route"));
router.use("/api/v1/organization", require("../routes/v1/organization/route"));
router.use("/api/v1/department", require("../routes/v1/department/route"));
router.use("/api/v1/module", require("../routes/v1/module/route"));
router.use("/api/v1/batch", require("../routes/v1/batch/route"));
// router.use("/api/v1/transaction", require("../routes/v1/transaction/route"));
router.use("/api/v1/transtype", require("../routes/v1/transtype/route"));
router.use("/api/v1/corporate", require("../routes/v1/corporate/route"));
router.use("/api/v1/transactiontype", require("../routes/v1/transactiontype/route"));
router.use("/api/v1/categories", require("../routes/v1/categories"));
router.use("/api/v1/subcategories", require("../routes/v1/subcategories"));
router.use("/api/v1/subsubcategories", require("../routes/v1/subsubcategories"));
router.use("/api/v1/invitepartner", require("../routes/v1/invitepartner/route"));
router.use("/api/v1/useraccess", require("../routes/v1/useraccess/route"));
// router.use("/api/v1/assetcategory", require("../routes/v1/assetcategory/route"));
// router.use("/api/v1/asset", require("../routes/v1/asset/route"));
router.use("/api/v1/assettracebility", require("../routes/v1/assettracebility/route"));
router.use("/src/v1/asset", require("../src/v1/routes/asset"));
router.use("/src/v1/order", require("../src/v1/routes/order"));
router.use("/src/v1/eprOrder", require("../src/v1/routes/eprOrder"));
router.use("/src/v1/eprAsset", require("../src/v1/routes/eprAsset"));
router.use("/src/v1/branch", require("../src/v1/routes/branch"));
router.use("/src/v1/partner", require("../src/v1/routes/partner"));
router.use("/src/v1/state", require("../src/v1/routes/state"));

router.use("/api/v1/partners", require("../routes/v1/partners"));
router.use("/src/v1/assetcategory", require("../src/v1/routes/assetCategory"));
router.use("/src/v1/uom", require("../src/v1/routes/uom"));
router.use("/src/v1/assetprovenance", require("../src/v1/routes/assetprovenance"));
router.use("/src/v1/corporate", require("../src/v1/routes/corporate"));

router.use("/src/v1/nftdetails", require("../src/v1/routes/nftdetails"));
router.use("/api/v1/menu", require("../routes/v1/menu/route"));
module.exports = router;
