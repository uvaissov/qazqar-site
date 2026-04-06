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

export type YumeInventory = {
  id: number;
  car: YumeInventoryCar;
  name: string;
  category: number;
  status: number;
  state: number;
  current_client: unknown | null;
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

// Singleton
export const yumeApi = new YumeApi();
