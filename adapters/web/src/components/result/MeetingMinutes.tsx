import type { MeetingMinutes } from '@startup-meeting/types';

interface Props {
  minutes: MeetingMinutes;
}

export default function MeetingMinutesView({ minutes }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-2">Topic</h3>
        <p className="text-lg font-bold">{minutes.topic}</p>
        <p className="text-xs text-gray-500">{minutes.date}</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-2">Participants</h3>
        <p className="text-sm">{minutes.participants.join(', ')}</p>
      </div>

      {minutes.keyDiscussionPoints.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Key Discussion Points</h3>
          <div className="space-y-2">
            {minutes.keyDiscussionPoints.map((point, i) => (
              <div key={i} className="p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">{point.speaker}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    point.reaction === 'agreed' ? 'bg-green-900 text-green-300' :
                    point.reaction === 'opposed' ? 'bg-red-900 text-red-300' :
                    'bg-yellow-900 text-yellow-300'
                  }`}>
                    {point.reaction}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{point.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {minutes.decisions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Decisions</h3>
          <ul className="space-y-1">
            {minutes.decisions.map((d, i) => (
              <li key={i} className="text-sm text-gray-300 pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-blue-500 before:rounded-full">
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {minutes.actionItems.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Action Items</h3>
          <div className="space-y-2">
            {minutes.actionItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg text-sm">
                <input type="checkbox" className="rounded" readOnly />
                <span className="flex-1">{item.description}</span>
                <span className="text-xs text-gray-500">{item.owner}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  item.priority === 'high' ? 'bg-red-900 text-red-300' :
                  item.priority === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                  'bg-gray-700 text-gray-400'
                }`}>
                  {item.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
