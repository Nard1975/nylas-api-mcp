import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerLtxVideoTools } from "./ltx-video.js";

/**
 * Register all tools with the MCP server
 */
export function registerTools(server: McpServer) {
  // Register code generation tools
  registerCodeGenerationTools(server);

  // Register API explorer tools
  registerApiExplorerTools(server);

  // Register LTX Video tools
  registerLtxVideoTools(server);
}

/**
 * Register code generation tools
 */
function registerCodeGenerationTools(server: McpServer) {
  // Tool to generate authentication code for a specific language
  server.tool(
    "generate-auth-code",
    {
      language: z.enum(["node", "python", "java", "ruby", "curl"]),
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
      redirectUri: z.string().optional(),
      scopes: z.array(z.string()).optional()
    },
    async ({ language, clientId, clientSecret, redirectUri, scopes }) => {
      const normalizedLanguage = normalizeLanguage(language);
      const placeholderClientId = clientId || "YOUR_CLIENT_ID";
      const placeholderClientSecret = clientSecret || "YOUR_CLIENT_SECRET";
      const placeholderRedirectUri = redirectUri || "YOUR_REDIRECT_URI";
      const placeholderScopes = scopes || ["email", "calendar", "contacts"];
      
      // Map of languages to their authentication code templates
      const templates: Record<string, string> = {
        "Node": `
// Authentication with Nylas API using Node.js
import { Nylas } from '@nylas/nylas-js';

// Initialize Nylas client
Nylas.config({
  clientId: "${placeholderClientId}",
  clientSecret: "${placeholderClientSecret}",
});

// Generate OAuth URL to redirect the user to
const authUrl = Nylas.urlForAuthentication({
  redirectURI: "${placeholderRedirectUri}",
  scopes: ${JSON.stringify(placeholderScopes)},
});

console.log("Redirect the user to:", authUrl);

// After the user is redirected back to your redirect URI:
// Exchange the authorization code for an access token
async function exchangeCodeForToken(code) {
  try {
    const tokenData = await Nylas.exchangeCodeForToken(code);
    console.log("Access token:", tokenData.accessToken);
    console.log("Grant ID:", tokenData.grantId);
    
    // Now you can use this token to make API calls
    return tokenData;
  } catch (error) {
    console.error("Error exchanging code for token:", error);
  }
}

// Call this function with the code from the URL parameter
// exchangeCodeForToken(codeFromUrl);
`,

        "Python": `
# Authentication with Nylas API using Python
from nylas import Client
import os

# Initialize Nylas client
nylas = Client(
    client_id="${placeholderClientId}",
    client_secret="${placeholderClientSecret}"
)

# Generate OAuth URL to redirect the user to
auth_url = nylas.authentication_url(
    redirect_uri="${placeholderRedirectUri}",
    scopes=${placeholderScopes}
)

print("Redirect the user to:", auth_url)

# After the user is redirected back to your redirect URI:
# Exchange the authorization code for an access token
def exchange_code_for_token(code):
    try:
        token_data = nylas.exchange_code_for_token(code)
        print("Access token:", token_data['access_token'])
        print("Grant ID:", token_data['grant_id'])
        
        # Now you can use this token to make API calls
        return token_data
    except Exception as e:
        print("Error exchanging code for token:", e)

# Call this function with the code from the URL parameter
# exchange_code_for_token(code_from_url)
`,

        "Java": `
// Authentication with Nylas API using Java
import com.nylas.NylasClient;
import com.nylas.models.*;

public class NylasAuth {
    public static void main(String[] args) {
        // Initialize Nylas client
        NylasClient nylas = new NylasClient.Builder("${placeholderClientId}")
            .clientSecret("${placeholderClientSecret}")
            .build();
            
        // Generate OAuth URL to redirect the user to
        String authUrl = nylas.auth().urlForAuthentication(
            "${placeholderRedirectUri}", 
            ${placeholderScopes.map(scope => '"' + scope + '"').join(", ")}
        );
        
        System.out.println("Redirect the user to: " + authUrl);
        
        // After the user is redirected back to your redirect URI:
        // Exchange the authorization code for an access token
        String code = "CODE_FROM_URL_PARAMETER";
        
        try {
            TokenResponse tokenData = nylas.auth().exchangeCodeForToken(code);
            System.out.println("Access token: " + tokenData.getAccessToken());
            System.out.println("Grant ID: " + tokenData.getGrantId());
            
            // Now you can use this token to make API calls
        } catch (Exception e) {
            System.err.println("Error exchanging code for token: " + e.getMessage());
        }
    }
}
`,

        "Ruby": `
# Authentication with Nylas API using Ruby
require 'nylas'

# Initialize Nylas client
nylas = Nylas::Client.new(
  client_id: "${placeholderClientId}",
  client_secret: "${placeholderClientSecret}"
)

# Generate OAuth URL to redirect the user to
auth_url = nylas.auth.authorize_url(
  redirect_uri: "${placeholderRedirectUri}",
  scopes: ${JSON.stringify(placeholderScopes)}
)

puts "Redirect the user to: #{auth_url}"

# After the user is redirected back to your redirect URI:
# Exchange the authorization code for an access token
def exchange_code_for_token(code)
  begin
    token_data = nylas.auth.exchange_code_for_token(code)
    puts "Access token: #{token_data.access_token}"
    puts "Grant ID: #{token_data.grant_id}"
    
    # Now you can use this token to make API calls
    return token_data
  rescue => e
    puts "Error exchanging code for token: #{e.message}"
  end
end

# Call this function with the code from the URL parameter
# exchange_code_for_token(code_from_url)
`,

        "curl": `
# Authentication with Nylas API using curl

# Step 1: Generate an authorization URL (typically done in your backend)
# Users will be redirected to this URL to authorize your application

# Step 2: After authorization, the user is redirected to your redirect URI with a code
# For example: ${placeholderRedirectUri}?code=AUTHORIZATION_CODE

# Step 3: Exchange the authorization code for an access token
curl --request POST \\
  --url "https://api.us.nylas.com/v3/connect/oauth/token" \\
  --header "Content-Type: application/json" \\
  --data '{
    "client_id": "${placeholderClientId}",
    "client_secret": "${placeholderClientSecret}",
    "grant_type": "authorization_code",
    "code": "AUTHORIZATION_CODE_FROM_REDIRECT",
    "redirect_uri": "${placeholderRedirectUri}"
  }'

# Response will contain access_token, refresh_token, grant_id, etc.

# Step 4: Use the access token to make API calls
curl --request GET \\
  --url "https://api.us.nylas.com/v3/grants/GRANT_ID/messages?limit=10" \\
  --header "Content-Type: application/json" \\
  --header "Authorization: Bearer ACCESS_TOKEN"
`
      };
      
      // Get the template for the requested language, or provide an error message
      const template = templates[normalizedLanguage] || 
        `Code generation is not available for ${language}. Available languages are: Node.js, Python, Java, Ruby, and curl.`;
      
      return {
        content: [
          {
            type: "text",
            text: template
          }
        ]
      };
    }
  );
  
  // Tool to generate code for a specific API endpoint
  server.tool(
    "generate-endpoint-code",
    {
      language: z.enum(["node", "python", "java", "ruby", "curl"]),
      endpoint: z.string(),
      method: z.enum(["GET", "POST", "PUT", "DELETE"]).optional(),
      params: z.record(z.any()).optional()
    },
    async ({ language, endpoint, method = "GET", params = {} }) => {
      const normalizedLanguage = normalizeLanguage(language);
      const endpointPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
      
      // Construct the endpoint with path parameters
      let formattedEndpoint = endpointPath;
      
      // Replace path parameters with values from params
      Object.keys(params).forEach(key => {
        if (formattedEndpoint.includes(`{${key}}`)) {
          formattedEndpoint = formattedEndpoint.replace(`{${key}}`, params[key]);
          delete params[key]; // Remove used path parameters
        }
      });
      
      // Map of languages to their API code templates
      const templates: Record<string, string> = {
        "Node": `
// ${method} ${endpointPath} using Nylas Node.js SDK
import 'dotenv/config';
import Nylas from '@nylas/nylas-js';

// Initialize the Nylas client
const nylas = new Nylas({
  apiKey: process.env.NYLAS_API_KEY
});

async function callNylasApi() {
  try {
    ${generateNodeCode(method, formattedEndpoint, params)}
    
    console.log(response);
    return response;
  } catch (error) {
    console.error('Error calling Nylas API:', error);
  }
}

callNylasApi();
`,

        "Python": `
# ${method} ${endpointPath} using Nylas Python SDK
from dotenv import load_dotenv
load_dotenv()

import os
from nylas import Client

# Initialize the Nylas client
nylas = Client(
    api_key=os.environ.get('NYLAS_API_KEY')
)

${generatePythonCode(method, formattedEndpoint, params)}

print(response)
`,

        "Java": `
// ${method} ${endpointPath} using Nylas Java SDK
import com.nylas.NylasClient;
import com.nylas.models.*;

public class NylasApiExample {
    public static void main(String[] args) {
        try {
            // Initialize the Nylas client
            NylasClient nylas = new NylasClient.Builder(System.getenv("NYLAS_API_KEY")).build();
            
            ${generateJavaCode(method, formattedEndpoint, params)}
            
            System.out.println(response);
        } catch (Exception e) {
            System.err.println("Error calling Nylas API: " + e.getMessage());
        }
    }
}
`,

        "Ruby": `
# ${method} ${endpointPath} using Nylas Ruby SDK
require 'nylas'
require 'dotenv/load'

# Initialize the Nylas client
nylas = Nylas::Client.new(
  api_key: ENV['NYLAS_API_KEY']
)

${generateRubyCode(method, formattedEndpoint, params)}

puts response
`,

        "curl": `
# ${method} ${endpointPath} using curl
${generateCurlCode(method, formattedEndpoint, params)}
`
      };
      
      // Get the template for the requested language, or provide an error message
      const template = templates[normalizedLanguage] || 
        `Code generation is not available for ${language}. Available languages are: Node.js, Python, Java, Ruby, and curl.`;
      
      return {
        content: [
          {
            type: "text",
            text: template
          }
        ]
      };
    }
  );
}

