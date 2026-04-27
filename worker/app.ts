import * as crowdinModule from '@crowdin/app-project-module';
import type { AssetsConfig, FileStore, Cron, ClientConfig, CrowdinAppUtilities } from '@crowdin/app-project-module/out/types';
import type { D1StorageConfig } from '@crowdin/app-project-module/out/storage/d1';
import { Request, Response } from 'express';
import { getRules, saveRules, Rule } from './services/rulesStore';
import { syncRuleManual, handleWebhookEvent } from './services/syncService';
export function createApp({
    app,
    clientId,
    clientSecret,
    assetsConfig,
    d1Config,
    fileStore,
    cron
}: {
    app: ReturnType<typeof crowdinModule.express>;
    clientId: string;
    clientSecret: string;
    assetsConfig: AssetsConfig;
    d1Config: D1StorageConfig;
    fileStore: FileStore;
    cron: Cron;
}) {
    const configuration: ClientConfig = {
        name: "Dialect Languages Copier",
        identifier: "dialect-languages-copier",
        description: "Automatically synchronize translations, approvals, and deletions from a pivot language to selected dialect target languages.",
        clientId,
        clientSecret,
        disableLogsFormatter: true,
        assetsConfig,
        d1Config,
        fileStore,
        cron,
        imagePath: '/logo.svg',
        assetsPath: '/assets',
        scopes: [
            crowdinModule.Scope.PROJECTS,
            crowdinModule.Scope.TRANSLATIONS,
            crowdinModule.Scope.SOURCE_FILES_AND_STRINGS
        ],
        projectTools: {
            fileName: 'index.html',
            uiPath: '/'
        },
        webhooks: [
            {
                events: [
                    'suggestion.added',
                    'suggestion.updated',
                    'suggestion.deleted',
                    'suggestion.approved',
                    'suggestion.disapproved'
                ],
                async callback({ client, events, webhookContext }) {
                    try {
                        const orgId = webhookContext.organizationId;
                        const crowdinId = `${webhookContext.domain || orgId}`;
                        for (const event of events) {
                            const projectId = (event as any).translation?.string?.project?.id || (event as any).project?.id;
                            if (!projectId) continue;
                            const key = `org_${orgId}_project_${projectId}_dialect_rules`;
                            const rulesData = await crowdinModule.metadataStore.getMetadata(key);
                            const rules = rulesData ? (rulesData as Rule[]) : [];
                            if (rules.length > 0) {
                                await handleWebhookEvent(client, event, rules);
                            }
                        }
                    } catch (error) {
                        console.error('Error processing webhooks:', error);
                    }
                },
                deferResponse: true
            }
        ]
    };
    const crowdinApp = crowdinModule.addCrowdinEndpoints(app, configuration) as CrowdinAppUtilities;
    app.get('/api/languages', async (req: Request, res: Response) => {
        try {
            const jwt = req.query.jwt as string;
            if (!jwt) return res.status(400).json({ error: 'JWT token is required' });
            const connection = await crowdinApp.establishCrowdinConnection(jwt, undefined);
            if (!connection.client) {
                return res.status(500).json({ error: 'Failed to establish Crowdin API client' });
            }
            const projectId = connection.context.jwtPayload.context.project_id;
            const projectResponse = await connection.client.projectsGroupsApi.getProject(projectId);
            const project = projectResponse.data;
            const projectLanguages = new Set([project.sourceLanguageId, ...(project.targetLanguageIds || [])]);
            const languagesResponse = await connection.client.languagesApi.withFetchAll().listSupportedLanguages();
            const languages = languagesResponse.data
                .filter((langItem: any) => projectLanguages.has(langItem.data.id))
                .map((langItem: any) => ({
                    id: langItem.data.id,
                    name: langItem.data.name
                }));
            res.json(languages);
        } catch (error) {
            console.error('Error fetching languages:', error);
            res.status(500).json({ error: 'Failed to fetch languages' });
        }
    });
    app.get('/api/rules', async (req: Request, res: Response) => {
        try {
            const jwt = req.query.jwt as string;
            if (!jwt) return res.status(400).json({ error: 'JWT token is required' });
            const connection = await crowdinApp.establishCrowdinConnection(jwt, undefined);
            const orgId = connection.context.jwtPayload.context.organization_id;
            const projectId = connection.context.jwtPayload.context.project_id;
            const rules = await getRules(crowdinApp, orgId, projectId, connection.context.crowdinId);
            res.json(rules);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch rules' });
        }
    });
    app.post('/api/rules', async (req: Request, res: Response) => {
        try {
            const jwt = req.query.jwt as string;
            if (!jwt) return res.status(400).json({ error: 'JWT token is required' });
            const connection = await crowdinApp.establishCrowdinConnection(jwt, undefined);
            const orgId = connection.context.jwtPayload.context.organization_id;
            const projectId = connection.context.jwtPayload.context.project_id;
            const rules = await getRules(crowdinApp, orgId, projectId, connection.context.crowdinId);
            const newRule: Rule = {
                id: req.body.id || crypto.randomUUID(),
                pivotLanguage: req.body.pivotLanguage,
                targetLanguages: req.body.targetLanguages,
                syncApprovals: req.body.syncApprovals
            };
            const existingIndex = rules.findIndex(r => r.id === newRule.id);
            if (existingIndex >= 0) {
                rules[existingIndex] = newRule;
            } else {
                rules.push(newRule);
            }
            await saveRules(crowdinApp, orgId, projectId, connection.context.crowdinId, rules);
            res.json(newRule);
        } catch (error) {
            res.status(500).json({ error: 'Failed to save rule' });
        }
    });
    app.delete('/api/rules/:id', async (req: Request, res: Response) => {
        try {
            const jwt = req.query.jwt as string;
            if (!jwt) return res.status(400).json({ error: 'JWT token is required' });
            const connection = await crowdinApp.establishCrowdinConnection(jwt, undefined);
            const orgId = connection.context.jwtPayload.context.organization_id;
            const projectId = connection.context.jwtPayload.context.project_id;
            let rules = await getRules(crowdinApp, orgId, projectId, connection.context.crowdinId);
            rules = rules.filter(r => r.id !== req.params.id);
            await saveRules(crowdinApp, orgId, projectId, connection.context.crowdinId, rules);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete rule' });
        }
    });
    app.post('/api/sync/:id', async (req: Request, res: Response) => {
        try {
            const jwt = req.query.jwt as string;
            if (!jwt) return res.status(400).json({ error: 'JWT token is required' });
            const connection = await crowdinApp.establishCrowdinConnection(jwt, undefined);
            const orgId = connection.context.jwtPayload.context.organization_id;
            const projectId = connection.context.jwtPayload.context.project_id;
            const rules = await getRules(crowdinApp, orgId, projectId, connection.context.crowdinId);
            const rule = rules.find(r => r.id === req.params.id);
            if (!rule) {
                return res.status(404).json({ error: 'Rule not found' });
            }
            if (connection.client) {
                await syncRuleManual(connection.client, projectId, rule);
                res.json({ success: true });
            } else {
                res.status(500).json({ error: 'Failed to establish Crowdin API client' });
            }
        } catch (error) {
            console.error('Error during manual sync:', error);
            res.status(500).json({ error: 'Failed to trigger sync' });
        }
    });
    return crowdinApp;
}