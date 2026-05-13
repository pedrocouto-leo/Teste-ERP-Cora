/* Ambient typing fallback for supertest — declare a minimal request() shape.
 * Avoids the need for @types/supertest in environments where it's not installed.
 * If/when @types/supertest lands, this file can be removed. */
declare module 'supertest' {
  interface Response {
    status: number;
    body: any;
    headers: Record<string, string>;
    text: string;
  }
  interface Test extends Promise<Response> {
    set(field: string, val: string): Test;
    send(body?: unknown): Test;
    query(params: Record<string, unknown>): Test;
    expect(status: number): Test;
  }
  interface Agent {
    get(url: string): Test;
    post(url: string): Test;
    put(url: string): Test;
    patch(url: string): Test;
    delete(url: string): Test;
  }
  const supertest: (app: unknown) => Agent;
  export default supertest;
}
