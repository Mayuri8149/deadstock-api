const express = require('express');
const router = express.Router();
const partnerService = require('../../services/partnerService');

router.get('/getPartnersList', async (req, res) => {
    const payloadData = req.query;
    const result = await partnerService.getPartnersList(payloadData);

    req.app.responseHelper.send(res, true, result, [], 200);
});

module.exports = router;