


var create = (req) => {
    try {

        req.checkBody("name", "Please fill all the mandatory Fields.").notEmpty();
        req.checkBody("image", "Please fill all the mandatory Fields.").notEmpty();
        
        var errors = req.validationErrors();

    } catch(e) {
        var errors = [{msg: "Something went wrong!"}];
    }
    return errors;
};


module.exports = {
    create
}