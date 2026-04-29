  /* ─── Pinch-to-Zoom for lightboxes ─── */
  var _lbZoomed = false;

  function _lbResetZoom(overlayId) {
    if (overlayId === 'subway-overlay') {
      var strip = document.getElementById('subway-strip');
      if (strip) { strip._init=false; strip.style.transform='translateX(0)'; strip.classList.remove('animating'); }
      [0,1].forEach(function(i){ var img=document.getElementById('simg-'+i); if(img) img.style.transform=''; });
      var d0=document.getElementById('sdot-0'); if(d0) d0.classList.add('active');
      var d1=document.getElementById('sdot-1'); if(d1) d1.classList.remove('active');
    } else {
      var overlay = document.getElementById(overlayId);
      if (overlay) overlay.querySelectorAll('img[data-pz]').forEach(function(img) {
        img.style.transform = '';
        img._pzScale = 1; img._pzPanX = 0; img._pzPanY = 0;
      });
    }
    _lbZoomed = false;
  }

  function _initPinchZoom(overlayId) {
    var overlay = document.getElementById(overlayId);
    if (!overlay) return;
    overlay.querySelectorAll('img').forEach(function(img) {
      if (img.dataset.pz) return; // already init
      img.dataset.pz = '1';
      img._pzScale = 1; img._pzPanX = 0; img._pzPanY = 0;
      var _startDist = 0, _startScale = 1, _startPX = 0, _startPY = 0;
      var _lastTap = 0, _pinching = false, _panning = false;

      function dist(t) {
        return Math.hypot(t[0].clientX-t[1].clientX, t[0].clientY-t[1].clientY);
      }
      function applyT() {
        img.style.transform = 'translate('+img._pzPanX+'px,'+img._pzPanY+'px) scale('+img._pzScale+')';
        _lbZoomed = img._pzScale > 1.05;
        img.style.cursor = _lbZoomed ? 'grab' : 'zoom-in';

      }
      function resetT() {
        img._pzScale = 1; img._pzPanX = 0; img._pzPanY = 0;
        img.style.transform = ''; _lbZoomed = false;
        img.style.cursor = 'zoom-in';

      }

      img.addEventListener('touchstart', function(e) {
        if (e.touches.length === 2) {
          _pinching = true; _panning = false;
          _startDist = dist(e.touches);
          _startScale = img._pzScale;
          e.preventDefault(); e.stopPropagation();
        } else if (e.touches.length === 1) {
          var now = Date.now();
          if (now - _lastTap < 280) { resetT(); e.preventDefault(); return; }
          _lastTap = now;
          if (img._pzScale > 1.05) {
            _panning = true;
            _startPX = e.touches[0].clientX - img._pzPanX;
            _startPY = e.touches[0].clientY - img._pzPanY;
            e.preventDefault(); e.stopPropagation();
          }
        }
      }, { passive: false });

      img.addEventListener('touchmove', function(e) {
        if (_pinching && e.touches.length === 2) {
          var d = dist(e.touches);
          img._pzScale = Math.min(6, Math.max(1, _startScale * d / _startDist));
          applyT();
          e.preventDefault(); e.stopPropagation();
        } else if (_panning && e.touches.length === 1 && img._pzScale > 1.05) {
          img._pzPanX = e.touches[0].clientX - _startPX;
          img._pzPanY = e.touches[0].clientY - _startPY;
          applyT();
          e.preventDefault(); e.stopPropagation();
        }
      }, { passive: false });

      img.addEventListener('touchend', function(e) {
        if (e.touches.length < 2) _pinching = false;
        if (e.touches.length === 0) _panning = false;
        if (img._pzScale < 1.05) resetT();
      });
    });
  }

  // Init pinch-zoom when modals open
  var _origOpenTicket = window.openTicket || function(){};
  function openTicket() {
    document.getElementById('ticket-overlay').classList.add('open');
    setTimeout(function(){ _initPinchZoom('ticket-overlay'); }, 50);
  }

  /* ─── Subway Modal ─── */
  /* ─── Subway Gallery (swipe + pinch-zoom) ─── */
  function _initSubwayGallery() {
    var strip = document.getElementById('subway-strip');
    if (!strip || strip._init) return;
    strip._init = true;

    var cur = 0;            // 0 or 1
    var TOTAL = 2;
    // zoom state per slide
    var sc=[1,1], px=[0,0], py=[0,0];

    /* ── helpers ── */
    function getImg(i){ return document.getElementById('simg-'+i); }

    function setSlide(i, animated) {
      cur = Math.max(0, Math.min(TOTAL-1, i));
      strip.classList.toggle('animating', !!animated);
      strip.style.transform = cur===0 ? 'translateX(0)' : 'translateX(-50%)';
      if (animated) setTimeout(function(){ strip.classList.remove('animating'); }, 300);
      [0,1].forEach(function(j){
        var d=document.getElementById('sdot-'+j);
        if(d) d.classList.toggle('active', j===cur);
      });
      _lbZoomed = sc[cur] > 1.05;
    }

    function applyImg(i) {
      var img = getImg(i);
      if(img) img.style.transform = 'translate('+px[i]+'px,'+py[i]+'px) scale('+sc[i]+')';
      _lbZoomed = sc[cur] > 1.05;
    }
    function resetImg(i) {
      sc[i]=1; px[i]=0; py[i]=0;
      var img=getImg(i); if(img) img.style.transform='';
      _lbZoomed = sc[cur]>1.05;
    }

    /* ── touch ── */
    var t0x=0, t0y=0, spx=0, spy=0;
    var pinchDist=0, pinchSc=1;
    var mode='';  // 'swipe'|'pan'|'pinch'
    var lastTap=0;

    function dist2(a,b){ return Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY); }

    strip.addEventListener('touchstart', function(e){
      if (e.touches.length===2) {
        mode='pinch';
        pinchDist = dist2(e.touches[0],e.touches[1]);
        pinchSc   = sc[cur];
        e.preventDefault();
      } else if (e.touches.length===1) {
        t0x=e.touches[0].clientX; t0y=e.touches[0].clientY;
        spx=px[cur]; spy=py[cur];
        mode = sc[cur]>1.05 ? 'pan' : 'swipe';
        // double-tap reset
        var now=Date.now();
        if(now-lastTap<280){ resetImg(cur); mode=''; e.preventDefault(); }
        lastTap=now;
      }
    },{passive:false});

    strip.addEventListener('touchmove', function(e){
      if (mode==='pinch' && e.touches.length===2) {
        var d=dist2(e.touches[0],e.touches[1]);
        sc[cur]=Math.min(6,Math.max(1,pinchSc*d/pinchDist));
        applyImg(cur);
        e.preventDefault();
      } else if (mode==='pan' && e.touches.length===1) {
        px[cur]=spx+(e.touches[0].clientX-t0x);
        py[cur]=spy+(e.touches[0].clientY-t0y);
        applyImg(cur);
        e.preventDefault();
      } else if (mode==='swipe' && e.touches.length===1) {
        var dx=e.touches[0].clientX-t0x;
        // live preview: shift strip while dragging
        var base = cur===0 ? 0 : -50;
        var pct  = dx / window.innerWidth * 50;  // 50% = one slide width
        strip.style.transform='translateX('+(base+pct)+'%)';
        e.preventDefault();
      }
    },{passive:false});

    strip.addEventListener('touchend', function(e){
      if (mode==='swipe') {
        var dx=(e.changedTouches[0]||{clientX:t0x}).clientX-t0x;
        if      (dx < -window.innerWidth*0.2 && cur<TOTAL-1) setSlide(cur+1,true);
        else if (dx >  window.innerWidth*0.2 && cur>0)       setSlide(cur-1,true);
        else                                                   setSlide(cur,true);
      } else if (mode==='pan' && sc[cur]<1.05) {
        resetImg(cur);
      }
      if(e.touches.length===0) mode='';
    },{passive:true});

    setSlide(0, false);
  }


  function openSubwayModal() {
    var ov = document.getElementById('subway-overlay');
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(_initSubwayGallery, 80);
  }
  function closeSubwayModal() {
    document.getElementById('subway-overlay').classList.remove('open');
    document.body.style.overflow = '';
    _lbResetZoom('subway-overlay');
  }

  /* ─── Navigation ─── */
  function switchPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('page-' + name).classList.add('active');
    document.getElementById('nav-' + name).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (name === 'history') renderTrips();
  }
  function switchDay(id, btn) {
    document.querySelectorAll('.day-content').forEach(d => d.classList.remove('active'));
    document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
    btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
  /* ─── Daily Tips → jump to itinerary day ─── */
  function goToDay(dayId) {
    switchPage('itinerary');
    setTimeout(() => {
      const tabs = document.querySelectorAll('.day-tab');
      const dayMap = { day1: 0, day2: 1, day3: 2, day4: 3, day5: 4 };
      const idx = dayMap[dayId];
      if (idx !== undefined && tabs[idx]) switchDay(dayId, tabs[idx]);
    }, 120);
  }
  function switchCat(id, btn) {
    document.querySelectorAll('.cat-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
  }

  /* ─── Checkboxes ─── */
  function toggleCheck(item) {
    item.classList.toggle('checked');
    const tick = item.querySelector('.check-tick');
    tick.style.display = item.classList.contains('checked') ? 'block' : 'none';
    try {
      const items = document.querySelectorAll('.check-item');
      const state = Array.from(items).map(i => i.classList.contains('checked'));
      localStorage.setItem('kyoto_checks', JSON.stringify(state));
    } catch(e) {}
  }
  try {
    const saved = JSON.parse(localStorage.getItem('kyoto_checks') || '[]');
    document.querySelectorAll('.check-item').forEach((item, i) => {
      if (saved[i]) {
        item.classList.add('checked');
        item.querySelector('.check-tick').style.display = 'block';
      }
    });
  } catch(e) {}

  /* ─── Countdown ─── */
  function updateCountdown() {
    const target = new Date('2026-05-28T14:20:00+08:00');
    const diff = target - new Date();
    const el = document.getElementById('countdown-days');
    const txt = document.getElementById('countdown-text');
    if (diff <= 0) {
      el.innerHTML = '<span class="accent">✈</span>';
      txt.textContent = '出發囉！旅程開始';
    } else {
      const days = Math.floor(diff / 86400000);
      const hrs  = Math.floor((diff % 86400000) / 3600000);
      el.textContent = days;
      txt.textContent = `天 ${hrs} 小時後出發 · May 28, 2026`;
    }
  }
  updateCountdown();
  setInterval(updateCountdown, 60000);

	  /* ─── Travel History ─── */
	  const SUPABASE_SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
	  const SUPABASE_URL = 'https://gixvaglwztzwjodgpyes.supabase.co';
	  const SUPABASE_ANON_KEY = 'sb_publishable_shac4QlahjOzLSPJEyJV8g_4GramveT';
	  const TRAVEL_GROUP_ID = '47560410-83ad-4478-b3ec-76837a47b0c5';
	  let supabaseClient = null;
	  let supabaseSdkPromise = null;
	  let currentUser = null;
	  let isPasswordRecoveryMode = false;
	  let tripsCache = null;
	  let flagManuallyEdited = false;

	  const COUNTRY_FLAGS = [
	    { flag: '🇹🇼', keys: ['台灣', '臺灣', 'taiwan', 'tw', '台北', 'taipei'] },
	    { flag: '🇯🇵', keys: ['日本', 'japan', 'jp', '東京', 'tokyo', '京都', 'kyoto', '大阪', 'osaka'] },
	    { flag: '🇰🇷', keys: ['韓國', '南韓', 'korea', 'southkorea', 'kr', '首爾', 'seoul', '釜山', 'busan'] },
	    { flag: '🇫🇷', keys: ['法國', 'france', 'fr', '巴黎', 'paris'] },
	    { flag: '🇬🇧', keys: ['英國', 'uk', 'unitedkingdom', 'britain', 'london', '倫敦'] },
	    { flag: '🇺🇸', keys: ['美國', 'usa', 'us', 'unitedstates', 'america', '紐約', 'newyork', '洛杉磯', 'losangeles'] },
	    { flag: '🇹🇭', keys: ['泰國', 'thailand', 'th', '曼谷', 'bangkok'] },
	    { flag: '🇻🇳', keys: ['越南', 'vietnam', 'vn', '河內', 'hanoi', '胡志明', 'hochiminh'] },
	    { flag: '🇸🇬', keys: ['新加坡', 'singapore', 'sg'] },
	    { flag: '🇲🇾', keys: ['馬來西亞', 'malaysia', 'my', '吉隆坡', 'kualalumpur'] },
	    { flag: '🇮🇩', keys: ['印尼', '印度尼西亞', 'indonesia', 'id', '峇里', 'bali'] },
	    { flag: '🇵🇭', keys: ['菲律賓', 'philippines', 'ph', '馬尼拉', 'manila'] },
	    { flag: '🇭🇰', keys: ['香港', 'hongkong', 'hk'] },
	    { flag: '🇲🇴', keys: ['澳門', 'macau', 'macao', 'mo'] },
	    { flag: '🇨🇳', keys: ['中國', 'china', 'cn', '上海', 'shanghai', '北京', 'beijing'] },
	    { flag: '🇦🇺', keys: ['澳洲', '澳大利亞', 'australia', 'au', '雪梨', 'sydney', '墨爾本', 'melbourne'] },
	    { flag: '🇳🇿', keys: ['紐西蘭', '新西蘭', 'newzealand', 'nz', '奧克蘭', 'auckland'] },
	    { flag: '🇨🇦', keys: ['加拿大', 'canada', 'ca', '溫哥華', 'vancouver', '多倫多', 'toronto'] },
	    { flag: '🇮🇹', keys: ['義大利', '意大利', 'italy', 'it', '羅馬', 'rome', '米蘭', 'milan'] },
	    { flag: '🇪🇸', keys: ['西班牙', 'spain', 'es', '馬德里', 'madrid', '巴塞隆納', 'barcelona'] },
	    { flag: '🇩🇪', keys: ['德國', 'germany', 'de', '柏林', 'berlin', '慕尼黑', 'munich'] },
	    { flag: '🇨🇭', keys: ['瑞士', 'switzerland', 'ch', '蘇黎世', 'zurich'] },
	    { flag: '🇳🇱', keys: ['荷蘭', 'netherlands', 'holland', 'nl', '阿姆斯特丹', 'amsterdam'] }
	  ];

	  const DEFAULT_TRIPS = [
	    {
	      id: 'kyoto2026',
      city: '京都',
      country: '日本',
      flag: '🇯🇵',
      start: '2026-05-28',
      end: '2026-06-01',
      status: 'upcoming',
	      tags: ['寺廟神社', 'agete購物', '婚戒', '環球影城', '抹茶', '古著']
	    }
	  ];

	  function getSupabaseClient() {
	    if (!window.supabase || !window.supabase.createClient) return null;
	    if (!supabaseClient) {
	      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
	    }
	    return supabaseClient;
	  }

	  function loadSupabaseSdk() {
	    if (window.supabase && window.supabase.createClient) return Promise.resolve(true);
	    if (supabaseSdkPromise) return supabaseSdkPromise;

	    supabaseSdkPromise = new Promise(resolve => {
	      const script = document.createElement('script');
	      script.src = SUPABASE_SDK_URL;
	      script.async = true;
	      script.onload = () => resolve(true);
	      script.onerror = () => resolve(false);
	      document.head.appendChild(script);
	    });

	    return supabaseSdkPromise;
	  }

	  function getLocalTrips() {
	    try {
	      const saved = localStorage.getItem('travel_trips');
	      return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT_TRIPS));
	    } catch(e) { return JSON.parse(JSON.stringify(DEFAULT_TRIPS)); }
	  }

	  function saveTrips(trips) {
	    try { localStorage.setItem('travel_trips', JSON.stringify(trips)); } catch(e) {}
	  }

	  function tripFromRow(row) {
	    return {
	      id: row.id,
	      city: row.city,
	      country: row.country || '',
	      flag: row.flag || '🗺',
	      start: row.start_date,
	      end: row.end_date,
	      status: row.status || 'planning',
	      tags: Array.isArray(row.tags) ? row.tags : [],
	      legacyKey: row.legacy_key || ''
	    };
	  }

	  async function getTrips() {
	    const client = getSupabaseClient();
	    if (!client || !currentUser) return getLocalTrips();
	    if (tripsCache) return tripsCache;

	    const { data, error } = await client
	      .from('trips')
	      .select('id, city, country, flag, start_date, end_date, status, tags, legacy_key')
	      .eq('group_id', TRAVEL_GROUP_ID);

	    if (error) {
	      console.warn('Supabase trips load failed:', error);
	      return getLocalTrips();
	    }

	    const trips = (data || []).map(tripFromRow);
	    tripsCache = trips;
	    return trips;
	  }

	  function calcDays(start, end) {
	    const d = (new Date(end) - new Date(start)) / 86400000;
	    if (!Number.isFinite(d)) return 1;
	    return Math.max(1, Math.round(d));
	  }
  function formatDate(d) {
    if (!d) return '';
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', year: 'numeric' });
  }
	  function statusLabel(s) {
	    return { upcoming: '即將出發 🌱', completed: '已完成 ✓', planning: '規劃中 💭' }[s] || s;
	  }

	  function safeStatus(status) {
	    return ['upcoming', 'completed', 'planning'].includes(status) ? status : 'planning';
	  }

	  function escapeHtml(value) {
	    return String(value ?? '')
	      .replace(/&/g, '&amp;')
	      .replace(/</g, '&lt;')
	      .replace(/>/g, '&gt;')
	      .replace(/"/g, '&quot;')
	      .replace(/'/g, '&#39;');
	  }

	  function escapeJsArg(value) {
	    return String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
	  }

	  function normalizeFlagText(value) {
	    return String(value || '').toLowerCase().replace(/[\s,_\-+，。・·.]/g, '');
	  }

	  function inferFlag(country, city) {
	    const text = normalizeFlagText(`${country || ''}${city || ''}`);
	    if (!text) return '';
	    const match = COUNTRY_FLAGS.find(item => item.keys.some(key => text.includes(normalizeFlagText(key))));
	    return match ? match.flag : '';
	  }

	  function isPartialRegionalFlag(value) {
	    const chars = Array.from(String(value || '').trim());
	    if (chars.length !== 1) return false;
	    const code = chars[0].codePointAt(0);
	    return code >= 0x1F1E6 && code <= 0x1F1FF;
	  }

	  function getTripFlag(rawFlag, country, city) {
	    const flag = String(rawFlag || '').trim();
	    if (!flag || isPartialRegionalFlag(flag)) return inferFlag(country, city) || '🗺';
	    return inferFlag(flag) || flag;
	  }

	  function syncFlagFromCountry(force = false) {
	    const countryInput = document.getElementById('f-country');
	    const cityInput = document.getElementById('f-city');
	    const flagInput = document.getElementById('f-flag');
	    if (!countryInput || !cityInput || !flagInput) return;
	    if (!force && flagManuallyEdited && flagInput.value.trim()) return;

	    const inferred = inferFlag(countryInput.value, cityInput.value);
	    if (inferred) flagInput.value = inferred;
	  }

	  function markFlagEdited() {
	    const flagInput = document.getElementById('f-flag');
	    flagManuallyEdited = !!(flagInput && flagInput.value.trim());
	  }

	  async function renderTrips() {
	    const list = document.getElementById('trip-list');
	    const empty = document.getElementById('history-empty');
	    if (!list || !empty) return;

	    list.innerHTML = '<div class="trip-loading">載入旅程中...</div>';
	    let trips = [];
	    try {
	      trips = await getTrips();
	    } catch(e) {
	      console.warn('Render trips failed:', e);
	      trips = getLocalTrips();
	    }
	    list.innerHTML = '';

	    if (trips.length === 0) {
      empty.style.display = 'block';
      document.getElementById('stat-trips').textContent = '0';
      document.getElementById('stat-countries').textContent = '0';
      document.getElementById('stat-days').textContent = '0';
      return;
    }
    empty.style.display = 'none';

    // Stats
    const countries = new Set(trips.map(t => t.country)).size;
    const totalDays = trips.filter(t => t.status === 'completed')
                           .reduce((sum, t) => sum + calcDays(t.start, t.end), 0);
    document.getElementById('stat-trips').textContent = trips.length;
    document.getElementById('stat-countries').textContent = countries;
    document.getElementById('stat-days').textContent = totalDays || calcDays(trips[0].start, trips[0].end);

	    // Sort: upcoming first, then planning, then completed
	    const order = { upcoming: 0, planning: 1, completed: 2 };
	    list.innerHTML = [...trips].sort((a,b) => (order[a.status]||2)-(order[b.status]||2) || new Date(b.start)-new Date(a.start))
	    .map(trip => {
	      const days = calcDays(trip.start, trip.end);
	      const status = safeStatus(trip.status);
	      const country = trip.country ? `，${escapeHtml(trip.country)}` : '';
	      const year = new Date(trip.start + 'T00:00:00').getFullYear();
	      const tagsHtml = (trip.tags || []).map(t =>
	        `<span class="trip-highlight-tag">${escapeHtml(t)}</span>`).join('');
	      return `
	        <div class="trip-card">
	          <div class="trip-card-header">
	            <div class="trip-flag">${escapeHtml(trip.flag || '🗺')}</div>
	            <div class="trip-meta">
	              <div class="trip-name">${escapeHtml(trip.city)}${country}</div>
	              <div class="trip-dates">${formatDate(trip.start)} — ${formatDate(trip.end)}</div>
	              <span class="trip-status ${status}">${statusLabel(status)}</span>
	            </div>
	          </div>
	          ${tagsHtml ? `<div class="trip-highlights">${tagsHtml}</div>` : ''}
	          <div class="trip-card-footer">
	            <div class="trip-stat"><div class="trip-stat-num">${days}</div><div class="trip-stat-label">天</div></div>
	            <div class="trip-stat"><div class="trip-stat-num">${escapeHtml(trip.flag || '🌍')}</div><div class="trip-stat-label">${escapeHtml(trip.country || '—')}</div></div>
	            <div class="trip-stat"><div class="trip-stat-num">${Number.isFinite(year) ? year : '—'}</div><div class="trip-stat-label">年份</div></div>
	            <button class="trip-delete-btn" onclick="deleteTrip('${escapeJsArg(trip.id)}')" title="刪除">✕</button>
	          </div>
	        </div>`;
	    }).join('');
	  }

	  async function deleteTrip(id) {
	    if (!confirm('確定要刪除這筆旅遊記錄嗎？')) return;
	    const client = getSupabaseClient();
	    if (client && currentUser) {
	      const { error } = await client
	        .from('trips')
	        .delete()
	        .eq('id', id)
	        .eq('group_id', TRAVEL_GROUP_ID);

	      if (error) {
	        alert('刪除失敗，請稍後再試');
	        console.warn('Supabase trip delete failed:', error);
	        return;
	      }
	      tripsCache = null;
	    } else {
	      const trips = getLocalTrips().filter(t => t.id !== id);
	      saveTrips(trips);
	    }
	    await renderTrips();
	  }

	  /* ─── Modal ─── */
	  function openModal() {
	    if (!currentUser) {
	      alert('請先登入後再新增旅程');
	      const emailInput = document.getElementById('auth-email');
	      if (emailInput) emailInput.focus();
	      return;
	    }
	    document.getElementById('trip-modal').classList.add('open');
	    document.body.style.overflow = 'hidden';
	    // reset form
	    ['f-city','f-country','f-flag','f-start','f-end','f-tags'].forEach(id => {
	      document.getElementById(id).value = '';
	    });
	    flagManuallyEdited = false;
	    document.getElementById('f-status').value = 'upcoming';
	  }
  function closeModal() {
    document.getElementById('trip-modal').classList.remove('open');
    document.body.style.overflow = '';
  }
	  function handleOverlayClick(e) {
	    if (e.target === document.getElementById('trip-modal')) closeModal();
	  }
	  async function saveTrip() {
	    const city    = document.getElementById('f-city').value.trim();
	    const country = document.getElementById('f-country').value.trim();
	    const flag    = getTripFlag(document.getElementById('f-flag').value, country, city);
    const start   = document.getElementById('f-start').value;
    const end     = document.getElementById('f-end').value;
    const status  = document.getElementById('f-status').value;
	    const tagsRaw = document.getElementById('f-tags').value.trim();
	    if (!city || !start || !end) { alert('請填寫目的地和日期 🗺'); return; }
	    const tags = tagsRaw ? tagsRaw.split(/[,，]/).map(t => t.trim()).filter(Boolean) : [];

	    const client = getSupabaseClient();
	    if (!client || !currentUser) {
	      alert('請先登入後再儲存旅程');
	      return;
	    }

	    const { error } = await client.from('trips').insert({
	      group_id: TRAVEL_GROUP_ID,
	      city,
	      country,
	      flag,
	      start_date: start,
	      end_date: end,
	      status,
	      tags
	    });

	    if (error) {
	      alert('儲存失敗，請稍後再試');
	      console.warn('Supabase trip insert failed:', error);
	      return;
	    }

	    tripsCache = null;
	    closeModal();
	    await renderTrips();
	  }

	  function updateAuthUI(message) {
	    const statusEl = document.getElementById('auth-status');
	    const formEl = document.getElementById('auth-form');
	    const resetFormEl = document.getElementById('auth-reset-form');
	    const logoutBtn = document.getElementById('auth-logout');
	    if (!statusEl || !formEl || !resetFormEl || !logoutBtn) return;

	    if (isPasswordRecoveryMode) {
	      statusEl.textContent = message || '請設定新密碼';
	      formEl.style.display = 'none';
	      resetFormEl.style.display = 'grid';
	      logoutBtn.style.display = 'none';
	      return;
	    }

	    if (currentUser) {
	      statusEl.textContent = currentUser.email || '已登入';
	      formEl.style.display = 'none';
	      resetFormEl.style.display = 'none';
	      logoutBtn.style.display = 'inline-flex';
	    } else {
	      statusEl.textContent = message || '未登入';
	      formEl.style.display = 'grid';
	      resetFormEl.style.display = 'none';
	      logoutBtn.style.display = 'none';
	    }
	  }

	  function setAuthBusy(isBusy) {
	    const btn = document.getElementById('auth-login');
	    if (!btn) return;
	    btn.disabled = isBusy;
	    btn.textContent = isBusy ? '登入中...' : '登入';
	  }

	  async function refreshAuth() {
	    const sdkLoaded = await loadSupabaseSdk();
	    if (!sdkLoaded) {
	      currentUser = null;
	      updateAuthUI('Supabase SDK 載入失敗');
	      await renderTrips();
	      return;
	    }

	    const client = getSupabaseClient();
	    if (!client) {
	      currentUser = null;
	      updateAuthUI('Supabase SDK 載入失敗');
	      await renderTrips();
	      return;
	    }

	    const { data, error } = await client.auth.getSession();
	    if (error) {
	      currentUser = null;
	      updateAuthUI('登入狀態讀取失敗');
	      console.warn('Supabase session load failed:', error);
	      return;
	    }

	    currentUser = data.session ? data.session.user : null;
	    tripsCache = null;
	    updateAuthUI();
	    await renderTrips();
	  }

	  async function loginSupabase() {
	    const email = document.getElementById('auth-email').value.trim();
	    const password = document.getElementById('auth-password').value;

	    if (!email || !password) { alert('請輸入 Email 和 Password'); return; }

	    setAuthBusy(true);
	    const sdkLoaded = await loadSupabaseSdk();
	    if (!sdkLoaded) {
	      setAuthBusy(false);
	      alert('Supabase SDK 載入失敗，請確認網路連線後重試');
	      return;
	    }

	    const client = getSupabaseClient();
	    if (!client) {
	      setAuthBusy(false);
	      alert('Supabase SDK 尚未載入');
	      return;
	    }

	    const { data, error } = await client.auth.signInWithPassword({ email, password });
	    setAuthBusy(false);

	    if (error) {
	      alert('登入失敗，請確認帳號或密碼');
	      console.warn('Supabase login failed:', error);
	      return;
	    }

	    currentUser = data.user;
	    isPasswordRecoveryMode = false;
	    tripsCache = null;
	    updateAuthUI();
	    await renderTrips();
	  }

	  async function requestPasswordReset() {
	    const email = document.getElementById('auth-email').value.trim();
	    if (!email) {
	      alert('請先輸入要重設密碼的 Email');
	      document.getElementById('auth-email').focus();
	      return;
	    }

	    const sdkLoaded = await loadSupabaseSdk();
	    const client = sdkLoaded ? getSupabaseClient() : null;
	    if (!client) {
	      alert('Supabase SDK 載入失敗，請確認網路連線後重試');
	      return;
	    }

	    const redirectTo = `${window.location.origin}${window.location.pathname}`;
	    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
	    if (error) {
	      alert('重設密碼信寄送失敗，請稍後再試');
	      console.warn('Supabase password reset request failed:', error);
	      return;
	    }

	    updateAuthUI('已寄出密碼重設信');
	    alert('已寄出密碼重設信，請到信箱點擊連結後回來設定新密碼。');
	  }

	  function setPasswordBusy(isBusy) {
	    const btn = document.getElementById('auth-update-password');
	    if (!btn) return;
	    btn.disabled = isBusy;
	    btn.textContent = isBusy ? '更新中...' : '更新密碼';
	  }

	  async function updateRecoveredPassword() {
	    const password = document.getElementById('auth-new-password').value;
	    const confirmPassword = document.getElementById('auth-new-password-confirm').value;
	    const client = getSupabaseClient();

	    if (!client || !currentUser) {
	      alert('密碼重設連結已失效，請重新寄送密碼重設信。');
	      return;
	    }
	    if (password.length < 8) {
	      alert('新密碼至少需要 8 碼');
	      return;
	    }
	    if (password !== confirmPassword) {
	      alert('兩次輸入的新密碼不一致');
	      return;
	    }

	    setPasswordBusy(true);
	    const { error } = await client.auth.updateUser({ password });
	    setPasswordBusy(false);

	    if (error) {
	      alert('密碼更新失敗，請重新寄送密碼重設信再試一次。');
	      console.warn('Supabase password update failed:', error);
	      return;
	    }

	    document.getElementById('auth-new-password').value = '';
	    document.getElementById('auth-new-password-confirm').value = '';
	    isPasswordRecoveryMode = false;
	    updateAuthUI('密碼已更新');
	    alert('密碼已更新，之後請用新密碼登入。');
	  }

	  async function cancelPasswordRecovery() {
	    isPasswordRecoveryMode = false;
	    const client = getSupabaseClient();
	    if (client) await client.auth.signOut();
	    currentUser = null;
	    tripsCache = null;
	    updateAuthUI();
	    await renderTrips();
	  }

	  async function logoutSupabase() {
	    const client = getSupabaseClient();
	    if (client) await client.auth.signOut();
	    currentUser = null;
	    isPasswordRecoveryMode = false;
	    tripsCache = null;
	    updateAuthUI();
	    await renderTrips();
	  }

	  function initSupabaseAuth() {
	    const passwordInput = document.getElementById('auth-password');
	    if (passwordInput) {
	      passwordInput.addEventListener('keydown', e => {
	        if (e.key === 'Enter') loginSupabase();
	      });
	    }
	    ['auth-new-password', 'auth-new-password-confirm'].forEach(id => {
	      const input = document.getElementById(id);
	      if (input) {
	        input.addEventListener('keydown', e => {
	          if (e.key === 'Enter') updateRecoveredPassword();
	        });
	      }
	    });

	    loadSupabaseSdk().then(isLoaded => {
	      const client = isLoaded ? getSupabaseClient() : null;
	      if (!client) {
	        updateAuthUI('Supabase SDK 載入失敗');
	        return;
	      }

	      client.auth.onAuthStateChange((event, session) => {
		currentUser = session ? session.user : null;
	        isPasswordRecoveryMode = event === 'PASSWORD_RECOVERY';
		tripsCache = null;
	        updateAuthUI(isPasswordRecoveryMode ? '請設定新密碼' : undefined);
	        if (isPasswordRecoveryMode) {
	          setTimeout(() => {
	            const input = document.getElementById('auth-new-password');
	            if (input) input.focus();
	          }, 80);
	        }
		renderTrips();
	      });
	    });

	    refreshAuth();
	  }

	  // Init
	  initSupabaseAuth();
	  renderTrips();

  /* ─── Unified Timeline + Map ─── */

  const DAY_DEFAULTS = {
    day1: [
      {id:'d1_1',time:'14:20',title:'CI172 台北桃園出發',desc:'第二航廈出發 · 飛行時間約 2h45m',tags:[{l:'交通'}],mapQ:'桃園國際機場+第二航廈',lat:25.0772,lng:121.2325},
      {id:'d1_2',time:'18:05',title:'抵達大阪關西國際機場',desc:'入境後搭乘 JR Haruka 特急往京都駅（約 75 分鐘，¥3,490）<br>可在機場購買 ICOCA IC 卡',tags:[{l:'交通'},{l:'KIX→京都',c:'gold'}],mapQ:'関西国際空港',lat:34.4347,lng:135.2440},
      {id:'d1_3',time:'20:00',title:'入住御宿野乃 京都七条',desc:'京都七条エリア · 天然溫泉旅館',tags:[{l:'住宿',c:'dark'}],mapQ:'御宿野乃+京都七条',lat:34.9890,lng:135.7559},
      {id:'d1_4',time:'21:00',title:'晚餐 — 第一旭 or 新福菜館',desc:'京都駅附近老字號拉麵，深夜也開，完美的第一餐',tags:[{l:'美食'}],mapQ:'第一旭+京都駅',lat:34.9872,lng:135.7545}
    ],
    day2: [
      {id:'d2_1',time:'07:30',title:'早餐 + 出發',desc:'旅館早餐或京都駅便當',tags:[{l:'美食'}],mapQ:'御宿野乃+京都七条',lat:34.9890,lng:135.7559},
      {id:'d2_2',time:'08:20',title:'京都駅 → USJ',desc:'JR 新快速到大阪（30min）→ JR 夢咲線（5min）<br>總計約 1 小時・費用 ¥1,080',tags:[{l:'交通'}],mapQ:'ユニバーサルシティ駅+大阪市',lat:34.6654,lng:135.4323},
      {id:'d2_3',time:'09:00',title:'🎡 Universal Studios Japan',desc:'必玩：<strong>超級任天堂世界</strong> · <strong>哈利波特魔法世界</strong><br>DK Adventure — Mine-Cart Madness（快速通關已購）',tags:[{l:'USJ',c:'gold'},{l:'娛樂'}],mapQ:'Universal+Studios+Japan',lat:34.6654,lng:135.4326,
        extra:`<div class="usj-pass-card"><div class="usj-pass-label">🎫 Express Pass — 已購入</div><div class="usj-pass-title">⛏ Mine-Cart Madness</div><div class="usj-pass-detail"><strong>DK Adventure — Donkey Kong 世界</strong><br>搭上礦車在叢林軌道上高速穿梭，躲避障礙・採集金幣！<br><br>🕘 <strong>建議</strong>：開門直衝，Express 入口在設施旁側門<br>📲 進場前 USJ App 確認 Express 入口位置<br>🎒 隨身包需寄置物櫃（場內免費）<br>🍌 DK 區必吃：DK 香蕉杯冰淇淋</div><span class="usj-pass-badge">✓ Minecart Express Pass 已確認</span></div>`},
      {id:'d2_4',time:'21:00',title:'返回京都 · 泡溫泉',desc:'走了一天回旅館泡天然溫泉，最幸福的事',tags:[{l:'住宿',c:'dark'}],mapQ:'御宿野乃+京都七条',lat:34.9890,lng:135.7559}
    ],
    day3: [
      {id:'d3_1',time:'08:30',title:'清水寺',desc:'早晨人少，清水舞台俯瞰京都市區。巴士 206「清水道」下車',tags:[{l:'寺廟'}],mapQ:'清水寺+京都',lat:34.9948,lng:135.7850},
      {id:'d3_2',time:'10:30',title:'二年坂・三年坂 購物',desc:'天然礦石/瑪瑙飾品小店 · 陶器・漆器・京焼<br>傳統工藝品・名片夾・手巾',tags:[{l:'購物'},{l:'飾品',c:'gold'}],mapQ:'二年坂+三年坂+京都',lat:34.9994,lng:135.7828},
      {id:'d3_3',time:'12:30',title:'抹茶午餐 / 甜點',desc:'<strong>伊藤久右衛門 祇園店</strong>— 抹茶拉麵 + 抹茶聖代<br><strong>茶寮 都路里</strong>— 老字號抹茶蕨餅・聖代',tags:[{l:'抹茶',c:'gold'},{l:'美食'}],mapQ:'伊藤久右衛門+祇園店',lat:35.0013,lng:135.7785},
      {id:'d3_4',time:'14:30',title:'高台寺 or 知恩院',desc:'高台寺：枯山水庭園・安靜優美 (¥600)<br>知恩院：日本最大山門・壯觀震撼',tags:[{l:'寺廟'}],mapQ:'高台寺+京都',lat:35.0010,lng:135.7813},
      {id:'d3_5',time:'16:30',title:'寺町京極商店街',desc:'室內拱廊，藥妝・雜貨・文具・礦石飾品，雨天也能逛',tags:[{l:'購物'}],mapQ:'寺町京極商店街+京都',lat:35.0073,lng:135.7673},
      {id:'d3_6',time:'19:00',title:'先斗町晚餐',desc:'京都料理居酒屋，慶祝這段旅程 ✦',tags:[{l:'美食'}],mapQ:'先斗町+京都',lat:35.0038,lng:135.7727}
    ],
    day4: [
      {id:'d4_1',time:'11:00',title:'高島屋 — 銀座白石',desc:'<strong>京都高島屋</strong>（10:00–20:00）<br>📍 <strong>銀座白石</strong> 位於 <strong>2F 寶飾・時計</strong>（建議現場確認最新樓層）<br>鑽石輕奢珠寶・品質卓越',tags:[{l:'銀座白石',c:'gold'},{l:'珠寶'}],mapQ:'京都高島屋',lat:35.0030,lng:135.7707},
      {id:'d4_2',time:'12:30',title:'下午茶',desc:'四条河原町周邊甜點・茶室小憩，充個電再繼續逛',tags:[{l:'下午茶',c:'gold'},{l:'美食'}],mapQ:'四条河原町+京都+カフェ',lat:35.0038,lng:135.7720},
      {id:'d4_3',time:'14:00',title:'Kyoto Loft — mina京都',desc:'<strong>mina京都 4F–6F</strong>（11:00–21:00）<br>設計文具・生活雜貨・季節選物，三層樓超好逛',tags:[{l:'Loft'},{l:'購物'}],mapQ:'ミーナ京都+ロフト',lat:35.0078,lng:135.7683},
      {id:'d4_4',time:'15:30',title:'% Arabica — 精品咖啡',desc:'<strong>藤井大丸 1F</strong>（10:30–20:00）<br>京都人氣 Specialty Coffee，latte art 一流，必拍',tags:[{l:'☕ 咖啡',c:'gold'}],mapQ:'%Arabica+藤井大丸+京都',lat:35.0025,lng:135.7680},
      {id:'d4_5',time:'16:30',title:'大丸京都 — agete 輕奢珠寶',desc:'<strong>大丸京都店 1F</strong>（10:00–20:00）<br>agete 日本輕奢珠寶，細膩工藝・適合日常配戴',tags:[{l:'agete',c:'gold'},{l:'珠寶'}],mapQ:'大丸京都+agete',lat:35.0030,lng:135.7665}
    ],
    day5: [
      {id:'d5_1',time:'08:00',title:'享用旅館早餐',desc:'御宿野乃和式定食，泡完溫泉後最幸福的一餐',tags:[{l:'美食'}],mapQ:'御宿野乃+京都七条',lat:34.9890,lng:135.7559},
      {id:'d5_2',time:'10:00',title:'退房 + JR 京都伊勢丹採購',desc:'抹茶零食・漬物・伴手禮，最後補購',tags:[{l:'採購'}],mapQ:'ジェイアール京都伊勢丹',lat:34.9857,lng:135.7587},
      {id:'d5_3',time:'11:30',title:'京都 → 大阪（JR 新快速）',desc:'約 30 分鐘・¥570',tags:[{l:'交通'}],mapQ:'大阪駅',lat:34.7025,lng:135.4979},
      {id:'d5_4',time:'12:30',title:'道頓堀 · 心齋橋',desc:'午餐大阪燒 or 章魚燒，心齋橋藥妝最後補購，Glico 看板合照',tags:[{l:'大阪'},{l:'美食'}],mapQ:'道頓堀+大阪',lat:34.6687,lng:135.5017},
      {id:'d5_5',time:'16:30',title:'前往 KIX 關西機場',desc:'難波搭南海特急 Rapit 約 45 分，或 JR Haruka',tags:[{l:'交通'}],mapQ:'関西国際空港',lat:34.4347,lng:135.2440},
      {id:'d5_6',time:'19:05',title:'CI173 大阪關西 → 台北桃園',desc:'21:10 抵達桃園，飛行時間約 3 小時',tags:[{l:'回家',c:'dark'}],mapQ:'桃園國際機場',lat:25.0772,lng:121.2325}
    ]
  };

  const LMAPS = {}; // dayId → Leaflet map instance

  // 強制清除 day3/day4 舊快取（行程對調後 bust cache）
  if (!localStorage.getItem('kyoto_reset_swap_v4')) {
    localStorage.removeItem('kyoto_sched_day3');
    localStorage.removeItem('kyoto_sched_day4');
    localStorage.setItem('kyoto_reset_swap_v4', '1');
  }

  function getSchedule(dayId) {
    try {
      const saved = JSON.parse(localStorage.getItem('kyoto_sched_' + dayId));
      if (saved && saved.length > 0) return saved;
    } catch(e) {}
    return JSON.parse(JSON.stringify(DAY_DEFAULTS[dayId] || []));
  }
  function saveSchedule(dayId, items) {
    try { localStorage.setItem('kyoto_sched_' + dayId, JSON.stringify(items)); } catch(e) {}
  }

  function tagHtml(tags) {
    return (tags||[]).map(t => {
      const cls = t.c ? ' ' + t.c : '';
      return `<span class="tl-tag${cls}">${t.l}</span>`;
    }).join('');
  }

  function renderTimeline(dayId) {
    const tl = document.getElementById('timeline-' + dayId);
    if (!tl) return;
    const items = getSchedule(dayId);
    items.sort((a,b) => (a.time||'99:99').localeCompare(b.time||'99:99'));
    tl.innerHTML = '';
    items.forEach((item, idx) => {
      const isCustom = !item.id.startsWith('d');
      const div = document.createElement('div');
      div.className = 'tl-item' + (isCustom ? ' custom-item' : '');
      div.dataset.id = item.id;
      const mapLink = item.mapQ
        ? `<a class="tl-map-link" href="https://maps.google.com/?q=${item.mapQ}" target="_blank">📍 查看地圖</a>`
        : '';
      const extra = item.extra ? item.extra : '';
      const ticketBtn = item.id === 'd2_3'
        ? `<button class="tl-ticket-btn" onclick="openTicket()">🎫 查看快速通關券</button>`
        : '';
      div.innerHTML = `
        <div class="tl-time-col">${item.time||'—'}</div>
        <div class="tl-body">
          <div class="tl-title">${item.title}</div>
          <div class="tl-desc">${item.desc||''}</div>
          ${item.tags&&item.tags.length ? `<div class="tl-tags">${tagHtml(item.tags)}</div>` : ''}
          ${extra}
          ${ticketBtn}
          ${mapLink}
          <button class="tl-del-btn" onclick="deleteItem('${dayId}','${item.id}')">✕ 刪除</button>
        </div>`;
      tl.appendChild(div);
    });
    renderMap(dayId, items);
  }

  function renderMap(dayId, items) {
    const stops = (items||getSchedule(dayId)).filter(it => it.lat && it.lng);
    const container = document.getElementById('map-' + dayId);
    if (!container) return;

    // If map not yet initialized, create it
    if (!LMAPS[dayId]) {
      if (typeof L === 'undefined') return;
      const center = stops.length
        ? [stops.reduce((s,i)=>s+i.lat,0)/stops.length, stops.reduce((s,i)=>s+i.lng,0)/stops.length]
        : [35.0116, 135.7681];
      const zoom = stops.length > 1 ? 12 : 14;
      LMAPS[dayId] = L.map(container, {zoomControl:true, attributionControl:false}).setView(center, zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:18}).addTo(LMAPS[dayId]);
    }

    const map = LMAPS[dayId];
    // Clear existing layers except tile layer
    map.eachLayer(layer => { if (layer instanceof L.Marker || layer instanceof L.Polyline) map.removeLayer(layer); });

    if (!stops.length) return;

    // Numbered markers
    stops.forEach((stop, i) => {
      const icon = L.divIcon({
        className: '',
        html: `<div class="map-pin">${i+1}</div>`,
        iconSize: [26,26], iconAnchor: [13,13]
      });
      L.marker([stop.lat, stop.lng], {icon})
        .bindTooltip(stop.title, {permanent:false, direction:'top'})
        .addTo(map);
    });

    // Route polyline
    const latlngs = stops.map(s => [s.lat, s.lng]);
    L.polyline(latlngs, {color:'#D56989', weight:2.5, opacity:0.7, dashArray:'6,4'}).addTo(map);

    // Fit bounds
    if (stops.length > 1) {
      map.fitBounds(L.latLngBounds(latlngs), {padding:[16,16]});
    }

    // Update Google Maps link
    const gmLink = document.getElementById('gmaps-' + dayId);
    if (gmLink && stops.length) {
      const waypoints = stops.map(s => s.mapQ||`${s.lat},${s.lng}`).join('/');
      gmLink.href = `https://www.google.com/maps/dir/${waypoints}`;
    }
  }

  function toggleAddForm(dayId) {
    const form = document.getElementById('add-form-' + dayId);
    if (!form) return;
    const showing = form.style.display !== 'none';
    form.style.display = showing ? 'none' : 'block';
    if (!showing) document.getElementById('add-name-' + dayId).focus();
  }

  function confirmAddItem(dayId) {
    const time = (document.getElementById('add-time-' + dayId).value || '').trim();
    const name = (document.getElementById('add-name-' + dayId).value || '').trim();
    if (!name) { document.getElementById('add-name-' + dayId).focus(); return; }
    const items = getSchedule(dayId);
    items.push({ id: 'c_' + Date.now(), time, title: name, desc: '', tags: [{l:'自訂'}], isCustom: true });
    saveSchedule(dayId, items);
    document.getElementById('add-time-' + dayId).value = '';
    document.getElementById('add-name-' + dayId).value = '';
    toggleAddForm(dayId);
    renderTimeline(dayId);
  }

  function deleteItem(dayId, id) {
    const items = getSchedule(dayId).filter(i => i.id !== id);
    saveSchedule(dayId, items);
    renderTimeline(dayId);
  }

  // Initialize all timelines; maps init lazily when day is shown
  ['day1','day2','day3','day4','day5'].forEach(renderTimeline);

  // Re-invalidate map size when switching days
  const _origSwitchDay = window.switchDay;
  window.switchDay = function(dayId, btn) {
    if (_origSwitchDay) _origSwitchDay(dayId, btn);
    setTimeout(() => {
      if (LMAPS[dayId]) LMAPS[dayId].invalidateSize();
      else renderMap(dayId);
    }, 50);
  };


  /* ─── Expense Tracker ─── */
  let selectedPayer = 'Vik';

  function selectPayer(name, btn) {
    selectedPayer = name;
    document.querySelectorAll('.exp-payer-btn').forEach(b => {
      b.classList.remove('sel-vik','sel-mike');
    });
    btn.classList.add(name === 'Vik' ? 'sel-vik' : 'sel-mike');
  }

  function getExpenses() {
    try { return JSON.parse(localStorage.getItem('kyoto_expenses') || '[]'); } catch(e) { return []; }
  }
  function saveExpenses(arr) {
    try { localStorage.setItem('kyoto_expenses', JSON.stringify(arr)); } catch(e) {}
  }

  function addExpense() {
    const purpose  = document.getElementById('exp-purpose').value.trim();
    const currency = document.getElementById('exp-currency').value;
    const amount   = parseFloat(document.getElementById('exp-amount').value);
    if (!purpose) { document.getElementById('exp-purpose').focus(); return; }
    if (!amount || amount <= 0) { document.getElementById('exp-amount').focus(); return; }
    const arr = getExpenses();
    arr.push({ id: Date.now(), purpose, currency, amount, paidBy: selectedPayer });
    saveExpenses(arr);
    document.getElementById('exp-purpose').value = '';
    document.getElementById('exp-amount').value = '';
    renderExpenses();
  }

  function deleteExpense(id) {
    saveExpenses(getExpenses().filter(e => e.id !== id));
    renderExpenses();
  }

  function renderExpenses() {
    const arr = getExpenses();
    const list = document.getElementById('expense-list');
    const sumEl = document.getElementById('expense-summary');
    list.innerHTML = '';

    if (arr.length === 0) { sumEl.style.display = 'none'; return; }

    arr.forEach(e => {
      const div = document.createElement('div');
      div.className = 'expense-item';
      const cls = e.paidBy === 'Vik' ? 'vik' : 'mike';
      const sym = e.currency === 'JPY' ? '¥' : e.currency === 'TWD' ? 'NT$' : '$';
      const fmt = e.currency === 'JPY'
        ? Math.round(e.amount).toLocaleString()
        : e.amount.toLocaleString('en', {minimumFractionDigits:0, maximumFractionDigits:0});
      div.innerHTML = `
        <div class="expense-item-row">
          <span class="exp-tag ${cls}">${e.paidBy === 'Vik' ? '👩 Vik' : '👨 Mike'}</span>
          <span class="exp-purpose">${e.purpose}</span>
          <span class="exp-amount-val" style="font-size:13px;">${sym}${fmt}</span>
          <span class="exp-chevron">▾</span>
        </div>
        <div class="expense-item-detail">
          <span style="font-size:11px;color:var(--muted-fg);">幣別：${e.currency}</span>
          <span style="flex:1;"></span>
          <button class="exp-del" onclick="event.stopPropagation();deleteExpense(${e.id})">✕ 刪除</button>
        </div>`;
      div.addEventListener('click', () => div.classList.toggle('expanded'));
      list.appendChild(div);
    });

    // Summary
    const totals = {};
    const vikTotals = {};
    const mikeTotals = {};
    arr.forEach(e => {
      totals[e.currency]    = (totals[e.currency]    || 0) + e.amount;
      if (e.paidBy === 'Vik')  vikTotals[e.currency]  = (vikTotals[e.currency]  || 0) + e.amount;
      if (e.paidBy === 'Mike') mikeTotals[e.currency] = (mikeTotals[e.currency] || 0) + e.amount;
    });
    const currencies = Object.keys(totals);
    const symMap = { JPY:'¥', TWD:'NT$', USD:'$' };
    let html = '<div class="exp-sum-title">📊 花費統計</div>';
    currencies.forEach(c => {
      const sym = symMap[c] || c;
      const fmt = n => c === 'JPY' ? Math.round(n).toLocaleString() : n.toLocaleString('en',{minimumFractionDigits:0,maximumFractionDigits:0});
      html += `<div class="exp-sum-row"><span>合計 ${c}</span><span class="exp-sum-val">${sym}${fmt(totals[c])}</span></div>`;
      if (vikTotals[c])  html += `<div class="exp-sum-row" style="padding-left:14px;font-size:12px;color:var(--muted-fg)"><span>👩 Vik</span><span>${sym}${fmt(vikTotals[c])}</span></div>`;
      if (mikeTotals[c]) html += `<div class="exp-sum-row" style="padding-left:14px;font-size:12px;color:var(--muted-fg)"><span>👨 Mike</span><span>${sym}${fmt(mikeTotals[c])}</span></div>`;
    });
    sumEl.innerHTML = html;
    sumEl.style.display = 'block';
  }

  renderExpenses();

  // ── Ticket lightbox ──
  function openTicket() {
    document.getElementById('ticket-overlay').classList.add('open');
  }
  function closeTicket() {
    document.getElementById('ticket-overlay').classList.remove('open');
    _lbResetZoom('ticket-overlay');
  }