/**
 * Register API explorer tools
 */
function registerApiExplorerTools(server: McpServer) {
  // Tool to search the Nylas API documentation
  server.tool(
    "search-api-docs",
    {
      query: z.string(),
      category: z.enum(["email", "calendar", "contacts", "auth", "webhooks"]).optional()
    },
    async ({ query, category }) => {
      // Normalize the query for search
      const normalizedQuery = query.toLowerCase();
      
      // Define search result templates
      const searchResults: Record<string, string[]> = {
        "email": [
          `### Messages API
The Messages API allows you to read, send, and search email messages.
Key endpoints:
- GET /v3/grants/{grant_id}/messages - List messages
- GET /v3/grants/{grant_id}/messages/{message_id} - Get a specific message
- POST /v3/grants/{grant_id}/messages - Send a message`,
          
          `### Threads API
The Threads API allows you to manage email conversations.
Key endpoints:
- GET /v3/grants/{grant_id}/threads - List threads
- GET /v3/grants/{grant_id}/threads/{thread_id} - Get a specific thread`,
          
          `### Drafts API
The Drafts API allows you to create and manage email drafts.
Key endpoints:
- GET /v3/grants/{grant_id}/drafts - List drafts
- POST /v3/grants/{grant_id}/drafts - Create a draft
- POST /v3/grants/{grant_id}/drafts/{draft_id}/send - Send a draft`
        ],
        
        "calendar": [
          `### Calendars API
The Calendars API allows you to manage calendar containers.
Key endpoints:
- GET /v3/grants/{grant_id}/calendars - List calendars
- GET /v3/grants/{grant_id}/calendars/{calendar_id} - Get a specific calendar`,
          
          `### Events API
The Events API allows you to create and manage calendar events.
Key endpoints:
- GET /v3/grants/{grant_id}/events - List events
- POST /v3/grants/{grant_id}/events - Create an event
- PUT /v3/grants/{grant_id}/events/{event_id} - Update an event`,
          
          `### Availability API
The Availability API helps find available time slots.
Key endpoints:
- POST /v3/grants/{grant_id}/calendars/availability - Find available time slots`
        ],
        
        "contacts": [
          `### Contacts API
The Contacts API allows you to manage contact information.
Key endpoints:
- GET /v3/grants/{grant_id}/contacts - List contacts
- GET /v3/grants/{grant_id}/contacts/{contact_id} - Get a specific contact
- POST /v3/grants/{grant_id}/contacts - Create a contact`
        ],
        
        "auth": [
          `### Authentication API
The Authentication API handles OAuth flows.
Key endpoints:
- GET /v3/connect/oauth/authorize - Start OAuth flow
- POST /v3/connect/oauth/token - Exchange code for token or refresh token`,
          
          `### Grants API
The Grants API manages connected accounts.
Key endpoints:
- GET /v3/applications/{application_id}/grants - List connected accounts
- GET /v3/applications/{application_id}/grants/{grant_id} - Get a specific connected account`
        ],
        
        "webhooks": [
          `### Webhooks API
The Webhooks API allows setting up real-time notifications.
Key endpoints:
- GET /v3/applications/{application_id}/webhooks - List webhooks
- POST /v3/applications/{application_id}/webhooks - Create a webhook
- DELETE /v3/applications/{application_id}/webhooks/{webhook_id} - Delete a webhook`
        ]
      };
      
      // If a category is specified, search only in that category
      if (category) {
        const categoryResults = searchResults[category] || [];
        const matches = categoryResults.filter(result => 
          result.toLowerCase().includes(normalizedQuery)
        );
        
        if (matches.length > 0) {
          return {
            content: [
              {
                type: "text",
                text: `# Search results for "${query}" in ${category} API\n\n${matches.join('\n\n')}`
              }
            ]
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `No results found for "${query}" in the ${category} API. Try a different search term or category.`
              }
            ]
          };
        }
      }
      
      // If no category is specified, search in all categories
      const allResults: string[] = [];
      
      Object.entries(searchResults).forEach(([category, results]) => {
        const categoryMatches = results.filter(result => 
          result.toLowerCase().includes(normalizedQuery)
        );
        
        if (categoryMatches.length > 0) {
          allResults.push(`## ${category.charAt(0).toUpperCase() + category.slice(1)} API\n\n${categoryMatches.join('\n\n')}`);
        }
      });
      
      if (allResults.length > 0) {
        return {
          content: [
            {
              type: "text",
              text: `# Search results for "${query}"\n\n${allResults.join('\n\n')}`
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `No results found for "${query}". Try a different search term.`
            }
          ]
        };
      }
    }
  );
}

