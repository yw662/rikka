import { signal, computed, effect } from '@takanashi/rikka-signal';

export type Priority = 'low' | 'medium' | 'high';
export type Filter = 'all' | 'active' | 'completed';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  tags: string[];
  createdAt: number;
  completedAt?: number;
}

const STORAGE_KEY = 'rikka-todo-list';

function loadTodos(): Todo[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  // 默认示例数据
  const now = Date.now();
  return [
    { id: 't1', text: 'Welcome to Rikka Todo ✨', completed: false, priority: 'high', tags: ['demo'], createdAt: now - 60000 },
    { id: 't2', text: 'Try adding a new task above', completed: false, priority: 'medium', tags: ['demo'], createdAt: now - 30000 },
    { id: 't3', text: 'Click a task to mark complete', completed: true, priority: 'low', tags: ['done'], createdAt: now - 10000, completedAt: now - 5000 },
  ];
}

export const todos = signal<Todo[]>(loadTodos());
export const filter = signal<Filter>('all');
export const searchQuery = signal('');
export const editingId = signal<string | null>(null);

// 持久化
effect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos.get()));
});

export const filteredTodos = computed(() => {
  const list = todos.get();
  const f = filter.get();
  const q = searchQuery.get().toLowerCase().trim();
  let result = list;
  if (f === 'active') result = result.filter(t => !t.completed);
  else if (f === 'completed') result = result.filter(t => t.completed);
  if (q) {
    result = result.filter(t =>
      t.text.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
    );
  }
  // 按优先级排序：high > medium > low，再按创建时间倒序
  const priorityWeight: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
  return [...result].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const pw = priorityWeight[a.priority] - priorityWeight[b.priority];
    if (pw !== 0) return pw;
    return b.createdAt - a.createdAt;
  });
});

export const activeCount = computed(() =>
  todos.get().filter(t => !t.completed).length
);

export const completedCount = computed(() =>
  todos.get().filter(t => t.completed).length
);

export const allTags = computed(() => {
  const set = new Set<string>();
  todos.get().forEach(t => t.tags.forEach(tag => set.add(tag)));
  return Array.from(set).sort();
});

function nextId(): string {
  return 't_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function addTodo(text: string, priority: Priority = 'medium', tags: string[] = []) {
  const trimmed = text.trim();
  if (!trimmed) return;
  todos.set([
    { id: nextId(), text: trimmed, completed: false, priority, tags: [...tags], createdAt: Date.now() },
    ...todos.get(),
  ]);
}

export function toggleTodo(id: string) {
  todos.set(
    todos.get().map(t =>
      t.id === id
        ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : undefined }
        : t
    )
  );
}

export function deleteTodo(id: string) {
  todos.set(todos.get().filter(t => t.id !== id));
  if (editingId.get() === id) editingId.set(null);
}

export function updateTodoText(id: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    deleteTodo(id);
    return;
  }
  todos.set(todos.get().map(t => (t.id === id ? { ...t, text: trimmed } : t)));
}

export function setPriority(id: string, priority: Priority) {
  todos.set(todos.get().map(t => (t.id === id ? { ...t, priority } : t)));
}

export function toggleTag(id: string, tag: string) {
  todos.set(
    todos.get().map(t => {
      if (t.id !== id) return t;
      const has = t.tags.includes(tag);
      return { ...t, tags: has ? t.tags.filter(x => x !== tag) : [...t.tags, tag] };
    })
  );
}

export function clearCompleted() {
  todos.set(todos.get().filter(t => !t.completed));
}

export function reorderTodos(fromIndex: number, toIndex: number) {
  const list = [...todos.get()];
  const [removed] = list.splice(fromIndex, 1);
  list.splice(toIndex, 0, removed);
  todos.set(list);
}

export function deleteSelected(ids: string[]) {
  todos.set(todos.get().filter(t => !ids.includes(t.id)));
  if (ids.includes(editingId.get() || '')) editingId.set(null);
}

export function toggleSelected(ids: string[]) {
  const now = Date.now();
  todos.set(
    todos.get().map(t => {
      if (!ids.includes(t.id)) return t;
      return {
        ...t,
        completed: !t.completed,
        completedAt: !t.completed ? now : undefined,
      };
    })
  );
}

export function toggleAll() {
  const allDone = todos.get().every(t => t.completed);
  todos.set(
    todos.get().map(t => ({
      ...t,
      completed: !allDone,
      completedAt: !allDone ? Date.now() : undefined,
    }))
  );
}

export function exportData() {
  return JSON.stringify(todos.get(), null, 2);
}

export function importData(json: string) {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      const valid: Todo[] = parsed
        .filter(t => t && typeof t.text === 'string')
        .map(t => ({
          id: t.id || nextId(),
          text: String(t.text),
          completed: Boolean(t.completed),
          priority: (t.priority === 'low' || t.priority === 'high') ? t.priority : 'medium',
          tags: Array.isArray(t.tags) ? t.tags.filter((x: unknown) => typeof x === 'string') : [],
          createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
          completedAt: typeof t.completedAt === 'number' ? t.completedAt : undefined,
        }));
      todos.set(valid);
      return true;
    }
  } catch {}
  return false;
}
