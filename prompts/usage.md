# Usage

## Overview
Crowdin app with Project Tools module for project-specific functionality.
- Backend: TypeScript with Express.js and Crowdin Apps SDK
- Frontend: React + TypeScript + ShadCN UI + Crowdin Apps JS API

## Tech Stack
- Crowdin Apps JS API
- Crowdin Apps SDK (@crowdin/app-project-module)
- React
- ShadCN UI
- Tailwind
- Lucide Icons
- ESLint
- Vite
- TypeScript
- Express.js
- Cloudflare Workers

## Development Restrictions
- **Tailwind Colors**: Hardcode custom colors in `tailwind.config.js`, NOT in `index.css`
- **Components**: Use existing ShadCN components instead of writing custom ones
- **Icons**: Import from `lucide-react` directly
- **Logo**: Always generate custom logo in `public/logo.svg` based on app purpose
- **Error Handling**: ErrorBoundary components are pre-implemented
- **Authentication**: Always use JWT tokens from Crowdin for API requests
- **Project Tools Configuration**: Don't modify the projectTools configuration structure
- **Scopes**: Ensure your app has appropriate API scopes
- **Storage Keys**: Always include organizationId in metadata keys to isolate data per organization

## Styling
- Responsive, accessible
- Prefer ShadCN components; Tailwind for layout/spacing/typography
- Use framer-motion sparingly for micro-interactions

## Project Structure

### Backend Structure
- `worker/app.ts` - Express app factory with Project Tools module configuration
- `worker/index.ts` - Cloudflare Worker entry point (HTTP handler, cron scheduler, middleware)
- `worker/types/` - Backend TypeScript type definitions
  - `cloudflare-env.d.ts` - Cloudflare environment types (KV storage, secrets)

### Frontend Structure
- `index.html` - HTML entry point with Crowdin Apps JS API script
- `public/logo.svg` - App logo
- `src/main.tsx` - React entry point with ErrorBoundary wrapper
- `src/index.css` - Global styles and Tailwind CSS customizations
- `src/components/` - React components
  - `app-sidebar.tsx` - Application sidebar navigation
  - `ErrorBoundary.tsx` - React error boundary with backend error reporting
  - `ErrorFallback.tsx` - Fallback UI component for error states
  - `RouteErrorBoundary.tsx` - Error boundary for routing errors
  - `layout/` - Layout components
    - `AppLayout.tsx` - Main application layout wrapper
  - `ui/` - ShadCN UI components (button, card, sonner, etc.)
- `src/pages/` - Page components
  - `HomePage.tsx` - Home page component (main entry point for your app logic)
- `src/hooks/` - Custom React hooks
  - `use-mobile.tsx` - Hook for detecting mobile breakpoints
- `src/lib/` - Utility modules
  - `utils.ts` - Tailwind utility functions (`cn` for class merging)
  - `errorReporter.ts` - Client-side error reporting to backend
  - `apiClient.ts` - Generic API call wrapper with JWT token handling
- `src/types/` - TypeScript type definitions
  - `global.d.ts` - Global type declarations
  - `vite-env.d.ts` - Vite environment types

## Backend Development

### App Configuration

Configure your app identity in `worker/app.ts`:

```typescript
const configuration: ClientConfig = {
    name: "Your App Name",                    // Display name shown in Crowdin UI
    identifier: "your-unique-app-identifier", // Unique ID (lowercase, hyphens)
    description: "Your app description",      // Brief description of functionality
    // ... rest of configuration
}
```

**Guidelines:**
- **identifier**: Must be unique across all Crowdin apps. Format: `company-project-tools`
- **name**: User-friendly display name (e.g., "Project Analyzer")
- **description**: Brief explanation of what your app does

#### Required Scopes

Add scopes to configuration in `worker/app.ts` based on your app's functionality.

**⚠️ IMPORTANT**: Only use scopes from the list below. Do not invent or use non-existent scopes!

```typescript
const configuration: ClientConfig = {
    // ... other configuration ...
    scopes: [
        // Choose from the following valid scopes:
        
        // General scopes
        crowdinModule.Scope.NOTIFICATIONS,               // 'notification' - Notifications management
        
        // Project-level scopes
        crowdinModule.Scope.PROJECTS,                    // 'project' - Project management
        crowdinModule.Scope.TASKS,                       // 'project.task' - Project tasks
        crowdinModule.Scope.REPORTS,                     // 'project.report' - Project reports
        crowdinModule.Scope.TRANSLATION_STATUS,          // 'project.status' - Translation status
        crowdinModule.Scope.SOURCE_FILES_AND_STRINGS,    // 'project.source' - Source files and strings
        crowdinModule.Scope.WEBHOOKS,                    // 'project.webhook' - Project webhooks
        crowdinModule.Scope.TRANSLATIONS,                // 'project.translation' - Translations
        crowdinModule.Scope.SCREENSHOTS,                 // 'project.screenshot' - Screenshots
        
        // Organization-level scopes
        crowdinModule.Scope.USERS,                       // 'user' - User management
        crowdinModule.Scope.TEAMS,                       // 'team' - Team management
        crowdinModule.Scope.GROUPS,                      // 'group' - Group management
        crowdinModule.Scope.ORGANIZATION_WEBHOOKS,       // 'webhook' - Organization webhooks
        crowdinModule.Scope.VENDORS,                     // 'vendor' - Vendor management
        crowdinModule.Scope.FIELDS,                      // 'field' - Custom fields
        crowdinModule.Scope.SECURITY_LOGS,               // 'security-log' - Security logs
        crowdinModule.Scope.APPLICATIONS,                // 'application' - Applications management
        
        // Resources
        crowdinModule.Scope.TRANSLATION_MEMORIES,        // 'tm' - Translation memories
        crowdinModule.Scope.MACHINE_TRANSLATION_ENGINES, // 'mt' - Machine translation engines
        crowdinModule.Scope.GLOSSARIES,                  // 'glossary' - Glossaries
        
        // AI-related scopes
        crowdinModule.Scope.AI,                          // 'ai' - AI features
        crowdinModule.Scope.AI_PROVIDERS,                // 'ai.provider' - AI providers
        crowdinModule.Scope.AI_PROMPTS,                  // 'ai.prompt' - AI prompts
        crowdinModule.Scope.AI_PROXIES,                  // 'ai.proxy' - AI proxies
    ]
}
```

### Project Tools Module Configuration

Configure the Project Tools module in `worker/app.ts`:

```typescript
const configuration: ClientConfig = {
    // ... other configuration ...

    projectTools: {
      fileName: 'index.html',
      uiPath: '/'
    }
}
```

### API Endpoints

#### Common Examples

**Standard Endpoint:**
```typescript
app.post('/api/process-data', async (req: Request, res: Response) => {
    try {
        const jwt = req.query.jwt as string;
        const { data } = req.body;
        
        if (!jwt) {
            return res.status(400).json({ success: false, error: 'JWT token is required' });
        }
        if (!data) {
            return res.status(400).json({ success: false, error: 'Data is required' });
        }

        const connection = await crowdinApp.establishCrowdinConnection(jwt, undefined);
        
        // Your async logic here
        const result = await processData(data);
        
        res.json({ 
            success: true, 
            data: result
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Operation failed' });
    }
});
```

#### Best Practices

1. **Always await async operations**
   ```typescript
   // ✅ CORRECT - all operations are awaited
   app.post('/api/save-config', async (req: Request, res: Response) => {
       const jwt = req.query.jwt as string;

       if (!jwt) {
           return res.status(400).json({ success: false, error: 'JWT token is required' });
       }

       const connection = await crowdinApp.establishCrowdinConnection(jwt, undefined);
       
       await crowdinApp.saveMetadata(key, data, connection.context.crowdinId);
       
       res.json({ success: true });
   });
   
   // ❌ WRONG - missing await, operation will NOT complete
   app.post('/api/save-config', async (req: Request, res: Response) => {
       const jwt = req.query.jwt as string;
       const connection = await crowdinApp.establishCrowdinConnection(jwt, undefined);
       
       // This will NOT save! Response is sent before operation completes
       crowdinApp.saveMetadata(key, data, connection.context.crowdinId);
       
       res.json({ success: true });
   });
   ```

2. **Always return response after all operations complete**
   ```typescript
   // ✅ CORRECT - response sent after all operations
   app.post('/api/update', async (req: Request, res: Response) => {
       const connection = await crowdinApp.establishCrowdinConnection(jwt, undefined);
       
       await operation1();
       await operation2();
       await operation3();
       
       res.json({ success: true }); // All operations completed
   });
   
   // ❌ WRONG - response sent too early
   app.post('/api/update', async (req: Request, res: Response) => {
       const connection = await crowdinApp.establishCrowdinConnection(jwt, undefined);
       
       res.json({ success: true }); // Sent immediately
       
       await operation1(); // These will NOT execute
       await operation2();
       await operation3();
   });
   ```

3. **Use Promise.all for independent parallel operations**
   ```typescript
   // ✅ CORRECT - parallel operations (faster)
   const [result1, result2, result3] = await Promise.all([
       connection.client.projectsGroupsApi.getProject(id1),
       connection.client.projectsGroupsApi.getProject(id2),
       connection.client.projectsGroupsApi.getProject(id3)
   ]);
   
   // ❌ WRONG - sequential operations (slower)
   const result1 = await connection.client.projectsGroupsApi.getProject(id1);
   const result2 = await connection.client.projectsGroupsApi.getProject(id2);
   const result3 = await connection.client.projectsGroupsApi.getProject(id3);
   ```

4. **Wrap all async code in try-catch**
   ```typescript
   // ✅ CORRECT - comprehensive error handling
   app.get('/api/data', async (req: Request, res: Response) => {
       try {
           const connection = await crowdinApp.establishCrowdinConnection(jwt, undefined);
           const data = await fetchData();
           res.json({ success: true, data });
       } catch (error) {
           console.error('Error:', error);
           res.status(500).json({ success: false, error: 'Operation failed' });
       }
   });
   
   // ❌ WRONG - no error handling
   app.get('/api/data', async (req: Request, res: Response) => {
       const connection = await crowdinApp.establishCrowdinConnection(jwt, undefined);
       const data = await fetchData(); // May throw unhandled error
       res.json({ success: true, data });
   });
   ```

5. **Never use setTimeout without proper promise wrapper**
   ```typescript
   // ✅ CORRECT - setTimeout with promise wrapper
   app.get('/api/delayed', async (req: Request, res: Response) => {
       await new Promise((resolve) => {
           setTimeout(async () => {
               await saveData();
               resolve(undefined);
           }, 1000);
       });
       
       res.json({ success: true });
   });
   
   // ❌ WRONG - setTimeout without await (will NOT execute)
   app.get('/api/delayed', async (req: Request, res: Response) => {
       setTimeout(async () => {
           await saveData(); // This will NOT execute
       }, 1000);
       
       res.json({ success: true }); // Sent immediately
   });
   ```

6. **Always check for required parameters early**
   ```typescript
   // ✅ CORRECT - validate parameters first
   app.post('/api/process', async (req: Request, res: Response) => {
       const jwt = req.query.jwt as string;
       const { projectId, data } = req.body;
       
       // Validate early
       if (!jwt) {
           return res.status(400).json({ success: false, error: 'JWT token is required' });
       }
       if (!projectId) {
           return res.status(400).json({ success: false, error: 'Project ID is required' });
       }
       if (!data) {
           return res.status(400).json({ success: false, error: 'Data is required' });
       }
       
       // Continue with processing
       const connection = await crowdinApp.establishCrowdinConnection(jwt, undefined);
       // ... rest of the logic
   });
   ```

7. **Extract user_id, organization_id, and project_id correctly**
   ```typescript
   // ✅ CORRECT - extract all IDs from JWT payload
   app.post('/api/endpoint', async (req: Request, res: Response) => {
       const jwt = req.query.jwt as string;

       if (!jwt) {
           return res.status(400).json({ success: false, error: 'JWT token is required' });
       }

       const connection = await crowdinApp.establishCrowdinConnection(jwt, undefined);
       
       const userId = connection.context.jwtPayload.context.user_id;
       const organizationId = connection.context.jwtPayload.context.organization_id;
       const projectId = connection.context.jwtPayload.context.project_id;
       
       console.log('User ID:', userId);              // number
       console.log('Organization ID:', organizationId); // number
       console.log('Project ID:', projectId);        // number
       
       res.json({ 
           success: true, 
           data: { userId, organizationId, projectId }
       });
   });
   
   // ❌ WRONG - incorrect paths
   const userId = connection.context.user_id; // Wrong: missing jwtPayload.context
   const organizationId = connection.context.organization_id; // Wrong: missing jwtPayload.context
   const projectId = connection.context.project_id; // Wrong: missing jwtPayload.context
   ```

### Crowdin API Client

#### Official Documentation

The `connection.client` object is an instance of `@crowdin/crowdin-api-client`.

**📚 Complete API Reference:** https://crowdin.github.io/crowdin-api-client-js/modules.html

**⚠️ CRITICAL**: Only use methods documented in the official API reference. Do NOT invent or assume methods exist.

#### Common Examples

**Standard Endpoint Template:**
```typescript
app.get('/api/your-endpoint', async (req: Request, res: Response) => {
    try {
        const jwt = req.query.jwt as string;
        if (!jwt) {
            return res.status(400).json({ success: false, error: 'JWT token is required' });
        }

        if (!crowdinApp.establishCrowdinConnection) {
            return res.status(500).json({ success: false, error: 'Crowdin connection method not available' });
        }

        const connection = await crowdinApp.establishCrowdinConnection(jwt, undefined);

        if (!connection.client) {
            return res.status(500).json({ success: false, error: 'Crowdin API client not available' });
        }

        const userId = connection.context.jwtPayload.context.user_id;
        const organizationId = connection.context.jwtPayload.context.organization_id;

        // Your logic here using connection.client API
        
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Operation failed' });
    }
});
```

**Get Project Details:**
```typescript
const response = await connection.client.projectsGroupsApi.getProject(projectId);

// Access project properties
const project = response.data;
const projectName = project.name;                    // string
const sourceLanguageId = project.sourceLanguageId;   // string
const targetLanguageIds = project.targetLanguageIds; // string[]
const description = project.description;             // string | null
```

**List All Projects (with pagination):**
```typescript
const response = await connection.client.projectsGroupsApi.withFetchAll().listProjects();

// Iterate through all projects
response.data.forEach((projectItem: ResponseObject<ProjectsGroupsModel.Project>) => {
  const projectId = projectItem.data.id;
  const projectName = projectItem.data.name;
  const groupId = projectItem.data.groupId; // number | null
});
```

**Get Supported Languages:**
```typescript
const response = await connection.client.languagesApi.withFetchAll().listSupportedLanguages();

// Filter languages
const targetLanguageIds = ['uk', 'pl', 'de'];
const projectLanguages = response.data.filter(
  (lang: ResponseObject<LanguagesModel.Language>) => targetLanguageIds.includes(lang.data.id)
);

// Map to simpler structure
const languages = projectLanguages.map((lang: ResponseObject<LanguagesModel.Language>) => ({
  id: lang.data.id,           // string: "uk"
  name: lang.data.name,       // string: "Ukrainian"
  locale: lang.data.locale,   // string: "uk-UA"
  osxLocale: lang.data.osxLocale // string
}));
```

**List Source Files:**
```typescript
const response = await connection.client.sourceFilesApi.withFetchAll().listProjectFiles(projectId);

response.data.forEach((fileItem: ResponseObject<SourceFilesModel.File>) => {
  const file = fileItem.data;
  const fileId = file.id;             // number
  const fileName = file.name;         // string
  const branchId = file.branchId;     // number | null
  const directoryId = file.directoryId; // number | null
});
```

#### Best Practices

1. **Always access data via `.data` property**
   ```typescript
   // ✅ CORRECT
   const project = response.data;
   const projectName = response.data.name;
   
   // ❌ WRONG - will be undefined
   const projectName = response.name;
   ```

2. **Use withFetchAll() for complete data**
   ```typescript
   // ✅ CORRECT - gets all items
   const response = await connection.client.languagesApi.withFetchAll().listSupportedLanguages();
   
   // ⚠️ PARTIAL - only first page (25 items)
   const response = await connection.client.languagesApi.listSupportedLanguages();
   ```

3. **Handle nullable properties**
   ```typescript
   const description = response.data.description || 'No description';
   const groupId = response.data.groupId ?? null;
   ```

4. **Handle errors properly**
   ```typescript
   try {
     const response = await connection.client.projectsGroupsApi.getProject(projectId);
     const project = response.data;
     // Use project data
   } catch (error: any) {
     console.error('Crowdin API Error:', error);

     // API errors have specific structure
     if (error.code === 404) {
       return res.status(404).json({ success: false, error: 'Project not found' });
     }
     
     return res.status(500).json({
       success: false,
       error: 'API request failed'
     });
   }
   ```

5. **Use TypeScript types**
   ```typescript
   import type { ResponseObject, ProjectsGroupsModel } from '@crowdin/crowdin-api-client';
   
   // Use in your code
   const response: ResponseObject<ProjectsGroupsModel.Project> = await connection.client.projectsGroupsApi.getProject(projectId);
   const project: ProjectsGroupsModel.Project = response.data;
   ```

6. **Always sort data explicitly when order matters**
   ```typescript
   // ✅ CORRECT - sort projects by creation date (newest first)
   const response = await connection.client.projectsGroupsApi.withFetchAll().listProjects();
   const sortedByDate = response.data.sort(
     (a: ResponseObject<ProjectsGroupsModel.Project>, b: ResponseObject<ProjectsGroupsModel.Project>) => {
       const dateA = new Date(a.data.createdAt).getTime();
       const dateB = new Date(b.data.createdAt).getTime();
       return dateB - dateA; // Descending order (newest first)
     }
   );
   
   // ❌ WRONG - assuming data is already sorted by date
   const response = await connection.client.projectsGroupsApi.withFetchAll().listProjects();
   // Directly using response.data without sorting - order is not guaranteed!
   ```

7. **Never use CroQL - fetch all data and filter manually**
   ```typescript
   // ✅ CORRECT - fetch all strings and filter manually
   const allStrings = await connection.client.sourceStringsApi.withFetchAll().listProjectStrings(projectId);
   
   // Filter for specific criteria
   const filteredStrings = allStrings.data.filter(
     (item: ResponseObject<SourceStringsModel.String>) => {
       const str = item.data;
       return str.text.includes('welcome') && !str.isHidden;
     }
   );
   
   // ❌ WRONG - using CroQL queries
   const response = await connection.client.sourceStringsApi.listProjectStrings(projectId, {
     croql: 'text contains "welcome" AND isHidden = false'
   });
   // CroQL should be avoided - fetch all data and filter in your code instead
   ```

#### Complete Type Definitions

**⚠️ CRITICAL**: Only use methods and types from `@crowdin/crowdin-api-client` definitions below.

**Do NOT invent methods or properties that are not listed here.**

<!-- CROWDIN_API_CLIENT_TYPES_START -->

##### ai/index.d.ts

```typescript
import { CrowdinApi, DownloadLink, PaginationOptions, PatchRequest, PlainObject, ResponseList, ResponseObject, Status } from '../core';
export declare class Ai extends CrowdinApi {
    listAiOrganizationCustomPlaceholders(options?: PaginationOptions): Promise<ResponseList<AiModel.CustomPlaceholder>>;
    addAiOrganizationCustomPlaceholder(request: AiModel.AddCustomPlaceholderRequest): Promise<ResponseObject<AiModel.CustomPlaceholder>>;
    getAiOrganizationCustomPlaceholder(aiCustomPlaceholderId: number): Promise<ResponseObject<AiModel.CustomPlaceholder>>;
    deleteAiOrganizationCustomPlaceholder(aiCustomPlaceholderId: number): Promise<void>;
    editAiOrganizationCustomPlaceholder(aiCustomPlaceholderId: number, request: PatchRequest[]): Promise<ResponseObject<AiModel.CustomPlaceholder>>;
    generateAiOrganizationPromptFineTuningDataset(aiPromptId: number, request: AiModel.GenerateFineTuningDataset): Promise<ResponseObject<Status<AiModel.FineTuningDataset>>>;
    getAiOrganizationPromptFineTuningDatasetStatus(aiPromptId: number, jobIdentifier: string): Promise<ResponseObject<Status<AiModel.FineTuningDataset>>>;
    listAiOrganizationPromptFineTuningEvents(aiPromptId: number, jobIdentifier: string, options?: PaginationOptions): Promise<ResponseList<AiModel.PromptFineTuningEvent>>;
    listAiOrganizationPromptFineTuningJobs(options?: AiModel.ListPromptFineTuningJobsOptions): Promise<ResponseList<Status<AiModel.FineTuningJob>>>;
    createAiOrganizationPromptFineTuningJob(aiPromptId: number, request: AiModel.GenerateFineTuningJob): Promise<ResponseObject<Status<AiModel.FineTuningJob>>>;
    getAiOrganizationPromptFineTuningJobStatus(aiPromptId: number, jobIdentifier: string): Promise<ResponseObject<Status<AiModel.FineTuningJob>>>;
    downloadAiOrganizationPromptFineTuningDataset(aiPromptId: number, jobIdentifier: string): Promise<ResponseObject<DownloadLink>>;
    cloneAiOrganizationPrompt(aiPromptId: number, request?: {
        name?: string;
    }): Promise<ResponseObject<AiModel.AiPromptResponse>>;
    listAiOrganizationPrompts(options?: AiModel.ListAiPromptsOptions): Promise<ResponseList<AiModel.AiPromptResponse>>;
    addAiOrganizationPrompt(request: AiModel.AddAiPromptRequest): Promise<ResponseObject<AiModel.AiPromptResponse>>;
    generateAiOrganizationPromptCompletion(aiPromptId: number, request: AiModel.GenerateAiPromptCompletionRequest): Promise<ResponseObject<Status<AiModel.AiPromptCompletionAttribute>>>;
    getAiOrganizationPromptCompletionStatus(aiPromptId: number, completionId: string): Promise<ResponseObject<Status<AiModel.AiPromptCompletionAttribute>>>;
    cancelAiOrganizationPromptCompletion(aiPromptId: number, completionId: string): Promise<void>;
    downloadAiOrganizationPromptCompletion(aiPromptId: number, completionId: string): Promise<ResponseObject<DownloadLink>>;
    getAiOrganizationPrompt(aiPromptId: number): Promise<ResponseObject<AiModel.AiPromptResponse>>;
    deleteAiOrganizationPrompt(aiPromptId: number): Promise<void>;
    editAiOrganizationPrompt(aiPromptId: number, request: PatchRequest[]): Promise<ResponseObject<AiModel.AiPromptResponse>>;
    listAiOrganizationProviders(options?: PaginationOptions): Promise<ResponseList<AiModel.AiProviderResponse>>;
    addAiOrganizationProvider(request: AiModel.AddAiProviderRequest): Promise<ResponseObject<AiModel.AiProviderResponse>>;
    getAiOrganizationProvider(aiProviderId: number): Promise<ResponseObject<AiModel.AiProviderResponse>>;
    deleteAiOrganizationProvider(aiProviderId: number): Promise<void>;
    editAiOrganizationProvider(aiProviderId: number, request: PatchRequest[]): Promise<ResponseObject<AiModel.AiProviderResponse>>;
    listAiOrganizationProviderModels(aiProviderId: number, options?: PaginationOptions): Promise<ResponseList<AiModel.AiProviderModelResponse>>;
    listAiOrganizationAllProviderModels(options?: PaginationOptions): Promise<ResponseList<AiModel.AiProviderModelResponse>>;
    createAiOrganizationProxyChatCompletion(aiProviderId: number, request?: AiModel.OtherChatCompletionRequest | AiModel.GoogleGeminiChatCompletionRequest): Promise<ResponseObject<AiModel.AiProviderProxyResponseData>>;
    generateAiOrganizationReport(request: AiModel.AiReport): Promise<ResponseObject<Status<AiModel.AiReport>>>;
    checkAiOrganizationReportStatus(aiReportId: string): Promise<ResponseObject<Status<AiModel.AiReport>>>;
    downloadAiOrganizationReport(aiReportId: string): Promise<ResponseObject<DownloadLink>>;
    getAiOrganizationSettings(): Promise<ResponseObject<AiModel.AiSettings>>;
    editAiOrganizationSettings(request: PatchRequest[]): Promise<ResponseObject<AiModel.AiSettings>>;
    listAiUserCustomPlaceholders(userId: number, options?: PaginationOptions): Promise<ResponseList<AiModel.CustomPlaceholder>>;
    addAiUserCustomPlaceholder(userId: number, request: AiModel.AddCustomPlaceholderRequest): Promise<ResponseObject<AiModel.CustomPlaceholder>>;
    getAiUserCustomPlaceholder(userId: number, aiCustomPlaceholderId: number): Promise<ResponseObject<AiModel.CustomPlaceholder>>;
    deleteAiUserCustomPlaceholder(userId: number, aiCustomPlaceholderId: number): Promise<void>;
    editAiUserCustomPlaceholder(userId: number, aiCustomPlaceholderId: number, request: PatchRequest[]): Promise<ResponseObject<AiModel.CustomPlaceholder>>;
    generateAiUserPromptFineTuningDataset(userId: number, aiPromptId: number, request: AiModel.GenerateFineTuningDataset): Promise<ResponseObject<Status<AiModel.FineTuningDataset>>>;
    getAiUserPromptFineTuningDatasetStatus(userId: number, aiPromptId: number, jobIdentifier: string): Promise<ResponseObject<Status<AiModel.FineTuningDataset>>>;
    listAiUserPromptFineTuningEvents(userId: number, aiPromptId: number, jobIdentifier: string, options?: PaginationOptions): Promise<ResponseList<AiModel.PromptFineTuningEvent>>;
    listAiUserPromptFineTuningJobs(userId: number, options?: AiModel.ListPromptFineTuningJobsOptions): Promise<ResponseList<Status<AiModel.FineTuningJob>>>;
    createAiUserPromptFineTuningJob(userId: number, aiPromptId: number, request: AiModel.GenerateFineTuningJob): Promise<ResponseObject<Status<AiModel.FineTuningJob>>>;
    getAiUserPromptFineTuningJobStatus(userId: number, aiPromptId: number, jobIdentifier: string): Promise<ResponseObject<Status<AiModel.FineTuningJob>>>;
    downloadAiUserPromptFineTuningDataset(userId: number, aiPromptId: number, jobIdentifier: string): Promise<ResponseObject<DownloadLink>>;
    cloneAiUserPrompt(userId: number, aiPromptId: number, request?: {
        name?: string;
    }): Promise<ResponseObject<AiModel.AiPromptResponse>>;
    listAiUserPrompts(userId: number, options?: AiModel.ListAiPromptsOptions): Promise<ResponseList<AiModel.AiPromptResponse>>;
    addAiUserPrompt(userId: number, request: AiModel.AddAiPromptRequest): Promise<ResponseObject<AiModel.AiPromptResponse>>;
    generateAiUserPromptCompletion(userId: number, aiPromptId: number, request: AiModel.GenerateAiPromptCompletionRequest): Promise<ResponseObject<Status<AiModel.AiPromptCompletionAttribute>>>;
    getAiUserPromptCompletionStatus(userId: number, aiPromptId: number, completionId: string): Promise<ResponseObject<Status<AiModel.AiPromptCompletionAttribute>>>;
    cancelAiUserPromptCompletion(userId: number, aiPromptId: number, completionId: string): Promise<void>;
    downloadAiUserPromptCompletion(userId: number, aiPromptId: number, completionId: string): Promise<ResponseObject<DownloadLink>>;
    getAiUserPrompt(userId: number, aiPromptId: number): Promise<ResponseObject<AiModel.AiPromptResponse>>;
    deleteAiUserPrompt(userId: number, aiPromptId: number): Promise<void>;
    editAiUserPrompt(userId: number, aiPromptId: number, request: PatchRequest[]): Promise<ResponseObject<AiModel.AiPromptResponse>>;
    listAiUserProviders(userId: number, options?: PaginationOptions): Promise<ResponseList<AiModel.AiProviderResponse>>;
    addAiUserProvider(userId: number, request: AiModel.AddAiProviderRequest): Promise<ResponseObject<AiModel.AiProviderResponse>>;
    getAiUserProvider(userId: number, aiProviderId: number): Promise<ResponseObject<AiModel.AiProviderResponse>>;
    deleteAiUserProvider(userId: number, aiProviderId: number): Promise<void>;
    editAiUserProvider(userId: number, aiProviderId: number, request: PatchRequest[]): Promise<ResponseObject<AiModel.AiProviderResponse>>;
    listAiUserProviderModels(userId: number, aiProviderId: number, options?: PaginationOptions): Promise<ResponseList<AiModel.AiProviderModelResponse>>;
    listAiUserAllProviderModels(userId: number, options?: PaginationOptions): Promise<ResponseList<AiModel.AiProviderModelResponse>>;
    createAiUserProxyChatCompletion(userId: number, aiProviderId: number, request?: AiModel.OtherChatCompletionRequest | AiModel.GoogleGeminiChatCompletionRequest): Promise<ResponseObject<AiModel.AiProviderProxyResponseData>>;
    generateAiUserReport(userId: number, request: AiModel.AiReport): Promise<ResponseObject<Status<AiModel.AiReport>>>;
    checkAiUserReportStatus(userId: number, aiReportId: string): Promise<ResponseObject<Status<AiModel.AiReport>>>;
    downloadAiUserReport(userId: number, aiReportId: string): Promise<ResponseObject<DownloadLink>>;
    getAiUsertSettings(userId: number): Promise<ResponseObject<AiModel.AiSettings>>;
    editAiUserSettings(userId: number, request: PatchRequest[]): Promise<ResponseObject<AiModel.AiSettings>>;
}
export declare namespace AiModel {
    interface CustomPlaceholder {
        id: number;
        description: string;
        placeholder: string;
        value: string;
        createdAt: string;
        updatedAt: string;
    }
    interface AddCustomPlaceholderRequest {
        description: string;
        placeholder: string;
        value: string;
    }
    interface FineTuningDataset {
        projectIds: number[];
        tmIds: number[];
        purpose: 'training' | 'validation';
        dateFrom: string;
        dateTo: string;
        maxFileSize: number;
        minExamplesCount: number;
        maxExamplesCount: number;
    }
    interface GenerateFineTuningDataset {
        projectIds?: number[];
        tmIds?: number[];
        purpose?: 'training' | 'validation';
        dateFrom?: string;
        dateTo?: string;
        maxFileSize?: number;
        minExamplesCount?: number;
        maxExamplesCount?: number;
    }
    interface GenerateFineTuningJob {
        dryRun?: boolean;
        hyperparameters?: {
            batchSize: number;
            learningRateMultiplier: number;
            nEpochs: number;
        };
        trainingOptions: Omit<GenerateFineTuningDataset, 'purpose'>;
        validationOptions?: Omit<GenerateFineTuningDataset, 'purpose'>;
    }
    interface FineTuningJob {
        dryRun: boolean;
        aiPromptId: number;
        hyperparameters: {
            batchSize: number;
            learningRateMultiplier: number;
            nEpochs: number;
        };
        trainingOptions: Omit<GenerateFineTuningDataset, 'purpose'>;
        validationOptions: Omit<GenerateFineTuningDataset, 'purpose'>;
        baseModel: string;
        fineTunedModel: string;
        trainedTokensCount: number;
        trainingDatasetUrl: string;
        validationDatasetUrl: string;
        metadata: PlainObject;
    }
    interface PromptFineTuningEvent {
        id: string;
        type: string;
        message: string;
        data: {
            step: number;
            totalSteps: number;
            trainingLoss: number;
            validationLoss: number;
            fullValidationLoss: number;
        };
        createdAt: string;
    }
    interface ListPromptFineTuningJobsOptions extends PaginationOptions {
        statuses: string;
        orderBy: string;
    }
    interface ListAiPromptsOptions extends PaginationOptions {
        projectId?: number;
        action?: Action;
    }
    interface AiPromptResponse {
        id: number;
        name: string;
        action: Action;
        aiProviderId: number;
        aiModelId: string;
        isEnabled: boolean;
        enabledProjectIds: number[];
        config: AiModel.AiPromptConfigBasicPreTranslate | AiModel.AiPromptConfigBasicAssistAction | AiModel.AiPromptConfigBasicAligmentAction | AiModel.AiPromptConfigAdvanced | AiModel.AiPromptConfigExternal;
        promptPreview: string;
        isFineTuningAvailable: boolean;
        createdAt: string;
        updatedAt: string;
    }
    interface AiPromptConfigBasicOtherLanguageTranslations {
        isEnabled?: boolean;
        languageIds?: string[];
    }
    interface AiPromptConfigBasicPreTranslate {
        mode: 'basic';
        companyDescription?: string;
        projectDescription?: string;
        audienceDescription?: string;
        customPlaceholders?: string[];
        otherLanguageTranslations?: AiModel.AiPromptConfigBasicOtherLanguageTranslations;
        glossaryTerms?: boolean;
        tmSuggestions?: boolean;
        fileContent?: boolean;
        fileContext?: boolean;
        screenshots?: boolean;
        publicProjectDescription?: boolean;
        siblingsStrings?: boolean;
    }
    interface AiPromptConfigBasicAssistAction {
        mode: 'basic';
        companyDescription?: string;
        projectDescription?: string;
        audienceDescription?: string;
        otherLanguageTranslations?: AiModel.AiPromptConfigBasicOtherLanguageTranslations;
        glossaryTerms?: boolean;
        tmSuggestions?: boolean;
        fileContext?: boolean;
        screenshots?: boolean;
        publicProjectDescription?: boolean;
        siblingsStrings?: boolean;
        filteredStrings?: boolean;
    }
    interface AiPromptConfigBasicAligmentAction {
        mode: 'basic';
        customPlaceholders?: string[];
        publicProjectDescription?: boolean;
    }
    interface AiPromptConfigAdvanced {
        mode: 'advanced';
        screenshots?: boolean;
        prompt: string;
        otherLanguageTranslations?: AiModel.AiPromptConfigBasicOtherLanguageTranslations;
    }
    interface AiPromptConfigExternal {
        mode: 'external';
        identifier: string;
        key: string;
        options?: any;
    }
    interface AddAiPromptRequest {
        name: string;
        action: Action;
        aiProviderId?: number;
        aiModelId?: string;
        isEnabled?: boolean;
        enabledProjectIds?: number[];
        config: AiModel.AiPromptConfigBasicPreTranslate | AiModel.AiPromptConfigBasicAssistAction | AiModel.AiPromptConfigBasicAligmentAction | AiModel.AiPromptConfigAdvanced | AiPromptConfigExternal;
    }
    interface GenerateAiPromptCompletionRequest {
        resources: AiModel.AiPromptResourceWithPreTranslate | AiModel.AiPromptResourceWithAssist | AiModel.AiPromptResourceWithAlignment | AiModel.AiPromptResourceWithCustom;
        tools?: {
            tool: {
                type: 'function';
                function: {
                    description?: string;
                    name: string;
                    parameters?: PlainObject;
                };
            };
        }[];
        tool_choice?: string | PlainObject;
    }
    interface AiPromptCompletionAttribute {
        aiPromptId: number;
    }
    interface AiPromptResourceWithPreTranslate {
        projectId: number;
        sourceLanguageId?: string;
        targetLanguageId?: string;
        stringIds?: number[];
        overridePromptValues?: OverridePromptValues;
    }
    interface AiPromptResourceWithAlignment {
        projectId: number;
        sourceLanguageId?: string;
        targetLanguageId?: string;
        stringIds?: number[];
        overridePromptValues?: OverridePromptValues;
    }
    interface AiPromptResourceWithAssist {
        projectId: number;
        sourceLanguageId?: string;
        targetLanguageId?: string;
        stringIds?: number[];
        filteredStringsIds?: number[];
        overridePromptValues?: OverridePromptValues;
    }
    interface AiPromptResourceWithCustom {
        projectId: number;
        sourceLanguageId?: string;
        targetLanguageId?: string;
        stringIds?: number[];
        overridePromptValues?: OverridePromptValues;
        customInstruction?: string;
    }
    interface OverridePromptValues {
        [key: string]: any;
    }
    interface AiProviderResponse {
        id: number;
        name: string;
        type: ProviderType;
        credentials: AiModel.AiProviderCredentialsBasic | AiModel.AiProviderCredentialsAzureOpenAi | AiProviderCredentialsGoogleGemini | AiProviderCredentialsCustom;
        config: AiModel.AiProviderConfig;
        isEnabled: boolean;
        useSystemCredentials: boolean;
        createdAt: string;
        updatedAt: string;
        promptsCount: string;
    }
    interface AiProviderCredentialsBasic {
        apiKey: string;
    }
    interface AiProviderCredentialsAzureOpenAi extends AiProviderCredentialsBasic {
        resourceName: string;
        deploymentName: string;
        apiVersion: string;
    }
    interface AiProviderCredentialsGoogleGemini {
        project: string;
        region: string;
        serviceAccountKey: string;
    }
    interface AiProviderCredentialsWatsonx {
        apiKey: string;
        projectId: string;
        region: string;
    }
    interface AiProviderCredentialsCustom {
        identifier: string;
        key: string;
    }
    interface AiProviderConfig {
        actionRules?: AiModel.AiProviderConfigActionRule[];
    }
    interface AiProviderConfigActionRule {
        action?: 'pre_translate' | 'assist';
        availableAiModelIds?: string[];
    }
    interface AddAiProviderRequest {
        name: string;
        type: ProviderType;
        credentials?: AiModel.AiProviderCredentialsBasic | AiModel.AiProviderCredentialsAzureOpenAi | AiProviderCredentialsGoogleGemini | AiProviderCredentialsWatsonx | AiProviderCredentialsCustom;
        config?: AiModel.AiProviderConfig;
        isEnabled?: boolean;
        useSystemCredentials?: boolean;
    }
    interface AiProviderModelResponse {
        id: string;
    }
    interface AiProviderProxyResponseData {
        data: object;
    }
    interface OtherChatCompletionRequest {
        stream?: boolean;
        [key: string]: any;
    }
    interface GoogleGeminiChatCompletionRequest extends OtherChatCompletionRequest {
        model: string;
    }
    type AiReport = AiReportTokenUsage;
    interface AiReportTokenUsage {
        type: 'tokens-usage-raw-data';
        schema: AiReportGeneralSchema;
    }
    interface AiReportGeneralSchema {
        dateFrom: string;
        dateTo: string;
        format?: 'json' | 'csv';
        projectIds?: number[];
        promptIds?: number[];
        userIds?: number[];
    }
    interface AiSettings {
        assistActionAiPromptId: number;
        showSuggestion: boolean;
        shortcuts: {
            name: string;
            prompt: string;
            enabled: boolean;
        }[];
    }
    type Action = 'pre_translate' | 'assist';
    type ProviderType = 'open_ai' | 'azure_open_ai' | 'google_gemini' | 'mistral_ai' | 'anthropic' | 'custom_ai' | 'x_ai' | 'deepseek' | 'watsonx';
}
```

