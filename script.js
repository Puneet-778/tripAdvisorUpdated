const pup = require("puppeteer");
const fs = require("fs");
let args = process.argv.slice(2);

let finaldata = ["Hotels", "Holiday Homes", "Top 10 Places To Visit"];
let finalobj = {};
let allCities = [];

async function multimain() {
  for (let i = 0; i < args.length; i++) {
    await main(args[i]);
  }
  allCities.push(finalobj);
  console.log(allCities);
  fs.writeFileSync("City.json", JSON.stringify(allCities));
}
async function main(city) {
  const browser = await pup.launch({
    headless: false,
    defaultViewport: false,
    args: ["--start-maximized"],
  });

  let pages = await browser.pages();

  tab = pages[0];
  await tab.goto("https://www.tripadvisor.in/", {
    waituntil: "load",
    timeout: 0,
  }); //change 2
  await Promise.all([
    tab.waitForSelector(".i3bZ_gBa._3TPJs5_m", { visible: true }),
    tab.waitForSelector("._1ZteHrEy", { visible: true }),
  ]);
  await tab.waitForTimeout(2000); //change1
  await tab.type('.i3bZ_gBa._3TPJs5_m input[type="search"]', city);
  await tab.waitForSelector("._1c2ocG0l", { visible: true });
  await tab.waitForTimeout(2000);
  let topSearch = await tab.$("a._1c2ocG0l");
  let url = await tab.evaluate(function (el) {
    return el.getAttribute("href");
  }, topSearch);
  // console.log(url);
  await tab.goto("https://www.tripadvisor.in/" + url);
  await tab.waitForSelector(
    "._2R--RBNa._39kFrNls._2PEEtTWK._3_rLKjCx._3wprI9Ge ._1ulyogkG"
  );
  let exploreArr = await tab.$$(
    "._2R--RBNa._39kFrNls._2PEEtTWK._3_rLKjCx._3wprI9Ge ._1ulyogkG"
  );
  let exploreUrl = [];
  let obj = {};
  for (let i = 0; i < exploreArr.length; i++) {
    let exploreNav = await exploreArr[i].$("span ._3088r1hR");
    let exploreNavename = await (
      await exploreNav.getProperty("innerText")
    ).jsonValue();

    let tempUrl = await tab.evaluate(function (el) {
      return el.getAttribute("href");
    }, exploreArr[i]);
    exploreUrl.push("https://www.tripadvisor.in/" + tempUrl);

    if (exploreNavename == "Hotels") {
      await exploreHotel(exploreUrl[i], browser, 0, obj);
    }
    if (exploreNavename == "Things to Do") {
      await thingsToDo(exploreUrl[i], browser, 2, obj);
    }
  }
  finalobj[city] = obj;
  browser.close();
}

async function exploreHotel(url, browser, idx, obj) {
  const page = await browser.newPage();
  await page.goto(url, { waituntil: "load", timeout: 0 });
  await page.waitForSelector(".ui_column.is-8.main_col.allowEllipsis", {
    visible: true,
  });
  let hotels = await page.$$(".ui_column.is-8.main_col.allowEllipsis");
  console.log(hotels.length);
  let hotelarr = [];

  for (let i = 0; i < hotels.length; i++) {
    let hoteltitle = await hotels[i].$('a[data-clicksource="HotelName"]');
    let tempobj = {};
    let hotelurl = await page.evaluate(function (el) {
      return el.getAttribute("href");
    }, hoteltitle);

    let hotelPrice = await hotels[i].$('div[data-clickpart="chevron_price"]');
    let hotelName = await hotels[i].$('a[data-clicksource="HotelName"]');

    let name = await (await hotelName.getProperty("innerText")).jsonValue();
    let price = await (await hotelPrice.getProperty("innerText")).jsonValue();

    tempobj["HotelName"] = name;
    tempobj["Price"] = price;
    tempobj["HotelUrl"] = "https://www.tripadvisor.in/" + hotelurl;
    hotelarr.push(tempobj);
  }
  obj[finaldata[idx]] = hotelarr;
}

async function thingsToDo(url, browser, idx, obj) {
  // let obj={};
  const page = await browser.newPage();
  await page.goto(url, { waituntil: "load", timeout: 0 });
  await page.waitForSelector("div._392swiRT");
  let overview = await page.$$(
    'a[class="_7c6GgQ6n _37QDe3gr WullykOU _2lHFa6tp"]'
  );
  let placesToVisit = await page.$$("div._392swiRT");
  let placesArr = [];

  for (let i in placesToVisit) {
    let tempobj = {};

    let place = await placesToVisit[i].$("div._1gpq3zsA._1zP41Z7X");
    let placeName = await (await place.getProperty("innerText")).jsonValue();

    tempobj["Place Name"] = placeName;
    placesArr.push(tempobj);
  }
  obj[finaldata[idx]] = placesArr;
}
multimain();
