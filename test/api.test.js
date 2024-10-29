
//const request = require("supertest")("http://52.172.252.154:3000/");
const request = require("supertest")
const expect = require("chai").expect;
const app = require('../app')
let accessToken = null;
let departmentId = null;
let moduleId = null;
let userId = null;
let institudeId = null;
let code = null
let transTypeData ={}
//===================================================STEP 1==================================================
//POST /Register Organization error of timeout
describe("POST /Register Organization", function () {  
  it("Register Organization API Test", async function () {    
    const response = await request(app)
    .post("/api/v1/organization/register")  
    .send(     
      {"organizationAdmin":
      {"firstName":"Shubhangi",
        "lastName":"Randive",
        "name":"Blockchain Organization",
        "code":"HSBc",
        "type":"Private University",
        "email":"iadmin919@yopmail.com",
        "phoneNumber":"+918983956665",
        "timeZone":"Asia/Calcutta",
        "isActive":true,
        "createdBy":{
            "firstName":"Shubhangi",
            "lastName":"Randive",
            "email":"shubhangiran08@yopmail.com"
            },
        "updatedBy":{
            "firstName":"Shubhangi",
            "lastName":"Randive",
            "email":"shubhangiran08@yopmail.com"
          }
       }
    }
    );    
    expect(response.status).to.eql(200);   
   institudeId = response.body.data.organizationData._id
   code = response.body.data.code
  }).timeout(50000);

});

// //POST /reset password
describe("POST reset password", function () {
  it("reset password API Test", async function () {
    const response = await request(app)
      .post("/api/v1/user/resetpassword")
      .set('x-api-token', accessToken)
      .send(
        {
          "email": "iadmin919@yopmail.com",
          "code": code,
          "password": "Test@123",
          "confirmPassword": "Test@123"
        }
      );
    expect(response.status).to.eql(200);
  }).timeout(10000);

});


//POST /Login
describe("POST /Login", function () {
  it("Login API Test", async function () {
    const response = await request(app)
      .post("/api/v1/user/signin")
      .send({ email: "iadmin919@yopmail.com", password: "Test@123" });
    expect(response.status).to.eql(200);
    accessToken = response.body.data.accessToken;
  }).timeout(10000);
});

//GET /organization
describe("GET /organization ", function () {
  it("organization API Test", async function () {
    const response = await request(app)
      .get("/api/v1/organization/"  + institudeId)
      .set('x-api-token', accessToken);

    expect(response.status).to.eql(200);

  }).timeout(10000);

});

//POST /create Department
describe("POST /Create Department", function () {
  it("Create Department API Test", async function () {
    const response = await request(app)
      .post("/api/v1/department/create")
      .set('x-api-token', accessToken)
      .send(
        {
          "organizationId": institudeId,
          "isActive": true,
          "code": "D786",
          "name": "Dep33",
          "createdBy": {
            "firstName": "ght",
            "lastName": "rgryt",
            "email": "testreset234@yopmail.com"
          },
          "updatedBy": {
            "firstName": "ght",
            "lastName": "rgryt",
            "email": "fhgfdbg234@yopmail.com"
          }
        }
      );
    expect(response.status).to.eql(200);
    departmentId = response.body.data._id
  }).timeout(10000);

});



//GET /user historylist
describe("GET /user historylist", function () {
  it("user historylist API Test", async function () {
    const response = await request(app)
      .get("/api/v1/user/historylist?pagesize=10&page=1&userId=" + "6067fe42bde76f50541798d7")
      .set('x-api-token', accessToken);

    expect(response.status).to.eql(200);

  }).timeout(10000);

});

//GET /user list
describe("GET /user list", function () {
  it("user list API Test", async function () {
    const response = await request(app)
      .get("/api/v1/user/list?userId=" + userId + "&organizationId=" + institudeId +"&pagesize=10&page=1&role=manager&entity=organization&departmentId=" + departmentId)
      .set('x-api-token', accessToken);

    expect(response.status).to.eql(200);

  }).timeout(10000);

});


