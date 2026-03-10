const cron = require("node-cron");
const Task = require("../models/task");

// Run every hour
cron.schedule("0 * * * *", async () => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await Task.deleteMany({
      isDeleted: true,
      deletedAt: { $lte: oneDayAgo },
    });

    console.log(`Deleted ${result.deletedCount} old tasks`);
  } catch (error) {
    console.error("Cron delete error:", error);
  }
});