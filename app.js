/* 鲜知 FreshSense — 手机 App 交互逻辑（无构建步骤，原生 ES） */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // 内联 SVG 图标（避免部分设备上 emoji 渲染成方框）
  const svg = (paths, size) => `<svg width="${size || 20}" height="${size || 20}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const ICON = {
    x: svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 20),
    home: svg('<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>', 22),
    book: svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>', 22),
    cart: svg('<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>', 22),
    gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.65 1.65 0 0 0-1.8-.3 1.65 1.65 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.65 1.65 0 0 0-1-1.5 1.65 1.65 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.65 1.65 0 0 0 .3-1.8 1.65 1.65 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.65 1.65 0 0 0 1.5-1 1.65 1.65 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.65 1.65 0 0 0 1.8.3H9a1.65 1.65 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.65 1.65 0 0 0 1 1.5 1.65 1.65 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.65 1.65 0 0 0-.3 1.8V9a1.65 1.65 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.65 1.65 0 0 0-1.5 1z"/>', 22),
    snow: svg('<path d="M12 2v20M4.9 6.5l14.2 11M19.1 6.5 4.9 17.5M12 2l-2 2m2-2 2 2m-2 18-2-2m2 2 2-2"/>', 18),
    fridge: svg('<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M5 10h14M9 6v2M9 14v3"/>', 18),
    leaf: svg('<path d="M11 20A7 7 0 0 1 4 13c0-6 7-11 16-11 0 9-5 16-11 16z"/><path d="M4 20c3-5 8-9 14-11"/>', 18),
    box: svg('<path d="m21 8-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>', 18)
  };

  const appEl = $('#app-content');
  const tabEl = $('#app-tabbar');
  const modalRoot = $('#modal-root');
  const toastRoot = $('#toast-root');

  // 分区图标用 SVG，避免 emoji 在某些设备渲染成方框
  function layerIcon(layer) {
    if (layer === '冷冻室') return ICON.snow;
    if (layer === '果蔬抽屉') return ICON.leaf;
    if (layer === '冷藏室下层') return ICON.box;
    if (layer === '冷藏室上层') return ICON.snow;
    return ICON.fridge;
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    toastRoot.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }

  /* ==================== 手机 App ==================== */
  const TABS = [
    { key: 'home', icon: ICON.home, label: '首页' },
    { key: 'fridge', icon: ICON.fridge, label: '食材' },
    { key: 'recipes', icon: ICON.book, label: '食谱' },
    { key: 'restock', icon: ICON.cart, label: '补货' },
    { key: 'device', icon: ICON.gear, label: '我的' }
  ];

  function renderApp() {
    const page = STATE.appPage;
    if (page === 'nfc') appEl.innerHTML = pageNfc();
    else if (page === 'home') appEl.innerHTML = pageHome();
    else if (page === 'fridge') appEl.innerHTML = pageFridge();
    else if (page === 'recipes') appEl.innerHTML = pageRecipes();
    else if (page === 'recipe') appEl.innerHTML = pageRecipe();
    else if (page === 'restock') appEl.innerHTML = pageRestock();
    else if (page === 'product') appEl.innerHTML = pageProduct();
    else if (page === 'cart') appEl.innerHTML = pageCart();
    else if (page === 'device') appEl.innerHTML = pageDevice();

    const active = (page === 'recipe') ? 'recipes' : (page === 'product' || page === 'cart') ? 'restock' : page;
    tabEl.innerHTML = TABS.map(t => `<button class="tab ${active === t.key ? 'active' : ''}" data-tab="${t.key}"><span class="tab-ico">${t.icon}</span>${t.label}</button>`).join('');
    $$('[data-app-route]').forEach(b => b.classList.toggle('active', b.dataset.appRoute === page));
    // 从首页分区卡片进入时，滚动定位到对应分区
    if (page === 'fridge' && STATE.focusLayer) {
      setTimeout(() => {
        const target = appEl.querySelector(`.fd-layer[data-layer="${CSS.escape(STATE.focusLayer)}"]`);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 40);
    }
  }

  function pageNfc() {
    const pending = STATE.restock.filter(r => r.status === '待补');
    return `<div class="nfc-hero">
        <div class="nfc-success">✓</div>
        <h2>已连接你的冰箱</h2>
        <p>这是冰箱里最新的食材情况</p>
      </div>
      <div class="result-card">
        <div class="result-card-head"><div class="rc-icon">📋</div><div><h4>补货清单</h4><p>${pending.length} 项待补货</p></div></div>
        <div class="result-card-body">
          ${pending.slice(0,3).map(r => `<div class="mini-line"><span>${r.source === '快到期提醒' ? '⏰' : '📝'}</span><span class="ml-name">${esc(r.name)} ×${r.suggestQty}${esc(r.unit)}</span><span class="muted">${sourceLabel(r.source)}</span></div>`).join('')}
          <button class="btn btn-primary btn-block" data-go="restock" style="margin-top:10px">查看完整清单</button>
        </div>
      </div>
      <div class="result-card">
        <div class="result-card-head"><div class="rc-icon" style="background:var(--yellow-soft)">🍳</div><div><h4>今日食谱推荐</h4><p>先用掉快到期的食材</p></div></div>
        <div class="result-card-body">
          ${RECIPES.slice(0,2).map(r => `<button class="mini-line" data-recipe="${r.id}" style="width:100%;text-align:left"><span>${r.emoji}</span><span class="ml-name">${esc(r.name)} · ${r.minutes} 分钟</span><span style="color:var(--green-deep);font-size:13px">${r.expiring.length ? '快到期优先' : '查看'}</span></button>`).join('')}
        </div>
      </div>`;
  }

  function pageHome() {
    // 一周内将过期（含已过期 0 天到 7 天），按天数分组，用户点天数查看状态
    const weekItems = ITEMS.filter(i => i.remainingDays >= 0 && i.remainingDays <= 7);
    const byDay = d => weekItems.filter(i => i.remainingDays === d);
    const dayCounts = [0,1,2,3,4,5,6,7].map(d => ({ d, n: byDay(d).length }));
    const sel = STATE.expiryDay;
    const dayItems = byDay(sel);
    const layerCards = LAYERS.map((layer) => {
      const its = ITEMS.filter(i => i.layer === layer);
      const meta = LAYER_META[layer];
      const shown = its.slice(0, 2);
      const more = its.length - shown.length;
      return `<button class="layer-mini" data-action="go-layer" data-layer="${esc(layer)}">
        <div class="lm-top"><span class="lm-name">${layerIcon(layer)} ${esc(layer)}</span><span class="lm-count">${its.length} 件</span></div>
        <div class="lm-tags">${shown.map(i => `<span class="lm-tag ${i.freshness}"><i></i><span>${esc(i.name)}</span><b>${i.remainingDays === 0 ? '已过期' : i.remainingDays + '天'}</b></span>`).join('') || '<span class="lm-tag none">还空着</span>'}</div>
        <span class="lm-open">${more > 0 ? `还有 ${more} 样 · 查看全部` : '查看食材'} ›</span>
      </button>`;
    }).join('');
    return `<div class="app-hero">
        <h2>早上好，今天想吃些什么</h2>
        <p>冰箱里有 ${ITEMS.length} 件食材，看看有什么能做的</p>
      </div>
      <button class="ai-entry" data-action="add-open" data-mode="text" style="margin-bottom:14px">
        <div class="ai-entry-top"><span class="ai-orb">＋</span><div class="grow"><h4>记一笔食材</h4><p>说一句、拍张小票，都能记下来</p></div><span class="ai-arrow">›</span></div>
      </button>
      <div class="alert-banner">
        <span class="ab-ico">⏰</span>
        <div class="grow"><h4>这些食材快到期了（${weekItems.length} 件）</h4>
          <p>看看哪天到期的，早点吃掉它们</p>
          <div class="expiry-tabs">
            ${dayCounts.map(x => `<button class="expiry-tab ${sel === x.d ? 'active' : ''}" data-action="expiry-day" data-day="${x.d}">${x.d === 0 ? '已过期' : x.d + '天'}<i>${x.n}件</i></button>`).join('')}
          </div>
          <div class="expiry-list-mini">
            ${dayItems.length ? dayItems.map(i => `<div class="expiry-mini-row">
              <span class="em-ico">${i.icon}</span><span class="em-name">${esc(i.name)}</span>
              <span class="em-meta">${i.remainingDays === 0 ? '已过期' : FRESHNESS[i.freshness].label} · ${i.quantity}${esc(i.unit)}</span>
            </div>`).join('') : '<div class="expiry-none">这天没有快到期的食材</div>'}
          </div>
        </div>
      </div>
      <div class="sec-title">冰箱分区 <span class="more">点开看看每格有什么</span></div>
      <div class="layer-summary">${layerCards}</div>`;
  }

  // 手机端冰箱食材库：下单同步后可直接查看新入库食材
  function pageFridge() {
    const urgent = ITEMS.filter(i => i.remainingDays <= 2).length;
    const layers = LAYERS.map((layer) => {
      const its = ITEMS.filter(i => i.layer === layer);
      const meta = LAYER_META[layer];
      const focused = STATE.focusLayer === layer ? ' focused' : '';
      return `<div class="fd-layer${focused}" data-layer="${esc(layer)}">
        <div class="fd-layer-head"><h4>${layerIcon(layer)} ${esc(layer)}</h4><span class="fd-temp">${meta.temp} · ${its.length} 件</span></div>
        <div class="fd-list">
          ${its.map(i => `<div class="fd-item ${i.freshness}">
            <span class="fd-emoji">${i.icon}</span>
            <div class="fd-info">
              <div class="fd-name">${esc(i.name)} <span class="pill-tag ${i.freshness}">${i.remainingDays === 0 ? '已过期' : FRESHNESS[i.freshness].label}</span></div>
              <div class="fd-meta">保质至 ${esc(i.expiryDate)} · ${i.quantity}${esc(i.unit)}</div>
            </div>
            <div class="fd-days ${i.freshness}"><b>${i.remainingDays === 0 ? '!' : i.remainingDays}</b><small>${i.remainingDays === 0 ? '过期' : '天'}</small></div>
          </div>`).join('') || '<div class="muted" style="padding:8px">这层还空着</div>'}
        </div>
      </div>`;
    }).join('');
    return `<div class="fridge-hero">
        <h2>我的冰箱</h2>
        <p>${ITEMS.length} 件食材${urgent ? ` · ${urgent} 件快到期` : ''}</p>
      </div>
      <button class="add-entry" data-action="add-open">＋ 添加食材 <span style="opacity:.75">手动 / 一句话 / 拍小票</span></button>
      <div class="temp-banner">
        <span class="temp-chip"><i style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--green);margin-right:4px"></i>新鲜</span>
        <span class="temp-chip"><i style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--yellow);margin-right:4px"></i>还剩 2 天</span>
        <span class="temp-chip warn"><i style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--red);margin-right:4px"></i>还剩 1 天 / 已过期</span>
      </div>
      ${layers}
      <div class="al-foot">快到期的食材会用黄色、红色标出来</div>`;
  }

  function pageRecipes() {
    return `<div class="app-hero"><h2>今日食谱</h2><p>优先用掉快到期的食材</p></div>
      <div class="ai-entry" data-action="ai-open">
        <div class="ai-entry-top"><span class="ai-orb">🍳</span><div><h4>今天吃什么</h4><p>说个菜名，帮你看看冰箱里缺什么</p></div><span class="ai-arrow">›</span></div>
        <div class="ai-entry-chips"><span>番茄炒蛋</span><span>香煎三文鱼</span><span>豆腐汤</span></div>
      </div>
      <div class="sec-title">全部食谱 <span class="more">共 ${RECIPES.length} 道</span></div>
      ${RECIPES.map(r => `<button class="result-card" data-recipe="${r.id}" style="width:100%;text-align:left">
        <div style="display:flex;gap:12px;padding:12px;align-items:center">
          <div style="width:56px;height:56px;border-radius:14px;background:${r.thumb};display:grid;place-items:center;font-size:28px">${r.emoji}</div>
          <div class="grow"><div style="font-size:13px;font-weight:700">${esc(r.name)}</div>
            <div class="muted" style="margin-top:3px">⏱ ${r.minutes} 分钟 · ${r.ingredients.filter(x=>x.have).length}/${r.ingredients.length} 食材已有</div>
            ${r.expiring.length ? `<span class="pill-tag yellow" style="margin-top:5px;display:inline-block">能用掉快到期食材：${r.expiring.map(esc).join('、')}</span>` : ''}
          </div><span style="color:var(--muted)">›</span>
        </div></button>`).join('')}`;
  }

  function pageRecipe() {
    const r = RECIPES.find(x => x.id === STATE.recipeId) || RECIPES[0];
    return `<button class="muted" data-go="recipes" style="margin-bottom:10px;font-size:13px">‹ 返回食谱列表</button>
      <div class="recipe-banner" style="background:${r.thumb}"><span class="rb-emoji">${r.emoji}</span><h2>${esc(r.name)}</h2><p>⏱ ${r.minutes} 分钟 · 5 星好评</p></div>
      ${r.expiring.length ? `<div class="expiring-tip">⏰ <span>用得快到期的食材：<b>${r.expiring.map(esc).join('、')}</b>，今天做正合适</span></div>` : ''}
      <div class="sec-title">所需食材 <span class="more">标注「已有 / 需补充」</span></div>
      <div class="card">${r.ingredients.map(ing => `<div class="ing-item">
          <span class="ing-check ${ing.have ? 'have' : 'miss'}">${ing.have ? '✓' : '+'}</span>
          <span class="ing-name">${esc(ing.name)}</span>
          ${r.expiring.includes(ing.name) ? '<span class="pill-tag yellow">快到期</span>' : ''}
          <span class="ing-flag ${ing.have ? 'have' : 'miss'}">${ing.have ? '已有' : '需补充'}</span>
        </div>`).join('')}</div>
      ${r.ingredients.some(x => !x.have) ? `<button class="btn btn-primary btn-block" data-add-missing="${r.id}" style="margin-top:12px">把缺的食材加入补货清单</button>` : ''}
      <div class="sec-title">做法步骤</div>
      <div class="card">${r.steps.map((s, i) => `<div class="step-item"><span class="step-num">${i+1}</span><span>${esc(s)}</span></div>`).join('')}</div>`;
  }

  function pageRestock() {
    const list = STATE.restock;
    const selected = list.filter(r => STATE.checked.has(r.id));
    return `<div class="app-hero"><h2>补货清单</h2><p>冰箱里缺的都在这里，买完回来更新</p></div>
      <button class="pupu-entry" data-action="pupu-open">
        <span class="pu-logo">朴</span>
        <span class="pu-txt"><h4>去朴朴超市采购</h4><p>买完回来点一下就好</p></span>
        <span class="pu-go">前往 ›</span>
      </button>
      <div class="row" style="margin-bottom:12px;gap:6px;flex-wrap:wrap">
        <span class="pill-tag gray">来源：快到期提醒 · 手动 · 食谱</span>
        <span class="pill-tag gray" style="margin-left:auto">${list.filter(r=>r.status==='待补').length} 项待补</span>
      </div>
      ${list.map(r => {
        const checked = STATE.checked.has(r.id);
        return `<div class="restock-item ${checked ? 'checked' : ''} ${r.status === '暂不补货' ? 'skipped' : ''}">
          <div class="r-check ${checked ? 'on' : ''}" data-action="toggle-check" data-id="${r.id}">${checked ? '✓' : ''}</div>
          <span class="r-emoji">${emojiFor(r.name)}</span>
          <div class="grow"><div class="r-name">${esc(r.name)}</div><div class="r-meta">建议 ${r.suggestQty}${esc(r.unit)} · <span class="source-tag">${sourceLabel(r.source)}</span></div></div>
          ${r.status === '已加购' ? '<span class="r-status done">已加购</span>' : r.status === '暂不补货' ? '<span class="r-status skip">暂不补货</span>' : ''}
        </div>`;
      }).join('')}
      <div class="sec-title">顺手逛逛 <span class="more">点开看看冰箱里还有没有</span></div>
      <div class="row" style="gap:8px;flex-wrap:wrap">
        ${PRODUCTS.slice(0,4).map(p => `<button class="chip" data-product="${p.sku}" style="font-size:13px">${p.emoji} ${esc(p.name)}</button>`).join('')}
      </div>
      <div class="cart-bar">
        <div class="summary-line"><span>已勾选 <b>${selected.length}</b> 项 · 购物车 ${STATE.cart.length} 件</span><span class="muted">冰箱里还有的会提醒你</span></div>
        <div class="row" style="gap:8px">
          <button class="btn btn-ghost grow" data-go="cart">查看购物车</button>
          <button class="btn btn-primary grow" data-action="restock-add-cart">加入购物车</button>
        </div>
      </div>`;
  }

  function pageProduct() {
    const p = PRODUCTS.find(x => x.sku === STATE.productSku) || PRODUCTS[0];
    const dup = checkDuplicate(p.sku);
    return `<button class="muted" data-go="restock" style="margin-bottom:10px;font-size:13px">‹ 返回</button>
      <div class="product-hero">${p.emoji}</div>
      <div class="product-title">${esc(p.name)}</div>
      <div class="price">¥${p.price.toFixed(2)}</div>
      ${dup && dup.hit ? `<div class="dup-banner">
          <span class="db-ico">🥬</span><div><h4>冰箱里还有这个食材</h4>
          <p>还有 ${dup.item.quantity}${esc(dup.item.unit)}，保质期至 ${esc(dup.item.expiryDate)}，暂时不用买。</p></div>
        </div>` : dup && dup.guideRestock ? `<div class="expiring-tip">⏰ ${esc(dup.name)} 快吃完了，可以补货了</div>` : ''}
      <div class="card" style="margin-bottom:12px">
        <div class="muted" style="line-height:1.7">新鲜直达，源头直采。加入购物车时会提醒你冰箱里有没有，避免重复购买。</div>
      </div>
      <div class="row" style="gap:8px;margin-top:12px">
        <button class="btn btn-ghost grow" data-go="cart">查看购物车</button>
        <button class="btn btn-primary grow" data-action="product-add" data-sku="${p.sku}">加入购物车</button>
      </div>`;
  }

  function pageCart() {
    const dupCount = STATE.cart.filter(c => checkDuplicate(c.sku)?.hit).length;
    return `<div class="app-hero"><h2>购物车</h2><p>共 ${STATE.cart.length} 件商品</p></div>
      ${dupCount ? `<div class="cart-top-alert">🥬 有 <b>${dupCount}</b> 样冰箱里还有，建议先看看再下单</div>` : ''}
      ${STATE.cart.length ? STATE.cart.map((c, idx) => {
        const dup = checkDuplicate(c.sku);
        return `<div class="cart-row">
          <span class="cr-emoji">${emojiFor(c.name)}</span>
          <div class="grow"><div class="cr-name">${esc(c.name)}</div>
            ${dup && dup.hit ? `<span class="cart-inline">冰箱里还有 ${dup.item.quantity}${esc(dup.item.unit)}</span>` : ''}
          </div>
          <div class="qty-ctrl"><button data-action="cart-qty" data-idx="${idx}" data-d="-1">−</button><span>${c.qty}</span><button data-action="cart-qty" data-idx="${idx}" data-d="1">+</button></div>
        </div>`;
      }).join('') : `<div class="card" style="text-align:center;padding:30px;color:var(--muted)">购物车是空的，去补货清单看看？</div>`}
      <div class="cart-bar">
        <button class="btn btn-primary btn-block" data-action="checkout">${STATE.cart.length ? '确认下单 · 食材自动入库' : '去挑点食材吧'}</button>
        <button class="btn btn-ghost btn-block" data-go="restock" style="margin-top:8px">继续逛补货清单</button>
      </div>`;
  }

  function pageDevice() {
    const d = STATE.device;
    return `<div class="app-hero"><h2>我的冰箱</h2><p>连接状态 · 使用设置</p></div>
      <div class="device-card">
        <h3>${esc(d.name)}</h3><p>${esc(d.model)} · 已连接</p>
        <div class="device-status">
          <div class="ds-item">在线状态<b>${d.online ? '● 在线' : '○ 离线'}</b></div>
          <div class="ds-item">电量<b>${d.battery}%</b></div>
          <div class="ds-item">上次更新<b>${esc(d.lastSync)}</b></div>
        </div>
      </div>
      <div class="setting-row"><span class="sr-ico">📶</span><div><div class="sr-title">Wi-Fi 连接</div><div class="sr-sub">${esc(d.wifi)} · 已配网</div></div><button class="mini-btn" data-action="go-pairing">重新配网</button></div>
      <div class="setting-row"><span class="sr-ico">📡</span><div><div class="sr-title">碰一碰</div><div class="sr-sub">${d.nfcBound ? '已开启 · 手机靠近冰箱感应区即可查看' : '未开启 · 请靠近冰箱感应区'}</div></div><div class="switch ${d.nfcBound ? 'on' : ''}" data-action="toggle-nfc"></div></div>
      <div class="setting-row"><span class="sr-ico">⚙️</span><div><div class="sr-title">系统版本</div><div class="sr-sub">${esc(d.firmware)} · ${d.firmwareLatest ? '已是最新版本' : '有可用更新'}</div></div></div>
      <div class="setting-row"><span class="sr-ico">🔄</span><div><div class="sr-title">冰箱分区</div><div class="sr-sub">上层 / 中层 / 下层 / 果蔬抽屉 / 冷冻室</div></div></div>
      <button class="btn btn-ghost btn-block" data-action="simulate-nfc" style="margin-top:12px">碰一碰，查看冰箱食材</button>`;
  }

  function emojiFor(name) {
    const map = { '鲜鸡蛋': '🥚', '全脂牛奶': '🥛', '面条': '🍜', '柠檬': '🍋', '原味酸奶': '🥣', '三文鱼': '🐟' };
    return map[name] || '🛒';
  }
  function sourceLabel(s) {
    return ({ '临期自动': '快到期提醒', '手动录入': '手动添加', '手动': '手动添加',
      'App 下单': '刚买的', 'AI 录入': '快速录入', 'NFC 碰一碰': '碰一碰' })[s] || s;
  }
  function skuByName(name) {
    return Object.keys(PRODUCT_MAPPING).find(sku => PRODUCT_MAPPING[sku] === name);
  }

  /* ==================== 重复购买提醒弹窗 ==================== */
  let dupQueue = [];
  function showDuplicateModal(sku, fromRestockId) {
    const dup = checkDuplicate(sku);
    if (!dup || !dup.hit) return false;
    const i = dup.item;
    modalRoot.innerHTML = `<div class="modal-overlay" data-action="close-modal">
      <div class="modal-card" data-stop="1">
        <div class="modal-head">
          <div class="modal-icon">🥬</div>
          <div><h3>冰箱里还有这个食材</h3><p>先看看再决定，不用着急买</p></div>
        </div>
        <div class="dup-detail">
          「<b>${esc(dup.name)}</b>」冰箱里还有 <b>${i.quantity}${esc(i.unit)}</b>，
          保质期至 <b>${esc(i.expiryDate)}</b>，还是新鲜的。
          <div class="dd-row" style="margin-top:8px;border-top:1px dashed #D9E2DC;padding-top:8px">
            <span>还能放</span><span><b style="color:var(--green-deep)">${i.remainingDays} 天</b>，暂时不用补</span>
          </div>
        </div>
        ${dupQueue.length >= 1 ? `<div class="muted" style="margin-bottom:10px;font-size:13px">还有 ${dupQueue.length} 项待确认</div>` : ''}
        <div class="modal-actions">
          <button class="btn btn-ghost" data-action="dup-skip" data-sku="${sku}" data-rid="${fromRestockId || ''}">先不买了</button>
          <button class="btn btn-primary" data-action="dup-buy" data-sku="${sku}" data-rid="${fromRestockId || ''}">仍然购买</button>
        </div>
      </div></div>`;
    return true;
  }
  function closeModal() { modalRoot.innerHTML = ''; }

  /* ============ 下单 → 自动同步到冰箱食材库 ============ */
  function doCheckout() {
    if (!STATE.cart.length) { toast('购物车是空的'); return; }
    const synced = [];
    const filled = [];
    STATE.cart.forEach(c => {
      const newItem = purchaseToItem(c.sku);
      if (!newItem) return;
      const existing = ITEMS.find(i => i.name === newItem.name);
      if (existing) {
        existing.quantity += newItem.quantity;
        existing.purchaseDate = newItem.purchaseDate;
        existing.expiryDate = newItem.expiryDate;
        existing.remainingDays = newItem.remainingDays;
        existing.freshness = 'green';
        existing.freshPct = 100;
        existing.source = 'App 下单';
      } else {
        ITEMS.push(newItem);
      }
      synced.push(newItem);
      // 货已补齐：从补货清单移除对应项，不再显示
      STATE.restock = STATE.restock.filter(r => {
        if (r.name !== newItem.name) return true;
        STATE.checked.delete(r.id);
        if (!filled.includes(r.name)) filled.push(r.name);
        return false;
      });
    });
    STATE.cart = [];
    renderApp();
    showCheckoutModal(synced, filled);
  }

  function showCheckoutModal(synced, filled) {
    modalRoot.innerHTML = `<div class="modal-overlay" data-action="close-modal">
      <div class="modal-card checkout-modal" data-stop="1">
        <div class="ck-head">
          <div class="ck-ok">✓</div>
          <div class="grow"><h3>下单成功</h3><p>买好的食材已经放进冰箱清单</p></div>
          <button class="al-close" data-action="close-checkout" aria-label="关闭">${ICON.x}</button>
        </div>
        <div class="ck-list">
          ${synced.map(i => `<div class="ck-row">
            <span class="ck-emoji">${i.icon}</span>
            <div class="grow"><div class="ck-name">${esc(i.name)} <span class="pill-tag green">已入库</span></div>
              <div class="ck-meta">${esc(i.layer)} · ${i.quantity}${esc(i.unit)} · 保质至 ${esc(i.expiryDate)}</div>
            </div>
            <span class="ck-days">${i.remainingDays}天</span>
          </div>`).join('')}
        </div>
        <div class="ck-tip">到期前会在首页提醒你，也可以随时在「食材」里查看</div>
        ${filled && filled.length ? `<div class="ck-tip ck-tip-done">补货清单里已划掉 ${filled.length} 项：${filled.map(n => esc(n)).join('、')}</div>` : ''}
        <div class="ck-actions">
          <button class="btn btn-primary grow" data-action="view-fridge">查看我的冰箱</button>
          <button class="btn btn-ghost grow" data-action="close-checkout">继续购物</button>
        </div>
      </div>
    </div>`;
  }

  /* ============ 配菜助手（食谱区） ============ */
  // 按冰箱食材判断已有/需补；快到期食材优先推荐
  function aiAnalyzeRecipe(recipe) {
    const have = [], need = [];
    recipe.ingredients.forEach(ing => {
      const name = typeof ing === 'string' ? ing : ing.name;
      const item = ITEMS.find(i => i.name === name) || ITEMS.find(i => name.includes(i.name) || i.name.includes(name));
      if (item) have.push(item); else need.push(name);
    });
    const expiringInRecipe = recipe.ingredients
      .map(ing => typeof ing === 'string' ? ing : ing.name)
      .filter(name => ITEMS.some(i => (i.name === name || name.includes(i.name) || i.name.includes(name)) && i.remainingDays <= 2));
    return { recipe, have, need, expiringInRecipe };
  }

  // 配菜匹配：优先菜名/标签整体匹配（不做单字拆分）→ 计算已有/需补食材
  // 匹配不到时才按冰箱现有食材推荐「最适合做」的菜
  function aiResolveRecipe(query) {
    // 去掉口语前缀，避免「我想吃鱼」被「我想/吃」干扰而匹配错菜
    const q = String(query || '').trim().replace(/^(我想吃|我想要|我想|想吃|来一份|来个|我要|吃|做)/, '').trim();
    const all = RECIPES.map(r => ({ ...r, ingredients: r.ingredients.map(x => x.name) }))
      .concat(AI_DISHES.map(d => ({ id: 'ai-' + d.name, name: d.name, emoji: d.emoji, minutes: d.minutes, tags: d.tags, ingredients: d.ingredients, steps: ['准备好所需食材。', '按家常做法烹饪调味。', '装盘即可享用。'] })));

    let hit = null, mode = 'exact';
    if (q) {
      // 1) 菜名整体相等或互相包含（只在 2 字以上时判断包含，避免单字误命中）
      hit = all.find(d => d.name === q);
      if (!hit && q.length >= 2) hit = all.find(d => d.name.includes(q) || q.includes(d.name));
      // 2) 标签整体匹配：一个标签词要么完整出现在输入里，要么输入完整出现在标签里
      if (!hit) {
        let best = 0;
        all.forEach(d => {
          let score = 0;
          (d.tags || []).forEach(t => {
            if (t.length >= 2 && q.includes(t)) score += t.length * 2;
            else if (t.includes(q)) score += q.length;
          });
          if (score > best) { best = score; hit = d; }
        });
        if (hit) mode = 'keyword';
      }
    }
    // 3) 没写菜名或完全匹配不到：按「冰箱已有食材最多 + 快到期优先」推荐
    let recommended = false;
    if (!hit) {
      const scored = all.map(d => {
        const { have, expiringInRecipe } = aiAnalyzeRecipe(d);
        return { d, score: have.length * 2 + expiringInRecipe.length * 3 };
      }).sort((a, b) => b.score - a.score);
      hit = scored[0].d; recommended = true; mode = 'smart';
    }
    return { recipe: hit, recommended, mode };
  }

  function showAiModal() {
    modalRoot.innerHTML = `<div class="modal-overlay" data-action="close-modal">
      <div class="modal-card ai-modal" data-stop="1">
        <div class="ai-modal-head">
          <span class="ai-orb">🍳</span>
          <div class="grow"><h3>今天吃什么</h3><p>说出想吃的，帮你对照冰箱里的食材</p></div>
          <button class="al-close" data-action="close-ai" aria-label="关闭">${ICON.x}</button>
        </div>
        <div class="ai-input-row">
          <input id="ai-input" class="ai-input" placeholder="想吃什么？比如番茄炒蛋、可乐鸡翅…" />
          <button class="btn btn-primary" data-action="ai-submit">找做法</button>
        </div>
        <div class="ai-chips">
          <button class="ai-chip" data-action="ai-quick" data-q="番茄炒蛋">🍳 番茄炒蛋</button>
          <button class="ai-chip" data-action="ai-quick" data-q="可乐鸡翅">🍗 可乐鸡翅</button>
          <button class="ai-chip" data-action="ai-quick" data-q="减脂餐">🥗 减脂餐</button>
          <button class="ai-chip" data-action="ai-quick" data-q="早餐三明治">🥪 早餐三明治</button>
          <button class="ai-chip" data-action="ai-quick" data-q="我想吃鱼">🐟 我想吃鱼</button>
        </div>
        <div class="ai-footnote">说出菜名或口味，帮你看看冰箱里缺什么</div>
      </div>
    </div>`;
    setTimeout(() => { const el = $('#ai-input'); if (el) el.focus(); }, 50);
  }

  function renderAiResult(query) {
    const { recipe, recommended, mode } = aiResolveRecipe(query);
    STATE.aiDish = recipe;
    const { have, need, expiringInRecipe } = aiAnalyzeRecipe(recipe);
    const chipHtml = have.map(i => `<span class="ai-have-chip ${i.freshness}">${i.icon} ${esc(i.name)} · 剩${i.remainingDays}天</span>`).join('');
    const needHtml = need.length
      ? need.map(n => `<span class="ai-need-chip">＋ ${esc(n)}</span>`).join('')
      : '<span class="ai-none">冰箱食材齐全，无需补货 🎉</span>';
    const expiringTip = expiringInRecipe.length
      ? `<div class="ai-tip">⏰ 这道菜能用掉快到期的食材：<b>${expiringInRecipe.map(esc).join('、')}</b>，今天做正合适</div>` : '';
    modalRoot.innerHTML = `<div class="modal-overlay" data-action="close-modal">
      <div class="modal-card ai-modal ai-result" data-stop="1">
        <div class="ai-modal-head">
          <span class="ai-orb">🍳</span>
          <div class="grow"><h3>配菜结果</h3><p>${mode === 'smart' ? '按冰箱现有食材，给你推荐一道' : mode === 'keyword' ? '按你说的口味，找到这道菜' : '按菜名对照了冰箱里的食材'}</p></div>
          <button class="al-close" data-action="close-ai" aria-label="关闭">${ICON.x}</button>
        </div>
        <div class="ai-dish"><span class="ai-dish-emoji">${recipe.emoji}</span><div><h4>${esc(recipe.name)}</h4><p>⏱ ${recipe.minutes} 分钟 · ${recipe.steps.length} 步完成</p></div></div>
        ${expiringTip}
        <div class="ai-sec"><h5>✅ 冰箱已有（${have.length}）</h5><div class="ai-chips-static">${chipHtml || '<span class="ai-none">暂无</span>'}</div></div>
        <div class="ai-sec"><h5>🛒 需要补充（${need.length}）</h5><div class="ai-chips-static">${needHtml}</div></div>
        <div class="ai-summary">已有 ${have.length} 样 · 需补 ${need.length} 样${expiringInRecipe.length ? ' · 用掉快到期食材 ' + expiringInRecipe.length + ' 样' : ''}</div>
        <div class="ai-actions">
          ${need.length ? `<button class="btn btn-primary grow" data-action="ai-add-restock" data-recipe="${recipe.id}">把需补食材加入补货清单</button>` : ''}
          <button class="btn btn-ghost grow" data-action="ai-view-steps">看详细做法</button>
        </div>
      </div>
    </div>`;
  }

  function showPairGuide() {
    modalRoot.innerHTML = `<div class="modal-overlay" data-action="close-modal">
      <div class="modal-card" data-stop="1">
        <div class="modal-head">
          <div class="modal-icon">📶</div>
          <div class="grow"><h3>重新配网指引</h3><p>按以下步骤完成设备联网</p></div>
          <button class="al-close" data-action="close-app-layer" aria-label="关闭">${ICON.x}</button>
        </div>
        <div class="pair-guide">
          <div class="pg-step"><span class="pg-num">1</span><span>长按冰箱屏幕电源键 3 秒，屏幕亮起后进入配网。</span></div>
          <div class="pg-step"><span class="pg-num">2</span><span>用手机扫描屏幕二维码，连接「鲜知」配网热点，输入家庭 Wi-Fi 密码。</span></div>
          <div class="pg-step"><span class="pg-num">3</span><span>用手机背部靠近冰箱右下角 NFC 感应区，完成设备绑定。</span></div>
          <div class="pg-step"><span class="pg-num">4</span><span>五个区域都准备好了：上层 / 中层 / 下层 / 果蔬抽屉 / 冷冻室。</span></div>
        </div>
        <div class="modal-actions"><button class="btn btn-primary btn-block" data-action="close-app-layer">知道了</button></div>
      </div>
    </div>`;
  }

  // 配菜推荐菜品的详细做法（可能不在固定食谱库里，从 STATE.aiDish 读取）
  function showAiSteps() {
    const r = STATE.aiDish;
    if (!r) { toast('请先选一道菜'); return; }
    modalRoot.innerHTML = `<div class="modal-overlay" data-action="close-modal">
      <div class="modal-card" data-stop="1">
        <div class="modal-head">
          <div class="modal-icon">${r.emoji}</div>
          <div class="grow"><h3>${esc(r.name)}</h3><p>⏱ ${r.minutes} 分钟 · 家常做法</p></div>
          <button class="al-close" data-action="close-app-layer" aria-label="关闭">${ICON.x}</button>
        </div>
        <div class="pair-guide">
          ${r.steps.map((s, i) => `<div class="pg-step"><span class="pg-num">${i+1}</span><span>${esc(s)}</span></div>`).join('')}
        </div>
        <div class="modal-actions"><button class="btn btn-primary btn-block" data-action="close-app-layer">知道了</button></div>
      </div>
    </div>`;
  }

  // 朴朴超市采购窗口：列出待补项，跳转朴朴，回来后可标记已补齐并实时从清单移除
  function showPupuModal() {
    const pending = STATE.restock.filter(r => r.status === '待补');
    modalRoot.innerHTML = `<div class="modal-overlay" data-action="close-modal">
      <div class="modal-card" data-stop="1">
        <div class="modal-head">
          <div class="modal-icon" style="background:linear-gradient(135deg,#3DBE6B,#0E7C3A);color:#fff">朴</div>
          <div class="grow"><h3>去朴朴超市采购</h3><p>清单已同步 · 共 ${pending.length} 项待补</p></div>
          <button class="al-close" data-action="close-app-layer" aria-label="关闭">${ICON.x}</button>
        </div>
        <div class="pupu-tip">打开朴朴超市，买完回来点「标记已补齐」，食材会自动入库并从清单里划掉。</div>
        ${pending.length ? `<div class="ck-list">${pending.map(r => `<div class="ck-row">
          <span class="ck-emoji">${emojiFor(r.name)}</span>
          <div class="grow"><div class="ck-name">${esc(r.name)}</div><div class="ck-meta">建议 ${r.suggestQty}${esc(r.unit)} · ${esc(r.source)}</div></div>
        </div>`).join('')}</div>` : '<div class="muted" style="margin-bottom:12px">当前没有待补货商品 🎉</div>'}
        <div class="modal-actions">
          <button class="btn btn-ghost grow" data-action="pupu-mark" ${pending.length ? '' : 'disabled style="opacity:.5"'}>标记已补齐</button>
          <button class="btn btn-primary grow" data-action="pupu-open-app">打开朴朴 App</button>
        </div>
      </div>
    </div>`;
  }

  // 打开朴朴：跳转官方 deeplink（唤起 App / 引导下载）
  function openPupuApp() {
    const url = 'https://ma.pupumall.com/deeplink';
    toast('正在打开朴朴…');
    try { window.location.href = url; }
    catch (e) { window.open(url, '_blank'); }
  }

  // 标记朴朴已补齐：待补项全部入库并从清单移除（去重，只显示一次）
  function pupuMarkAll() {
    const pending = STATE.restock.filter(r => r.status === '待补');
    if (!pending.length) { toast('没有待补货商品'); return; }
    const today = TODAY;
    pending.forEach(r => {
      const sku = skuByName(r.name);
      const preset = sku ? PURCHASE_PRESETS[sku] : null;
      const existing = ITEMS.find(i => i.name === r.name);
      if (existing) {
        existing.quantity += (preset ? preset.qty : r.suggestQty);
        existing.freshness = 'green'; existing.freshPct = 100;
        existing.remainingDays = preset ? preset.shelfDays : 7;
        existing.purchaseDate = today;
        existing.source = '朴朴采购';
      } else {
        const shelf = preset ? preset.shelfDays : 7;
        const exp = new Date(today); exp.setDate(exp.getDate() + shelf);
        const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        ITEMS.push({
          id: 'it-' + Date.now() + '-' + r.id, name: r.name, icon: iconForFood(r.name),
          layer: preset ? preset.layer : defaultLayerForFood(r.name),
          purchaseDate: today, expiryDate: iso(exp), remainingDays: shelf,
          freshness: 'green', freshPct: 100, quantity: preset ? preset.qty : r.suggestQty,
          unit: r.unit, source: '朴朴采购'
        });
      }
    });
    STATE.restock = STATE.restock.filter(r => r.status !== '待补');
    STATE.checked.clear();
    closeModal(); renderApp();
    toast(`已补齐 ${pending.length} 项并同步冰箱食材库`);
  }

  // ============ 一句话录入食材：按常见说法解析成食材清单 ============
  // 词库：常见食材 → 默认单位 / 保质天数（供解析与入库使用）
  const FOOD_DICT = [
    { name: '鲜鸡蛋', unit: '枚', days: 10, alias: ['鸡蛋', '蛋', '土鸡蛋'] },
    { name: '全脂牛奶', unit: '盒', days: 8, alias: ['牛奶', '纯牛奶'] },
    { name: '原味酸奶', unit: '杯', days: 7, alias: ['酸奶'] },
    { name: '吐司面包', unit: '袋', days: 7, alias: ['吐司', '面包'] },
    { name: '切片奶酪', unit: '盒', days: 15, alias: ['奶酪', '芝士'] },
    { name: '橙汁', unit: '瓶', days: 10, alias: ['橙汁', '果汁'] },
    { name: '三文鱼', unit: '块', days: 4, alias: ['三文鱼', '鱼'] },
    { name: '豆腐', unit: '盒', days: 5, alias: ['豆腐'] },
    { name: '鸡胸肉', unit: '块', days: 3, alias: ['鸡胸肉', '鸡胸', '鸡肉'] },
    { name: '香肠', unit: '根', days: 7, alias: ['香肠', '火腿肠'] },
    { name: '西兰花', unit: '颗', days: 6, alias: ['西兰花', '花椰菜'] },
    { name: '番茄', unit: '个', days: 5, alias: ['番茄', '西红柿'] },
    { name: '红苹果', unit: '个', days: 12, alias: ['苹果', '红苹果'] },
    { name: '胡萝卜', unit: '根', days: 10, alias: ['胡萝卜'] },
    { name: '生菜', unit: '颗', days: 4, alias: ['生菜', '青菜'] },
    { name: '蓝莓', unit: '盒', days: 6, alias: ['蓝莓'] },
    { name: '柠檬', unit: '个', days: 12, alias: ['柠檬'] },
    { name: '速冻水饺', unit: '袋', days: 90, alias: ['水饺', '速冻水饺', '饺子'] },
    { name: '冰淇淋', unit: '盒', days: 90, alias: ['冰淇淋', '雪糕'] }
  ];
  // 解析「买了6个鸡蛋和2盒牛奶，放冷藏」这类句子
  function parseFoodText(text) {
    const s = String(text || '');
    const found = [];
    FOOD_DICT.forEach(f => {
      const alias = f.alias.find(a => s.includes(a));
      if (!alias) return;
      // 就近找数量：中文习惯「6个鸡蛋」（数量在别名前），其次「鸡蛋 2 盒」（数量在后）
      let qty = 1, unit = f.unit;
      const pos = s.indexOf(alias);
      const before = s.slice(Math.max(0, pos - 4), pos);        // 别名前最多 4 字
      const after = s.slice(pos + alias.length, pos + alias.length + 4); // 别名后最多 4 字
      // 优先取紧挨别名前的「数字+单位」（如 6个|_鸡蛋）
      const mBefore = before.match(/(\d+)\s*([个盒枚袋瓶根颗块份只])?\s*$/);
      // 其次取紧挨别名后的「数字+单位」（如 鸡蛋|2盒）
      const mAfter = after.match(/^\s*(\d+)\s*([个盒枚袋瓶根颗块份只])?/);
      if (mBefore && mBefore[1]) { qty = Math.max(1, Math.min(99, parseInt(mBefore[1], 10))); if (mBefore[2]) unit = mBefore[2]; }
      else if (mAfter && mAfter[1]) { qty = Math.max(1, Math.min(99, parseInt(mAfter[1], 10))); if (mAfter[2]) unit = mAfter[2]; }
      let layer = defaultLayerForFood(f.name);
      if (/冷冻|冻层/.test(s) || /冻/.test(f.name)) layer = '冷冻室';
      else if (/果蔬|蔬菜层/.test(s)) layer = '果蔬抽屉';
      else if (/上层/.test(s)) layer = '冷藏室上层';
      else if (/下层/.test(s)) layer = '冷藏室下层';
      else if (/中层/.test(s)) layer = '冷藏室中层';
      found.push({ name: f.name, qty, unit, layer, days: f.days });
    });
    return found;
  }

  // 一句话录入面板：作为「添加食材」弹窗里的一种方式
  function textAddPanel() {
    return `<div class="text-add">
        <div class="ai-input-row">
          <input id="ai-food-input" class="ai-input" placeholder="例如：买了6个鸡蛋和2盒牛奶放冷藏" />
          <button class="btn btn-primary" data-action="entry-parse">识别</button>
        </div>
        <div class="ai-chips">
          <button class="ai-chip" data-action="entry-fill" data-q="买了6个鸡蛋和2盒牛奶，放冷藏中层">6个鸡蛋+2盒牛奶</button>
          <button class="ai-chip" data-action="entry-fill" data-q="冷冻室加了1袋速冻水饺和2盒冰淇淋">冷冻水饺+冰淇淋</button>
          <button class="ai-chip" data-action="entry-fill" data-q="买了3个番茄、1颗西兰花和5个鸡蛋">番茄西兰花鸡蛋</button>
        </div>
        <div id="entry-result"></div>
      </div>`;
  }
  function entryParse(text) {
    const parsed = parseFoodText(text);
    const box = $('#entry-result');
    if (!box) return;
    if (!parsed.length) {
      box.innerHTML = '<div class="ai-tip" style="margin:0">没找到这个食材，试试「6个鸡蛋」「2盒牛奶」这样的说法，或者切到「手动」添加。</div>';
      return;
    }
    box.innerHTML = `<div class="ai-sec" style="margin-top:12px"><h5>找到 ${parsed.length} 样食材，确认后入库</h5>
      <div class="ck-list" style="max-height:34vh">
        ${parsed.map((p) => `<div class="ck-row">
          <span class="ck-emoji">${iconForFood(p.name)}</span>
          <div class="grow"><div class="ck-name">${esc(p.name)}</div><div class="ck-meta">${esc(p.layer)} · 保质 ${p.days} 天</div></div>
          <span class="ck-days">${p.qty}${esc(p.unit)}</span>
        </div>`).join('')}
      </div>
      <button class="btn btn-primary btn-block" data-action="entry-confirm">✓ 入库这 ${parsed.length} 样</button>
    </div>`;
    box.dataset.parsed = JSON.stringify(parsed);
  }
  function entryConfirm() {
    const box = $('#entry-result');
    if (!box || !box.dataset.parsed) return;
    const parsed = JSON.parse(box.dataset.parsed);
    parsed.forEach(p => {
      const existing = ITEMS.find(i => i.name === p.name);
      if (existing) { existing.quantity += p.qty; existing.source = '快速录入'; }
      else {
        const exp = new Date(TODAY); exp.setDate(exp.getDate() + p.days);
        const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        ITEMS.push({
          id: 'it-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          name: p.name, icon: iconForFood(p.name), layer: p.layer,
          purchaseDate: TODAY, expiryDate: iso(exp), remainingDays: p.days,
          freshness: 'green', freshPct: 95, quantity: p.qty, unit: p.unit, source: '快速录入'
        });
      }
    });
    closeModal(); renderApp();
    toast(`已录入 ${parsed.length} 样食材到冰箱`);
  }

  // 添加食材弹窗：手动 / 一句话 / 语音 / 拍照小票
  let addMode = 'manual';
  function showAddModal(mode) {
    addMode = mode || 'manual';
    renderAddModal();
    if (addMode === 'text') setTimeout(() => { const el = $('#ai-food-input'); if (el) el.focus(); }, 50);
  }
  function renderAddModal() {
    const panel = addMode === 'manual' ? `<div class="add-field"><label>食材名称</label><input id="af-name" placeholder="如：鸡蛋、牛奶、西兰花" /></div>
      <div class="add-row">
        <div class="add-field"><label>所在层</label><select id="af-layer">${LAYERS.map(l => `<option>${l}</option>`).join('')}</select></div>
      </div>
      <div class="add-row">
        <div class="add-field"><label>数量</label><input id="af-qty" type="number" min="1" value="1" /></div>
        <div class="add-field"><label>单位</label><input id="af-unit" value="份" /></div>
      </div>
      <div class="add-field"><label>保质期（天）</label><input id="af-days" type="number" min="0" value="7" /></div>`
      : addMode === 'text' ? textAddPanel()
      : addMode === 'voice' ? `<div class="add-voice">
          <div class="av-orb" id="av-orb">🎤</div>
          <p>点击话筒说出食材，例如「6 枚鸡蛋放冷藏上层」</p>
          <div class="av-result" id="av-result"></div>
        </div>`
      : `<div class="add-camera">
          <label for="af-photo"><span class="ac-orb">📷</span><p>点击拍照 / 上传小票，自动识别食材</p></label>
          <input type="file" id="af-photo" accept="image/*" capture="environment" />
        </div>
        <div class="add-preview" id="ap-preview"></div>`;
    modalRoot.innerHTML = `<div class="modal-overlay" data-action="close-modal">
      <div class="modal-card" data-stop="1">
        <div class="modal-head">
          <div class="modal-icon">＋</div>
          <div class="grow"><h3>添加食材</h3><p>写上、说一句、语音或拍小票，都行</p></div>
          <button class="al-close" data-action="close-app-layer" aria-label="关闭">${ICON.x}</button>
        </div>
        <div class="add-tabs">
          <button class="add-tab ${addMode==='manual'?'active':''}" data-action="add-tab" data-mode="manual">✍️ 手动</button>
          <button class="add-tab ${addMode==='text'?'active':''}" data-action="add-tab" data-mode="text">💬 一句话</button>
          <button class="add-tab ${addMode==='voice'?'active':''}" data-action="add-tab" data-mode="voice">🎤 语音</button>
          <button class="add-tab ${addMode==='receipt'?'active':''}" data-action="add-tab" data-mode="receipt">📷 拍小票</button>
        </div>
        <div id="add-panel">${panel}</div>
        <div class="modal-actions" style="margin-top:14px">
          <button class="btn btn-ghost grow" data-action="close-app-layer">取消</button>
          <button class="btn btn-primary grow" data-action="add-save">${addMode === 'text' ? '识别食材' : '确认添加'}</button>
        </div>
      </div>
    </div>`;
    if (addMode === 'voice') {
      const orb = $('#av-orb');
      if (orb) orb.addEventListener('click', () => {
        orb.classList.add('on');
        const res = $('#av-result');
        res.style.display = 'block'; res.textContent = '🎧 正在聆听…';
        setTimeout(() => {
          orb.classList.remove('on');
          res.innerHTML = '✅ 已识别：<b>鲜鸡蛋 × 6 枚 · 冷藏室中层</b><br/>点击「确认添加」即可入库';
          res.dataset.name = '鲜鸡蛋'; res.dataset.qty = '6'; res.dataset.unit = '枚'; res.dataset.layer = '冷藏室中层';
        }, 900);
      });
    }
    if (addMode === 'receipt') {
      const file = $('#af-photo');
      if (file) file.addEventListener('change', () => {
        const pv = $('#ap-preview'); pv.style.display = 'block';
        pv.innerHTML = '<div style="font-size:13px;color:var(--muted);margin-bottom:6px">🔍 识别到以下食材：</div>' +
          [['全脂牛奶','1 盒','冷藏室上层'],['吐司面包','1 袋','冷藏室上层']].map(x => `<div class="ap-row"><span>🥗</span><span>${x[0]}</span><b>${x[1]}</b></div>`).join('') +
          '<div style="font-size:13px;color:var(--green-deep);margin-top:6px">点击「确认添加」将识别结果入库</div>';
        pv.dataset.receipt = '1';
      });
    }
  }
  function addNewItem(name, qty, unit, layer, days) {
    name = String(name || '').trim();
    if (!name) { toast('请输入食材名称'); return false; }
    const exp = new Date(TODAY); exp.setDate(exp.getDate() + days);
    const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const existing = ITEMS.find(i => i.name === name);
    if (existing) {
      existing.quantity += qty;
    } else {
      ITEMS.push({
        id: 'it-' + Date.now(), name, icon: iconForFood(name), layer: layer || defaultLayerForFood(name),
        purchaseDate: TODAY, expiryDate: iso(exp), remainingDays: days,
        freshness: days <= 1 ? 'red' : days === 2 ? 'yellow' : 'green',
        freshPct: days <= 1 ? 15 : days === 2 ? 40 : 90,
        quantity: qty, unit: unit || '份', source: '手动添加'
      });
    }
    renderApp(); toast(`已添加「${name}」到冰箱食材库`);
    return true;
  }
  function addSave() {
    if (addMode === 'manual') {
      const name = $('#af-name') && $('#af-name').value;
      const qty = +($('#af-qty') && $('#af-qty').value || 1);
      const unit = ($('#af-unit') && $('#af-unit').value) || '份';
      const layer = ($('#af-layer') && $('#af-layer').value) || '冷藏室中层';
      const days = +($('#af-days') && $('#af-days').value || 7);
      if (addNewItem(name, qty, unit, layer, days)) closeModal();
      return;
    }
    if (addMode === 'text') {
      entryParse(($('#ai-food-input') && $('#ai-food-input').value) || '');
      return;
    }
    if (addMode === 'voice') {
      const res = $('#av-result');
      if (!res || !res.dataset.name) { toast('请先点击话筒完成语音识别'); return; }
      if (addNewItem(res.dataset.name, +res.dataset.qty, res.dataset.unit, res.dataset.layer, 7)) closeModal();
      return;
    }
    if (addMode === 'receipt') {
      const pv = $('#ap-preview');
      if (!pv || !pv.dataset.receipt) { toast('请先拍照 / 上传小票完成识别'); return; }
      addNewItem('全脂牛奶', 1, '盒', '冷藏室上层', 8);
      addNewItem('吐司面包', 1, '袋', '冷藏室上层', 7);
      closeModal(); toast('小票识别的 2 样食材已入库');
    }
  }

  function addToCart(sku, rid) {
    const p = PRODUCTS.find(x => x.sku === sku);
    if (!p) return;
    const exist = STATE.cart.find(c => c.sku === sku);
    if (exist) exist.qty += 1;
    else STATE.cart.push({ sku, name: p.name, qty: 1, fromRestockId: rid || null });
    if (rid) {
      const r = STATE.restock.find(x => x.id === rid);
      if (r) r.status = '已加购';
    }
  }
  function processDupQueue() {
    if (!dupQueue.length) { renderApp(); toast('已加入购物车'); return; }
    const next = dupQueue.shift();
    if (!showDuplicateModal(next.sku, next.rid)) processDupQueue();
  }

  /* ==================== 事件绑定 ==================== */
  document.addEventListener('click', (e) => {
    const actionEl = e.target.closest('[data-action]');

    if (actionEl) {
      const a = actionEl.dataset.action;
      if (a === 'close-modal') {
        if (e.target.closest('[data-stop]')) return;
        closeModal(); return;
      }
      if (a === 'close-app-layer' || a === 'close-ai' || a === 'close-checkout') { closeModal(); return; }
      if (a === 'expiry-day') { STATE.expiryDay = +actionEl.dataset.day; renderApp(); return; }
      if (a === 'pupu-open') { showPupuModal(); return; }
      if (a === 'pupu-open-app') { openPupuApp(); return; }
      if (a === 'pupu-mark') { pupuMarkAll(); return; }
      if (a === 'add-open') { showAddModal(actionEl.dataset.mode); return; }
      if (a === 'entry-parse') { entryParse(($('#ai-food-input') && $('#ai-food-input').value) || ''); return; }
      if (a === 'entry-fill') { const inp = $('#ai-food-input'); if (inp) { inp.value = actionEl.dataset.q; entryParse(inp.value); } return; }
      if (a === 'entry-confirm') { entryConfirm(); return; }
      if (a === 'add-tab') { addMode = actionEl.dataset.mode; renderAddModal(); return; }
      if (a === 'add-save') { addSave(); return; }
      if (a === 'ai-view-steps') { showAiSteps(); return; }
      if (a === 'checkout') { doCheckout(); return; }
      if (a === 'view-fridge') { closeModal(); STATE.appPage = 'fridge'; renderApp(); toast('已打开你的冰箱，新食材已入库'); return; }
      if (a === 'ai-open') { showAiModal(); return; }
      if (a === 'ai-quick') { renderAiResult(actionEl.dataset.q); return; }
      if (a === 'ai-submit') {
        const q = ($('#ai-input') && $('#ai-input').value) || '';
        renderAiResult(q); return;
      }
      if (a === 'ai-add-restock') {
        const r = STATE.aiDish || RECIPES.find(x => x.id === actionEl.dataset.recipe);
        const { need } = aiAnalyzeRecipe(r);
        let added = 0;
        need.forEach(n => {
          if (!STATE.restock.some(rs => rs.name === n)) {
            STATE.restock.push({ id: 'rs-' + Date.now() + '-' + (added++), name: n, suggestQty: 1, unit: '份', source: '食谱缺料', status: '待补' });
          }
        });
        closeModal(); STATE.appPage = 'restock'; renderApp();
        toast(added ? ('已把 ' + added + ' 样食材加入补货清单') : '所需食材已在补货清单中');
        return;
      }
      if (a === 'simulate-nfc') {
        STATE.appPage = 'nfc'; renderApp();
        toast('已连接你的冰箱'); return;
      }
      if (a === 'go-pairing') { showPairGuide(); return; }
      if (a === 'toggle-nfc') { STATE.device.nfcBound = !STATE.device.nfcBound; renderApp(); toast(STATE.device.nfcBound ? '碰一碰已开启' : '碰一碰已关闭'); return; }
      if (a === 'toggle-check') {
        const id = actionEl.dataset.id;
        if (STATE.checked.has(id)) STATE.checked.delete(id); else STATE.checked.add(id);
        renderApp(); return;
      }
      if (a === 'restock-add-cart') {
        const checkedIds = Array.from(STATE.checked);
        if (!checkedIds.length) { toast('请先勾选补货项'); return; }
        dupQueue = [];
        checkedIds.forEach(id => {
          const r = STATE.restock.find(x => x.id === id);
          if (!r || r.status === '暂不补货') return;
          const sku = skuByName(r.name);
          if (!sku) return;
          const dup = checkDuplicate(sku);
          if (dup && dup.hit) dupQueue.push({ sku, rid: r.id });
          else { addToCart(sku, r.id); STATE.checked.delete(id); }
        });
        processDupQueue(); return;
      }
      if (a === 'product-add') {
        const sku = actionEl.dataset.sku;
        const dup = checkDuplicate(sku);
        if (dup && dup.hit) { dupQueue = [{ sku, rid: null }]; processDupQueue(); }
        else { addToCart(sku, null); renderApp(); toast('已加入购物车'); }
        return;
      }
      if (a === 'dup-skip' || a === 'dup-buy') {
        const { sku, rid } = actionEl.dataset;
        if (rid) STATE.checked.delete(rid);
        if (a === 'dup-buy') addToCart(sku, rid || null);
        else {
          const ci = STATE.cart.findIndex(c => c.sku === sku);
          if (ci >= 0) STATE.cart.splice(ci, 1);
          if (rid) { const r = STATE.restock.find(x => x.id === rid); if (r) r.status = '暂不补货'; }
        }
        closeModal();
        if (dupQueue.length) processDupQueue();
        else { renderApp(); toast(a === 'dup-buy' ? '已加入购物车' : '已移出购物车，标记暂不补货'); }
        return;
      }
      if (a === 'cart-qty') {
        const idx = +actionEl.dataset.idx;
        STATE.cart[idx].qty += +actionEl.dataset.d;
        if (STATE.cart[idx].qty <= 0) STATE.cart.splice(idx, 1);
        renderApp(); return;
      }
    }

    const appRouteBtn = e.target.closest('[data-app-route]');
    if (appRouteBtn) { STATE.appPage = appRouteBtn.dataset.appRoute; STATE.focusLayer = null; renderApp(); return; }
    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) { STATE.appPage = tabBtn.dataset.tab; STATE.focusLayer = null; renderApp(); return; }
    const goBtn = e.target.closest('[data-go]');
    if (goBtn) { STATE.appPage = goBtn.dataset.go; STATE.focusLayer = null; renderApp(); return; }
    const layerGoBtn = e.target.closest('[data-action="go-layer"]');
    if (layerGoBtn) { STATE.appPage = 'fridge'; STATE.focusLayer = layerGoBtn.dataset.layer; renderApp(); return; }
    const recipeBtn = e.target.closest('[data-recipe]');
    if (recipeBtn) { closeModal(); STATE.recipeId = recipeBtn.dataset.recipe; STATE.appPage = 'recipe'; renderApp(); return; }
    const addMissingBtn = e.target.closest('[data-add-missing]');
    if (addMissingBtn) {
      const r = RECIPES.find(x => x.id === addMissingBtn.dataset.addMissing);
      let n = 0;
      r.ingredients.filter(x => !x.have).forEach(ing => {
        if (!STATE.restock.some(rs => rs.name === ing.name)) {
          STATE.restock.push({ id: 'rs-' + Date.now() + '-' + (n++), name: ing.name, suggestQty: 1, unit: '份', source: '食谱缺料', status: '待补' });
        }
      });
      renderApp(); toast('已把缺失食材加入补货清单'); return;
    }
    const productLine = e.target.closest('[data-product]');
    if (productLine) { STATE.productSku = productLine.dataset.product; STATE.appPage = 'product'; renderApp(); return; }
  });

  $('#btn-reset').addEventListener('click', () => {
    ITEMS.length = 0; ITEMS_INITIAL.forEach(x => ITEMS.push({ ...x }));
    STATE.restock = RESTOCK_ITEMS.map(x => ({ ...x }));
    STATE.cart = []; STATE.checked = new Set(); STATE.device = { ...DEVICE };
    STATE.appPage = 'home'; STATE.expiryDay = 1; STATE.aiDish = null;
    renderApp(); toast('已恢复初始数据');
  });

  renderApp();
})();
