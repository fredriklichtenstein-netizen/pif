import { Capacitor } from "@capacitor/core";

// Options for supabase.functions.invoke('get-mapbox-token', ...). On the web
// this is undefined, so the call is exactly what it always was. The native
// apps ask for the token that has no URL restriction (see the edge function).
export function mapboxTokenInvokeOptions(): { body: { platform: "native" } } | undefined {
  return Capacitor.isNativePlatform() ? { body: { platform: "native" } } : undefined;
}
