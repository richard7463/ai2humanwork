export const PUBLIC_TASK_PRIORITY_IDS = [
  "7bde6365-9e4a-4fa9-a2f4-e79657b354b3",
  "0d267729-d991-4220-9634-ce70742dea8c",
  "475dfda4-e082-4e61-8a79-dfea57a5d283",
  "b891ad1e-8d23-488a-8bcf-9cd22815826b",
  "6ff6ec1c-4849-44cf-8f4d-b5c26564d35b",
  "273c0aa2-d36d-44f8-8a40-bc0ffd4a065b",
  "efe18ec2-0597-4552-af1c-58726d848d12",
  "887b1f71-7624-45e7-aaec-f47a15023789"
];

const PRIORITY_INDEX = new Map(PUBLIC_TASK_PRIORITY_IDS.map((id, index) => [id, index]));
const PLATFORM_WEIGHT = {
  x: 0,
  real_world: 1
};

export function compareTasksForBoard(a, b) {
  const aPinned = PRIORITY_INDEX.get(a.id);
  const bPinned = PRIORITY_INDEX.get(b.id);

  if (aPinned !== undefined || bPinned !== undefined) {
    if (aPinned === undefined) return 1;
    if (bPinned === undefined) return -1;
    return aPinned - bPinned;
  }

  const aPlatform = PLATFORM_WEIGHT[a.campaign?.platform] ?? 2;
  const bPlatform = PLATFORM_WEIGHT[b.campaign?.platform] ?? 2;
  if (aPlatform !== bPlatform) {
    return aPlatform - bPlatform;
  }

  return +new Date(b.updatedAt) - +new Date(a.updatedAt);
}

export function sortTasksForBoard(tasks) {
  return [...tasks].sort(compareTasksForBoard);
}
