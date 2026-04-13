const BASE_URL = "http://localhost:8001";

export interface TestRow {
  id: string;
  testId: string;
  deviceId: string;
  requestType: string;
  details: string;
  results: string;
  status: "idle" | "running" | "completed" | "error";
}

async function apiFetch<T>(
  method: string,
  endpoint: string,
  payload?: unknown,
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  console.log(
    `[API Request] ${method} ${url}`,
    payload !== undefined ? payload : "",
  );

  const options: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (payload !== undefined) {
    options.body = JSON.stringify(payload);
  }

  const response = await fetch(url, options);

  // 204 No Content — no body to parse
  const data: T =
    response.status === 204 ? (undefined as T) : await response.json();

  console.log(`[API Response] ${method} ${url} → ${response.status}`, data);

  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status} ${response.statusText}`,
    );
  }

  return data;
}

export function getTests(): Promise<TestRow[]> {
  return apiFetch<TestRow[]>("GET", "/api/tests");
}

export function createTest(data: Partial<TestRow>): Promise<TestRow> {
  return apiFetch<TestRow>("POST", "/api/tests", data);
}

export function updateTest(
  id: string,
  data: Partial<TestRow>,
): Promise<TestRow> {
  return apiFetch<TestRow>("PUT", `/api/tests/${id}`, data);
}

export function deleteTest(id: string): Promise<void> {
  return apiFetch<void>("DELETE", `/api/tests/${id}`);
}

export function startTest(id: string): Promise<TestRow> {
  return apiFetch<TestRow>("POST", `/api/tests/${id}/start`);
}
