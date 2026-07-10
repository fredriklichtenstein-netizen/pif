import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type BucketPlan = {
  bucket: string;
  prefix: string; // folder to list under
  toPath: (name: string) => string; // full object path for .remove()
};

const PAGE_LIMIT = 1000;
const MAX_PAGES = 20; // safety fuse: up to 20k objects per bucket

async function purgeBucket(
  admin: ReturnType<typeof createClient>,
  userId: string,
  plan: BucketPlan,
  warnings: Array<Record<string, unknown>>,
): Promise<number> {
  let removed = 0;
  try {
    for (let page = 0; page < MAX_PAGES; page++) {
      const { data, error } = await admin.storage
        .from(plan.bucket)
        .list(plan.prefix, { limit: PAGE_LIMIT, offset: page * PAGE_LIMIT });

      if (error) {
        console.error("[delete-account] list failed", {
          user_id: userId,
          bucket: plan.bucket,
          prefix: plan.prefix,
          error: error.message,
        });
        warnings.push({
          stage: "list",
          user_id: userId,
          bucket: plan.bucket,
          prefix: plan.prefix,
          error: error.message,
        });
        return removed;
      }

      if (!data || data.length === 0) return removed;

      const paths = data
        .filter((entry) => entry && entry.name && !entry.name.endsWith("/"))
        .map((entry) => plan.toPath(entry.name));

      if (paths.length > 0) {
        const { error: rmErr } = await admin.storage
          .from(plan.bucket)
          .remove(paths);
        if (rmErr) {
          console.error("[delete-account] remove failed", {
            user_id: userId,
            bucket: plan.bucket,
            prefix: plan.prefix,
            paths,
            error: rmErr.message,
          });
          warnings.push({
            stage: "remove",
            user_id: userId,
            bucket: plan.bucket,
            paths,
            error: rmErr.message,
          });
        } else {
          removed += paths.length;
        }
      }

      if (data.length < PAGE_LIMIT) return removed;
    }

    console.error("[delete-account] pagination safety fuse hit", {
      user_id: userId,
      bucket: plan.bucket,
      prefix: plan.prefix,
    });
    warnings.push({
      stage: "pagination_cap",
      user_id: userId,
      bucket: plan.bucket,
      prefix: plan.prefix,
      note: `stopped after ${MAX_PAGES} pages; manual cleanup may be required`,
    });
    return removed;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[delete-account] bucket purge threw", {
      user_id: userId,
      bucket: plan.bucket,
      error: message,
    });
    warnings.push({
      stage: "exception",
      user_id: userId,
      bucket: plan.bucket,
      error: message,
    });
    return removed;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json(401, { error: "Unauthorized" });
    }

    // Verify caller with anon client + user JWT.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } =
      await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return json(401, { error: "Unauthorized" });
    }
    const userId = claimsData.claims.sub as string;

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const warnings: Array<Record<string, unknown>> = [];

    // Storage cleanup FIRST — if the auth delete later fails, the user still
    // has an account (safe state) rather than an orphaned-files situation.
    const plans: BucketPlan[] = [
      {
        bucket: "profile-photos",
        prefix: userId,
        toPath: (name) => `${userId}/${name}`,
      },
      {
        bucket: "post-images",
        prefix: `images/${userId}`,
        toPath: (name) => `images/${userId}/${name}`,
      },
    ];

    const storageCounts: Record<string, number> = {};
    for (const plan of plans) {
      storageCounts[plan.bucket] = await purgeBucket(
        admin,
        userId,
        plan,
        warnings,
      );
    }

    // Now delete the account (cascades DB rows).
    const { error: rpcErr } = await admin.rpc("delete_own_account", {
      p_user_id: userId,
    });
    if (rpcErr) {
      console.error("[delete-account] delete_own_account RPC failed", {
        user_id: userId,
        error: rpcErr.message,
        storage_removed: storageCounts,
        warnings,
      });
      return json(500, {
        error: "Account deletion failed after storage cleanup",
        detail: rpcErr.message,
        storage: storageCounts,
        warnings,
      });
    }

    if (warnings.length > 0) {
      console.error("[delete-account] completed with warnings", {
        user_id: userId,
        storage_removed: storageCounts,
        warnings,
      });
    } else {
      console.log("[delete-account] completed", {
        user_id: userId,
        storage_removed: storageCounts,
      });
    }

    return json(200, { ok: true, storage: storageCounts, warnings });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[delete-account] unhandled error", message);
    return json(500, { error: message });
  }
});
