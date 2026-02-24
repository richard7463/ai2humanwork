export function computeTaskMetrics(tasks) {
  const total = tasks.length;
  const created = tasks.filter((task) => task.status === "created").length;
  const inProgress = tasks.filter((task) =>
    ["ai_running", "ai_failed", "ai_done", "human_assigned", "human_done"].includes(task.status)
  ).length;
  const verified = tasks.filter((task) => task.status === "verified").length;
  const paid = tasks.filter((task) => task.status === "paid").length;
  const failed = tasks.filter((task) => task.status === "ai_failed").length;
  const failRate = total ? Number(((failed / total) * 100).toFixed(1)) : 0;

  return {
    total,
    created,
    inProgress,
    verified,
    paid,
    failed,
    failRate
  };
}

