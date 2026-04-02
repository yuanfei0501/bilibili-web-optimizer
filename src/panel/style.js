export const panelCSS = `
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .overlay {
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: transparent;
    z-index: 2147483647;
    display: flex;
    justify-content: flex-start;
    transition: opacity 0.3s ease;
  }

  .overlay.peeking {
    opacity: 0.03;
  }

  .panel {
    width: 340px;
    max-width: 90vw;
    height: 100vh;
    background: #fff;
    color: #333;
    display: flex;
    flex-direction: column;
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.08);
    animation: slideIn 0.3s ease;
  }

  @keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    font-size: 16px;
    font-weight: 600;
    color: #222;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .eye-btn, .panel-close {
    background: none;
    border: none;
    color: #999;
    font-size: 18px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .eye-btn:hover, .panel-close:hover { background: rgba(0, 0, 0, 0.06); color: #333; }
  .eye-btn svg { width: 18px; height: 18px; }

  .tabs {
    display: flex;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    overflow-x: auto;
  }
  .tabs::-webkit-scrollbar { display: none; }

  .tab {
    padding: 10px 16px;
    font-size: 13px;
    color: #888;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    white-space: nowrap;
    transition: all 0.2s;
  }
  .tab:hover { color: #333; }
  .tab.active { color: #00a1d6; border-bottom-color: #00a1d6; }

  .tab-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }
  .tab-content::-webkit-scrollbar { width: 4px; }
  .tab-content::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.08); border-radius: 2px; }

  .tab-page { display: none; }
  .tab-page.active { display: block; }

  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  }
  .setting-item:last-child { border-bottom: none; }

  .setting-info { flex: 1; margin-right: 12px; }
  .setting-name { font-size: 14px; color: #333; margin-bottom: 2px; }
  .setting-desc { font-size: 12px; color: #999; }

  .toggle { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle-slider {
    position: absolute; cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background: #ddd; border-radius: 24px; transition: 0.3s;
  }
  .toggle-slider::before {
    content: "";
    position: absolute; height: 18px; width: 18px;
    left: 3px; bottom: 3px;
    background: #fff; border-radius: 50%; transition: 0.3s;
  }
  .toggle input:checked + .toggle-slider { background: #00a1d6; }
  .toggle input:checked + .toggle-slider::before { transform: translateX(20px); }

  .panel-footer {
    padding: 16px 20px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }
  .btn-reset {
    width: 100%; padding: 10px;
    background: rgba(0, 0, 0, 0.04); color: #fb7299;
    border: none; border-radius: 8px;
    font-size: 14px; cursor: pointer;
    transition: background 0.2s;
  }
  .btn-reset:hover { background: rgba(0, 0, 0, 0.08); }
`;
