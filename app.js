// ==================== CONFIGURATION ====================
const SB_URL = 'https://tncdkrgwfnbbzacfyusf.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuY2Rrcmd3Zm5iYnphY2Z5dXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMTk0NTksImV4cCI6MjA5NTg5NTQ1OX0.W4lRl_H4tBtQceI5HTZXqd9zOhG5qTk7oUunc-p5unY';

let sbClient = null;
let SESSION = null;
let CATEGORIES = [];
let currentLanguage = 'fr';
let currentView = 'home';

// ==================== 69 WILAYAS D'ALGÉRIE ====================
const WILAYAS_FR = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar', 'Blida', 'Bouira',
  'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda',
  'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem', 'M\'Sila', 'Mascara',
  'Ouargla', 'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arréridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt',
  'El Oued', 'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent', 'Ghardaïa',
  'Relizane', 'Timimoun', 'Bordj Badji Mokhtar', 'Ouled Djellal', 'Béni Abbès', 'In Salah', 'In Guezzam',
  'Touggourt', 'Djanet', 'El M\'Ghair', 'El Meniaa', 'Aflou', 'El Abiodh Sidi Cheikh', 'El Aricha', 'El Kantara',
  'Barika', 'Bou Saâda', 'Bir El Ater', 'Ksar El Boukhari', 'Ksar Chellala', 'Aïn Oussera', 'Messaad'
];

const WILAYAS_AR = [
  'أدرار', 'الشلف', 'الأغواط', 'أم البواقي', 'باتنة', 'بجاية', 'بسكرة', 'بشار', 'البليدة', 'البويرة',
  'تمنراست', 'تبسة', 'تلمسان', 'تيارت', 'تيزي وزو', 'الجزائر', 'الجلفة', 'جيجل', 'سطيف', 'سعيدة',
  'سكيكدة', 'سيدي بلعباس', 'عنابة', 'قالمة', 'قسنطينة', 'المدية', 'مستغانم', 'المسيلة', 'معسكر',
  'ورقلة', 'وهران', 'البيض', 'إليزي', 'برج بوعريريج', 'بومرداس', 'الطارف', 'تندوف', 'تيسمسيلت',
  'الوادي', 'خنشلة', 'سوق أهراس', 'تيبازة', 'ميلة', 'عين الدفلى', 'النعامة', 'عين تموشنت', 'غرداية',
  'غليزان', 'تيميمون', 'برج باجي مختار', 'أولاد جلال', 'بني عباس', 'عين صالح', 'عين قزام',
  'تقرت', 'جانت', 'المغير', 'المنيعة', 'أفلو', 'الأبيض سيدي الشيخ', 'العريشة', 'القنطرة',
  'بريكة', 'بوسعادة', 'بئر العاتر', 'قصر البخاري', 'قصر الشلالة', 'عين وسارة', 'مسعد'
];

// ==================== EVENT TYPES ====================
const EVENT_TYPES = {
  competition: { ar: 'مسابقة', fr: 'Compétition', icon: 'ti-trophy', cls: 'evt-type-competition' },
  stage: { ar: 'تربص', fr: 'Stage', icon: 'ti-tent', cls: 'evt-type-stage' },
  grade: { ar: 'اجتياز الرتب', fr: 'Passage de grade', icon: 'ti-certificate', cls: 'evt-type-grade' },
  festival: { ar: 'مهرجان', fr: 'Festival', icon: 'ti-confetti', cls: 'evt-type-festival' }
};

// ==================== GESTION DE SESSION ====================
function saveSession(session) {
  if (session) {
    localStorage.setItem('kyokushin_session', JSON.stringify(session));
  } else {
    localStorage.removeItem('kyokushin_session');
  }
}

function loadSession() {
  const data = localStorage.getItem('kyokushin_session');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function clearSession() {
  localStorage.removeItem('kyokushin_session');
  SESSION = null;
}

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', function() {
  if (typeof window.supabase !== 'undefined') {
    sbClient = window.supabase.createClient(SB_URL, SB_KEY);
    console.log('Supabase initialized');
    
    const savedSession = loadSession();
    if (savedSession) {
      SESSION = savedSession;
      initApp();
      enterApp();
      if (SESSION.role === 'admin') {
        renderAdminDash();
      } else {
        renderClubHome();
      }
    } else {
      initApp();
    }
  } else {
    console.error('Supabase non trouvé');
  }
});

async function initApp() {
  fillWilayas('mclub-wilaya');
  fillWilayas('mcomp-wilaya');
  setupExcelImport();
  setupMultiSelect();
  await loadCategories();
  applyLanguage();
}

