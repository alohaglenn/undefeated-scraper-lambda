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

    $(".product-grid-item").each((i, product) => {
      if ($(product).find(".price-compare") !== null) {
        const name = $(product)
          .find(".product-name a")
          .text();
        const retailPrice =
          $(product)
            .find(".price-compare")
            .text() ||
          $(product)
            .find("div.product-price > span > span")
            .text()
            .split(" ")[0];
        const salePrice =
          $(product)
            .find(".price-sale")
            .text()
            .split(" ")[0] ||
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

        if (retailPrice !== salePrice) {
          products.push({ name, retailPrice, salePrice, imageURL, buyURL });
        }
      }
    });

    return scrapeProducts(paginationURL);
  } catch (e) {
    console.error(`Error scraping data: ${JSON.stringify(e)}`);
  }
};

module.exports = scrapeProducts;
