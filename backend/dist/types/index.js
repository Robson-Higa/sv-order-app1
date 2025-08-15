"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Priority = exports.ServiceOrderStatus = exports.UserType = void 0;
var UserType;
(function (UserType) {
    UserType["ADMIN"] = "admin";
    UserType["TECHNICIAN"] = "technician";
    UserType["END_USER"] = "end_user";
})(UserType || (exports.UserType = UserType = {}));
var ServiceOrderStatus;
(function (ServiceOrderStatus) {
    ServiceOrderStatus["OPEN"] = "open";
    ServiceOrderStatus["ASSIGNED"] = "assigned";
    ServiceOrderStatus["IN_PROGRESS"] = "in_progress";
    ServiceOrderStatus["COMPLETED"] = "completed";
    ServiceOrderStatus["CANCELLED"] = "cancelled";
    ServiceOrderStatus["CONFIRMED"] = "confirmed";
})(ServiceOrderStatus || (exports.ServiceOrderStatus = ServiceOrderStatus = {}));
var Priority;
(function (Priority) {
    Priority["LOW"] = "low";
    Priority["MEDIUM"] = "medium";
    Priority["HIGH"] = "high";
    Priority["URGENT"] = "urgent";
})(Priority || (exports.Priority = Priority = {}));
//# sourceMappingURL=index.js.map