##### applications/index.d.ts

```typescript
import { CrowdinApi, ResponseObject, PatchRequest, Pagination, ResponseList } from '../core';
export declare class Applications extends CrowdinApi {
    listApplicationInstallations(options?: Pagination): Promise<ResponseList<ApplicationsModel.Application>>;
    installApplication(request: ApplicationsModel.InstallApplication): Promise<ResponseObject<ApplicationsModel.Application>>;
    getApplicationInstallation(applicationId: string): Promise<ResponseObject<ApplicationsModel.Application>>;
    deleteApplicationInstallation(applicationId: string, force?: boolean): Promise<ResponseObject<ApplicationsModel.Application>>;
    editApplicationInstallation(applicationId: string, request: PatchRequest[]): Promise<ResponseObject<ApplicationsModel.Application>>;
    getApplicationData(applicationId: string, path: string): Promise<ResponseObject<any>>;
    updateOrRestoreApplicationData(applicationId: string, path: string, request: any): Promise<ResponseObject<any>>;
    addApplicationData(applicationId: string, path: string, request: any): Promise<ResponseObject<any>>;
    deleteApplicationData(applicationId: string, path: string): Promise<void>;
    editApplicationData(applicationId: string, path: string, request: any): Promise<ResponseObject<any>>;
}
export declare namespace ApplicationsModel {
    interface Application {
        identifier: string;
        name: string;
        description: string;
        logo: string;
        baseUrl: string;
        manifestUrl: string;
        createdAt: string;
        modules: ApplicationModule[];
        scopes: string[];
        permissions: ApplicationPermissions;
        defaultPermissions: any;
        limitReached: boolean;
    }
    interface InstallApplication {
        url: string;
        permissions?: ApplicationPermissions;
        modules?: ApplicationModule[];
    }
    interface ApplicationPermissions {
        user: {
            value: 'all' | 'owner' | 'managers' | 'guests' | 'restricted';
            ids: number[];
        };
        project: {
            value: 'own' | 'restricted';
            ids: number[];
        };
    }
    interface ApplicationModule {
        key: string;
        type?: string;
        data?: any;
        authenticationType?: string;
        permissions: Omit<ApplicationPermissions, 'project'>;
    }
}
```

##### bundles/index.d.ts

```typescript
import { CrowdinApi, DownloadLink, PaginationOptions, PatchRequest, ResponseList, ResponseObject, Status } from '../core';
import { SourceFilesModel } from '../sourceFiles';
export declare class Bundles extends CrowdinApi {
    listBundles(projectId: number, options?: PaginationOptions): Promise<ResponseList<BundlesModel.Bundle>>;
    addBundle(projectId: number, request: BundlesModel.CreateBundleRequest): Promise<ResponseObject<BundlesModel.Bundle>>;
    getBundle(projectId: number, bundleId: number): Promise<ResponseObject<BundlesModel.Bundle>>;
    deleteBundle(projectId: number, bundleId: number): Promise<void>;
    editBundle(projectId: number, bundleId: number, request: PatchRequest[]): Promise<ResponseObject<BundlesModel.Bundle>>;
    downloadBundle(projectId: number, bundleId: number, exportId: string): Promise<ResponseObject<DownloadLink>>;
    exportBundle(projectId: number, bundleId: number): Promise<ResponseObject<Status<BundlesModel.ExportAttributes>>>;
    checkBundleExportStatus(projectId: number, bundleId: number, exportId: string): Promise<ResponseObject<Status<BundlesModel.ExportAttributes>>>;
    listBundleFiles(projectId: number, bundleId: number, options?: PaginationOptions): Promise<ResponseList<SourceFilesModel.File>>;
    listBundleBranches(projectId: number, bundleId: number, options?: PaginationOptions): Promise<ResponseList<SourceFilesModel.Branch>>;
}
export declare namespace BundlesModel {
    interface Bundle {
        id: number;
        name: string;
        format: string;
        sourcePatterns: string[];
        ignorePatterns: string[];
        exportPattern: string;
        isMultilingual: boolean;
        includeProjectSourceLanguage: boolean;
        labelIds: number[];
        excludeLabelIds: number[];
        createdAt: string;
        webUrl: string;
        updatedAt: string;
    }
    interface CreateBundleRequest {
        name: string;
        format: string;
        sourcePatterns: string[];
        ignorePatterns?: string[];
        exportPattern: string;
        isMultilingual?: boolean;
        includeProjectSourceLanguage?: boolean;
        includeInContextPseudoLanguage?: boolean;
        labelIds?: number[];
        excludeLabelIds?: number[];
    }
    interface ExportAttributes {
        bundleId: number;
    }
}
```

##### clients/index.d.ts

```typescript
import { CrowdinApi, PaginationOptions, ResponseList } from '../core';
export declare class Clients extends CrowdinApi {
    listClients(options?: PaginationOptions): Promise<ResponseList<ClientsModel.Client>>;
}
export declare namespace ClientsModel {
    interface Client {
        id: number;
        name: string;
        description: string;
        status: 'pending' | 'confirmed' | 'rejected';
        webUrl: string;
    }
}
```

##### core/http-client-error.d.ts

```typescript
import { AxiosError } from 'axios';
import { FetchClientJsonPayloadError } from './internal/fetch/fetchClientError';
export type HttpClientError = AxiosError | FetchClientJsonPayloadError | Error;
export declare const toHttpClientError: (error?: unknown) => HttpClientError;
```

##### core/index.d.ts

```typescript
import { HttpClientError } from './http-client-error';
import { RetryConfig, RetryService } from './internal/retry';
export interface HttpClient {
    get<T>(url: string, config?: {
        headers: Record<string, string>;
    }): Promise<T>;
    delete<T>(url: string, config?: {
        headers: Record<string, string>;
    }): Promise<T>;
    head<T>(url: string, config?: {
        headers: Record<string, string>;
    }): Promise<T>;
    post<T>(url: string, data?: unknown, config?: {
        headers: Record<string, string>;
    }): Promise<T>;
    put<T>(url: string, data?: unknown, config?: {
        headers: Record<string, string>;
    }): Promise<T>;
    patch<T>(url: string, data?: unknown, config?: {
        headers: Record<string, string>;
    }): Promise<T>;
}
export type HttpClientType = 'axios' | 'fetch';
export interface Credentials {
    token: string;
    organization?: string;
    baseUrl?: string;
    apiDomain?: string;
}
export interface ClientConfig {
    httpClientType?: HttpClientType;
    httpClient?: HttpClient;
    userAgent?: string;
    integrationUserAgent?: string;
    retryConfig?: RetryConfig;
    httpRequestTimeout?: number;
}
export interface ResponseList<T> {
    data: ResponseObject<T>[];
    pagination: Pagination;
}
export interface ResponseObject<T> {
    data: T;
}
export interface Pagination {
    offset: number;
    limit: number;
}
export type PaginationOptions = Partial<Pagination>;
export interface PatchRequest {
    value?: any;
    op: PatchOperation;
    path: string;
}
export type PatchOperation = 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
export type ProjectRoles = 'manager' | 'developer' | 'translator' | 'proofreader' | 'language_coordinator' | 'member';
export interface DownloadLink {
    url: string;
    expireIn: string;
}
export declare enum BooleanInt {
    TRUE = 1,
    FALSE = 0
}
export interface Status<T> {
    identifier: string;
    status: string;
    progress: number;
    attributes: T;
    createdAt: string;
    updatedAt: string;
    startedAt: string;
    finishedAt: string;
    eta: string;
}
export interface Attribute {
    [key: string]: string;
}
export type PlainObject = Record<string, any>;
export declare class CrowdinError extends Error {
    apiError: any;
    code: number;
    constructor(message: string, code: number, apiError: any);
}
export declare class CrowdinValidationError extends CrowdinError {
    validationCodes: {
        key: string;
        codes: string[];
    }[];
    constructor(message: string, validationCodes: {
        key: string;
        codes: string[];
    }[], apiError: any);
}
export declare function handleHttpClientError(error: HttpClientError): never;
export declare abstract class CrowdinApi {
    private static readonly CROWDIN_API_DOMAIN;
    private static readonly AXIOS_INSTANCE;
    private static readonly FETCH_INSTANCE;
    readonly token: string;
    readonly organization?: string;
    readonly url: string;
    readonly apiDomain: string;
    readonly config: ClientConfig | undefined;
    readonly retryService: RetryService;
    protected fetchAllFlag: boolean;
    protected maxLimit: number | undefined;
    constructor(credentials: Credentials, config?: ClientConfig);
    graphql<T>(req: {
        query: string;
        operationName?: string;
        variables?: any;
    }, config?: {
        url?: string;
    }): Promise<ResponseObject<T>>;
    protected addQueryParam(url: string, name: string, value?: string | number): string;
    protected defaultConfig(): {
        headers: Record<string, string>;
    };
    get httpClient(): HttpClient;
    withFetchAll(maxLimit?: number): this;
    protected getList<T = any>(url: string, limit?: number, offset?: number, config?: {
        headers: Record<string, string>;
    }): Promise<ResponseList<T>>;
    protected fetchAll<T>(url: string, config: {
        headers: Record<string, string>;
    }, maxAmount?: number): Promise<ResponseList<T>>;
    protected encodeUrlParam(param: string | number | boolean): string;
    protected get<T>(url: string, config?: {
        headers: Record<string, string>;
    }): Promise<T>;
    protected delete<T>(url: string, config?: {
        headers: Record<string, string>;
    }): Promise<T>;
    protected head<T>(url: string, config?: {
        headers: Record<string, string>;
    }): Promise<T>;
    protected post<T>(url: string, data?: unknown, config?: {
        headers: Record<string, string>;
    }): Promise<T>;
    protected put<T>(url: string, data?: unknown, config?: {
        headers: Record<string, string>;
    }): Promise<T>;
    protected patch<T>(url: string, data?: unknown, config?: {
        headers: Record<string, string>;
    }): Promise<T>;
}
export declare function isOptionalString(parameter: string | unknown, parameterInArgs: boolean): parameter is string | undefined;
export declare function isOptionalNumber(parameter: number | unknown, parameterInArgs: boolean): parameter is number | undefined;
export interface ProjectRole {
    name: string;
    permissions: ProjectRolePermissions;
}
export interface ProjectRolePermissions {
    allLanguages: boolean;
    languagesAccess: {
        [lang: string]: {
            allContent: boolean;
            workflowStepIds: number[];
        };
    };
}
```

##### dictionaries/index.d.ts

```typescript
import { CrowdinApi, PatchRequest, ResponseList, ResponseObject } from '../core';
export declare class Dictionaries extends CrowdinApi {
    listDictionaries(projectId: number, options?: DictionariesModel.ListDictionariesOptions): Promise<ResponseList<DictionariesModel.Dictionary>>;
    listDictionaries(projectId: number, languageIds?: string): Promise<ResponseList<DictionariesModel.Dictionary>>;
    editDictionary(projectId: number, languageId: string, request: PatchRequest[]): Promise<ResponseObject<DictionariesModel.Dictionary>>;
}
export declare namespace DictionariesModel {
    interface Dictionary {
        languageId: string;
        words: string[];
    }
    interface ListDictionariesOptions {
        languageIds?: string;
    }
}
```

##### distributions/index.d.ts

```typescript
import { CrowdinApi, PaginationOptions, PatchRequest, ResponseList, ResponseObject } from '../core';
export declare class Distributions extends CrowdinApi {
    listDistributions(projectId: number, options?: PaginationOptions): Promise<ResponseList<DistributionsModel.Distribution>>;
    listDistributions(projectId: number, limit?: number, offset?: number): Promise<ResponseList<DistributionsModel.Distribution>>;
    createDistribution(projectId: number, request: DistributionsModel.CreateDistributionRequest | DistributionsModel.CreateDistributionStringsBasedRequest): Promise<ResponseObject<DistributionsModel.Distribution>>;
    getDistribution(projectId: number, hash: string): Promise<ResponseObject<DistributionsModel.Distribution>>;
    deleteDistribution(projectId: number, hash: string): Promise<void>;
    editDistribution(projectId: number, hash: string, request: PatchRequest[]): Promise<ResponseObject<DistributionsModel.Distribution>>;
    getDistributionRelease(projectId: number, hash: string): Promise<ResponseObject<DistributionsModel.DistributionRelease | DistributionsModel.DistributionStringsBasedRelease>>;
    createDistributionRelease(projectId: number, hash: string): Promise<ResponseObject<DistributionsModel.DistributionRelease | DistributionsModel.DistributionStringsBasedRelease>>;
}
export declare namespace DistributionsModel {
    interface Distribution {
        hash: string;
        manifestUrl: string;
        name: string;
        bundleIds: number[];
        createdAt: string;
        updatedAt: string;
        exportMode: ExportMode;
        fileIds: number[];
    }
    interface CreateDistributionRequest {
        exportMode?: ExportMode;
        name: string;
        fileIds?: number[];
        bundleIds?: number[];
    }
    interface CreateDistributionStringsBasedRequest {
        name: string;
        bundleIds: number[];
    }
    interface DistributionRelease {
        status: string;
        progress: number;
        currentLanguageId: string;
        currentFileId: number;
        date: string;
    }
    interface DistributionStringsBasedRelease {
        status: string;
        progress: number;
        currentLanguageId: string;
        currentBranchId: number;
        date: string;
    }
    type ExportMode = 'default' | 'bundle';
}
```

##### fields/index.d.ts

```typescript
import { CrowdinApi, PaginationOptions, PatchRequest, ResponseList, ResponseObject } from '../core';
export declare class Fields extends CrowdinApi {
    listFields(options?: FieldsModel.ListFieldsParams): Promise<ResponseList<FieldsModel.Field>>;
    addField(request: FieldsModel.AddFieldRequest): Promise<ResponseObject<FieldsModel.Field>>;
    getField(fieldId: number): Promise<ResponseObject<FieldsModel.Field>>;
    deleteField(fieldId: number): Promise<void>;
    editField(fieldId: number, request: PatchRequest[]): Promise<ResponseObject<FieldsModel.Field>>;
}
export declare namespace FieldsModel {
    type Entity = 'project' | 'user' | 'task' | 'file' | 'translation' | 'string';
    type Type = 'checkbox' | 'radiobuttons' | 'date' | 'datetime' | 'number' | 'labels' | 'select' | 'multiselect' | 'text' | 'textarea' | 'url';
    type Place = 'projectCreateModal' | 'projectHeader' | 'projectDetails' | 'projectCrowdsourceDetails' | 'projectSettings' | 'projectTaskEditCreate' | 'projectTaskDetails' | 'projectTaskBoardCard' | 'fileDetails' | 'fileSettings' | 'userEditModal' | 'userDetails' | 'userPopover' | 'stringEditModal' | 'stringDetails' | 'translationUnderContent';
    interface Location {
        place: Place;
    }
    interface Option {
        label: string;
        value: string;
    }
    interface OtherFieldConfig {
        locations: Location[];
    }
    interface ListFieldConfig extends OtherFieldConfig {
        options: Option[];
    }
    interface NumberFieldConfig extends OtherFieldConfig {
        min: number;
        max: number;
        units: string;
    }
    type Config = ListFieldConfig | NumberFieldConfig | OtherFieldConfig;
    interface ListFieldsParams extends PaginationOptions {
        search?: string;
        entity?: Entity;
        type?: Type;
    }
    interface Field {
        id: number;
        name: string;
        slug: string;
        type: Type;
        description: string;
        entities: Entity[];
        config: Config;
        createdAt: string;
        updatedAt: string;
    }
    interface AddFieldRequest {
        name: string;
        slug: string;
        type: Type;
        description?: string;
        entities: Entity[];
        config?: Config;
    }
}
```

##### glossaries/index.d.ts

```typescript
import { CrowdinApi, DownloadLink, PaginationOptions, PatchRequest, ResponseList, ResponseObject, Status } from '../core';
export declare class Glossaries extends CrowdinApi {
    listGlossaries(options?: GlossariesModel.ListGlossariesOptions): Promise<ResponseList<GlossariesModel.Glossary>>;
    listGlossaries(groupId?: number, limit?: number, offset?: number): Promise<ResponseList<GlossariesModel.Glossary>>;
    addGlossary(request: GlossariesModel.CreateGlossaryRequest): Promise<ResponseObject<GlossariesModel.Glossary>>;
    getGlossary(glossaryId: number): Promise<ResponseObject<GlossariesModel.Glossary>>;
    deleteGlossary(glossaryId: number): Promise<void>;
    editGlossary(glossaryId: number, request: PatchRequest[]): Promise<ResponseObject<GlossariesModel.Glossary>>;
    exportGlossary(glossaryId: number, request: GlossariesModel.ExportGlossaryRequest): Promise<ResponseObject<Status<GlossariesModel.GlossaryExportStatusAttribute>>>;
    checkGlossaryExportStatus(glossaryId: number, exportId: string): Promise<ResponseObject<Status<GlossariesModel.GlossaryExportStatusAttribute>>>;
    downloadGlossary(glossaryId: number, exportId: string): Promise<ResponseObject<DownloadLink>>;
    importGlossaryFile(glossaryId: number, request: GlossariesModel.GlossaryFile): Promise<ResponseObject<Status<GlossariesModel.GlossaryImportStatusAttribute>>>;
    checkGlossaryImportStatus(glossaryId: number, importId: string): Promise<ResponseObject<Status<GlossariesModel.GlossaryImportStatusAttribute>>>;
    listTerms(glossaryId: number, options?: GlossariesModel.ListTermsOptions): Promise<ResponseList<GlossariesModel.Term>>;
    listTerms(glossaryId: number, userId?: number, limit?: number, offset?: number, languageId?: string, translationOfTermId?: number, conceptId?: number): Promise<ResponseList<GlossariesModel.Term>>;
    addTerm(glossaryId: number, request: GlossariesModel.CreateTermRequest): Promise<ResponseObject<GlossariesModel.Term>>;
    clearGlossary(glossaryId: number, options?: GlossariesModel.ClearGlossaryOptions): Promise<ResponseObject<GlossariesModel.Term>>;
    clearGlossary(glossaryId: number, languageId?: number, translationOfTermId?: number, conceptId?: number): Promise<ResponseObject<GlossariesModel.Term>>;
    getTerm(glossaryId: number, termId: number): Promise<ResponseObject<GlossariesModel.Term>>;
    deleteTerm(glossaryId: number, termId: number): Promise<void>;
    editTerm(glossaryId: number, termId: number, request: PatchRequest[]): Promise<ResponseObject<GlossariesModel.Term>>;
    listConcepts(glossaryId: number, options?: {
        orderBy?: string;
    } & PaginationOptions): Promise<ResponseList<GlossariesModel.Concept>>;
    getConcept(glossaryId: number, conceptId: number): Promise<ResponseObject<GlossariesModel.Concept>>;
    updateConcept(glossaryId: number, conceptId: number, request: GlossariesModel.UpdateConceptRequest): Promise<ResponseObject<GlossariesModel.Concept>>;
    deleteConcept(glossaryId: number, conceptId: number): Promise<void>;
    concordanceSearch(projectId: number, request: GlossariesModel.ConcordanceSearchRequest): Promise<ResponseList<GlossariesModel.ConcordanceSearchResponse>>;
}
export declare namespace GlossariesModel {
    interface Glossary {
        id: number;
        name: string;
        groupId: number;
        userId: number;
        terms: number;
        languageId: string;
        languageIds: string[];
        defaultProjectIds: number[];
        projectIds: number[];
        webUrl: string;
        createdAt: string;
    }
    interface CreateGlossaryRequest {
        name: string;
        languageId: string;
        groupId?: number;
    }
    type ExportField = 'term' | 'description' | 'partOfSpeech' | 'type' | 'status' | 'gender' | 'note' | 'url' | 'conceptDefinition' | 'conceptSubject' | 'conceptNote' | 'conceptUrl' | 'conceptFigure';
    interface ExportGlossaryRequest {
        format?: GlossaryFormat;
        exportFields?: ExportField[];
    }
    interface GlossaryExportStatusAttribute {
        format: string;
        exportFields: ExportField[];
    }
    interface GlossaryImportStatusAttribute {
        storageId: number;
        scheme: unknown;
        firstLineContainsHeader: boolean;
    }
    interface GlossaryFile {
        storageId: number;
        scheme?: GlossaryFileScheme;
        firstLineContainsHeader?: boolean;
    }
    interface ListTermsOptions extends PaginationOptions {
        userId?: number;
        languageId?: string;
        conceptId?: number;
        orderBy?: string;
        croql?: string;
        translationOfTermId?: number;
    }
    interface Term {
        id: number;
        userId: number;
        glossaryId: number;
        languageId: string;
        text: string;
        description: string;
        partOfSpeech: PartOfSpeech;
        status: Status;
        type: Type;
        gender: Gender;
        note: string;
        url: string;
        conceptId: number;
        lemma: string;
        createdAt: string;
        updatedAt: string;
    }
    interface CreateTermRequest {
        languageId: string;
        text: string;
        description?: string;
        partOfSpeech?: PartOfSpeech;
        status?: Status;
        type?: Type;
        gender?: Gender;
        note?: string;
        url?: string;
        conceptId?: number;
        translationOfTermId?: number;
    }
    interface ConcordanceSearchRequest extends PaginationOptions {
        sourceLanguageId: string;
        targetLanguageId: string;
        expressions: string[];
        expression?: string;
    }
    interface ConcordanceSearchResponse {
        glossary: Glossary;
        concept: Concept;
        sourceTerms: Term[];
        targetTerms: Term[];
    }
    type Status = 'preferred' | 'admitted' | 'not recommended' | 'obsolete';
    type Type = 'full form' | 'acronym' | 'abbreviation' | 'short form' | 'phrase' | 'variant';
    type Gender = 'masculine' | 'feminine' | 'neuter' | 'other';
    type GlossaryFormat = 'tbx' | 'tbx_v3' | 'csv' | 'xlsx';
    interface GlossaryFileScheme {
        [key: string]: number;
    }
    type PartOfSpeech = 'adjective' | 'adposition' | 'adverb' | 'auxiliary' | 'coordinating conjunction' | 'determiner' | 'interjection' | 'noun' | 'numeral' | 'particle' | 'pronoun' | 'proper noun' | 'subordinating conjunction' | 'verb' | 'other';
    interface ListGlossariesOptions extends PaginationOptions {
        groupId?: number;
        userId?: number;
        orderBy?: string;
    }
    interface ClearGlossaryOptions {
        languageId?: number;
        translationOfTermId?: number;
        conceptId?: number;
    }
    interface Concept {
        id: number;
        userId: number;
        glossaryId: number;
        subject: string;
        definition: string;
        translatable: boolean;
        note: string;
        url: string;
        figure: string;
        languagesDetails: LanguageDetails[];
        createdAt: string;
        updatedAt: string;
    }
    interface LanguageDetails {
        languageId: string;
        userId: number;
        definition: string;
        note: string;
        createdAt: string;
        updatedAt: string;
    }
    interface UpdateConceptRequest {
        subject?: string;
        definition?: string;
        translatable?: boolean;
        note?: string;
        url?: string;
        figure?: string;
        languagesDetails?: {
            languageId: string;
            definition: string;
            note?: string;
        }[];
    }
}
```

