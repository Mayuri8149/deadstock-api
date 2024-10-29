var nodeoutlook = require('nodejs-nodemailer-outlook')
const AWS = require("aws-sdk");

var sendEmailTestServer = (data) => {
    var promise = new Promise((resolve, reject) => {
        
        var mailOptions = {
            auth: {
                // Start - Priyanka Patil (SNA-I28) 29-06-2021
                user: "tracechain@snapperfuturetech.com",
                // Start - Priyanka Patil (SCI-I921) 08-05-2021
                pass: "Snapper#$09"
                // End - Priyanka Patil (SCI-I921) 08-05-2021
            },
            from: 'tracechain@snapperfuturetech.com',
            // End - Priyanka Patil (SNA-I28) 29-06-2021
            to: data.to,
            subject: data.subject,
            html: data.body,
          
            onError: (e) => { resolve(false) },
            onSuccess: (i) => { resolve(true) }
        }        
        nodeoutlook.sendEmail(mailOptions);
    });

    return promise;
};

var sendEmailProduction = (data) => {
    
        // require you config file
// Start - Priyanka Patil (SCI-I696) 19-01-2021
        //var s3 = new AWS.S3({ accessKeyId: global.config.awsDetails.accessKeyId, secretAccessKey: global.config.awsDetails.secretAccessKey }); //

        AWS.config.update({
            accessKeyId: global.config.awsDetails.accessKeyId,
            secretAccessKey: global.config.awsDetails.secretAccessKey,
// Start - Priyanka Patil (SCI-I696) 27-01-2021
            region: global.config.awsDetails.emailregion
// End - Priyanka Patil (SCI-I696) 27-01-2021
          });
// End - Priyanka Patil (SCI-I696) 19-01-2021       
        const ses = new AWS.SES({ apiVersion: "2010-12-01" });
        const params = {
        Destination: {
            ToAddresses: [data.to] // Email address/addresses that you want to send your email
        },
        //ConfigurationSetName: 11,
        Message: {
            Body: {
            Html: {
                // HTML Format of the email
                Charset: "UTF-8",
                Data: data.body
            },
            Text: {
                Charset: "UTF-8",
                Data: data.body
            }
            },
            Subject: {
            Charset: "UTF-8",
            Data: data.subject
            }
        },
        // Start - Priyanka Patil (SNA-I28) 29-06-2021
        Source: "tracechain@snapperfuturetech.com"
        // End - Priyanka Patil (SNA-I28) 29-06-2021
        };

        var sendEmail = ses.sendEmail(params).promise((resolve, reject) => {

    });


    return sendEmail;
};

var sendEmail = (data) => {
    var promise = new Promise((resolve, reject) => {
        if (process.env.NODE_ENV == 'production') {
            sendEmailProduction(data).then((result) => {
                if (result) {
                    var response = { isError: false, email: result };
                    resolve(response);
                } else {
                    var response = { isError: true, email: {} };
                    resolve(response);
                }
            })
        } else {
            sendEmailTestServer(data).then((result) => {
                if (result) {
                    var response = { isError: false, email: result };
                    resolve(response);
                } else {
                    var response = { isError: true, email: {} };
                    resolve(response);
                }
            })
        }
    });

    return promise;
}

module.exports = {
    sendEmail   
}