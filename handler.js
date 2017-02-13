'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.hello = (event, context, callback) => {
  var responseBody = {
    message: "JSON webhook"
  };
  if (event.body !== undefined) {
    if (event.body !== null) {
        const timestamp = new Date().getTime();
        try {
          const parsedJSONBody = JSON.parse(event.body);
          const dbrecord = {
            identifier: uuid.v1(),
            record: parsedJSONBody,
            createdAt: timestamp
          };
          if (parsedJSONBody.id !== undefined) {
            if (parsedJSONBody.id.indexOf("evt") >= 0) {
              // Then its a stripe event
              dbrecord["eventType"] = "stripe";
              if (parsedJSONBody["id"] !== undefined) dbrecord["id"] = parsedJSONBody["id"];
              if (parsedJSONBody.livemode !== undefined) dbrecord.live = parsedJSONBody.livemode;
              if (parsedJSONBody["created"] !== undefined) dbrecord["created"] = parsedJSONBody["created"];
              if (parsedJSONBody["api_version"] !== undefined) dbrecord["api_version"] = parsedJSONBody["api_version"];
              if (parsedJSONBody["type"] !== undefined) dbrecord["stripe_tx_type"] = parsedJSONBody["type"];
              // Data block - BEGIN
              if (parsedJSONBody.data !== undefined) {
                if (parsedJSONBody.data !== null) {
                  if (parsedJSONBody.data.object !== undefined) {
                    if (parsedJSONBody.data.object !== null) {
                      if (parsedJSONBody.data.object["id"] !== undefined) dbrecord["stripe_charge_id"] = parsedJSONBody.data.object["id"];
                      if (parsedJSONBody.data.object.amount !== undefined) dbrecord.invoiceamount = parsedJSONBody.data.object.amount;
                      if (parsedJSONBody.data.object.currency !== undefined) dbrecord.invoicecurrency = parsedJSONBody.data.object.currency;
                      if (parsedJSONBody.data.object.metadata !== undefined) {
                        if (parsedJSONBody.data.object.metadata.invoiceid !== undefined) dbrecord.invoiceid = parsedJSONBody.data.object.metadata.invoiceid;
                        if (parsedJSONBody.data.object.metadata['description'] !== undefined) dbrecord.invoicedescription = parsedJSONBody.data.object.metadata['description'];
                      }
                      if (parsedJSONBody.data.object.captured !== undefined) dbrecord.captured = parsedJSONBody.data.object.captured;
                      if (parsedJSONBody.data.object.refunded !== undefined) dbrecord.refunded = parsedJSONBody.data.object.refunded;
                      if (parsedJSONBody.data.object.source !== undefined) {
                        if (parsedJSONBody.data.object.source.object !== undefined) {
                          if (parsedJSONBody.data.object.source.object == "card") {
                            if (parsedJSONBody.data.object.source.name !== undefined) dbrecord.cardname = parsedJSONBody.data.object.source.name;
                            if (parsedJSONBody.data.object.source.brand !== undefined) dbrecord.cardbrand = parsedJSONBody.data.object.source.brand;
                            if (parsedJSONBody.data.object.source.country !== undefined) dbrecord.cardcountry = parsedJSONBody.data.object.source.country;
                            if (parsedJSONBody.data.object.source['last4'] !== undefined) dbrecord['last4'] = parsedJSONBody.data.object.source['last4'];
                            if (parsedJSONBody.data.object.source['exp_month'] !== undefined) dbrecord['exp_month'] = parsedJSONBody.data.object.source['exp_month'];
                            if (parsedJSONBody.data.object.source['exp_year'] !== undefined) dbrecord['exp_year'] = parsedJSONBody.data.object.source['exp_year'];
                          }
                        }
                        dbrecord.refunded = parsedJSONBody.data.object.refunded;
                      }
                    }
                  }
                }
              }
              // Data block - END
            } // END: Stripe processing
          } // END: ID not found so maybe its some other event
          const dbparams = {
              TableName: "Events",
              Item: dbrecord
          };
          dynamoDb.put(dbparams, (error, result) => {
              if (!error) {
                responseBody.message = "Done";
              } else {
                console.log("Error creating database entry (" + error + ")")
                responseBody.message = "Error (" + error + ")"
              }
              responseBody = JSON.stringify(responseBody);
              const response = {
                  statusCode: 200,
                  body: responseBody
              };
              callback(null, response);
          });
        } catch (e) {
            responseBody.message = "Not a JSON response";
            const response = {
                statusCode: 500,
                body: responseBody
            };
            callback(null, response);
        }
    } else {
      responseBody = JSON.stringify(responseBody);
      const response = {
      statusCode: 200,
      body: responseBody
      };
      callback(null, response);
    }
  } else {
    responseBody = JSON.stringify(responseBody);
    const response = {
    statusCode: 200,
    body: responseBody
    };
    callback(null, response);
  }
};