/**
 * Normalize language names for code generation
 */
function normalizeLanguage(language: string): string {
  const langMap: Record<string, string> = {
    'node': 'Node',
    'nodejs': 'Node',
    'javascript': 'Node',
    'js': 'Node',
    'python': 'Python',
    'py': 'Python',
    'java': 'Java',
    'ruby': 'Ruby',
    'rb': 'Ruby',
    'curl': 'curl',
    'api': 'curl',
    'rest': 'curl'
  };
  
  return langMap[language.toLowerCase()] || language;
}

/**
 * Generate Node.js code for the API endpoint
 */
function generateNodeCode(method: string, endpoint: string, params: Record<string, any>): string {
  const parts = endpoint.split('/');
  let resourceType = '';
  let functionName = '';
  let grantId = 'process.env.NYLAS_GRANT_ID';
  let resourceId = '';
  
  // Try to determine the resource type and function name
  if (parts.length >= 3) {
    if (parts[1] === 'v3' && parts[2] === 'grants') {
      if (parts.length >= 5) {
        resourceType = parts[4]; // like 'messages', 'events', etc.
        
        if (parts.length >= 6) {
          resourceId = parts[5];
          
          if (parts.length >= 7 && parts[6] === 'send') {
            functionName = 'send';
          }
        }
      }
    }
  }
  
  // Handle different HTTP methods
  switch (method) {
    case 'GET':
      if (resourceId) {
        // Get a specific resource
        return `const response = await nylas.${resourceType}.find({
      identifier: ${grantId},
      ${resourceType.slice(0, -1)}Id: "${resourceId}",
      ${Object.entries(params).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(',\n      ')}
    });`;
      } else {
        // List resources
        return `const response = await nylas.${resourceType}.list({
      identifier: ${grantId},
      ${Object.keys(params).length > 0 ? `queryParams: {
        ${Object.entries(params).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(',\n        ')}
      }` : ''}
    });`;
      }
    
    case 'POST':
      if (functionName === 'send') {
        // Send a draft
        return `const response = await nylas.${resourceType}.send({
      identifier: ${grantId},
      ${resourceType.slice(0, -1)}Id: "${resourceId}"
    });`;
      } else {
        // Create a resource
        return `const response = await nylas.${resourceType}.create({
      identifier: ${grantId},
      ${Object.entries(params).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(',\n      ')}
    });`;
      }
    
    case 'PUT':
      // Update a resource
      return `const response = await nylas.${resourceType}.update({
      identifier: ${grantId},
      ${resourceType.slice(0, -1)}Id: "${resourceId}",
      ${Object.entries(params).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(',\n      ')}
    });`;
    
    case 'DELETE':
      // Delete a resource
      return `const response = await nylas.${resourceType}.destroy({
      identifier: ${grantId},
      ${resourceType.slice(0, -1)}Id: "${resourceId}"
    });`;
    
    default:
      return `// No code generation available for this endpoint
const response = "Please refer to the Nylas API documentation for this endpoint.";`;
  }
}

