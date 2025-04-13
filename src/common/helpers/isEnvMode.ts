export const isEnvMode = (mode: string) => process.env.NODE_ENV === mode;

export const isProd = () => isEnvMode('production');
export const isDev = () => isEnvMode('development');
