export type EventCategory = 'external' | 'internal' | 'opportunity' | 'random';

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  metricsTrigger?: Partial<Record<keyof import('./game').Metrics, { below?: number; above?: number }>>;
  immediateEffect?: Partial<import('./game').Metrics>;
  modifiesOptions?: boolean;
}
