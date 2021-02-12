'use strict';

const chai = require("chai");
const expect = chai.expect;

const HTMLParser = require("node-html-parser");

function isLoginSignupPage(htmlText, expectedHeading) {
  const html = HTMLParser.parse(htmlText);
  const h1 = html.querySelector("h1");
  const inputs = html.querySelectorAll("input");
  expect(inputs.length).to.equal(3);
  // TODO find it somewhere
  // expect(h1.innerText).to.equal(expectedHeading);
}

module.exports = {
  isLoginSignupPage
};
