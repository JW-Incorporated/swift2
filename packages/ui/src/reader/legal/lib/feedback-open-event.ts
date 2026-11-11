/** Dispatched on `window` by an in-page "Report a problem" control; FeedbackButton listens and opens its panel. */
export const OPEN_FEEDBACK_EVENT = 'll:open-feedback';

export function requestOpenFeedback(): void {
  window.dispatchEvent(new Event(OPEN_FEEDBACK_EVENT));
}