##### index.d.ts

```typescript
import { Ai } from './ai';
import { Applications } from './applications';
import { Bundles } from './bundles';
import { Clients } from './clients';
import { ClientConfig, Credentials, CrowdinApi } from './core';
import { Dictionaries } from './dictionaries';
import { Distributions } from './distributions';
import { Fields } from './fields';
import { Glossaries } from './glossaries';
import { Issues } from './issues';
import { Labels } from './labels';
import { Languages } from './languages';
import { MachineTranslation } from './machineTranslation';
import { Notifications } from './notifications';
import { OrganizationWebhooks } from './organizationWebhooks';
import { ProjectsGroups } from './projectsGroups';
import { Reports } from './reports';
import { Screenshots } from './screenshots';
import { SecurityLogs } from './securityLogs';
import { SourceFiles } from './sourceFiles';
import { SourceStrings } from './sourceStrings';
import { StringComments } from './stringComments';
import { StringCorrections } from './stringCorrections';
import { StringTranslations } from './stringTranslations';
import { Tasks } from './tasks';
import { Teams } from './teams';
import { TranslationMemory } from './translationMemory';
import { TranslationStatus } from './translationStatus';
import { Translations } from './translations';
import { UploadStorage } from './uploadStorage';
import { Users } from './users';
import { Vendors } from './vendors';
import { Webhooks } from './webhooks';
import { Workflows } from './workflows';
export * from './ai';
export * from './applications';
export * from './bundles';
export * from './clients';
export * from './core';
export * from './dictionaries';
export * from './distributions';
export * from './fields';
export * from './glossaries';
export * from './issues';
export * from './labels';
export * from './languages';
export * from './machineTranslation';
export * from './notifications';
export * from './organizationWebhooks';
export * from './projectsGroups';
export * from './reports';
export * from './screenshots';
export * from './securityLogs';
export * from './sourceFiles';
export * from './sourceStrings';
export * from './stringComments';
export * from './stringCorrections';
export * from './stringTranslations';
export * from './tasks';
export * from './teams';
export * from './translationMemory';
export * from './translationStatus';
export * from './translations';
export * from './uploadStorage';
export * from './users';
export * from './vendors';
export * from './webhooks';
export * from './workflows';
export default class Client extends CrowdinApi {
    readonly aiApi: Ai;
    readonly applicationsApi: Applications;
    readonly sourceFilesApi: SourceFiles;
    readonly glossariesApi: Glossaries;
    readonly languagesApi: Languages;
    readonly translationsApi: Translations;
    readonly translationStatusApi: TranslationStatus;
    readonly projectsGroupsApi: ProjectsGroups;
    readonly reportsApi: Reports;
    readonly screenshotsApi: Screenshots;
    readonly sourceStringsApi: SourceStrings;
    readonly uploadStorageApi: UploadStorage;
    readonly tasksApi: Tasks;
    readonly translationMemoryApi: TranslationMemory;
    readonly webhooksApi: Webhooks;
    readonly organizationWebhooksApi: OrganizationWebhooks;
    readonly machineTranslationApi: MachineTranslation;
    readonly stringTranslationsApi: StringTranslations;
    readonly workflowsApi: Workflows;
    readonly usersApi: Users;
    readonly vendorsApi: Vendors;
    readonly issuesApi: Issues;
    readonly teamsApi: Teams;
    readonly distributionsApi: Distributions;
    readonly dictionariesApi: Dictionaries;
    readonly labelsApi: Labels;
    readonly stringCommentsApi: StringComments;
    readonly bundlesApi: Bundles;
    readonly notificationsApi: Notifications;
    readonly clientsApi: Clients;
    readonly securityLogsApi: SecurityLogs;
    readonly fieldsApi: Fields;
    readonly stringCorrectionsApi: StringCorrections;
    constructor(credentials: Credentials, config?: ClientConfig);
}
export { Client };
```

##### issues/index.d.ts

```typescript
import { CrowdinApi, PaginationOptions, PatchRequest, ResponseList, ResponseObject } from '../core';
export declare class Issues extends CrowdinApi {
    listReportedIssues(projectId: number, options?: IssuesModel.ListReportedIssuesOptions): Promise<ResponseList<IssuesModel.Issue>>;
    listReportedIssues(projectId: number, limit?: number, offset?: number, type?: IssuesModel.Type, status?: IssuesModel.Status): Promise<ResponseList<IssuesModel.Issue>>;
    editIssue(projectId: number, issueId: number, request: PatchRequest[]): Promise<ResponseObject<IssuesModel.Issue>>;
}
export declare namespace IssuesModel {
    type Type = 'all' | 'general_question' | 'translation_mistake' | 'context_request' | 'source_mistake';
    type Status = 'all' | 'resolved' | 'unresolved';
    interface Issue {
        id: number;
        text: string;
        userId: number;
        stringId: number;
        user: User;
        string: string;
        languageId: string;
        type: Type;
        status: Status;
        createdAt: string;
    }
    interface User {
        id: number;
        username: string;
        fullName: string;
        avatarUrl: string;
    }
    interface String {
        id: number;
        text: string;
        type: string;
        hasPlurals: boolean;
        isIcu: boolean;
        context: string;
        fileId: number;
    }
    interface ListReportedIssuesOptions extends PaginationOptions {
        type?: IssuesModel.Type;
        status?: IssuesModel.Status;
    }
}
```

##### labels/index.d.ts

```typescript
import { CrowdinApi, PaginationOptions, PatchRequest, ResponseList, ResponseObject } from '../core';
import { ScreenshotsModel } from '../screenshots';
import { SourceStringsModel } from '../sourceStrings';
export declare class Labels extends CrowdinApi {
    listLabels(projectId: number, options?: LabelsModel.ListLabelsParams): Promise<ResponseList<LabelsModel.Label>>;
    listLabels(projectId: number, limit?: number, offset?: number): Promise<ResponseList<LabelsModel.Label>>;
    addLabel(projectId: number, request: LabelsModel.AddLabelRequest): Promise<ResponseObject<LabelsModel.Label>>;
    getLabel(projectId: number, labelId: number): Promise<ResponseObject<LabelsModel.Label>>;
    deleteLabel(projectId: number, labelId: number): Promise<void>;
    editLabel(projectId: number, labelId: number, request: PatchRequest[]): Promise<ResponseObject<LabelsModel.Label>>;
    assignLabelToScreenshots(projectId: number, labelId: number, request: LabelsModel.AssignLabelToScreenshotsRequet): Promise<ResponseList<ScreenshotsModel.Screenshot>>;
    unassignLabelFromScreenshots(projectId: number, labelId: number, screenshotIds: string): Promise<ResponseList<ScreenshotsModel.Screenshot>>;
    assignLabelToString(projectId: number, labelId: number, request: LabelsModel.AssignLabelToStringsRequet): Promise<ResponseList<SourceStringsModel.String>>;
    unassignLabelFromString(projectId: number, labelId: number, stringIds: string): Promise<ResponseList<SourceStringsModel.String>>;
}
export declare namespace LabelsModel {
    interface ListLabelsParams extends PaginationOptions {
        orderBy?: string;
    }
    interface Label {
        id: number;
        title: string;
        isSystem?: boolean;
    }
    interface AddLabelRequest {
        title: string;
    }
    interface AssignLabelToStringsRequet {
        stringIds: number[];
    }
    interface AssignLabelToScreenshotsRequet {
        screenshotIds: number[];
    }
}
```

##### languages/index.d.ts

```typescript
import { CrowdinApi, PaginationOptions, PatchRequest, ResponseList, ResponseObject } from '../core';
export declare class Languages extends CrowdinApi {
    listSupportedLanguages(options?: PaginationOptions): Promise<ResponseList<LanguagesModel.Language>>;
    listSupportedLanguages(limit?: number, offset?: number): Promise<ResponseList<LanguagesModel.Language>>;
    addCustomLanguage(request: LanguagesModel.AddLanguageRequest): Promise<ResponseObject<LanguagesModel.Language>>;
    getLanguage(languageId: string): Promise<ResponseObject<LanguagesModel.Language>>;
    deleteCustomLanguage(languageId: string): Promise<void>;
    editCustomLanguage(languageId: string, request: PatchRequest[]): Promise<ResponseObject<LanguagesModel.Language>>;
}
export declare namespace LanguagesModel {
    interface Language {
        id: string;
        name: string;
        editorCode: string;
        twoLettersCode: string;
        threeLettersCode: string;
        locale: string;
        androidCode: string;
        osxCode: string;
        osxLocale: string;
        pluralCategoryNames: string[];
        pluralRules: string;
        pluralExamples: string[];
        textDirection: TextDirection;
        dialectOf: string;
    }
    interface AddLanguageRequest {
        name: string;
        code: string;
        localeCode: string;
        textDirection: TextDirection;
        pluralCategoryNames: string[];
        threeLettersCode: string;
        twoLettersCode?: string;
        dialectOf?: string;
    }
    type TextDirection = 'ltr' | 'rtl';
}
```

##### machineTranslation/index.d.ts

```typescript
import { CrowdinApi, PaginationOptions, PatchRequest, ResponseList, ResponseObject } from '../core';
export declare class MachineTranslation extends CrowdinApi {
    listMts(options?: MachineTranslationModel.ListMTsOptions): Promise<ResponseList<MachineTranslationModel.MachineTranslation>>;
    listMts(groupId?: number, limit?: number, offset?: number): Promise<ResponseList<MachineTranslationModel.MachineTranslation>>;
    createMt(request: MachineTranslationModel.CreateMachineTranslationRequest): Promise<ResponseObject<MachineTranslationModel.MachineTranslation>>;
    getMt(mtId: number): Promise<ResponseObject<MachineTranslationModel.MachineTranslation>>;
    deleteMt(mtId: number): Promise<void>;
    updateMt(mtId: number, request: PatchRequest[]): Promise<ResponseObject<MachineTranslationModel.MachineTranslation>>;
    translate(mtId: number, request: MachineTranslationModel.TranslateRequest): Promise<ResponseObject<MachineTranslationModel.TranslateResponse>>;
}
export declare namespace MachineTranslationModel {
    interface MachineTranslation {
        id: number;
        groupId: number;
        name: string;
        type: number;
        credentials: Credentials;
        projectIds: number[];
        supportedLanguageIds: string[];
        supportedLanguagePairs: Record<string, string[]>;
        enabledLanguageIds: string[];
        enabledProjectIds: number[];
        isEnabled: boolean;
    }
    type Credentials = {
        apiKey: string;
    } | {
        credentials: string;
    } | {
        model: string;
        apiKey: string;
    } | {
        isSystemCredentials: boolean;
        apiKey: string;
    } | {
        endpoint: string;
        apiKey: string;
    } | {
        url: string;
    } | {
        accessKey: string;
        secretKey: string;
    };
    interface CreateMachineTranslationRequest {
        name: string;
        type: string;
        credentials: Credentials;
        groupId?: number;
        enabledLanguageIds?: string[];
        enabledProjectIds?: number[];
        isEnabled?: boolean;
    }
    interface TranslateRequest {
        languageRecognitionProvider?: LanguageRecognitionProvider;
        sourceLanguageId?: string;
        targetLanguageId: string;
        strings?: string[];
    }
    interface TranslateResponse {
        sourceLanguageId: string;
        targetLanguageId: string;
        strings: string[];
        translations: string[];
    }
    type LanguageRecognitionProvider = 'crowdin' | 'engine';
    interface ListMTsOptions extends PaginationOptions {
        groupId?: number;
    }
}
```

##### notifications/index.d.ts

```typescript
import { CrowdinApi } from '../core';
export declare class Notifications extends CrowdinApi {
    sendNotificationToAuthenticatedUser(request: NotificationsModel.Notification): Promise<void>;
    sendNotificationToProjectMembers(projectId: number, request: NotificationsModel.NotificationByUsers | NotificationsModel.NotificationByRole): Promise<void>;
    sendNotificationToOrganizationMembers(request: NotificationsModel.Notification | NotificationsModel.NotificationByUsers | NotificationsModel.NotificationByRole): Promise<void>;
}
export declare namespace NotificationsModel {
    interface Notification {
        message: string;
    }
    interface NotificationByUsers extends Notification {
        userIds: number[];
    }
    interface NotificationByRole extends Notification {
        role: 'owner' | 'admin';
    }
}
```

##### organizationWebhooks/index.d.ts

```typescript
import { CrowdinApi, PaginationOptions, PatchRequest, ResponseList, ResponseObject } from '../core';
import { WebhooksModel } from '../webhooks';
export declare class OrganizationWebhooks extends CrowdinApi {
    listWebhooks(options?: PaginationOptions): Promise<ResponseList<OrganizationWebhooksModel.OrganizationWebhook>>;
    addWebhook(request: OrganizationWebhooksModel.AddOrganizationWebhookRequest): Promise<ResponseObject<OrganizationWebhooksModel.OrganizationWebhook>>;
    getWebhook(webhookId: number): Promise<ResponseObject<OrganizationWebhooksModel.OrganizationWebhook>>;
    deleteWebhook(webhookId: number): Promise<void>;
    editWebhook(webhookId: number, request: PatchRequest[]): Promise<ResponseObject<OrganizationWebhooksModel.OrganizationWebhook>>;
}
export declare namespace OrganizationWebhooksModel {
    type OrganizationWebhook = Omit<WebhooksModel.Webhook, 'projectId' | 'events'> & {
        events: Event[];
    };
    type AddOrganizationWebhookRequest = Omit<WebhooksModel.AddWebhookRequest, 'events'> & {
        events: Event[];
    };
    type Event = 'group.created' | 'group.deleted' | 'project.created' | 'project.deleted';
}
```

##### projectsGroups/index.d.ts

```typescript
import { BooleanInt, CrowdinApi, DownloadLink, PaginationOptions, PatchRequest, ResponseList, ResponseObject } from '../core';
import { LanguagesModel } from '../languages';
export declare class ProjectsGroups extends CrowdinApi {
    listGroups(options?: ProjectsGroupsModel.ListGroupsOptions): Promise<ResponseList<ProjectsGroupsModel.Group>>;
    listGroups(parentId?: number, offset?: number, userId?: number, limit?: number): Promise<ResponseList<ProjectsGroupsModel.Group>>;
    addGroup(request: ProjectsGroupsModel.AddGroupRequest): Promise<ResponseObject<ProjectsGroupsModel.Group>>;
    getGroup(groupId: number): Promise<ResponseObject<ProjectsGroupsModel.Group>>;
    deleteGroup(groupId: number): Promise<void>;
    editGroup(groupId: number, request: PatchRequest[]): Promise<ResponseObject<ProjectsGroupsModel.Group>>;
    listProjects(options?: ProjectsGroupsModel.ListProjectsOptions): Promise<ResponseList<ProjectsGroupsModel.Project | ProjectsGroupsModel.ProjectSettings>>;
    listProjects(groupId?: number, hasManagerAccess?: BooleanInt, limit?: number, offset?: number): Promise<ResponseList<ProjectsGroupsModel.Project | ProjectsGroupsModel.ProjectSettings>>;
    addProject(request: ProjectsGroupsModel.CreateProjectEnterpriseRequest | ProjectsGroupsModel.CreateProjectRequest): Promise<ResponseObject<ProjectsGroupsModel.Project | ProjectsGroupsModel.ProjectSettings>>;
    getProject(projectId: number): Promise<ResponseObject<ProjectsGroupsModel.Project | ProjectsGroupsModel.ProjectSettings>>;
    deleteProject(projectId: number): Promise<void>;
    editProject(projectId: number, request: PatchRequest[]): Promise<ResponseObject<ProjectsGroupsModel.Project | ProjectsGroupsModel.ProjectSettings>>;
    downloadProjectFileFormatSettingsCustomSegmentation(projectId: number, fileFormatSettingsId: number): Promise<ResponseObject<DownloadLink>>;
    resetProjectFileFormatSettingsCustomSegmentation(projectId: number, fileFormatSettingsId: number): Promise<ResponseObject<DownloadLink>>;
    listProjectFileFormatSettings(projectId: number, options?: PaginationOptions): Promise<ResponseList<ProjectsGroupsModel.ProjectFileFormatSettings>>;
    addProjectFileFormatSettings(projectId: number, request: ProjectsGroupsModel.AddProjectFileFormatSettingsRequest): Promise<ResponseObject<ProjectsGroupsModel.ProjectFileFormatSettings>>;
    getProjectFileFormatSettings(projectId: number, fileFormatSettingsId: number): Promise<ResponseObject<ProjectsGroupsModel.ProjectFileFormatSettings>>;
    deleteProjectFileFormatSettings(projectId: number, fileFormatSettingsId: number): Promise<void>;
    editProjectFileFormatSettings(projectId: number, fileFormatSettingsId: number, request: PatchRequest[]): Promise<ResponseObject<ProjectsGroupsModel.ProjectFileFormatSettings>>;
    listProjectStringsExporterSettings(projectId: number, options?: PaginationOptions): Promise<ResponseList<ProjectsGroupsModel.ProjectStringsExporterSettings>>;
    addProjectStringsExporterSettings(projectId: number, request: ProjectsGroupsModel.AddProjectStringsExporterSettingsRequest): Promise<ResponseObject<ProjectsGroupsModel.ProjectStringsExporterSettings>>;
    getProjectStringsExporterSettings(projectId: number, systemStringsExporterSettingsId: number): Promise<ResponseObject<ProjectsGroupsModel.ProjectStringsExporterSettings>>;
    deleteProjectStringsExporterSettings(projectId: number, systemStringsExporterSettingsId: number): Promise<void>;
    editProjectStringsExporterSettings(projectId: number, systemStringsExporterSettingsId: number, request: ProjectsGroupsModel.AddProjectStringsExporterSettingsRequest): Promise<ResponseObject<ProjectsGroupsModel.ProjectStringsExporterSettings>>;
}
export declare namespace ProjectsGroupsModel {
    interface Group {
        id: number;
        name: string;
        description: string;
        parentId: number;
        organizationId: number;
        userId: number;
        subgroupsCount: number;
        projectsCount: number;
        webUrl: string;
        createdAt: string;
        updatedAt: string;
    }
    interface AddGroupRequest {
        name: string;
        parentId?: number;
        description?: string;
    }
    interface Project {
        id: number;
        type: Type;
        userId: number;
        sourceLanguageId: string;
        targetLanguageIds: string[];
        languageAccessPolicy: LanguageAccessPolicy;
        name: string;
        identifier: string;
        description: string;
        visibility: string;
        logo: string;
        publicDownloads: boolean;
        createdAt: string;
        updatedAt: string;
        lastActivity: string;
        sourceLanguage: LanguagesModel.Language;
        targetLanguages: LanguagesModel.Language[];
        webUrl: string;
        savingsReportSettingsTemplateId: number;
        fields: Record<string, any>;
        cname: string;
        groupId: number;
        background: string;
        isExternal: boolean;
        externalType: string;
        externalProjectId: number;
        externalOrganizationId: number;
        workflowId: number;
        hasCrowdsourcing: boolean;
        publicUrl: string;
    }
    interface CreateProjectRequest {
        name: string;
        identifier: string;
        sourceLanguageId: string;
        targetLanguageIds?: string[];
        visibility?: JoinPolicy;
        languageAccessPolicy?: LanguageAccessPolicy;
        cname?: string;
        description?: string;
        tagDetection?: TagDetection;
        isMtAllowed?: boolean;
        taskBasedAccessControl?: boolean;
        autoSubstitution?: boolean;
        autoTranslateDialects?: boolean;
        publicDownloads?: boolean;
        hiddenStringsProofreadersAccess?: boolean;
        useGlobalTm?: boolean;
        showTmSuggestionsDialects?: boolean;
        tmApprovedSuggestionsOnly?: boolean;
        skipUntranslatedStrings?: boolean;
        exportApprovedOnly?: boolean;
        qaCheckIsActive?: boolean;
        qaCheckCategories?: CheckCategories;
        qaChecksIgnorableCategories?: CheckCategories;
        languageMapping?: LanguageMapping;
        glossaryAccess?: boolean;
        glossaryAccessOption?: GlossaryAccessOption;
        normalizePlaceholder?: boolean;
        notificationSettings?: NotificationSettings;
        tmPreTranslate?: ProjectSettings['tmPreTranslate'];
        mtPreTranslate?: ProjectSettings['mtPreTranslate'];
        aiPreTranslate?: ProjectSettings['aiPreTranslate'];
        assistActionAiPromptId?: number;
        editorSuggestionAiPromptId?: number;
        savingsReportSettingsTemplateId?: number;
        defaultTmId?: number;
        defaultGlossaryId?: number;
        inContext?: boolean;
        inContextProcessHiddenStrings?: boolean;
        inContextPseudoLanguageId?: string;
        saveMetaInfoInSource?: boolean;
        type?: BooleanInt;
        skipUntranslatedFiles?: boolean;
        tmContextType?: TmContextType;
    }
    interface CreateProjectEnterpriseRequest {
        name: string;
        sourceLanguageId: string;
        templateId?: number;
        steps?: WorkflowTemplateStepConfig[];
        groupId?: number;
        targetLanguageIds?: string[];
        vendorId?: number;
        mtEngineId?: number;
        description?: string;
        translateDuplicates?: TranslateDuplicates;
        tagsDetection?: TagDetection;
        isMtAllowed?: boolean;
        taskBasedAccessControl?: boolean;
        taskReviewerIds?: number[];
        autoSubstitution?: boolean;
        showTmSuggestionsDialects?: boolean;
        tmApprovedSuggestionsOnly?: boolean;
        autoTranslateDialects?: boolean;
        publicDownloads?: boolean;
        hiddenStringsProofreadersAccess?: boolean;
        delayedWorkflowStart?: boolean;
        skipUntranslatedStrings?: boolean;
        exportWithMinApprovalsCount?: number;
        exportStringsThatPassedWorkflow?: number;
        normalizePlaceholder?: boolean;
        qaCheckIsActive?: boolean;
        qaApprovalsCount?: number;
        qaCheckCategories?: CheckCategories;
        qaChecksIgnorableCategories?: CheckCategories;
        customQaCheckIds?: number[];
        languageMapping?: LanguageMapping;
        glossaryAccess?: boolean;
        glossaryAccessOption?: GlossaryAccessOption;
        notificationSettings?: NotificationSettings;
        savingsReportSettingsTemplateId?: number;
        fields?: Record<string, any>;
        assistActionAiPromptId?: number;
        editorSuggestionAiPromptId?: number;
        alignmentActionAiPromptId?: number;
        defaultTmId?: number;
        defaultGlossaryId?: number;
        inContext?: boolean;
        inContextProcessHiddenStrings?: boolean;
        inContextPseudoLanguageId?: string;
        saveMetaInfoInSource?: boolean;
        type?: BooleanInt;
        skipUntranslatedFiles?: boolean;
        tmContextType?: TmContextType;
    }
    type GlossaryAccessOption = 'readOnly' | 'fullAccess' | 'manageDrafts';
    interface ProjectSettings extends Project {
        translateDuplicates: TranslateDuplicates;
        tagsDetection: TagDetection;
        glossaryAccess: boolean;
        glossaryAccessOption: GlossaryAccessOption;
        isMtAllowed: boolean;
        taskBasedAccessControl: boolean;
        hiddenStringsProofreadersAccess: boolean;
        autoSubstitution: boolean;
        exportTranslatedOnly: boolean;
        skipUntranslatedStrings: boolean;
        exportApprovedOnly: boolean;
        autoTranslateDialects: boolean;
        useGlobalTm: boolean;
        showTmSuggestionsDialects: boolean;
        tmApprovedSuggestionsOnly: boolean;
        isSuspended: boolean;
        qaCheckIsActive: boolean;
        qaCheckCategories: CheckCategories;
        qaChecksIgnorableCategories: CheckCategories;
        languageMapping: LanguageMapping;
        notificationSettings: NotificationSettings;
        defaultTmId: number;
        defaultGlossaryId: number;
        assignedTms: {
            [id: string]: {
                priority: number;
            };
        };
        assignedGlossaries: number[];
        tmPenalties: {
            autoSubstitution: number;
            tmPriority: {
                priority: number;
                penalty: number;
            };
            multipleTranslations: number;
            timeSinceLastUsage: {
                months: number;
                penalty: number;
            };
            timeSinceLastModified: {
                months: number;
                penalty: number;
            };
        };
        normalizePlaceholder: boolean;
        tmPreTranslate: {
            enabled: boolean;
            autoApproveOption: 'all' | 'perfectMatchOnly' | 'exceptAutoSubstituted' | 'perfectMatchApprovedOnly' | 'none';
            minimumMatchRatio: 'perfect' | '100';
        };
        mtPreTranslate: {
            enabled: boolean;
            mts: {
                mtId: number;
                languageIds: string[];
            }[];
        };
        aiPreTranslate: {
            enabled: boolean;
            aiPrompts: {
                aiPromptId: number;
                languageIds: string[];
            }[];
        };
        assistActionAiPromptId: number;
        editorSuggestionAiPromptId: number;
        inContext: boolean;
        inContextProcessHiddenStrings: string;
        inContextPseudoLanguageId: string;
        inContextPseudoLanguage: LanguagesModel.Language;
        saveMetaInfoInSource: boolean;
        skipUntranslatedFiles: boolean;
        tmContextType: TmContextType;
        clientOrganizationId: number;
        taskReviewerIds: number[];
        exportWithMinApprovalsCount: number;
        exportStringsThatPassedWorkflow: boolean;
        qaApprovalsCount: number;
        customQaCheckIds: number[];
        externalQaCheckIds: number[];
        delayedWorkflowStart: boolean;
        alignmentActionAiPromptId: number;
    }
    enum Type {
        FILES_BASED = 0,
        STRINGS_BASED = 1
    }
    enum TagDetection {
        AUTO = 0,
        COUNT_TAGS = 1,
        SKIP_TAGS = 2
    }
    type JoinPolicy = 'open' | 'private';
    type LanguageAccessPolicy = 'open' | 'moderate';
    interface CheckCategories {
        empty: boolean;
        size: boolean;
        tags: boolean;
        spaces: boolean;
        variables: boolean;
        punctuation: boolean;
        symbolRegister: boolean;
        specialSymbols: boolean;
        wrongTranslation: boolean;
        spellcheck: boolean;
        icu: boolean;
        terms: boolean;
        duplicate: boolean;
        ftl: boolean;
        android: boolean;
    }
    interface LanguageMapping {
        [key: string]: LanguageMappingEntity;
    }
    interface LanguageMappingEntity {
        name: string;
        two_letters_code: string;
        three_letters_code: string;
        locale: string;
        locale_with_underscore: string;
        android_code: string;
        osx_code: string;
        osx_locale: string;
    }
    enum TranslateDuplicates {
        SHOW = 0,
        HIDE_REGULAR_DETECTION = 1,
        SHOW_AUTO_TRANSLATE = 2,
        SHOW_WITHIN_VERION_BRANCH_REGULAR_DETECTION = 3,
        HIDE_STRICT_DETECTION = 4,
        SHOW_WITHIN_VERION_BRANCH_STRICT_DETECTION = 5
    }
    interface NotificationSettings {
        translatorNewStrings?: boolean;
        managerNewStrings?: boolean;
        managerLanguageCompleted?: boolean;
    }
    interface ListGroupsOptions extends PaginationOptions {
        parentId?: number;
        userId?: number;
        orderBy?: string;
    }
    interface ListProjectsOptions extends PaginationOptions {
        groupId?: number;
        hasManagerAccess?: BooleanInt;
        orderBy?: string;
        type?: BooleanInt;
    }
    type Settings = PropertyFileFormatSettings | CommonFileFormatSettings | XmlFileFormatSettings | MdxV2FormatSettings | FmHtmlFormatSettings | HtmlFormatSettings | JsonFormatSettings | MdxV1FormatSettings | JavaScriptFileFormatSettings | DocxFileFormatSettings;
    interface ProjectFileFormatSettings {
        id: number;
        name: string;
        format: string;
        extensions: string[];
        settings: Settings;
        createdAt: string;
        updatedAt: string;
    }
    interface AddProjectFileFormatSettingsRequest {
        format: string;
        settings: Settings;
    }
    interface PropertyFileFormatSettings {
        escapeQuotes?: 0 | 1 | 2 | 3;
        escapeSpecialCharacters?: 0 | 1;
        exportPattern?: string;
    }
    interface JavaScriptFileFormatSettings {
        exportPattern?: 'string';
        exportQuotes?: 'single' | 'double';
    }
    interface CommonFileFormatSettings {
        contentSegmentation?: boolean;
        srxStorageId?: number;
        exportPattern?: string;
    }
    interface XmlFileFormatSettings extends CommonFileFormatSettings {
        translateContent?: boolean;
        translateAttributes?: boolean;
        translatableElements?: string[];
    }
    interface JsonFormatSettings extends CommonFileFormatSettings {
        type?: 'i18next_json' | 'nestjs_i18n';
    }
    interface MdxV2FormatSettings extends CommonFileFormatSettings {
        excludeCodeBlocks?: boolean;
        excludedFrontMatterElements?: string[];
    }
    interface MdxV1FormatSettings extends CommonFileFormatSettings {
        excludeCodeBlocks?: boolean;
        excludedFrontMatterElements?: string[];
        type?: 'mdx_v1' | 'mdx_v2';
    }
    interface FmHtmlFormatSettings extends CommonFileFormatSettings {
        excludedElements?: boolean;
        excludedFrontMatterElements?: string[];
    }
    interface HtmlFormatSettings extends CommonFileFormatSettings {
        excludedElements?: boolean;
    }
    interface DocxFileFormatSettings extends CommonFileFormatSettings {
        cleanTagsAggressively?: boolean;
        translateHiddenText?: boolean;
        translateHyperlinkUrls?: boolean;
        translateHiddenRowsAndColumns?: boolean;
        importNotes?: boolean;
        importHiddenSlides?: boolean;
    }
    type TmContextType = 'segmentContext' | 'auto' | 'prevAndNextSegment';
    type WorkflowTemplateStepConfig = WorkflowTemplateStepConfigTranslateProofread | WorkflowTemplateStepConfigVendor | WorkflowTemplateStepConfigTMPreTranslate | WorkflowTemplateStepConfigMTPreTranslate;
    interface WorkflowTemplateStepConfigTranslateProofread {
        id: number;
        languages?: string[];
        assignees?: number[];
        config?: {
            assignees: {
                [key: string]: number[];
            };
        };
    }
    interface WorkflowTemplateStepConfigVendor {
        id: number;
        languages?: string[];
        vendorId?: number;
    }
    interface WorkflowTemplateStepConfigTMPreTranslate {
        id: number;
        languages?: string[];
        config?: {
            minRelevant?: number;
            autoSubstitution?: boolean;
        };
    }
    interface WorkflowTemplateStepConfigMTPreTranslate {
        id: number;
        languages?: string[];
        mtId?: number;
    }
    type StringsExporterSettings = AndroidStringsExporterSettings | MacOSXStringsExporterSettings | XliffStringsExporterSettings;
    interface ProjectStringsExporterSettings {
        id: number;
        format: string;
        settings: StringsExporterSettings;
        createdAt: string;
        updatedAt: string;
    }
    interface AndroidStringsExporterSettings {
        convertPlaceholders?: boolean;
        convertLineBreaks?: boolean;
        useCdataForStringsWithTags?: boolean;
    }
    interface MacOSXStringsExporterSettings {
        convertPlaceholders?: boolean;
        convertLineBreaks?: boolean;
    }
    interface XliffStringsExporterSettings {
        languagePairMapping?: {
            [key: string]: {
                sourceLanguageId: string;
            };
        };
        copySourceToEmptyTarget?: boolean;
        exportTranslatorsComment?: boolean;
    }
    interface AddProjectStringsExporterSettingsRequest {
        format: string;
        settings: StringsExporterSettings;
    }
}
```

