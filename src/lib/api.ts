import { api } from './apiClient';
export interface Rule {
  id: string;
  pivotLanguage: string;
  targetLanguages: string[];
  syncApprovals: boolean;
}
export interface Language {
  id: string;
  name: string;
}
export const getRules = () => api<Rule[]>('/api/rules');
export const saveRule = (rule: Partial<Rule>) => api<Rule>('/api/rules', { method: 'POST', body: JSON.stringify(rule) });
export const deleteRule = (id: string) => api<{ success: boolean }>(`/api/rules/${id}`, { method: 'DELETE' });
export const getLanguages = () => api<Language[]>('/api/languages');
export const triggerManualSync = (id: string) => api<{ success: boolean }>(`/api/sync/${id}`, { method: 'POST' });