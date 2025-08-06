"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_LIMITS = void 0;
exports.getPlanLimits = getPlanLimits;
exports.PLAN_LIMITS = {
    free: {
        maxResources: 1,
        maxAppointmentsPerMonth: 100,
        maxUsers: 1,
    },
    basic: {
        maxResources: 5,
        maxAppointmentsPerMonth: 1000,
        maxUsers: 2,
    },
    premium: {
        maxResources: 10,
        maxAppointmentsPerMonth: 2500,
        maxUsers: 10,
    },
};
function getPlanLimits(plan) {
    return exports.PLAN_LIMITS[plan];
}
