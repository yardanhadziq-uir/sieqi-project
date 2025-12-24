/**
 * Cloudflare Worker Backend for IEQI Monitoring System
 * 
 * Handles sensor data ingestion and retrieval using D1 Database.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    };

    // Handle CORS preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Helper to return JSON response
    const jsonResponse = (data, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    };

    // Helper to return Error response
    const errorResponse = (message, status = 400) => {
      return jsonResponse({ error: message }, status);
    };

    // Public Route: Health Check
    if (method === 'GET' && url.pathname === '/') {
      return jsonResponse({ message: 'IEQI Backend is running. Use /api/ieqi endpoints.', status: 'healthy' });
    }

    // Authentication Middleware
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== env.API_KEY) {
      return errorResponse('Unauthorized: Invalid or missing API Key', 401);
    }

    try {
      // Route: POST /api/ieqi - Ingest Sensor Data
      if (method === 'POST' && url.pathname === '/api/ieqi') {
        let body;
        try {
          body = await request.json();
        } catch (e) {
          return errorResponse('Invalid JSON body');
        }

        const { temperature, humidity, light, ieqi, device_id } = body;

        // Validation
        if (
          typeof temperature !== 'number' ||
          typeof humidity !== 'number' ||
          typeof light !== 'number' ||
          typeof ieqi !== 'number' ||
          !device_id
        ) {
          return errorResponse('Missing or invalid fields. Required: temperature, humidity, light, ieqi, device_id');
        }

        // Insert into D1
        const query = `
          INSERT INTO ieqi_logs (device_id, temperature, humidity, light, ieqi)
          VALUES (?, ?, ?, ?, ?)
        `;
        
        const result = await env.DB.prepare(query)
          .bind(device_id, temperature, humidity, light, ieqi)
          .run();

        if (result.success) {
          return jsonResponse({ success: true, message: 'Data stored successfully' }, 201);
        } else {
          return errorResponse('Failed to store data in database', 500);
        }
      }

      // Route: GET /api/ieqi - Get History (Limit 50)
      if (method === 'GET' && url.pathname === '/api/ieqi') {
        const query = `
          SELECT * FROM ieqi_logs
          ORDER BY created_at DESC
          LIMIT 50
        `;
        
        const { results } = await env.DB.prepare(query).all();
        return jsonResponse({ data: results });
      }

      // Route: GET /api/ieqi/latest - Get Latest Record
      if (method === 'GET' && url.pathname === '/api/ieqi/latest') {
        const query = `
          SELECT * FROM ieqi_logs
          ORDER BY created_at DESC
          LIMIT 1
        `;
        
        const result = await env.DB.prepare(query).first();
        
        if (!result) {
          return jsonResponse({ message: 'No data found' }, 404);
        }
        
        return jsonResponse({ data: result });
      }

      // 404 Not Found
      return errorResponse('Endpoint not found', 404);

    } catch (err) {
      console.error('Worker Error:', err);
      return errorResponse('Internal Server Error: ' + err.message, 500);
    }
  }
};
