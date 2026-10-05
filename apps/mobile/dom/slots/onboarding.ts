// W6: the push-permission offer as a capability-gated DOM overlay (`overlay:onboarding`). Registered after
// ./settings so it stacks above the settings overlay it is triggered from.
import { register } from './instance';
import { OnboardingOverlay } from './onboarding-overlay';

export const ONBOARDING_SLICE = 'onboarding';

register({
  slice: ONBOARDING_SLICE,
  slots: { 'overlay:onboarding': OnboardingOverlay },
});
