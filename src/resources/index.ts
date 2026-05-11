import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

// Import specific resource handlers
import { registerDocsResources } from "./docs.js";
import { registerCodeSamplesResources } from "./code-samples.js";
import { registerEndpointResources } from "./endpoints.js";
import { registerLtxVideoResources } from "./ltx-video.js";

/**
 * Register all resources with the MCP server
 */
export function registerResources(server: McpServer) {
  // Register overview resources
  registerOverviewResources(server);
  
  // Register documentation resources
  registerDocsResources(server);
  
  // Register code sample resources
  registerCodeSamplesResources(server);
  
  // Register endpoint documentation
  registerEndpointResources(server);

  // Register LTX Video resources
  registerLtxVideoResources(server);
}

/**
 * Register overview resources that provide general information about the Nylas API
 */
function registerOverviewResources(server: McpServer) {
  // Register a general overview of the Nylas API
  server.resource(
    "nylas-overview",
    "nylas://overview",
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: `# Nylas API Overview
        
The Nylas Communications Platform is a set of APIs that allows developers to easily integrate email, calendar, and contacts functionality into their applications. The platform provides a unified interface to access data from various providers like Gmail, Office 365, Exchange, and more.

## Key Features

- **Email API**: Read, send, and organize emails
- **Calendar API**: Create, read, update, and delete calendar events
- **Contacts API**: Manage contact information
- **Authentication**: Secure OAuth-based authentication
- **Webhooks**: Real-time updates when data changes
- **Provider Agnostic**: Works with Gmail, Office 365, Exchange, and more

## Getting Started

1. Create a Nylas developer account
2. Set up your application
3. Authenticate users
4. Start making API calls

For more information, use the resources provided by this MCP server to explore specific parts of the Nylas API.`,
        mimeType: "text/markdown"
      }]
    })
  );
  
  // Register authentication overview
  server.resource(
    "nylas-auth",
    "nylas://auth/overview",
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: `# Nylas Authentication Overview

Nylas uses OAuth 2.0 for authentication. The authentication flow allows your application to obtain an access token that can be used to make API calls on behalf of your users.

## Authentication Flow

1. **Redirect user**: Direct your user to the Nylas OAuth page
2. **User grants access**: User authorizes your application
3. **Receive callback**: Nylas redirects back to your application with a code
4. **Exchange code**: Your server exchanges the code for an access token
5. **Make API calls**: Use the access token to make API requests

## Code Example

\`\`\`typescript
import { Nylas } from '@nylas/nylas-js';

// Initialize Nylas client
Nylas.config({
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
});

// Generate OAuth URL
const authUrl = Nylas.urlForAuthentication({
  redirectURI: 'YOUR_REDIRECT_URI',
  scopes: ['email.read_only', 'calendar.read_only', 'contacts.read_only'],
});

// Redirect user to authUrl

// After user is redirected back to your redirect URI:
const code = 'CODE_FROM_URL_PARAMETER';

// Exchange code for token
Nylas.exchangeCodeForToken(code).then(token => {
  console.log('Access token:', token);
});
\`\`\`

For more detailed information on authentication, refer to the specific authentication resources and code samples.`,
        mimeType: "text/markdown"
      }]
    })
  );
}