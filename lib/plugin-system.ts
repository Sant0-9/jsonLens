import { JsonValue } from '@/store/json-store';

export interface PluginContext {
  registerTransform(transform: PluginTransform): void;
}

export interface PluginTransform {
  id: string;
  name: string;
  description: string;
  apply(data: JsonValue): JsonValue;
}

export interface PluginModule {
  id: string;
  name: string;
  version: string;
  register(ctx: PluginContext): void;
}

const transforms: PluginTransform[] = [];

export function registerPlugin(plugin: PluginModule) {
  const ctx: PluginContext = {
    registerTransform(t) {
      transforms.push(t);
    },
  };
  plugin.register(ctx);
}

export function getPluginTransforms(): PluginTransform[] {
  return transforms.slice();
}

// --- Sample built-in plugin (safe, no network, no eval) ---
function uppercaseKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(uppercaseKeys);
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => {
      out[k.toUpperCase()] = uppercaseKeys(v);
    });
    return out;
  }
  return obj;
}

registerPlugin({
  id: 'builtin.sample.uppercase',
  name: 'Sample Transformer Pack',
  version: '0.1.0',
  register(ctx) {
    ctx.registerTransform({
      id: 'uppercase-keys',
      name: 'Uppercase Keys',
      description: 'Convert all object keys to UPPERCASE (recursive).',
      apply(data: JsonValue) {
        return uppercaseKeys(data) as JsonValue;
      },
    });
  },
});