/**
 * Generate Python code for the API endpoint
 */
function generatePythonCode(method: string, endpoint: string, params: Record<string, any>): string {
  const parts = endpoint.split('/');
  let resourceType = '';
  let functionName = '';
  let grantId = 'os.environ.get("NYLAS_GRANT_ID")';
  let resourceId = '';
  
  // Try to determine the resource type and function name
  if (parts.length >= 3) {
    if (parts[1] === 'v3' && parts[2] === 'grants') {
      if (parts.length >= 5) {
        resourceType = parts[4]; // like 'messages', 'events', etc.
        
        if (parts.length >= 6) {
          resourceId = parts[5];
          
          if (parts.length >= 7 && parts[6] === 'send') {
            functionName = 'send';
          }
        }
      }
    }
  }
  
  // Handle different HTTP methods
  switch (method) {
    case 'GET':
      if (resourceId) {
        // Get a specific resource
        return `# Get a specific ${resourceType.slice(0, -1)}
response = nylas.${resourceType}.find(
    ${grantId},
    "${resourceId}"${Object.keys(params).length > 0 ? `,
    query_params={
        ${Object.entries(params).map(([key, value]) => `"${key}": ${JSON.stringify(value)}`).join(',\n        ')}
    }` : ''}
)`;
      } else {
        // List resources
        return `# List ${resourceType}
response = nylas.${resourceType}.list(
    ${grantId}${Object.keys(params).length > 0 ? `,
    query_params={
        ${Object.entries(params).map(([key, value]) => `"${key}": ${JSON.stringify(value)}`).join(',\n        ')}
    }` : ''}
)`;
      }
    
    case 'POST':
      if (functionName === 'send') {
        // Send a draft
        return `# Send a draft
response = nylas.${resourceType}.send(
    ${grantId},
    "${resourceId}"
)`;
      } else {
        // Create a resource
        return `# Create a new ${resourceType.slice(0, -1)}
response = nylas.${resourceType}.create(
    ${grantId},
    {
        ${Object.entries(params).map(([key, value]) => `"${key}": ${JSON.stringify(value)}`).join(',\n        ')}
    }
)`;
      }
    
    case 'PUT':
      // Update a resource
      return `# Update a ${resourceType.slice(0, -1)}
response = nylas.${resourceType}.update(
    ${grantId},
    "${resourceId}",
    {
        ${Object.entries(params).map(([key, value]) => `"${key}": ${JSON.stringify(value)}`).join(',\n        ')}
    }
)`;
    
    case 'DELETE':
      // Delete a resource
      return `# Delete a ${resourceType.slice(0, -1)}
response = nylas.${resourceType}.destroy(
    ${grantId},
    "${resourceId}"
)`;
    
    default:
      return `# No code generation available for this endpoint
response = "Please refer to the Nylas API documentation for this endpoint."`;
  }
}

