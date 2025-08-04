/**
 * Simple axios polyfill using native http/https modules
 */
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { IncomingMessage } from 'http';

interface AxiosRequestConfig {
  url?: string;
  method?: string;
  baseURL?: string;
  headers?: Record<string, string>;
  params?: any;
  data?: any;
  timeout?: number;
  responseType?: string;
}

interface AxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: AxiosRequestConfig;
}

function createAxiosResponse<T>(
  data: T,
  status: number,
  statusText: string,
  headers: Record<string, string>,
  config: AxiosRequestConfig
): AxiosResponse<T> {
  return {
    data,
    status,
    statusText,
    headers,
    config,
  };
}

function parseHeaders(rawHeaders: string[]): Record<string, string> {
  const headers: Record<string, string> = {};
  for (let i = 0; i < rawHeaders.length; i += 2) {
    if (rawHeaders[i] && rawHeaders[i + 1]) {
      headers[rawHeaders[i].toLowerCase()] = rawHeaders[i + 1];
    }
  }
  return headers;
}

async function request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return new Promise((resolve, reject) => {
    const url = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
    if (!url) {
      reject(new Error('URL is required'));
      return;
    }

    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: `${parsedUrl.pathname}${parsedUrl.search}`,
      method: config.method?.toUpperCase() || 'GET',
      headers: config.headers || {},
    };

    if (config.data) {
      options.headers['Content-Type'] = 'application/json';
    }

    const httpModule = parsedUrl.protocol === 'https:' ? https : http;
    const req = httpModule.request(options, (res: IncomingMessage) => {
      const chunks: Buffer[] = [];

      res.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        let data: any = buffer.toString();

        try {
          // Try to parse as JSON if possible
          data = JSON.parse(data);
        } catch (e) {
          // If not JSON, keep as string
        }

        const headers = parseHeaders(res.rawHeaders || []);
        resolve(createAxiosResponse(
          data,
          res.statusCode || 200,
          res.statusMessage || '',
          headers,
          config
        ));
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (config.data) {
      req.write(typeof config.data === 'string' ? config.data : JSON.stringify(config.data));
    }

    req.end();
  });
}

const axios = {
  request,
  get: <T = any>(url: string, config?: AxiosRequestConfig) => {
    return request<T>({ ...config, url, method: 'GET' });
  },
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return request<T>({ ...config, url, method: 'POST', data });
  },
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return request<T>({ ...config, url, method: 'PUT', data });
  },
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => {
    return request<T>({ ...config, url, method: 'DELETE' });
  },
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return request<T>({ ...config, url, method: 'PATCH', data });
  },
  create: (config?: AxiosRequestConfig) => {
    // Simple implementation that just returns the same instance
    return axios;
  },
};

export default axios;