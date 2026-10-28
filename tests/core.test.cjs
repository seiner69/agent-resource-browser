const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { validate, select, safeUrl } = require('../core.js');
const source = require('../data/resources.json');
const sample = { snapshot_date: '2026-10-26', resources: [
  { vendor: 'OpenAI', group: '示例', topic: '工具', kind: '文档', title: 'MCP Tools', url: 'https://openai.com/example', priority: 2 },
  { vendor: 'Anthropic', group: '示例', topic: '工具', kind: '文档', title: 'MCP Reference', url: 'https://claude.com/example', priority: 1 },
  { vendor: 'OpenAI', group: '示例', topic: '记忆', kind: '文档', title: 'Memory', url: 'https://openai.com/memory', priority: 0 }
] };
test('快照条目全部符合 schema、来源白名单和唯一性约束', () => {
  assert.equal(validate(source), source); assert.equal(source.resources.length, 1162);
  assert.equal(source.resources.filter(x => x.priority > 0).length, 62);
});
test('拒绝危险协议、伪域名、凭据、非官方 GitHub owner 和带参数链接', () => {
  for (const url of ['javascript:alert(1)', 'https://openai.com.evil.test/a', 'https://a:b@openai.com/a',
    'https://github.com/unknown/repo', 'https://openai.com/a?token=x', 'file:///test', 'https://openai.com:8080/a']) assert.equal(safeUrl(url), false);
  assert.equal(safeUrl('https://github.com/openai/openai-agents-python'), true);
});
test('拒绝重复、额外字段、无效文本与非整数优先级', () => {
  assert.throws(() => validate({ ...sample, resources: [sample.resources[0], sample.resources[0]] }));
  for (const patch of [{ title: '' }, { reading_note: '不在公开 schema 内' }, { priority: -1 }, { priority: 1.5 }, { vendor: 'unknown' }]) {
    assert.throws(() => validate({ ...sample, resources: [{ ...sample.resources[0], ...patch }] }));
  }
});
test('多词搜索忽略大小写，组合厂商和主题筛选，精选排序不修改输入', () => {
  const before = JSON.stringify(sample);
  assert.deepEqual(select(sample.resources, { query: ' mCp   tools ', vendor: 'OpenAI', topic: '工具' }).map(x => x.title), ['MCP Tools']);
  assert.deepEqual(select(sample.resources).map(x => x.priority), [1, 2]);
  assert.equal(select(sample.resources, { featured: false }).length, 3);
  assert.equal(select(sample.resources, { query: 'unmatched' }).length, 0);
  assert.equal(JSON.stringify(sample), before);
});
test('离线 JS 数据与可下载 JSON 完全一致', () => {
  const sandbox = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../data/resources.js'), 'utf8'), sandbox);
  assert.deepEqual(JSON.parse(JSON.stringify(sandbox.RESOURCE_DATA)), source);
});
