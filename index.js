const ogs = require("open-graph-scraper");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

const tableName = "SCRAPER_CACHE";

async function main_thread(url) {
  let fr;
  const options = {
    url: url,
    downloadLimit: 25000000,
  };
  cacheResult = await getCache(url);
  let resultObj = {};
  if (cacheResult.Items[0] === undefined) {
    result = await scrapperFunction(options);
    fr = formattedResult(result);
    cacheInsert = await insertCache(url, result);
    // console.log(fr);
    resultObj = { body: { ...fr }, statusCode: 200 };

    // return resultObj;
  } else {
    // console.log(cacheResult.Items[0].OG_DATA.S);
    resultObj = {
      body: { ...JSON.parse(cacheResult.Items[0].OG_DATA.S) },
      statusCode: 200,
    };
  }
  return resultObj;
}

async function insertCache(url, result) {
  dataStr = JSON.stringify(result);
  var params = {
    TableName: tableName,
    Item: {
      OG_URL: { S: url },
      OG_DATA: { S: dataStr },
    },
  };

  // Call DynamoDB to add the item to the table
  ddb.putItem(params, function (err, data) {
    if (err) {
      console.log("Error", err);
      return err;
    } else {
      console.log("Success", data);
      return data;
    }
  });
}

async function getCache(url) {
  console.log("getCache");
  var params = {
    ExpressionAttributeValues: {
      ":s": { S: url },
    },
    KeyConditionExpression: "OG_URL = :s",
    ProjectionExpression: "OG_DATA",
    TableName: tableName,
  };

  return await ddb.query(params).promise();
}

async function scrapperFunction(options) {
  return await ogs(options)
    .then((data) => {
      const { error, result, response } = data;
      //   console.log("result:", result); // This contains all of the Open Graph results
      return result;
    })
    .catch((error) => {
      //   console.log("error:", error);
      return error;
    });
}

function formattedResult(result) {
  if (result.success) {
    keyToDelete = deleteObjects();
    for (key in keyToDelete) {
      delete result[keyToDelete[key]];
    }
  }
  return result;
}

function deleteObjects() {
  return ["favicon", "charset", "requestUrl", "success"];
}

exports.handler = async (event) => {
  let resultOp = {};
  resultOp = await new Promise((resolve, reject) => {
    if (event.url !== undefined) {
      result = main_thread(event.url);
      resolve(result);
    }
  });
  opstr = JSON.stringify(resultOp.body);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: opstr,
  };
};
