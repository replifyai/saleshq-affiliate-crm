import axios, { AxiosInstance, AxiosError } from 'axios';

// API Client configuration
class ApiClient {
  private client: AxiosInstance;
  private backendClient: AxiosInstance;

  constructor() {
    // Client for Next.js API routes
    this.client = axios.create({
      baseURL: '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Important: This ensures cookies are sent with requests
    });

    // Client for direct backend API calls
    this.backendClient = axios.create({
      baseURL: 'https://dashboardapi-dkhjjaxofq-el.a.run.app',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token from cookies
    this.client.interceptors.request.use(
      (config) => {
        // Cookies are automatically included with withCredentials: true
        // No need to manually set Authorization header for same-origin requests
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Request interceptor for backend calls to add auth token
    this.backendClient.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor for backend client
    this.backendClient.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    // Helper to get token from cookie on client side
    if (typeof window !== 'undefined') {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'auth_token') {
          return value;
        }
      }
    }
    return null;
  }

  // Methods for Next.js API routes (uses cookies automatically)
  public async get<T>(url: string, config = {}) {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data = {}, config = {}) {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data = {}, config = {}) {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config = {}) {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Methods for direct backend API calls (uses Authorization header)
  public async getBackend<T>(url: string, config = {}) {
    const response = await this.backendClient.get<T>(url, config);
    return response.data;
  }

  public async postBackend<T>(url: string, data = {}, config = {}) {
    const response = await this.backendClient.post<T>(url, data, config);
    return response.data;
  }

  public async putBackend<T>(url: string, data = {}, config = {}) {
    const response = await this.backendClient.put<T>(url, data, config);
    return response.data;
  }

  public async deleteBackend<T>(url: string, config = {}) {
    const response = await this.backendClient.delete<T>(url, config);
    return response.data;
  }
}

// Singleton instance
export const apiClient = new ApiClient();

