export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startSync } = await import("./lib/yume/sync");
    startSync();
    const { startCrmQueue } = await import("./lib/yume/crm-queue");
    startCrmQueue();
  }
}
