import { defineElement } from '@takanashi/rikka-elements';
import { div, h3, input, textarea, button, label, svg, path, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import {
  showForm,
  editingBookmark,
  closeForm,
  addBookmark,
  updateBookmark,
  type Bookmark,
} from '../store.js';

export const bookmarkForm = defineElement('bookmark-form', {
  attributes: {},
  styles: css`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    
    :host(.hidden) {
      display: none;
    }
    
    .form-modal {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 1.5rem;
      padding: 2rem;
      width: 100%;
      max-width: 500px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      animation: slideUp 0.3s ease;
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    
    .form-header h3 {
      color: white;
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
    }
    
    .close-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    
    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .form-group {
      margin-bottom: 1.25rem;
    }
    
    .form-group label {
      display: block;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }
    
    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 0.75rem;
      color: white;
      font-size: 1rem;
      outline: none;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }
    
    .form-group input::placeholder,
    .form-group textarea::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
    
    .form-group input:focus,
    .form-group textarea:focus {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(102, 126, 234, 0.5);
    }
    
    .form-group textarea {
      resize: vertical;
      min-height: 80px;
    }
    
    .form-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.75rem;
    }
    
    .cancel-btn {
      flex: 1;
      padding: 0.875rem 1.5rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 0.75rem;
      color: white;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .cancel-btn:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    
    .submit-btn {
      flex: 2;
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 0.75rem;
      color: white;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .submit-btn:hover {
      transform: scale(1.02);
      box-shadow: 0 10px 30px -10px rgba(102, 126, 234, 0.5);
    }
  `,
  render() {
    const host = this;

    const titleInput = input({
      class: '',
      placeholder: '书签标题',
    });

    const urlInput = input({
      class: '',
      placeholder: 'https://example.com',
    });

    const descInput = textarea({
      class: '',
      placeholder: '书签描述（可选）',
    });

    const tagsInput = input({
      class: '',
      placeholder: '标签，用逗号分隔（可选）',
    });

    const titleEl = h3({}, '添加书签');

    function resetForm() {
      titleInput.value = '';
      urlInput.value = '';
      descInput.value = '';
      tagsInput.value = '';
    }

    function handleSubmit() {
      const title = titleInput.value.trim();
      const url = urlInput.value.trim();

      if (!title || !url) {
        alert('请填写标题和链接');
        return;
      }

      const tags = tagsInput.value
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t);

      const edit = editingBookmark.get();

      if (edit) {
        updateBookmark(edit.id, {
          title,
          url,
          description: descInput.value.trim(),
          tags,
        });
      } else {
        addBookmark({
          title,
          url,
          description: descInput.value.trim(),
          tags,
          favorite: false,
        });
      }

      closeForm();
      resetForm();
    }

    effect(() => {
      const isVisible = showForm.get();
      const edit = editingBookmark.get();

      if (isVisible) {
        host.classList.remove('hidden');
        if (edit) {
          titleEl.textContent = '编辑书签';
          titleInput.value = edit.title;
          urlInput.value = edit.url;
          descInput.value = edit.description;
          tagsInput.value = edit.tags.join(', ');
        } else {
          titleEl.textContent = '添加书签';
          resetForm();
        }
        urlInput.focus();
      } else {
        host.classList.add('hidden');
      }
    });

    const closeBtn = button(
      { class: 'close-btn' },
      svg(
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
        path({ d: 'M6 18L18 6M6 6l12 12' })
      )
    );

    closeBtn.addEventListener('click', () => {
      closeForm();
      resetForm();
    });

    const cancelBtn = button({ class: 'cancel-btn' }, '取消');
    cancelBtn.addEventListener('click', () => {
      closeForm();
      resetForm();
    });

    const submitBtn = button({ class: 'submit-btn' }, '保存');
    submitBtn.addEventListener('click', handleSubmit);

    host.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeForm();
        resetForm();
      }
      if (e.key === 'Enter' && e.ctrlKey) {
        handleSubmit();
      }
    });

    return div(
      { class: 'form-modal' },
      div(
        { class: 'form-header' },
        titleEl,
        closeBtn
      ),
      div(
        { class: 'form-group' },
        label({}, '标题'),
        titleInput
      ),
      div(
        { class: 'form-group' },
        label({}, '链接'),
        urlInput
      ),
      div(
        { class: 'form-group' },
        label({}, '描述'),
        descInput
      ),
      div(
        { class: 'form-group' },
        label({}, '标签'),
        tagsInput
      ),
      div(
        { class: 'form-actions' },
        cancelBtn,
        submitBtn
      )
    );
  },
});
