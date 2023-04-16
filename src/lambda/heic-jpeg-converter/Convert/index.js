const AWS = require("aws-sdk");
const { v4: uuid } = require("uuid");
const convert = require("heic-convert");

// get reference to S3 client
const s3 = new AWS.S3({ signatureVersion: "v4" });
const ddbClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context, callback) => {
  // Read options from the event parameter.
  const srcBucket = process.env.SRC_BUCKET;
  // Object key may have spaces or unicode non-ASCII characters.
  const srcKey = event.queryStringParameters.fileName;
  const dstBucket = process.env.DESTINATION_BUCKET;
  const dstKey = "converted-" + srcKey.replace(".HEIC", ".jpeg");

  // Download the image from the S3 source bucket.

  try {
    const params = {
      Bucket: srcBucket,
      Key: srcKey,
    };
    var origimage = await s3.getObject(params).promise();
  } catch (error) {
    console.log(error);
    return;
  }

  // Use the sharp module to resize the image and save in a buffer.
  try {
    var buffer = await convert({
      buffer: origimage.Body, // the HEIC file buffer
      format: "JPEG", // output format
    });
  } catch (error) {
    console.log("error converting", error);
    return;
  }

  // Upload the thumbnail image to the destination bucket
  try {
    if (!event.queryStringParameters.username) {
      const response = {
        err: "username not provided",
        headers: {
          "access-control-allow-origin": "*",
        },
        body: "error occured",
      };
      return response;
    }

    const destparams = {
      Bucket: dstBucket,
      Key: dstKey,
      Body: buffer,
      ContentType: "image",
    };

    const downloadparams = {
      Bucket: dstBucket,
      Key: dstKey,
      Expires: 60 * 60 * 24 * 7, //7days
    };

    const putResult = await s3.putObject(destparams).promise();
    const presignUrlResult = await s3.getSignedUrl("getObject", downloadparams);
    let writeData = {
      id: uuid(),
      uploadedAt: Date.now(),
      fileName: srcKey,
      username: event.queryStringParameters.username,
      convertedFileName: dstKey,
      downloadLink: presignUrlResult,
    };

    var writeParams = {
      TableName: process.env.HISTORY_TABLE_NAME,
      Item: writeData,
    };

    await ddbClient.put(writeParams).promise();
    let returnObject = {
      statusCode: 200,
      headers: {
        "access-control-allow-origin": "*",
      },
      body: JSON.stringify({
        message: `file ${srcKey} converted to jpeg successfully`,
        result: putResult,
        downloadLink: presignUrlResult,
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
