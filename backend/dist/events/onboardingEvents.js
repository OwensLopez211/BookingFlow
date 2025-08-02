"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboardingEventEmitter = void 0;
const events_1 = require("events");
class OnboardingEventEmitter extends events_1.EventEmitter {
    emitStepCompleted(event) {
        this.emit(OnboardingEventEmitter.STEP_COMPLETED, event);
    }
    emitOnboardingCompleted(event) {
        this.emit(OnboardingEventEmitter.ONBOARDING_COMPLETED, event);
    }
}
// Event types
OnboardingEventEmitter.STEP_COMPLETED = 'onboarding:step:completed';
OnboardingEventEmitter.ONBOARDING_COMPLETED = 'onboarding:completed';
exports.onboardingEventEmitter = new OnboardingEventEmitter();