/**
 * Generate Java code for the API endpoint
 */
function generateJavaCode(method: string, endpoint: string, params: Record<string, any>): string {
  const parts = endpoint.split('/');
  let resourceType = '';
  let functionName = '';
  let grantId = 'System.getenv("NYLAS_GRANT_ID")';
  let resourceId = '';
  
  // Try to determine the resource type and function name
  if (parts.length >= 3) {
    if (parts[1] === 'v3' && parts[2] === 'grants') {
      if (parts.length >= 5) {
        resourceType = parts[4]; // like 'messages', 'events', etc.
        resourceType = resourceType.charAt(0).toUpperCase() + resourceType.slice(1);
        
        if (parts.length >= 6) {
          resourceId = parts[5];
          
          if (parts.length >= 7 && parts[6] === 'send') {
            functionName = 'send';
          }
        }
      }
    }
  }
  
  // Handle different HTTP methods
  switch (method) {
    case 'GET':
      if (resourceId) {
        // Get a specific resource
        return `// Get a specific ${resourceType.toLowerCase().slice(0, -1)}
Response<${resourceType.slice(0, -1)}> response = nylas.${resourceType.toLowerCase()}().find(${grantId}, "${resourceId}");`;
      } else {
        // List resources
        if (Object.keys(params).length > 0) {
          return `// List ${resourceType.toLowerCase()} with query parameters
QueryParams queryParams = new QueryParams();
${Object.entries(params).map(([key, value]) => `queryParams.put("${key}", ${JSON.stringify(value)});`).join('\n')}

ListResponse<${resourceType.slice(0, -1)}> response = nylas.${resourceType.toLowerCase()}().list(${grantId}, queryParams);`;
        } else {
          return `// List ${resourceType.toLowerCase()}
ListResponse<${resourceType.slice(0, -1)}> response = nylas.${resourceType.toLowerCase()}().list(${grantId});`;
        }
      }
    
    case 'POST':
      if (functionName === 'send') {
        // Send a draft
        return `// Send a draft
Response<Message> response = nylas.${resourceType.toLowerCase()}().send(${grantId}, "${resourceId}");`;
      } else {
        // Create a resource
        return `// Create a new ${resourceType.toLowerCase().slice(0, -1)}
${resourceType.slice(0, -1)} new${resourceType.slice(0, -1)} = new ${resourceType.slice(0, -1)}.Builder()
    ${Object.entries(params).map(([key, value]) => {
      // Convert camelCase to method name (e.g., startTime -> startTime())
      const methodName = key.charAt(0).toLowerCase() + key.slice(1);
      return `    .${methodName}(${JSON.stringify(value)})`;
    }).join('\n')}
    .build();

Response<${resourceType.slice(0, -1)}> response = nylas.${resourceType.toLowerCase()}().create(${grantId}, new${resourceType.slice(0, -1)});`;
      }
    
    case 'PUT':
      // Update a resource
      return `// Update a ${resourceType.toLowerCase().slice(0, -1)}
${resourceType.slice(0, -1)} updated${resourceType.slice(0, -1)} = new ${resourceType.slice(0, -1)}.Builder()
    ${Object.entries(params).map(([key, value]) => {
      // Convert camelCase to method name (e.g., startTime -> startTime())
      const methodName = key.charAt(0).toLowerCase() + key.slice(1);
      return `    .${methodName}(${JSON.stringify(value)})`;
    }).join('\n')}
    .build();

Response<${resourceType.slice(0, -1)}> response = nylas.${resourceType.toLowerCase()}().update(${grantId}, "${resourceId}", updated${resourceType.slice(0, -1)});`;
    
    case 'DELETE':
      // Delete a resource
      return `// Delete a ${resourceType.toLowerCase().slice(0, -1)}
Response<Void> response = nylas.${resourceType.toLowerCase()}().destroy(${grantId}, "${resourceId}");`;
    
    default:
      return `// No code generation available for this endpoint
String response = "Please refer to the Nylas API documentation for this endpoint.";`;
  }
}

