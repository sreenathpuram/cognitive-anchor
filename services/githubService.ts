/**
 * GitHub Integration Service
 * Handles backing up memories and conversation history to GitHub
 * Uses Replit's GitHub connector for OAuth authentication
 */

export const GitHubService = {
  /**
   * Get fresh GitHub client (never cache - tokens expire)
   * This would be called from a backend endpoint in production
   */
  getClientCode: `
    import { Octokit } from '@octokit/rest'
    
    let connectionSettings: any;
    
    async function getAccessToken() {
      if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
        return connectionSettings.settings.access_token;
      }
      
      const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
      const xReplitToken = process.env.REPL_IDENTITY 
        ? 'repl ' + process.env.REPL_IDENTITY 
        : process.env.WEB_REPL_RENEWAL 
        ? 'depl ' + process.env.WEB_REPL_RENEWAL 
        : null;

      if (!xReplitToken) {
        throw new Error('X_REPLIT_TOKEN not found for repl/depl');
      }

      connectionSettings = await fetch(
        'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
        {
          headers: {
            'Accept': 'application/json',
            'X_REPLIT_TOKEN': xReplitToken
          }
        }
      ).then(res => res.json()).then(data => data.items?.[0]);

      const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

      if (!connectionSettings || !accessToken) {
        throw new Error('GitHub not connected');
      }
      return accessToken;
    }

    export async function getUncachableGitHubClient() {
      const accessToken = await getAccessToken();
      return new Octokit({ auth: accessToken });
    }
  `,

  /**
   * Backend endpoint template for exporting memories to GitHub
   * Add this to your backend server to enable GitHub backup
   */
  backendEndpointTemplate: `
    // POST /api/github/backup-memories
    // Headers: Authorization: Bearer <your-token>
    // Body: { memories: Memory[], includeConversations: boolean }
    
    const memories = req.body.memories;
    const timestamp = new Date().toISOString();
    
    // Create a gist or commit to a repo with the memories JSON
    const octokit = await getUncachableGitHubClient();
    
    const result = await octokit.gists.create({
      description: \`Cognitive Anchor Memory Backup - \${timestamp}\`,
      public: false,
      files: {
        'memories.json': {
          content: JSON.stringify(memories, null, 2)
        }
      }
    });
  `,

  /**
   * Features that can be implemented with GitHub integration:
   * 1. Backup memories to private gists
   * 2. Sync memories across devices
   * 3. Export memories as JSON/markdown
   * 4. Create timestamped archives of conversation history
   * 5. Share specific memories with caregivers via GitHub links
   */
};

export default GitHubService;