//GET /Department List
describe("GET /Department List", function () {
  it("Department List API Test", async function () {
    const response = await request(app)
      .get("/api/v1/department/list?organizationId="+ institudeId +"&pagesize=10&page=1&_id="+ departmentId)
      .set('x-api-token', accessToken);

    expect(response.status).to.eql(200);

  }).timeout(10000);

});

//POST /Create User
describe("POST /Create User", function () {

  it("Create User API Test", async function () {
    const response = await request(app)
      .post("/api/v1/user/create")
      .set('x-api-token', accessToken)
      .send(
        {
          "firstName": "Ojas",
          "lastName": "Randive",
          "role": "manager",
          "entity": "organization",
          "email": "idm919@yopmail.com",
          "phoneNumber": "+918754219865",
          "organizationId": institudeId,
          "affiliateId": "",
          "departmentId": departmentId,
          "timeZone": "Asia/Calcutta",
          "createdBy": {
            "firstName": "ght",
            "lastName": "rgryt",
            "email": "user234@yopmail.com"
          },
          "updatedBy": {
            "firstName": "ght",
            "lastName": "rgryt",
            "email": "fhgfdbg234@yopmail.com"
          }
        }
      );
    expect(response.status).to.eql(200);
    userId = response.body.data._id
    code = response.body.data.code
  }).timeout(30000);
});

// //POST /reset password
describe("POST reset password", function () {
  it("reset password API Test", async function () {
    const response = await request(app)
      .post("/api/v1/user/resetpassword")
      .set('x-api-token', accessToken)
      .send(
        {
          "email": "idm919@yopmail.com",
          "code": code,
          "password": "Test@123",
          "confirmPassword": "Test@123"
        }
      );
    expect(response.status).to.eql(200);
  }).timeout(10000);

});

//POST /Login
describe("POST /Login", function () {
  it("Login API Test", async function () {
    const response = await request(app)
      .post("/api/v1/user/signin")
      .send({ email: "idm919@yopmail.com", password: "Test@123" });
    expect(response.status).to.eql(200);
    accessToken = response.body.data.accessToken;
  }).timeout(10000);
});


//PUT /user update
describe("PUT /user update", function () {
  it("user update API Test", async function () {
    const response = await request(app)
      .put("/api/v1/user/" + userId)
      .set('x-api-token', accessToken)
      .send(
        {
          "id": userId,
          "phoneNumber": "+917788894451",
          "updatedBy": {
            "firstName": "Test",
            "lastName": "User",
            "email": "iadmin919@yopmail.com"
          }
        }
      );
    expect(response.status).to.eql(200);

  }).timeout(10000);

});

//POST /Register corporate
describe("POST /Register corporate", function () {
  it("Register corporate API Test", async function () {
    const response = await request(app)
      .post("/api/v1/corporate/register")
      .send(
        {
          "firstName": "amol6",
          "lastName": "sharma",
          "companyName": "Snapper Future Tech1",
          "email": "cora919@yopmail.com",
          "phoneNumber": "+917387185898",
          "verifiertype": "agencyverifier",
          "role": "Agency Admin",
          "entity": "agency",
          "timeZone": "Asia/Calcutta",
          "createdBy": {
            "firstName": "amol6",
            "lastName": "sharma",
            "email": "amol6@yopmail.com"
          },
          "updatedBy": {
            "firstName": "amol6",
            "lastName": "sharma",
            "email": "amol6@yopmail.com"
          }
        }
      );
    expect(response.status).to.eql(200);

  }).timeout(10000);
});

  //POST /create module
describe("POST /create module", function () {
  it("Create Module API Test", async function () {
    const response = await request(app)
      .post("/api/v1/module/create")
      .set('x-api-token', accessToken)
      .send(
        {
          "code": "PH1203",
          "name": "Phycsic1203",
          "organizationId": institudeId,
          "departmentId": departmentId,
          "createdBy": {
            "firstName": "Dm",
            "lastName": "Insti",
            "email": "testDm7498@yopmail.com"
          },
          "updatedBy": {
            "firstName": "Dm",
            "lastName": "Insti",
            "email": "testDm7498@yopmail.com"
          }
        }
      );
    expect(response.status).to.eql(200);
    moduleId = response.body.data._id
  }).timeout(10000);

});

