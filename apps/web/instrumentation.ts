export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduledJobs } = await import("./lib/start-scheduled-jobs");
    startScheduledJobs();
  }
}