// ==================== WILAYAS ====================
function getWilayas() {
  return currentLanguage === 'fr' ? WILAYAS_FR : WILAYAS_AR;
}

function fillWilayas(selId) {
  const sel = document.getElementById(selId);
  if (!sel) return;
  const wilayas = getWilayas();
  sel.innerHTML = '<option value="">' + (currentLanguage === 'fr' ? 'Sélectionner...' : 'اختر...') + '</option>' +
    wilayas.map(w => `<option value="${w}">${w}</option>`).join('');
}

// ==================== CATEGORIES ====================
async function loadCategories() {
  if (!sbClient) return;
  try {
    const { data, error } = await sbClient.from('categories').select('*').order('id');
    if (error) throw error;
    if (data) CATEGORIES = data;
    console.log('Catégories chargées:', CATEGORIES.length);
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

// ==================== UTILS ====================
function t(ar, fr) {
  return currentLanguage === 'ar' ? ar : fr;
}

function showFlash(msg, type = 'ok') {
  const flash = document.getElementById('flash');
  if (!flash) return;
  flash.textContent = msg;
  flash.className = `flash flash-${type} show`;
  clearTimeout(flash._timer);
  flash._timer = setTimeout(() => flash.className = 'flash', 3000);
}

function fmtDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function fmtDateInput(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toISOString().split('T')[0];
}

function isPast(dl) {
  return dl && new Date(dl) < new Date();
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

function setSidebarActive(activeId) {
  document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
  const el = document.getElementById(activeId);
  if (el) el.classList.add('active');
}

function setMain(html) {
  const main = document.getElementById('main-content');
  main.innerHTML = html;
  main.style.animation = 'none';
  requestAnimationFrame(() => main.style.animation = 'slideIn 0.25s ease');
}

// ==================== LANGUE ====================
function setLanguage(lang) {
  currentLanguage = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  applyLanguage();
  if (SESSION) {
    if (SESSION.role === 'admin') renderAdminDash();
    else renderClubHome();
  }
}

window.toggleLanguage = function() {
  setLanguage(currentLanguage === 'fr' ? 'ar' : 'fr');
}

function applyLanguage() {
  const isAr = currentLanguage === 'ar';
  
  const map = {
    'login-title': isAr ? 'تسجيل الدخول' : 'Connexion',
    'email-label': isAr ? 'البريد الإلكتروني' : 'Email',
    'password-label': isAr ? 'كلمة المرور' : 'Mot de passe',
    'login-btn': isAr ? 'تسجيل الدخول' : 'Se connecter'
  };
  Object.keys(map).forEach(id => { 
    const el = document.getElementById(id); 
    if (el) el.textContent = map[id]; 
  });

  const langSwitch = document.getElementById('lang-switch');
  if (langSwitch) langSwitch.innerHTML = `<i class="ti ti-language"></i> ${isAr ? 'FR' : 'AR'}`;

  const logoutHeader = document.getElementById('logout-header');
  if (logoutHeader) logoutHeader.innerHTML = `<i class="ti ti-logout"></i> ${isAr ? 'تسجيل الخروج' : 'Déconnexion'}`;

  fillWilayas('mclub-wilaya');
  fillWilayas('mcomp-wilaya');
}

// ==================== AUTHENTIFICATION ====================
window.login = async function() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-pw').value;
  const errDiv = document.getElementById('login-error');
  errDiv.style.display = 'none';

  if (email === 'admin@kyokushin.dz' && password === 'admin123') {
    SESSION = { role: 'admin', userId: 'admin' };
    saveSession(SESSION);
    await loadCategories();
    enterApp();
    renderAdminDash();
    return;
  }

  if (!sbClient) {
    errDiv.style.display = 'block';
    errDiv.textContent = t('خطأ في الاتصال بقاعدة البيانات', 'Erreur de connexion à la base de données');
    return;
  }

  try {
    const { data, error } = await sbClient.from('clubs').select('*').eq('email', email).eq('password', password);
    if (data && data.length > 0) {
      SESSION = { role: 'club', userId: data[0].id, clubId: data[0].id, clubData: data[0] };
      saveSession(SESSION);
      await loadCategories();
      enterApp();
      renderClubHome();
      return;
    }
    errDiv.style.display = 'block';
    errDiv.textContent = t('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'Email ou mot de passe incorrect');
  } catch (err) {
    errDiv.style.display = 'block';
    errDiv.textContent = 'Erreur: ' + err.message;
  }
}

function enterApp() {
  document.getElementById('page-login').style.display = 'none';
  document.getElementById('app-shell').style.display = 'block';
  
  const isAr = currentLanguage === 'ar';
  const userName = document.getElementById('user-name');
  const userRole = document.getElementById('user-role');
  const welcomeAr = document.getElementById('welcome-ar');
  const welcomeFr = document.getElementById('welcome-fr');
  
  if (SESSION.role === 'admin') {
    if (userName) userName.textContent = t('المسؤول', 'Administrateur');
    if (userRole) userRole.textContent = t('مدير النظام', 'Administrateur');
    if (welcomeAr) welcomeAr.textContent = 'مرحباً في لوحة تحكم المسؤول';
    if (welcomeFr) welcomeFr.textContent = 'Bienvenue dans le tableau de bord administrateur';
    renderAdminSidebar();
  } else {
    if (userName) userName.textContent = SESSION.clubData?.name || 'Club';
    if (userRole) userRole.textContent = t('نادي', 'Club');
    if (welcomeAr) welcomeAr.textContent = `مرحباً في ${SESSION.clubData?.name || 'النادي'}`;
    if (welcomeFr) welcomeFr.textContent = `Bienvenue au ${SESSION.clubData?.name || 'Club'}`;
    renderClubSidebar();
  }
}

window.logout = function() {
  clearSession();
  document.getElementById('page-login').style.display = 'flex';
  document.getElementById('app-shell').style.display = 'none';
}

// ==================== SIDEBAR ====================
function renderAdminSidebar() {
  const isAr = currentLanguage === 'ar';
  const items = [
    { id: 'sb-dash', icon: 'ti-layout-dashboard', label: isAr ? 'لوحة التحكم' : 'Dashboard', fn: 'renderAdminDash()' },
    { id: 'sb-clubs', icon: 'ti-building', label: isAr ? 'الأندية' : 'Clubs', fn: 'renderAdminClubs()' },
    { id: 'sb-cats', icon: 'ti-category', label: isAr ? 'الفئات' : 'Catégories', fn: 'renderAdminCategories()' },
    { id: 'sb-comps', icon: 'ti-calendar-event', label: isAr ? 'الفعاليات' : 'Événements', fn: 'renderAdminComps()' },
    { id: 'sb-parts', icon: 'ti-users', label: isAr ? 'المشاركون' : 'Participants', fn: 'window.renderAdminParticipants()' }
  ];
  document.getElementById('sidebar').innerHTML = items.map(i =>
    `<button id="${i.id}" class="sidebar-btn" onclick="${i.fn};setSidebarActive('${i.id}')"><i class="ti ${i.icon}"></i> ${i.label}</button>`
  ).join('');
}

function renderClubSidebar() {
  const isAr = currentLanguage === 'ar';
  document.getElementById('sidebar').innerHTML = `
    <button id="sb-comps2" class="sidebar-btn" onclick="renderClubHome();setSidebarActive('sb-comps2')"><i class="ti ti-calendar-event"></i> ${isAr ? 'الفعاليات' : 'Événements'}</button>
    <button id="sb-myregs" class="sidebar-btn" onclick="renderClubMyRegs();setSidebarActive('sb-myregs')"><i class="ti ti-clipboard-list"></i> ${isAr ? 'تسجيلاتي' : 'Mes inscriptions'}</button>
  `;
}

// ==================== ADMIN DASHBOARD ====================
async function renderAdminDash() {
  setSidebarActive('sb-dash');
  if (!sbClient) return;
  const isAr = currentLanguage === 'ar';

  try {
    const { count: clubsCount } = await sbClient.from('clubs').select('*', { count: 'exact', head: true });
    const { count: compsCount } = await sbClient.from('competitions').select('*', { count: 'exact', head: true });
    const { data: regs } = await sbClient.from('registrations').select('participants');
    let totalP = 0;
    if (regs) regs.forEach(r => totalP += (r.participants?.length || 0));

    setMain(`
      <div class="section-title">${isAr ? 'لوحة التحكم' : 'Tableau de bord'}</div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-value">${clubsCount || 0}</div><div><i class="ti ti-building"></i> ${isAr ? 'الأندية' : 'Clubs'}</div></div>
        <div class="stat-card"><div class="stat-value">${compsCount || 0}</div><div><i class="ti ti-calendar-event"></i> ${isAr ? 'الفعاليات' : 'Événements'}</div></div>
        <div class="stat-card"><div class="stat-value">${totalP}</div><div><i class="ti ti-users"></i> ${isAr ? 'المشاركون' : 'Participants'}</div></div>
      </div>
    `);
  } catch (err) {
    console.error('Erreur dashboard:', err);
    setMain('<div class="error-msg">Erreur de chargement</div>');
  }
}

// ==================== ADMIN CLUBS ====================
async function renderAdminClubs() {
  setSidebarActive('sb-clubs');
  if (!sbClient) return;
  const isAr = currentLanguage === 'ar';

  try {
    const { data: clubs, error } = await sbClient.from('clubs').select('*').order('name');
    if (error) throw error;
    
    const rows = clubs?.map(c => `
      <tr>
        <td style="font-weight:600">${c.name}</td>
        <td>${c.club_code || '—'}</td>
        <td>${c.wilaya || '—'}</td>
        <td>${c.responsable || '—'}</td>
        <td>${c.email}</td>
        <td>${c.phone || '—'}</td>
        <td>
          <button class="btn-outline btn-sm" onclick="editClub(${c.id})"><i class="ti ti-edit"></i></button>
          <button class="btn-red btn-sm" onclick="deleteClub(${c.id})"><i class="ti ti-trash"></i></button>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="7">${isAr ? 'لا توجد أندية' : 'Aucun club'}</td></tr>`;

    setMain(`
      <div class="section-title">${isAr ? 'إدارة الأندية' : 'Gestion des clubs'}</div>
      <div class="table-toolbar"><button class="btn-primary btn-sm" onclick="openNewClub()"><i class="ti ti-plus"></i> ${isAr ? 'نادي جديد' : 'Nouveau club'}</button></div>
      <div class="card"><div class="table-wrap"><table><thead><tr><th>${isAr ? 'الاسم' : 'Nom'}</th><th>Code</th><th>Wilaya</th><th>${isAr ? 'المسؤول' : 'Responsable'}</th><th>Email</th><th>${isAr ? 'الهاتف' : 'Téléphone'}</th><th>${isAr ? 'إجراءات' : 'Actions'}</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    `);
  } catch (err) {
    console.error('Erreur renderAdminClubs:', err);
    setMain('<div class="error-msg">Erreur de chargement des clubs</div>');
  }
}

// ==================== CLUB FUNCTIONS ====================
async function renderClubHome() {
  setSidebarActive('sb-comps2');
  await loadCategories();
  const isAr = currentLanguage === 'ar';
  
  try {
    const { data: comps } = await sbClient.from('competitions').select('*').order('id', { ascending: false });
    const { data: myRegs } = await sbClient.from('registrations').select('*').eq('club_id', SESSION.clubId);

    const cards = comps?.map(comp => {
      const past = isPast(comp.deadline);
      const reg = myRegs?.find(r => r.competition_id === comp.id);
      const catIds = comp.category_ids || [];
      const catNames = catIds.map(cid => {
        const cat = CATEGORIES.find(c => c.id === cid);
        return cat ? cat.name_fr : '?';
      });
      
      return `
        <div class="card comp-card ${past ? 'closed' : reg ? 'registered' : ''}">
          <div class="comp-header">
            <div>
              <div class="comp-name-ar">${comp.name}</div>
              <div class="comp-name-en">${comp.name_en}</div>
              <div class="comp-details">
                <span><i class="ti ti-map-pin"></i> ${comp.wilaya || '—'}</span>
                <span><i class="ti ti-calendar"></i> ${fmtDate(comp.date_start)}</span>
                <span><i class="ti ti-clock-hour-4"></i> ${fmtDate(comp.deadline)}</span>
              </div>
              <div class="comp-cats">${catNames.map(name => `<span class="cat-tag">${name}</span>`).join('')}</div>
            </div>
            <div class="comp-actions">
              ${!past && !reg ? `<button class="btn-primary btn-sm" onclick="openRegisterModal(${comp.id})"><i class="ti ti-user-plus"></i> ${isAr ? 'تسجيل' : 'S\'inscrire'}</button>` : ''}
              ${!past && reg ? `<span class="badge badge-green"><i class="ti ti-check"></i> ${isAr ? 'مسجل' : 'Inscrit'} (${reg.participants?.length || 0})</span> <button class="btn-outline btn-sm" onclick="openRegisterModal(${comp.id})"><i class="ti ti-edit"></i> ${isAr ? 'تعديل' : 'Modifier'}</button>` : ''}
              ${past ? `<span class="badge badge-red">${isAr ? 'مغلق' : 'Clôturé'}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('') || `<div class="card empty-card">${isAr ? 'لا توجد فعاليات' : 'Aucun événement'}</div>`;
    
    setMain(`<div class="section-title">${isAr ? 'الفعاليات المتاحة' : 'Événements disponibles'}</div>${cards}`);
  } catch (err) {
    console.error('Erreur renderClubHome:', err);
    setMain('<div class="error-msg">Erreur de chargement</div>');
  }
}

async function renderClubMyRegs() {
  setSidebarActive('sb-myregs');
  const isAr = currentLanguage === 'ar';

  try {
    const { data: regs } = await sbClient.from('registrations').select('*').eq('club_id', SESSION.clubId);

    if (!regs?.length) {
      setMain(`<div class="section-title">${isAr ? 'تسجيلاتي' : 'Mes inscriptions'}</div><div class="card empty-card">${isAr ? 'لا توجد تسجيلات' : 'Aucune inscription'}</div>`);
      return;
    }

    let html = '';
    for (const reg of regs) {
      const { data: comp } = await sbClient.from('competitions').select('*').eq('id', reg.competition_id).single();
      const rows = reg.participants?.map((p, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${p.name}</td>
          <td>${fmtDate(p.dob)}</td>
          <td>${p.weight ? p.weight + ' kg' : '—'}</td>
          <td>${p.gender}</td>
          <td>${p.category || '—'}</td>
        </tr>
      `).join('') || `<tr><td colspan="6">${isAr ? 'لا توجد بيانات' : 'Aucune donnée'}</td></tr>`;
      
      html += `
        <div class="card" style="margin-bottom:20px; overflow:hidden;">
          <div style="background: var(--green-900); padding: 14px 20px; color: white;">
            <div style="font-family: var(--font-ar); font-size: 15px; font-weight:700;">${comp?.name}</div>
            <div style="font-size: 11.5px; opacity: 0.75; font-family: var(--font-fr); letter-spacing:.5px; text-transform:uppercase;">${comp?.name_en}</div>
          </div>
          <div style="padding: 18px 20px;">
            <div class="table-wrap"><table><thead><tr><th>#</th><th>${isAr ? 'الاسم' : 'Nom'}</th><th>${isAr ? 'الميلاد' : 'Naissance'}</th><th>${isAr ? 'الوزن' : 'Poids'}</th><th>${isAr ? 'الجنس' : 'Sexe'}</th><th>${isAr ? 'الفئة' : 'Catégorie'}</th></tr></thead><tbody>${rows}</tbody></table></div>
          </div>
        </div>
      `;
    }
    setMain(`<div class="section-title">${isAr ? 'تسجيلاتي' : 'Mes inscriptions'}</div>${html}`);
  } catch (err) {
    console.error('Erreur renderClubMyRegs:', err);
    setMain('<div class="error-msg">Erreur de chargement</div>');
  }
}

// ==================== ADMIN PARTICIPANTS ====================
let currentFilterComp = '', currentFilterClub = '', currentFilterCat = '';

window.renderAdminParticipants = async function(filterComp = '', filterClub = '', filterCat = '') {
  currentFilterComp = filterComp;
  currentFilterClub = filterClub;
  currentFilterCat = filterCat;
  const isAr = currentLanguage === 'ar';
  
  try {
    const { data: clubs } = await sbClient.from('clubs').select('*');
    const { data: comps } = await sbClient.from('competitions').select('*');
    let { data: regs } = await sbClient.from('registrations').select('*');
    
    if (filterComp) regs = regs?.filter(r => r.competition_id === parseInt(filterComp));
    if (filterClub) regs = regs?.filter(r => r.club_id === parseInt(filterClub));
    
    let all = [];
    regs?.forEach(r => {
      const club = clubs?.find(c => c.id === r.club_id);
      r.participants?.forEach((p, idx) => {
        all.push({ 
          numero: idx + 1, 
          ...p, 
          clubName: club?.name || '?', 
          clubCode: club?.club_code || '?', 
          clubWilaya: club?.wilaya || '?' 
        });
      });
    });
    
    if (filterCat) all = all.filter(p => p.category === filterCat);
    
    const rows = all.map(p => `
      <tr>
        <td>${p.numero}</td>
        <td>${p.name}</td>
        <td>${fmtDate(p.dob)}</td>
        <td>${p.weight || '—'}</td>
        <td>${p.gender}</td>
        <td>${p.clubCode}</td>
        <td>${p.clubName}</td>
        <td>${p.clubWilaya}</td>
      </tr>
    `).join('') || `<tr><td colspan="8">${isAr ? 'لا توجد بيانات' : 'Aucune donnée'}</td></tr>`;

    const clubOptions = clubs?.map(c => `<option value="${c.id}">${c.name} (${c.wilaya || ''})</option>`).join('') || '';
    const uniqueCategories = [...new Set(regs?.flatMap(r => r.participants?.map(p => p.category)) || [])];
    const catOptions = uniqueCategories.map(c => `<option value="${c}">${c}</option>`).join('') || '';

    setMain(`
      <div class="section-title">${isAr ? 'المشاركون' : 'Participants'}</div>
      <div class="filter-bar">
        <select onchange="window.renderAdminParticipants(this.value,document.getElementById('filter-club').value,document.getElementById('filter-cat').value)" id="filter-comp">
          <option value="">${isAr ? 'جميع الفعاليات' : 'Tous événements'}</option>
          ${comps?.map(c => `<option value="${c.id}" ${filterComp == c.id ? 'selected' : ''}>${c.name_en}</option>`).join('')}
        </select>
        <select onchange="window.renderAdminParticipants(document.getElementById('filter-comp').value,this.value,document.getElementById('filter-cat').value)" id="filter-club">
          <option value="">${isAr ? 'جميع الأندية' : 'Tous clubs'}</option>
          ${clubOptions}
        </select>
        <select onchange="window.renderAdminParticipants(document.getElementById('filter-comp').value,document.getElementById('filter-club').value,this.value)" id="filter-cat">
          <option value="">${isAr ? 'جميع الفئات' : 'Toutes catégories'}</option>
          ${catOptions}
        </select>
        <button class="btn-primary btn-sm" onclick="window.exportCompetitionParticipants()"><i class="ti ti-file-spreadsheet"></i> ${isAr ? 'تصدير إكسل' : 'Exporter Excel'}</button>
      </div>
      <div class="card"><div class="table-wrap"><table><thead><tr><th>#</th><th>${isAr ? 'الاسم' : 'Nom'}</th><th>${isAr ? 'الميلاد' : 'Naissance'}</th><th>${isAr ? 'الوزن' : 'Poids'}</th><th>${isAr ? 'الجنس' : 'Sexe'}</th><th>ID</th><th>${isAr ? 'النادي' : 'Club'}</th><th>Wilaya</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    `);
  } catch (err) {
    console.error('Erreur renderAdminParticipants:', err);
    setMain('<div class="error-msg">Erreur de chargement des participants</div>');
  }
}

window.exportCompetitionParticipants = async function() {
  const compId = currentFilterComp;
  if (!compId) {
    showFlash(t('اختر فعالية', 'Sélectionnez un événement'), 'err');
    return;
  }
  
  try {
    const { data: comp } = await sbClient.from('competitions').select('*').eq('id', parseInt(compId)).single();
    const { data: regs } = await sbClient.from('registrations').select('*').eq('competition_id', parseInt(compId));
    const { data: clubs } = await sbClient.from('clubs').select('*');

    const participantsData = [];
    regs?.forEach(r => {
      const club = clubs?.find(c => c.id === r.club_id);
      r.participants?.forEach((p, idx) => {
        participantsData.push([
          idx + 1, 
          p.name, 
          fmtDate(p.dob), 
          p.weight || '', 
          p.gender || '', 
          club?.club_code || '', 
          club?.name || '', 
          club?.wilaya || ''
        ]);
      });
    });
    
    const sheet1 = XLSX.utils.aoa_to_sheet([
      ['Numero', 'NomPrenom', 'DateNaissance', 'Poids', 'Sexe', 'ID_Club', 'Club', 'Wilaya'], 
      ...participantsData
    ]);
    
    const clubsData = clubs?.map(c => [c.name, c.club_code || '']) || [];
    const sheet2 = XLSX.utils.aoa_to_sheet([['Club', 'ID'], ...clubsData]);
    
    const catsData = CATEGORIES.map((c, i) => [
      i + 1, 
      c.name_fr, 
      c.poids_fr || c.name_fr, 
      c.gender, 
      c.name_ar || '', 
      c.poids_ar || '', 
      c.gender_ar || '', 
      c.annee_min, 
      c.annee_max, 
      c.poids_min, 
      c.poids_max, 
      'OUI'
    ]);
    const sheet3 = XLSX.utils.aoa_to_sheet([
      ['Numero', 'Designation', 'PoidsCategorie', 'Genre', 'DesignationAR', 'PoidsCategorieAR', 'GenreAR', 'AnneeMin', 'AnneeMax', 'PoidsMin', 'PoidsMax', 'Regenerate'], 
      ...catsData
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet1, 'Participants');
    XLSX.utils.book_append_sheet(wb, sheet2, 'Clubs');
    XLSX.utils.book_append_sheet(wb, sheet3, 'Categories');
    XLSX.writeFile(wb, `Participants_${comp?.name_en?.replace(/[^a-z0-9]/gi, '_') || 'evenement'}.xlsx`);
    showFlash(t('تم التصدير', 'Export terminé'));
  } catch (err) {
    console.error('Erreur export:', err);
    showFlash('Erreur: ' + err.message, 'err');
  }
}

// ==================== FONCTIONS DE SÉLECTION MULTIPLE ====================
window.selectAllCategories = function() {
  const sel = document.getElementById('mcomp-cats');
  if (sel) {
    Array.from(sel.options).forEach(opt => opt.selected = true);
  }
}

window.deselectAllCategories = function() {
  const sel = document.getElementById('mcomp-cats');
  if (sel) {
    Array.from(sel.options).forEach(opt => opt.selected = false);
  }
}

function setupMultiSelect() {
  const sel = document.getElementById('mcomp-cats');
  if (sel) {
    sel.addEventListener('mousedown', function(e) {
      e.preventDefault();
      const option = e.target;
      if (option.tagName === 'OPTION') {
        if (e.ctrlKey || e.metaKey) {
          option.selected = !option.selected;
        } else {
          Array.from(this.options).forEach(opt => opt.selected = false);
          option.selected = true;
        }
        this.dispatchEvent(new Event('change'));
      }
    });
  }
}

// ==================== EXCEL IMPORT ====================
function setupExcelImport() {
  const dropArea = document.getElementById('excel-upload-area');
  const fileInput = document.getElementById('excel-upload-input');
  if (!dropArea) return;

  dropArea.onclick = () => fileInput.click();
  dropArea.ondragover = e => { 
    e.preventDefault(); 
    dropArea.style.borderColor = '#0c5c3a';
    dropArea.style.background = 'rgba(12,92,58,0.05)';
  };
  dropArea.ondragleave = e => { 
    dropArea.style.borderColor = '#e3ded2';
    dropArea.style.background = 'transparent';
  };
  dropArea.ondrop = e => {
    e.preventDefault();
    dropArea.style.borderColor = '#e3ded2';
    dropArea.style.background = 'transparent';
    const file = e.dataTransfer.files[0];
    if (file) processExcel(file);
  };
  fileInput.onchange = e => { 
    if (e.target.files[0]) processExcel(e.target.files[0]); 
  };

  const downloadLink = document.getElementById('download-template-link');
  if (downloadLink) {
    downloadLink.onclick = e => {
      e.preventDefault();
      const template = [
        ['الرقم', 'الاسم واللقب', 'تاريخ الميلاد', 'الوزن', 'الجنس'],
        ['1', 'أحمد بن سالم', '2000-01-15', '65', 'ذكور']
      ];
      const ws = XLSX.utils.aoa_to_sheet(template);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inscriptions');
      XLSX.writeFile(wb, 'template_inscription.xlsx');
      showFlash(t('تم التحميل', 'Template téléchargé'));
    };
  }
}

function processExcel(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      let count = 0;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const name = row[1] || row[0];
        const dob = row[2];
        const weight = parseFloat(row[3]);
        const gender = row[4] === 'ذكور' || row[4] === 'Masculin' || row[4] === 'M' ? 'ذكور' : 'إناث';

        if (name && dob) {
          const birthYear = new Date(dob).getFullYear();
          const genderFr = gender === 'ذكور' ? 'Hommes' : 'Femmes';
          let category = 'À déterminer';
          let categoryId = null;
          
          if (!isNaN(weight) && weight > 0) {
            const found = CATEGORIES.find(c => 
              c.gender === genderFr && 
              birthYear >= c.annee_min && 
              birthYear <= c.annee_max && 
              weight > c.poids_min && 
              weight <= c.poids_max
            );
            if (found) {
              category = found.name_fr;
              categoryId = found.id;
            }
          }

          regState.participants.push({
            name,
            dob,
            weight: isNaN(weight) ? null : weight,
            gender,
            category,
            category_id: categoryId,
            belt: ''
          });
          count++;
        }
      }

      renderParticipantList();
      showFlash(`${count} ${t('مشارك تم استيراده', 'participants importés')}`);
    } catch (err) {
      console.error('Erreur processExcel:', err);
      showFlash('Erreur lecture fichier: ' + err.message, 'err');
    }
  };
  reader.readAsArrayBuffer(file);
}

// ==================== REGISTRATION ====================
let regState = { compId: null, participants: [] };

window.openRegisterModal = async function(compId) {
  regState = { compId, participants: [] };
  try {
    const { data: comp } = await sbClient.from('competitions').select('*').eq('id', compId).single();
    const { data: existing } = await sbClient.from('registrations').select('*').eq('competition_id', compId).eq('club_id', SESSION.clubId).single();
    if (existing) regState.participants = existing.participants || [];
    
    document.getElementById('mreg-comp-ar').textContent = comp.name;
    document.getElementById('mreg-comp-en').textContent = comp.name_en;
    const catSel = document.getElementById('mreg-pcat');
    catSel.innerHTML = (comp.category_ids || []).map(cid => {
      const cat = CATEGORIES.find(c => c.id === cid);
      return cat ? `<option value="${cat.id}">${cat.name_fr}</option>` : '';
    }).join('');
    clearParticipantForm();
    renderParticipantList();
    openModal('modal-register');
  } catch (err) {
    console.error('Erreur openRegisterModal:', err);
    showFlash('Erreur: ' + err.message, 'err');
  }
}

function clearParticipantForm() {
  document.getElementById('mreg-pname').value = '';
  document.getElementById('mreg-pdob').value = '';
  document.getElementById('mreg-pweight').value = '';
  document.getElementById('mreg-pgender').value = 'ذكور';
}

window.addManualParticipant = function() {
  const name = document.getElementById('mreg-pname').value.trim();
  const dob = document.getElementById('mreg-pdob').value;
  const weight = parseFloat(document.getElementById('mreg-pweight').value);
  const gender = document.getElementById('mreg-pgender').value;
  const category = document.getElementById('mreg-pcat').value;
  
  if (!name || !dob) {
    showFlash(t('الاسم والتاريخ مطلوبان', 'Nom et date requis'), 'err');
    return;
  }
  
  const cat = CATEGORIES.find(c => c.id === parseInt(category));
  regState.participants.push({ 
    name, 
    dob, 
    weight: isNaN(weight) ? null : weight, 
    gender, 
    category: cat?.name_fr || 'À déterminer',
    category_id: category || null,
    belt: '' 
  });
  clearParticipantForm();
  renderParticipantList();
  showFlash(t('تمت الإضافة', 'Ajouté'));
}

function renderParticipantList() {
  const wrap = document.getElementById('mreg-list-wrap');
  if (!regState.participants.length) {
    wrap.innerHTML = '';
    return;
  }
  const isAr = currentLanguage === 'ar';
  const rows = regState.participants.map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${p.name}</td>
      <td>${fmtDate(p.dob)}</td>
      <td>${p.weight ? p.weight + ' kg' : '—'}</td>
      <td>${p.gender}</td>
      <td>${p.category || '—'}</td>
      <td><button class="btn-red btn-sm" onclick="removeParticipant(${i})"><i class="ti ti-trash"></i></button></td>
    </tr>
  `).join('');
  wrap.innerHTML = `
    <div class="section-title" style="font-size:15px;margin-top:16px;">${isAr ? 'القائمة' : 'Liste'} (${regState.participants.length})</div>
    <div class="table-wrap"><table><thead><tr><th>#</th><th>${isAr ? 'الاسم' : 'Nom'}</th><th>${isAr ? 'الميلاد' : 'Naissance'}</th><th>${isAr ? 'الوزن' : 'Poids'}</th><th>${isAr ? 'الجنس' : 'Sexe'}</th><th>${isAr ? 'الفئة' : 'Catégorie'}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
  `;
}

window.removeParticipant = function(i) {
  regState.participants.splice(i, 1);
  renderParticipantList();
}

window.submitRegistration = async function() {
  if (!regState.participants.length) {
    showFlash(t('أضف مشاركين', 'Ajoutez des participants'), 'err');
    return;
  }
  try {
    const { data: existing } = await sbClient.from('registrations').select('id').eq('competition_id', regState.compId).eq('club_id', SESSION.clubId).single();
    if (existing) {
      await sbClient.from('registrations').update({ participants: regState.participants }).eq('id', existing.id);
    } else {
      await sbClient.from('registrations').insert({ competition_id: regState.compId, club_id: SESSION.clubId, participants: regState.participants });
    }
    showFlash(t('تم حفظ التسجيل', 'Inscription enregistrée'));
    closeModal('modal-register');
    renderClubHome();
  } catch (err) {
    console.error('Erreur submitRegistration:', err);
    showFlash('Erreur: ' + err.message, 'err');
  }
}