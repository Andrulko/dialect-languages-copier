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
                        console.log(`Received ${events.length} webhook events`);
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
            res.json([
                { id: 'en', name: 'English' },
                { id: 'fr', name: 'French' },
                { id: 'fr-CA', name: 'French, Canadian' }
            ]);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch languages' });
        }
    });
    app.get('/api/rules', async (req: Request, res: Response) => {
        try {
            const jwt = req.query.jwt as string;
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
            const connection = await crowdinApp.establishCrowdinConnection(jwt, undefined);
            const orgId = connection.context.jwtPayload.context.organization_id;
            const projectId = connection.context.jwtPayload.context.project_id;
            const rules = await getRules(crowdinApp, orgId, projectId, connection.context.crowdinId);
            const newRule: Rule = {
                id: crypto.randomUUID(),
                pivotLanguage: req.body.pivotLanguage,
                targetLanguages: req.body.targetLanguages,
                syncApprovals: req.body.syncApprovals
            };
            rules.push(newRule);
            await saveRules(crowdinApp, orgId, projectId, connection.context.crowdinId, rules);
            res.json(newRule);
        } catch (error) {
            res.status(500).json({ error: 'Failed to save rule' });
        }
    });
    app.delete('/api/rules/:id', async (req: Request, res: Response) => {
        try {
            const jwt = req.query.jwt as string;
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
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to trigger sync' });
        }
    });
    return crowdinApp;
}