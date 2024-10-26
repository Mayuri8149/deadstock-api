var jwt = require('jsonwebtoken');
var config = require('../config/dev');
var moment = require("moment");

const REFRESH_TOKEN_EXPIRE_TIME = 24 * 60 * 60 * 1000;

//const REFRESH_TOKEN_EXPIRE_TIME = 500;

var excluedRoutes = [
    
    '/api/v1/user/signin',
    '/api/v1/user/forgotpassword',
    '/api/v1/user/resetpassword',
    '/api/v1/organization/register',
    '/api/v1/user/resendOtpCall',    
    '/api/v1/user/otpShowHide',
    '/api/v1/corporate/register',
    '/src/v1/corporate/register',
    /*  Start- Name -Shubhangi, Date Of Code - 20-01-2021 zoho Task Number -SCI-I721*/
    // '/api/v1/transaction/getCredById',
    /*  End- Name -Shubhangi, Date Of Code - 20-01-2021 zoho Task Number -SCI-I721*/
    // Start - Priyanka Patil 08-01-2021 (SCI-I558)
    '/api/v1/user/token_validate',
    // End - Priyanka Patil 08-01-2021 (SCI-I558)
    // '/api/v1/partner/register',
    // ============================ Start - Mahalaxmi (SNA-I2) - 02-06-2021 ============================    
    // '/api/v1/transaction/scanProduct',
    // '/api/v1/transaction/getProduct',
    // '/api/v1/transaction/getProdById',
    // '/api/v1/transaction/getHtml',
    // ============================ End - Mahalaxmi (SNA-I2) - 02-06-2021 ============================
     // ============================ Start - Shubhangi (SNA-I5) - 13-05-2021 ============================
     '/api/v1/invitepartner/create',
     '/api/v1/menu/list'
     // ============================ End - Shubhangi (SNA-I5) - 13-05-2021 ============================
];

var userModel = require('./../routes/v1/user/model');

var isTokenExpired = (user) => {
    if(user.expire && Date.now() <= user.expire ) {
        return false;
    }
    return true;
};

var verfifyAccessToken = (req, res, next) => {
    
    var token = req.headers['x-api-token'];
    var errors = [{ msg: "Unauthorized Access"}];
    if (token) {
        jwt.verify(token, config.PRIVATE_KEY, function (err, decoded) {
            
            if (err || !(decoded && decoded.userId && !isTokenExpired(decoded))) {
                req.isUserAuthenticated = false;
            } else {
                req.isUserAuthenticated = true;
                req.user = decoded;
            }

            if(req.isUserAuthenticated) {
                next();
            } else {
                req.app.responseHelper.send(res, false, {}, errors, 401);
            }

        });
    } else {
        req.app.responseHelper.send(res, false, {}, errors, 401);
    }
};

var verifyRefreshToken = (req, res, next) => {
    var refreshToken = req.headers['refreshtoken'];
    userModel.findUserByRefreshToken(refreshToken).then((result) => {
        if(result.isError || !(result.session && result.session._id)) {
            req.app.responseHelper.send(res, false, {}, result.errors, 401);
        } else {
            req.session = result.session;
            var sessionCreationDate = req.session.createdAt;
            var isSessionExpired = ((moment() - moment(sessionCreationDate)) >= REFRESH_TOKEN_EXPIRE_TIME) ? true : false;
            if(isSessionExpired) {
                userModel.destorySession(req.session._id).then((result) => {
                    req.app.responseHelper.send(res, false, {}, [{msg: "Unauthorized Access!"}], 401);
                });
            } else {
                next();
            }
            
        }
    });
};

var verify = (req, res, next) => {
    if(req.path == '/api/v1/user/token') {
        verifyRefreshToken(req, res, next);
       // }else if(excluedRoutes.indexOf(req.path) !== -1 || (req.path.indexOf("/api/") == -1)) {
    } else if(excluedRoutes.indexOf(req.path) !== -1) {
        next();
    } else {
        verfifyAccessToken(req, res, next);
    }
};

var auth = {};
auth.verify = verify;

module.exports = auth;