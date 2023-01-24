
export interface IUploadOptions {
    chunkSize?: number;
    storage?: any;
    contentType?: string;
    onChunkUpload?: (chunk: {
        totalBytes: number
        uploadedBytes: number
        chunkIndex: number
        chunkLength: number
    }) => Promise<any>;
    id?: string,
    url: string;
    file: File;
    metadata?: Map<string, string>;
}

export default class Upload {

    constructor(options: IUploadOptions);

    start(): Promise<any>;

    pause(): void;

    unpause(): void;

    cancel(): void;
}