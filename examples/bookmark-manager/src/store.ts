import { computed, effect, store, raw, signalOf } from 'rikka-signal';

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description: string;
  tags: string[];
  read: boolean;
  createdAt: number;
}

export interface AppState {
  bookmarks: Bookmark[];
  searchQuery: string;
  selectedTags: string[];
  isLoading: boolean;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

const defaultState: AppState = {
  bookmarks: [],
  searchQuery: '',
  selectedTags: [],
  isLoading: false,
};

function loadState(): AppState {
  try {
    const saved = localStorage.getItem('bookmark-manager-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultState, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load state from localStorage:', e);
  }
  return defaultState;
}

export const appStore = store(loadState());

export const filteredBookmarks = computed(() => {
  const query = appStore.searchQuery.toLowerCase().trim();
  const tags = appStore.selectedTags;

  return appStore.bookmarks.filter((bookmark: Bookmark) => {
    if (query) {
      const matchesTitle = bookmark.title.toLowerCase().includes(query);
      const matchesUrl = bookmark.url.toLowerCase().includes(query);
      const matchesTags = bookmark.tags.some((t: string) => t.toLowerCase().includes(query));
      const matchesDescription = bookmark.description.toLowerCase().includes(query);
      if (!matchesTitle && !matchesUrl && !matchesTags && !matchesDescription) {
        return false;
      }
    }

    if (tags.length > 0) {
      const hasAllTags = tags.every((tag: string) =>
        bookmark.tags.some((t: string) => t.toLowerCase() === tag.toLowerCase())
      );
      if (!hasAllTags) return false;
    }

    return true;
  });
});

export const tagCloud = computed(() => {
  const tagCounts = new Map<string, number>();

  appStore.bookmarks.forEach((bookmark: Bookmark) => {
    bookmark.tags.forEach((tag: string) => {
      const normalizedTag = tag.toLowerCase();
      tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
    });
  });

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
});

export const stats = computed(() => {
  const total = appStore.bookmarks.length;
  const read = appStore.bookmarks.filter((b: Bookmark) => b.read).length;
  const unread = total - read;
  const topTags = tagCloud.get().slice(0, 5);

  return { total, read, unread, topTags };
});

export function addBookmark(url: string, title: string, description: string, tags: string[]): void {
  const bookmark: Bookmark = {
    id: generateId(),
    url,
    title: title || url,
    description,
    tags: tags.map((t: string) => t.trim()).filter((t: string) => t),
    read: false,
    createdAt: Date.now(),
  };

  appStore.bookmarks.push(bookmark);
}

export function removeBookmark(id: string): void {
  const index = appStore.bookmarks.findIndex((b: Bookmark) => b.id === id);
  if (index !== -1) {
    appStore.bookmarks.splice(index, 1);
  }
}

export function toggleRead(id: string): void {
  const bookmark = appStore.bookmarks.find((b: Bookmark) => b.id === id);
  if (bookmark) {
    bookmark.read = !bookmark.read;
  }
}

export function updateBookmarkTags(id: string, tags: string[]): void {
  const bookmark = appStore.bookmarks.find((b: Bookmark) => b.id === id);
  if (bookmark) {
    bookmark.tags = tags.map((t: string) => t.trim()).filter((t: string) => t);
  }
}

export function updateBookmarkTitle(id: string, title: string): void {
  const bookmark = appStore.bookmarks.find((b: Bookmark) => b.id === id);
  if (bookmark) {
    bookmark.title = title;
  }
}

export function toggleTagFilter(tag: string): void {
  const current = appStore.selectedTags;
  const normalizedTag = tag.toLowerCase();
  const index = current.findIndex((t: string) => t.toLowerCase() === normalizedTag);

  if (index !== -1) {
    appStore.selectedTags = [...current.slice(0, index), ...current.slice(index + 1)];
  } else {
    appStore.selectedTags = [...current, tag];
  }
}

export function clearFilters(): void {
  appStore.searchQuery = '';
  appStore.selectedTags = [];
}

effect(() => {
  const state = raw(appStore);
  try {
    localStorage.setItem('bookmark-manager-state', JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state to localStorage:', e);
  }
});
