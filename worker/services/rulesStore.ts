import type { CrowdinAppUtilities } from '@crowdin/app-project-module/out/types';
export interface Rule {
  id: string;
  pivotLanguage: string;
  targetLanguages: string[];
  syncApprovals: boolean;
}
export const getRules = async (app: CrowdinAppUtilities, orgId: number, projectId: number, crowdinId: string): Promise<Rule[]> => {
  const key = `org_${orgId}_project_${projectId}_dialect_rules`;
  const data = await app.getMetadata(key);
  return data ? (data as Rule[]) : [];
};
export const saveRules = async (app: CrowdinAppUtilities, orgId: number, projectId: number, crowdinId: string, rules: Rule[]): Promise<void> => {
  const key = `org_${orgId}_project_${projectId}_dialect_rules`;
  await app.saveMetadata(key, rules, crowdinId);
};