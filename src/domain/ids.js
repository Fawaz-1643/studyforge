function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export const createCourseId = createId;
export const createTaskId = createId;
export const createSessionId = createId;
