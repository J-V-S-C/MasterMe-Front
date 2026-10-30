import type { KnowledgeNode } from '../api';

export function knowledgeStatusKey(status: KnowledgeNode['status']): 'mapExplained' | 'mapReview' | 'mapReady' {
  return status === 'EXPLAINED' ? 'mapExplained' : status === 'REVIEW' ? 'mapReview' : 'mapReady';
}