##### reports/index.d.ts

```typescript
import { CrowdinApi, DownloadLink, PaginationOptions, PatchRequest, ResponseList, ResponseObject, Status } from '../core';
export declare class Reports extends CrowdinApi {
    listOrganizationReportArchives(options?: ReportsModel.ListReportArchiveParams): Promise<ResponseList<ReportsModel.ReportArchive>>;
    getOrganizationReportArchive(archiveId: number): Promise<ResponseObject<ReportsModel.ReportArchive>>;
    deleteOrganizationReportArchive(archiveId: number): Promise<void>;
    exportOrganizationReportArchive(archiveId: number, request?: {
        format?: ReportsModel.Format;
    }): Promise<ResponseObject<Status<ReportsModel.ReportArchiveStatusAttribute>>>;
    checkOrganizationReportArchiveStatus(archiveId: number, exportId: string): Promise<ResponseObject<Status<ReportsModel.ReportArchiveStatusAttribute>>>;
    downloadOrganizationReportArchive(archiveId: number, exportId: string): Promise<ResponseObject<DownloadLink>>;
    listUserReportArchives(userId: number, options?: ReportsModel.ListReportArchiveParams): Promise<ResponseList<ReportsModel.ReportArchive>>;
    getUserReportArchive(userId: number, archiveId: number): Promise<ResponseObject<ReportsModel.ReportArchive>>;
    deleteUserReportArchive(userId: number, archiveId: number): Promise<void>;
    exportUserReportArchive(userId: number, archiveId: number, request?: {
        format?: ReportsModel.Format;
    }): Promise<ResponseObject<Status<ReportsModel.ReportArchiveStatusAttribute>>>;
    checkUserReportArchiveStatus(userId: number, archiveId: number, exportId: string): Promise<ResponseObject<Status<ReportsModel.ReportArchiveStatusAttribute>>>;
    downloadUserReportArchive(userId: number, archiveId: number, exportId: string): Promise<ResponseObject<DownloadLink>>;
    generateGroupReport(groupId: number, request: ReportsModel.GenerateGroupReportRequest): Promise<ResponseObject<Status<ReportsModel.ReportStatusAttributes<ReportsModel.GroupReportSchema>>>>;
    checkGroupReportStatus(groupId: number, reportId: string): Promise<ResponseObject<Status<ReportsModel.ReportStatusAttributes<ReportsModel.GroupReportSchema>>>>;
    downloadGroupReport(groupId: number, reportId: string): Promise<ResponseObject<DownloadLink>>;
    listOrganizationReportSettingsTemplates(options?: ReportsModel.ListOrganizationReportSettingsParams): Promise<ResponseList<ReportsModel.OrganizationReportSettings>>;
    addOrganizationReportSettingsTemplate(request: ReportsModel.AddOrganizationReportSettingsRequest): Promise<ResponseObject<ReportsModel.OrganizationReportSettings>>;
    getOrganizationReportSettingsTemplate(reportSettingsTemplateId: number): Promise<ResponseObject<ReportsModel.OrganizationReportSettings>>;
    editOrganizationReportSettingsTemplate(reportSettingsTemplateId: number, request: PatchRequest[]): Promise<ResponseObject<ReportsModel.OrganizationReportSettings>>;
    deleteOrganizationReportSettingsTemplate(reportSettingsTemplateId: number): Promise<void>;
    generateOrganizationReport(request: ReportsModel.GenerateOrganizationReportRequest): Promise<ResponseObject<Status<ReportsModel.ReportStatusAttributes<ReportsModel.OrganizationReportSchema>>>>;
    checkOrganizationReportStatus(reportId: string): Promise<ResponseObject<Status<ReportsModel.ReportStatusAttributes<ReportsModel.OrganizationReportSchema>>>>;
    downloadOrganizationReport(reportId: string): Promise<ResponseObject<DownloadLink>>;
    generateReport(projectId: number, request: ReportsModel.GenerateReportRequest): Promise<ResponseObject<Status<ReportsModel.ReportStatusAttributes<ReportsModel.ReportSchema>>>>;
    checkReportStatus(projectId: number, reportId: string): Promise<ResponseObject<Status<ReportsModel.ReportStatusAttributes<ReportsModel.ReportSchema>>>>;
    downloadReport(projectId: number, reportId: string): Promise<ResponseObject<DownloadLink>>;
    listReportSettingsTemplates(projectId: number, options?: PaginationOptions): Promise<ResponseList<ReportsModel.ReportSettings>>;
    addReportSettingsTemplate(projectId: number, request: ReportsModel.AddReportSettingsRequest): Promise<ResponseObject<ReportsModel.ReportSettings>>;
    getReportSettingsTemplate(projectId: number, reportSettingsTemplateId: number): Promise<ResponseObject<ReportsModel.ReportSettings>>;
    editReportSettingsTemplate(projectId: number, reportSettingsTemplateId: number, request: PatchRequest[]): Promise<ResponseObject<ReportsModel.ReportSettings>>;
    deleteReportSettingsTemplate(projectId: number, reportSettingsTemplateId: number): Promise<void>;
    listUserReportSettingsTemplates(userId: number, options?: PaginationOptions): Promise<ResponseList<ReportsModel.UserReportSettings>>;
    addUserReportSettingsTemplate(userId: number, request: ReportsModel.AddUserReportSettingsRequest): Promise<ResponseObject<ReportsModel.UserReportSettings>>;
    getUserReportSettingsTemplate(userId: number, reportSettingsTemplateId: number): Promise<ResponseObject<ReportsModel.UserReportSettings>>;
    editUserReportSettingsTemplate(userId: number, reportSettingsTemplateId: number, request: PatchRequest[]): Promise<ResponseObject<ReportsModel.UserReportSettings>>;
    deleteUserReportSettingsTemplate(userId: number, reportSettingsTemplateId: number): Promise<void>;
}
export declare namespace ReportsModel {
    interface ReportArchive {
        id: number;
        scopeType: string;
        scopeId: number;
        userId: number;
        name: string;
        webUrl: string;
        scheme: any;
        createdAt: string;
    }
    interface ListReportArchiveParams extends PaginationOptions {
        scopeType: string;
        scopeId: number;
    }
    interface ReportArchiveStatusAttribute {
        format: Format;
        reportName: string;
        schema: any;
    }
    type GroupReportSchema = GroupTranslationCostsPostEditingSchema | GroupTopMembersSchema | GroupTaskUsageSchema | GroupQaCheckIssuesSchema | GroupTranslationActivitySchema;
    type OrganizationReportSchema = GroupTranslationCostsPostEditingSchema | GroupTopMembersSchema | GroupTaskUsageSchema | GroupQaCheckIssuesSchema | GroupTranslationActivitySchema;
    interface GenerateGroupReportRequest {
        name: string;
        schema: GroupReportSchema;
    }
    interface GenerateOrganizationReportRequest {
        name: string;
        schema: OrganizationReportSchema;
    }
    interface GroupTranslationCostsPostEditingSchema {
        projectIds?: number[];
        unit?: Unit;
        currency?: Currency;
        format?: Format;
        baseRates: BaseRate;
        individualRates: IndividualRate[];
        netRateSchemes: NetRateSchemas;
        excludeApprovalsForEditedTranslations?: boolean;
        preTranslatedStringsCategorizationAdjustment?: boolean;
        groupBy?: GroupBy;
        dateFrom?: string;
        dateTo?: string;
        userIds?: number[];
    }
    interface GroupTranslationCostsPerEditingByTaskSchema {
        unit?: Unit;
        currency?: Currency;
        format?: Format;
        baseRates: BaseRate;
        individualRates: IndividualRate[];
        netRateSchemes: NetRateSchemas;
        taskId?: number;
    }
    interface CostsEstimationSchema {
        projectIds?: number[];
        unit?: Unit;
        currency?: Currency;
        format?: Format;
        baseRates: BaseRate;
        individualRates: IndividualRate[];
        netRateSchemes: NetRateSchemas;
        calculateInternalMatches?: boolean;
        includePreTranslatedStrings?: boolean;
        languageId?: string;
        branchIds?: number[];
        dateFrom?: string;
        dateTo?: string;
        labelIds?: number[];
        labelIncludeType?: LabelIncludeType;
    }
    interface CostsEstimationByTaskSchema {
        unit?: Unit;
        currency?: Currency;
        format?: Format;
        baseRates?: BaseRate;
        individualRates?: IndividualRate[];
        netRateSchemes?: NetRateSchemas;
        calculateInternalMatches?: boolean;
        includePreTranslatedStrings?: boolean;
        taskId?: number;
    }
    interface GroupTopMembersSchema {
        projectIds?: number[];
        unit?: Unit;
        languageId?: string;
        format?: Format;
        dateFrom?: string;
        dateTo?: string;
    }
    interface RawDataSchema {
        mode: ContributionMode;
        unit?: Unit;
        languageId?: string;
        userId?: number;
        dateFrom?: string;
        dateTo?: string;
    }
    type GenerateReportRequest = PreTranslateEfficeincy | PreTranslateAccuracy | TranslateAccuracy | CostEstimationPostEnding | TranslationCostsPostEnding | TopMembers | ContributionRawData | SourceContentUpdates | ProjectMembers | EditorIssues | QaCheckIssues | SavingActivity | TranslationActivity;
    type ReportSchema = Pick<GenerateReportRequest, 'schema'>;
    interface PreTranslateEfficeincy {
        name: 'pre-translate-efficiency';
        schema: PreTranslateAccuracySchema | PreTranslateAccuracySchemaByTask;
    }
    interface PreTranslateAccuracy {
        name: 'pre-translate-accuracy';
        schema: PreTranslateAccuracySchema | PreTranslateAccuracySchemaByTask;
    }
    interface TranslateAccuracy {
        name: 'translator-accuracy';
        schema: TranslateAccuracySchema;
    }
    interface CostEstimationPostEnding {
        name: 'costs-estimation-pe';
        schema: CostEstimationPostEndingSchema | CostEstimationPostEndingSchemaByTask;
    }
    interface TranslationCostsPostEnding {
        name: 'translation-costs-pe';
        schema: TranslationCostsPostEndingSchema | TranslationCostsPostEndingSchemaByTask;
    }
    interface TopMembers {
        name: 'top-members';
        schema: TopMembersSchema;
    }
    interface ContributionRawData {
        name: 'contribution-raw-data';
        schema: ContributionRawDataSchema | ContributionRawDataSchemaByTask;
    }
    interface SourceContentUpdates {
        name: 'source-content-updates';
        schema: SourceContentUpdatesSchema;
    }
    interface ProjectMembers {
        name: 'project-members';
        schema: MembersSchema;
    }
    interface EditorIssues {
        name: 'editor-issues';
        schema: EditorIssuesSchema;
    }
    interface QaCheckIssues {
        name: 'qa-check-issues';
        schema: ProjectQaCheckIssuesSchema;
    }
    interface SavingActivity {
        name: 'saving-activity';
        schema: SavingActivitySchema;
    }
    interface TranslationActivity {
        name: 'translation-activity';
        schema: ProjectConsumptionSchema;
    }
    interface ReportStatusAttributes<S> {
        format: Format;
        reportName: string;
        schema: S;
    }
    interface PreTranslateAccuracySchema {
        unit?: Unit;
        format?: Format;
        postEditingCategories?: string[];
        languageId?: string;
        dateFrom?: string;
        dateTo?: string;
    }
    interface PreTranslateAccuracySchemaByTask {
        unit?: Unit;
        format?: Format;
        postEditingCategories?: string[];
        taskId?: number;
    }
    interface TranslateAccuracySchema {
        unit?: Unit;
        format?: Format;
        postEditingCategories?: string[];
        languageId?: string;
        userIds?: number[];
        dateFrom?: string;
        dateTo?: string;
    }
    interface CostEstimationPostEndingSchema {
        unit?: Unit;
        currency?: Currency;
        format?: Format;
        baseRates: BaseRate;
        individualRates: IndividualRate[];
        netRateSchemes: Omit<NetRateSchemas, 'mtMatch' | 'suggestionMatch'>;
        calculateInternalMatches?: boolean;
        includePreTranslatedStrings?: boolean;
        languageId?: string;
        fileIds?: number[];
        directoryIds?: number[];
        branchIds?: number[];
        dateFrom?: string;
        dateTo?: string;
        labelIds?: number[];
        labelIncludeType?: LabelIncludeType;
        workflowStepId?: number;
    }
    interface CostEstimationPostEndingSchemaByTask {
        unit?: Unit;
        currency?: Currency;
        format?: Format;
        baseRates?: BaseRate;
        individualRates?: IndividualRate[];
        netRateSchemes?: Omit<NetRateSchemas, 'mtMatch' | 'suggestionMatch'>;
        calculateInternalMatches?: boolean;
        includePreTranslatedStrings?: boolean;
        taskId?: number;
    }
    interface TranslationCostsPostEndingSchemaByTask {
        unit?: Unit;
        currency?: Currency;
        format?: Format;
        baseRates: BaseRate;
        individualRates: IndividualRate[];
        netRateSchemes: NetRateSchemas;
        taskId?: number;
        excludeApprovalsForEditedTranslations?: boolean;
        preTranslatedStringsCategorizationAdjustment?: boolean;
    }
    interface TranslationCostsPostEndingSchema {
        unit?: Unit;
        currency?: Currency;
        format?: Format;
        baseRates: BaseRate;
        individualRates: IndividualRate[];
        netRateSchemes: NetRateSchemas;
        excludeApprovalsForEditedTranslations?: boolean;
        preTranslatedStringsCategorizationAdjustment?: boolean;
        groupBy?: GroupBy;
        dateFrom?: string;
        dateTo?: string;
        languageId?: string;
        userIds?: number[];
        fileIds?: number[];
        directoryIds?: number[];
        branchIds?: number[];
        labelIds?: number;
        labelIncludeType?: LabelIncludeType;
        workflowStepId?: number;
    }
    interface TopMembersSchema {
        unit?: Unit;
        languageId?: string;
        format?: Format;
        dateFrom?: string;
        dateTo?: string;
    }
    interface ContributionRawDataSchema {
        mode: ContributionMode;
        unit?: Unit;
        languageId?: string;
        userId?: string;
        columns?: Column[];
        fileIds?: number[];
        directoryIds?: number[];
        branchIds?: number[];
        tmIds?: number[];
        mtIds?: number[];
        aiPromptIds?: number[];
        dateFrom?: string;
        dateTo?: string;
    }
    interface ContributionRawDataSchemaByTask {
        mode: ContributionMode;
        unit?: Unit;
        taskId: number;
        columns?: Column[];
        tmIds?: number[];
        mtIds?: number[];
        aiPromptIds?: number[];
        dateFrom?: string;
        dateTo?: string;
    }
    interface PreTranslateEfficiencySchema {
        unit?: Unit;
        format?: Format;
        postEditingCategories?: string[];
        languageId?: string;
        dateFrom?: string;
        dateTo?: string;
    }
    interface ListOrganizationReportSettingsParams extends PaginationOptions {
        projectId?: number;
        groupId?: number;
    }
    interface ReportSettings {
        id: number;
        name: string;
        currency: Currency;
        unit: Unit;
        config: ReportSettinsConfig;
        isPublic: boolean;
        isGlobal: boolean;
        createdAt: string;
        updatedAt: string;
    }
    interface AddReportSettingsRequest {
        name: string;
        currency: Currency;
        unit: Unit;
        config: ReportSettinsConfig;
        isPublic?: boolean;
        isGlobal?: boolean;
    }
    type UserReportSettings = Omit<ReportSettings, 'isPublic' | 'isGlobal'>;
    type AddUserReportSettingsRequest = Omit<AddReportSettingsRequest, 'isPublic' | 'isGlobal'>;
    type OrganizationReportSettings = Omit<ReportSettings, 'isGlobal'> & {
        projectId: number;
        groupId: number;
    };
    type AddOrganizationReportSettingsRequest = Omit<AddReportSettingsRequest, 'isGlobal'> & {
        projectId?: number;
        groupId?: number;
    };
    interface ReportSettinsConfig {
        baseRates: BaseRate;
        netRateSchemes: NetRateSchemas;
        individualRates: IndividualRate[];
    }
    type Unit = 'strings' | 'words' | 'chars' | 'chars_with_spaces';
    type Currency = 'USD' | 'EUR' | 'JPY' | 'GBP' | 'AUD' | 'CAD' | 'CHF' | 'CNY' | 'SEK' | 'NZD' | 'MXN' | 'SGD' | 'HKD' | 'NOK' | 'KRW' | 'TRY' | 'RUB' | 'INR' | 'BRL' | 'ZAR' | 'GEL' | 'UAH';
    type Format = 'xlsx' | 'csv' | 'json';
    interface BaseRate {
        fullTranslation: number;
        proofread: number;
    }
    interface IndividualRate extends BaseRate {
        languageIds: string[];
        userIds: number[];
        fullTranslation: number;
        proofread: number;
    }
    interface NetRateSchemas {
        tmMatch: {
            matchType: Mode;
            price: number;
        }[];
        mtMatch: {
            matchType: Mode;
            price: number;
        }[];
        suggestionMatch: {
            matchType: Mode;
            price: number;
        }[];
        aiMatch?: {
            matchType: Mode;
            price: number;
        }[];
    }
    type Mode = 'no_match' | 'tm_match' | 'approval' | '99-95' | '94-90' | '89-80' | 'perfect' | '100';
    type ContributionMode = 'translations' | 'approvals' | 'votes';
    type GroupBy = 'user' | 'language';
    type LabelIncludeType = 'strings_with_label' | 'strings_without_label';
    type Column = 'userId' | 'languageId' | 'stringId' | 'translationId' | 'fileId' | 'filePath' | 'pluralForm' | 'sourceStringTextHash' | 'mtEngine' | 'mtId' | 'tmName' | 'tmId' | 'aiPromptName' | 'aiPromptId' | 'preTranslated' | 'tmMatch' | 'mtMatch' | 'aiMatch' | 'suggestionMatch' | 'sourceUnits' | 'targetUnits' | 'createdAt' | 'updatedAt' | 'mark';
    interface SourceContentUpdatesSchema {
        unit?: Unit;
        format?: Format;
        dateFrom?: string;
        dateTo?: string;
        languageId?: string;
        userIds?: number[];
        fileIds?: number[];
        directoryIds?: number[];
        branchIds?: number[];
        labelIds?: number[];
        labelIncludeType?: LabelIncludeType;
    }
    interface MembersSchema {
        format?: Format;
        dateFrom?: string;
        dateTo?: string;
    }
    interface EditorIssuesSchema {
        dateFrom?: string;
        dateTo?: string;
        format?: Format;
        languageId?: string;
        userId?: number;
    }
    interface ProjectQaCheckIssuesSchema {
        format?: Format;
        dateFrom?: string;
        dateTo?: string;
        languageId?: string;
    }
    interface SavingActivitySchema {
        unit?: Unit;
        languageId?: string;
        format?: Format;
        dateFrom?: string;
        dateTo?: string;
        userIds?: number[];
        fileIds?: number[];
        directoryIds?: number[];
        branchIds?: number[];
        labelIds?: number[];
        labelIncludeType?: LabelIncludeType;
    }
    interface ProjectConsumptionSchema {
        unit?: Unit;
        languageId?: string;
        format?: Format;
        dateFrom?: string;
        dateTo?: string;
        userIds?: number[];
        fileIds?: number[];
        directoryIds?: number[];
        branchIds?: number[];
        labelIds?: number[];
        labelIncludeType?: LabelIncludeType;
    }
    interface GroupTaskUsageSchema {
        format: Format;
        type: 'workload' | 'create-vs-resolve' | 'performance' | 'time' | 'cost';
        projectIds?: number[];
        assigneeId?: number;
        creatorId?: number;
        dateFrom?: string;
        dateTo?: string;
        wordsCountFrom?: number;
        wordsCountTo?: number;
        excludeApprovalsForEditedTranslations?: boolean;
        currency?: Currency;
        baseRates?: BaseRate;
        individualRates?: IndividualRate[];
        netRateSchemes?: NetRateSchemas;
    }
    interface GroupQaCheckIssuesSchema {
        projectIds?: number[];
        format?: Format;
        dateFrom?: string;
        dateTo?: string;
        languageId?: string;
    }
    interface GroupTranslationActivitySchema {
        projectIds?: number[];
        unit?: Unit;
        languageId?: string;
        format?: Format;
        dateFrom?: string;
        dateTo?: string;
        userIds?: number[];
        fileIds?: number[];
        directoryIds?: number[];
        branchIds?: number[];
        labelIds?: number[];
        labelIncludeType?: LabelIncludeType;
    }
}
```

##### screenshots/index.d.ts

```typescript
import { CrowdinApi, PaginationOptions, PatchRequest, ResponseList, ResponseObject } from '../core';
export declare class Screenshots extends CrowdinApi {
    listScreenshots(projectId: number, options?: ScreenshotsModel.ListScreenshotParams): Promise<ResponseList<ScreenshotsModel.Screenshot>>;
    listScreenshots(projectId: number, limit?: number, offset?: number): Promise<ResponseList<ScreenshotsModel.Screenshot>>;
    addScreenshot(projectId: number, request: ScreenshotsModel.CreateScreenshotRequest): Promise<ResponseObject<ScreenshotsModel.Screenshot>>;
    getScreenshot(projectId: number, screenshotId: number): Promise<ResponseObject<ScreenshotsModel.Screenshot>>;
    updateScreenshot(projectId: number, screenshotId: number, request: ScreenshotsModel.UpdateScreenshotRequest): Promise<ResponseObject<ScreenshotsModel.Screenshot>>;
    deleteScreenshot(projectId: number, screenshotId: number): Promise<void>;
    editScreenshot(projectId: number, screenshotId: number, request: PatchRequest[]): Promise<ResponseObject<ScreenshotsModel.Screenshot>>;
    listScreenshotTags(projectId: number, screenshotId: number, options?: PaginationOptions): Promise<ResponseList<ScreenshotsModel.Tag>>;
    listScreenshotTags(projectId: number, screenshotId: number, limit?: number, offset?: number): Promise<ResponseList<ScreenshotsModel.Tag>>;
    replaceTags(projectId: number, screenshotId: number, request: ScreenshotsModel.ReplaceTagRequest[] | ScreenshotsModel.AutoTagRequest): Promise<void>;
    addTag(projectId: number, screenshotId: number, request: ScreenshotsModel.ReplaceTagRequest[]): Promise<ResponseObject<ScreenshotsModel.Tag>>;
    clearTags(projectId: number, screenshotId: number): Promise<void>;
    getTag(projectId: number, screenshotId: number, tagId: number): Promise<ResponseObject<ScreenshotsModel.Tag>>;
    deleteTag(projectId: number, screenshotId: number, tagId: number): Promise<void>;
    updateTag(projectId: number, screenshotId: number, tagId: number, request: PatchRequest[]): Promise<ResponseObject<ScreenshotsModel.Screenshot>>;
}
export declare namespace ScreenshotsModel {
    interface ListScreenshotParams extends PaginationOptions {
        stringIds?: number[];
        stringId?: number;
        labelIds?: string;
        excludeLabelIds?: string;
        orderBy?: string;
    }
    interface Screenshot {
        id: number;
        userId: number;
        url: string;
        webUrl: string;
        name: string;
        size: Size;
        tagsCount: number;
        tags: Tag[];
        labels: number[];
        labelIds: number[];
        createdAt: string;
        updatedAt: string;
    }
    interface CreateScreenshotRequest {
        storageId: number;
        name: string;
        autoTag?: boolean;
        fileId?: number;
        branchId?: number;
        directoryId?: number;
        labelIds?: number[];
    }
    interface UpdateScreenshotRequest {
        storageId: number;
        name: string;
    }
    interface Tag {
        id: number;
        screenshotId: number;
        stringId: number;
        position: Position;
        createdAt: string;
    }
    interface ReplaceTagRequest {
        stringId: number;
        position?: Position;
    }
    interface AutoTagRequest {
        autoTag: boolean;
        fileId?: number;
        branchId?: number;
        directoryId?: number;
    }
    interface Size {
        width: number;
        height: number;
    }
    interface Position {
        x: number;
        y: number;
        width: number;
        height: number;
    }
}
```

##### securityLogs/index.d.ts

```typescript
import { CrowdinApi, PaginationOptions, ResponseList, ResponseObject } from '../core';
export declare class SecurityLogs extends CrowdinApi {
    listOrganizationSecurityLogs(options?: SecurityLogsModel.ListOrganizationSecurityLogsParams): Promise<ResponseList<SecurityLogsModel.SecurityLog>>;
    getOrganizationSecurityLog(securityLogId: number): Promise<ResponseObject<SecurityLogsModel.SecurityLog>>;
    listUserSecurityLogs(userId: number, options?: SecurityLogsModel.ListUserSecurityLogsParams): Promise<ResponseList<SecurityLogsModel.SecurityLog>>;
    getUserSecurityLog(userId: number, securityLogId: number): Promise<ResponseObject<SecurityLogsModel.SecurityLog>>;
}
export declare namespace SecurityLogsModel {
    type Event = 'login' | 'password.set' | 'password.change' | 'email.change' | 'login.change' | 'personal_token.issued' | 'personal_token.revoked' | 'mfa.enabled' | 'mfa.disabled' | 'session.revoke' | 'session.revoke_all' | 'sso.connect' | 'sso.disconnect' | 'user.remove' | 'application.connected' | 'application.disconnected' | 'webauthn.created' | 'webauthn.deleted' | 'trusted_device.remove' | 'trusted_device.remove_all' | 'device_verification.enabled' | 'device_verification.disabled';
    interface ListOrganizationSecurityLogsParams extends PaginationOptions {
        event?: Event;
        createdAfter?: string;
        createdBefore?: string;
        ipAddress?: string;
        userId?: number;
    }
    type ListUserSecurityLogsParams = Omit<ListOrganizationSecurityLogsParams, 'userId'>;
    interface SecurityLog {
        id: number;
        event: string;
        info: string;
        userId: number;
        location: string;
        ipAddress: string;
        deviceName: string;
        createdAt: string;
    }
}
```

##### sourceFiles/index.d.ts

