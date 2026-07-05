export interface PdfRenderConfig {
  componentSpec: {
    type: string;
    componentUrl: string;
    props: Record<string, any>;
    nodeId?: string;
    version?: string;
    metadata?: Record<string, any>;
  };
  pageSize?: "letter" | "a4" | "tabloid";
  orientation?: "portrait" | "landscape";
  filename?: string;
}

export interface PdfRenderOutput {
  __outputs: {
    output: {
      pdfBase64: string;
      contentType: string;
      filename: string;
      pages: number;
      size: number;
    };
  };
}
