/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_PROTECTED_BUILD?: string;
    readonly VITE_DEPLOY_TARGET?: string;
    readonly GEMINI_API_KEY?: string;
    readonly DEV: boolean;
    readonly PROD: boolean;
    readonly MODE: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
