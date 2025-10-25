import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { readFileSync } from 'fs';
import { join } from 'path';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { httpMethod, pathParameters, path } = event;
  
  // Obtener la ruta real sin el prefijo /swagger
  const proxyPath = pathParameters?.proxy || '';
  const fullPath = proxyPath ? `/${proxyPath}` : '';
  
  console.log('Swagger handler - Path:', path, 'Proxy:', proxyPath, 'FullPath:', fullPath);

  // Si es una petición OPTIONS (CORS preflight)
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  // Solo permitir GET
  if (httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        message: 'Método no permitido',
        errorCode: 'METHOD_NOT_ALLOWED',
      }),
    };
  }

  try {
    // Si se solicita el archivo OpenAPI YAML
    if (fullPath === '/openapi.yaml' || fullPath === '/openapi.yml' || path.endsWith('/openapi.yaml') || path.endsWith('/openapi.yml')) {
      const openApiPath = join(__dirname, '../../docs/openapi.yaml');
      const openApiContent = readFileSync(openApiPath, 'utf8');
      
      // Determinar la URL base del servidor
      const host = event.headers.Host || 'localhost:3000';
      const protocol = event.headers['X-Forwarded-Proto'] || 'http';
      const baseUrl = `${protocol}://${host}`;
      
      // Reemplazar las URLs del servidor con las URLs dinámicas
      const dynamicOpenApiContent = openApiContent
        .replace(/https:\/\/api\.example\.com\/dev/g, `${baseUrl}/dev`)
        .replace(/https:\/\/api\.example\.com\/prod/g, `${baseUrl}/prod`);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/x-yaml',
          'Access-Control-Allow-Origin': '*',
        },
        body: dynamicOpenApiContent,
      };
    }

    // Si se solicita el JSON del OpenAPI
    if (fullPath === '/openapi.json' || path.endsWith('/openapi.json')) {
      const openApiPath = join(__dirname, '../../docs/openapi.yaml');
      const openApiContent = readFileSync(openApiPath, 'utf8');
      
      // Determinar la URL base del servidor
      const host = event.headers.Host || 'localhost:3000';
      const protocol = event.headers['X-Forwarded-Proto'] || 'http';
      const baseUrl = `${protocol}://${host}`;
      
      // Reemplazar las URLs del servidor con las URLs dinámicas
      const dynamicOpenApiContent = openApiContent
        .replace(/https:\/\/api\.example\.com\/dev/g, `${baseUrl}/dev`)
        .replace(/https:\/\/api\.example\.com\/prod/g, `${baseUrl}/prod`);
      
      // Convertir YAML a JSON (simple conversión)
      const yaml = require('js-yaml');
      const openApiJson = yaml.load(dynamicOpenApiContent);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(openApiJson, null, 2),
      };
    }

    // Swagger UI HTML
    const swaggerHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Medical Appointment API - Swagger UI</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin:0;
      background: #fafafa;
    }
    .swagger-ui .topbar {
      background-color: #2c3e50;
    }
    .swagger-ui .topbar .download-url-wrapper {
      display: none;
    }
    .swagger-ui .info .title {
      color: #2c3e50;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '/dev/swagger/openapi.yaml',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        validatorUrl: null,
        tryItOutEnabled: true,
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        onComplete: function() {
          console.log('Swagger UI cargado correctamente');
        },
        onFailure: function(data) {
          console.error('Error al cargar Swagger UI:', data);
        }
      });
    };
  </script>
</body>
</html>`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
      body: swaggerHtml,
    };

  } catch (error) {
    console.error('Error en Swagger handler:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        message: 'Error interno del servidor',
        errorCode: 'INTERNAL_ERROR',
      }),
    };
  }
};
