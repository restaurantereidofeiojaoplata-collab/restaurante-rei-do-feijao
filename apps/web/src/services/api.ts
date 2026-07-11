import { secureStorage } from "../utils/crypto.js";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const getApiUrl = () => {
  // If VITE_API_URL is configured, use it, otherwise fallback to relative /v1 via Vite proxy
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  return envUrl ? `${envUrl}/v1` : '/v1';
};

function sanitizeErrorMessage(status: number, message: any): string {
  let msg = '';
  
  if (message && typeof message === 'object') {
    msg = message.message || message.error || JSON.stringify(message);
  } else {
    msg = String(message || '');
  }

  const trimmedMsg = msg.trim().toLowerCase();
  if (
    trimmedMsg.startsWith('<!doctype') ||
    trimmedMsg.startsWith('<html') ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    status === 530
  ) {
    return 'Erro de conexão: Não foi possível estabelecer conexão com o servidor. Certifique-se de que o servidor local e o túnel estão rodando.';
  }

  if (msg.trim().startsWith('{') || msg.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(msg);
      msg = parsed.message || parsed.error || msg;
    } catch (_) {}
  }

  // Remove technical prefixes
  msg = msg.replace(/^(ApiError|Error|ZodError|Exception|BadRequestException|ConflictException):\s*/i, '');

  const msgLower = msg.toLowerCase();

  if (msgLower.includes('internal server error') || status === 500) {
    return 'O sistema está temporariamente indisponível. Por favor, tente novamente em alguns instantes.';
  }
  if (msgLower.includes('failed to fetch') || msgLower.includes('network error') || msgLower.includes('connection refused')) {
    return 'Não foi possível conectar ao servidor. Por favor, verifique se sua conexão com a internet está ativa.';
  }
  if (msgLower.includes('invalid credentials') || msgLower.includes('unauthorized') || status === 401) {
    return 'E-mail, senha ou link de acesso incorretos. Por favor, confira os dados digitados e tente novamente.';
  }
  if (msgLower.includes('slug do restaurante já está em uso') || msgLower.includes('restaurant slug already in use')) {
    return 'O link de acesso (slug) escolhido já está sendo usado por outro estabelecimento. Por favor, informe outro nome.';
  }
  if (msgLower.includes('cnpj') && (msgLower.includes('in use') || msgLower.includes('already exists') || msgLower.includes('duplicado'))) {
    return 'Este CNPJ já está cadastrado em nosso sistema. Por favor, utilize outro ou acesse sua conta existente.';
  }
  if (msgLower.includes('email') && (msgLower.includes('in use') || msgLower.includes('already exists') || msgLower.includes('duplicado'))) {
    return 'Este endereço de e-mail já está cadastrado em nosso sistema. Por favor, utilize outro.';
  }
  if (status === 403) {
    return 'Você não possui permissão para realizar esta operação.';
  }
  if (status === 404) {
    return 'A página ou recurso solicitado não pôde ser encontrado.';
  }
  if (status === 429) {
    return 'Muitas tentativas consecutivas. Por favor, aguarde alguns instantes antes de tentar novamente.';
  }

  if (msgLower === 'required') return 'Por favor, preencha todos os campos obrigatórios.';
  if (msgLower.includes('invalid email')) return 'Por favor, insira um e-mail válido (exemplo: seu-nome@estabelecimento.com).';

  return msg || 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.';
}

export const api = {
  get token(): string | null {
    return secureStorage.getItem('gourmet_token');
  },

  set token(value: string | null) {
    if (value) {
      secureStorage.setItem('gourmet_token', value);
    } else {
      secureStorage.removeItem('gourmet_token');
    }
  },

  async request<T = any>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = new Headers(options.headers);
    
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const currentToken = this.token;
    if (currentToken) {
      headers.set('Authorization', `Bearer ${currentToken}`);
    }

    let response = await fetch(`${getApiUrl()}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      if (path === '/auth/refresh') {
        this.token = null;
        secureStorage.removeItem('gourmet_user');
        return response as any;
      }

      try {
        const refreshResponse = await fetch(`${getApiUrl()}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          this.token = refreshData.accessToken;

          headers.set('Authorization', `Bearer ${refreshData.accessToken}`);
          response = await fetch(`${getApiUrl()}${path}`, {
            ...options,
            headers,
          });
        } else {
          this.token = null;
          secureStorage.removeItem('gourmet_user');
          if (!window.location.pathname.includes('login') && response.url.includes('/v1/')) {
            window.dispatchEvent(new CustomEvent('gourmet_unauthorized'));
          }
        }
      } catch (err) {
        this.token = null;
        secureStorage.removeItem('gourmet_user');
      }
    }

    let data: any;
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const rawMessage = data?.message || data || `Request failed with status ${response.status}`;
      const errorMessage = sanitizeErrorMessage(response.status, rawMessage);
      throw new ApiError(response.status, errorMessage, data);
    }

    return data as T;
  },

  get<T = any>(path: string, options?: Omit<RequestInit, 'method'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  },

  post<T = any>(path: string, body?: any, options?: Omit<RequestInit, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T = any>(path: string, body?: any, options?: Omit<RequestInit, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T = any>(path: string, body?: any, options?: Omit<RequestInit, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T = any>(path: string, options?: Omit<RequestInit, 'method'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  },
};
