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
      const addChunks = chunkArray(toAdd, 100);
      for (const chunk of addChunks) {
        const patches: PatchRequest[] = chunk.map(item => ({
          op: 'add' as const,
          path: '/-',
          value: {
            stringId: parseInt(String(item.stringId), 10),
            languageId: targetLang,
            text: item.text
          }
        }));
        if (patches.length > 0) {
          try {
            await client.stringTranslationsApi.translationBatchOperations(projectId, patches);
          } catch (e) {
            console.error(`[SyncService] Failed batch translations to ${targetLang}`, e);
          }
        }
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
                if (!updatedTargetMap.has(t.stringId as number)) {
                    updatedTargetMap.set(t.stringId as number, t.translationId);
                }
            });
            const approveChunks = chunkArray(toApprove, 100);
            for (const chunk of approveChunks) {
                const patches: PatchRequest[] = chunk.map(stringId => {
                    const translationId = updatedTargetMap.get(stringId);
                    return {
                        op: 'add' as const,
                        path: '/-',
                        value: { translationId: translationId !== undefined ? parseInt(String(translationId), 10) : undefined }
                    } as PatchRequest;
                }).filter(p => p.value && p.value.translationId !== undefined) as PatchRequest[];
                if (patches.length > 0) {
                    try {
                        await client.stringTranslationsApi.approvalBatchOperations(projectId, patches);
                    } catch (e) {
                         console.error(`[SyncService] Failed batch approvals to ${targetLang}`, e);
                    }
                }
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
type ConsolidatedAction = {
    addTranslation?: { text: string };
    deleteTranslation?: boolean;
    addApproval?: boolean;
    removeApproval?: boolean;
};
export const handleBatchedWebhookEvents = async (client: Client, projectId: number, events: any[], rules: Rule[]) => {
  console.log(`[SyncService] Handling batched webhook events for project ${projectId}. Total events: ${events.length}`);
  // Group events by target language
  const actionsByTargetLang = new Map<string, Map<number, ConsolidatedAction>>();
  for (const event of events) {
    const eventLang = event.translation?.targetLanguage?.id || event.targetLanguage?.id;
    if (!eventLang) continue;
    const stringIdRaw = event.translation?.string?.id;
    if (!stringIdRaw) continue;
    const stringId = parseInt(String(stringIdRaw), 10);
    const applicableRules = rules.filter(r => r.pivotLanguage === eventLang);
    for (const rule of applicableRules) {
      for (const targetLang of rule.targetLanguages) {
        if (!actionsByTargetLang.has(targetLang)) {
            actionsByTargetLang.set(targetLang, new Map());
        }
        const stringActions = actionsByTargetLang.get(targetLang)!;
        if (!stringActions.has(stringId)) {
            stringActions.set(stringId, {});
        }
        const action = stringActions.get(stringId)!;
        switch (event.event) {
            case 'suggestion.added':
            case 'suggestion.updated':
                action.addTranslation = { text: event.translation.text };
                action.deleteTranslation = false;
                break;
            case 'suggestion.deleted':
                action.deleteTranslation = true;
                action.addTranslation = undefined;
                action.addApproval = false;
                break;
            case 'suggestion.approved':
                if (rule.syncApprovals) {
                    action.addApproval = true;
                    action.removeApproval = false;
                }
                break;
            case 'suggestion.disapproved':
                if (rule.syncApprovals) {
                    action.removeApproval = true;
                    action.addApproval = false;
                }
                break;
        }
      }
    }
  }
  for (const [targetLang, stringActions] of actionsByTargetLang.entries()) {
      const toAddTranslations: { stringId: number, text: string }[] = [];
      const toDeleteTranslations: number[] = [];
      const toAddApprovals: number[] = [];
      const toRemoveApprovals: number[] = [];
      for (const [stringId, action] of stringActions.entries()) {
          if (action.addTranslation) {
              toAddTranslations.push({ stringId: parseInt(String(stringId), 10), text: action.addTranslation.text });
          }
          if (action.deleteTranslation) {
              toDeleteTranslations.push(parseInt(String(stringId), 10));
          }
          if (action.addApproval) {
              toAddApprovals.push(parseInt(String(stringId), 10));
          }
          if (action.removeApproval) {
              toRemoveApprovals.push(parseInt(String(stringId), 10));
          }
      }
      // Process Translation Additions
      if (toAddTranslations.length > 0) {
          const chunks = chunkArray(toAddTranslations, 100);
          for (const chunk of chunks) {
              const patches: PatchRequest[] = chunk.map(item => ({
                  op: 'add' as const,
                  path: '/-',
                  value: { stringId: parseInt(String(item.stringId), 10), languageId: targetLang, text: item.text }
              }));
              try {
                  await client.stringTranslationsApi.translationBatchOperations(projectId, patches);
              } catch (e) {
                  console.error(`[SyncService] Failed batch translations add to ${targetLang}`, e);
              }
              await delay(500);
          }
      }
      // Process Translation Deletions
      if (toDeleteTranslations.length > 0) {
          const chunks = chunkArray(toDeleteTranslations, 100);
          for (const chunk of chunks) {
              try {
                  const targetTranslations = await client.stringTranslationsApi.withFetchAll().listLanguageTranslations(projectId, targetLang, chunk.join(','));
                  const patches: PatchRequest[] = targetTranslations.data.map((t: any) => ({
                      op: 'remove' as const,
                      path: `/${t.data.id}`
                  }));
                  if (patches.length > 0) {
                      const patchChunks = chunkArray(patches, 100);
                      for (const pChunk of patchChunks) {
                          await client.stringTranslationsApi.translationBatchOperations(projectId, pChunk);
                          await delay(500);
                      }
                  }
              } catch (e) {
                  console.error(`[SyncService] Failed batch translations remove to ${targetLang}`, e);
              }
          }
      }
      // Process Approvals Additions
      if (toAddApprovals.length > 0) {
          const chunks = chunkArray(toAddApprovals, 100);
          for (const chunk of chunks) {
              try {
                  const targetTranslations = await client.stringTranslationsApi.withFetchAll().listLanguageTranslations(projectId, targetLang, chunk.join(','));
                  const patches: PatchRequest[] = targetTranslations.data.map((t: any) => ({
                      op: 'add' as const,
                      path: '/-',
                      value: { translationId: t.data.translationId !== undefined ? parseInt(String(t.data.translationId), 10) : undefined }
                  })).filter(p => p.value.translationId !== undefined);
                  if (patches.length > 0) {
                      const patchChunks = chunkArray(patches, 100);
                      for (const pChunk of patchChunks) {
                          await client.stringTranslationsApi.approvalBatchOperations(projectId, pChunk);
                          await delay(500);
                      }
                  }
              } catch (e) {
                  console.error(`[SyncService] Failed batch approvals add to ${targetLang}`, e);
              }
          }
      }
      // Process Approvals Deletions
      if (toRemoveApprovals.length > 0) {
          const chunks = chunkArray(toRemoveApprovals, 100);
          for (const chunk of chunks) {
              try {
                  const approvalsRes = await client.stringTranslationsApi.withFetchAll().listTranslationApprovals(projectId, { languageId: targetLang });
                  const approvalIdsToRemove = approvalsRes.data
                      .filter((a: any) => chunk.includes(a.data.stringId))
                      .map((a: any) => a.data.id);
                  const patches: PatchRequest[] = approvalIdsToRemove.map((id: number) => ({
                      op: 'remove' as const,
                      path: `/${id}`
                  }));
                  if (patches.length > 0) {
                      const patchChunks = chunkArray(patches, 100);
                      for (const pChunk of patchChunks) {
                          await client.stringTranslationsApi.approvalBatchOperations(projectId, pChunk);
                          await delay(500);
                      }
                  }
              } catch (e) {
                  console.error(`[SyncService] Failed batch approvals remove to ${targetLang}`, e);
              }
          }
      }
  }
};