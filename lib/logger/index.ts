type LogLevel = "info" | "warn" | "error" | "debug";

interface LogPayload {
  level: LogLevel;
  action: string;
  requestId?: string;
  storeId?: string;
  adminId?: string;
  duration_ms?: number;
  status?: "success" | "failure" | "pending";
  error?: string | any;
  [key: string]: any; // Additional contextual data
}

export const logger = {
  log: (payload: LogPayload) => {
    // In Vercel, console.log with a JSON string is automatically parsed into structured logs
    console.log(JSON.stringify({ ...payload, timestamp: new Date().toISOString() }));
  },

  info: (payload: Omit<LogPayload, "level">) => {
    logger.log({ ...payload, level: "info" } as LogPayload);
  },

  warn: (payload: Omit<LogPayload, "level">) => {
    logger.log({ ...payload, level: "warn" } as LogPayload);
  },

  error: (payload: Omit<LogPayload, "level">) => {
    logger.log({ ...payload, level: "error" } as LogPayload);
  },

  debug: (payload: Omit<LogPayload, "level">) => {
    if (process.env.NODE_ENV !== "production") {
      logger.log({ ...payload, level: "debug" } as LogPayload);
    }
  },
};
