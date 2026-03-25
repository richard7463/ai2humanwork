import { notFound } from "next/navigation";
import { readDb } from "../../../lib/store";
import TaskDetailClient from "./TaskDetailClient";

export default async function TaskDetailPage({
  params
}: {
  params: { id: string };
}) {
  const db = await readDb();
  const task = db.tasks.find((item) => item.id === params.id);
  const payment =
    db.payments.find((item) => item.taskId === params.id && item.source === "task") ||
    db.payments.find((item) => item.taskId === params.id && item.source !== "x402_access") ||
    null;

  if (!task) {
    notFound();
  }

  return <TaskDetailClient initialTask={task} initialPayment={payment} />;
}