```typescript
import { CrowdinApi, DownloadLink, PaginationOptions, PatchRequest, ResponseList, ResponseObject, Status } from '../core';
export declare class SourceFiles extends CrowdinApi {
    getClonedBranch(projectId: number, branchId: number, cloneId: string): Promise<ResponseObject<SourceFilesModel.Branch>>;
    clonedBranch(projectId: number, branchId: number, request: SourceFilesModel.CloneBranchRequest): Promise<ResponseObject<Status<object>>>;
    checkBranchClonedStatus(projectId: number, branchId: number, cloneId: string): Promise<ResponseObject<Status<object>>>;
    listProjectBranches(projectId: number, options?: SourceFilesModel.ListProjectBranchesOptions): Promise<ResponseList<SourceFilesModel.Branch>>;
    listProjectBranches(projectId: number, name?: string, limit?: number, offset?: number): Promise<ResponseList<SourceFilesModel.Branch>>;
    createBranch(projectId: number, request: SourceFilesModel.CreateBranchRequest): Promise<ResponseObject<SourceFilesModel.Branch>>;
    getBranch(projectId: number, branchId: number): Promise<ResponseObject<SourceFilesModel.Branch>>;
    deleteBranch(projectId: number, branchId: number): Promise<void>;
    editBranch(projectId: number, branchId: number, request: PatchRequest[]): Promise<ResponseObject<SourceFilesModel.Branch>>;
    mergeBranch(projectId: number, branchId: number, request: SourceFilesModel.MergeBranchRequest): Promise<ResponseObject<Status<SourceFilesModel.MergeBranchAttributes>>>;
    checkBranchMergeStatus(projectId: number, branchId: number, mergeId: string): Promise<ResponseObject<Status<SourceFilesModel.MergeBranchAttributes>>>;
    getBranchMergeSummary(projectId: number, branchId: number, mergeId: string): Promise<ResponseObject<SourceFilesModel.MergeBranchSummary>>;
    listProjectDirectories(projectId: number, options?: SourceFilesModel.ListProjectDirectoriesOptions): Promise<ResponseList<SourceFilesModel.Directory>>;
    listProjectDirectories(projectId: number, branchId?: number, directoryId?: number, limit?: number, offset?: number, filter?: string, recursion?: string): Promise<ResponseList<SourceFilesModel.Directory>>;
    createDirectory(projectId: number, request: SourceFilesModel.CreateDirectoryRequest): Promise<ResponseObject<SourceFilesModel.Directory>>;
    getDirectory(projectId: number, directoryId: number): Promise<ResponseObject<SourceFilesModel.Directory>>;
    deleteDirectory(projectId: number, directoryId: number): Promise<void>;
    editDirectory(projectId: number, directoryId: number, request: PatchRequest[]): Promise<ResponseObject<SourceFilesModel.Directory>>;
    listProjectFiles(projectId: number, options?: SourceFilesModel.ListProjectFilesOptions): Promise<ResponseList<SourceFilesModel.File>>;
    listProjectFiles(projectId: number, branchId?: number, directoryId?: number, limit?: number, offset?: number, recursion?: any, filter?: string): Promise<ResponseList<SourceFilesModel.File>>;
    createFile(projectId: number, request: SourceFilesModel.CreateFileRequest): Promise<ResponseObject<SourceFilesModel.File>>;
    getFile(projectId: number, fileId: number): Promise<ResponseObject<SourceFilesModel.File>>;
    updateOrRestoreFile(projectId: number, fileId: number, request: SourceFilesModel.ReplaceFileFromStorageRequest | SourceFilesModel.RestoreFile): Promise<ResponseObject<SourceFilesModel.File>>;
    deleteFile(projectId: number, fileId: number): Promise<void>;
    editFile(projectId: number, fileId: number, request: PatchRequest[]): Promise<ResponseObject<SourceFilesModel.File>>;
    downloadFilePreview(projectId: number, fileId: number): Promise<ResponseObject<DownloadLink>>;
    downloadFile(projectId: number, fileId: number): Promise<ResponseObject<DownloadLink>>;
    listAssetReferences(projectId: number, fileId: number, options?: PaginationOptions): Promise<ResponseList<SourceFilesModel.AssetReference>>;
    getAssetReference(projectId: number, fileId: number, referenceId: number): Promise<ResponseObject<SourceFilesModel.AssetReference>>;
    addAssetReference(projectId: number, fileId: number, request: SourceFilesModel.AssetReferenceRequest): Promise<ResponseObject<SourceFilesModel.AssetReference>>;
    deleteAssetReference(projectId: number, fileId: number, referenceId: number): Promise<void>;
    listFileRevisions(projectId: number, fileId: number, options?: PaginationOptions): Promise<ResponseList<SourceFilesModel.FileRevision>>;
    listFileRevisions(projectId: number, fileId: number, limit?: number, offset?: number): Promise<ResponseList<SourceFilesModel.FileRevision>>;
    getFileRevision(projectId: number, fileId: number, revisionId: number): Promise<ResponseObject<SourceFilesModel.FileRevision>>;
    listReviewedSourceFilesBuild(projectId: number, options?: SourceFilesModel.ListReviewedSourceFilesBuildOptions): Promise<ResponseList<SourceFilesModel.ReviewedSourceFilesBuild>>;
    listReviewedSourceFilesBuild(projectId: number, branchId?: number, limit?: number, offset?: number): Promise<ResponseList<SourceFilesModel.ReviewedSourceFilesBuild>>;
    buildReviewedSourceFiles(projectId: number, request?: SourceFilesModel.BuildReviewedSourceFilesRequest): Promise<ResponseObject<SourceFilesModel.ReviewedSourceFilesBuild>>;
    checkReviewedSourceFilesBuildStatus(projectId: number, buildId: number): Promise<ResponseObject<SourceFilesModel.ReviewedSourceFilesBuild>>;
    downloadReviewedSourceFiles(projectId: number, buildId: number): Promise<ResponseObject<DownloadLink>>;
}
export declare namespace SourceFilesModel {
    interface Branch {
        id: number;
        projectId: number;
        name: string;
        title: string;
        exportPattern: string;
        priority: Priority;
        createdAt: string;
        updatedAt: string;
    }
    interface CreateBranchRequest {
        name: string;
        title?: string;
        exportPattern?: string;
        priority?: Priority;
    }
    interface CloneBranchRequest {
        name: string;
        title?: string;
    }
    interface MergeBranchRequest {
        deleteAfterMerge?: boolean;
        sourceBranchId: number;
        acceptSourceChanges?: boolean;
        dryRun?: boolean;
    }
    interface MergeBranchAttributes {
        sourceBranchId: number;
        deleteAfterMerge: boolean;
        acceptSourceChanges?: boolean;
    }
    interface MergeBranchSummary {
        status: string;
        sourceBranchId: number;
        targetBranchId: number;
        dryRun: boolean;
        details: {
            added: number;
            deleted: number;
            updated: number;
            conflicted: number;
        };
    }
    type Priority = 'low' | 'normal' | 'high';
    interface ListProjectDirectoriesOptions extends PaginationOptions {
        branchId?: number;
        directoryId?: number;
        filter?: string;
        recursion?: string;
        orderBy?: string;
    }
    interface Directory {
        id: number;
        projectId: number;
        branchId: number;
        directoryId: number;
        name: string;
        title: string;
        exportPattern: string;
        path: string;
        priority: Priority;
        createdAt: string;
        updatedAt: string;
    }
    interface CreateDirectoryRequest {
        name: string;
        branchId?: number;
        directoryId?: number;
        title?: string;
        exportPattern?: string;
        priority?: Priority;
    }
    interface ListProjectFilesOptions extends PaginationOptions {
        branchId?: number;
        directoryId?: number;
        recursion?: any;
        filter?: string;
        orderBy?: string;
    }
    interface File {
        id: number;
        projectId: number;
        branchId: number;
        directoryId: number;
        name: string;
        title: string;
        context: string;
        type: string;
        path: string;
        status: string;
        revisionId: number;
        priority: Priority;
        importOptions: ImportOptions;
        exportOptions: GeneralExportOptions | PropertyExportOptions;
        excludedTargetLanguages: string[];
        parserVersion: number;
        createdAt: string;
        updatedAt: string;
        fields: Record<string, any>;
    }
    interface CreateFileRequest {
        storageId: number;
        name: string;
        branchId?: number;
        directoryId?: number;
        title?: string;
        context?: string;
        type?: FileType;
        parserVersion?: number;
        importOptions?: ImportOptions;
        exportOptions?: ExportOptions;
        excludedTargetLanguages?: string[];
        attachLabelIds?: number[];
        fields?: Record<string, any>;
    }
    interface ReplaceFileFromStorageRequest {
        storageId: number;
        name?: string;
        updateOption?: UpdateOption;
        importOptions?: ImportOptions;
        exportOptions?: ExportOptions;
        attachLabelIds?: number[];
        detachLabelIds?: number[];
        replaceModifiedContext?: boolean;
    }
    type ExportOptions = GeneralExportOptions | PropertyExportOptions | JavaScriptExportOptions | MdExportOptions;
    type ImportOptions = SpreadsheetImportOptions | XmlImportOptions | WebXmlImportOptions | DocxFileImportOptions | HtmlFileImportOptions | HtmlFrontMatterFileImportOptions | MdxFileImportOptions | MdFileImportOptions | StringCatalogFileImportOptions | AdocFileImportOptions | OtherImportOptions;
    interface RestoreFile {
        revisionId: number;
    }
    interface FileRevision {
        id: number;
        projectId: number;
        fileId: number;
        restoreToRevision: number;
        info: FileRevisionInfo;
        date: string;
    }
    interface FileRevisionInfo {
        added: FileRevisionInfoAttribute;
        deleted: FileRevisionInfoAttribute;
        updated: FileRevisionInfoAttribute;
    }
    interface FileRevisionInfoAttribute {
        strings: number;
        words: number;
    }
    type FileType = 'auto' | 'android' | 'macosx' | 'resx' | 'properties' | 'gettext' | 'yaml' | 'php' | 'json' | 'xml' | 'ini' | 'rc' | 'resw' | 'resjson' | 'qtts' | 'joomla' | 'chrome' | 'dtd' | 'dklang' | 'flex' | 'nsh' | 'wxl' | 'xliff' | 'xliff_two' | 'html' | 'haml' | 'txt' | 'csv' | 'md' | 'flsnp' | 'fm_html' | 'fm_md' | 'mediawiki' | 'docx' | 'xlsx' | 'sbv' | 'properties_play' | 'properties_xml' | 'maxthon' | 'go_json' | 'dita' | 'mif' | 'idml' | 'stringsdict' | 'plist' | 'vtt' | 'vdf' | 'srt' | 'stf' | 'toml' | 'contentful_rt' | 'svg' | 'js' | 'coffee' | 'nestjs_i18n' | 'webxml';
    interface SpreadsheetImportOptions {
        firstLineContainsHeader?: boolean;
        contentSegmentation?: boolean;
        srxStorageId?: number;
        importTranslations?: boolean;
        scheme?: Scheme;
    }
    interface Scheme {
        none: number;
        identifier: number;
        sourcePhrase: number;
        sourceOrTranslation: number;
        translation: number;
        context: number;
        maxLength: number;
        labels: number;
        [key: string]: number;
    }
    interface XmlImportOptions {
        translateContent?: boolean;
        translateAttributes?: boolean;
        inlineTags?: string[];
        contentSegmentation?: boolean;
        translatableElements?: string[];
        srxStorageId?: number;
    }
    interface WebXmlImportOptions {
        inlineTags?: string[];
        contentSegmentation?: boolean;
        srxStorageId?: number;
    }
    interface DocxFileImportOptions {
        cleanTagsAggressively?: boolean;
        translateHiddenText?: boolean;
        translateHyperlinkUrls?: boolean;
        translateHiddenRowsAndColumns?: boolean;
        importNotes?: boolean;
        importHiddenSlides?: boolean;
        contentSegmentation?: boolean;
        srxStorageId?: number;
    }
    interface HtmlFileImportOptions {
        excludedElements?: string[];
        inlineTags?: string[];
        contentSegmentation?: boolean;
        srxStorageId?: number;
    }
    interface HtmlFrontMatterFileImportOptions extends HtmlFileImportOptions {
        excludedFrontMatterElements?: string[];
    }
    interface MdxFileImportOptions {
        excludedFrontMatterElements?: string[];
        excludeCodeBlocks?: boolean;
        contentSegmentation?: boolean;
        srxStorageId?: number;
    }
    interface MdFileImportOptions {
        excludedFrontMatterElements?: string[];
        excludeCodeBlocks?: boolean;
        inlineTags?: string[];
        contentSegmentation?: boolean;
        srxStorageId?: number;
    }
    interface StringCatalogFileImportOptions {
        importKeyAsSource?: boolean;
    }
    interface AdocFileImportOptions {
        excludeIncludeDirectives?: boolean;
    }
    interface OtherImportOptions {
        contentSegmentation: boolean;
        srxStorageId: number;
    }
    interface GeneralExportOptions {
        exportPattern?: string;
    }
    interface PropertyExportOptions {
        escapeQuotes?: EscapeQuotes;
        exportPattern?: string;
        escapeSpecialCharacters?: 0 | 1;
    }
    interface JavaScriptExportOptions {
        exportPattern?: string;
        exportQuotes?: ExportQuotes;
    }
    interface MdExportOptions {
        exportPattern?: string;
        strongMarker?: 'asterisk' | 'underscore';
        emphasisMarker?: 'asterisk' | 'underscore';
        unorderedListBullet?: 'asterisks' | 'plus' | 'plus';
        tableColumnWidth?: 'consolidate' | 'evenly_distribute_cells';
    }
    enum EscapeQuotes {
        ZERO = 0,
        ONE = 1,
        TWO = 2,
        THREE = 3
    }
    enum ExportQuotes {
        SINGLE = "single",
        DOUBLE = "double"
    }
    type UpdateOption = 'clear_translations_and_approvals' | 'keep_translations' | 'keep_translations_and_approvals';
    interface ReviewedSourceFilesBuild {
        id: number;
        projectId: number;
        status: string;
        progress: number;
        attributes: ReviewedSourceFilesBuildAttributes;
    }
    interface ReviewedSourceFilesBuildAttributes {
        branchId: number;
        targetLanguageId: string;
    }
    interface BuildReviewedSourceFilesRequest {
        branchId?: number;
    }
    interface ListProjectBranchesOptions extends PaginationOptions {
        name?: string;
        orderBy?: string;
    }
    interface ListReviewedSourceFilesBuildOptions extends PaginationOptions {
        branchId?: number;
    }
    interface User {
        id: number;
        username: string;
        fullName: string;
        avatarUrl: string;
    }
    interface AssetReference {
        id: number;
        name: string;
        user: User;
        createdAt: string;
        mimeType: string;
    }
    interface AssetReferenceRequest {
        storageId: number;
        name: string;
    }
}
```

##### sourceStrings/index.d.ts

```typescript
import { BooleanInt, CrowdinApi, PaginationOptions, PatchRequest, ResponseList, ResponseObject, Status } from '../core';
import { SourceFilesModel } from '../sourceFiles';
export declare class SourceStrings extends CrowdinApi {
    uploadStringsStatus(projectId: number, uploadId: string): Promise<ResponseObject<Status<SourceStringsModel.UploadStringsStatus>>>;
    uploadStrings(projectId: number, request: SourceStringsModel.UploadStringsRequest): Promise<ResponseObject<Status<SourceStringsModel.UploadStringsStatus>>>;
    listProjectStrings(projectId: number, options?: SourceStringsModel.ListProjectStringsOptions): Promise<ResponseList<SourceStringsModel.String>>;
    listProjectStrings(projectId: number, fileId?: number, limit?: number, offset?: number, filter?: string, denormalizePlaceholders?: BooleanInt, labelIds?: string, scope?: SourceStringsModel.Scope, croql?: string, branchId?: number, directoryId?: number): Promise<ResponseList<SourceStringsModel.String>>;
    addString(projectId: number, request: SourceStringsModel.CreateStringRequest | SourceStringsModel.CreateStringStringsBasedRequest): Promise<ResponseObject<SourceStringsModel.String>>;
    stringBatchOperations(projectId: number, request: PatchRequest[]): Promise<ResponseList<SourceStringsModel.String>>;
    getString(projectId: number, stringId: number, query?: {
        denormalizePlaceholders: BooleanInt;
    }): Promise<ResponseObject<SourceStringsModel.String>>;
    deleteString(projectId: number, stringId: number): Promise<void>;
    editString(projectId: number, stringId: number, request: PatchRequest[]): Promise<ResponseObject<SourceStringsModel.String>>;
}
export declare namespace SourceStringsModel {
    type UploadStringsType = 'auto' | 'android' | 'macosx' | 'arb' | 'csv' | 'json' | 'xliff' | 'xliff_two' | 'xlsx';
    interface UploadStringsStatus {
        branchId: number;
        storageId: number;
        fileType: UploadStringsType;
        parserVersion: number;
        labelIds: number[];
        importOptions: {
            firstLineContainsHeader: boolean;
            importTranslations: boolean;
            scheme: SourceFilesModel.Scheme;
        };
        updateStrings: boolean;
        cleanupMode: boolean;
        updateOption: UpdateOption;
    }
    interface UploadStringsRequest {
        branchId: number;
        storageId: number;
        type?: UploadStringsType;
        parserVersion?: number;
        labelIds?: number[];
        updateStrings?: boolean;
        cleanupMode?: boolean;
        importOptions?: {
            firstLineContainsHeader: boolean;
            importTranslations: boolean;
            scheme: SourceFilesModel.Scheme;
        };
        updateOption?: UpdateOption;
    }
    interface ListProjectStringsOptions extends PaginationOptions {
        orderBy?: string;
        denormalizePlaceholders?: BooleanInt;
        labelIds?: string;
        fileId?: number;
        branchId?: number;
        directoryId?: number;
        taskId?: number;
        croql?: string;
        filter?: string;
        scope?: SourceStringsModel.Scope;
    }
    interface String {
        id: number;
        projectId: number;
        branchId: number;
        identifier: string;
        text: string | PluralText;
        type: Type;
        context: string;
        maxLength: number;
        isHidden: boolean;
        isDuplicate: boolean;
        masterStringId: boolean;
        hasPlurals: boolean;
        isIcu: boolean;
        labelIds: number[];
        webUrl: string;
        createdAt: string;
        updatedAt: string;
        fileId: number;
        directoryId: number;
        revision: number;
        fields: Record<string, any>;
    }
    interface CreateStringRequest {
        text: string | PluralText;
        identifier?: string;
        fileId: number;
        context?: string;
        isHidden?: boolean;
        maxLength?: number;
        labelIds?: number[];
        fields?: Record<string, any>;
    }
    interface CreateStringStringsBasedRequest {
        text: string | PluralText;
        identifier: string;
        branchId: number;
        context?: string;
        isHidden?: boolean;
        maxLength?: number;
        labelIds?: number[];
        fields?: Record<string, any>;
    }
    interface PluralText {
        zero?: string;
        one?: string;
        two?: string;
        few?: string;
        many?: string;
        other?: string;
    }
    enum Type {
        TEXT = 0,
        ASSET = 1,
        ICU = 2
    }
    type Scope = 'identifier' | 'text' | 'context';
    type UpdateOption = 'clear_translations_and_approvals' | 'keep_translations' | 'keep_translations_and_approvals';
}
```

##### stringComments/index.d.ts

```typescript
import { CrowdinApi, PaginationOptions, PatchRequest, ResponseList, ResponseObject } from '../core';
export declare class StringComments extends CrowdinApi {
    listStringComments(projectId: number, options?: StringCommentsModel.ListStringCommentsOptions): Promise<ResponseList<StringCommentsModel.StringComment>>;
    listStringComments(projectId: number, stringId?: number, type?: StringCommentsModel.Type, targetLanguageId?: string, issueType?: StringCommentsModel.IssueType, issueStatus?: StringCommentsModel.IssueStatus): Promise<ResponseList<StringCommentsModel.StringComment>>;
    addStringComment(projectId: number, request: StringCommentsModel.AddStringCommentRequest): Promise<ResponseObject<StringCommentsModel.StringComment>>;
    getStringComment(projectId: number, stringCommentId: number): Promise<ResponseObject<StringCommentsModel.StringComment>>;
    deleteStringComment(projectId: number, stringCommentId: number): Promise<void>;
    editStringComment(projectId: number, stringCommentId: number, request: PatchRequest[]): Promise<ResponseObject<StringCommentsModel.StringComment>>;
    stringCommentBatchOperations(projectId: number, request: PatchRequest[]): Promise<ResponseList<StringCommentsModel.StringComment>>;
}
export declare namespace StringCommentsModel {
    interface ListStringCommentsOptions extends PaginationOptions {
        stringId?: number;
        type?: Type;
        targetLanguageId?: string;
        issueType?: IssueType;
        issueStatus?: IssueStatus;
        orderBy?: string;
    }
    interface StringComment {
        id: number;
        isShared?: boolean;
        text: string;
        userId: number;
        stringId: number;
        user: User;
        string: StringModel;
        projectId: number;
        languageId: string;
        type: Type;
        issueType: IssueType;
        issueStatus: IssueStatus;
        resolverId: number;
        senderOrganization: {
            id: number;
            domain: string;
        };
        resolverOrganization: {
            id: number;
            domain: string;
        };
        resolver: User;
        resolvedAt: string;
        createdAt: string;
    }
    interface User {
        id: number;
        username: string;
        fullName: string;
        avatarUrl: string;
    }
    interface StringModel {
        id: number;
        text: string;
        type: string;
        hasPlurals: boolean;
        isIcu: boolean;
        context: string;
        fileId: number;
    }
    interface AddStringCommentRequest {
        stringId: number;
        text: string;
        targetLanguageId: string;
        type: Type;
        isShared?: boolean;
        issueType?: IssueType;
    }
    type Type = 'comment' | 'issue';
    type IssueType = 'general_question' | 'translation_mistake' | 'context_request' | 'source_mistake';
    type IssueStatus = 'unresolved' | 'resolved';
}
```

##### stringCorrections/index.d.ts

```typescript
import { BooleanInt, CrowdinApi, PaginationOptions, ResponseList, ResponseObject } from '../core';
export declare class StringCorrections extends CrowdinApi {
    listStringCorrections(projectId: number, options: StringCorrectionsModel.ListStringCorrectionsParams): Promise<ResponseList<StringCorrectionsModel.StringCorrection>>;
    addStringCorrection(projectId: number, request: StringCorrectionsModel.AddStringCorrectionRequest): Promise<ResponseObject<StringCorrectionsModel.StringCorrection>>;
    deleteStringCorrections(projectId: number, stringId: number): Promise<void>;
    getStringCorrection(projectId: number, correctionId: number, params?: {
        denormalizePlaceholders?: BooleanInt;
    }): Promise<ResponseObject<StringCorrectionsModel.StringCorrection>>;
    restoreStringCorrection(projectId: number, correctionId: number): Promise<ResponseObject<StringCorrectionsModel.StringCorrection>>;
    deleteStringCorrection(projectId: number, correctionId: number): Promise<void>;
}
export declare namespace StringCorrectionsModel {
    interface ListStringCorrectionsParams extends PaginationOptions {
        stringId: number;
        orderBy?: string;
        denormalizePlaceholders?: BooleanInt;
    }
    interface StringCorrection {
        id: number;
        text: string;
        pluralCategoryName: PluralCategoryName;
        user: {
            id: number;
            username: string;
            fullName: string;
            avatarUrl: string;
        };
        createdAt: string;
    }
    type PluralCategoryName = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
    interface AddStringCorrectionRequest {
        stringId: number;
        text: string;
        pluralCategoryName?: PluralCategoryName;
    }
}
```

##### stringTranslations/index.d.ts

```typescript
import { BooleanInt, CrowdinApi, PaginationOptions, PatchRequest, ResponseList, ResponseObject } from '../core';
export declare class StringTranslations extends CrowdinApi {
    listTranslationApprovals(projectId: number, options?: StringTranslationsModel.ListTranslationApprovalsOptions): Promise<ResponseList<StringTranslationsModel.Approval>>;
    listTranslationApprovals(projectId: number, stringId?: number, languageId?: string, translationId?: number, limit?: number, offset?: number, fileId?: number, labelIds?: string, excludeLabelIds?: string): Promise<ResponseList<StringTranslationsModel.Approval>>;
    addApproval(projectId: number, request: StringTranslationsModel.AddApprovalRequest): Promise<ResponseObject<StringTranslationsModel.Approval>>;
    removeStringApprovals(projectId: number, stringId: number): Promise<void>;
    approvalInfo(projectId: number, approvalId: number): Promise<ResponseObject<StringTranslationsModel.Approval>>;
    approvalBatchOperations(projectId: number, request: PatchRequest[]): Promise<ResponseList<StringTranslationsModel.Approval>>;
    removeApproval(projectId: number, approvalId: number): Promise<void>;
    listLanguageTranslations(projectId: number, languageId: string, options?: StringTranslationsModel.ListLanguageTranslationsOptions): Promise<ResponseList<StringTranslationsModel.PlainLanguageTranslation | StringTranslationsModel.PluralLanguageTranslation | StringTranslationsModel.IcuLanguageTranslation>>;
    listLanguageTranslations(projectId: number, languageId: string, stringIds?: string, fileId?: number, limit?: number, offset?: number, labelIds?: string, denormalizePlaceholders?: BooleanInt, croql?: string): Promise<ResponseList<StringTranslationsModel.PlainLanguageTranslation | StringTranslationsModel.PluralLanguageTranslation | StringTranslationsModel.IcuLanguageTranslation>>;
    translationAlignment(projectId: number, request: StringTranslationsModel.TranslationAlignmentRequest): Promise<ResponseObject<StringTranslationsModel.TranslationAlignmentResponse>>;
    listStringTranslations(projectId: number, stringId: number, languageId: string, options?: StringTranslationsModel.ListStringTranslationsOptions): Promise<ResponseList<StringTranslationsModel.StringTranslation>>;
    listStringTranslations(projectId: number, stringId: number, languageId: string, limit?: number, offset?: number, denormalizePlaceholders?: BooleanInt): Promise<ResponseList<StringTranslationsModel.StringTranslation>>;
    addTranslation(projectId: number, request: StringTranslationsModel.AddStringTranslationRequest): Promise<ResponseObject<StringTranslationsModel.StringTranslation>>;
    deleteAllTranslations(projectId: number, stringId: number, languageId?: string): Promise<void>;
    translationInfo(projectId: number, translationId: number): Promise<ResponseObject<StringTranslationsModel.StringTranslation>>;
    restoreTranslation(projectId: number, translationId: number): Promise<ResponseObject<StringTranslationsModel.StringTranslation>>;
    translationBatchOperations(projectId: number, request: PatchRequest[]): Promise<ResponseList<StringTranslationsModel.StringTranslation>>;
    deleteTranslation(projectId: number, translationId: number): Promise<void>;
    listTranslationVotes(projectId: number, options?: StringTranslationsModel.ListTranslationVotesOptions): Promise<ResponseList<StringTranslationsModel.Vote>>;
    listTranslationVotes(projectId: number, stringId?: number, languageId?: string, translationId?: number, labelIds?: string, excludeLabelIds?: string, limit?: number, offset?: number): Promise<ResponseList<StringTranslationsModel.Vote>>;
    addVote(projectId: number, request: StringTranslationsModel.AddVoteRequest): Promise<ResponseObject<StringTranslationsModel.Vote>>;
    voteInfo(projectId: number, voteId: number): Promise<ResponseObject<StringTranslationsModel.Vote>>;
    cancelVote(projectId: number, voteId: number): Promise<void>;
}
export declare namespace StringTranslationsModel {
    interface ListTranslationApprovalsOptions extends PaginationOptions {
        stringId?: number;
        languageId?: string;
        translationId?: number;
        fileId?: number;
        labelIds?: string;
        excludeLabelIds?: string;
        orderBy?: string;
    }
    interface Approval {
        id: number;
        user: User;
        translationId: number;
        stringId: number;
        languageId: string;
        createdAt: string;
    }
    interface AddApprovalRequest {
        translationId: number;
    }
    interface StringTranslation {
        id: number;
        text: string;
        pluralCategoryName: PluralCategoryName;
        user: User;
        rating: number;
        provider: string;
        isPreTranslated: boolean;
        createdAt: string;
    }
    interface ListLanguageTranslationsOptions extends PaginationOptions {
        stringIds?: string;
        fileId?: number;
        labelIds?: string;
        denormalizePlaceholders?: BooleanInt;
        croql?: string;
        approvedOnly?: BooleanInt;
        passedWorkflow?: BooleanInt;
        orderBy?: string;
        branchId?: number;
        minApprovalCount?: number;
        directoryId?: number;
    }
    interface PlainLanguageTranslation {
        stringId: number;
        contentType: string;
        translationId: number;
        text: string;
        user: User;
        createdAt: string;
    }
    interface PluralLanguageTranslation {
        stringId: number;
        contentType: string;
        plurals: Plural[];
    }
    interface IcuLanguageTranslation {
        stringId: number;
        contentType: string;
        translationId: number;
        text: string;
        user: User;
        createdAt: string;
    }
    interface Plural {
        translationId: number;
        text: string;
        pluralForm: string;
        user: User;
        createdAt: string;
    }
    interface TranslationAlignmentRequest {
        sourceLanguageId: string;
        targetLanguageId: string;
        text: string;
    }
    interface TranslationAlignmentResponse {
        words: {
            text: string;
            alignments: {
                sourceWord: string;
                sourceLemma: string;
                targetWord: string;
                targetLemma: string;
                match: number;
                probability: number;
            }[];
        }[];
    }
    interface AddStringTranslationRequest {
        stringId: number;
        languageId: string;
        text: string;
        pluralCategoryName?: PluralCategoryName;
        addToTm?: boolean;
    }
    interface ListTranslationVotesOptions extends PaginationOptions {
        stringId?: number;
        languageId?: string;
        translationId?: number;
        fileId?: number;
        labelIds?: string;
        excludeLabelIds?: string;
    }
    interface Vote {
        id: number;
        user: User;
        translationId: number;
        votedAt: string;
        mark: Mark;
    }
    interface AddVoteRequest {
        mark: Mark;
        translationId: number;
    }
    interface User {
        id: number;
        username: string;
        fullName: string;
        avatarUrl: string;
    }
    type Mark = 'up' | 'down';
    interface ListStringTranslationsOptions extends PaginationOptions {
        denormalizePlaceholders?: BooleanInt;
        orderBy?: string;
    }
    type PluralCategoryName = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
}
```

##### tasks/index.d.ts