/**
 * Generate Ruby code for the API endpoint
 */
function generateRubyCode(method: string, endpoint: string, params: Record<string, any>): string {
  const parts = endpoint.split('/');
  let resourceType = '';
  let functionName = '';
  let grantId = 'ENV["NYLAS_GRANT_ID"]';
  let resourceId = '';
  
  // Try to determine the resource type and function name
  if (parts.length >= 3) {
    if (parts[1] === 'v3' && parts[2] === 'grants') {
      if (parts.length >= 5) {
        resourceType = parts[4]; // like 'messages', 'events', etc.
        
        if (parts.length >= 6) {
          resourceId = parts[5];
          
          if (parts.length >= 7 && parts[6] === 'send') {
            functionName = 'send';
          }
        }
      }
    }
  }
  
  // Handle different HTTP methods
  switch (method) {
    case 'GET':
      if (resourceId) {
        // Get a specific resource
        return `# Get a specific ${resourceType.slice(0, -1)}
response, _ = nylas.${resourceType}.find(
  identifier: ${grantId}, 
  ${resourceType.slice(0, -1)}_id: "${resourceId}"${Object.keys(params).length > 0 ? `,
  query_params: {
    ${Object.entries(params).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(',\n    ')}
  }` : ''}
)`;
      } else {
        // List resources
        return `# List ${resourceType}
response, _ = nylas.${resourceType}.list(
  identifier: ${grantId}${Object.keys(params).length > 0 ? `,
  query_params: {
    ${Object.entries(params).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(',\n    ')}
  }` : ''}
)`;
      }
    
    case 'POST':
      if (functionName === 'send') {
        // Send a draft
        return `# Send a draft
response, _ = nylas.${resourceType}.send(
  identifier: ${grantId}, 
  ${resourceType.slice(0, -1)}_id: "${resourceId}"
)`;
      } else {
        // Create a resource
        return `# Create a new ${resourceType.slice(0, -1)}
response, _ = nylas.${resourceType}.create(
  identifier: ${grantId}, 
  request_body: {
    ${Object.entries(params).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(',\n    ')}
  }
)`;
      }
    
    case 'PUT':
      // Update a resource
      return `# Update a ${resourceType.slice(0, -1)}
response, _ = nylas.${resourceType}.update(
  identifier: ${grantId}, 
  ${resourceType.slice(0, -1)}_id: "${resourceId}", 
  request_body: {
    ${Object.entries(params).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(',\n    ')}
  }
)`;
    
    case 'DELETE':
      // Delete a resource
      return `# Delete a ${resourceType.slice(0, -1)}
response, _ = nylas.${resourceType}.destroy(
  identifier: ${grantId}, 
  ${resourceType.slice(0, -1)}_id: "${resourceId}"
)`;
    
    default:
      return `# No code generation available for this endpoint
response = "Please refer to the Nylas API documentation for this endpoint."`;
  }
}

