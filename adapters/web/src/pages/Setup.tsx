import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { generateContextQuestions, generateMeetingSetup } from '@startup-meeting/composer';
import { getAllRoles, pullGacha, pullGachaByRarity } from '@startup-meeting/engine';
import type { ContextQuestion, MeetingParticipant, TopicRarity } from '@startup-meeting/types';
import ContextQuestions from '../components/setup/ContextQuestions';
import RoleSelector from '../components/setup/RoleSelector';

export default function Setup() {
  const navigate = useNavigate();
  const { topic, setMeetingSetup, setUserRole, setSessionPhase, setTopic } = useGameStore();
  const [phase, setPhase] = useState<'loading' | 'questions' | 'selecting_role'>('loading');
  const [questions, setQuestions] = useState<ContextQuestion[]>([]);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Handle gacha topics
  useEffect(() => {
    if (!topic) {
      navigate('/lobby');
      return;
    }

    let resolvedTopic = topic;

    // Check if it's a gacha pull
    if (topic.startsWith('__gacha')) {
      const rarityMatch = topic.match(/__gacha_(\w+)__/);
      if (rarityMatch) {
        const result = pullGachaByRarity(rarityMatch[1] as TopicRarity);
        resolvedTopic = result.title;
      } else {
        const result = pullGacha();
        resolvedTopic = result.topic.title;
      }
      setTopic(resolvedTopic);
    }

    // Generate context questions
    generateContextQuestions(resolvedTopic)
      .then((qs) => {
        setQuestions(qs);
        setPhase('questions');
      })
      .catch((err) => {
        setError(`Failed to generate questions: ${err instanceof Error ? err.message : String(err)}`);
      });
  }, [topic, navigate, setTopic]);

  const handleQuestionsComplete = useCallback(async (answered: ContextQuestion[]) => {
    setPhase('loading');
    try {
      const allRoles = getAllRoles();
      const setup = await generateMeetingSetup(topic, answered, allRoles);
      setMeetingSetup(setup);
      setParticipants(setup.participants);
      setPhase('selecting_role');
      setSessionPhase('role_selection');
    } catch (err) {
      setError(`Failed to setup meeting: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [topic, setMeetingSetup, setSessionPhase]);

  const handleRoleSelect = useCallback((participant: MeetingParticipant) => {
    setUserRole(participant.role);
    setSessionPhase('meeting_active');
    navigate('/meeting');
  }, [setUserRole, setSessionPhase, navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] gap-4 p-8">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => navigate('/lobby')}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">AI preparing meeting...</p>
        </div>
      </div>
    );
  }

  if (phase === 'questions') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] p-8">
        <div className="w-full max-w-lg">
          <h2 className="text-xl font-bold mb-2">{topic}</h2>
          <p className="text-gray-400 text-sm mb-6">Meeting context will help AI set up a better meeting.</p>
          <ContextQuestions
            questions={questions}
            onComplete={handleQuestionsComplete}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)] p-8">
      <div className="w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-2">Select Your Role</h2>
        <p className="text-gray-400 text-sm mb-6">
          Choose which role you want to play in this meeting.
        </p>
        <RoleSelector
          participants={participants}
          onSelect={handleRoleSelect}
        />
      </div>
    </div>
  );
}