```typescript
import { BooleanInt, CrowdinApi, DownloadLink, PaginationOptions, PatchRequest, ResponseList, ResponseObject } from '../core';
import { LanguagesModel } from '../languages';
export declare class Tasks extends CrowdinApi {
    listTasks(projectId: number, options?: TasksModel.ListTasksOptions): Promise<ResponseList<TasksModel.Task>>;
    listTasks(projectId: number, limit?: number, offset?: number, status?: TasksModel.Status): Promise<ResponseList<TasksModel.Task>>;
    addTask(projectId: number, request: TasksModel.CreateTaskRequest): Promise<ResponseObject<TasksModel.Task>>;
    exportTaskStrings(projectId: number, taskId: number): Promise<ResponseObject<DownloadLink>>;
    getTask(projectId: number, taskId: number): Promise<ResponseObject<TasksModel.Task>>;
    deleteTask(projectId: number, taskId: number): Promise<void>;
    editTask(projectId: number, taskId: number, request: PatchRequest[]): Promise<ResponseObject<TasksModel.Task>>;
    listTasksComments(projectId: number, taskId: number, options?: PaginationOptions): Promise<ResponseList<TasksModel.TaskComment>>;
    addTaskComment(projectId: number, taskId: number, request: TasksModel.CreateTaskCommentRequest): Promise<ResponseObject<TasksModel.TaskComment>>;
    getTaskComment(projectId: number, taskId: number, commentId: number): Promise<ResponseObject<TasksModel.TaskComment>>;
    deleteTaskComment(projectId: number, taskId: number, commentId: number): Promise<void>;
    editTaskComment(projectId: number, taskId: number, commentId: number, request: PatchRequest[]): Promise<ResponseObject<TasksModel.TaskComment>>;
    listUserTasks(options?: TasksModel.ListUserTasksOptions): Promise<ResponseList<TasksModel.UserTask>>;
    listUserTasks(limit?: number, offset?: number, status?: TasksModel.Status, isArchived?: BooleanInt): Promise<ResponseList<TasksModel.UserTask>>;
    listTasksOwnedByUser(userId: number, options?: TasksModel.ListOrganizationTasksOptions): Promise<ResponseList<TasksModel.Task>>;
    listOrganizationTasks(options?: TasksModel.ListOrganizationTasksOptions): Promise<ResponseList<TasksModel.Task>>;
    editTaskArchivedStatus(projectId: number, taskId: number, request: PatchRequest[]): Promise<ResponseObject<TasksModel.UserTask>>;
    listTaskSettingsTemplates(projectId: number, options?: PaginationOptions): Promise<ResponseList<TasksModel.TaskSettingsTemplate>>;
    addTaskSettingsTemplate(projectId: number, request: TasksModel.AddTaskSettingsTemplate): Promise<ResponseObject<TasksModel.TaskSettingsTemplate>>;
    getTaskSettingsTemplate(projectId: number, taskSettingsId: number): Promise<ResponseObject<TasksModel.TaskSettingsTemplate>>;
    deleteTaskSettingsTemplate(projectId: number, taskSettingsId: number): Promise<void>;
    editTaskSettingsTemplate(projectId: number, taskSettingsId: number, request: PatchRequest[]): Promise<ResponseObject<TasksModel.TaskSettingsTemplate>>;
}
export declare namespace TasksModel {
    interface Task {
        id: number;
        projectId: number;
        creatorId: number;
        type: Type | TypeVendor;
        status: Status;
        title: string;
        assignees: Assignee[];
        assignedTeams: AssignedTeam[];
        progress: Progress;
        translateProgress: Progress;
        sourceLanguageId: string;
        targetLanguageId: string;
        description: string;
        translationUrl: string;
        webUrl: string;
        wordsCount: number;
        commentsCount: number;
        deadline: string;
        startedAt: string;
        resolvedAt: string;
        timeRange: string;
        workflowStepId: number;
        buyUrl: string;
        createdAt: string;
        updatedAt: string;
        sourceLanguage: LanguagesModel.Language;
        targetLanguages: LanguagesModel.Language[];
        labelIds: number[];
        excludeLabelIds: number[];
        precedingTaskId: number;
        filesCount: number;
        fileIds: number[];
        branchIds: number[];
        vendor: string;
        fields: Record<string, any>;
    }
    interface ListUserTasksOptions extends PaginationOptions {
        status?: Status;
        isArchived?: BooleanInt;
        orderBy?: string;
    }
    interface ListOrganizationTasksOptions extends PaginationOptions {
        orderBy?: string;
        status?: string;
        type?: string;
        projectIds?: string;
        groupIds?: string;
        assigneeIds?: string;
        creatorIds?: string;
        targetLanguageIds?: string;
        sourceLanguageIds?: string;
        createdAtFrom?: string;
        createdAtTo?: string;
        deadlineFrom?: string;
        deadlineTo?: string;
    }
    interface UserTask extends Task {
        isArchived: boolean;
    }
    type CreateTaskRequest = CreateTaskEnterpriseByBranchIds | CreateTaskEnterpriseByFileIds | CreateTaskEnterpriseByStringIds | CreateTaskEnterpriseVendorByBranchIds | CreateTaskEnterpriseVendorByFileIds | CreateTaskEnterpriseVendorByStringIds | CreateTaskEnterprisePendingTask | CreateTaskByFileIds | CreateTaskByStringIds | CreateTaskByBranchIds | CreateTaskByFileIdsLanguageService | CreateTaskByStringIdsLanguageService | CreateTaskByBranchIdsLanguageService | CreateTaskVendorOhtByFileIds | CreateTaskVendorOhtByStringIds | CreateTaskVendorOhtByBranchIds | CreateTaskVendorGengoByFileIds | CreateTaskVendorGengoByStringIds | CreateTaskVendorGengoByBranchIds | CreateTaskVendorManualByFileIds | CreateTaskVendorManualByStringIds | CreateTaskVendorManualByBranchIds | CreateTaskPendingTask | CreateTaskPendingTaskLanguageService | CreateTaskPendingTaskVendorManual;
    interface CreateTaskEnterpriseByBranchIds {
        type: Type;
        workflowStepId: number;
        title: string;
        languageId: string;
        branchIds: number[];
        labelIds?: number[];
        excludeLabelIds?: number[];
        status?: RequestStatus;
        description?: string;
        splitContent?: boolean;
        skipAssignedStrings?: boolean;
        assignees?: CreateTaskAssignee[];
        assignedTeams?: AssignedTeam[];
        includePreTranslatedStringsOnly?: boolean;
        deadline?: string;
        startedAt?: string;
        dateFrom?: string;
        dateTo?: string;
        fields?: Record<string, any>;
    }
    interface CreateTaskEnterpriseByStringIds {
        type: Type;
        workflowStepId: number;
        title: string;
        languageId: string;
        stringIds: number[];
        status?: RequestStatus;
        description?: string;
        splitContent?: boolean;
        skipAssignedStrings?: boolean;
        assignees?: CreateTaskAssignee[];
        assignedTeams?: AssignedTeam[];
        includePreTranslatedStringsOnly?: boolean;
        deadline?: string;
        startedAt?: string;
        dateFrom?: string;
        dateTo?: string;
        fields?: Record<string, any>;
    }
    type CreateTaskEnterpriseVendorByStringIds = Omit<CreateTaskEnterpriseByStringIds, 'type' | 'status' | 'splitContent' | 'assignees' | 'assignedTeams'>;
    type CreateTaskEnterpriseVendorByBranchIds = Omit<CreateTaskEnterpriseByBranchIds, 'type' | 'status' | 'splitContent' | 'assignees' | 'assignedTeams'>;
    type CreateTaskEnterpriseByFileIds = Omit<CreateTaskEnterpriseByBranchIds, 'branchIds'> & {
        fileIds: number[];
    };
    type CreateTaskEnterpriseVendorByFileIds = Omit<CreateTaskEnterpriseByFileIds, 'type' | 'status' | 'splitContent' | 'assignees' | 'assignedTeams'>;
    interface CreateTaskEnterprisePendingTask {
        precedingTaskId: number;
        type: Type.PROOFREAD;
        title: string;
        description?: string;
        assignees?: CreateTaskAssignee[];
        assignedTeams?: AssignedTeam[];
        deadline?: string;
    }
    interface CreateTaskByFileIds {
        title: string;
        languageId: string;
        type: Type;
        fileIds: number[];
        labelIds?: number[];
        excludeLabelIds?: number[];
        status?: RequestStatus;
        description?: string;
        splitContent?: boolean;
        skipAssignedStrings?: boolean;
        includePreTranslatedStringsOnly?: boolean;
        assignees?: CreateTaskAssignee[];
        deadline?: string;
        startedAt?: string;
        dateFrom?: string;
        dateTo?: string;
    }
    type CreateTaskByStringIds = Omit<CreateTaskByFileIds, 'fileIds' | 'labelIds' | 'excludeLabelIds'> & {
        stringIds: number;
    };
    type CreateTaskByBranchIds = Omit<CreateTaskByFileIds, 'fileIds'> & {
        branchIds: number;
    };
    interface CreateTaskByFileIdsLanguageService {
        title: string;
        languageId: string;
        type: TypeVendor;
        vendor: 'crowdin_language_service';
        fileIds: number[];
        labelIds?: number[];
        excludeLabelIds?: number[];
        status?: RequestStatus;
        description?: string;
        includePreTranslatedStringsOnly?: boolean;
        assignees?: CreateTaskAssignee[];
        dateFrom?: string;
        dateTo?: string;
    }
    type CreateTaskByStringIdsLanguageService = Omit<CreateTaskByFileIdsLanguageService, 'fileIds' | 'labelIds' | 'excludeLabelIds'> & {
        stringIds: number[];
    };
    type CreateTaskByBranchIdsLanguageService = Omit<CreateTaskByFileIdsLanguageService, 'fileIds'> & {
        branchIds: number[];
    };
    interface CreateTaskVendorOhtByFileIds {
        title: string;
        languageId: string;
        type: TypeVendor;
        vendor: 'oht';
        fileIds: number[];
        labelIds?: number[];
        excludeLabelIds?: number[];
        status?: RequestStatus;
        description?: string;
        expertise?: Expertise;
        editService?: boolean;
        includePreTranslatedStringsOnly?: boolean;
        dateFrom?: string;
        dateTo?: string;
    }
    type CreateTaskVendorOhtByStringIds = Omit<CreateTaskVendorOhtByFileIds, 'fileIds' | 'labelIds' | 'excludeLabelIds'> & {
        stringIds: number[];
    };
    type CreateTaskVendorOhtByBranchIds = Omit<CreateTaskVendorOhtByFileIds, 'fileIds'> & {
        branchIds: number[];
    };
    interface CreateTaskVendorGengoByFileIds {
        title: string;
        languageId: string;
        type: TypeVendor.TRANSLATE_BY_VENDOR;
        vendor: 'gengo';
        fileIds: number[];
        labelIds?: number[];
        excludeLabelIds?: number[];
        status?: RequestStatus;
        description?: string;
        expertise?: 'standard' | 'pro';
        tone?: Tone;
        purpose?: Purpose;
        customerMessage?: string;
        usePreferred?: boolean;
        editService?: boolean;
        dateFrom?: string;
        dateTo?: string;
    }
    type CreateTaskVendorGengoByStringIds = Omit<CreateTaskVendorGengoByFileIds, 'fileIds' | 'labelIds' | 'excludeLabelIds'> & {
        stringIds: number[];
    };
    type CreateTaskVendorGengoByBranchIds = Omit<CreateTaskVendorGengoByFileIds, 'fileIds'> & {
        branchIds: number[];
    };
    interface CreateTaskVendorManualByFileIds {
        title: string;
        languageId: string;
        type: TypeVendor;
        vendor: 'alconost' | 'babbleon' | 'tomedes' | 'e2f' | 'write_path_admin' | 'inlingo' | 'acclaro' | 'translate_by_humans' | 'lingo24' | 'assertio_language_services' | 'gte_localize' | 'kettu_solutions' | 'languageline_solutions';
        fileIds: number[];
        labelIds?: number[];
        excludeLabelIds?: number[];
        status?: RequestStatus;
        description?: string;
        skipAssignedStrings?: boolean;
        includePreTranslatedStringsOnly?: boolean;
        assignees?: CreateTaskAssignee[];
        deadline?: string;
        startedAt?: string;
        dateFrom?: string;
        dateTo?: string;
    }
    type CreateTaskVendorManualByStringIds = Omit<CreateTaskVendorManualByFileIds, 'fileIds' | 'labelIds' | 'excludeLabelIds'> & {
        stringIds: number[];
    };
    type CreateTaskVendorManualByBranchIds = Omit<CreateTaskVendorManualByFileIds, 'fileIds'> & {
        branchIds: number[];
    };
    interface CreateTaskPendingTask {
        precedingTaskId: number;
        type: Type.PROOFREAD;
        title: string;
        description?: string;
        assignees?: CreateTaskAssignee[];
        deadline?: string;
    }
    interface CreateTaskPendingTaskLanguageService {
        precedingTaskId: number;
        type: TypeVendor.PROOFREAD_BY_VENDOR;
        vendor: 'crowdin_language_service';
        title: string;
        description?: string;
        deadline?: string;
    }
    interface CreateTaskPendingTaskVendorManual {
        precedingTaskId: number;
        type: TypeVendor.PROOFREAD_BY_VENDOR;
        vendor: CreateTaskVendorManualByFileIds['vendor'];
        title: string;
        description?: string;
        deadline?: string;
    }
    interface CreateTaskAssignee {
        id: number;
        wordsCount?: number;
    }
    type Status = 'todo' | 'in_progress' | 'done' | 'closed';
    type RequestStatus = Extract<Status, 'todo' | 'in_progress'>;
    enum Type {
        TRANSLATE = 0,
        PROOFREAD = 1
    }
    enum TypeVendor {
        TRANSLATE_BY_VENDOR = 2,
        PROOFREAD_BY_VENDOR = 3
    }
    interface Assignee {
        id: number;
        username: string;
        fullName: string;
        avatarUrl: string;
        wordsCount: number;
        wordsLeft: number;
    }
    interface AssignedTeam {
        id: number;
        wordsCount: number;
    }
    interface Progress {
        total: number;
        done: number;
        percent: number;
    }
    type Expertise = 'standard' | 'mobile-applications' | 'software-it' | 'gaming-video-games' | 'technical-engineering' | 'marketing-consumer-media' | 'business-finance' | 'legal-certificate' | 'medical' | 'ad-words-banners' | 'automotive-aerospace' | 'scientific' | 'scientific-academic' | 'tourism' | 'training-employee-handbooks' | 'forex-crypto';
    enum TranslatedExpertise {
        ECONOMY = "P",
        PROFESSIONAL = "T",
        PREMIUM = "R"
    }
    type Tone = '' | 'Informal' | 'Friendly' | 'Business' | 'Formal' | 'other';
    type Purpose = 'standard' | 'Personal use' | 'Business' | 'Online content' | 'App/Web localization' | 'Media content' | 'Semi-technical' | 'other';
    type Subject = 'general' | 'accounting_finance' | 'aerospace_defence' | 'architecture' | 'art' | 'automotive' | 'certificates_diplomas_licences_cv_etc' | 'chemical' | 'civil_engineering_construction' | 'corporate_social_responsibility' | 'cosmetics' | 'culinary' | 'electronics_electrical_engineering' | 'energy_power_generation_oil_gas' | 'environment' | 'fashion' | 'games_viseogames_casino' | 'general_business_commerce' | 'history_archaeology' | 'information_technology' | 'insurance' | 'internet_e-commerce' | 'legal_documents_contracts' | 'literary_translations' | 'marketing_advertising_material_public_relations' | 'matematics_and_physics' | 'mechanical_manufacturing' | 'media_journalism_publishing' | 'medical_pharmaceutical' | 'music' | 'private_correspondence_letters' | 'religion' | 'science' | 'shipping_sailing_maritime' | 'social_science' | 'telecommunications' | 'travel_tourism';
    interface ListTasksOptions extends PaginationOptions {
        status?: TasksModel.Status;
        assigneeId?: number;
        orderBy?: string;
    }
    interface TaskSettingsTemplate {
        id: number;
        name: string;
        config: TaskSettingsTemplateConfig;
        createdAt: string;
        updatedAt: string;
    }
    interface AddTaskSettingsTemplate {
        name: string;
        config: TaskSettingsTemplateConfig;
    }
    interface TaskSettingsTemplateConfig {
        languages: {
            languageId?: string;
            userIds?: number[];
            teamIds?: number[];
        }[];
    }
    interface TaskComment {
        id: number;
        userId: number;
        taskId: number;
        text: string;
        timeSpent: number;
        createdAt: string;
        updatedAt: string;
    }
    interface CreateTaskCommentRequest {
        text?: string;
        timeSpent?: number;
    }
}
```

##### teams/index.d.ts

```typescript
import { CrowdinApi, Pagination, PaginationOptions, PatchRequest, ProjectRole, ProjectRoles, ResponseList, ResponseObject } from '../core';
import { ProjectsGroupsModel } from '../projectsGroups';
export declare class Teams extends CrowdinApi {
    listGroupTeams(groupId: number, options?: TeamsModel.ListGroupTeamsOptions): Promise<ResponseList<TeamsModel.TeamGroup>>;
    updateGroupTeams(groupId: number, request: PatchRequest[]): Promise<ResponseList<TeamsModel.TeamGroup>>;
    getGroupTeam(groupId: number, teamId: number): Promise<ResponseObject<TeamsModel.TeamGroup>>;
    listTeamProjectPermissions(teamId: number, options?: PaginationOptions): Promise<ResponseList<TeamsModel.ProjectPermissions>>;
    editTeamProjectPermissions(teamId: number, request: PatchRequest[]): Promise<ResponseList<TeamsModel.ProjectPermissions>>;
    addTeamToProject(projectId: number, request: TeamsModel.AddTeamToProjectRequest): Promise<TeamsModel.ProjectTeamResources>;
    listTeams(options?: TeamsModel.ListTeamsOptions): Promise<ResponseList<TeamsModel.Team>>;
    listTeams(limit?: number, offset?: number): Promise<ResponseList<TeamsModel.Team>>;
    addTeam(request: TeamsModel.AddTeamRequest): Promise<ResponseObject<TeamsModel.Team>>;
    getTeam(teamId: number): Promise<ResponseObject<TeamsModel.Team>>;
    deleteTeam(teamId: number): Promise<void>;
    editTeam(teamId: number, request: PatchRequest[]): Promise<ResponseObject<TeamsModel.Team>>;
    teamMembersList(teamId: number, options?: PaginationOptions): Promise<ResponseList<TeamsModel.TeamMember>>;
    teamMembersList(teamId: number, limit?: number, offset?: number): Promise<ResponseList<TeamsModel.TeamMember>>;
    addTeamMembers(teamId: number, request: TeamsModel.AddTeamMembersRequest): Promise<TeamsModel.AddTeamMembersResponse>;
    deleteAllTeamMembers(teamId: number): Promise<void>;
    deleteTeamMember(teamId: number, memberId: number): Promise<void>;
}
export declare namespace TeamsModel {
    interface ListGroupTeamsOptions extends PaginationOptions {
        orderBy?: string;
    }
    interface ProjectPermissions {
        id: number;
        roles: ProjectRole[];
        project: ProjectsGroupsModel.Project | ProjectsGroupsModel.ProjectSettings;
    }
    interface AddTeamToProjectRequest {
        teamId: number;
        managerAccess?: boolean;
        developerAccess?: boolean;
        roles?: ProjectRole[];
        accessToAllWorkflowSteps?: boolean;
        permissions?: Permissions;
    }
    interface ListTeamsOptions extends PaginationOptions {
        search?: string;
        projectIds?: string;
        projectRoles?: ProjectRoles[];
        languageIds?: string;
        groupIds?: string;
        orderBy?: string;
    }
    interface ProjectTeamResources {
        skipped: ProjectTeamResource;
        added: ProjectTeamResource;
    }
    interface ProjectTeamResource {
        id: number;
        hasManagerAccess: boolean;
        hasDeveloperAccess: boolean;
        hasAccessToAllWorkflowSteps: boolean;
        permissions: Permissions;
        roles: ProjectRole[];
    }
    interface Permissions {
        [lang: string]: {
            workflowStepIds: number[] | 'all';
        };
    }
    interface Team {
        id: number;
        name: string;
        totalMembers: number;
        webUrl: string;
        createdAt: string;
        updatedAt: string;
    }
    interface TeamGroup {
        id: number;
        team: Team;
    }
    interface AddTeamRequest {
        name: string;
    }
    interface TeamMember {
        id: number;
        username: string;
        firstName: string;
        lastName: string;
        avatarUrl: string;
        addedAt: string;
    }
    interface AddTeamMembersRequest {
        userIds: number[];
    }
    interface AddTeamMembersResponse {
        skipped: ResponseObject<TeamMember>[];
        added: ResponseObject<TeamMember>[];
        pagination: Pagination;
    }
}
```

##### translationMemory/index.d.ts

```typescript
import { CrowdinApi, DownloadLink, PaginationOptions, PatchRequest, ResponseList, ResponseObject, Status } from '../core';
export declare class TranslationMemory extends CrowdinApi {
    listTm(options?: TranslationMemoryModel.ListTMsOptions): Promise<ResponseList<TranslationMemoryModel.TranslationMemory>>;
    listTm(groupId?: number, limit?: number, offset?: number): Promise<ResponseList<TranslationMemoryModel.TranslationMemory>>;
    addTm(request: TranslationMemoryModel.AddTranslationMemoryRequest): Promise<ResponseObject<TranslationMemoryModel.TranslationMemory>>;
    getTm(tmId: number): Promise<ResponseObject<TranslationMemoryModel.TranslationMemory>>;
    deleteTm(tmId: number): Promise<void>;
    editTm(tmId: number, request: PatchRequest[]): Promise<ResponseObject<TranslationMemoryModel.TranslationMemory>>;
    listTmSegments(tmId: number, options?: TranslationMemoryModel.ListSegmentsOptions): Promise<ResponseList<TranslationMemoryModel.TMSegment>>;
    addTmSegment(tmId: number, request: TranslationMemoryModel.AddTMSegment): Promise<ResponseObject<TranslationMemoryModel.TMSegment>>;
    clearTm(tmId: number): Promise<void>;
    exportTm(tmId: number, request?: TranslationMemoryModel.ExportTranslationMemoryRequest): Promise<ResponseObject<Status<TranslationMemoryModel.ExportTranslationMemoryAttribute>>>;
    checkExportStatus(tmId: number, exportId: string): Promise<ResponseObject<Status<TranslationMemoryModel.ExportTranslationMemoryAttribute>>>;
    downloadTm(tmId: number, exportId: string): Promise<ResponseObject<DownloadLink>>;
    concordanceSearch(projectId: number, request: TranslationMemoryModel.ConcordanceSearchRequest): Promise<ResponseList<TranslationMemoryModel.ConcordanceSearchResponse>>;
    importTm(tmId: number, request: TranslationMemoryModel.ImportTranslationMemoryRequest): Promise<ResponseObject<Status<TranslationMemoryModel.ImportTranslationMemoryAttribute>>>;
    checkImportStatus(tmId: number, importId: string): Promise<ResponseObject<Status<TranslationMemoryModel.ImportTranslationMemoryAttribute>>>;
    getTmSegment(tmId: number, segmentId: number): Promise<ResponseObject<TranslationMemoryModel.TMSegment>>;
    deleteTmSegment(tmId: number, segmentId: number): Promise<void>;
    editTmSegment(tmId: number, segmentId: number, request: PatchRequest[]): Promise<ResponseObject<TranslationMemoryModel.TMSegment>>;
    deleteTmSegmentRecord(tmId: number, segmentId: number, recordId: number): Promise<void>;
    editTmSegmentRecord(tmId: number, segmentId: number, recordId: number, request: PatchRequest[]): Promise<ResponseObject<TranslationMemoryModel.TMSegment>>;
    addTmSegmentRecords(tmId: number, segmentId: number, request: TranslationMemoryModel.AddTMSegment): Promise<ResponseObject<TranslationMemoryModel.TMSegment>>;
}
export declare namespace TranslationMemoryModel {
    interface TranslationMemory {
        id: number;
        groupId: number;
        userId: number;
        name: string;
        languageId: string;
        languageIds: string[];
        segmentsCount: number;
        defaultProjectIds: number[];
        projectIds: number[];
        createdAt: string;
        webUrl: string;
    }
    interface AddTranslationMemoryRequest {
        name: string;
        languageId: string;
        groupId?: number;
    }
    interface ConcordanceSearchRequest {
        sourceLanguageId: string;
        targetLanguageId: string;
        autoSubstitution: boolean;
        minRelevant: number;
        expressions: string[];
        expression?: string;
    }
    interface ConcordanceSearchResponse {
        tm: TranslationMemory;
        recordId: number;
        source: string;
        target: string;
        relevant: number;
        substituted: string;
        updatedAt: string;
    }
    interface ExportTranslationMemoryRequest {
        sourceLanguageId?: number;
        targetLanguageId?: number;
        format?: Format;
    }
    interface ImportTranslationMemoryRequest {
        storageId: number;
        firstLineContainsHeader?: boolean;
        scheme?: Scheme;
    }
    interface ExportTranslationMemoryAttribute {
        sourceLanguageId: string;
        targetLanguageId: string;
        format: string;
    }
    interface ImportTranslationMemoryAttribute {
        tmId: number;
        storageId: number;
        firstLineContainsHeader: number;
        scheme: Scheme;
    }
    type Format = 'tmx' | 'csv' | 'xlsx';
    interface Scheme {
        [key: string]: number;
    }
    interface ListTMsOptions extends PaginationOptions {
        groupId?: number;
        userId?: number;
        orderBy?: string;
    }
    interface ListSegmentsOptions extends PaginationOptions {
        croql?: string;
        orderBy?: string;
    }
    interface TMSegment {
        id: number;
        records: TMSegmentRecord[];
    }
    interface TMSegmentRecord {
        id: number;
        languageId: string;
        text: string;
        usageCount: number;
        createdBy: number;
        updatedBy: number;
        createdAt: string;
        updatedAt: string;
    }
    interface AddTMSegment {
        records: AddTMSegmentRecord[];
    }
    interface AddTMSegmentRecord {
        languageId: string;
        text: string;
    }
}
```

##### translationStatus/index.d.ts

```typescript
import { CrowdinApi, PaginationOptions, ResponseList } from '../core';
import { LanguagesModel } from '../languages';
export declare class TranslationStatus extends CrowdinApi {
    getBranchProgress(projectId: number, branchId: number, options?: PaginationOptions): Promise<ResponseList<TranslationStatusModel.LanguageProgress>>;
    getBranchProgress(projectId: number, branchId: number, limit?: number, offset?: number): Promise<ResponseList<TranslationStatusModel.LanguageProgress>>;
    getDirectoryProgress(projectId: number, directoryId: number, options?: PaginationOptions): Promise<ResponseList<TranslationStatusModel.LanguageProgress>>;
    getDirectoryProgress(projectId: number, directoryId: number, limit?: number, offset?: number): Promise<ResponseList<TranslationStatusModel.LanguageProgress>>;
    getFileProgress(projectId: number, fileId: number, options?: PaginationOptions): Promise<ResponseList<TranslationStatusModel.LanguageProgress>>;
    getFileProgress(projectId: number, fileId: number, limit?: number, offset?: number): Promise<ResponseList<TranslationStatusModel.LanguageProgress>>;
    getLanguageProgress(projectId: number, languageId: string, options?: PaginationOptions): Promise<ResponseList<TranslationStatusModel.FileProgress>>;
    getLanguageProgress(projectId: number, languageId: string, limit?: number, offset?: number): Promise<ResponseList<TranslationStatusModel.FileProgress>>;
    getProjectProgress(projectId: number, options?: PaginationOptions): Promise<ResponseList<TranslationStatusModel.LanguageProgress>>;
    getProjectProgress(projectId: number, limit?: number, offset?: number, languageIds?: string): Promise<ResponseList<TranslationStatusModel.LanguageProgress>>;
    listQaCheckIssues(projectId: number, options?: TranslationStatusModel.ListQaCheckIssuesOptions): Promise<ResponseList<TranslationStatusModel.QaCheck>>;
    listQaCheckIssues(projectId: number, limit?: number, offset?: number, category?: TranslationStatusModel.Category, validation?: TranslationStatusModel.Validation, languageIds?: string): Promise<ResponseList<TranslationStatusModel.QaCheck>>;
}
export declare namespace TranslationStatusModel {
    interface LanguageProgress {
        words: Words;
        phrases: Words;
        translationProgress: number;
        approvalProgress: number;
        eTag: string;
        languageId: string;
        language: LanguagesModel.Language;
    }
    interface FileProgress {
        words: Words;
        phrases: Words;
        translationProgress: number;
        approvalProgress: number;
        branchId: number;
        fileId: number;
        eTag: string;
    }
    interface Words {
        total: number;
        translated: number;
        approved: number;
        preTranslateAppliedTo: number;
    }
    type Category = 'empty' | 'variables' | 'tags' | 'punctuation' | 'symbol_register' | 'spaces' | 'size' | 'special_symbols' | 'wrong_translation' | 'spellcheck' | 'icu';
    type Validation = 'empty_string_check' | 'empty_suggestion_check' | 'max_length_check' | 'tags_check' | 'mismatch_ids_check' | 'cdata_check' | 'specials_symbols_check' | 'leading_newlines_check' | 'trailing_newlines_check' | 'leading_spaces_check' | 'trailing_spaces_check' | 'multiple_spaces_check' | 'custom_blocked_variables_check' | 'highest_priority_custom_variables_check' | 'highest_priority_variables_check' | 'c_variables_check' | 'python_variables_check' | 'rails_variables_check' | 'java_variables_check' | 'dot_net_variables_check' | 'twig_variables_check' | 'php_variables_check' | 'freemarker_variables_check' | 'lowest_priority_variable_check' | 'lowest_priority_custom_variables_check' | 'punctuation_check' | 'spaces_before_punctuation_check' | 'spaces_after_punctuation_check' | 'non_breaking_spaces_check' | 'capitalize_check' | 'multiple_uppercase_check' | 'parentheses_check' | 'entities_check' | 'escaped_quotes_check' | 'wrong_translation_issue_check' | 'spellcheck' | 'icu_check';
    interface ListQaCheckIssuesOptions extends PaginationOptions {
        category?: Category | Category[];
        validation?: Validation | Validation[];
        languageIds?: string;
    }
    interface QaCheck {
        stringId: number;
        languageId: string;
        category: Category;
        categoryDescription: string;
        validation: Validation;
        validationDescription: string;
        pluralId: number;
        text: string;
    }
    interface GetProjectProgressOptions extends PaginationOptions {
        languageIds?: string;
    }
}
```

##### translations/index.d.ts

