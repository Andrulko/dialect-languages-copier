import { Client, StringTranslationsModel, ResponseObject, PatchRequest } from '@crowdin/crowdin-api-client';
import { Rule } from './rulesStore';
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export const syncRuleManual = async (client: Client, projectId: number, rule: Rule) => {
  console.log(`[SyncService] Starting manual sync for project ${projectId}, rule: ${rule.id}`);
  try {
    // Fetch pivot translations
    const pivotResponse = await client.stringTranslationsApi.withFetchAll().listLanguageTranslations(projectId, rule.pivotLanguage);
    const pivotTranslations = pivotResponse.data.map((item: any) => item.data as StringTranslationsModel.PlainLanguageTranslation);
    for (const targetLang of rule.targetLanguages) {
      console.log(`[SyncService] Syncing to target language: ${targetLang}`);
      const targetResponse = await client.stringTranslationsApi.withFetchAll().listLanguageTranslations(projectId, targetLang);
      const targetTranslations = targetResponse.data.map((item: any) => item.data as StringTranslationsModel.PlainLanguageTranslation);
      const targetMap = new Map<number, StringTranslationsModel.PlainLanguageTranslation>();
      for (const t of targetTranslations) {
        if (!targetMap.has(t.stringId)) {
          targetMap.set(t.stringId, t);
        }
      }
      const toAdd: { stringId: number; text: string }[] = [];
      for (const pt of pivotTranslations) {
        const tt = targetMap.get(pt.stringId);
        if (!tt || tt.text !== pt.text) {
          toAdd.push({ stringId: pt.stringId, text: pt.text });
        }
      }
      // Add missing/differing translations
      const addChunks = chunkArray(toAdd, 50);
      for (const chunk of addChunks) {
        await Promise.all(chunk.map(async (item) => {
          try {
            await client.stringTranslationsApi.addTranslation(projectId, {
              stringId: item.stringId,
              languageId: targetLang,
              text: item.text
            });
          } catch (e) {
            console.error(`[SyncService] Failed to add translation for string ${item.stringId} to ${targetLang}`, e);
          }
        }));
        await delay(500); // Rate limiting mitigation
      }
      // Handle approvals
      if (rule.syncApprovals) {
        const pivotApprovalsRes = await client.stringTranslationsApi.withFetchAll().listTranslationApprovals(projectId, { languageId: rule.pivotLanguage });
        const targetApprovalsRes = await client.stringTranslationsApi.withFetchAll().listTranslationApprovals(projectId, { languageId: targetLang });
        const approvedStringIds = new Set<number>(pivotApprovalsRes.data.map((a: any) => a.data.stringId as number));
        const targetApprovedStringIds = new Set<number>(targetApprovalsRes.data.map((a: any) => a.data.stringId as number));
        const toApprove: number[] = [];
        for (const stringId of approvedStringIds) {
          if (!targetApprovedStringIds.has(stringId as number)) {
            toApprove.push(stringId as number);
          }
        }
        // We need the translation IDs in the target language to approve them
        if (toApprove.length > 0) {
            const updatedTargetResponse = await client.stringTranslationsApi.withFetchAll().listLanguageTranslations(projectId, targetLang);
            const updatedTargetMap = new Map<number, number>();
            updatedTargetResponse.data.forEach((item: any) => {
                const t = item.data as StringTranslationsModel.PlainLanguageTranslation;
                if (!updatedTargetMap.has(t.stringId)) {
                    updatedTargetMap.set(t.stringId, t.translationId);
                }
            });
            const approveChunks = chunkArray(toApprove, 50);
            for (const chunk of approveChunks) {
                await Promise.all(chunk.map(async (stringId) => {
                    const translationId = updatedTargetMap.get(stringId);
                    if (translationId) {
                        try {
                            await client.stringTranslationsApi.addApproval(projectId, { translationId });
                        } catch (e) {
                             console.error(`[SyncService] Failed to add approval for translation ${translationId}`, e);
                        }
                    }
                }));
                await delay(500);
            }
        }
      }
    }
  } catch (error) {
    console.error(`[SyncService] Manual sync failed for rule ${rule.id}:`, error);
    throw error;
  }
};
export const handleWebhookEvent = async (client: Client, event: any, rules: Rule[]) => {
  console.log(`[SyncService] Handling webhook event`, event.event);
  const eventLang = event.translation?.targetLanguage?.id || event.targetLanguage?.id;
  if (!eventLang) return;
  const projectId = event.translation?.string?.project?.id || event.project?.id;
  if (!projectId) return;
  const applicableRules = rules.filter(r => r.pivotLanguage === eventLang);
  if (applicableRules.length === 0) return;
  for (const rule of applicableRules) {
    for (const targetLang of rule.targetLanguages) {
      try {
        if (event.event === 'suggestion.added' || event.event === 'suggestion.updated') {
           await client.stringTranslationsApi.addTranslation(projectId, {
             stringId: event.translation.string.id,
             languageId: targetLang,
             text: event.translation.text
           });
        } else if (event.event === 'suggestion.deleted') {
           await client.stringTranslationsApi.deleteAllTranslations(projectId, event.translation.string.id, targetLang);
        } else if (rule.syncApprovals && event.event === 'suggestion.approved') {
           // Need to find the translation ID in the target language to approve
           const targetTranslations = await client.stringTranslationsApi.listStringTranslations(projectId, event.translation.string.id, targetLang);
           if (targetTranslations.data.length > 0) {
               const translationId = targetTranslations.data[0].data.id;
               await client.stringTranslationsApi.addApproval(projectId, { translationId });
           }
        } else if (rule.syncApprovals && event.event === 'suggestion.disapproved') {
           await client.stringTranslationsApi.removeStringApprovals(projectId, event.translation.string.id);
        }
      } catch (e) {
         console.error(`[SyncService] Failed to process webhook event ${event.event} for language ${targetLang}`, e);
      }
    }
  }
};