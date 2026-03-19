import type { PlayerProfile } from '@startup-meeting/types';

interface Props {
  profile: PlayerProfile;
}

export default function RewardReveal({ profile }: Props) {
  const latestMeeting = profile.meetingHistory[profile.meetingHistory.length - 1];

  return (
    <div className="space-y-6">
      {/* XP */}
      <div className="text-center p-6 bg-gray-800 rounded-xl">
        <div className="text-3xl font-bold text-yellow-400">
          +{latestMeeting?.xpEarned ?? 0} XP
        </div>
        <div className="text-sm text-gray-400 mt-2">
          Lv.{profile.level} {profile.title}
        </div>
        <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-1000"
            style={{
              width: `${Math.min(100, ((profile.xp) / (profile.xp + profile.xpToNextLevel)) * 100)}%`,
            }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {profile.xpToNextLevel} XP to next level
        </div>
      </div>

      {/* Card drop */}
      {latestMeeting?.cardsDropped && latestMeeting.cardsDropped.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-purple-400 mb-3">Card Dropped!</h3>
          {latestMeeting.cardsDropped.map((card) => {
            const rarityColors: Record<string, string> = {
              common: 'border-gray-500 bg-gray-800',
              rare: 'border-blue-500 bg-blue-900/30',
              epic: 'border-purple-500 bg-purple-900/30',
              legendary: 'border-yellow-500 bg-yellow-900/30',
            };
            return (
              <div
                key={card.id}
                className={`p-4 rounded-xl border-2 ${rarityColors[card.rarity] ?? rarityColors.common}`}
              >
                <div className="text-lg font-bold">{card.roleTitle}</div>
                <div className="text-xs text-gray-400 capitalize">{card.rarity}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Gacha ticket */}
      <div className="p-4 bg-gray-800 rounded-xl text-center">
        <div className="text-sm text-gray-400">Gacha Tickets</div>
        <div className="text-2xl font-bold">{profile.gachaTickets}</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-gray-800 rounded-lg text-center">
          <div className="text-xs text-gray-400">Total Meetings</div>
          <div className="text-lg font-bold">{profile.stats.totalMeetings}</div>
        </div>
        <div className="p-3 bg-gray-800 rounded-lg text-center">
          <div className="text-xs text-gray-400">Total XP</div>
          <div className="text-lg font-bold">{profile.stats.totalXp}</div>
        </div>
        <div className="p-3 bg-gray-800 rounded-lg text-center">
          <div className="text-xs text-gray-400">Cards</div>
          <div className="text-lg font-bold">{profile.cards.length}</div>
        </div>
        <div className="p-3 bg-gray-800 rounded-lg text-center">
          <div className="text-xs text-gray-400">Achievements</div>
          <div className="text-lg font-bold">{profile.achievements.length}</div>
        </div>
      </div>
    </div>
  );
}
