---
title: 工具
date: 2026-04-17 00:00:00
comments: true
---

<div class="vemiy-tools-page">
  <input id="vemiyToolsSearch" class="vemiy-tools-search" type="text" placeholder="搜索工具...">
  <div id="vemiyToolsList" class="vemiy-tools-list"><!-- tools-list --></div>
  <div id="vemiyToolsEmpty" class="vemiy-tools-empty">没有匹配的工具。</div>
</div>

<style>
  /* 工具列表页样式 */
  .vemiy-tools-page {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0.5rem 0 1rem;
  }
  .vemiy-tools-page * {
    box-sizing: border-box;
  }
  .vemiy-tools-search {
    width: 100%;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.05);
    color: inherit;
    outline: none;
    transition: 0.2s;
    padding: 0.82rem 1rem;
    font-size: 0.95rem;
    margin-bottom: 1rem;
  }
  .vemiy-tools-search:focus {
    border-color: #49b1f5;
    box-shadow: 0 0 0 3px rgba(73, 177, 245, 0.12);
  }
  .vemiy-tools-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.8rem;
  }
  .vemiy-tools-item {
    display: flex;
    align-items: flex-start;
    min-width: 0;
    gap: 0.9rem;
    text-decoration: none !important;
    color: inherit !important;
    padding: 1rem 1.1rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    background: rgba(30, 30, 30, 0.6);
    box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.2);
    transition: 0.2s;
  }
  .vemiy-tools-item:hover {
    color: inherit !important;
    text-decoration: none !important;
    border-color: rgba(255, 255, 255, 0.18);
    transform: translateY(-2px);
  }
  .vemiy-tools-icon {
    width: 22px;
    flex-shrink: 0;
    opacity: 0.92;
    margin-top: 0.02rem;
    text-align: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .vemiy-tools-icon svg {
    width: 1.1em;
    height: 1.1em;
    fill: currentColor;
    display: block;
  }
  .vemiy-tools-text {
    min-width: 0;
    flex: 1;
  }
  .vemiy-tools-name {
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.5;
    margin-bottom: 0.18rem;
  }
  .vemiy-tools-desc {
    font-size: 0.88rem;
    line-height: 1.7;
    opacity: 0.68;
  }
  .vemiy-tools-empty {
    display: none;
    padding: 1rem 0.15rem;
    font-size: 0.9rem;
    opacity: 0.65;
  }
  @media (max-width: 640px) {
    .vemiy-tools-list {
      grid-template-columns: 1fr;
    }
    .vemiy-tools-search {
      font-size: 0.92rem;
      padding: 0.75rem 0.9rem;
    }
    .vemiy-tools-name {
      font-size: 0.96rem;
    }
    .vemiy-tools-desc {
      font-size: 0.84rem;
    }
    .vemiy-tools-item {
      gap: 0.75rem;
    }
    .vemiy-tools-icon {
      width: 20px;
    }
  }
</style>
