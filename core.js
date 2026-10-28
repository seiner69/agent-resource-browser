(function (root) {
  'use strict';
  const hosts = new Set([
    'developers.openai.com', 'openai.com', 'openai.github.io', 'learn.chatgpt.com',
    'webinar.openai.com', 'cdn.openai.com', 'www.anthropic.com', 'claude.com',
    'platform.claude.com', 'code.claude.com', 'academy.claude.com',
    'resources.anthropic.com', 'agentskills.io', 'modelcontextprotocol.io', 'github.com'
  ]);
  const vendors = new Set(['OpenAI', 'Anthropic', '共同生态']);
  function safeUrl(value) {
    try {
      const url = new URL(value);
      return typeof value === 'string' && value.length <= 2048 &&
        !/\s/.test(value) && url.protocol === 'https:' && hosts.has(url.hostname) &&
        !url.username && !url.password && !url.port && !url.search && !url.hash &&
        (url.hostname !== 'github.com' || /^\/(openai|anthropics)\/[^/]+/.test(url.pathname));
    } catch { return false; }
  }
  function validate(source) {
    if (!source || !/^\d{4}-\d{2}-\d{2}$/.test(source.snapshot_date) ||
        !Array.isArray(source.resources) || source.resources.length > 10000) {
      throw new Error('资料库结构或快照日期无效');
    }
    const urls = new Set();
    const fields = ['vendor', 'group', 'topic', 'kind', 'title', 'url', 'priority'];
    for (const item of source.resources) {
      if (!item || Object.keys(item).some(key => !fields.includes(key)) ||
          !vendors.has(item.vendor) || !safeUrl(item.url) ||
          !Number.isInteger(item.priority) || item.priority < 0 || item.priority > 10000 ||
          ['group', 'topic', 'kind', 'title'].some(key => typeof item[key] !== 'string' ||
            !item[key].trim() || item[key].length > 500 || /[\x00-\x1f\x7f]/.test(item[key]))) {
        throw new Error('条目含无效字段或不允许的链接');
      }
      const canonical = new URL(item.url).href;
      if (urls.has(canonical)) throw new Error('存在重复链接');
      urls.add(canonical);
    }
    return source;
  }
  function select(resources, { query = '', vendor = '', topic = '', featured = true } = {}) {
    const words = String(query).trim().toLowerCase().split(/\s+/).filter(Boolean);
    return resources.filter(item => (!vendor || item.vendor === vendor) &&
      (!topic || item.topic === topic) && (!featured || item.priority > 0) &&
      words.every(word => [item.title, item.group, item.topic, item.url].join(' ').toLowerCase().includes(word)))
      .sort((a, b) => (a.priority || 10001) - (b.priority || 10001) ||
        a.vendor.localeCompare(b.vendor, 'en') || a.title.localeCompare(b.title, 'en'));
  }
  const api = { safeUrl, validate, select };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ResourceBrowser = api;
})(globalThis);
