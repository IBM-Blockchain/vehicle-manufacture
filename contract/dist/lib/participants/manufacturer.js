"use strict";
/*
SPDX-License-Identifier: Apache-2.0
*/
Object.defineProperty(exports, "__esModule", { value: true });
const company_1 = require("./company");
class Manufacturer extends company_1.Company {
    constructor(id, name) {
        super(id, name, 'Manufacturer');
    }
}
exports.Manufacturer = Manufacturer;
//# sourceMappingURL=manufacturer.js.map