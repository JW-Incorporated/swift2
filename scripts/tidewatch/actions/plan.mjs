import { classFromAnswers } from '../cascade.mjs';

export const ROUTE_BY_CLASS = Object.freeze({
  critical_breaking: 'critical_fast_path',
  critical_personal: 'critical_personal_path',
  official_drop: 'official_drop_card',
  tour_ticket: 'tour_update',
  normal_news: 'normal_flow',
  merch_official: 'store_drop_draft',
  merch_fan: 'fan_merch_curation',
  merch_outfit: 'outfit_matcher_queue',
  theory_material: 'theory_candidate',
  fan_discussion: 'discussion_card',
  rumor: 'rumor_desk',
  correction_debunk: 'retraction_path',
  duplicate: 'harvest_then_discard',
  noise: 'discard',
  privacy_redline: 'drop_hash_only',
});

function jevAnswers(answers) {
  return answers?.jev && typeof answers.jev === 'object' ? answers.jev : null;
}

function isYes(answer) {
  return answer?.type === 'noul' && answer.probability >= 0.5;
}

function jevDecidedShouldHaveEscalated(answers, config) {
  const raw = jevAnswers(answers);
  if (!raw || (answers.haiku && !answers.haiku.drift)) return false;
  return (raw.q_speculation?.type === 'noul'
    && raw.q_speculation.probability >= config.classes.privacy_redline.thresholds.act)
    || isYes(raw.q_personal);
}

export function impliedClass(classId, answers, config) {
  const raw = jevAnswers(answers);
  if (raw) return classFromAnswers(raw, config)?.class ?? classId;
  return answers?.haiku?.class ?? classId;
}

function answerRoute(answers, config) {
  const raw = jevAnswers(answers);
  if (!raw) return null;
  const result = classFromAnswers(raw, config);
  if (!result || result.confidence < config.classes[result.class].thresholds.act) return null;
  return ROUTE_BY_CLASS[result.class];
}

function isPrimarySource(answers, source) {
  return source === 'official' || isYes(jevAnswers(answers)?.q_official);
}

export function planActions(classId, answers, confidence, storyTimeline, config, source = null) {
  const classConfig = config.classes[classId];
  if (!classConfig || ROUTE_BY_CLASS[classId] !== classConfig.action.route) {
    throw new Error(`unapproved Tidewatch class or route: ${classId}`);
  }
  const inferredClass = impliedClass(classId, answers, config);
  const routeFromAnswers = answerRoute(answers, config);
  if (answers?.injection === true || answers?.haiku?.injection === 'yes') {
    return { classId, impliedClass: inferredClass, finalRoute: classConfig.action.route,
      answerRoute: routeFromAnswers, state: 'held', actions: ['hold_injection'] };
  }
  if (!answers?.redline_hint && classId === 'privacy_redline' && isPrimarySource(answers, source)) {
    return { classId, impliedClass: inferredClass, finalRoute: classConfig.action.route,
      answerRoute: routeFromAnswers, state: 'held', actions: ['hold_redline_primary'] };
  }
  if (answers?.redline_hint || classId === 'privacy_redline') {
    return { classId, impliedClass: inferredClass, finalRoute: classConfig.action.route,
      answerRoute: routeFromAnswers, state: 'held', actions: ['hold_redline'] };
  }
  if (jevDecidedShouldHaveEscalated(answers, config)) {
    return { classId, impliedClass: inferredClass, finalRoute: classConfig.action.route,
      answerRoute: routeFromAnswers, state: 'held', actions: ['hold_invariant'] };
  }
  if (confidence < classConfig.thresholds.act) {
    return { classId, impliedClass: inferredClass, finalRoute: classConfig.action.route,
      answerRoute: routeFromAnswers, state: 'held', actions: ['hold_below_threshold'] };
  }

  const actions = [];
  if (!storyTimeline?.verified_at) {
    if (classConfig.action.requiresFactCheck) actions.push('fact_check');
    if (classConfig.action.requiresVerifier) actions.push('verify');
  }
  actions.push(classConfig.action.route);
  if (classId === 'normal_news' && isYes(jevAnswers(answers)?.q_outfit)) {
    actions.push('outfit_matcher_queue');
  }
  return { classId, impliedClass: inferredClass, finalRoute: classConfig.action.route,
    answerRoute: routeFromAnswers, state: 'planned', actions };
}

export function encodePlan(plan) {
  return JSON.stringify({ version: 1, class: plan.classId, impliedClass: plan.impliedClass,
    state: plan.state, actions: plan.actions });
}
