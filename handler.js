"use strict";

const getProducts = require("./utils/scrapeProducts");
const AWS = require("aws-sdk");
const uuid = require("uuid");
const _ = require("lodash");

const dynamo = new AWS.DynamoDB.DocumentClient();
const { DYNAMODB_TABLE } = process.env;
const maxBatchWriteSize = 25;

const pathURL = "collections/sale/mens-footwear";

module.exports.scrape = async event => {
  const scrapedProducts = await getProducts(pathURL);

  const products = scrapedProducts.map(product => {
    const {
      brand,
      model,
      retailPrice,
      salePrice,
      discountPercentage,
      imageURL,
      buyURL,
      availableSizes
    } = product;
    return {
      PutRequest: {
        Item: {
          id: uuid.v1(),
          brand,
          model,
          retailPrice,
          salePrice,
          discountPercentage,
          imageURL,
          buyURL,
          availableSizes
        }
      }
    };
  });

  const batches = _.chunk(products, maxBatchWriteSize);

  console.log("batches: ", batches.length);

  for (const batch of batches) {
    const params = {
      RequestItems: {
        [DYNAMODB_TABLE]: batch
      }
    };

    try {
      const result = await dynamo.batchWrite(params).promise();
      console.log(`result: ${JSON.stringify(result)}`);
    } catch (e) {
      console.error(`Error with batchWrite in DynamoDB ${JSON.stringify(e)}`);
    }

    console.log("batch done");
  }

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Data successfully stored in DynamoDB!",
        input: event
      },
      null,
      2
    )
  };
};
