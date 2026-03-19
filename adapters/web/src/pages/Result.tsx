import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { usePlayerStore } from '../stores/playerStore';
import { generateEvaluation, generatePlanFile, copyToClipboard, downloadAsFile } from '@startup-meeting/composer';
import { calculateXpReward, applyXp, rollCardDrop, checkAchievements } from '@startup-meeting/engine';
import type { EvaluationReport } from '@startup-meeting/types';
import MeetingMinutesView from '../components/result/MeetingMinutes';
import EvaluationReportView from '../components/result/EvaluationReport';
import RewardReveal from '../components/result/RewardReveal';

export default function Result() {
  const navigate = useNavigate();
  const { meetingSetup, userRole, dialogue, reset } = useGameStore();
  const { profile, updateProfile } = usePlayerStore();
  const [evaluation, setEvaluation] = useState<EvaluationReport | null>(null);
  const [activeTab, setActiveTab] = useState<'minutes' | 'evaluation' | 'rewards'>('evaluation');
  const [isLoading, setIsLoading] = useState(true);
  const [rewardsProcessed, setRewardsProcessed] = useState(false);

  useEffect(() => {
    if (!meetingSetup || !userRole || dialogue.length === 0) {
      navigate('/lobby');
      return;
    }

    generateEvaluation(
      crypto.randomUUID(),
      meetingSetup.topic,
      userRole,
      meetingSetup.participants,
      dialogue,
      meetingSetup.evaluationCriteria,
    )
      .then((report) => {
        setEvaluation(report);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Evaluation failed:', err);
        setIsLoading(false);
      });
  }, [meetingSetup, userRole, dialogue, navigate]);

  // Process rewards once
  useEffect(() => {
    if (!evaluation || !profile || !meetingSetup || rewardsProcessed) return;

    const topicRarity = meetingSetup.topicRarity ?? 'common';
    const xpReward = calculateXpReward(
      topicRarity,
      evaluation.overallGrade,
      evaluation.perspectivesMissed.length,
      false,
    );

    const card = rollCardDrop(
      meetingSetup.participants.map((p) => p.role.id),
      meetingSetup.participants.map((p) => p.role.title),
      evaluation.meetingId,
      false,
    );

    updateProfile((p) => {
      let updated = applyXp(p, xpReward.total);
      updated = {
        ...updated,
        gachaTickets: updated.gachaTickets + 1,
        cards: card ? [...updated.cards, card] : updated.cards,
        meetingHistory: [
          ...updated.meetingHistory,
          {
            id: evaluation.meetingId,
            date: new Date().toISOString(),
            topic: meetingSetup.topic,
            rolePlayedId: userRole!.id,
            rolePlayedTitle: userRole!.title,
            grade: evaluation.overallGrade,
            score: evaluation.overallScore,
            xpEarned: xpReward.total,
            cardsDropped: card ? [card] : [],
          },
        ],
        stats: {
          ...updated.stats,
          totalMeetings: updated.stats.totalMeetings + 1,
          totalXp: updated.stats.totalXp + xpReward.total,
        },
      };

      const newAchievements = checkAchievements(updated);
      if (newAchievements.length > 0) {
        updated = { ...updated, achievements: [...updated.achievements, ...newAchievements] };
      }

      return updated;
    });

    setRewardsProcessed(true);
  }, [evaluation, profile, meetingSetup, userRole, rewardsProcessed, updateProfile]);

  const handleExportPlan = () => {
    if (!evaluation || !meetingSetup) return;
    const plan = generatePlanFile(meetingSetup, evaluation);
    copyToClipboard(plan);
  };

  const handleDownloadPlan = () => {
    if (!evaluation || !meetingSetup) return;
    const plan = generatePlanFile(meetingSetup, evaluation);
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    downloadAsFile(plan, `PLAN-${date}-MEETING.md`);
  };

  const handleNewMeeting = () => {
    reset();
    navigate('/lobby');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">AI evaluating your performance...</p>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] gap-4">
        <p className="text-red-400">Evaluation failed.</p>
        <button onClick={handleNewMeeting} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
          New Meeting
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-2">
        {(['evaluation', 'minutes', 'rewards'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors ${
              activeTab === tab ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab === 'evaluation' ? 'Evaluation' : tab === 'minutes' ? 'Meeting Minutes' : 'Rewards'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'evaluation' && <EvaluationReportView report={evaluation} />}
      {activeTab === 'minutes' && <MeetingMinutesView minutes={evaluation.meetingMinutes} />}
      {activeTab === 'rewards' && profile && (
        <RewardReveal profile={profile} />
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-800">
        <button onClick={handleExportPlan} className="px-4 py-2 bg-green-800 hover:bg-green-700 rounded-lg text-sm transition-colors">
          Copy PLAN
        </button>
        <button onClick={handleDownloadPlan} className="px-4 py-2 bg-green-800 hover:bg-green-700 rounded-lg text-sm transition-colors">
          Download PLAN
        </button>
        <div className="flex-1" />
        <button onClick={handleNewMeeting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors">
          New Meeting
        </button>
      </div>
    </div>
  );
}
