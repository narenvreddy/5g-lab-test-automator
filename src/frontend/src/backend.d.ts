import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface HttpRequestResult {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export interface HttpHeader {
    value: string;
    name: string;
}
export interface TransformArgs {
    context: Uint8Array;
    response: HttpRequestResult;
}
export interface backendInterface {
    /**
     * / Fetches test data for a given testId via HTTP outcall.
     * / Uses a placeholder endpoint; real 5G endpoint can be substituted.
     */
    fetchTestData(testId: string): Promise<string>;
    /**
     * / Retrieves (deviceId, results) for a given testId.
     */
    getTestData(testId: string): Promise<[string, string] | null>;
    /**
     * / Stores deviceId and results keyed by testId.
     */
    setTestData(testId: string, deviceId: string, results: string): Promise<void>;
    /**
     * / Triggers the HTTP outcall for the given testId and returns the raw response.
     */
    startFetching(testId: string): Promise<string>;
    transform(args: TransformArgs): Promise<HttpRequestResult>;
}
