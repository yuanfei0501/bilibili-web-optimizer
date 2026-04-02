import { purifier } from '../core/purifier.js';
import { injectStyle, waitForElement } from '../utils/dom.js';
import { log } from '../utils/logger.js';

const spaceCss = `
  .space-between .section,
  .space-right .section-video + .section,
  .s-space .col-2 .section:last-child {
    display: none !important;
  }

  .bili-opt-invalid {
    opacity: 0.5;
    position: relative;
  }
  .bili-opt-invalid::after {
    content: '已失效';
    position: absolute;
    top: 4px;
    right: 4px;
    background: #fb7299;
    color: #fff;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 4px;
  }
`;

const batchCss = `
  .bili-opt-batch-bar {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 8px 16px;
    background: #f4f5f7;
    border-radius: 8px;
    margin-bottom: 12px;
  }
  .bili-opt-batch-bar button {
    padding: 6px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
  }
  .bili-opt-btn-select { background: #00a1d6; color: #fff; }
  .bili-opt-btn-select:hover { background: #00b5e5; }
  .bili-opt-btn-delete { background: #fb7299; color: #fff; }
  .bili-opt-btn-delete:hover { background: #fc8bab; }
  .bili-opt-btn-cancel { background: #e3e5e7; color: #333; }
  .bili-opt-selected { outline: 3px solid #00a1d6; outline-offset: -3px; }
`;

const rules = [
  {
    key: 'batchOperation',
    type: 'dom',
    handler() { injectBatchBar(); },
  },
  {
    key: 'markInvalid',
    type: 'css',
    css: spaceCss + batchCss,
    styleId: 'bili-opt-space',
    handler() { markInvalidVideos(); },
  },
  {
    key: 'hideUnnecessaryModules',
    type: 'css',
    css: '',
    styleId: 'bili-opt-space-modules',
  },
];

let batchMode = false;
const selectedItems = new Set();

async function injectBatchBar() {
  const container = await waitForElement('.fav-video-list, .favlist-main .fav-video-list', 5000);
  if (!container) return;
  if (document.querySelector('.bili-opt-batch-bar')) return;

  const bar = document.createElement('div');
  bar.className = 'bili-opt-batch-bar';

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'bili-opt-btn-select';
  toggleBtn.id = 'bili-opt-toggle-batch';
  toggleBtn.textContent = '开启批量选择';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'bili-opt-btn-delete';
  deleteBtn.id = 'bili-opt-delete-selected';
  deleteBtn.style.display = 'none';
  deleteBtn.textContent = '删除选中';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'bili-opt-btn-cancel';
  cancelBtn.id = 'bili-opt-cancel-batch';
  cancelBtn.style.display = 'none';
  cancelBtn.textContent = '取消';

  const countSpan = document.createElement('span');
  countSpan.className = 'bili-opt-count';
  countSpan.style.cssText = 'display:none;font-size:13px;color:#999;';
  const countB = document.createElement('b');
  countB.textContent = '0';
  countSpan.appendChild(document.createTextNode('已选择 '));
  countSpan.appendChild(countB);
  countSpan.appendChild(document.createTextNode(' 项'));

  bar.appendChild(toggleBtn);
  bar.appendChild(deleteBtn);
  bar.appendChild(cancelBtn);
  bar.appendChild(countSpan);

  container.parentElement.insertBefore(bar, container);

  toggleBtn.addEventListener('click', () => {
    batchMode = !batchMode;
    toggleBatchMode(container);
  });

  deleteBtn.addEventListener('click', () => {
    if (selectedItems.size === 0) return;
    if (confirm('确定删除选中的 ' + selectedItems.size + ' 个视频？')) {
      deleteSelectedItems();
    }
  });

  cancelBtn.addEventListener('click', () => {
    batchMode = false;
    toggleBatchMode(container);
  });

  log('收藏夹批量操作栏已注入');
}

function toggleBatchMode(container) {
  const toggleBtn = document.getElementById('bili-opt-toggle-batch');
  const deleteBtn = document.getElementById('bili-opt-delete-selected');
  const cancelBtn = document.getElementById('bili-opt-cancel-batch');
  const countSpan = document.querySelector('.bili-opt-count');

  if (batchMode) {
    toggleBtn.textContent = '全选';
    deleteBtn.style.display = '';
    cancelBtn.style.display = '';
    countSpan.style.display = '';
    container.querySelectorAll('.fav-video-item, .video-list-item').forEach((item) => {
      item.style.cursor = 'pointer';
      item.addEventListener('click', onItemToggle);
    });
  } else {
    toggleBtn.textContent = '开启批量选择';
    deleteBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
    countSpan.style.display = 'none';
    selectedItems.clear();
    container.querySelectorAll('.bili-opt-selected').forEach((el) => el.classList.remove('bili-opt-selected'));
    container.querySelectorAll('.fav-video-item, .video-list-item').forEach((item) => {
      item.style.cursor = '';
      item.removeEventListener('click', onItemToggle);
    });
  }
}

function onItemToggle(e) {
  if (!batchMode) return;
  const item = e.currentTarget;
  if (selectedItems.has(item)) {
    selectedItems.delete(item);
    item.classList.remove('bili-opt-selected');
  } else {
    selectedItems.add(item);
    item.classList.add('bili-opt-selected');
  }
  updateCount();
}

function updateCount() {
  const countEl = document.querySelector('.bili-opt-count b');
  if (countEl) countEl.textContent = String(selectedItems.size);
}

function deleteSelectedItems() {
  selectedItems.forEach((item) => {
    const delBtn = item.querySelector('.fav-delete, [title="删除"]');
    if (delBtn) delBtn.click();
  });
  selectedItems.clear();
  updateCount();
  log('批量删除完成');
}

function markInvalidVideos() {
  document.querySelectorAll('.fav-video-item, .video-list-item').forEach((item) => {
    const invalid = item.querySelector('.invalid, [class*="invalid"], .fav-invalid');
    const text = item.textContent || '';
    if (invalid || text.includes('已失效') || text.includes('失效')) {
      item.classList.add('bili-opt-invalid');
    }
  });
  log('失效视频标记完成');
}

export function initSpacePage() {
  purifier.register('space', rules);
}
