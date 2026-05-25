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
    if (name === 'itinerary') {
      setTimeout(() => {
        const activeDay = document.querySelector('.day-content.active');
        if (activeDay && typeof refreshDayMap === 'function') refreshDayMap(activeDay.id);
      }, 80);
    }
    if (name === 'info' && typeof renderExpenses === 'function') renderExpenses();
  }
  function switchDay(id, btn) {
    const dayEl = document.getElementById(id);
    if (!dayEl || !btn) return;
    document.querySelectorAll('.day-content').forEach(d => d.classList.remove('active'));
    document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
    dayEl.classList.add('active');
    btn.classList.add('active');
    btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    setTimeout(() => {
      if (typeof refreshDayMap === 'function') refreshDayMap(id);
    }, 50);
  }
  /* ─── Daily Tips → jump to itinerary day ─── */
  function goToDay(dayId) {
    switchPage('itinerary');
    setTimeout(() => {
      const tabs = document.querySelectorAll('.day-tab');
      const idx = Math.max(0, Number(String(dayId).replace('day', '')) - 1);
      if (Number.isFinite(idx) && tabs[idx]) switchDay(dayId, tabs[idx]);
    }, 120);
  }
  function switchCat(id, btn) {
    document.querySelectorAll('.cat-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
  }

  /* ─── Checkboxes ─── */
  function setCheckItemState(item, isChecked) {
    if (!item) return;
    item.classList.toggle('checked', !!isChecked);
    const tick = item.querySelector('.check-tick');
    if (tick) tick.style.display = isChecked ? 'block' : 'none';
  }

  function getChecklistBlueprintFromDom() {
    const items = Array.from(document.querySelectorAll('.check-item'));
    if (items.length === 0) return DEFAULT_CHECKLIST_ITEMS;
    return items.map((item, index) => ({
      label: item.dataset.checkLabel || item.querySelector('.check-text')?.textContent.trim() || `項目 ${index + 1}`,
      sub: item.querySelector('.check-sub')?.textContent.trim() || ''
    }));
  }

  function getChecklistStateFromDom() {
    return Array.from(document.querySelectorAll('.check-item')).map(i => i.classList.contains('checked'));
  }

  function getLocalChecklistState() {
    try { return JSON.parse(localStorage.getItem(getTripStorageKey('checks')) || '[]'); } catch(e) { return []; }
  }

  function saveLocalChecklistState(state) {
    try { localStorage.setItem(getTripStorageKey('checks'), JSON.stringify(state)); } catch(e) {}
  }

  async function toggleCheck(item) {
    const tripId = activeTripId;
    const nextState = !item.classList.contains('checked');
    setCheckItemState(item, nextState);

    const client = getSupabaseClient();
    if (client && currentUser && tripId) {
      const itemId = item.dataset.checkId;
      if (!itemId) {
        checklistCacheByTrip[tripId] = null;
        checklistLoadPromisesByTrip[tripId] = null;
        await getChecklistItems();
        const matched = (checklistCacheByTrip[tripId] || []).find(row => row.label === item.dataset.checkLabel);
        if (matched) item.dataset.checkId = matched.id;
      }

      const remoteId = item.dataset.checkId;
      if (remoteId) {
        const { error } = await client
          .from('checklist_items')
          .update({ checked: nextState })
          .eq('id', remoteId)
          .eq('group_id', TRAVEL_GROUP_ID)
          .eq('trip_id', tripId);

        if (error) {
          setCheckItemState(item, !nextState);
          alert('清單更新失敗，請稍後再試');
          console.warn('Supabase checklist update failed:', error);
          return;
        }

        if (checklistCacheByTrip[tripId]) {
          checklistCacheByTrip[tripId] = checklistCacheByTrip[tripId].map(row =>
            row.id === remoteId ? { ...row, checked: nextState } : row
          );
        }
        return;
      }
    }

    saveLocalChecklistState(getChecklistStateFromDom());
  }

  function applySavedChecks() {
    renderChecklist();
  }

  /* ─── Countdown ─── */
  function updateCountdown() {
    const trip = getActiveTrip();
    const target = getTripCountdownTarget(trip);
    const diff = target - new Date();
    const el = document.getElementById('countdown-days');
    const txt = document.getElementById('countdown-text');
    if (!el || !txt) return;
    if (!trip || !target || Number.isNaN(target.getTime())) {
      el.innerHTML = '<span class="accent">—</span>';
      txt.textContent = '請先選擇旅程';
      return;
    }
    if (diff <= 0) {
      el.innerHTML = '<span class="accent">✈</span>';
      txt.textContent = '出發囉！旅程開始';
    } else {
      const days = Math.floor(diff / 86400000);
      const hrs  = Math.floor((diff % 86400000) / 3600000);
      el.textContent = days;
      txt.textContent = `天 ${hrs} 小時後出發 · ${formatTripDate(trip.start)}`;
    }
  }
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
	  const PASSWORD_RECOVERY_FLAG_KEY = 'travel_password_recovery_pending';
	  let sawPasswordRecoveryUrlOnLoad = false;

	  function isPasswordRecoveryUrl() {
	    const markerText = `${window.location.search || ''}&${window.location.hash || ''}`.toLowerCase();
	    return markerText.includes('type=recovery') ||
	      markerText.includes('password-recovery=1') ||
	      markerText.includes('mode=password-recovery');
	  }

	  sawPasswordRecoveryUrlOnLoad = isPasswordRecoveryUrl();
	  if (sawPasswordRecoveryUrlOnLoad) {
	    try {
	      sessionStorage.setItem(PASSWORD_RECOVERY_FLAG_KEY, '1');
	    } catch(e) {}
	  }

	  function setPasswordRecoveryMode(isActive) {
	    isPasswordRecoveryMode = !!isActive;
	    try {
	      if (isPasswordRecoveryMode) {
	        sessionStorage.setItem(PASSWORD_RECOVERY_FLAG_KEY, '1');
	      } else {
	        sessionStorage.removeItem(PASSWORD_RECOVERY_FLAG_KEY);
	      }
	    } catch(e) {}
	  }

	  function hasPendingPasswordRecovery() {
	    if (sawPasswordRecoveryUrlOnLoad || isPasswordRecoveryUrl()) return true;
	    try {
	      return sessionStorage.getItem(PASSWORD_RECOVERY_FLAG_KEY) === '1';
	    } catch(e) {
	      return false;
	    }
	  }

	  function clearPasswordRecoveryUrl() {
	    if (!isPasswordRecoveryUrl()) return;
	    try {
	      window.history.replaceState({}, document.title, `${window.location.origin}${window.location.pathname}`);
	    } catch(e) {}
	    sawPasswordRecoveryUrlOnLoad = false;
	  }
	  let tripsCache = null;
	  let expensesCacheByTrip = {};
	  let itineraryCacheByTrip = {};
	  let itineraryLoadPromisesByTrip = {};
	  let checklistCacheByTrip = {};
	  let checklistLoadPromisesByTrip = {};
	  let shoppingCacheByTrip = {};
	  let shoppingLoadPromisesByTrip = {};
	  let expenseRenderSeq = 0;
	  let itineraryRenderSeq = 0;
	  let checklistRenderSeq = 0;
	  let shoppingRenderSeq = 0;
	  let activeTripId = null;
	  let activeTrip = null;
	  let flagManuallyEdited = false;
	  let shoppingUser = 'vik';
	  let shoppingPhoto = null;
	  const ACTIVE_TRIP_STORAGE_KEY = 'travel_active_trip_id';
	  const ORIGINAL_INFO_HTML = document.getElementById('page-info')?.innerHTML || '';

	  const DEFAULT_CHECKLIST_ITEMS = [
	    { label: '護照、機票、住宿確認', sub: '出發前確認可離線查看' },
	    { label: '交通票券與 USJ 票券', sub: 'JR / ICOCA / Express Pass' },
	    { label: '現金、信用卡、退稅資料', sub: '小店多數仍以現金為主' },
	    { label: '網路 SIM / Wi-Fi', sub: '抵達後可立即查路線' },
	    { label: '雨具與舒適鞋', sub: '5 月底可能遇到梅雨' }
	  ];

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
	      legacyKey: 'kyoto2026',
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

	  function expenseFromRow(row) {
	    return {
	      id: row.id,
	      purpose: row.title || '',
	      currency: row.currency || 'JPY',
	      amount: Number(row.amount) || 0,
	      paidBy: row.paid_by_name || 'Vik'
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

	  function getStoredActiveTripId() {
	    try { return localStorage.getItem(ACTIVE_TRIP_STORAGE_KEY) || ''; } catch(e) { return ''; }
	  }

	  function persistActiveTripId(id) {
	    try {
	      if (id) localStorage.setItem(ACTIVE_TRIP_STORAGE_KEY, id);
	      else localStorage.removeItem(ACTIVE_TRIP_STORAGE_KEY);
	    } catch(e) {}
	  }

	  function sortTripsForDisplay(trips) {
	    const order = { upcoming: 0, planning: 1, completed: 2 };
	    return [...trips].sort((a, b) =>
	      (order[a.status] ?? 2) - (order[b.status] ?? 2) ||
	      new Date(b.start) - new Date(a.start)
	    );
	  }

	  function findTripByAnyId(trips, id) {
	    if (!id) return null;
	    return (trips || []).find(t => t.id === id || t.legacyKey === id) || null;
	  }

	  function setActiveTripFromTrip(trip, shouldPersist = true) {
	    activeTrip = trip || null;
	    activeTripId = trip ? trip.id : null;
	    if (shouldPersist) persistActiveTripId(activeTripId);
	  }

	  function ensureActiveTrip(trips) {
	    if (!trips || trips.length === 0) {
	      setActiveTripFromTrip(null);
	      return null;
	    }

	    const storedId = getStoredActiveTripId();
	    const selected =
	      findTripByAnyId(trips, activeTripId) ||
	      findTripByAnyId(trips, storedId) ||
	      sortTripsForDisplay(trips)[0];

	    setActiveTripFromTrip(selected);
	    return selected;
	  }

	  function getActiveTrip() {
	    return activeTrip || null;
	  }

	  async function setActiveTrip(id, options = {}) {
	    let trips = [];
	    try { trips = await getTrips(); } catch(e) { trips = getLocalTrips(); }
	    const trip = findTripByAnyId(trips, id);
	    if (!trip) return;

	    setActiveTripFromTrip(trip);
	    expenseRenderSeq += 1;
	    itineraryRenderSeq += 1;
	    checklistRenderSeq += 1;
	    shoppingRenderSeq += 1;
	    renderActiveTripUI(trips);
	    updateTripCardSelection();
	    if (options.navigate !== false) switchPage('home');
	  }

	  function isKyotoTrip(trip = getActiveTrip()) {
	    if (!trip) return false;
	    return trip.id === 'kyoto2026' || trip.legacyKey === 'kyoto2026';
	  }

	  function normalizeStorageKey(value) {
	    return String(value || 'trip')
	      .trim()
	      .replace(/[^a-zA-Z0-9_-]/g, '_')
	      .replace(/_+/g, '_')
	      .replace(/^_+|_+$/g, '') || 'trip';
	  }

	  function getTripStoragePrefix(trip = getActiveTrip() || DEFAULT_TRIPS[0]) {
	    if (isKyotoTrip(trip)) return 'kyoto';
	    return 'trip_' + normalizeStorageKey(trip?.id || trip?.legacyKey || trip?.city || 'current');
	  }

	  function getTripStorageKey(suffix) {
	    return `${getTripStoragePrefix()}_${suffix}`;
	  }

	  function parseTripDate(value) {
	    if (!value) return null;
	    const dt = new Date(value + 'T00:00:00');
	    return Number.isNaN(dt.getTime()) ? null : dt;
	  }

	  function formatTripDate(value, options) {
	    const dt = parseTripDate(value);
	    if (!dt) return '';
	    return dt.toLocaleDateString('zh-TW', options || { month: 'short', day: 'numeric', year: 'numeric' });
	  }

	  function formatTripDateShort(value) {
	    return formatTripDate(value, { month: 'numeric', day: '2-digit' });
	  }

	  function getTripYear(trip) {
	    const dt = parseTripDate(trip?.start);
	    return dt ? dt.getFullYear() : '';
	  }

	  function getTripDayDates(trip = getActiveTrip()) {
	    const start = parseTripDate(trip?.start);
	    const end = parseTripDate(trip?.end);
	    if (!start || !end || end < start) return [];

	    const dates = [];
	    const cursor = new Date(start);
	    while (cursor <= end && dates.length < 31) {
	      dates.push(new Date(cursor));
	      cursor.setDate(cursor.getDate() + 1);
	    }
	    return dates;
	  }

	  function getTripCountdownTarget(trip) {
	    if (!trip?.start) return null;
	    if (isKyotoTrip(trip)) return new Date('2026-05-28T14:20:00+08:00');
	    return parseTripDate(trip.start);
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

	  function renderActiveTripUI(trips = null) {
	    if (trips) ensureActiveTrip(trips);
	    const trip = getActiveTrip();

	    renderHomeForTrip(trip);
	    renderItinerary();
	    renderInfoForTrip(trip);
	    resetPayerSelection();
	    applySavedChecks();
	    renderExpenses();
	    renderShopList();
	  }

	  function updateTripCardSelection() {
	    document.querySelectorAll('.trip-card[data-trip-id]').forEach(card => {
	      card.classList.toggle('active', card.dataset.tripId === activeTripId);
	    });
	  }

	  function setHomeSectionVisibility(selector, isVisible) {
	    const el = document.querySelector(selector);
	    if (el) el.style.display = isVisible ? '' : 'none';
	  }

	  function renderHomeForTrip(trip) {
	    if (!trip) return;

	    const year = getTripYear(trip);
	    const country = trip.country ? ` · ${trip.country}` : '';
	    const dateRange = `${formatTripDate(trip.start)} — ${formatTripDate(trip.end)}`;
	    const heroOverline = document.querySelector('.hero-overline');
	    const heroTitle = document.querySelector('.hero-title');
	    const heroSub = document.querySelector('.hero-sub');
	    const cdDate = document.querySelector('.cd-date');

	    if (heroOverline) {
	      heroOverline.innerHTML = `<span class="gold-line"></span>${escapeHtml(trip.city)} Journey &nbsp;/&nbsp; ${escapeHtml(statusLabel(safeStatus(trip.status)).replace(/[🌱✓💭]/g, '').trim())}`;
	    }
	    if (heroTitle) heroTitle.innerHTML = `${escapeHtml(trip.city || '旅程')}<br><em>${escapeHtml(year || '')}</em>`;
	    if (heroSub) heroSub.textContent = `${dateRange}${country}`;
	    if (cdDate) cdDate.textContent = isKyotoTrip(trip) ? 'Thu, May 28 · CI172 · 14:20' : `${trip.flag || '✈'} ${dateRange}`;
	    if (trip.city) document.title = `${trip.city} ${year || ''} — Yuhsuan's Journey`;

	    const showKyotoDetails = isKyotoTrip(trip);
	    setHomeSectionVisibility('.subway-btn-wrap', showKyotoDetails);
	    setHomeSectionVisibility('.flight-dashboard', showKyotoDetails);
	    setHomeSectionVisibility('.home-hotel-card', showKyotoDetails);

	    renderWeatherCards(trip);
	    renderDayThemeCards(trip);
	    updateCountdown();
	  }

	  function renderWeatherCards(trip) {
	    const scroll = document.querySelector('.weather-scroll');
	    const note = document.querySelector('.weather-note');
	    if (!scroll || !trip) return;

	    const kyotoWeather = [
	      { icon: '☀️', high: '28°', low: '20°', desc: '晴天' },
	      { icon: '⛅', high: '27°', low: '19°', desc: '晴時多雲' },
	      { icon: '🌤', high: '26°', low: '18°', desc: '多雲' },
	      { icon: '🌦', high: '24°', low: '17°', desc: '偶陣雨' },
	      { icon: '🌧', high: '23°', low: '17°', desc: '陣雨' }
	    ];
	    const dates = getTripDayDates(trip).slice(0, 7);
	    const fallback = { icon: '☁️', high: '—', low: '—', desc: '待查' };

	    scroll.innerHTML = dates.map((dt, i) => {
	      const yyyyMmDd = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
	      const weather = isKyotoTrip(trip) ? (kyotoWeather[i] || fallback) : fallback;
	      return `
	        <div class="weather-card ${i === 0 ? 'today-card' : ''}">
	          <div class="weather-date">${formatTripDateShort(yyyyMmDd)}</div>
	          <div class="weather-day">${dt.toLocaleDateString('en-US', { weekday: 'short' })}</div>
	          <div class="weather-icon">${weather.icon}</div>
	          <div class="weather-high">${weather.high}</div>
	          <div class="weather-low">${weather.low}</div>
	          <div class="weather-desc">${weather.desc}</div>
	        </div>`;
	    }).join('');

	    if (note) {
	      note.textContent = isKyotoTrip(trip)
	        ? '📍 京都典型初夏天氣，請出發前確認最新預報'
	        : `📍 ${trip.city} 天氣尚未接入即時預報，請出發前確認最新資訊`;
	    }
	  }

	  function renderDayThemeCards(trip) {
	    const scroll = document.querySelector('.tips-section .tips-scroll');
	    if (!scroll || !trip) return;

	    const kyotoThemes = [
	      ['✈️', '抵達日 — Arrival', '飛往大阪 · JR Haruka 入住 · 第一碗京都拉麵'],
	      ['🎢', '大阪環球影城 — USJ', '任天堂世界 · 哈利波特 · Minecart 快速通關'],
	      ['⛩', '東山文化路線 — Higashiyama', '清水寺 · 二三年坂 · 抹茶午餐 · 高台寺 · 先斗町晚餐'],
	      ['🛍', '文化 × 購物 — Shop & Explore', '銀座白石 · 下午茶 · Kyoto Loft · % Arabica · agete'],
	      ['🏠', '返台日 — Departure', '退房 · 大阪道頓堀 · 關西機場 CI173']
	    ];

	    scroll.innerHTML = getTripDayDates(trip).map((dt, i) => {
	      const dayId = `day${i + 1}`;
	      const yyyyMmDd = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
	      const theme = isKyotoTrip(trip)
	        ? (kyotoThemes[i] || ['🗓', `第 ${i + 1} 天`, ''])
	        : ['🗓', `第 ${i + 1} 天 — ${trip.city}`, '尚未新增行程，點進每日行程開始安排'];
	      return `
	        <div class="tip-day-card" onclick="goToDay('${dayId}')">
	          <div class="tip-day-num">${formatTripDateShort(yyyyMmDd)}<span>${theme[0]}</span></div>
	          <div class="tip-day-body">
	            <div class="tip-day-title">${escapeHtml(theme[1])}</div>
	            <div class="tip-day-hint">${escapeHtml(theme[2])}</div>
	          </div>
	          <div class="tip-day-arrow">›</div>
	        </div>`;
	    }).join('');
	  }

	  function getExpenseFormHtml() {
	    return `
	      <div class="info-sec-title">💰 花費紀錄</div>
	      <div class="expense-form">
	        <div class="exp-row">
	          <input class="exp-input" id="exp-purpose" type="text" placeholder="用途（例：午餐、車票、藥妝…）">
	        </div>
	        <div class="exp-row">
	          <select class="exp-select" id="exp-currency">
	            <option value="JPY">¥ JPY</option>
	            <option value="TWD">$ TWD</option>
	            <option value="USD">$ USD</option>
	          </select>
	          <input class="exp-input exp-amount" id="exp-amount" type="number" placeholder="金額" min="0" step="1">
	        </div>
	        <div class="exp-payer" id="exp-payer-btns">
	          <button class="exp-payer-btn sel-vik" onclick="selectPayer('Vik',this)">👩 Vik</button>
	          <button class="exp-payer-btn" onclick="selectPayer('Mike',this)">👨 Mike</button>
	        </div>
	        <button class="exp-add-btn" onclick="addExpense()">＋ 新增花費</button>
	      </div>
	      <div class="expense-list" id="expense-list"></div>
	      <div class="expense-summary" id="expense-summary" style="display:none;"></div>`;
	  }

	  function getChecklistModeLabel() {
	    return canUseRemoteChecklist() ? '儲存到 Supabase' : '本機暫存';
	  }

	  function getChecklistModeClass() {
	    return canUseRemoteChecklist() ? 'remote' : 'local';
	  }

	  function getChecklistSub(label, index) {
	    const defaults = DEFAULT_CHECKLIST_ITEMS;
	    return defaults.find(item => item.label === label)?.sub || defaults[index]?.sub || '';
	  }

	  function checklistItemHtml(item, index) {
	    const label = item.label || `項目 ${index + 1}`;
	    const sub = item.sub || getChecklistSub(label, index);
	    const checked = item.checked ? ' checked' : '';
	    const checkId = item.id ? ` data-check-id="${escapeHtml(item.id)}"` : '';
	    return `
	        <div class="check-item${checked}" onclick="toggleCheck(this)" data-check-label="${escapeHtml(label)}"${checkId}>
	          <div class="check-box"><span class="check-tick" style="display:${item.checked ? 'block' : 'none'};">✓</span></div>
	          <div>
	            <div class="check-text">${escapeHtml(label)}</div>
	            ${sub ? `<div class="check-sub">${escapeHtml(sub)}</div>` : ''}
	          </div>
	        </div>`;
	  }

	  function getChecklistHtml(items = DEFAULT_CHECKLIST_ITEMS) {
	    return `
	      <div class="info-sec-title">✅ 準備清單</div>
	      <div class="check-section">
	        <div class="check-section-header">
	          <span>Travel Checklist</span>
	          <span class="tl-storage-mode ${getChecklistModeClass()}" id="check-storage-mode">${getChecklistModeLabel()}</span>
	        </div>
	        <div id="checklist-list">
	          ${items.map((item, index) => checklistItemHtml(item, index)).join('')}
	        </div>
	      </div>`;
	  }

	  function renderInfoForTrip(trip) {
	    const page = document.getElementById('page-info');
	    if (!page || !trip) return;

	    if (isKyotoTrip(trip)) {
	      if (page.dataset.genericTripInfo === '1') {
	        page.innerHTML = ORIGINAL_INFO_HTML;
	        page.dataset.genericTripInfo = '0';
	      }
	      return;
	    }

	    const dateRange = `${formatTripDate(trip.start)} — ${formatTripDate(trip.end)}`;
	    page.dataset.genericTripInfo = '1';
	    page.innerHTML = `
	      <div class="page-header">
	        <div class="overline"><span class="gold-line"></span>ℹ️ Info</div>
	        <h2>📋 旅遊<em>資訊</em></h2>
	      </div>
	      <div class="info-banner"><strong>${escapeHtml(trip.city)}</strong> — ${escapeHtml(dateRange)}</div>

	      <div class="info-sec-title">🧭 Trip Summary</div>
	      <div class="hotel-card">
	        <div class="hotel-name">${escapeHtml(trip.flag || '🗺')} ${escapeHtml(trip.city || '未命名旅程')}</div>
	        <div class="hotel-sub">${escapeHtml(trip.country || '國家未設定')}</div>
	        <div class="info-row"><span class="info-row-label">日期</span><span class="info-row-value">${escapeHtml(dateRange)}</span></div>
	        <div class="info-row"><span class="info-row-label">狀態</span><span class="info-row-value gold">${escapeHtml(statusLabel(safeStatus(trip.status)))}</span></div>
	        <div class="info-row"><span class="info-row-label">天數</span><span class="info-row-value">${getTripDayDates(trip).length || 1} 天</span></div>
	      </div>

	      <div class="info-sec-title">📝 Notes</div>
	      <div class="tip-row"><div class="tip-icon-col">✈</div><div class="tip-body"><strong>航班/交通</strong>：尚未設定，可先在每日行程加入交通段。</div></div>
	      <div class="tip-row"><div class="tip-icon-col">🏨</div><div class="tip-body"><strong>住宿</strong>：尚未設定，第三階段後可再搬成遠端資料。</div></div>
	      <div class="tip-row"><div class="tip-icon-col">💡</div><div class="tip-body"><strong>提醒</strong>：花費與行程已依目前旅程分開儲存在本機。</div></div>

	      ${getChecklistHtml()}
	      ${getExpenseFormHtml()}
	    `;
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
      setActiveTripFromTrip(null);
      return;
    }
    empty.style.display = 'none';
    ensureActiveTrip(trips);

    // Stats
    const countries = new Set(trips.map(t => t.country)).size;
    const totalDays = trips.filter(t => t.status === 'completed')
                           .reduce((sum, t) => sum + calcDays(t.start, t.end), 0);
    document.getElementById('stat-trips').textContent = trips.length;
    document.getElementById('stat-countries').textContent = countries;
    document.getElementById('stat-days').textContent = totalDays || calcDays(trips[0].start, trips[0].end);

	    list.innerHTML = sortTripsForDisplay(trips)
	    .map(trip => {
	      const days = calcDays(trip.start, trip.end);
	      const status = safeStatus(trip.status);
	      const country = trip.country ? `，${escapeHtml(trip.country)}` : '';
	      const year = new Date(trip.start + 'T00:00:00').getFullYear();
	      const isActive = trip.id === activeTripId;
	      const tagsHtml = (trip.tags || []).map(t =>
	        `<span class="trip-highlight-tag">${escapeHtml(t)}</span>`).join('');
	      return `
	        <div class="trip-card ${isActive ? 'active' : ''}" data-trip-id="${escapeHtml(trip.id)}" onclick="setActiveTrip('${escapeJsArg(trip.id)}')">
	          <div class="trip-card-header">
	            <div class="trip-flag">${escapeHtml(trip.flag || '🗺')}</div>
	            <div class="trip-meta">
	              <div class="trip-name">${escapeHtml(trip.city)}${country}</div>
	              <div class="trip-dates">${formatDate(trip.start)} — ${formatDate(trip.end)}</div>
	              <span class="trip-status ${status}">${statusLabel(status)}</span>
	              ${isActive ? '<span class="trip-status active">目前旅程</span>' : ''}
	            </div>
	          </div>
	          ${tagsHtml ? `<div class="trip-highlights">${tagsHtml}</div>` : ''}
	          <div class="trip-card-footer">
	            <div class="trip-stat"><div class="trip-stat-num">${days}</div><div class="trip-stat-label">天</div></div>
	            <div class="trip-stat"><div class="trip-stat-num">${escapeHtml(trip.flag || '🌍')}</div><div class="trip-stat-label">${escapeHtml(trip.country || '—')}</div></div>
	            <div class="trip-stat"><div class="trip-stat-num">${Number.isFinite(year) ? year : '—'}</div><div class="trip-stat-label">年份</div></div>
	            <button class="trip-delete-btn" onclick="event.stopPropagation();deleteTrip('${escapeJsArg(trip.id)}')" title="刪除">✕</button>
	          </div>
	        </div>`;
	    }).join('');
	    renderActiveTripUI(trips);
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
	    delete expensesCacheByTrip[id];
	    delete itineraryCacheByTrip[id];
	    delete itineraryLoadPromisesByTrip[id];
	    delete checklistCacheByTrip[id];
	    delete checklistLoadPromisesByTrip[id];
	    if (id === activeTripId) setActiveTripFromTrip(null);
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
	      const hint = error.code === '42501'
	        ? '\n\n可能原因：此帳號沒有這個 travel group 的寫入權限，請確認 public.group_members / trips RLS policy。'
	        : '';
	      const message = error.message || error.details || '未知 Supabase 錯誤';
	      alert(`儲存失敗：${message}${hint}`);
	      console.warn('Supabase trip insert failed:', {
	        error,
	        groupId: TRAVEL_GROUP_ID,
	        userId: currentUser && currentUser.id,
	        payload: { city, country, flag, start_date: start, end_date: end, status, tags }
	      });
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
	    setPasswordRecoveryMode(!!currentUser && hasPendingPasswordRecovery());
	    tripsCache = null;
	    expensesCacheByTrip = {};
	    itineraryCacheByTrip = {};
	    itineraryLoadPromisesByTrip = {};
	    checklistCacheByTrip = {};
	    checklistLoadPromisesByTrip = {};
	    shoppingCacheByTrip = {};
	    shoppingLoadPromisesByTrip = {};
	    itineraryRenderSeq += 1;
	    checklistRenderSeq += 1;
	    shoppingRenderSeq += 1;
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
	    setPasswordRecoveryMode(false);
	    clearPasswordRecoveryUrl();
	    tripsCache = null;
	    expensesCacheByTrip = {};
	    itineraryCacheByTrip = {};
	    itineraryLoadPromisesByTrip = {};
	    checklistCacheByTrip = {};
	    checklistLoadPromisesByTrip = {};
	    shoppingCacheByTrip = {};
	    shoppingLoadPromisesByTrip = {};
	    itineraryRenderSeq += 1;
	    checklistRenderSeq += 1;
	    shoppingRenderSeq += 1;
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
	      const message = error.message ? `\n\n${error.message}` : '';
	      alert(`重設密碼信寄送失敗，請稍後再試${message}`);
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
	    setPasswordRecoveryMode(false);
	    clearPasswordRecoveryUrl();
	    updateAuthUI('密碼已更新');
	    alert('密碼已更新，之後請用新密碼登入。');
	  }

	  async function cancelPasswordRecovery() {
	    setPasswordRecoveryMode(false);
	    clearPasswordRecoveryUrl();
	    const client = getSupabaseClient();
	    if (client) await client.auth.signOut();
	    currentUser = null;
	    tripsCache = null;
	    expensesCacheByTrip = {};
	    itineraryCacheByTrip = {};
	    itineraryLoadPromisesByTrip = {};
	    checklistCacheByTrip = {};
	    checklistLoadPromisesByTrip = {};
	    shoppingCacheByTrip = {};
	    shoppingLoadPromisesByTrip = {};
	    itineraryRenderSeq += 1;
	    checklistRenderSeq += 1;
	    shoppingRenderSeq += 1;
	    updateAuthUI();
	    await renderTrips();
	  }

	  async function logoutSupabase() {
	    const client = getSupabaseClient();
	    if (client) await client.auth.signOut();
	    currentUser = null;
	    setPasswordRecoveryMode(false);
	    clearPasswordRecoveryUrl();
	    tripsCache = null;
	    expensesCacheByTrip = {};
	    itineraryCacheByTrip = {};
	    itineraryLoadPromisesByTrip = {};
	    checklistCacheByTrip = {};
	    checklistLoadPromisesByTrip = {};
	    shoppingCacheByTrip = {};
	    shoppingLoadPromisesByTrip = {};
	    itineraryRenderSeq += 1;
	    checklistRenderSeq += 1;
	    shoppingRenderSeq += 1;
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
	        setPasswordRecoveryMode(event === 'PASSWORD_RECOVERY' || (!!session && hasPendingPasswordRecovery()));
		tripsCache = null;
		expensesCacheByTrip = {};
		itineraryCacheByTrip = {};
			itineraryLoadPromisesByTrip = {};
			checklistCacheByTrip = {};
			checklistLoadPromisesByTrip = {};
			shoppingCacheByTrip = {};
			shoppingLoadPromisesByTrip = {};
			itineraryRenderSeq += 1;
			checklistRenderSeq += 1;
			shoppingRenderSeq += 1;
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

	  const KYOTO_DAY_META = {
	    day1: {
	      overline: '✈️ Day One · Thursday',
	      title: '🛬 抵達日 — <em>Arrival</em>',
	      desc: '飛往大阪，JR Haruka 前往京都，入住溫泉旅館，品嚐第一碗京都拉麵',
	      mapHeader: '📍 今日路線 — KIX → 京都'
	    },
	    day2: {
	      overline: '🎢 Day Two · Friday',
	      title: '🌟 大阪環球影城 — <em>USJ</em>',
	      desc: '早起出發！任天堂世界 + 哈利波特魔法世界，傍晚泡溫泉回來',
	      mapHeader: '📍 今日路線 — 京都 → USJ'
	    },
	    day3: {
	      overline: '⛩ Day Three · Saturday',
	      title: '🏯 東山文化路線 — <em>Higashiyama</em>',
	      desc: '清水寺、石板坡道小店、抹茶甜點，京都最精華的傳統氛圍',
	      mapHeader: '📍 今日路線 — 清水寺 → 二三年坂 → 高台寺 → 寺町'
	    },
	    day4: {
	      overline: '🛍 Day Four · Sunday',
	      title: '🎌 文化 × 購物 — <em>Shop &amp; Explore</em>',
	      desc: '高島屋銀座白石・下午茶・Kyoto Loft・% Arabica・大丸京都 agete 輕奢珠寶',
	      mapHeader: '📍 今日路線 — 高島屋 → mina京都 → 大丸京都'
	    },
	    day5: {
	      overline: '🏠 Day Five · Monday',
	      title: '✈️ 返台日 — <em>Departure</em>',
	      desc: '退房後仍有充裕時間，大阪道頓堀午餐，再悠閒前往機場',
	      mapHeader: '📍 今日路線 — 京都 → 大阪 → KIX'
	    }
	  };

	  const LMAPS = {}; // dayId → Leaflet map instance

  // 強制清除 day3/day4 舊快取（行程對調後 bust cache）
  if (!localStorage.getItem('kyoto_reset_swap_v4')) {
    localStorage.removeItem('kyoto_sched_day3');
    localStorage.removeItem('kyoto_sched_day4');
    localStorage.setItem('kyoto_reset_swap_v4', '1');
  }

	  function dateToYmd(dt) {
	    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
	  }

	  function getDayNumber(dayId) {
	    const num = Number(String(dayId || '').replace('day', ''));
	    return Number.isFinite(num) && num > 0 ? num : 1;
	  }

	  function cloneScheduleItems(items) {
	    return JSON.parse(JSON.stringify(items || []));
	  }

	  function normalizeScheduleTime(value) {
	    const text = String(value || '');
	    return /^\d{2}:\d{2}/.test(text) ? text.slice(0, 5) : text;
	  }

	  function normalizeTimeField(input) {
	    if (!input) return '';
	    const text = String(input.value || '').trim();
	    if (!text) return '';

	    const compact = text.replace(/\D/g, '');
	    let hour = '';
	    let minute = '';
	    if (/^\d{1,2}:\d{1,2}$/.test(text)) {
	      const parts = text.split(':');
	      hour = parts[0];
	      minute = parts[1];
	    } else if (compact.length <= 2) {
	      hour = compact;
	      minute = '00';
	    } else {
	      hour = compact.slice(0, -2);
	      minute = compact.slice(-2);
	    }

	    const hh = Math.min(23, Math.max(0, Number(hour) || 0));
	    const mm = Math.min(59, Math.max(0, Number(minute) || 0));
	    const normalized = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
	    input.value = normalized;
	    return normalized;
	  }

	  function sortScheduleItems(items) {
	    return [...(items || [])].sort((a, b) =>
	      (a.time || '99:99').localeCompare(b.time || '99:99') ||
	      String(a.title || '').localeCompare(String(b.title || ''), 'zh-Hant')
	    );
	  }

	  function getLocalSchedule(dayId) {
	    try {
	      const raw = localStorage.getItem(getTripStorageKey('sched_' + dayId));
	      if (raw) {
	        const saved = JSON.parse(raw);
	        if (Array.isArray(saved)) return saved;
	      }
	    } catch(e) {}
	    if (!isKyotoTrip()) return [];
	    return cloneScheduleItems(DAY_DEFAULTS[dayId] || []);
	  }

	  function saveLocalSchedule(dayId, items) {
	    try { localStorage.setItem(getTripStorageKey('sched_' + dayId), JSON.stringify(items)); } catch(e) {}
	  }

	  function canUseRemoteItinerary() {
	    return !!(getSupabaseClient() && currentUser && activeTripId);
	  }

	  function getItineraryStorageModeLabel() {
	    return canUseRemoteItinerary() ? '儲存到 Supabase' : '本機暫存';
	  }

	  function getItineraryStorageModeClass() {
	    return canUseRemoteItinerary() ? 'remote' : 'local';
	  }

	  function emptyItineraryCache() {
	    return { daysByKey: {}, dayKeyById: {}, itemsByDayKey: {} };
	  }

	  function itineraryDayFromRow(row) {
	    const dayNumber = Number(row.day_number) || 1;
	    return {
	      id: row.id,
	      key: `day${dayNumber}`,
	      dayNumber,
	      date: row.date || '',
	      title: row.title || ''
	    };
	  }

	  function itineraryItemFromRow(row) {
	    const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
	    return {
	      id: row.id,
	      sourceId: metadata.sourceId || '',
	      isKyotoDefault: metadata.isKyotoDefault === true,
	      time: normalizeScheduleTime(row.time),
	      title: row.title || '',
	      desc: row.description || '',
	      tags: Array.isArray(row.tags) ? row.tags : [],
	      mapQ: row.map_query || '',
	      lat: row.lat === null || row.lat === undefined ? null : Number(row.lat),
	      lng: row.lng === null || row.lng === undefined ? null : Number(row.lng),
	      extra: metadata.extra || ''
	    };
	  }

	  function getTripDateForDay(dayId) {
	    const dates = getTripDayDates();
	    const date = dates[getDayNumber(dayId) - 1];
	    return date ? dateToYmd(date) : null;
	  }

	  async function loadRemoteItinerary() {
	    const client = getSupabaseClient();
	    const tripId = activeTripId;
	    if (!client || !currentUser || !tripId) return null;
	    if (itineraryCacheByTrip[tripId]) return itineraryCacheByTrip[tripId];
	    if (itineraryLoadPromisesByTrip[tripId]) return itineraryLoadPromisesByTrip[tripId];

	    itineraryLoadPromisesByTrip[tripId] = (async () => {
	      const cache = emptyItineraryCache();
	      const daySelect = 'id, group_id, trip_id, day_number, date, title, created_at, updated_at';
	      const itemSelect = 'id, group_id, trip_id, day_id, day_key, time, title, description, tags, map_query, lat, lng, metadata, sort_order, created_at, updated_at';

	      const { data: days, error: daysError } = await client
	        .from('itinerary_days')
	        .select(daySelect)
	        .eq('group_id', TRAVEL_GROUP_ID)
	        .eq('trip_id', tripId)
	        .order('day_number', { ascending: true });

	      if (daysError) {
	        console.warn('Supabase itinerary days load failed:', daysError);
	        return null;
	      }

	      (days || []).forEach(row => {
	        const day = itineraryDayFromRow(row);
	        cache.daysByKey[day.key] = day;
	        cache.dayKeyById[day.id] = day.key;
	        cache.itemsByDayKey[day.key] = [];
	      });

	      const dayIds = Object.values(cache.daysByKey).map(day => day.id).filter(Boolean);
	      if (dayIds.length) {
	        const { data: items, error: itemsError } = await client
	          .from('itinerary_items')
	          .select(itemSelect)
	          .eq('group_id', TRAVEL_GROUP_ID)
	          .eq('trip_id', tripId)
	          .in('day_id', dayIds)
	          .order('sort_order', { ascending: true })
	          .order('time', { ascending: true });

	        if (itemsError) {
	          console.warn('Supabase itinerary items load failed:', itemsError);
	          return null;
	        }

	        (items || []).forEach(row => {
	          const dayKey = row.day_key || cache.dayKeyById[row.day_id];
	          if (!dayKey) return;
	          if (!cache.itemsByDayKey[dayKey]) cache.itemsByDayKey[dayKey] = [];
	          cache.itemsByDayKey[dayKey].push(itineraryItemFromRow(row));
	        });
	      }

	      Object.keys(cache.itemsByDayKey).forEach(dayKey => {
	        cache.itemsByDayKey[dayKey] = sortScheduleItems(cache.itemsByDayKey[dayKey]);
	      });

	      itineraryCacheByTrip[tripId] = cache;
	      return cache;
	    })().finally(() => {
	      delete itineraryLoadPromisesByTrip[tripId];
	    });

	    return itineraryLoadPromisesByTrip[tripId];
	  }

	  async function ensureRemoteDay(dayId, cache) {
	    const client = getSupabaseClient();
	    if (!client || !currentUser || !activeTripId || !cache) return null;
	    if (cache.daysByKey[dayId]) return cache.daysByKey[dayId];

	    const dayNumber = getDayNumber(dayId);
	    const daySelect = 'id, group_id, trip_id, day_number, date, title, created_at, updated_at';
	    const { data: existingRows, error: findError } = await client
	      .from('itinerary_days')
	      .select(daySelect)
	      .eq('group_id', TRAVEL_GROUP_ID)
	      .eq('trip_id', activeTripId)
	      .eq('day_number', dayNumber)
	      .limit(1);

	    if (findError) {
	      console.warn('Supabase itinerary day lookup failed:', findError);
	      return null;
	    }

	    let row = (existingRows || [])[0];
	    if (!row) {
	      const { data, error } = await client
	        .from('itinerary_days')
	        .insert({
	          group_id: TRAVEL_GROUP_ID,
	          trip_id: activeTripId,
	          day_number: dayNumber,
	          date: getTripDateForDay(dayId),
	          title: `第 ${dayNumber} 天`
	        })
	        .select(daySelect)
	        .single();

	      if (error) {
	        console.warn('Supabase itinerary day insert failed:', error);
	        return null;
	      }
	      row = data;
	    }

	    const day = itineraryDayFromRow(row);
	    cache.daysByKey[day.key] = day;
	    cache.dayKeyById[day.id] = day.key;
	    if (!Object.prototype.hasOwnProperty.call(cache.itemsByDayKey, day.key)) {
	      cache.itemsByDayKey[day.key] = [];
	    }
	    return day;
	  }

	  function itemToItineraryRow(item, day, index) {
	    const metadata = {};
	    const sourceId = item.sourceId || (String(item.id || '').startsWith('d') ? String(item.id) : '');
	    if (sourceId) metadata.sourceId = sourceId;
	    if (item.isKyotoDefault || (isKyotoTrip() && sourceId.startsWith('d'))) metadata.isKyotoDefault = true;
	    if (item.extra) metadata.extra = item.extra;
	    if (item.isCustom) metadata.isCustom = true;

	    return {
	      group_id: TRAVEL_GROUP_ID,
	      trip_id: activeTripId,
	      day_id: day.id,
	      day_key: day.key,
	      time: item.time || null,
	      title: item.title || '',
	      description: item.desc || '',
	      tags: Array.isArray(item.tags) ? item.tags : [],
	      map_query: item.mapQ || null,
	      lat: Number.isFinite(Number(item.lat)) ? Number(item.lat) : null,
	      lng: Number.isFinite(Number(item.lng)) ? Number(item.lng) : null,
	      metadata,
	      sort_order: index + 1
	    };
	  }

	  async function saveRemoteSchedule(dayId, items) {
	    const client = getSupabaseClient();
	    const tripId = activeTripId;
	    if (!client || !currentUser || !tripId) return false;

	    const cache = await loadRemoteItinerary();
	    if (!cache) return false;
	    const day = await ensureRemoteDay(dayId, cache);
	    if (!day) return false;

	    const previousIds = (cache.itemsByDayKey[dayId] || []).map(item => item.id).filter(Boolean);
	    const rows = sortScheduleItems(items).map((item, index) => itemToItineraryRow(item, day, index));
	    const itemSelect = 'id, group_id, trip_id, day_id, day_key, time, title, description, tags, map_query, lat, lng, metadata, sort_order, created_at, updated_at';
	    let savedItems = [];

	    if (rows.length) {
	      const { data, error } = await client
	        .from('itinerary_items')
	        .insert(rows)
	        .select(itemSelect);

	      if (error) {
	        console.warn('Supabase itinerary items insert failed:', error);
	        return false;
	      }
	      savedItems = sortScheduleItems((data || []).map(itineraryItemFromRow));
	    }

	    if (previousIds.length) {
	      const { error } = await client
	        .from('itinerary_items')
	        .delete()
	        .eq('group_id', TRAVEL_GROUP_ID)
	        .eq('trip_id', tripId)
	        .in('id', previousIds);

	      if (error) {
	        console.warn('Supabase itinerary items cleanup failed:', error);
	        return false;
	      }
	    }

	    cache.itemsByDayKey[dayId] = savedItems;
	    return true;
	  }

	  async function getSchedule(dayId) {
	    if (canUseRemoteItinerary()) {
	      const cache = await loadRemoteItinerary();
	      if (cache && Object.prototype.hasOwnProperty.call(cache.itemsByDayKey, dayId)) {
	        return cloneScheduleItems(cache.itemsByDayKey[dayId]);
	      }
	    }
	    return getLocalSchedule(dayId);
	  }

	  async function saveSchedule(dayId, items) {
	    if (canUseRemoteItinerary()) {
	      const saved = await saveRemoteSchedule(dayId, items);
	      if (saved) return true;
	      alert('行程儲存失敗，已保留目前畫面，請稍後再試');
	      return false;
	    }
	    saveLocalSchedule(dayId, items);
	    return true;
	  }

	  function clearLeafletMaps() {
	    Object.keys(LMAPS).forEach(dayId => {
	      try { LMAPS[dayId].remove(); } catch(e) {}
	      delete LMAPS[dayId];
	    });
	  }

	  function getDayMeta(dayId, index, date, trip) {
	    if (isKyotoTrip(trip) && KYOTO_DAY_META[dayId]) return KYOTO_DAY_META[dayId];
	    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
	    return {
	      overline: `🗓 Day ${index + 1} · ${weekday}`,
	      title: `${escapeHtml(trip.flag || '🗺')} 第 ${index + 1} 天 — <em>${escapeHtml(trip.city || '旅程')}</em>`,
	      desc: '尚未新增行程，可從下方加入時間與行程名稱。',
	      mapHeader: '📍 今日路線 — 尚未新增地點'
	    };
	  }

	  function renderItinerary() {
	    const page = document.getElementById('page-itinerary');
	    const tabs = page ? page.querySelector('.day-tabs') : null;
	    const trip = getActiveTrip();
	    if (!page || !tabs || !trip) return;
	    const seq = ++itineraryRenderSeq;

	    clearLeafletMaps();
	    page.querySelectorAll('.day-content').forEach(el => el.remove());

	    const dates = getTripDayDates(trip);
	    if (!dates.length) {
	      tabs.innerHTML = '';
	      tabs.insertAdjacentHTML('afterend', '<div class="trip-loading">這趟旅程還沒有有效日期。</div>');
	      return;
	    }

	    tabs.innerHTML = dates.map((dt, i) => {
	      const dayId = `day${i + 1}`;
	      return `<button class="day-tab ${i === 0 ? 'active' : ''}" onclick="switchDay('${dayId}',this)">${formatTripDateShort(dateToYmd(dt))}<span class="tab-dow">${dt.toLocaleDateString('en-US', { weekday: 'short' })}</span></button>`;
	    }).join('');

	    const contents = dates.map((dt, i) => {
	      const dayId = `day${i + 1}`;
	      const meta = getDayMeta(dayId, i, dt, trip);
	      return `
	        <div class="day-content ${i === 0 ? 'active' : ''}" id="${dayId}">
	          <div class="day-header">
	            <div class="overline"><span class="gold-line"></span>${meta.overline}</div>
	            <div class="day-title">${meta.title}</div>
	            <div class="day-desc">${escapeHtml(meta.desc)}</div>
	          </div>
	          <div class="day-map-section">
	            <div class="day-map-header">${escapeHtml(meta.mapHeader)}</div>
	            <div id="map-${dayId}" class="day-map-container"></div>
	            <a id="gmaps-${dayId}" href="#" target="_blank" class="day-map-route-btn">🗺 在 Google Maps 查看完整路線</a>
	          </div>
	          <div class="timeline" id="timeline-${dayId}"></div>
	          <div class="tl-add-wrap">
	            <button class="tl-add-btn" onclick="toggleAddForm('${dayId}')">＋ 新增行程</button>
	            <div class="tl-add-form" id="add-form-${dayId}" style="display:none">
	              <div class="tl-storage-mode ${getItineraryStorageModeClass()}">${getItineraryStorageModeLabel()}</div>
	              <div class="tl-add-form-row">
	                <input class="tl-add-time" type="time" id="add-time-${dayId}" placeholder="時間" onblur="normalizeTimeField(this)">
	                <input class="tl-add-name" type="text" id="add-name-${dayId}" placeholder="行程名稱...">
	              </div>
	              <div style="display:flex;gap:8px;">
	                <button class="tl-add-confirm" onclick="confirmAddItem('${dayId}')">確認新增</button>
	                <button class="tl-add-cancel" onclick="toggleAddForm('${dayId}')">取消</button>
	              </div>
	            </div>
	          </div>
	        </div>`;
	    }).join('');

	    tabs.insertAdjacentHTML('afterend', contents);
	    dates.forEach((_, i) => renderTimeline(`day${i + 1}`, seq));
	  }

	  function tagHtml(tags) {
	    return (tags||[]).map(t => {
	      const cls = t.c ? ' ' + String(t.c).replace(/[^a-zA-Z0-9_-]/g, '') : '';
	      return `<span class="tl-tag${cls}">${escapeHtml(t.l)}</span>`;
	    }).join('');
	  }

	  async function renderTimeline(dayId, seq = itineraryRenderSeq) {
	    const tl = document.getElementById('timeline-' + dayId);
	    if (!tl) return;
	    const renderTripId = activeTripId;
	    if (canUseRemoteItinerary() && !itineraryCacheByTrip[activeTripId]) {
	      tl.innerHTML = '<div class="trip-loading">載入行程中...</div>';
	    }
	    const items = sortScheduleItems(await getSchedule(dayId));
	    if (seq !== itineraryRenderSeq || renderTripId !== activeTripId || document.getElementById('timeline-' + dayId) !== tl) return;
	    tl.innerHTML = '';
	    if (items.length === 0) {
	      tl.innerHTML = '<div class="trip-loading">尚未新增行程，從下方開始安排這一天。</div>';
	      renderMap(dayId, items);
	      return;
	    }
	    items.forEach((item, idx) => {
	      const itemId = String(item.id || '');
	      const sourceId = String(item.sourceId || item.id || '');
	      const isKyotoDefault = isKyotoTrip() && (item.isKyotoDefault || sourceId.startsWith('d'));
	      const isCustom = !isKyotoDefault;
	      const div = document.createElement('div');
	      div.className = 'tl-item' + (isCustom ? ' custom-item' : '');
	      div.dataset.id = item.id;
	      const mapLink = (item.lat && item.lng)
	        ? `<a class="tl-map-link" href="https://maps.google.com/?q=${item.lat},${item.lng}" target="_blank">📍 查看地圖</a>`
	        : item.mapQ
	          ? `<a class="tl-map-link" href="https://maps.google.com/?q=${encodeURIComponent(item.mapQ)}" target="_blank">📍 查看地圖</a>`
	          : '';
	      const extra = isKyotoDefault && item.extra ? item.extra : '';
	      const ticketBtn = isKyotoDefault && sourceId === 'd2_3'
	        ? `<button class="tl-ticket-btn" onclick="openTicket()">🎫 查看快速通關券</button>`
	        : '';
	      const title = isKyotoDefault ? item.title : escapeHtml(item.title || '');
	      const desc = isKyotoDefault ? (item.desc || '') : escapeHtml(item.desc || '');
	      div.innerHTML = `
	        <div class="tl-time-col">${escapeHtml(item.time || '—')}</div>
	        <div class="tl-body">
	          <div class="tl-title">${title}</div>
	          <div class="tl-desc">${desc}</div>
	          ${item.tags&&item.tags.length ? `<div class="tl-tags">${tagHtml(item.tags)}</div>` : ''}
	          ${extra}
	          ${ticketBtn}
	          ${mapLink}
	          <button class="tl-del-btn" onclick="deleteItem('${dayId}','${escapeJsArg(itemId)}')">✕ 刪除</button>
	        </div>`;
	      tl.appendChild(div);
	    });
    renderMap(dayId, items);
  }

	  function renderMap(dayId, items) {
	    const stops = (items || []).filter(it => it.lat && it.lng);
	    const container = document.getElementById('map-' + dayId);
	    if (!container) return;
	    const gmLink = document.getElementById('gmaps-' + dayId);

	    if (!stops.length) {
	      if (LMAPS[dayId]) {
	        try { LMAPS[dayId].remove(); } catch(e) {}
	        delete LMAPS[dayId];
	      }
	      container.innerHTML = '<div class="day-map-empty">尚未有地點座標</div>';
	      if (gmLink) gmLink.style.display = 'none';
	      return;
	    }
	    if (gmLink) gmLink.style.display = '';

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
	    if (gmLink && stops.length) {
	      const waypoints = stops.map(s => `${s.lat},${s.lng}`).join('/');
	      gmLink.href = `https://www.google.com/maps/dir/${waypoints}`;
	    }
	  }

	  function refreshDayMap(dayId) {
	    if (LMAPS[dayId]) LMAPS[dayId].invalidateSize();
	    else renderTimeline(dayId);
	  }

  function toggleAddForm(dayId) {
    const form = document.getElementById('add-form-' + dayId);
    if (!form) return;
    const showing = form.style.display !== 'none';
    form.style.display = showing ? 'none' : 'block';
    if (!showing) document.getElementById('add-name-' + dayId).focus();
  }

  async function confirmAddItem(dayId) {
    const timeInput = document.getElementById('add-time-' + dayId);
    const nameInput = document.getElementById('add-name-' + dayId);
    const time = normalizeTimeField(timeInput);
    const name = (nameInput.value || '').trim();
    if (!name) { nameInput.focus(); return; }
    if (!canUseRemoteItinerary()) {
      alert('目前未登入 Supabase，這筆行程只會存在本機暫存，不會寫入 itinerary_days / itinerary_items。請先到「旅程」登入後再新增共享行程。');
    }
    const items = await getSchedule(dayId);
    items.push({ id: 'c_' + Date.now(), time, title: name, desc: '', tags: [{l:'自訂'}], isCustom: true });
    const saved = await saveSchedule(dayId, items);
    if (!saved) return;
    timeInput.value = '';
    nameInput.value = '';
    toggleAddForm(dayId);
    renderTimeline(dayId);
  }

  async function deleteItem(dayId, id) {
    const items = (await getSchedule(dayId)).filter(i => String(i.id) !== String(id));
    const saved = await saveSchedule(dayId, items);
    if (!saved) return;
    renderTimeline(dayId);
  }

	  // Re-invalidate map size when switching days
	  const _origSwitchDay = window.switchDay;
	  window.switchDay = function(dayId, btn) {
	    if (_origSwitchDay) _origSwitchDay(dayId, btn);
	    setTimeout(() => refreshDayMap(dayId), 50);
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

  function resetPayerSelection() {
    selectedPayer = 'Vik';
    document.querySelectorAll('.exp-payer-btn').forEach(btn => {
      btn.classList.remove('sel-vik', 'sel-mike');
      if (btn.textContent.includes('Vik')) btn.classList.add('sel-vik');
    });
  }

	  function canUseRemoteChecklist() {
	    return !!(getSupabaseClient() && currentUser && activeTripId);
	  }

	  function checklistFromRow(row, index = 0) {
	    return {
	      id: row.id,
	      label: row.label || `項目 ${index + 1}`,
	      checked: row.checked === true,
	      sortOrder: Number(row.sort_order) || index + 1
	    };
	  }

	  function getLocalChecklistItems(blueprint = null) {
	    const saved = getLocalChecklistState();
	    return (blueprint || getChecklistBlueprintFromDom()).map((item, index) => ({
	      ...item,
	      checked: !!saved[index],
	      sortOrder: index + 1
	    }));
	  }

	  async function createRemoteChecklistItems(blueprint, state, tripId) {
	    const client = getSupabaseClient();
	    if (!client || !currentUser || !tripId || !blueprint.length) return [];

	    const rows = blueprint.map((item, index) => ({
	      group_id: TRAVEL_GROUP_ID,
	      trip_id: tripId,
	      label: item.label || `項目 ${index + 1}`,
	      checked: !!state[index],
	      sort_order: index + 1
	    }));

	    const { data, error } = await client
	      .from('checklist_items')
	      .insert(rows)
	      .select('id, group_id, trip_id, label, checked, sort_order, created_at, updated_at');

	    if (error) throw error;
	    return (data || []).map(checklistFromRow);
	  }

	  async function getChecklistItems(seedBlueprint = null) {
	    const client = getSupabaseClient();
	    const tripId = activeTripId;
	    const blueprint = seedBlueprint || getChecklistBlueprintFromDom();

	    if (!client || !currentUser || !tripId) return getLocalChecklistItems(blueprint);
	    if (Array.isArray(checklistCacheByTrip[tripId])) return checklistCacheByTrip[tripId];
	    if (checklistLoadPromisesByTrip[tripId]) return checklistLoadPromisesByTrip[tripId];

	    checklistLoadPromisesByTrip[tripId] = (async () => {
	      const { data, error } = await client
	        .from('checklist_items')
	        .select('id, group_id, trip_id, label, checked, sort_order, created_at, updated_at')
	        .eq('group_id', TRAVEL_GROUP_ID)
	        .eq('trip_id', tripId)
	        .order('sort_order', { ascending: true });

	      if (error) {
	        console.warn('Supabase checklist load failed:', error);
	        return getLocalChecklistItems(blueprint);
	      }

	      let items = (data || []).map(checklistFromRow);
	      if (items.length === 0 && blueprint.length > 0) {
	        try {
	          items = await createRemoteChecklistItems(blueprint, getLocalChecklistState(), tripId);
	        } catch (insertError) {
	          console.warn('Supabase checklist seed failed:', insertError);
	          return getLocalChecklistItems(blueprint);
	        }
	      }

	      checklistCacheByTrip[tripId] = items;
	      return items;
	    })();

	    try {
	      return await checklistLoadPromisesByTrip[tripId];
	    } finally {
	      delete checklistLoadPromisesByTrip[tripId];
	    }
	  }

	  function updateChecklistStorageMode() {
	    const mode = document.getElementById('check-storage-mode');
	    if (!mode) return;
	    mode.textContent = getChecklistModeLabel();
	    mode.classList.toggle('remote', canUseRemoteChecklist());
	    mode.classList.toggle('local', !canUseRemoteChecklist());
	  }

	  async function renderChecklist() {
	    const list = document.getElementById('checklist-list');
	    updateChecklistStorageMode();
	    if (!list) return;

	    const seedBlueprint = getChecklistBlueprintFromDom();
	    const seq = ++checklistRenderSeq;
	    const renderTripId = activeTripId;
	    const shouldShowLoading = canUseRemoteChecklist() && !checklistCacheByTrip[activeTripId];
	    if (shouldShowLoading) list.innerHTML = '<div class="trip-loading">載入清單中...</div>';

	    const items = await getChecklistItems(seedBlueprint);
	    if (seq !== checklistRenderSeq || renderTripId !== activeTripId || document.getElementById('checklist-list') !== list) return;

	    updateChecklistStorageMode();
	    list.innerHTML = items.map((item, index) => checklistItemHtml(item, index)).join('');
	  }

	  function canUseRemoteExpenses() {
	    return !!(getSupabaseClient() && currentUser && activeTripId);
	  }

	  function getLocalExpenses() {
	    try { return JSON.parse(localStorage.getItem(getTripStorageKey('expenses')) || '[]'); } catch(e) { return []; }
	  }

	  function saveLocalExpenses(arr) {
	    try { localStorage.setItem(getTripStorageKey('expenses'), JSON.stringify(arr)); } catch(e) {}
	  }

	  async function getExpenses() {
	    const client = getSupabaseClient();
	    if (!client || !currentUser || !activeTripId) return getLocalExpenses();
	    if (expensesCacheByTrip[activeTripId]) return expensesCacheByTrip[activeTripId];

	    const { data, error } = await client
	      .from('expenses')
	      .select('id, title, currency, amount, paid_by_name, created_at')
	      .eq('group_id', TRAVEL_GROUP_ID)
	      .eq('trip_id', activeTripId)
	      .order('created_at', { ascending: true });

	    if (error) {
	      console.warn('Supabase expenses load failed:', error);
	      return getLocalExpenses();
	    }

	    const expenses = (data || []).map(expenseFromRow);
	    expensesCacheByTrip[activeTripId] = expenses;
	    return expenses;
	  }

  async function addExpense() {
    const purposeEl = document.getElementById('exp-purpose');
    const currencyEl = document.getElementById('exp-currency');
    const amountEl = document.getElementById('exp-amount');
    if (!purposeEl || !currencyEl || !amountEl) return;

    const purpose  = purposeEl.value.trim();
    const currency = currencyEl.value;
    const amount   = parseFloat(amountEl.value);
    if (!purpose) { purposeEl.focus(); return; }
    if (!amount || amount <= 0) { amountEl.focus(); return; }

    const client = getSupabaseClient();
    if (client && currentUser && activeTripId) {
      const { data, error } = await client
        .from('expenses')
        .insert({
          group_id: TRAVEL_GROUP_ID,
          trip_id: activeTripId,
          title: purpose,
          currency,
          amount,
          paid_by_name: selectedPayer
        })
        .select('id, title, currency, amount, paid_by_name, created_at')
        .single();

      if (error) {
        alert('花費儲存失敗，請稍後再試');
        console.warn('Supabase expense insert failed:', error);
        return;
      }

      if (expensesCacheByTrip[activeTripId]) {
        expensesCacheByTrip[activeTripId].push(expenseFromRow(data));
      }
    } else {
      const arr = getLocalExpenses();
      arr.push({ id: Date.now(), purpose, currency, amount, paidBy: selectedPayer });
      saveLocalExpenses(arr);
    }

    purposeEl.value = '';
    amountEl.value = '';
    renderExpenses();
  }

	  async function deleteExpense(id) {
	    const client = getSupabaseClient();
	    if (client && currentUser && activeTripId) {
	      const { error } = await client
	        .from('expenses')
	        .delete()
	        .eq('id', id)
	        .eq('group_id', TRAVEL_GROUP_ID)
	        .eq('trip_id', activeTripId);

	      if (error) {
	        alert('花費刪除失敗，請稍後再試');
	        console.warn('Supabase expense delete failed:', error);
	        return;
	      }

	      if (expensesCacheByTrip[activeTripId]) {
	        expensesCacheByTrip[activeTripId] = expensesCacheByTrip[activeTripId].filter(e => String(e.id) !== String(id));
	      }
	    } else {
	      saveLocalExpenses(getLocalExpenses().filter(e => String(e.id) !== String(id)));
	    }
	    renderExpenses();
	  }

	  async function renderExpenses() {
	    const list = document.getElementById('expense-list');
	    const sumEl = document.getElementById('expense-summary');
	    if (!list || !sumEl) return;
	    const seq = ++expenseRenderSeq;
	    const renderTripId = activeTripId;
	    const shouldShowLoading = canUseRemoteExpenses() && !expensesCacheByTrip[activeTripId];
	    if (shouldShowLoading) list.innerHTML = '<div class="trip-loading">載入花費中...</div>';
	    const arr = await getExpenses();
	    if (seq !== expenseRenderSeq || renderTripId !== activeTripId || document.getElementById('expense-list') !== list) return;
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
	          <span class="exp-purpose">${escapeHtml(e.purpose)}</span>
	          <span class="exp-amount-val" style="font-size:13px;">${sym}${fmt}</span>
	          <span class="exp-chevron">▾</span>
	        </div>
	        <div class="expense-item-detail">
	          <span style="font-size:11px;color:var(--muted-fg);">幣別：${escapeHtml(e.currency)}</span>
	          <span style="flex:1;"></span>
	          <button class="exp-del" onclick="event.stopPropagation();deleteExpense('${escapeJsArg(String(e.id))}')">✕ 刪除</button>
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

  /* ─── Shopping List ─── */
  function getShoppingCacheKey(user = shoppingUser, tripId = activeTripId) {
    return `${tripId || 'local'}:${user}`;
  }

  function canUseRemoteShopping() {
    return !!(getSupabaseClient() && currentUser && activeTripId);
  }

  function getShoppingModeLabel() {
    return canUseRemoteShopping() ? '儲存到 Supabase' : '本機暫存';
  }

  function updateShoppingStorageMode() {
    const mode = document.getElementById('shop-storage-mode');
    if (!mode) return;
    mode.textContent = getShoppingModeLabel();
    mode.classList.toggle('remote', canUseRemoteShopping());
    mode.classList.toggle('local', !canUseRemoteShopping());
  }

	  function getLocalShoppingItems(user = shoppingUser) {
	    try {
	      const raw = localStorage.getItem(`shopping_${user}`);
	      const merged = JSON.parse(raw || '[]');
	      if (raw !== null && Array.isArray(merged)) {
	        return merged.map(item => ({ itemType: item.itemType || (item.photo && !item.text ? 'photo' : 'text'), ...item }));
	      }
	      const texts = JSON.parse(localStorage.getItem(`shop_texts_${user}`) || '[]')
	        .map(item => ({ ...item, itemType: 'text' }));
	      const photos = JSON.parse(localStorage.getItem(`shop_photos_${user}`) || '[]')
	        .map(item => ({ id: item.id, text: '圖片', note: '', photo: item.src, checked: false, itemType: 'photo' }));
	      return texts.concat(photos);
	    } catch(e) { return []; }
	  }

  function saveLocalShoppingItems(items, user = shoppingUser) {
    try { localStorage.setItem(`shopping_${user}`, JSON.stringify(items)); } catch(e) {}
  }

  function shoppingItemFromRow(row) {
    return {
      id: row.id,
      text: row.title || '',
      note: row.note || '',
	      photo: row.photo_data || '',
	      checked: !!row.checked,
	      sortOrder: Number(row.sort_order) || 0,
	      ownerKey: row.owner_key || shoppingUser,
	      itemType: row.item_type || (row.photo_data && row.title === '圖片' ? 'photo' : 'text')
	    };
	  }

  async function getShoppingItems(user = shoppingUser) {
    const cacheKey = getShoppingCacheKey(user);
    const client = getSupabaseClient();
    if (!client || !currentUser || !activeTripId) return getLocalShoppingItems(user);
    if (Array.isArray(shoppingCacheByTrip[cacheKey])) return shoppingCacheByTrip[cacheKey];
    if (shoppingLoadPromisesByTrip[cacheKey]) return shoppingLoadPromisesByTrip[cacheKey];

    shoppingLoadPromisesByTrip[cacheKey] = (async () => {
	      const { data, error } = await client
	        .from('shopping_items')
	        .select('id, owner_key, item_type, title, note, photo_data, checked, sort_order, created_at')
        .eq('group_id', TRAVEL_GROUP_ID)
        .eq('trip_id', activeTripId)
        .eq('owner_key', user)
        .order('sort_order', { ascending: false });

      if (error) {
        console.warn('Supabase shopping items load failed:', error);
        return getLocalShoppingItems(user);
      }

      const items = (data || []).map(shoppingItemFromRow);
      shoppingCacheByTrip[cacheKey] = items;
      return items;
    })().finally(() => {
      delete shoppingLoadPromisesByTrip[cacheKey];
    });

    return shoppingLoadPromisesByTrip[cacheKey];
  }

	  function clearShopForm() {
	    const text = document.getElementById('shop-text');
	    const note = document.getElementById('shop-note');
	    const hint = document.getElementById('shop-photo-hint');
    const prev = document.getElementById('shop-photo-preview');
    const input = document.getElementById('shop-photo-input');
    if (text) text.value = '';
    if (note) note.value = '';
    if (hint) hint.textContent = '';
    if (prev) { prev.src = ''; prev.style.display = 'none'; }
    if (input) input.value = '';
	    shoppingPhoto = null;
	  }

  function compressShoppingImage(src, maxPx, q, cb) {
    const img = new Image();
    img.onload = function() {
      const scale = (img.width > maxPx || img.height > maxPx) ? maxPx / Math.max(img.width, img.height) : 1;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      cb(canvas.toDataURL('image/jpeg', q));
    };
    img.src = src;
  }

	  async function saveShoppingItem(item) {
	    const client = getSupabaseClient();
	    if (client && currentUser && activeTripId) {
	      const { data, error } = await client
	        .from('shopping_items')
	        .insert({
	          group_id: TRAVEL_GROUP_ID,
	          trip_id: activeTripId,
	          owner_key: shoppingUser,
	          item_type: item.itemType,
	          title: item.text,
	          note: item.note || '',
	          photo_data: item.photo || null,
	          checked: !!item.checked,
	          sort_order: item.sortOrder,
	          created_by: currentUser.id
	        })
	        .select('id, owner_key, item_type, title, note, photo_data, checked, sort_order, created_at')
	        .single();

	      if (error) {
	        alert(`購買清單儲存失敗：${error.message || error.details || '未知 Supabase 錯誤'}`);
	        console.warn('Supabase shopping item insert failed:', error);
	        return false;
	      }

	      const cacheKey = getShoppingCacheKey(shoppingUser);
	      if (shoppingCacheByTrip[cacheKey]) shoppingCacheByTrip[cacheKey].unshift(shoppingItemFromRow(data));
	      return true;
	    }

	    const arr = getLocalShoppingItems();
	    arr.unshift(item);
	    saveLocalShoppingItems(arr);
	    return true;
	  }

	  function handleShopPhoto(e) {
	    handleShopPhotos(e);
	  }

	  function handleShopPhotos(e) {
	    const files = Array.from(e.target.files || []);
	    if (!files.length) return;
	    let done = 0;
	    files.forEach(file => {
	      const reader = new FileReader();
	      reader.onload = function(ev) {
	        compressShoppingImage(ev.target.result, 800, 0.72, async function(data) {
	          await saveShoppingItem({
	            id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
	            text: '圖片',
	            note: '',
	            photo: data,
	            checked: false,
	            itemType: 'photo',
	            sortOrder: Date.now()
	          });
	          done += 1;
	          if (done === files.length) {
	            e.target.value = '';
	            await renderShopList();
	          }
	        });
	      };
	      reader.readAsDataURL(file);
	    });
	  }

	  function prepareShopPhotoPreview(e) {
	    const file = e.target.files && e.target.files[0];
	    if (!file) return;
	    const hint = document.getElementById('shop-photo-hint');
	    if (hint) hint.textContent = file.name;
	    const reader = new FileReader();
	    reader.onload = function(ev) {
	      compressShoppingImage(ev.target.result, 800, 0.72, function(data) {
        shoppingPhoto = data;
        const prev = document.getElementById('shop-photo-preview');
        if (prev) { prev.src = data; prev.style.display = 'block'; }
      });
	    };
	    reader.readAsDataURL(file);
	  }

  async function openShoppingModal() {
	    const overlay = document.getElementById('shop-overlay');
	    if (!overlay) return;
	    overlay.classList.add('open');
	    setupShopLightboxHandlers();
	    await renderShopList();
	  }

  function closeShoppingModal() {
    const overlay = document.getElementById('shop-overlay');
    if (overlay) overlay.classList.remove('open');
    clearShopForm();
  }

  async function switchShopUser(user, btn) {
    shoppingUser = user;
    document.querySelectorAll('.shop-user-tab').forEach(tab => tab.classList.remove('active'));
    if (btn) btn.classList.add('active');
	    await renderShopList();
	  }

	  async function addShopItem() {
	    await addShopText();
	  }

	  async function addShopText() {
	    const textEl = document.getElementById('shop-text');
	    const noteEl = document.getElementById('shop-note');
	    const text = (textEl?.value || '').trim();
    if (!text) { if (textEl) textEl.focus(); return; }
    const note = (noteEl?.value || '').trim();
    const item = {
      id: Date.now().toString(),
      text,
	      note,
	      photo: '',
	      checked: false,
	      sortOrder: Date.now(),
	      ownerKey: shoppingUser,
	      itemType: 'text'
	    };

	    const ok = await saveShoppingItem(item);
	    if (!ok) return;

	    clearShopForm();
	    await renderShopList();
	  }

	  async function toggleShopItem(id) {
	    await toggleShopText(id);
	  }

	  async function toggleShopText(id) {
	    const cacheKey = getShoppingCacheKey(shoppingUser);
	    const items = await getShoppingItems();
    const target = items.find(item => String(item.id) === String(id));
    if (!target) return;
    const nextChecked = !target.checked;

    const client = getSupabaseClient();
    if (client && currentUser && activeTripId) {
      const { error } = await client
        .from('shopping_items')
        .update({ checked: nextChecked })
        .eq('id', id)
        .eq('group_id', TRAVEL_GROUP_ID)
        .eq('trip_id', activeTripId)
        .eq('owner_key', shoppingUser);

      if (error) {
        alert(`購買清單更新失敗：${error.message || error.details || '未知 Supabase 錯誤'}`);
        console.warn('Supabase shopping item update failed:', error);
        return;
      }

      if (shoppingCacheByTrip[cacheKey]) {
        shoppingCacheByTrip[cacheKey] = shoppingCacheByTrip[cacheKey].map(item =>
          String(item.id) === String(id) ? { ...item, checked: nextChecked } : item
        );
      }
    } else {
      saveLocalShoppingItems(getLocalShoppingItems().map(item =>
        String(item.id) === String(id) ? { ...item, checked: nextChecked } : item
      ));
    }

	    await renderShopList();
	  }

	  async function deleteShopItem(id) {
    const client = getSupabaseClient();
    const cacheKey = getShoppingCacheKey(shoppingUser);
    if (client && currentUser && activeTripId) {
      const { error } = await client
        .from('shopping_items')
        .delete()
        .eq('id', id)
        .eq('group_id', TRAVEL_GROUP_ID)
        .eq('trip_id', activeTripId)
        .eq('owner_key', shoppingUser);

      if (error) {
        alert(`購買清單刪除失敗：${error.message || error.details || '未知 Supabase 錯誤'}`);
        console.warn('Supabase shopping item delete failed:', error);
        return;
      }

      if (shoppingCacheByTrip[cacheKey]) {
        shoppingCacheByTrip[cacheKey] = shoppingCacheByTrip[cacheKey].filter(item => String(item.id) !== String(id));
      }
    } else {
      saveLocalShoppingItems(getLocalShoppingItems().filter(item => String(item.id) !== String(id)));
    }

	    await renderShopList();
	  }

	  async function deleteShopText(id) {
	    await deleteShopItem(id);
	  }

	  async function deleteShopPhoto(id) {
	    await deleteShopItem(id);
	  }

	  async function renderShopList() {
	    const textEl = document.getElementById('shop-text-list');
	    const photoEl = document.getElementById('shop-photo-grid');
	    if (!textEl && !photoEl) return;
	    updateShoppingStorageMode();
	    const seq = ++shoppingRenderSeq;
	    const renderTripId = activeTripId;
    const renderUser = shoppingUser;
	    const cacheKey = getShoppingCacheKey(renderUser, renderTripId);
	    if (canUseRemoteShopping() && !shoppingCacheByTrip[cacheKey]) {
	      if (textEl) textEl.innerHTML = '<div class="shop-empty"><div class="shop-empty-icon">📝</div>載入購買清單中...</div>';
	      if (photoEl) photoEl.innerHTML = '<div class="shop-empty" style="grid-column:1/-1"><div class="shop-empty-icon">📷</div>載入圖片中...</div>';
	    }

	    const items = await getShoppingItems(renderUser);
	    if (seq !== shoppingRenderSeq || renderTripId !== activeTripId || renderUser !== shoppingUser) return;

	    updateShoppingStorageMode();
	    renderShopTexts(items);
	    renderShopPhotos(items);
	  }

	  function renderShopTexts(items = null) {
	    const el = document.getElementById('shop-text-list');
	    if (!el) return;
	    const all = items || getLocalShoppingItems();
	    const textItems = all.filter(item => (item.itemType || 'text') !== 'photo');
	    if (!textItems.length) {
	      el.innerHTML = '<div class="shop-empty"><div class="shop-empty-icon">📝</div>還沒有品項</div>';
	      return;
	    }
	    const sorted = textItems.filter(item => !item.checked).concat(textItems.filter(item => item.checked));
	    el.innerHTML = sorted.map(item => {
	      const noteHtml = item.note ? `<div class="shop-item-note">${escapeHtml(item.note)}</div>` : '';
	      const idArg = escapeJsArg(String(item.id));
	      return `<div class="shop-item${item.checked ? ' checked' : ''}">
	        <button class="shop-item-tick" onclick="toggleShopText('${idArg}')">${item.checked ? '✓' : ''}</button>
	        <div class="shop-item-body">
	          <div class="shop-item-text">${escapeHtml(item.text)}</div>
	          ${noteHtml}
	        </div>
	        <button class="shop-item-del" onclick="deleteShopText('${idArg}')">🗑</button>
	      </div>`;
	    }).join('');
	  }

	  function getCurrentShopPhotos(items = null) {
	    const all = items || getLocalShoppingItems();
	    return all.filter(item => (item.itemType || 'text') === 'photo' && item.photo);
	  }

	  function renderShopPhotos(items = null) {
	    const el = document.getElementById('shop-photo-grid');
	    const countEl = document.getElementById('shop-photo-count');
	    if (!el) return;
	    const photos = getCurrentShopPhotos(items);
	    if (countEl) countEl.textContent = photos.length ? `${photos.length} 張` : '';
	    if (!photos.length) {
	      el.innerHTML = '<div class="shop-empty" style="grid-column:1/-1"><div class="shop-empty-icon">📷</div>還沒有圖片</div>';
	      return;
	    }
	    el.innerHTML = photos.map((photo, index) => {
	      const idArg = escapeJsArg(String(photo.id));
	      return `<div class="shop-photo-thumb" onclick="openShopLightbox(${index})">
	        <img src="${escapeHtml(photo.photo)}" alt="">
	        <button class="shop-photo-thumb-del" onclick="event.stopPropagation();deleteShopPhoto('${idArg}')">✕</button>
	      </div>`;
	    }).join('');
	  }

	  let shopLightboxPhotos = [];
	  let shopLightboxIndex = 0;
	  let shopLightboxScale = 1;
	  let shopLightboxHandlersReady = false;

	  async function openShopLightbox(index) {
	    shopLightboxPhotos = getCurrentShopPhotos(await getShoppingItems());
	    shopLightboxIndex = index;
	    shopLightboxScale = 1;
	    renderShopLightbox();
	    const overlay = document.getElementById('shop-lb');
	    if (overlay) overlay.classList.add('open');
	  }

	  function closeShopLightbox() {
	    const overlay = document.getElementById('shop-lb');
	    if (overlay) overlay.classList.remove('open');
	  }

	  function shopLbNav(dir) {
	    if (shopLightboxPhotos.length < 2) return;
	    shopLightboxIndex = (shopLightboxIndex + dir + shopLightboxPhotos.length) % shopLightboxPhotos.length;
	    shopLightboxScale = 1;
	    renderShopLightbox();
	  }

	  function renderShopLightbox() {
	    const img = document.getElementById('shop-lb-img');
	    const current = shopLightboxPhotos[shopLightboxIndex];
	    if (!img || !current) return;
	    img.src = current.photo;
	    img.style.transform = 'scale(1)';
	    const show = shopLightboxPhotos.length > 1 ? '' : 'none';
	    const prev = document.getElementById('shop-lb-prev');
	    const next = document.getElementById('shop-lb-next');
	    if (prev) prev.style.display = show;
	    if (next) next.style.display = show;
	  }

	  function setupShopLightboxHandlers() {
	    if (shopLightboxHandlersReady) return;
	    const wrap = document.getElementById('shop-lb-wrap');
	    const overlay = document.getElementById('shop-lb');
	    if (!wrap || !overlay) return;
	    shopLightboxHandlersReady = true;
	    let t0x = 0, t0y = 0, pinchDist0 = 0, scale0 = 1, isPinch = false;
	    wrap.addEventListener('touchstart', function(e) {
	      e.preventDefault();
	      if (e.touches.length === 1) {
	        isPinch = false;
	        t0x = e.touches[0].clientX;
	        t0y = e.touches[0].clientY;
	      } else if (e.touches.length === 2) {
	        isPinch = true;
	        pinchDist0 = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
	        scale0 = shopLightboxScale;
	      }
	    }, { passive: false });
	    wrap.addEventListener('touchmove', function(e) {
	      e.preventDefault();
	      if (e.touches.length === 2) {
	        isPinch = true;
	        const d = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
	        shopLightboxScale = Math.max(1, Math.min(6, scale0 * d / pinchDist0));
	        const img = document.getElementById('shop-lb-img');
	        if (img) img.style.transform = `scale(${shopLightboxScale})`;
	      }
	    }, { passive: false });
	    wrap.addEventListener('touchend', function(e) {
	      e.preventDefault();
	      if (!isPinch && e.changedTouches.length === 1 && shopLightboxScale <= 1.05) {
	        const dx = e.changedTouches[0].clientX - t0x;
	        const dy = e.changedTouches[0].clientY - t0y;
	        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) shopLbNav(dx < 0 ? 1 : -1);
	      }
	      if (e.touches.length === 0) isPinch = false;
	    }, { passive: false });
	    overlay.addEventListener('click', function(e) {
	      if (e.target === overlay) closeShopLightbox();
	    });
	  }

  // ── Ticket lightbox ──
  function openTicket() {
    document.getElementById('ticket-overlay').classList.add('open');
    setTimeout(function(){ _initPinchZoom('ticket-overlay'); }, 50);
  }
  function closeTicket() {
    document.getElementById('ticket-overlay').classList.remove('open');
    _lbResetZoom('ticket-overlay');
  }

  renderActiveTripUI(getLocalTrips());
  initSupabaseAuth();
  renderTrips();
