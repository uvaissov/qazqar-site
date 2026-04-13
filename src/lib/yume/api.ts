const YUME_API_URL = process.env.YUME_API_URL || "https://api.yume.cloud";
const YUME_ORIGIN = process.env.YUME_ORIGIN || "https://qazqar.yume.cloud";
const YUME_USERNAME = process.env.YUME_USERNAME || "";
const YUME_PASSWORD = process.env.YUME_PASSWORD || "";

type TokenPair = {
  access: string;
  refresh: string;
  expiresAt: number; // timestamp when access token expires
};

class YumeApi {
  private tokens: TokenPair | null = null;

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const headers = await this.getHeaders();

    const res = await fetch(`${YUME_API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Token expired — refresh and retry
    if (res.status === 401 && this.tokens) {
      await this.refreshToken();
      const retryHeaders = await this.getHeaders();
      const retry = await fetch(`${YUME_API_URL}${path}`, {
        method,
        headers: retryHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!retry.ok) {
        throw new Error(
          `Yume API ${method} ${path} failed after refresh: ${retry.status}`
        );
      }
      return retry.json() as Promise<T>;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Yume API ${method} ${path} failed: ${res.status} ${text}`);
    }

    return res.json() as Promise<T>;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    if (!this.tokens || Date.now() >= this.tokens.expiresAt) {
      await this.login();
    }

    return {
      "Content-Type": "application/json",
      Origin: YUME_ORIGIN,
      Authorization: `Bearer ${this.tokens!.access}`,
    };
  }

  private async login(): Promise<void> {
    if (!YUME_USERNAME || !YUME_PASSWORD) {
      throw new Error("YUME_USERNAME and YUME_PASSWORD must be set");
    }

    const res = await fetch(`${YUME_API_URL}/v1/auth/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: YUME_ORIGIN,
      },
      body: JSON.stringify({
        username: YUME_USERNAME,
        password: YUME_PASSWORD,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Yume auth failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    this.setTokens(data.access, data.refresh);
    console.log("[YumeApi] Logged in successfully");
  }

  private async refreshToken(): Promise<void> {
    if (!this.tokens?.refresh) {
      return this.login();
    }

    try {
      const res = await fetch(`${YUME_API_URL}/v1/auth/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: YUME_ORIGIN,
        },
        body: JSON.stringify({ refresh: this.tokens.refresh }),
      });

      if (!res.ok) {
        console.log("[YumeApi] Refresh failed, re-logging in");
        return this.login();
      }

      const data = await res.json();
      this.setTokens(data.access, data.refresh || this.tokens.refresh);
      console.log("[YumeApi] Token refreshed");
    } catch {
      console.log("[YumeApi] Refresh error, re-logging in");
      return this.login();
    }
  }

  private setTokens(access: string, refresh: string): void {
    // Parse JWT exp claim to know when access token expires
    // Subtract 60s buffer to refresh before actual expiry
    let expiresAt = Date.now() + 23 * 60 * 60 * 1000; // fallback: 23h
    try {
      const payload = JSON.parse(
        Buffer.from(access.split(".")[1], "base64").toString()
      );
      if (payload.exp) {
        expiresAt = payload.exp * 1000 - 60_000; // 60s buffer
      }
    } catch {
      // use fallback
    }

    this.tokens = { access, refresh, expiresAt };
  }

  // --- Public API methods ---

  // Clients — search field works for IIN, phone, name
  async searchClients(query: string): Promise<YumeClient[]> {
    const data = await this.request<YumeListResponse<YumeClient>>(
      "GET",
      `/v1/crm/clients/?search=${encodeURIComponent(query)}`
    );
    return data.results;
  }

  async findClientByEmail(email: string): Promise<YumeClient | null> {
    const data = await this.request<YumeListResponse<YumeClient>>(
      "GET",
      `/v1/crm/clients/?email__exact=${encodeURIComponent(email)}`
    );
    return data.results[0] || null;
  }

  async findClientByPhone(phone: string): Promise<YumeClient | null> {
    const data = await this.request<YumeListResponse<YumeClient>>(
      "GET",
      `/v1/crm/clients/?phone__exact=${encodeURIComponent(phone)}`
    );
    return data.results[0] || null;
  }

  async findClientByIin(iin: string): Promise<YumeClient | null> {
    const data = await this.request<YumeListResponse<YumeClient>>(
      "GET",
      `/v1/crm/clients/?iin__exact=${encodeURIComponent(iin)}`
    );
    return data.results[0] || null;
  }

  async createClient(data: {
    name: string;
    phone?: string;
    email?: string;
    iin?: string;
  }): Promise<YumeClient> {
    return this.request<YumeClient>("POST", `/v1/crm/clients/`, data);
  }

  async getClient(clientId: number): Promise<YumeClientDetail> {
    return this.request<YumeClientDetail>(
      "GET",
      `/v1/crm/clients/${clientId}/`
    );
  }

  // Requests (orders) by client
  async getClientRequests(clientId: number, page = 1, pageSize = 100) {
    return this.request<YumeListResponse<YumeRequest>>(
      "GET",
      `/v1/crm/requests/?client=${clientId}&page=${page}&pageSize=${pageSize}`
    );
  }

  async getAllClientRequests(clientId: number): Promise<YumeRequest[]> {
    const all: YumeRequest[] = [];
    let page = 1;
    while (true) {
      const data = await this.getClientRequests(clientId, page);
      all.push(...data.results);
      if (!data.next) break;
      page++;
    }
    return all;
  }

  // Requests (orders) — create flow
  async createRequest(data: {
    client: number;
    rent_start: string;
    rent_end: string;
  }): Promise<YumeRequest> {
    return this.request<YumeRequest>("POST", `/v1/crm/requests/`, {
      ...data,
      autorenewal: false,
    });
  }

  async attachInventory(requestId: number, data: {
    inventory: number;
    tarif_price: number;
    start_at: string;
    end_at: string;
  }): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v1/crm/requests/${requestId}/inventories/bulk_create/`,
      {
        inventories: [{
          type: 0,
          inventory: data.inventory,
          tarif: null,
          tarif_price: String(data.tarif_price),
          tarif_duration: 86400,
          start_at: data.start_at,
          end_at: data.end_at,
        }],
      }
    );
  }

  async saveRequest(requestId: number, data?: {
    rent_start?: string;
    rent_end?: string;
  }): Promise<YumeRequest> {
    return this.request<YumeRequest>(
      "PATCH",
      `/v1/crm/requests/${requestId}/`,
      { autorenewal: false, ...data }
    );
  }

  async getRequest(requestId: number): Promise<YumeRequest> {
    return this.request<YumeRequest>(
      "GET",
      `/v1/crm/requests/${requestId}/`
    );
  }

  /** Get request or order by ID — always available at /v1/crm/requests/{id}/ */
  async getRequestOrOrder(id: number): Promise<YumeRequest> {
    return this.getRequest(id);
  }

  /** Get comments for a request (includes cancellation reasons) */
  async getRequestComments(requestId: number): Promise<YumeComment[]> {
    return this.request<YumeComment[]>(
      "GET",
      `/v1/attachments/comments/?content_type=orderrequest&object_id=${requestId}`
    );
  }

  /** Cancel a request via action endpoint */
  async cancelRequest(requestId: number): Promise<void> {
    await this.request<unknown>(
      "POST",
      `/v1/crm/requests/${requestId}/action/`,
      {
        action: 3, // cancel
        status: 3, // cancelled
      }
    );
  }

  /** Add a comment to a request (used for cancellation reasons) */
  async addRequestComment(requestId: number, body: string): Promise<void> {
    await this.request<unknown>(
      "POST",
      `/v1/attachments/comments/`,
      {
        body,
        content_type: "orderrequest",
        object_id: requestId,
      }
    );
  }

  // Documents
  async getRequestDocuments(requestId: number): Promise<YumeDocument[]> {
    const data = await this.request<YumeListResponse<YumeDocument>>(
      "GET",
      `/v2/documents/?content_type=orderrequest&object_id=${requestId}`
    );
    return data.results;
  }

  // Inventories
  async getInventories(page = 1, pageSize = 100) {
    return this.request<YumeListResponse<YumeInventory>>(
      "GET",
      `/v1/crm/inventories/?page=${page}&pageSize=${pageSize}&disabled=false&free=false&has_sublease=false&mode=inventory&skip_loader=true`
    );
  }

  async getAllInventories(): Promise<YumeInventory[]> {
    const all: YumeInventory[] = [];
    let page = 1;
    while (true) {
      const data = await this.getInventories(page);
      all.push(...data.results);
      if (!data.next) break;
      page++;
    }
    return all;
  }

  async getSchedules(startAt: string, endAt: string, page = 1, pageSize = 100) {
    return this.request<YumeListResponse<YumeScheduleInventory>>(
      "GET",
      `/v1/crm/inventories/schedules/?page=${page}&pageSize=${pageSize}&start_at=${startAt}&end_at=${endAt}&disabled=false&skip_loader=true`
    );
  }

  async getAllSchedules(startAt: string, endAt: string): Promise<YumeScheduleInventory[]> {
    const all: YumeScheduleInventory[] = [];
    let page = 1;
    while (true) {
      const data = await this.getSchedules(startAt, endAt, page);
      all.push(...data.results);
      if (!data.next) break;
      page++;
    }
    return all;
  }
}

// --- Types ---

export type YumeClient = {
  id: number;
  name: string;
  phone: string;
  email: string;
  iin: string | null;
  type: number;
  agreement_id: string | null;
  signed: boolean;
};

export type YumeClientDetail = YumeClient & {
  orders_count: number;
  orders_amount: string;
  orders_paid_amount: string;
  orders_debt_amount: string;
  overdue_rentals_amount: string;
  last_rent_date: string | null;
  total_time: string;
  comment: string;
  created_at: string;
  updated_at: string;
};

export type YumeRequestInventory = {
  id: number;
  inventory: number;
  tarif_price: string;
  tarif_duration: string;
  inventory_name: string;
  inventory_car_number: string;
  image: string | null;
  started: boolean;
  returned: boolean;
};

export type YumeRequest = {
  id: number;
  client: YumeClient;
  status: number;
  status_color: string;
  rent_start: string;
  rent_end: string;
  rent_fact_start: string | null;
  rent_fact_end: string | null;
  price: string;
  price_discount: string;
  paid_amount: string;
  payment_status: number;
  inventories: YumeRequestInventory[];
  created_at: string;
  updated_at: string;
};

export type YumeListResponse<T> = {
  page: number;
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type YumeInventoryCar = {
  id: number;
  brand: string;
  model: string;
  number: string;
  tech_passport: string;
};

export type YumeInventoryTarif = {
  id: number;
  name: string;
  price: string;
  published: boolean;
  time_period: number;
  weekdays: number[];
};

export type YumeInventory = {
  id: number;
  car: YumeInventoryCar;
  name: string;
  category: number;
  status: number;
  state: number;
  current_client: unknown | null;
  tarifs: YumeInventoryTarif[];
  extra: {
    vin?: string;
    made?: string;
    color?: string;
    total_distance?: number;
  };
  buy_price: string;
  created_at: string;
  updated_at: string;
  deleted: boolean;
};

export type YumeScheduleClient = {
  id: number;
  name: string;
  phone: string;
  email: string;
};

export type YumeSchedule = {
  id: number;
  inventory: number;
  request_id: number;
  request_status_color: string;
  client: YumeScheduleClient;
  start_at: string;
  end_at: string;
  fact_start_at: string | null;
  fact_end_at: string | null;
  rent_price: string;
  rent_price_inventory: string;
  rent_price_service: string;
};

export type YumeScheduleInventory = {
  id: number;
  car: YumeInventoryCar;
  schedules: YumeSchedule[];
  name: string;
  extra: {
    vin?: string;
    made?: string;
    color?: string;
    total_distance?: number;
  };
};

export type YumeComment = {
  id: number;
  body: string;
  user: number | null;
  content_type: string;
  object_id: number;
  created_at: string;
};

export type YumeDocumentSigner = {
  id: number;
  name: string;
  phone: string;
  email: string;
  type: string; // "client" or company role
};

export type YumeDocumentSign = {
  id: number;
  uuid: string;
  method: number;
  status: number; // 0=draft, 2=signed
  signer: YumeDocumentSigner | null;
};

export type YumeDocumentFile = {
  id: number;
  file: string;
  type: number; // 0=original, 1=overlay, 2=esign, 3=sign
};

export type YumeDocument = {
  id: number;
  uuid: string;
  name: string;
  template: number | null;
  signed: boolean;
  files: YumeDocumentFile[];
  signs: YumeDocumentSign[];
  created_at: string;
};

// Singleton
export const yumeApi = new YumeApi();
