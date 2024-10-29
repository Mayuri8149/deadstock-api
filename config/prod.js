var config = {
    "PORT" : 27017,
    "MONGODB_USERNAME": encodeURIComponent("monuser"),
 	"MONGODB_PASSWORD": encodeURIComponent("ayavamas"),
    "MONGODB_DBNAME": "tracechain_demo",
    "PRIVATE_KEY": "gadiaagebadikinahi",
	//"PRIVATE_KEY": "gadiaagebadgayihe",
	"API_ENDPOINT": "http://52.172.252.154/:3000/"
};
/*  Start- Name -Shubhangi, Date Of Code - 18-01-2021 zoho Task Number -SCI-I697*/
config.MONGODB_URI = `mongodb+srv://snapcert:Blockchain456@cluster0-5lmfv.mongodb.net/${config.MONGODB_DBNAME}?retryWrites=true&w=majority`
config.URI = 'http://52.172.252.154/#/'
config.BLOCKCHAIN_URI = 'http://40.80.90.217:4000/'
config.MAILURI = 'https://demo.tracechain.io/#/'

// End - Priyanka Patil (SCI-I696) 22-01-2021
/*  End- Name -Shubhangi, Date Of Code - 18-01-2021 zoho Task Number -SCI-I697*/

// ============================ Start - Neha Mutke (SCI-I754) - 30-01-2021 ============================
config.dmsDetails = {
	"url" : "https://dms.snapcert.io/blockchaindms//",
	"username" : "admin",
	"password" : "admin123",
	"grant_type" : "password",
	"mq_url" : "amqps://lueotmov:mIB_upYw6Y-DJs4ejSZFujyDhz_ok8td@lionfish.rmq.cloudamqp.com/lueotmov" + "?heartbeat=60"
}
config.blockchainCred = {
	"username": "naresh.jain@snapperfuturetech.com",
	"passw": "Snapper$0789"
}
config.tracechainBlockchainServer={
    userReg:'http://52.140.126.66:4000/users',
    chaincodeUrl:'http://52.140.126.66:4000/channels/mychannel/chaincodes/tracechain'
} 

// ============================ End - Shubhangi (SCI-I798-New) - 06-05-2021 ============================
module.exports = config;