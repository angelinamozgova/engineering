// start: маршрутизация utterance — rules first, LLM только как кандидат (без вызова API)

export type RouteDecision = 'rules' | 'llm_candidate';

export type RuleSignals = {
  hasIntent: boolean;
  requiredFieldsFilled: number;
  requiredFieldsTotal: number;
};

/** start: доля заполненных обязательных полей */
export function fieldCoverage(signals: RuleSignals): number {
  if (signals.requiredFieldsTotal <= 0) return 0;
  return signals.requiredFieldsFilled / signals.requiredFieldsTotal;
}
// end: доля заполненных обязательных полей

/** start: решение маршрута без сетевого LLM */
export function routeUtterance(signals: RuleSignals, minCoverage = 0.6): RouteDecision {
  if (!signals.hasIntent) return 'llm_candidate';
  const coverage = fieldCoverage(signals);
  if (coverage >= minCoverage) return 'rules';
  return 'llm_candidate';
}
// end: решение маршрута без сетевого LLM