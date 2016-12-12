var excelRead = require("./excelRead.js")
var brandService = require("./brand.js")
var brandConvert = require("./brandConvert.js");
var attributeService = require("./attribute.js");
var attributeConvert = require("./attributeconvert.js");
var categorySerive = require("./category.js");
var categoryAttrService = require("./categoryAttr.js");
var categoryCodeConvert = require("./categorycodeconvert.js");
var warehouseService = require("./wareHouseStock.js");
var nurture = require("./nurture.js");
var archive = require("./archive.js");
var generator = require("./generator.js");

module.exports.generator = generator;

module.exports.archive = archive;

module.exports.excel = excelRead;

module.exports.brand = brandService;

module.exports.brandConvert = brandConvert;

module.exports.attribute = attributeService;

module.exports.attributeConvert = attributeConvert;

module.exports.category = categorySerive;

module.exports.categoryAttr = categoryAttrService;

module.exports.categoryCode = categoryCodeConvert;

module.exports.warehouse = warehouseService;

module.exports.nurture = nurture;
