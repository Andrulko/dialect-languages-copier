import { CrowdinApi } from '@crowdin/crowdin-api-client';
export const syncRuleManual = async (client: CrowdinApi, projectId: number, rule: any) => {
  console.log(`[SyncService] Starting manual sync for project ${projectId}, rule: ${rule.id}`);
  // Stub implementation
};
export const handleWebhookEvent = async (client: CrowdinApi, event: any, rules: any[]) => {
  console.log(`[SyncService] Handling webhook event`, event.event);
  // Stub implementation
};