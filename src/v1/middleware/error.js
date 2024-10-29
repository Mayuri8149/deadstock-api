const responseService = require('../services/responseService');
const { logger } = require('../startup/logger');
const config = require('config');

module.exports = (err, req, res, next) => {
    console.log("res",res)
    logger.error(err.message, err);
    const error = err.isJoi && err.details[0] ? err.details[0].message : null;
    responseService.returnError(res, 99999, null, error);
    
    // if(config.get("showSlackErrors")){
    //     const customError = err && err.message ? err.message : JSON.stringify(err);
    //     const err1 = new Error(customError);
    //     next(err1);
    // }
}