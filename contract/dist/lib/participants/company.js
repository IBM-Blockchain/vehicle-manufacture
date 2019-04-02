"use strict";
/*
SPDX-License-Identifier: Apache-2.0
*/
Object.defineProperty(exports, "__esModule", { value: true });
const participant_1 = require("./participant");
class Company extends participant_1.Participant {
    constructor(id, name, companyType) {
        super(id, companyType);
        this.name = name;
    }
    getName() {
        return this.name;
    }
}
exports.Company = Company;
//# sourceMappingURL=company.js.map