export class ResponseCreateBuilder {
  static build(): Record<string, unknown> {
    return { type: "response.create" };
  }
}