```typescript
import { CrowdinApi, DownloadLink, PaginationOptions, PatchRequest, ResponseList, ResponseObject, Status } from '../core';
import { ProjectsGroupsModel } from '../projectsGroups';
export declare class Translations extends CrowdinApi {
    listPreTranslations(projectId: number, options?: PaginationOptions): Promise<ResponseList<Status<TranslationsModel.PreTranslationStatusAttributes>>>;
    preTranslationStatus(projectId: number, preTranslationId: string): Promise<ResponseObject<Status<TranslationsModel.PreTranslationStatusAttributes>>>;
    applyPreTranslation(projectId: number, request: TranslationsModel.PreTranslateRequest | TranslationsModel.PreTranslateStringsRequest): Promise<ResponseObject<Status<TranslationsModel.PreTranslationStatusAttributes>>>;
    editPreTranslation(projectId: number, preTranslationId: string, request: PatchRequest[]): Promise<ResponseObject<Status<TranslationsModel.PreTranslationStatusAttributes>>>;
    getPreTranslationReport(projectId: number, preTranslationId: string): Promise<ResponseObject<TranslationsModel.PreTranslationReport>>;
    buildProjectDirectoryTranslation(projectId: number, directoryId: number, request?: TranslationsModel.BuildProjectDirectoryTranslationRequest): Promise<ResponseObject<TranslationsModel.BuildProjectDirectoryTranslationResponse>>;
    buildProjectFileTranslation(projectId: number, fileId: number, request: TranslationsModel.BuildProjectFileTranslationRequest, eTag?: string): Promise<ResponseObject<TranslationsModel.BuildProjectFileTranslationResponse>>;
    listProjectBuilds(projectId: number, options?: TranslationsModel.ListProjectBuildsOptions): Promise<ResponseList<TranslationsModel.Build>>;
    listProjectBuilds(projectId: number, branchId?: number, limit?: number, offset?: number): Promise<ResponseList<TranslationsModel.Build>>;
    buildProject(projectId: number, request?: TranslationsModel.BuildRequest | TranslationsModel.PseudoBuildRequest): Promise<ResponseObject<TranslationsModel.Build>>;
    uploadTranslation(projectId: number, languageId: string, request: TranslationsModel.UploadTranslationRequest): Promise<ResponseObject<TranslationsModel.UploadTranslationResponse>>;
    uploadTranslationStrings(projectId: number, languageId: string, request: TranslationsModel.UploadTranslationStringsRequest): Promise<ResponseObject<TranslationsModel.UploadTranslationStringsResponse>>;
    downloadTranslations(projectId: number, buildId: number): Promise<ResponseObject<DownloadLink>>;
    checkBuildStatus(projectId: number, buildId: number): Promise<ResponseObject<TranslationsModel.Build>>;
    cancelBuild(projectId: number, buildId: number): Promise<void>;
    exportProjectTranslation(projectId: number, request: TranslationsModel.ExportProjectTranslationRequest): Promise<ResponseObject<DownloadLink>>;
}
export declare namespace TranslationsModel {
    interface PreTranslateRequest {
        languageIds: string[];
        fileIds: number[];
        method?: Method;
        engineId?: number;
        aiPromptId?: number;
        autoApproveOption?: AutoApproveOption;
        duplicateTranslations?: boolean;
        skipApprovedTranslations?: boolean;
        translateUntranslatedOnly?: boolean;
        translateWithPerfectMatchOnly?: boolean;
        fallbackLanguages?: {
            languageId?: string[];
        };
        labelIds?: number[];
        excludeLabelIds?: number[];
    }
    interface PreTranslateStringsRequest {
        languageIds: string[];
        branchIds?: number[];
        method?: Method;
        engineId?: number;
        aiPromptId?: number;
        autoApproveOption?: AutoApproveOption;
        duplicateTranslations?: boolean;
        skipApprovedTranslations?: boolean;
        translateUntranslatedOnly?: boolean;
        translateWithPerfectMatchOnly?: boolean;
        fallbackLanguages?: {
            languageId: string[];
        };
        labelIds?: number[];
        excludeLabelIds?: number[];
    }
    interface BuildProjectDirectoryTranslationRequest {
        targetLanguageIds?: string[];
        skipUntranslatedStrings?: boolean;
        skipUntranslatedFiles?: boolean;
        preserveFolderHierarchy?: boolean;
        exportStringsThatPassedWorkflow?: boolean;
        exportWithMinApprovalsCount?: number;
        exportApprovedOnly?: boolean;
    }
    interface BuildProjectDirectoryTranslationResponse {
        id: number;
        projectId: number;
        status: BuildStatus;
        progress: number;
        createdAt: string;
        updatedAt: string;
        finishedAt: string;
    }
    type BuildStatus = 'created' | 'inProgress' | 'canceled' | 'failed' | 'finished';
    interface BuildProjectFileTranslationRequest {
        targetLanguageId: string;
        exportAsXliff?: boolean;
        skipUntranslatedStrings?: boolean;
        skipUntranslatedFiles?: boolean;
        exportApprovedOnly?: boolean;
        exportWithMinApprovalsCount?: number;
        exportStringsThatPassedWorkflow?: boolean;
    }
    interface BuildProjectFileTranslationResponse extends DownloadLink {
        etag: string;
    }
    interface PreTranslationStatusAttributes {
        languageIds: string[];
        fileIds: number[];
        branchIds: number[];
        method: Method;
        autoApproveOption: AutoApproveOption;
        duplicateTranslations: boolean;
        skipApprovedTranslations: boolean;
        translateUntranslatedOnly: boolean;
        translateWithPerfectMatchOnly: boolean;
    }
    type Method = 'tm' | 'mt' | 'ai';
    type AutoApproveOption = 'all' | 'exceptAutoSubstituted' | 'perfectMatchOnly' | 'none';
    type CharTransformation = 'asian' | 'european' | 'arabic' | 'cyrillic';
    interface Build {
        id: number;
        projectId: number;
        status: BuildStatus;
        progress: number;
        attributes: Attribute;
        createdAt: string;
        updatedAt: string;
        finishedAt: string;
    }
    interface Attribute {
        branchId: number;
        directoryId: number;
        targetLanguageIds: string[];
        skipUntranslatedStrings: boolean;
        skipUntranslatedFiles: boolean;
        exportApprovedOnly: boolean;
        exportWithMinApprovalsCount: number;
        exportStringsThatPassedWorkflow: boolean;
    }
    interface BuildRequest {
        branchId?: number;
        targetLanguageIds?: string[];
        skipUntranslatedStrings?: boolean;
        skipUntranslatedFiles?: boolean;
        exportApprovedOnly?: boolean;
        exportWithMinApprovalsCount?: number;
        exportStringsThatPassedWorkflow?: boolean;
    }
    interface PseudoBuildRequest {
        pseudo: boolean;
        branchId?: number;
        prefix?: string;
        suffix?: string;
        lengthTransformation?: number;
        charTransformation?: CharTransformation;
    }
    interface UploadTranslationRequest {
        storageId: number;
        fileId?: number;
        importEqSuggestions?: boolean;
        autoApproveImported?: boolean;
        translateHidden?: boolean;
        addToTm?: boolean;
    }
    interface UploadTranslationStringsRequest {
        storageId: number;
        branchId?: number;
        importEqSuggestions?: boolean;
        autoApproveImported?: boolean;
        translateHidden?: boolean;
        addToTm?: boolean;
    }
    interface UploadTranslationResponse {
        projectId: number;
        storageId: number;
        languageId: string;
        fileId: number;
    }
    interface UploadTranslationStringsResponse {
        projectId: number;
        storageId: number;
        languageId: string;
        branchId: number;
    }
    interface ExportProjectTranslationRequest {
        targetLanguageId: string;
        format?: string;
        labelIds?: number[];
        branchIds?: number[];
        directoryIds?: number[];
        fileIds?: number[];
        skipUntranslatedStrings?: boolean;
        skipUntranslatedFiles?: boolean;
        exportApprovedOnly?: boolean;
        exportWithMinApprovalsCount?: number;
        exportStringsThatPassedWorkflow?: boolean;
    }
    interface ListProjectBuildsOptions extends PaginationOptions {
        branchId?: number;
    }
    interface PreTranslationReport {
        languages: TargetLanguage[];
        preTranslateType: Method;
    }
    interface TargetLanguage {
        id: string;
        files: TargetLanguageFile[];
        skipped: SkippedInfo;
        skippedQaCheckCategories: ProjectsGroupsModel.CheckCategories;
    }
    interface TargetLanguageFile {
        id: string;
        statistics: TargetLanguageFileStatistics;
    }
    interface TargetLanguageFileStatistics {
        phrases: number;
        words: number;
    }
    interface SkippedInfo {
        [key: string]: any;
    }
}
```

##### uploadStorage/index.d.ts

```typescript
import { CrowdinApi, PaginationOptions, ResponseList, ResponseObject } from '../core';
export declare class UploadStorage extends CrowdinApi {
    listStorages(options?: PaginationOptions): Promise<ResponseList<UploadStorageModel.Storage>>;
    listStorages(limit?: number, offset?: number): Promise<ResponseList<UploadStorageModel.Storage>>;
    addStorage(fileName: string, request: any, contentType?: string): Promise<ResponseObject<UploadStorageModel.Storage>>;
    getStorage(storageId: number): Promise<ResponseObject<UploadStorageModel.Storage>>;
    deleteStorage(storageId: number): Promise<void>;
}
export declare namespace UploadStorageModel {
    interface Storage {
        id: number;
        fileName: string;
    }
}
```

##### users/index.d.ts

```typescript
import { CrowdinApi, Pagination, PaginationOptions, PatchRequest, ProjectRole, ProjectRoles, ResponseList, ResponseObject } from '../core';
import { ProjectsGroupsModel } from '../projectsGroups';
import { TeamsModel } from '../teams';
export declare class Users extends CrowdinApi {
    listGroupManagers(groupId: number, options?: UsersModel.ListGroupManagersOptions): Promise<ResponseList<UsersModel.GroupManager>>;
    updateGroupManagers(groupId: number, request: PatchRequest[]): Promise<ResponseList<UsersModel.GroupManager>>;
    getGroupManager(groupId: number, userId: number): Promise<ResponseObject<UsersModel.GroupManager>>;
    listProjectMembers(projectId: number, options?: UsersModel.ListProjectMembersOptions): Promise<ResponseList<UsersModel.ProjectMember | UsersModel.EnterpriseProjectMember>>;
    listProjectMembers(projectId: number, search?: string, role?: UsersModel.Role, languageId?: string, limit?: number, offset?: number): Promise<ResponseList<UsersModel.ProjectMember | UsersModel.EnterpriseProjectMember>>;
    addProjectMember(projectId: number, request: UsersModel.AddProjectMemberRequest): Promise<UsersModel.AddProjectMemberResponse>;
    getProjectMemberPermissions(projectId: number, memberId: number): Promise<ResponseObject<UsersModel.ProjectMember | UsersModel.EnterpriseProjectMember>>;
    replaceProjectMemberPermissions(projectId: number, memberId: number, request?: UsersModel.ReplaceProjectMemberRequest): Promise<ResponseObject<UsersModel.ProjectMember | UsersModel.EnterpriseProjectMember>>;
    deleteMemberFromProject(projectId: number, memberId: number): Promise<void>;
    listUsers(options?: UsersModel.ListUsersOptions): Promise<ResponseList<UsersModel.User>>;
    listUsers(status?: UsersModel.Status, search?: string, twoFactor?: UsersModel.TwoFactor, limit?: number, offset?: number): Promise<ResponseList<UsersModel.User>>;
    inviteUser(request: UsersModel.InviteUserRequest): Promise<ResponseObject<UsersModel.User>>;
    getUserInfo(userId: number): Promise<ResponseObject<UsersModel.User>>;
    deleteUser(userId: number): Promise<void>;
    editUser(userId: number, request: PatchRequest[]): Promise<ResponseObject<UsersModel.User>>;
    getAuthenticatedUser(): Promise<ResponseObject<UsersModel.User>>;
    editAuthenticatedUser(request: PatchRequest[]): Promise<ResponseObject<UsersModel.User>>;
    listUserProjectPermissions(userId: number, options?: PaginationOptions): Promise<ResponseList<UsersModel.ProjectPermissions>>;
    editUserProjectPermissions(userId: number, request: PatchRequest[]): Promise<ResponseList<UsersModel.ProjectPermissions>>;
    listUserProjectContributions(userId: number, options?: PaginationOptions): Promise<ResponseList<UsersModel.ProjectPermissions>>;
}
export declare namespace UsersModel {
    interface ListGroupManagersOptions extends PaginationOptions {
        teamIds?: number[];
        orderBy?: string;
    }
    interface ListProjectMembersOptions extends PaginationOptions {
        search?: string;
        role?: Role;
        languageId?: string;
        workflowStepId?: number;
        orderBy?: string;
    }
    interface ListUsersOptions extends PaginationOptions {
        status?: Status;
        search?: string;
        twoFactor?: TwoFactor;
        orderBy?: string;
        organizationRoles?: OrganizationRoles[];
        teamId?: number;
        projectIds?: string;
        projectRoles?: ProjectRoles[];
        languageIds?: string;
        groupIds?: string;
        lastSeenFrom?: string;
        lastSeenTo?: string;
    }
    interface InviteUserRequest {
        email: string;
        firstName?: string;
        lastName?: string;
        timezone?: string;
        adminAccess?: boolean;
    }
    interface User {
        id: number;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
        status: Status;
        avatarUrl: string;
        fields: Record<string, any>;
        createdAt: string;
        lastSeen: string;
        twoFactor: TwoFactor;
        isAdmin: boolean;
        timezone: string;
        emailVerified: string;
    }
    type Status = 'active' | 'pending' | 'blocked';
    type TwoFactor = 'enabled' | 'disabled';
    type OrganizationRoles = 'admin' | 'manager' | 'vendor' | 'client';
    interface GroupManager {
        id: number;
        user: User;
        teams: TeamsModel.Team[];
    }
    interface ProjectMember {
        id: number;
        username: string;
        fullName: string;
        role: Role;
        permissions: Permissions;
        avatarUrl: string;
        joinedAt: string;
        timezone: string;
        roles: ProjectRole[];
    }
    interface EnterpriseProjectMember {
        id: number;
        username: string;
        firstName: string;
        lastName: string;
        isManager: boolean;
        isDeveloperr: boolean;
        managerOfGroup: Group;
        accessToAllWorkflowSteps: boolean;
        permissions: Permissions;
        givenAccessAt: string;
        roles: ProjectRole[];
    }
    interface Group {
        id: number;
        name: string;
    }
    type Role = 'all' | 'owner' | 'manager' | 'proofreader' | 'translator' | 'blocked';
    type LanguageRole = 'proofreader' | 'translator' | 'denied';
    interface AddProjectMemberRequest {
        userIds?: number[];
        usernames?: string[];
        emails?: string[];
        managerAccess?: boolean;
        roles?: ProjectRole[];
        developerAccess?: boolean;
        accessToAllWorkflowSteps?: boolean;
        permissions?: Permissions;
    }
    interface AddProjectMemberResponse {
        skipped: ResponseObject<ProjectMember | EnterpriseProjectMember>[];
        added: ResponseObject<ProjectMember | EnterpriseProjectMember>[];
        pagination: Pagination;
    }
    interface ReplaceProjectMemberRequest {
        managerAccess?: boolean;
        developerAccess?: boolean;
        roles?: ProjectRole[];
        accessToAllWorkflowSteps?: boolean;
        permissions?: Permissions;
    }
    interface ProjectPermissions {
        id: number;
        roles: ProjectRole[];
        project: ProjectsGroupsModel.Project | ProjectsGroupsModel.ProjectSettings;
        teams: TeamsModel.Team[];
    }
    interface Contributions {
        id: number;
        translated: Contribution;
        approved: Contribution;
        voted: Contribution;
        commented: Contribution;
        project: ProjectsGroupsModel.Project | ProjectsGroupsModel.ProjectSettings;
    }
    interface Contribution {
        strings: number;
        words?: number;
    }
    interface Permissions {
        [lang: string]: string | {
            workflowStepIds: number[] | 'all';
        };
    }
}
```

##### vendors/index.d.ts

```typescript
import { CrowdinApi, PaginationOptions, ResponseList } from '../core';
export declare class Vendors extends CrowdinApi {
    listVendors(options?: PaginationOptions): Promise<ResponseList<VendorsModel.Vendor>>;
    listVendors(limit?: number, offset?: number): Promise<ResponseList<VendorsModel.Vendor>>;
}
export declare namespace VendorsModel {
    interface Vendor {
        id: number;
        name: string;
        description: string;
        status: 'pending' | 'confirmed' | 'rejected';
        webUrl: string;
    }
}
```

##### webhooks/index.d.ts

```typescript
import { CrowdinApi, PaginationOptions, PatchRequest, ResponseList, ResponseObject } from '../core';
export declare class Webhooks extends CrowdinApi {
    listWebhooks(projectId: number, options?: PaginationOptions): Promise<ResponseList<WebhooksModel.Webhook>>;
    listWebhooks(projectId: number, limit?: number, offset?: number): Promise<ResponseList<WebhooksModel.Webhook>>;
    addWebhook(projectId: number, request: WebhooksModel.AddWebhookRequest): Promise<ResponseObject<WebhooksModel.Webhook>>;
    getWebhook(projectId: number, webhookId: number): Promise<ResponseObject<WebhooksModel.Webhook>>;
    deleteWebhook(projectId: number, webhookId: number): Promise<void>;
    editWebhook(projectId: number, webhookId: number, request: PatchRequest[]): Promise<ResponseObject<WebhooksModel.Webhook>>;
}
export declare namespace WebhooksModel {
    interface Webhook {
        id: number;
        projectId: number;
        name: string;
        url: string;
        events: Event[];
        headers: Record<string, string>;
        payload: Record<string, any>;
        isActive: boolean;
        batchingEnabled: boolean;
        requestType: RequestType;
        contentType: ContentType;
        createdAt: string;
        updatedAt: string;
    }
    interface AddWebhookRequest {
        name: string;
        url: string;
        events: Event[];
        requestType: RequestType;
        isActive?: boolean;
        batchingEnabled?: boolean;
        contentType?: ContentType;
        headers?: Record<string, string>;
        payload?: Record<string, any>;
    }
    type ContentType = 'multipart/form-data' | 'application/json' | 'application/x-www-form-urlencoded';
    type Event = 'file.added' | 'file.updated' | 'file.reverted' | 'file.deleted' | 'file.translated' | 'file.approved' | 'project.translated' | 'project.approved' | 'project.built' | 'translation.updated' | 'string.added' | 'string.updated' | 'string.deleted' | 'stringComment.created' | 'stringComment.updated' | 'stringComment.deleted' | 'stringComment.restored' | 'suggestion.added' | 'suggestion.updated' | 'suggestion.deleted' | 'suggestion.approved' | 'suggestion.disapproved' | 'task.added' | 'task.statusChanged' | 'task.deleted';
    type RequestType = 'POST' | 'GET';
}
```

##### workflows/index.d.ts

```typescript
import { CrowdinApi, PaginationOptions, PatchRequest, ResponseList, ResponseObject } from '../core';
import { SourceStringsModel } from '../sourceStrings';
export declare class Workflows extends CrowdinApi {
    listWorkflowSteps(projectId: number, options?: PaginationOptions): Promise<ResponseList<WorkflowModel.WorkflowStep>>;
    listWorkflowSteps(projectId: number, limit?: number, offset?: number): Promise<ResponseList<WorkflowModel.WorkflowStep>>;
    getWorkflowStep(projectId: number, stepId: number): Promise<ResponseObject<WorkflowModel.WorkflowStep>>;
    listStringsOnTheWorkflowStep(projectId: number, stepId: number, options?: WorkflowModel.ListStringsOntheWorkflowStepOptions): Promise<ResponseList<SourceStringsModel.String>>;
    listWorkflowTemplates(options?: WorkflowModel.ListWorkflowTemplatesOptions): Promise<ResponseList<WorkflowModel.Workflow>>;
    listWorkflowTemplates(groupId?: number, limit?: number, offset?: number): Promise<ResponseList<WorkflowModel.Workflow>>;
    getWorkflowTemplateInfo(templateId: number): Promise<ResponseObject<WorkflowModel.Workflow>>;
    updateWorkflowStepStringStatus(projectId: number, stepId: number, languageId: string, request: PatchRequest[]): Promise<ResponseList<WorkflowModel.WorkflowStepStringStatus>>;
    getWorkflowStepStringStatus(projectId: number, stepId: number, languageId: string, options?: PaginationOptions): Promise<ResponseList<WorkflowModel.WorkflowStepStringStatus>>;
}
export declare namespace WorkflowModel {
    interface WorkflowStep {
        id: number;
        title: string;
        type: string;
        languages: string[];
        config: {
            assignees: {
                [language: string]: number[];
            };
        };
    }
    interface ListWorkflowTemplatesOptions extends PaginationOptions {
        groupId?: number;
    }
    interface ListStringsOntheWorkflowStepOptions extends PaginationOptions {
        languageIds?: string;
        orderBy?: string;
        status?: 'todo' | 'done' | 'pending' | 'incomplete' | 'need_review';
    }
    interface Workflow {
        id: number;
        title: string;
        description: string;
        groupId: number;
        isDefault: boolean;
        webUrl: string;
        steps: {
            id: number;
            languages: string[];
            assignees: number[];
            vendorId: number;
            config: {
                minRelevant: number;
                autoSubstitution: boolean;
            };
            mtId: number;
        }[];
    }
    interface WorkflowStepStringStatus {
        stringId: number;
        languageId: string;
        stepId: number;
        status: string;
        output: string;
    }
}
```

<!-- CROWDIN_API_CLIENT_TYPES_END -->

### App Metadata Storage

#### Overview

App Metadata Storage is a built-in key-value storage system provided by the Crowdin Apps SDK. It allows your app to persist data across sessions without needing external databases or storage services.

**Available Methods:**
- `crowdinApp.saveMetadata(key, data, crowdinId)` - Save or update metadata (recommended)
- `crowdinApp.getMetadata(key)` - Retrieve metadata
- `crowdinApp.deleteMetadata(key)` - Delete metadata

**Alternative approach:**
- `crowdinModule.metadataStore.saveMetadata(key, data, crowdinId)`
- `crowdinModule.metadataStore.getMetadata(key)`
- `crowdinModule.metadataStore.deleteMetadata(key)`

#### Official Documentation

**📚 Complete Documentation:** Refer to Crowdin Apps SDK documentation for metadata storage

**⚠️ CRITICAL**: Metadata is stored at the organization level. Always include `organizationId` in your keys to properly scope data.

#### Common Examples

**Save Metadata:**
```typescript
app.post('/api/save-data', async (req: Request, res: Response) => {
    try {
        const jwt = req.query.jwt as string;
        const { data } = req.body;

        if (!jwt) {
            return res.status(400).json({ success: false, error: 'JWT token is required' });
        }
        
        if (!crowdinApp.establishCrowdinConnection) {
            return res.status(500).json({ success: false, error: 'Crowdin connection method not available' });
        }

        const connection = await crowdinApp.establishCrowdinConnection(jwt, undefined);

        if (!connection.client) {
            return res.status(500).json({ success: false, error: 'Crowdin API client not available' });
        }

        const userId = connection.context.jwtPayload.context.user_id;
        const organizationId = connection.context.jwtPayload.context.organization_id;
        
        // Create a namespaced key
        const key = `org_${organizationId}_user_${userId}_preferences`;
        
        // Save data to metadata storage
        await crowdinApp.saveMetadata(key, data, connection.context.crowdinId);
        res.json({ success: true });
    } catch (error) {
        console.error('Save error:', error);
        res.status(500).json({ success: false, error: 'Failed to save data' });
    }
});
```

**Get Metadata:**
```typescript
app.get('/api/get-data', async (req: Request, res: Response) => {
    try {
        const jwt = req.query.jwt as string;
        
        if (!jwt) {
            return res.status(400).json({ success: false, error: 'JWT token is required' });
        }
        
        if (!crowdinApp.establishCrowdinConnection) {
            return res.status(500).json({ success: false, error: 'Crowdin connection method not available' });
        }

        const connection = await crowdinApp.establishCrowdinConnection(jwt, undefined);

        if (!connection.client) {
            return res.status(500).json({ success: false, error: 'Crowdin API client not available' });
        }

        const userId = connection.context.jwtPayload.context.user_id;
        const organizationId = connection.context.jwtPayload.context.organization_id;
        
        const key = `org_${organizationId}_user_${userId}_preferences`;
        
        // Retrieve data from metadata storage
        const data = await crowdinApp.getMetadata(key);
            
        // Handle case when no data exists
        if (!data) {
            return res.json({ 
                success: true, 
                data: null
            });
        }
        
        res.json({ success: true, data });
    } catch (error) {
        console.error('Get error:', error);
        res.status(500).json({ success: false, error: 'Failed to retrieve data' });
    }
});
```

**Delete Metadata:**
```typescript
app.delete('/api/delete-data', async (req: Request, res: Response) => {
    try {
        const jwt = req.query.jwt as string;
        
        if (!jwt) {
            return res.status(400).json({ success: false, error: 'JWT token is required' });
        }
        
        if (!crowdinApp.establishCrowdinConnection) {
            return res.status(500).json({ success: false, error: 'Crowdin connection method not available' });
        }

        const connection = await crowdinApp.establishCrowdinConnection(jwt, undefined);

        if (!connection.client) {
            return res.status(500).json({ success: false, error: 'Crowdin API client not available' });
        }

        const userId = connection.context.jwtPayload.context.user_id;
        const organizationId = connection.context.jwtPayload.context.organization_id;
        
        const key = `org_${organizationId}_user_${userId}_preferences`;
        
        // Delete data from metadata storage
        await crowdinApp.deleteMetadata(key);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete data' });
    }
});
```

**Get All Metadata:**
```typescript
app.get('/api/all-metadata', async (req: Request, res: Response) => {
    try {
        const jwt = req.query.jwt as string;
        
        if (!jwt) {
            return res.status(400).json({ success: false, error: 'JWT token is required' });
        }
        
        if (!crowdinApp.establishCrowdinConnection) {
            return res.status(500).json({ success: false, error: 'Crowdin connection method not available' });
        }

        const connection = await crowdinApp.establishCrowdinConnection(jwt, undefined);

        if (!connection.client) {
            return res.status(500).json({ success: false, error: 'Crowdin API client not available' });
        }

        // Retrieve all metadata records from storage
        const allMetadata = await crowdinApp.storage.getAllMetadata();
        
        // allMetadata structure:
        // [
        //   {
        //     id: "org_123_user_456_preferences",  // key
        //     data: "{"theme":"dark","lang":"en"}", // JSON stringified value
        //     crowdin_id: "domain"     // crowdin identifier (from connection.context.crowdinId during save)
        //   },
        //   ...
        // ]
        
        // Parse and format data
        const formattedData = allMetadata.map(record => ({
            key: record.id,
            value: JSON.parse(record.data || '{}'),
            crowdinId: record.crowdin_id
        }));
        
        res.json({ 
            success: true, 
            data: { 
                metadata: formattedData, 
                count: formattedData.length 
            }
        });
    } catch (error) {
        console.error('Error retrieving all metadata:', error);
        res.status(500).json({ success: false, error: 'Failed to retrieve metadata' });
    }
});
```

**Store Complex Objects:**
```typescript
// Save complex user preferences
const preferences = {
    theme: 'dark',
    language: 'en',
    notifications: {
        email: true,
        push: false,
        digest: 'weekly'
    },
    lastUpdated: new Date().toISOString(),
    settings: {
        autoSave: true,
        confirmActions: true
    }
};

const key = `org_${organizationId}_user_${userId}_preferences`;
await crowdinApp.saveMetadata(key, preferences, connection.context.crowdinId);

// Retrieve and update
const currentPrefs = await crowdinApp.getMetadata(key) || {};
const updatedPrefs = {
    ...currentPrefs,
    theme: 'light',
    lastUpdated: new Date().toISOString()
};
await crowdinApp.saveMetadata(key, updatedPrefs, connection.context.crowdinId);
```

#### Best Practices

1. **Always use namespaced keys**
   ```typescript
   // ✅ CORRECT - includes organization and entity identifiers
   const key = `org_${organizationId}_user_${userId}_preferences`;
   const key = `org_${organizationId}_project_${projectId}_cache`;
   
   // ❌ WRONG - no organization scope, may cause conflicts
   const key = `user_preferences`;
   const key = `${userId}_data`;
   ```

2. **Handle missing data gracefully**
   ```typescript
   // ✅ CORRECT - provide defaults for missing data
   const data = await crowdinApp.getMetadata(key) || { 
       theme: 'auto', 
       language: 'en' 
   };
   
   // ✅ CORRECT - check for null/undefined
   const data = await crowdinApp.getMetadata(key);
   if (!data) {
       return defaultSettings;
   }
   
   // ❌ WRONG - may cause errors if data is null
   const theme = data.theme; // Error if data is null
   ```

3. **Always use the correct identifier for the third parameter**
   ```typescript
   // ✅ CORRECT - when connection object is available
   await crowdinApp.saveMetadata(key, data, connection.context.crowdinId);
   
   // ✅ CORRECT - when using webhookContext (no connection object, crowdinApp not available)
   await crowdinModule.metadataStore.saveMetadata(key, data, `${webhookContext.domain || webhookContext.organizationId}`);
   
   // ❌ WRONG - don't use organizationId directly
   await crowdinApp.saveMetadata(key, data, String(organizationId));
   ```

4. **Use descriptive key patterns**
   ```typescript
   // ✅ CORRECT - clear, hierarchical structure
   `org_${orgId}_user_${userId}_preferences`
   `org_${orgId}_project_${projectId}_settings`
   `org_${orgId}_cache_${cacheType}_${identifier}`
   
   // ❌ WRONG - unclear, hard to maintain
   `data_${id}`
   `temp_storage`
   ```

5. **Handle errors properly**
   ```typescript
   // ✅ CORRECT - comprehensive error handling
   try {
       await crowdinApp.saveMetadata(key, data, connection.context.crowdinId);
       return { success: true };
   } catch (error: any) {
       console.error('Metadata save failed:', error);
       return { 
           success: false, 
           error: 'Failed to save data'
       };
   }
   ```

7. **Store only JSON-serializable data**
   ```typescript
   // ✅ CORRECT - simple JSON-serializable objects
   const data = {
       name: 'John',
       age: 30,
       preferences: ['option1', 'option2'],
       metadata: { key: 'value' }
   };
   
   // ❌ WRONG - functions, dates, circular references
   const data = {
       name: 'John',
       callback: () => {},           // Functions don't serialize
       created: new Date(),           // Dates become strings
       circular: data                 // Circular reference
   };
   
   // ✅ CORRECT - convert dates to ISO strings
   const data = {
       name: 'John',
       created: new Date().toISOString()
   };
   ```

8. **NEVER use KVStore for configurations - use metadata storage instead**
   ```typescript
   // ✅ CORRECT - use metadata storage for ALL configuration storage
   const config = {
       apiKey: userApiKey,
       apiEndpoint: 'https://api.example.com',
       languageMapping: { 'en': 'en-US' }
   };
   await crowdinApp.saveMetadata(
       `config_org_${organizationId}`, 
       config, 
       connection.context.crowdinId
   );
   
   // ✅ CORRECT - read configuration from metadata storage
   const config = await crowdinApp.getMetadata(`config_org_${organizationId}`) || {};
   
   // ❌ WRONG - using KVStore for configuration storage
   const config = {
       apiKey: userApiKey,
       apiEndpoint: 'https://api.example.com',
       languageMapping: { 'en': 'en-US' }
   };
   await env.KVStore.put(
       `config_org_${organizationId}`, 
       JSON.stringify(config)
   );
   
   // ❌ WRONG - reading configuration from KVStore
   const configData = await env.KVStore.get(`config_org_${organizationId}`);
   const config = JSON.parse(configData || '{}');
   ```

9. **Use crowdinApp.saveMetadata or crowdinModule.metadataStore.saveMetadata - both implement upsert**
   ```typescript
   // ✅ CORRECT - implements upsert (insert or update)
   await crowdinApp.saveMetadata(
       key, 
       data, 
       connection.context.crowdinId
   );
   
   // ✅ CORRECT - also implements upsert (insert or update)
   await crowdinModule.metadataStore.saveMetadata(
       key, 
       data, 
       connection.context.crowdinId
   );
   
   // ❌ WRONG - only insert, NOT upsert (will fail if key already exists)
   await crowdinApp.storage.saveMetadata(
       key, 
       data, 
       connection.context.crowdinId
   );
   ```

### Cron Scheduling

#### Overview

Cron Scheduling allows your app to execute background tasks at specified time intervals.

#### Official Documentation

**📚 Complete Documentation:** Refer to Crowdin Apps SDK documentation for cron scheduling

**⚠️ CRITICAL**: Only specific cron intervals are supported. Using unsupported intervals will result in an error.

#### Supported Intervals

The following cron expressions are supported:

| Cron Expression | Description | Frequency |
|----------------|-------------|-----------|
| `0 * * * *` | Every hour | Runs at minute 0 of every hour |
| `0 */3 * * *` | Every 3 hours | Runs at minute 0 every 3 hours |
| `0 */6 * * *` | Every 6 hours | Runs at minute 0 every 6 hours |
| `0 */12 * * *` | Every 12 hours | Runs at minute 0 every 12 hours |
| `0 0 * * *` | Daily | Runs at midnight (00:00) every day |
| `0 0 * * SUN` | Weekly | Runs at midnight (00:00) every Sunday |
| `0 0 1 * *` | Monthly | Runs at midnight (00:00) on the 1st of each month |

#### Common Examples

**Simple Hourly Task:**
```typescript
// In worker/app.ts, after initializing crowdinApp
const crowdinApp = crowdinModule.addCrowdinEndpoints(app, configuration) as CrowdinAppUtilities;

// Register cron job - runs every hour
crowdinApp.cron.schedule('0 * * * *', async () => {
    try {
        console.log('Hourly task started at', new Date().toISOString());
        
        // Perform your scheduled task
        // Example: Check status, update cache, etc.
        
        console.log('Task completed');
    } catch (error) {
        console.error('Cron job error:', error);
    }
});
```

**Multiple Tasks for Same Schedule:**
```typescript
// In worker/app.ts, after initializing crowdinApp
const crowdinApp = crowdinModule.addCrowdinEndpoints(app, configuration) as CrowdinAppUtilities;

// Both tasks will run daily at midnight
crowdinApp.cron.schedule('0 0 * * *', async () => {
    try {
        console.log('Daily cleanup started');
        // Cleanup old data
    } catch (error) {
        console.error('Cleanup error:', error);
    }
});

crowdinApp.cron.schedule('0 0 * * *', async () => {
    try {
        console.log('Daily report started');
        // Generate reports
    } catch (error) {
        console.error('Report error:', error);
    }
});
```