//POST /create batch
describe("POST /create batch", function () {
  it("Create batch API Test", async function () {
    const response = await request(app)
      .post("/api/v1/batch/create?")
      .set('x-api-token', accessToken)
      .send(
        {
          "moduleId": moduleId,
          "code": "B1",
          "year": "2020",
          "start": "2021-02-09T11:12:42.234Z",
          "end": "2021-02-09T11:12:42.235Z",
          "organizationId": institudeId,
          "departmentId": departmentId,
          "createdBy": {
            "firstName": "Dm",
            "lastName": "Insti",
            "email": "testDm7498@yopmail.com"
          },
          "updatedBy": {
            "firstName": "Dm",
            "lastName": "Insti",
            "email": "testDm7498@yopmail.com"
          }
        }
      );
    expect(response.status).to.eql(200);
    batchId = response.body.data._id
  }).timeout(10000);

});

//PUT /module update
describe("PUT /module update", function () {
  it("module update API Test", async function () {
    const response = await request(app)
      .put("/api/v1/module/" + moduleId)
      .set('x-api-token', accessToken)
      .send(
        {
          "name": "Phycsic1203",
          "organizationId": institudeId,
          "departmentId": departmentId,
          "code": "PH1203",
          "updatedBy": {
            "firstName": "Dm",
            "lastName": "Test",
            "email": "testDm257498@yopmail.com"
          }
        }
      );
    expect(response.status).to.eql(200);

  }).timeout(10000);

});

//PUT /Department Change status
describe("PUT /Department Change status", function () {
  it("Department Change status API Test", async function () {
    const response = await request(app)
      .put("/api/v1/department/" + departmentId + "/changeStatus")
      .set('x-api-token', accessToken)
      .send(
        {
          "isActive": true
        }
      );
    expect(response.status).to.eql(200);

  }).timeout(10000);

});

//PUT /Module Change status
describe("PUT /Module Change status", function () {
  it("Module Change status API Test", async function () {
    const response = await request(app)
      .put("/api/v1/module/" + moduleId + "/changeStatus")
      .set('x-api-token', accessToken)
      .send(
        {
          "isActive": true
        }
      );
    expect(response.status).to.eql(200);

  }).timeout(10000);

});

//GET /batch List
describe("GET /batch List", function () {
  it("batch List API Test", async function () {
    const response = await request(app)
      .get("/api/v1/batch/list?pagesize=10&page=1&tabIndex=0&flag=instbatches&organizationId=" + institudeId +"&departmentId=" + departmentId)
      .set('x-api-token', accessToken);

    expect(response.status).to.eql(200);

  }).timeout(10000);

});

//GET /module List
describe("GET /module List ", function () {
  it("module List  API Test", async function () {
    const response = await request(app)
      .get("/api/v1/module/list?organizationId=" +institudeId + "&departmentId=" + departmentId +"&pagesize=10&page=1")
      .set('x-api-token', accessToken);

    expect(response.status).to.eql(200);

  }).timeout(10000);

});


//==========================================================STEP 2============================================
// //==================================================LOGIN AS DATA MANAGER=======================================

// //POST /Delete partner
// describe("POST /Delete partner", function () {  
//   it("Delete partner API Test", async function () {    
//     const response = await request(app)
//     .post("/api/v1/partner/draft/delete")  
//     .set('x-api-token', accessToken)
//     .send(     
//       {"draftIds":["603f91abcc1f2134506291cb"],"organizationId":institudeId}
//     );    
//     expect(response.status).to.eql(200);   

//   }).timeout(10000);

// });


// //GET /transtype List
// describe("GET /transtype List", function () {
//   it("transtype List API Test", async function () {
//     const response = await request(app)
//       .get("/api/v1/transtype/list?organizationId=" + institudeId +"&pagesize=10&page=1&departmentId=" + departmentId)
//       .set('x-api-token', accessToken);

//     expect(response.status).to.eql(200);

//   }).timeout(10000);

// });

// //GET /partner List
// describe("GET /partner List", function () {
//   it("partner List API Test", async function () {
//     const response = await request(app)
//       .get("/api/v1/partner/list?pagesize=10&page=1&organizationId=" + institudeId + "&departmentId=" + departmentId)
//       .set('x-api-token', accessToken);

