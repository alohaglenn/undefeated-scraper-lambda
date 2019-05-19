const axios = require("axios");
const cheerio = require("cheerio");

const BASE_URL = "https://undefeated.com/";
const products = [];

const scrapeProducts = async pathURL => {
  const url = `${BASE_URL}${pathURL}`;
  console.log(`scraping pathURL ${pathURL}`);
  if (!pathURL) {
    return products;
  }

  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);
    const paginationURL = $("#more a").attr("href");

    $(".product-grid-item").each(async (i, product) => {
      if ($(product).find(".price-compare") !== null) {
        const model = $(product)
          .find(".product-name a")
          .text();
        const retailPrice =
          parseFloat(
            $(product)
              .find(".price-compare")
              .text()
              .replace("$", "")
              .replace(" USD", "")
          ) ||
          $(product)
            .find("div.product-price > span > span")
            .text()
            .split(" ")[0];
        const salePrice =
          parseFloat(
            $(product)
              .find(".price-sale")
              .text()
              .replace("$", "")
              .replace(" USD", "")
          ) ||
          $(product)
            .find("div.product-price > span > span")
            .text()
            .split(" ")[0];
        const imageURL = `$https:${$(product)
          .find("img")
          .attr("src")
          .trim()}`;
        const buyURL = `${BASE_URL}${$(product)
          .find(".product-image a")
          .attr("href")}`;

        // const { data: clickThrough } = await axios.get(buyURL);
        const { data: clickThrough } = await axios.get(buyURL);
        const $$ = cheerio.load(clickThrough);
        const availableSizes = [];

        $$("option").each((i, size) => {
          if (size.attribs.value) {
            const sizeInfo = size.children[0].data.split(" ");
            const sizeParsed = sizeInfo[sizeInfo.length - 1];
            availableSizes.push(sizeParsed);
          }
        });

        const brand = $$("#product-info .hidden").text();

        if (retailPrice !== salePrice) {
          const discount = (retailPrice - salePrice) / retailPrice;
          const discountPercentage = Math.round(discount * 100);
          products.push({
            model,
            retailPrice,
            salePrice,
            discountPercentage,
            imageURL,
            buyURL,
            availableSizes,
            brand
          });
        }
      }
    });

    return scrapeProducts(paginationURL);
  } catch (e) {
    console.error(`Error scraping data: ${JSON.stringify(e)}`);
  }
};

module.exports = scrapeProducts;
