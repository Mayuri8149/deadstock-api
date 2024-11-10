var express = require('express');
var router = express.Router();
var validator = require('./validator');
var model = require('./model');
var multer = require('multer');

var onError = (req, res, errors, statusCode) => {
    if (!(Array.isArray(errors) && errors.length)) {
        errors = [{
            "msg": "Something went wrong!"
        }];
    }
    req.app.responseHelper.send(res, false, {}, errors, statusCode);
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads/'); // Uploads directory
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname); // Keep original filename
    }
});

const upload = multer({ storage: storage });

router.post("/create", upload.single('file'), (req, res) => {
    console.log('req.body----',Object.assign({}, req.body));
    var menu = {};
    menu.name = req.body.name;
    menu.file = req.file ? req.file.path : ''; // Check if req.file exists before accessing its properties
    
    menu.submenu = req.body.submenu || '[]'

    console.log('req.file2', req.file);
    var create = () => {
        model.create(menu).then((result) => {
            console.log('result', result);
            if (result.isError || !result.menu || !result.menu._id) { // Fix condition to check if result.menu is defined
                onError(req, res, result.errors, 500);
            } else {
                var menu = result.menu;
                // No need to re-upload the image, it's already saved
                req.app.responseHelper.send(res, true, menu, [], 200);
            }
        }).catch(err => { // Add catch block to handle promise rejection
            console.error(err);
            onError(req, res, err.message, 500);
        });
    };

    create();
});

router.get('/list', (req, res) => {
    model.list().then((result) => {
        if (result.isError || !result.menus) { // Fix condition to check if result.menus is defined
            onError(req, res, result.errors, 500);
        } else {
            req.app.responseHelper.send(res, true, { menus: result.menus }, [], 200); // Return menus as an object
        }
    }).catch(err => { // Add catch block to handle promise rejection
        console.error(err);
        onError(req, res, err.message, 500);
    });
});

module.exports = router;
