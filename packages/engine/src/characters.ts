import type { Character, CharacterId, Agenda } from '@startup-meeting/types';
import type { Metrics } from '@startup-meeting/types';
import charactersData from '../data/characters.json' with { type: 'json' };

export function getCharacters(): Character[] {
  return charactersData as Character[];
}

export function getCharacter(id: CharacterId): Character {
  const char = (charactersData as Character[]).find((c) => c.id === id);
  if (!char) throw new Error(`Character not found: ${id}`);
  return char;
}

export function getCharacterOpinionOrder(agenda: Agenda, metrics: Metrics): CharacterId[] {
  const chars = getCharacters();
  // Sort by relevance to agenda category
  const categoryRelevance: Record<string, CharacterId[]> = {
    product: ['cpo', 'cto', 'cmo', 'cfo', 'intern'],
    engineering: ['cto', 'cpo', 'cfo', 'cmo', 'intern'],
    marketing: ['cmo', 'cpo', 'cfo', 'cto', 'intern'],
    finance: ['cfo', 'cmo', 'cto', 'cpo', 'intern'],
    hr: ['cpo', 'cfo', 'cto', 'cmo', 'intern'],
    strategy: ['cmo', 'cto', 'cpo', 'cfo', 'intern'],
  };
  return categoryRelevance[agenda.category] ?? chars.map((c) => c.id);
}
