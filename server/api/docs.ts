import { Router } from 'express';

const docsRouter = Router();

// HTML for the API docs page
const apiDocsHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>xPoints Exchange API Documentation</title>
  <style>
    :root {
      --primary: #0ea5e9;
      --primary-dark: #0284c7;
      --secondary: #6366f1;
      --background: #f8fafc;
      --foreground: #0f172a;
      --muted: #e2e8f0;
      --border: #cbd5e1;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: var(--foreground);
      background-color: var(--background);
      padding: 2rem;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    header {
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1rem;
    }
    
    h1 {
      color: var(--primary-dark);
      margin-bottom: 0.5rem;
    }
    
    h2 {
      margin: 2rem 0 1rem;
      color: var(--primary-dark);
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.5rem;
    }
    
    h3 {
      margin: 1.5rem 0 1rem;
      color: var(--primary);
    }
    
    p {
      margin-bottom: 1rem;
    }
    
    pre {
      background-color: var(--muted);
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      margin: 1rem 0;
    }
    
    code {
      font-family: monospace;
      background-color: var(--muted);
      padding: 0.2rem 0.4rem;
      border-radius: 0.25rem;
    }
    
    .endpoint {
      margin-bottom: 2rem;
      padding: 1.5rem;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      background-color: white;
    }
    
    .method {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-weight: bold;
      margin-right: 0.5rem;
      background-color: var(--primary);
      color: white;
    }
    
    .path {
      font-family: monospace;
      font-weight: bold;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    
    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    
    th {
      background-color: var(--muted);
    }
    
    .note {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 0.25rem;
    }
    
    .api-key-section {
      margin: 2rem 0;
      padding: 1.5rem;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      background-color: white;
    }
    
    .rate-limits {
      margin: 2rem 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>xPoints Exchange API Documentation</h1>
      <p>Version 1.0.0</p>
      <p>The xPoints Exchange API provides access to exchange rates, tier benefits, and market trends from the xPoints platform.</p>
    </header>
    
    <section class="api-key-section">
      <h2>Authentication</h2>
      <p>All API requests require an API key. You must include the API key in the request headers:</p>
      <pre>X-API-Key: YOUR_API_KEY</pre>
      <p>To obtain an API key, please <a href="#">contact our team</a>.</p>
      
      <div class="note">
        <strong>Note:</strong> Keep your API key secure and do not share it publicly. If your API key is compromised, you can request a new one.
      </div>
    </section>
    
    <section class="rate-limits">
      <h2>Rate Limits</h2>
      <p>The API is rate-limited to protect our service. Current limits are:</p>
      <ul>
        <li>100 requests per hour per API key</li>
      </ul>
      <p>Rate limit information is returned in the response headers:</p>
      <pre>X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1621436800</pre>
      <p>If you exceed the rate limit, you will receive a 429 Too Many Requests response.</p>
    </section>
    
    <h2>Endpoints</h2>
    
    <div class="endpoint">
      <h3><span class="method">GET</span> <span class="path">/api/v1/exchange-rates</span></h3>
      <p>Get exchange rates between loyalty programs.</p>
      
      <h4>Query Parameters</h4>
      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Type</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>from</td>
            <td>string</td>
            <td>No</td>
            <td>Source loyalty program</td>
          </tr>
          <tr>
            <td>to</td>
            <td>string</td>
            <td>No</td>
            <td>Destination loyalty program</td>
          </tr>
        </tbody>
      </table>
      
      <p>If both <code>from</code> and <code>to</code> are provided, returns a specific exchange rate. Otherwise, returns all available exchange rates.</p>
      
      <h4>Response</h4>
      <pre>{
  "id": 1,
  "fromProgram": "QANTAS",
  "toProgram": "XPOINTS",
  "rate": "0.5",
  "updatedAt": "2025-05-09T00:00:00.000Z"
}</pre>
      
      <h4>Example Request</h4>
      <pre>curl -X GET "https://api.xpoints.com/api/v1/exchange-rates?from=QANTAS&to=XPOINTS" \\
  -H "X-API-Key: YOUR_API_KEY"</pre>
    </div>
    
    <div class="endpoint">
      <h3><span class="method">GET</span> <span class="path">/api/v1/tier-benefits/:tier</span></h3>
      <p>Get benefits for a specific membership tier.</p>
      
      <h4>Path Parameters</h4>
      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Type</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>tier</td>
            <td>string</td>
            <td>Yes</td>
            <td>Membership tier (STANDARD, SILVER, GOLD, PLATINUM)</td>
          </tr>
        </tbody>
      </table>
      
      <h4>Response</h4>
      <pre>{
  "id": 1,
  "tier": "SILVER",
  "feeDiscount": 0.1,
  "conversionBonus": 0.05,
  "earlyAccess": false,
  "exclusiveOffers": true,
  "prioritySupport": false
}</pre>
      
      <h4>Example Request</h4>
      <pre>curl -X GET "https://api.xpoints.com/api/v1/tier-benefits/SILVER" \\
  -H "X-API-Key: YOUR_API_KEY"</pre>
    </div>
    
    <div class="endpoint">
      <h3><span class="method">GET</span> <span class="path">/api/v1/market-trends</span></h3>
      <p>Get market trend data for exchange rates.</p>
      
      <h4>Query Parameters</h4>
      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Type</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>days</td>
            <td>number</td>
            <td>No</td>
            <td>Number of days of data to return (default: 30, max: 365)</td>
          </tr>
        </tbody>
      </table>
      
      <h4>Response</h4>
      <pre>[
  {
    "timestamp": "2025-05-08T00:00:00.000Z",
    "xpointsRate": 0.6123,
    "qantasRate": 0.9874,
    "gygRate": 1.5432,
    "volume": 125689
  },
  {
    "timestamp": "2025-05-09T00:00:00.000Z",
    "xpointsRate": 0.6234,
    "qantasRate": 0.9762,
    "gygRate": 1.5678,
    "volume": 138456
  }
]</pre>
      
      <h4>Example Request</h4>
      <pre>curl -X GET "https://api.xpoints.com/api/v1/market-trends?days=7" \\
  -H "X-API-Key: YOUR_API_KEY"</pre>
    </div>
    
    <h2>Error Responses</h2>
    <p>The API returns standard HTTP status codes to indicate success or failure:</p>
    <table>
      <thead>
        <tr>
          <th>Status Code</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>200 OK</td>
          <td>The request was successful</td>
        </tr>
        <tr>
          <td>400 Bad Request</td>
          <td>The request was invalid or malformed</td>
        </tr>
        <tr>
          <td>401 Unauthorized</td>
          <td>API key is missing or invalid</td>
        </tr>
        <tr>
          <td>404 Not Found</td>
          <td>The requested resource was not found</td>
        </tr>
        <tr>
          <td>429 Too Many Requests</td>
          <td>Rate limit exceeded</td>
        </tr>
        <tr>
          <td>500 Internal Server Error</td>
          <td>An error occurred on the server</td>
        </tr>
      </tbody>
    </table>
    
    <h4>Error Response Format</h4>
    <pre>{
  "error": "Error message describing what went wrong"
}</pre>
  </div>
</body>
</html>
`;

// Serve the API docs page
docsRouter.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(apiDocsHtml);
});

export default docsRouter;