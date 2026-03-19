import type { Role, Department, HierarchyLevel } from '@startup-meeting/types';
import rolesData from '../data/roles.json' with { type: 'json' };

export function getAllRoles(): Role[] {
  return rolesData as Role[];
}

export function getRole(id: string): Role | undefined {
  return (rolesData as Role[]).find((r) => r.id === id);
}

export function selectParticipants(
  topicCategory: string,
  topicKeywords: string[],
  count: number = 6,
): Role[] {
  const roles = getAllRoles();

  // Score each role by relevance to the topic
  const scored = roles.map((role) => {
    let score = 0;

    // Department match
    if (role.department === topicCategory) score += 10;

    // Expertise match
    for (const keyword of topicKeywords) {
      if (role.expertise.some((e) => e.includes(keyword))) score += 5;
    }

    // Always include at least one executive
    if (role.level === 'executive') score += 3;

    // Add some randomness for variety
    score += Math.random() * 3;

    return { role, score };
  });

  // Sort by score, take top N, ensure hierarchy diversity
  scored.sort((a, b) => b.score - a.score);

  const selected: Role[] = [];
  const levelCounts: Record<string, number> = {};

  for (const { role } of scored) {
    if (selected.length >= count) break;

    // Limit per level to ensure diversity
    const levelCount = levelCounts[role.level] ?? 0;
    if (role.level === 'executive' && levelCount >= 2) continue;
    if (role.level !== 'executive' && levelCount >= 2) continue;

    selected.push(role);
    levelCounts[role.level] = levelCount + 1;
  }

  return selected;
}

export function getRolesByDepartment(dept: Department): Role[] {
  return (rolesData as Role[]).filter((r: Role) => r.department === dept);
}

export function getRolesByLevel(level: HierarchyLevel): Role[] {
  return (rolesData as Role[]).filter((r: Role) => r.level === level);
}
