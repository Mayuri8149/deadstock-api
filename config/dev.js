var config = {
    "PORT" : 27017,
    "MONGODB_USERNAME": encodeURIComponent("monuser"),
    "MONGODB_PASSWORD": encodeURIComponent("ayavamas"),
    "MONGODB_DBNAME": "dead_stock_dev_test",
    "PRIVATE_KEY": "gadiaagebadikinahi",
    "API_ENDPOINT": "http://localhost/:3000/"
};
config.MONGODB_URI = `mongodb://localhost/${config.MONGODB_DBNAME}?retryWrites=true&w=majority&poolSize=4`

config.flagBlockchain = {
    blockChainFlag:false
}
module.exports = config;