//     expect(response.status).to.eql(200);

//   }).timeout(10000);

// });

// //GET /transaction List
// describe("GET /transaction List", function () {
//   it("transaction List API Test", async function () {
//     const response = await request(app)
//       .get("/api/v1/transaction/list?pagesize=10&page=1&role=manager&dashboard=true&organizationId=" + institudeId + "&departmentId=" + departmentId)
//       .set('x-api-token', accessToken);

//     expect(response.status).to.eql(200);
//   }).timeout(10000);

// });

// //GET /transactiontype List 
// describe("GET /transactiontype List ", function () {
//   it("transactiontype List API Test", async function () {
//     const response = await request(app)
//       .get("/api/v1/transactiontype/list?organizationId= " +institudeId +" &departmentId=" +  departmentId + "&pagesize=10&page=1")
//       .set('x-api-token', accessToken);

//     expect(response.status).to.eql(200);

//   }).timeout(10000);

// });

// //GET /transactiontype TransactionModule module 
// describe("GET /transactiontype TransactionModule module ", function () {
//   it("transactiontype TransactionModule module  API Test", async function () {
//     const response = await request(app)
//       .get("/api/v1/transactiontype/TransactionModule/Module/ModuleId/Id?moduleId=" + moduleId)
//       .set('x-api-token', accessToken);

//     expect(response.status).to.eql(200);

//   }).timeout(10000);

// });

// //GET /transType
// describe("GET /transType ", function () {
//   it("transType API Test", async function () {
//     const response = await request(app)
//       .get("/api/v1/transtype/list?organizationId=603f899fcc1f2134506291b4&pagesize=10&page=1&departmentId=603f8b13cc1f2134506291b9&role=manager")
//       .set('x-api-token', accessToken);

//     expect(response.status).to.eql(200);
    
//     transTypeData = JSON.stringify(response.body.data.transtypes)
//   }).timeout(10000);

// });

// //GET /transtype
// describe("GET /transtype", function () {
//   it("transtype API Test", async function () {
//     const response = await request(app)
//       .get("/api/v1/transtype/601a391ed6412212306e4f04?id=601a391ed6412212306e4f04")
//       .set('x-api-token', accessToken);

//     expect(response.status).to.eql(200);

//   }).timeout(10000);

// });

// //GET /verifier List
// describe("GET /verifier List", function () {
//   it("verifier List API Test", async function () {
//     const response = await request(app)
//       .get("/api/v1/verifier/list?organizationId=603f899fcc1f2134506291b4&departmentId=603f8b13cc1f2134506291b9&userId=603f96f2cc1f2134506291d8&pagesize=10&page=1")
//       .set('x-api-token', accessToken);

//     expect(response.status).to.eql(200);

//   }).timeout(10000);

// });


// //GET /Transaction 
// describe("GET /Transaction ", function () {
//   it("Transaction  API Test", async function () {
//     const response = await request(app)
//       .get("/api/v1/transaction/603f930ccc1f2134506291d0?organizationId=" + institudeId +"&departmentId=" + departmentId)
//       .set('x-api-token', accessToken);

//     expect(response.status).to.eql(200);

//   }).timeout(10000);

// });

// //====================================================== STEP3 ============================================
// //====================================================== LOGIN AS REVIVWER=================================

// //PUT /reviwed partner
// describe("PUT /partner Change status", function () {
//   it("partner Change status API Test", async function () {
//     const response = await request(app)
//       .put("/api/v1/partner/603f91abcc1f2134506291cb/changeStatus")
//       .set('x-api-token', accessToken)
//       .send(
//         {
//           "status": "reviewed",
//           "batchId": "603f9175cc1f2134506291c9",
//           "comment": "",
//           "createdBy": { "firstName": "PRANIT", "lastName": "WANDHARE", "email": "r0321@yopmail.com" },
//           "updatedBy": { "firstName": "PRANIT", "lastName": "WANDHARE", "email": "r0321@yopmail.com" }
//         }
//       );
//     expect(response.status).to.eql(200);

//   }).timeout(10000);

// });



