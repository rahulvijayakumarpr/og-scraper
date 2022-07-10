const ogs = require("open-graph-scraper");
// const options = { url: "http://ogp.me/" };
const options = {
  url: "https://www.imdb.com/title/tt10648342/",
  downloadLimit: 25000000,
};

async function main_thread() {
  let fr;
  result = await scrapperFunction();
  fr = formattedResult(result);
  console.log(fr);
}

async function scrapperFunction() {
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

main_thread();