/**
 * Generate curl command for the API endpoint
 */
function generateCurlCode(method: string, endpoint: string, params: Record<string, any>): string {
  let baseUrl = "https://api.us.nylas.com";
  const fullUrl = `${baseUrl}${endpoint}`;
  
  // Handle different HTTP methods
  switch (method) {
    case 'GET':
      // Add query parameters if any
      if (Object.keys(params).length > 0) {
        const queryParams = Object.entries(params)
          .map(([key, value]) => `${key}=${encodeURIComponent(JSON.stringify(value))}`)
          .join('&');
        
        return `curl --request GET \\
  --url "${fullUrl}?${queryParams}" \\
  --header "Content-Type: application/json" \\
  --header "Authorization: Bearer $NYLAS_API_KEY"`;
      } else {
        return `curl --request GET \\
  --url "${fullUrl}" \\
  --header "Content-Type: application/json" \\
  --header "Authorization: Bearer $NYLAS_API_KEY"`;
      }
    
    case 'POST':
      // Include request body
      return `curl --request POST \\
  --url "${fullUrl}" \\
  --header "Content-Type: application/json" \\
  --header "Authorization: Bearer $NYLAS_API_KEY" \\
  --data '${JSON.stringify(params, null, 2)}'`;
    
    case 'PUT':
      // Include request body
      return `curl --request PUT \\
  --url "${fullUrl}" \\
  --header "Content-Type: application/json" \\
  --header "Authorization: Bearer $NYLAS_API_KEY" \\
  --data '${JSON.stringify(params, null, 2)}'`;
    
    case 'DELETE':
      return `curl --request DELETE \\
  --url "${fullUrl}" \\
  --header "Content-Type: application/json" \\
  --header "Authorization: Bearer $NYLAS_API_KEY"`;
    
    default:
      return `# No code generation available for this endpoint
# Please refer to the Nylas API documentation`;
  }
}