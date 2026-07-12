import { NextResponse, NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { BaseError, AuthorizationError } from "../errors";
import { logger } from "../logger";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "../supabase/server";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    requestId: string;
  };
}

export function successResponse<T>(data: T, message?: string, status: number = 200) {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  if (message) response.message = message;
  
  return NextResponse.json(response, { status });
}

export function errorResponse(error: any, action: string = "unknown_action") {
  const requestId = uuidv4();
  
  let statusCode = 500;
  let code = "INTERNAL_ERROR";
  let message = "An unexpected error occurred.";
  let details = undefined;

  if (error instanceof BaseError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.data;
  } else if (error instanceof Error) {
    message = error.message;
  }

  logger.error({
    action,
    requestId,
    status: "failure",
    error: {
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      code,
    },
  });

  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
      requestId,
    },
  };

  return NextResponse.json(response, { status: statusCode });
}

export function withApiHandler(
  action: string,
  handler: (req: NextRequest, requestId: string) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    try {
      const response = await handler(req, requestId);
      if (req.method !== "GET") {
        logger.info({
          action,
          requestId,
          status: "success",
          duration_ms: Date.now() - startTime,
        });
      }
      return response;
    } catch (error) {
      return errorResponse(error, action);
    }
  };
}

export interface StoreAdminContext {
  userId: string;
  storeId: string;
  organizationId: string;
  role: string;
}

export function withStoreAdminApiHandler(
  action: string,
  handler: (req: NextRequest, ctx: StoreAdminContext, requestId: string, routeCtx?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, routeCtx?: any) => {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set() {},
            remove() {},
          },
        }
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new AuthorizationError("Not authenticated");

      const storeId = req.headers.get("x-store-id");
      if (!storeId) throw new AuthorizationError("x-store-id header is required");

      const adminClient = createServiceRoleClient();
      const { data: member, error } = await adminClient
        .from("store_members")
        .select("role, store_id, stores(organization_id)")
        .eq("store_id", storeId)
        .eq("profile_id", user.id)
        .single();

      if (error || !member) {
        // Fallback: Check if they are Super Admin
        const { data: profile } = await adminClient
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role !== "SUPER_ADMIN") {
          throw new AuthorizationError("Unauthorized for this store");
        }
        
        // Super admin trying to access a store needs the org ID of that store
        const { data: storeInfo } = await adminClient
          .from("stores")
          .select("organization_id")
          .eq("id", storeId)
          .single();
          
        if (!storeInfo) throw new AuthorizationError("Store not found");

        const ctx: StoreAdminContext = {
          userId: user.id,
          storeId,
          organizationId: storeInfo.organization_id,
          role: "SUPER_ADMIN",
        };
        const response = await handler(req, ctx, requestId, routeCtx);
        return response;
      }

      const orgId = Array.isArray(member.stores) ? member.stores[0]?.organization_id : (member.stores as any)?.organization_id;

      const ctx: StoreAdminContext = {
        userId: user.id,
        storeId: member.store_id,
        organizationId: orgId,
        role: member.role,
      };

      const response = await handler(req, ctx, requestId, routeCtx);
      
      if (req.method !== "GET") {
        logger.info({
          action,
          requestId,
          status: "success",
          storeId,
          duration_ms: Date.now() - startTime,
        });
      }
      return response;
    } catch (error) {
      return errorResponse(error, action);
    }
  };
}

export function withAuthApiHandler(
  action: string,
  handler: (req: NextRequest, userId: string, requestId: string) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const requestId = uuidv4();
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: { get(n) { return cookieStore.get(n)?.value; }, set() {}, remove() {} },
        }
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new AuthorizationError("Not authenticated");

      return await handler(req, user.id, requestId);
    } catch (error) {
      return errorResponse(error, action);
    }
  };
}

export function withSuperAdminApiHandler(
  action: string,
  handler: (req: NextRequest, userId: string, requestId: string) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const requestId = uuidv4();
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: { get(n) { return cookieStore.get(n)?.value; }, set() {}, remove() {} },
        }
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new AuthorizationError("Not authenticated");

      const adminClient = createServiceRoleClient();
      const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "SUPER_ADMIN") {
        throw new AuthorizationError("Super Admin access required");
      }

      return await handler(req, user.id, requestId);
    } catch (error) {
      return errorResponse(error, action);
    }
  };
}
