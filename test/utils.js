'use strict';

const chai = require("chai");
const expect = chai.expect;

const HTMLParser = require("node-html-parser");

function isLoginSignupPage(htmlText) {
  const html = HTMLParser.parse(htmlText);
  const inputs = html.querySelectorAll("input");
  expect(inputs.length).to.equal(3);
}

function buildObjectFromHtml(parsedHtml, ids) {
  let obj = {};
  // console.log("Building for IDs", ids);
  ids.forEach(id => {
    const res = parsedHtml.querySelector(`#${id}`);
    if (res) {
      if (res.childNodes.length == 1) {
        obj[id] = res.childNodes[0].rawText.trim();
      } else {
        console.error("We don't yet handle multiple children");
        throw new Error("We don't yet handle multiple children");
      }
    } else {
      console.log("No element found for id", id)
    }
  });

  return obj;
}

module.exports = {
  isLoginSignupPage,
  buildObjectFromHtml
};
