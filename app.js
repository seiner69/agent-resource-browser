'use strict';
(() => {
  const el = id => document.getElementById(id);
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  try {
    const { resources, snapshot_date } = ResourceBrowser.validate(globalThis.RESOURCE_DATA);
    el('date').textContent = snapshot_date;
    el('total').textContent = resources.length;
    el('featured-total').textContent = resources.filter(x => x.priority > 0).length;
    el('groups').textContent = new Set(resources.map(x => x.group)).size;
    [...new Set(resources.map(x => x.topic))].sort((a,b) => a.localeCompare(b, 'zh-CN')).forEach(topic => {
      const option = make('option', '', topic); option.value = topic; el('topic').appendChild(option);
    });
    let limit = 80;
    function render() {
      const filtered = ResourceBrowser.select(resources, { query: el('query').value,
        vendor: el('vendor').value, topic: el('topic').value, featured: el('featured').checked });
      el('count').textContent = `找到 ${filtered.length} 条 · 显示 ${Math.min(limit, filtered.length)} 条 · 共 ${resources.length} 条资料`;
      el('empty').hidden = filtered.length > 0;
      const fragment = document.createDocumentFragment();
      for (const item of filtered.slice(0, limit)) {
        const card = make('article', 'card');
        const meta = make('div', 'meta');
        meta.append(make('span', `vendor ${item.vendor === 'Anthropic' ? 'anthropic' : ''}`, item.vendor),
          make('span', 'badge', item.topic), make('span', '', item.kind));
        if (item.priority) meta.append(make('span', '', '精选入口'));
        const title = make('h2');
        const link = make('a', '', item.title);
        link.href = item.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
        title.append(link);
        card.append(meta, title, make('div', 'group', item.group), make('div', 'path', new URL(item.url).hostname));
        fragment.append(card);
      }
      el('cards').replaceChildren(fragment);
      el('more').hidden = filtered.length <= limit;
    }
    ['query', 'vendor', 'topic', 'featured'].forEach(id => {
      el(id).addEventListener(id === 'query' ? 'input' : 'change', () => { limit = 80; render(); });
    });
    el('all').onclick = () => { el('featured').checked = false; limit = 80; render(); };
    el('reset').onclick = () => {
      el('query').value = ''; el('vendor').value = ''; el('topic').value = '';
      el('featured').checked = true; limit = 80; render();
    };
    el('more').onclick = () => { limit += 80; render(); };
    render();
  } catch {
    el('count').textContent = '资料加载失败，请检查数据格式并重新构建。';
    document.querySelectorAll('input, select, button').forEach(node => { node.disabled = true; });
  }
})();