// //====================================================== STEP 4 ============================================
// //====================================================== LOGIN AS REVIVWER =================================
// //PUT /review transaction
// describe("PUT /review transaction", function () {
//   it("review transaction API Test", async function () {
//     const response = await request(app)
//       .put("/api/v1/transaction/603f930ccc1f2134506291d0/reviewer/status")
//       .set('x-api-token', accessToken)
//       .send(
//         {
//           "status": "reviewed",
//           "transactionId": "603f930ccc1f2134506291d0",
//           "comment": "",
//           "updatedBy": { "firstName": "PRANIT", "lastName": "WANDHARE", "email": "r0321@yopmail.com" },
//           "timeZone": "Asia/Calcutta"
//         });
//     expect(response.status).to.eql(200);

//   }).timeout(10000);

// });



// //====================================================== STEP 5 =============================================
// //====================================================== LOGIN AS CERTIFIER =================================
// //PUT /certifier transaction
// describe("PUT /certifier transaction", function () {
//   it("certifier transaction API Test", async function () {
//     const response = await request(app)
//       .put("/api/v1/transaction/603f930ccc1f2134506291d0/certifier/status")
//       .set('x-api-token', accessToken)
//       .send(
//         {
//           "status": "certified",
//           "transactionId": "603f930ccc1f2134506291d0",
//           "comment": "",
//           "updatedBy": { "firstName": "ARCHANA", "lastName": "WANDHARE", "email": "c0321@yopmail.com" },
//           "timeZone": "Asia/Calcutta"
//         });
//     expect(response.status).to.eql(200);

//   }).timeout(10000);

// });

// //============================================================= LOGI AS PARTNER,REVIWER,CERTIFIER ================================
// //PUT /view transaction
// describe("PUT /view transaction", function () {
//   it("view transaction API Test", async function () {
//     const response = await request(app)
//       .put("/api/v1/transaction/08b2d31ceb63b3d432d70d75f76066563dcaa2347cd0bdd07dd0b9784af9a14f/changeViewStatus")
//       .set('x-api-token', accessToken)
//       .send(
//         {
//           "isView": true,
//           "transactionid": "08b2d31ceb63b3d432d70d75f76066563dcaa2347cd0bdd07dd0b9784af9a14f"
//         });
//     expect(response.status).to.eql(200);

//   }).timeout(10000);

// });

// //==================================================== LOGIN AS PARTNER ========================================
// //GET /Transaction 
// describe("GET /partner Transaction ", function () {
//   it("partner Transaction  API Test", async function () {
//     const response = await request(app)
//       .get("/api/v1/partner/did:snapcert:c1d74f32502e9ce5043198ecd48dc0a4/transactions?pagesize=10&page=1")
//       .set('x-api-token', accessToken);

//     expect(response.status).to.eql(200);

//   }).timeout(10000);

// });

// //POST /share Transaction
// describe("POST share Transaction", function () {
//   it("share Transaction API Test", async function () {
//     const response = await request(app)
//       .post("/api/v1/transaction/shareTransaction")
//       .set('x-api-token', accessToken)
//       .send(
//         {
//           "transactionId":"603f930ccc1f2134506291d0",
//           "recipientEmail":"test12@yopmail.com",
//            "partnerName":"Alam Deskar"}
//       );
//     expect(response.status).to.eql(200);
//   }).timeout(10000);

// });

// //POST /forgot password
// describe("POST forgot password", function () {
//   it("forgot password API Test", async function () {
//     const response = await request(app)
//       .post("/api/v1/user/forgotpassword")
//       .set('x-api-token', accessToken)
//       .send(
//         {
//           "email": "sh0bha2ss603047@yopmail.com"
//         }
//       );
//     expect(response.status).to.eql(200);
//     code =  response.body.data.code
//   }).timeout(10000);

// });

// // //POST /reset password
// describe("POST reset password", function () {
//   it("reset password API Test", async function () {
//     const response = await request(app)
//       .post("/api/v1/user/resetpassword")
//       .set('x-api-token', accessToken)
//       .send(
//         {
//           "email": "sh0bha2ss603047@yopmail.com",
//           "code": code,
//           "password": "Test@123",
//           "confirmPassword": "Test@123"
//         }
//       );
//     expect(response.status).to.eql(200);
//   }).timeout(10000);

// });


