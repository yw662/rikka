import { signal, computed, effect } from '@takanashi/rikka-signal';
import { t } from './i18n.js';
import { content } from './content.js';

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: number;
  favorite: boolean;
}

export type SortBy = 'date' | 'title';

const DEFAULT_BOOKMARKS: Bookmark[] = [
  {
    id: '1',
    url: 'https://github.com',
    title: 'GitHub',
    description: t(content.githubDesc),
    tags: ['开发', '工具'],
    createdAt: Date.now() - 86400000 * 7,
    favorite: true,
  },
  {
    id: '2',
    url: 'https://developer.mozilla.org',
    title: 'MDN Web Docs',
    description: 'Web 开发文档，最好的参考资料',
    tags: ['学习', '文档'],
    createdAt: Date.now() - 86400000 * 5,
    favorite: true,
  },
  {
    id: '3',
    url: 'https://stackoverflow.com',
    title: 'Stack Overflow',
    description: '程序员问答社区',
    tags: ['开发', '问答'],
    createdAt: Date.now() - 86400000 * 3,
    favorite: false,
  },
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function loadFromStorage(): Bookmark[] {
  try {
    const saved = localStorage.getItem('bookmarks');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    console.warn('Failed to load bookmarks');
  }
  return DEFAULT_BOOKMARKS;
}

export const bookmarks = signal<Bookmark[]>(loadFromStorage());
export const searchQuery = signal('');
export const selectedTags = signal<string[]>([]);
export const sortBy = signal<SortBy>('date');
export const showForm = signal(false);
export const editingBookmark = signal<Bookmark | null>(null);

export const allTags = computed(() => {
  const tags = new Set<string>();
  bookmarks.get().forEach((b) => b.tags.forEach((t) => tags.add(t)));
  return Array.from(tags).sort();
});

export const filteredBookmarks = computed(() => {
  let result = [...bookmarks.get()];
  const query = searchQuery.get().toLowerCase().trim();
  const tags = selectedTags.get();

  if (query) {
    result = result.filter(
      (b) =>
        b.title.toLowerCase().includes(query) ||
        b.url.toLowerCase().includes(query) ||
        b.description.toLowerCase().includes(query) ||
        b.tags.some((t) => t.toLowerCase().includes(query))
    );
  }

  if (tags.length > 0) {
    result = result.filter((b) =>
      tags.every((tag) => b.tags.includes(tag))
    );
  }

  if (sortBy.get() === 'date') {
    result.sort((a, b) => b.createdAt - a.createdAt);
  } else {
    result.sort((a, b) => a.title.localeCompare(b.title));
  }

  return result;
});

export const stats = computed(() => {
  const bks = bookmarks.get();
  return {
    total: bks.length,
    favorites: bks.filter((b) => b.favorite).length,
    tags: allTags.get().length,
  };
});

export function addBookmark(data: Omit<Bookmark, 'id' | 'createdAt'>): void {
  const bookmark: Bookmark = {
    ...data,
    id: generateId(),
    createdAt: Date.now(),
  };
  bookmarks.set([bookmark, ...bookmarks.get()]);
}

export function updateBookmark(id: string, data: Partial<Omit<Bookmark, 'id' | 'createdAt'>>): void {
  bookmarks.set(
    bookmarks.get().map((b) => (b.id === id ? { ...b, ...data } : b))
  );
}

export function deleteBookmark(id: string): void {
  bookmarks.set(bookmarks.get().filter((b) => b.id !== id));
}

export function toggleFavorite(id: string): void {
  const b = bookmarks.get().find((x) => x.id === id);
  if (b) {
    updateBookmark(id, { favorite: !b.favorite });
  }
}

export function toggleTag(tag: string): void {
  const current = selectedTags.get();
  if (current.includes(tag)) {
    selectedTags.set(current.filter((t) => t !== tag));
  } else {
    selectedTags.set([...current, tag]);
  }
}

export function clearFilters(): void {
  searchQuery.set('');
  selectedTags.set([]);
}

export function openEditForm(bookmark: Bookmark): void {
  editingBookmark.set(bookmark);
  showForm.set(true);
}

export function closeForm(): void {
  showForm.set(false);
  editingBookmark.set(null);
}

export { getDomain };

effect(() => {
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks.get()));
});
