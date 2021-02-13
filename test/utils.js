'use strict';

const chai = require("chai");
const expect = chai.expect;

const HTMLParser = require("node-html-parser");

function isLoginSignupPage(htmlText) {
  const html = HTMLParser.parse(htmlText);
  const inputs = html.querySelectorAll("input");
  expect(inputs.length).to.equal(3);
}

module.exports = {
  isLoginSignupPage
};
