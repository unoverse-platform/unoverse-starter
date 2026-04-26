export class AudioAppendBuilder {
  static build(base64Audio: string): Record<string, unknown> {
    return {
      type: "input_audio_buffer.append",
      audio: base64Audio,
    };
  }

  static buildCommit(): Record<string, unknown> {
    return { type: "input_audio_buffer.commit" };
  }
}
