const AWS = require("aws-sdk");

const ddbClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  // Upload the thumbnail image to the destination bucket
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let fetchParams = {};

    if (event.queryStringParameters?.username) {
      fetchParams = {
        TableName: process.env.CONVERSION_HISTORY_TABLE,
        ExpressionAttributeValues: {
          ":dateTimeValue": Date.parse(sevenDaysAgo),
          ":username": event.queryStringParameters?.username,
        },
        FilterExpression:
          "uploadedAt > :dateTimeValue AND username = :username",
      };
    } else {
      fetchParams = {
        TableName: process.env.CONVERSION_HISTORY_TABLE,
        ExpressionAttributeValues: {
          ":dateTimeValue": Date.parse(sevenDaysAgo),
        },
        FilterExpression: "uploadedAt > :dateTimeValue",
      };
    }

    let Result = await ddbClient.scan(fetchParams).promise();
    let returnObject = {
      statusCode: 200,
      headers: {
        "access-control-allow-origin": "*",
      },
      body: JSON.stringify({
        message: `files fetched successfully`,
        images: Result.Items,
      }),
    };
    return returnObject;
  } catch (error) {
    console.log(error);
    const response = {
      err: error.message,
      headers: {
        "access-control-allow-origin": "*",
      },
      body: "error occured",
    };
    return response;
  }
};
