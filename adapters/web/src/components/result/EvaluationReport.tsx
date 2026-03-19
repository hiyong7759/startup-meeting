import type { EvaluationReport } from '@startup-meeting/types';

interface Props {
  report: EvaluationReport;
}

const GRADE_COLORS: Record<string, string> = {
  S: 'text-yellow-400',
  A: 'text-green-400',
  B: 'text-blue-400',
  C: 'text-gray-400',
  D: 'text-red-400',
};

export default function EvaluationReportView({ report }: Props) {
  return (
    <div className="space-y-6">
      {/* Overall grade */}
      <div className="text-center p-6 bg-gray-800 rounded-xl">
        <div className={`text-6xl font-black ${GRADE_COLORS[report.overallGrade] ?? 'text-gray-400'}`}>
          {report.overallGrade}
        </div>
        <div className="text-sm text-gray-400 mt-2">{report.overallScore}/25</div>
      </div>

      {/* Criteria scores */}
      {report.criteriaScores.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Score Breakdown</h3>
          <div className="space-y-2">
            {report.criteriaScores.map((cs, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-semibold">{cs.criterion.name}</div>
                  <div className="text-xs text-gray-400">{cs.comment}</div>
                </div>
                <div className="text-sm font-bold">
                  {'*'.repeat(cs.score)}
                  <span className="text-gray-500 ml-1">{cs.score}/5</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Perspectives shown */}
      {report.perspectivesShown.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-green-400 mb-2">Your Perspectives</h3>
          <ul className="space-y-1">
            {report.perspectivesShown.map((p, i) => (
              <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                <span className="text-green-400">OK</span> {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Perspectives missed */}
      {report.perspectivesMissed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-orange-400 mb-2">Missed Perspectives</h3>
          <div className="space-y-2">
            {report.perspectivesMissed.map((p, i) => (
              <div key={i} className="p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    p.impact === 'critical' ? 'bg-red-900 text-red-300' :
                    p.impact === 'important' ? 'bg-orange-900 text-orange-300' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {p.impact}
                  </span>
                  <span className="text-sm font-semibold">{p.perspective}</span>
                </div>
                <p className="text-xs text-gray-400">({p.whoseView} perspective) {p.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternative roles */}
      {report.alternativeRoles.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-blue-400 mb-2">If You Were Someone Else...</h3>
          <div className="space-y-2">
            {report.alternativeRoles.map((alt, i) => (
              <div key={i} className="p-3 bg-gray-800 rounded-lg">
                <div className="text-sm font-semibold mb-1">{alt.roleTitle}</div>
                <p className="text-xs text-gray-400">{alt.wouldHaveDone}</p>
                <p className="text-xs text-gray-500 mt-1">Likely: {alt.likelyOutcome}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Predicted outcomes */}
      {report.predictedOutcomes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Predicted Outcomes</h3>
          <div className="space-y-2">
            {report.predictedOutcomes.map((po, i) => (
              <div key={i} className="p-3 bg-gray-800 rounded-lg flex items-start gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full mt-0.5 ${
                  po.timeframe === 'short' ? 'bg-green-900 text-green-300' :
                  po.timeframe === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                  'bg-red-900 text-red-300'
                }`}>
                  {po.timeframe}
                </span>
                <div className="flex-1">
                  <p className="text-sm">{po.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Probability: {Math.round(po.probability * 100)}% | Risk: {po.risk}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
