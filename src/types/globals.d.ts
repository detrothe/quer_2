declare module 'detectos.js' {
    export default class DetectOS {
        constructor(environment?: unknown);
        browser: string | null;
        version: number | string | null;
        OS: string | null;
        os: string | null;
    }
}

// File System Access API (noch nicht in lib.dom enthalten)
interface SaveFilePickerOptions {
    suggestedName?: string;
    types?: { description?: string; accept: Record<string, string[]> }[];
}

interface Window {
    showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
    showOpenFilePicker?: unknown;
}