**Using Crowdin API Client in Cron Jobs:**
```typescript
// In worker/app.ts, after initializing crowdinApp
const crowdinApp = crowdinModule.addCrowdinEndpoints(app, configuration) as CrowdinAppUtilities;

// Register cron job that processes data for multiple organizations
crowdinApp.cron.schedule('0 0 * * *', async () => {
    try {
        console.log('Daily sync started');
        
        // Get all metadata records
        const allMetadata = await crowdinApp.storage.getAllMetadata();
        
        if (!allMetadata || allMetadata.length === 0) {
            console.log('No metadata found, skipping sync');
            return;
        }
        
        // Filter metadata by pattern using regex (e.g., find all organization configs)
        const configPattern = /^org_(\d+)_config$/;
        const orgConfigs = allMetadata.filter(record => 
            configPattern.test(record.id)
        );
        
        console.log(`Found ${orgConfigs.length} organization configs to process`);
        
        // Process each organization separately
        for (const configRecord of orgConfigs) {
            try {
                const match = configRecord.id.match(configPattern);
                const organizationId = match?.[1];
                const crowdinId = configRecord.crowdin_id; // domain or organizationId
                const configData = JSON.parse(configRecord.data || '{}');
                
                console.log(`Processing organization ${organizationId}`);
                
                // Create individual Crowdin API client for this organization
                const encryptedData = crowdinApp.encryptCrowdinConnection({
                    crowdinId,
                    extra: {}, // Always pass empty object
                });
                
                const { client } = await crowdinApp.dencryptCrowdinConnection(encryptedData, true);
                
                // Use client to make API calls for this specific organization
                const projects = await client.projectsGroupsApi.withFetchAll().listProjects();
                console.log(`Organization ${organizationId}: Found ${projects.data.length} projects`);
                
                // Process organization-specific configuration
                if (configData.autoSync) {
                    console.log(`Organization ${organizationId}: Auto-sync enabled, processing...`);
                    // Perform sync operations
                }
                
            } catch (error) {
                console.error(`Error processing organization ${organizationId}:`, error);
                // Continue with next organization
            }
        }
        
        console.log('Daily sync completed');
    } catch (error) {
        console.error('Cron job error:', error);
    }
});
```

#### Best Practices

1. **Use appropriate intervals for your task**
   ```typescript
   // ✅ CORRECT - frequent checks for time-sensitive tasks
   crowdinApp.cron.schedule('0 * * * *', async () => {
       // Hourly notification checks
   });
   
   // ✅ CORRECT - less frequent for resource-intensive tasks
   crowdinApp.cron.schedule('0 0 * * *', async () => {
       // Daily cleanup or report generation
   });
   
   // ❌ WRONG - using unsupported interval
   crowdinApp.cron.schedule('*/5 * * * *', async () => {
       // Every 5 minutes - NOT SUPPORTED
   });
   ```

2. **Handle errors gracefully**
   ```typescript
   // ✅ CORRECT - catch and log errors
   crowdinApp.cron.schedule('0 * * * *', async () => {
       try {
           await performTask();
       } catch (error) {
           console.error('Cron job failed:', error);
           // Log error but don't throw - let job complete
       }
   });
   
   // ❌ WRONG - unhandled errors
   crowdinApp.cron.schedule('0 * * * *', async () => {
       await performTask(); // May crash if it throws
   });
   ```

3. **Keep cron jobs lightweight**
   ```typescript
   // ✅ CORRECT - efficient processing
   crowdinApp.cron.schedule('0 0 * * *', async () => {
       const startTime = Date.now();
       console.log('Task started');
       
       // Perform lightweight operations
       await quickCleanup();
       
       console.log(`Completed in ${Date.now() - startTime}ms`);
   });
   
   // ❌ WRONG - heavy processing that may timeout
   crowdinApp.cron.schedule('0 * * * *', async () => {
       // Processing millions of records - may timeout
       const allData = await fetchAllData();
       await processAll(allData);
   });
   ```

4. **Always await async operations**
   ```typescript
   // ✅ CORRECT - await all async operations
   crowdinApp.cron.schedule('0 * * * *', async () => {
       await saveData();
       await processQueue();
       console.log('All tasks completed');
   });
   
   // ✅ CORRECT - setTimeout with proper promise wrapper
   crowdinApp.cron.schedule('0 * * * *', async () => {
       await new Promise((resolve) => {
           setTimeout(async () => {
               await processData();
               resolve();
           }, 1000);
       });
   });
   
   // ❌ WRONG - promise without await (will not complete)
   crowdinApp.cron.schedule('0 * * * *', async () => {
       saveData(); // This will NOT complete before cron job ends
       console.log('Done'); // Logs immediately, but saveData is not finished
   });
   
   // ❌ WRONG - setTimeout without proper promise wrapper
   crowdinApp.cron.schedule('0 * * * *', async () => {
       setTimeout(async () => {
           await processData(); // This will NOT execute
       }, 1000);
   });
   ```

5. **Log execution for debugging**
   ```typescript
   // ✅ CORRECT - comprehensive logging
   crowdinApp.cron.schedule('0 */6 * * *', async () => {
       const startTime = Date.now();
       console.log(`Cron job started at ${new Date().toISOString()}`);
       
       try {
           await performTask();
           console.log(`Completed in ${Date.now() - startTime}ms`);
       } catch (error) {
           console.error(`Failed after ${Date.now() - startTime}ms:`, error);
       }
   });
   ```

### Webhooks

#### Overview

Webhooks allow your app to subscribe to events that occur in Crowdin projects or organizations. When a subscribed event happens, Crowdin automatically sends the event data to your app's callback function.

#### Official Documentation

**📚 Complete Documentation:** [Crowdin Webhooks](https://crowdin.github.io/app-project-module/tools/webhook/)

**📚 Available Events:** [Webhook Events List](https://support.crowdin.com/developer/webhooks/)

**⚠️ CRITICAL**: Only use event names from the official events list. Invalid event names will be ignored.

#### Configuration

Configure webhooks in your app configuration in `worker/app.ts`:

```typescript
const configuration: ClientConfig = {
    // ... other configuration ...
    
    // Webhook subscriptions
    webhooks: [
        {
            // List of events to subscribe to
            events: ['file.added', 'file.updated', 'file.deleted'],
            
            // Callback function that handles events
            callback({ client, events, webhookContext }) {
                console.log('Received events:', events);
                console.log('Organization:', webhookContext.organizationId);
                console.log('User:', webhookContext.userId);
                
                // Process events here
                events.forEach(event => {
                    console.log('Event:', event.event, 'Project:', event.file.project.id);
                });
            },
            
            deferResponse: true
        },
        {
            // You can have multiple webhook subscriptions
            events: ['suggestion.updated', 'string.added'],
            callback({ client, events, webhookContext }) {
                // Handle translation events
            },
            
            deferResponse: true
        }
    ]
};
```

#### Common Examples

**File Events:**
```typescript
webhooks: [
    {
        events: ['file.added', 'file.updated', 'file.deleted', 'file.reverted'],
        async callback({ client, events, webhookContext }) {
            for (const event of events) {
                console.log(`File ${event.event} in project ${event.file.project.id}`);
                console.log('File details:', event.file);
                
                // Example: Get project details when file is added
                if (event.event === 'file.added') {
                    const project = await client.projectsGroupsApi.getProject(event.file.project.id);
                    console.log('Project name:', project.data.name);
                }
            }
        },
        deferResponse: true
    }
]
```

#### Callback Parameters

The callback function receives an object with three properties:

```typescript
interface WebhookCallback {
    /**
     * Crowdin API client - use to make API calls
     * Same client as connection.client in endpoints
     */
    client: CrowdinApi;
    
    /**
     * Array of webhook event objects
     * Multiple events may be batched together
     */
    events: WebhookEvent[];
    
    /**
     * Context information about the webhook
     */
    webhookContext: {
        /** Crowdin domain (e.g., "crowdin.com") */
        domain: string;
        
        /** Organization ID where event occurred */
        organizationId: number;
        
        /** User ID who installed the application */
        userId: number;
        
        /** Agent ID (if authenticationType is "crowdin_agent") */
        agentId?: number;
    };
}
```

#### Common Event Types

**Project Events:**
- `project.created` - New project added
- `project.deleted` - Project deleted
- `project.translated` - Project fully translated
- `project.approved` - Project reviewed
- `project.built` - Project built

**Group Events:**
- `group.created` - New group added
- `group.deleted` - Group deleted

**File Events:**
- `file.added` - New file added to project
- `file.updated` - File updated
- `file.deleted` - File deleted from project
- `file.reverted` - File reverted to previous version
- `file.translated` - File fully translated
- `file.approved` - File reviewed

**String Events:**
- `string.added` - New source string added
- `string.updated` - Source string updated
- `string.deleted` - Source string deleted

**Translation Events:**
- `suggestion.added` - String translation added
- `suggestion.updated` - String translation updated
- `suggestion.deleted` - String translation deleted
- `suggestion.approved` - String translation approved
- `suggestion.disapproved` - String translation disapproved

**Comment Events:**
- `stringComment.created` - String comment added
- `stringComment.updated` - String comment updated
- `stringComment.deleted` - String comment deleted
- `stringComment.restored` - String comment restored

**Task Events:**
- `task.added` - New task added
- `task.statusChanged` - Task status changed
- `task.updated` - Task updated
- `task.deleted` - Task deleted

#### Best Practices

1. **Always set deferResponse to true**
   ```typescript
   // ✅ CORRECT - deferResponse is set to true
   webhooks: [
       {
           events: ['file.added'],
           callback({ client, events, webhookContext }) {
               console.log('Processing events');
           },
           deferResponse: true  // REQUIRED!
       }
   ]
   
   // ❌ WRONG - missing deferResponse
   webhooks: [
       {
           events: ['file.added'],
           callback({ client, events, webhookContext }) {
               console.log('Processing events');
           }
           // Missing deferResponse: true - this will cause issues!
       }
   ]
   ```

2. **Handle multiple events in batch**
   ```typescript
   // ✅ CORRECT - process all events
   callback({ client, events, webhookContext }) {
       events.forEach(event => {
           console.log('Processing event:', event.event);
       });
   }
   
   // ❌ WRONG - only processes first event
   callback({ client, events, webhookContext }) {
       const event = events[0];
       console.log('Processing event:', event.event);
   }
   ```

3. **Handle errors gracefully**
   ```typescript
   // ✅ CORRECT - catches and logs errors
   async callback({ client, events, webhookContext }) {
       for (const event of events) {
           try {
               await processEvent(event);
           } catch (error) {
               console.error('Failed to process event:', event.event, error);
               // Continue processing other events
           }
       }
   }
   ```

4. **Check event type before processing**
   ```typescript
   // ✅ CORRECT - checks event type
   callback({ client, events, webhookContext }) {
       events.forEach(event => {
           if (event.event === 'file.added') {
               console.log('New file:', event.file?.name);
           } else if (event.event === 'file.updated') {
               console.log('Updated file:', event.file?.name);
           }
       });
   }
   ```

5. **Use webhookContext for scoping**
   ```typescript
   // ✅ CORRECT - uses context for organization-specific logic
   async callback({ client, events, webhookContext }) {
       const orgId = webhookContext.organizationId;
       const userId = webhookContext.userId;
       
       // Store event in metadata
       const key = `org_${orgId}_events_${Date.now()}`;
       // await crowdinModule.metadataStore.saveMetadata(key, events, `${webhookContext.domain || webhookContext.organizationId}`);
   }
   ```

6. **Don't perform long-running operations**
   ```typescript
   // ✅ CORRECT - quick processing, delegate heavy work
   async callback({ client, events, webhookContext }) {
       // Quick logging
       console.log('Received', events.length, 'events');
       
       // Store for later processing
       const key = `org_${webhookContext.organizationId}_queue`;
       // await crowdinModule.metadataStore.saveMetadata(key, events, `${webhookContext.domain || webhookContext.organizationId}`);
   }
   
   // ⚠️ PROBLEMATIC - long-running operation blocks webhook
   async callback({ client, events, webhookContext }) {
       // This might timeout
       for (const event of events) {
           await processLargeFile(event.file?.id);
           await sendMultipleNotifications(event);
           await updateExternalDatabase(event);
       }
   }
   ```

#### Event Object Structure

Each event type has its own interface with specific fields. Use these interfaces to understand which data is available for each event:

```typescript
// ============================================================================
// SHARED MODELS - Reusable data structures
// ============================================================================

interface ProjectModel {
    id: number;
    name: string;
    identifier: string;
    sourceLanguageId: string;
    targetLanguageIds: string[];
}

interface UserModel {
    id: number;
    username: string;
}

interface LanguageModel {
    id: string;
    name: string;
}

interface FileModelBase {
    id: number;
    name: string;
    title: string;
    type: string;
    path: string;
    branchId: number | null;
    directoryId: number | null;
}

interface FileModel extends FileModelBase {
    project: ProjectModel;
}

interface GroupModel {
    id: number;
    name: string;
    parentId: number | null;
}

interface StringModelBase {
    id: number;
    identifier: string;
    text: string;
    context: string | null;
    isHidden: boolean;
}

interface StringModel extends StringModelBase {
    file: FileModelBase;
    project: ProjectModel;
}

interface TranslationModelBase {
    id: number;
    text: string;
}

interface TranslationModel extends TranslationModelBase {
    user: UserModel;
    targetLanguage: LanguageModel;
    string: StringModel;
}

interface TaskModel {
    id: number;
    type: 0 | 1; // 0 - Translate, 1 - Proofread
    title: string;
    status: 'todo' | 'in_progress' | 'done' | 'closed' | 'pending' | 'review';
    sourceLanguage: LanguageModel;
    targetLanguage: LanguageModel;
    project: ProjectModel;
    taskCreator: UserModel;
}

interface CommentModelBase {
    id: number;
    text: string;
    type: 'issue' | 'comment';
    issueType: 'general_question' | 'translation_mistake' |  'context_request' |  'source_mistake';
    issueStatus: 'resolved' | 'unresolved';
}

interface CommentModel extends CommentModelBase {
    string: StringModel;
    targetLanguage: LanguageModel;
    user: UserModel;
    commentResolver: UserModel | null;
}

interface BuildModel {
    id: number;
    downloadUrl: string;
    project: ProjectModel;
}

// ============================================================================
// BASE EVENT INTERFACES
// ============================================================================

interface BaseEventWithUser {
    user: UserModel;
}

interface BaseProjectEvent {
    project: ProjectModel;
}

interface BaseGroupEvent {
    group: GroupModel;
}

interface BaseFileEvent {
    file: FileModel;
}

interface BaseStringEvent {
    string: StringModel;
}

interface BaseTranslationEvent {
    translation: TranslationModel;
}

interface BaseTaskEvent {
    task: TaskModel;
}

interface BaseCommentEvent {
    comment: CommentModel;
}

// ============================================================================
// PROJECT EVENTS
// ============================================================================

interface ProjectCreatedEvent extends BaseProjectEvent, BaseEventWithUser {
    event: 'project.created';
}

interface ProjectDeletedEvent extends BaseProjectEvent, BaseEventWithUser {
    event: 'project.deleted';
}

interface ProjectTranslatedEvent extends BaseProjectEvent {
    event: 'project.translated';
    targetLanguage: LanguageModel;
}

interface ProjectApprovedEvent extends BaseProjectEvent {
    event: 'project.approved';
    targetLanguage: LanguageModel;
}

interface ProjectBuiltEvent {
    event: 'project.built';
    build: BuildModel;
}

// ============================================================================
// GROUP EVENTS
// ============================================================================

interface GroupCreatedEvent extends BaseGroupEvent, BaseEventWithUser {
    event: 'group.created';
}

interface GroupDeletedEvent extends BaseGroupEvent, BaseEventWithUser {
    event: 'group.deleted';
}

// ============================================================================
// FILE EVENTS
// ============================================================================

interface FileAddedEvent extends BaseFileEvent, BaseEventWithUser {
    event: 'file.added';
}

interface FileUpdatedEvent extends BaseFileEvent, BaseEventWithUser {
    event: 'file.updated';
}

interface FileDeletedEvent extends BaseFileEvent, BaseEventWithUser {
    event: 'file.deleted';
}

interface FileRevertedEvent extends BaseFileEvent, BaseEventWithUser {
    event: 'file.reverted';
}

interface FileTranslatedEvent extends BaseFileEvent {
    event: 'file.translated';
    targetLanguage: LanguageModel;
}

interface FileApprovedEvent extends BaseFileEvent {
    event: 'file.approved';
    targetLanguage: LanguageModel;
}

// ============================================================================
// STRING EVENTS
// ============================================================================

interface StringAddedEvent extends BaseStringEvent, BaseEventWithUser {
    event: 'string.added';
}

interface StringUpdatedEvent extends BaseStringEvent, BaseEventWithUser {
    event: 'string.updated';
}

interface StringDeletedEvent extends BaseStringEvent, BaseEventWithUser {
    event: 'string.deleted';
}

// ============================================================================
// TRANSLATION/SUGGESTION EVENTS
// ============================================================================

interface SuggestionAddedEvent extends BaseTranslationEvent {
    event: 'suggestion.added';
}

interface SuggestionUpdatedEvent extends BaseTranslationEvent {
    event: 'suggestion.updated';
}

interface SuggestionDeletedEvent extends BaseTranslationEvent {
    event: 'suggestion.deleted';
}

interface SuggestionApprovedEvent extends BaseTranslationEvent {
    event: 'suggestion.approved';
}

interface SuggestionDisapprovedEvent extends BaseTranslationEvent {
    event: 'suggestion.disapproved';
}

interface TranslationUpdatedEvent {
    event: 'translation.updated';
    newTranslation: TranslationModel;
}

// ============================================================================
// COMMENT EVENTS
// ============================================================================

interface StringCommentCreatedEvent extends BaseCommentEvent {
    event: 'stringComment.created';
}

interface StringCommentUpdatedEvent extends BaseCommentEvent {
    event: 'stringComment.updated';
}

interface StringCommentDeletedEvent extends BaseCommentEvent {
    event: 'stringComment.deleted';
}

interface StringCommentRestoredEvent extends BaseCommentEvent {
    event: 'stringComment.restored';
}

// ============================================================================
// TASK EVENTS
// ============================================================================

interface TaskAddedEvent extends BaseTaskEvent {
    event: 'task.added';
}

interface TaskStatusChangedEvent extends BaseTaskEvent {
    event: 'task.statusChanged';
}

interface TaskUpdatedEvent extends BaseTaskEvent {
    event: 'task.updated';
}

interface TaskDeletedEvent extends BaseTaskEvent {
    event: 'task.deleted';
}

// ============================================================================
// UNION TYPE - All possible webhook events
// ============================================================================

type WebhookEvent = 
    // Project events
    | ProjectCreatedEvent
    | ProjectDeletedEvent
    | ProjectTranslatedEvent
    | ProjectApprovedEvent
    | ProjectBuiltEvent
    // Group events
    | GroupCreatedEvent
    | GroupDeletedEvent
    // File events
    | FileAddedEvent
    | FileUpdatedEvent
    | FileDeletedEvent
    | FileRevertedEvent
    | FileTranslatedEvent
    | FileApprovedEvent
    // String events
    | StringAddedEvent
    | StringUpdatedEvent
    | StringDeletedEvent
    // Translation/Suggestion events
    | SuggestionAddedEvent
    | SuggestionUpdatedEvent
    | SuggestionDeletedEvent
    | SuggestionApprovedEvent
    | SuggestionDisapprovedEvent
    | TranslationUpdatedEvent
    // Comment events
    | StringCommentCreatedEvent
    | StringCommentUpdatedEvent
    | StringCommentDeletedEvent
    | StringCommentRestoredEvent
    // Task events
    | TaskAddedEvent
    | TaskStatusChangedEvent
    | TaskUpdatedEvent
    | TaskDeletedEvent;
```

## Frontend Development

### Crowdin Apps JS API

#### Official Documentation

The `AP` object provides the Crowdin Apps JS API for interacting with the Crowdin application context.

**📚 Complete API Reference:** https://support.crowdin.com/developer/crowdin-apps-js/

**⚠️ CRITICAL**: Only use methods and types from the Crowdin Apps JS API definitions below.

**Do NOT invent methods or properties that are not listed here.**

#### Common Examples

**Get Context (Promise-based):**
```typescript
// Promisified helper
const getContext = (): Promise<any> => {
    return new Promise(resolve => window.AP.getContext(resolve));
};

// Usage
const context = await getContext();
console.log('Project ID:', context.project_id);
```

**Get JWT Token (Promise-based):**
```typescript
// Promisified helper
const getJwtToken = (): Promise<string> => {
    return new Promise(resolve => window.AP.getJwtToken(resolve));
};

// Usage with fetch
const token = await getJwtToken();
const response = await fetch(`/api/endpoint?jwt=${token}`);
const data = await response.json();
```

#### Best Practices

1. **Handle errors gracefully**
   ```typescript
   try {
       const context = await getContext();
       if (!context.organization_id) {
           throw new Error('Organization ID not found');
       }
       // Your code
   } catch (error) {
       console.error('Failed to get context:', error);
   }
   ```

#### Complete Type Definitions

##### Global AP Object Structure

```typescript
declare namespace AP {
    // Global Actions
    function getContext(callback: (context: Context) => void): void;
    function getJwtToken(callback: (token: string) => void): void;
    function getTheme(): 'light' | 'dark';
    function redirect(path: string): void;
}
```

##### Type Definitions

```typescript
// Context Information
interface Context {
    project_id: number;
    organization_id: number;
}
```

### Routing

#### Overview

The app uses React Router with `createHashRouter` for client-side navigation. Routes are configured in `src/main.tsx` with error boundaries for each route.

**⚠️ CRITICAL**: Do NOT switch to `BrowserRouter`, `HashRouter`, or `MemoryRouter`. The `createHashRouter` is required for proper error boundary functionality with `useRouteError()`.

#### Configuration

Routes are defined in `src/main.tsx`:

```tsx
import {
  createHashRouter,
  RouterProvider,
} from "react-router-dom";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { HomePage } from '@/pages/HomePage';

const router = createHashRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
)
```

#### Common Examples

**Adding a New Route:**
```tsx
import { SettingsPage } from '@/pages/SettingsPage';

const router = createHashRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
    errorElement: <RouteErrorBoundary />,
  },
]);
```

**Navigation Between Pages:**
```tsx
import { Link } from 'react-router-dom';

// In your component
<Link to="/settings">Go to Settings</Link>
```

#### Best Practices

1. **Always use createHashRouter**
   ```tsx
   // ✅ CORRECT - uses createHashRouter
   import { createHashRouter, RouterProvider } from "react-router-dom";
   
   const router = createHashRouter([
     { path: "/", element: <HomePage />, errorElement: <RouteErrorBoundary /> }
   ]);
   
   <RouterProvider router={router} />
   
   // ❌ WRONG - BrowserRouter breaks RouteErrorBoundary
   import { BrowserRouter, Routes, Route } from "react-router-dom";
   
   <BrowserRouter>
     <Routes>
       <Route path="/" element={<HomePage />} />
     </Routes>
   </BrowserRouter>
   ```

2. **Always include errorElement for each route**
   ```tsx
   // ✅ CORRECT - has errorElement
   {
     path: "/settings",
     element: <SettingsPage />,
     errorElement: <RouteErrorBoundary />,
   }
   
   // ❌ WRONG - missing errorElement
   {
     path: "/settings",
     element: <SettingsPage />,
   }
   ```

3. **Use Link component for navigation, not anchor tags**
   ```tsx
   // ✅ CORRECT - uses Link component
   import { Link } from 'react-router-dom';
   <Link to="/settings">Settings</Link>
   
   // ❌ WRONG - causes full page reload
   <a href="/settings">Settings</a>
   ```

4. **Don't use useRouteError outside of error boundaries**
   ```tsx
   // ✅ CORRECT - useRouteError only in RouteErrorBoundary
   // RouteErrorBoundary.tsx handles this automatically
   
   // ❌ WRONG - useRouteError in regular components
   function MyPage() {
       const error = useRouteError(); // This will fail!
       return <div>Page</div>;
   }
   ```

5. **Create new page components in src/pages/**
   ```tsx
   // ✅ CORRECT - page in src/pages/
   // src/pages/SettingsPage.tsx
   export function SettingsPage() {
       return <div>Settings</div>;
   }
   
   // ❌ WRONG - page in wrong location
   // src/components/SettingsPage.tsx
   ```

### UI Components

#### Overview

All UI components are pre-built ShadCN components located in `src/components/ui/`. These components are styled with Tailwind CSS and designed for accessibility.

**⚠️ CRITICAL**: Do NOT rewrite or modify ShadCN components in `src/components/ui/`. Use them as-is and customize via Tailwind classes.

#### Available Components

The following ShadCN components are available:

| Component | Import | Description |
|-----------|--------|-------------|
| `accordion` | `@/components/ui/accordion` | Expandable/collapsible sections |
| `alert` | `@/components/ui/alert` | Alert messages |
| `alert-dialog` | `@/components/ui/alert-dialog` | Confirmation dialogs |
| `avatar` | `@/components/ui/avatar` | User avatars |
| `badge` | `@/components/ui/badge` | Status badges |
| `breadcrumb` | `@/components/ui/breadcrumb` | Navigation breadcrumbs |
| `button` | `@/components/ui/button` | Buttons with variants |
| `calendar` | `@/components/ui/calendar` | Date picker calendar |
| `card` | `@/components/ui/card` | Content cards |
| `carousel` | `@/components/ui/carousel` | Image/content carousel |
| `chart` | `@/components/ui/chart` | Chart components |
| `checkbox` | `@/components/ui/checkbox` | Checkbox inputs |
| `collapsible` | `@/components/ui/collapsible` | Collapsible sections |
| `command` | `@/components/ui/command` | Command palette |
| `context-menu` | `@/components/ui/context-menu` | Right-click menus |
| `dialog` | `@/components/ui/dialog` | Modal dialogs |
| `drawer` | `@/components/ui/drawer` | Side drawer panels |
| `dropdown-menu` | `@/components/ui/dropdown-menu` | Dropdown menus |
| `form` | `@/components/ui/form` | Form components with validation |
| `hover-card` | `@/components/ui/hover-card` | Hover tooltips with content |
| `input` | `@/components/ui/input` | Text inputs |
| `input-otp` | `@/components/ui/input-otp` | OTP code inputs |
| `label` | `@/components/ui/label` | Form labels |
| `menubar` | `@/components/ui/menubar` | Menu bars |
| `navigation-menu` | `@/components/ui/navigation-menu` | Navigation menus |
| `pagination` | `@/components/ui/pagination` | Pagination controls |
| `popover` | `@/components/ui/popover` | Popover panels |
| `progress` | `@/components/ui/progress` | Progress bars |
| `radio-group` | `@/components/ui/radio-group` | Radio button groups |
| `resizable` | `@/components/ui/resizable` | Resizable panels |
| `scroll-area` | `@/components/ui/scroll-area` | Custom scrollbars |
| `select` | `@/components/ui/select` | Select dropdowns |
| `separator` | `@/components/ui/separator` | Visual separators |
| `sheet` | `@/components/ui/sheet` | Slide-out panels |
| `sidebar` | `@/components/ui/sidebar` | Sidebar navigation |
| `skeleton` | `@/components/ui/skeleton` | Loading skeletons |
| `slider` | `@/components/ui/slider` | Range sliders |
| `sonner` | `@/components/ui/sonner` | Toast notifications |
| `switch` | `@/components/ui/switch` | Toggle switches |
| `table` | `@/components/ui/table` | Data tables |
| `tabs` | `@/components/ui/tabs` | Tab panels |
| `textarea` | `@/components/ui/textarea` | Multi-line text inputs |
| `toggle` | `@/components/ui/toggle` | Toggle buttons |
| `toggle-group` | `@/components/ui/toggle-group` | Toggle button groups |
| `tooltip` | `@/components/ui/tooltip` | Hover tooltips |

#### Common Examples

**Button with Variants:**
```tsx
import { Button } from "@/components/ui/button";

// Default button
<Button>Click me</Button>

// Button variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Button sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><IconComponent /></Button>

// Disabled state
<Button disabled>Disabled</Button>
```

#### Best Practices

1. **Import components from the correct path**
   ```tsx
   // ✅ CORRECT - import from @/components/ui/
   import { Button } from "@/components/ui/button";
   import { Card, CardContent } from "@/components/ui/card";
   
   // ❌ WRONG - incorrect import path
   import { Button } from "shadcn/ui";
   import { Button } from "@radix-ui/react-button";
   ```

2. **Do NOT modify ShadCN component files**
   ```tsx
   // ✅ CORRECT - customize via className prop
   <Button className="bg-blue-500 hover:bg-blue-600">
       Custom styled button
   </Button>
   
   // ❌ WRONG - modifying src/components/ui/button.tsx directly
   ```

3. **Use existing components instead of writing custom ones**
   ```tsx
   // ✅ CORRECT - use existing Dialog component
   import { Dialog, DialogContent } from "@/components/ui/dialog";
   
   // ❌ WRONG - writing custom modal from scratch
   function CustomModal({ children }) {
       return <div className="fixed inset-0 bg-black/50">...</div>;
   }
   ```

4. **Combine with Tailwind for layout and spacing**
   ```tsx
   // ✅ CORRECT - ShadCN for components, Tailwind for layout
   <div className="flex flex-col gap-4 p-6">
       <Card>
           <CardContent className="pt-6">
               <Button className="w-full">Full width button</Button>
           </CardContent>
       </Card>
   </div>
   ```

5. **Use Lucide icons with components**
   ```tsx
   // ✅ CORRECT - import icons from lucide-react
   import { Loader2, Check, X } from "lucide-react";
   
   <Button>
       <Check className="mr-2 h-4 w-4" />
       Confirm
   </Button>
   
   // ❌ WRONG - using other icon libraries
   import { FaCheck } from "react-icons/fa";
   ```

6. **Use toast for notifications instead of custom alerts**
   ```tsx
   // ✅ CORRECT - use toast from sonner
   import { toast } from "sonner";
   
   const handleSave = async () => {
       try {
           await saveData();
           toast.success("Saved successfully");
       } catch (error) {
           toast.error("Failed to save");
       }
   };
   
   // ❌ WRONG - custom alert implementation
   const [showAlert, setShowAlert] = useState(false);
   ```

## Development Workflow

### 1. Configure Your App Identity

**⚠️ Important**: You MUST update the configuration in `worker/app.ts` before deployment:

```typescript
const configuration: ClientConfig = {
    name: "Your App Name",           // Change this to your app's display name
    identifier: "your-app-id",       // Change to unique identifier (lowercase, hyphens)
    description: "Your app description", // Change to describe your app's purpose
    // ... rest of configuration
}
```

**Note**: The `identifier` must be unique across all Crowdin apps. Use format like: `company-project-tools`

### 2. Key Files to Modify

- `worker/app.ts` - Add new API endpoints here
- `public/logo.svg` - Generate custom SVG logo representing app purpose
- `src/pages/HomePage.tsx` - Main page component (customize for your app logic)
- `src/index.css` - Customize global styles and Tailwind theme
- `tailwind.config.js` - Add custom colors and extend theme
