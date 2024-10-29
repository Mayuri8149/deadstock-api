
const SUCCESSMSG = require("../lang/success");
const ERRORMSG = require("../lang/error");
const returnSuccess = (res, successId, responseData) => {
  res.json({
    status: 'SUCCESS',
    response_code: successId,
    message: SUCCESSMSG[successId],
    data: responseData ? responseData : {},
  });
  return;
};
const returnError = (res, errorId, responseData, errorMessage) => {
  res.json({
    status: 'ERROR',
    response_code: errorId,
    message: errorMessage ? errorMessage : ERRORMSG[errorId],
    data: responseData ? responseData : {},
  });
  return;
};
module.exports = {
  returnSuccess,
  returnError,
};