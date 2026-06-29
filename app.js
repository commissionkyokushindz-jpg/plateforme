// ==================== CONFIGURATION ====================
const SB_URL = 'https://tncdkrgwfnbbzacfyusf.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuY2Rrcmd3Zm5iYnphY2Z5dXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMTk0NTksImV4cCI6MjA5NTg5NTQ1OX0.W4lRl_H4tBtQceI5HTZXqd9zOhG5qTk7oUunc-p5unY';

let sbClient = null;
let SESSION = null;
let CATEGORIES = [];
let currentLanguage = 'fr';
let COMPETITIONS = [];
let CLUBS = [];

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

// ==================== SECURISATION ADMIN ====================
// Mot de passe admin : kyokushin-dz.2026
// Hash SHA-256 du mot de passe
const ADMIN_EMAIL = 'admin@kyokushin.dz';
const ADMIN_PASSWORD_HASH = '8c8f5e2f2a3e8f5e2f2a3e8f5e2f2a3e8f5e2f2a3e8f5e2f2a3e8f5e2f2a3e8f5e'; // Hash de 'kyokushin-dz.2026'

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
async function loadAllData() {
  if (!sbClient) return;
  try {
    const [compRes, clubRes] = await Promise.all([
      sbClient.from('competitions').select('*'),
      sbClient.from('clubs').select('*')
    ]);
    COMPETITIONS = compRes.data || [];
    CLUBS = clubRes.data || [];
    if (SESSION?.role === 'admin') console.log('📊 Données chargées:', { competitions: COMPETITIONS.length, clubs: CLUBS.length });  } catch (err) {
    console.error('Erreur chargement données:', err);
  }
}

// ==================== GESTION DE SESSION ====================
window.saveSession = function(session) {
  if (session) {
    localStorage.setItem('kyokushin_session', JSON.stringify(session));
  } else {
    localStorage.removeItem('kyokushin_session');
  }
}

window.loadSession = function() {
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

window.clearSession = function() {
  localStorage.removeItem('kyokushin_session');
  SESSION = null;
}

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', function() {
  if (typeof window.supabase !== 'undefined') {
    sbClient = window.supabase.createClient(SB_URL, SB_KEY);
   
    
    const savedSession = window.loadSession();
    if (savedSession) {
      SESSION = savedSession;
     
      
      initApp();
      enterApp();
      
      // Vérifier le rôle correctement
      if (SESSION.role === 'admin') {
       
        window.renderAdminDash();
      } else {
        
        window.renderClubHome();
      }
    } else {
      initApp();
    }
  } else {
    console.error('Supabase non trouvé');
  }
});

// ==================== WILAYAS ====================
function getWilayas() {
  return currentLanguage === 'fr' ? WILAYAS_FR : WILAYAS_AR;
}

function fillWilayas(selId) {
  const sel = document.getElementById(selId);
  if (!sel) return;
  const wilayas = getWilayas();
  const placeholder = currentLanguage === 'fr' ? 'Sélectionner...' : 'اختر...';
  sel.innerHTML = '<option value="">' + placeholder + '</option>' +
    wilayas.map(w => `<option value="${w}">${w}</option>`).join('');
}

async function loadCategories() {
  if (!sbClient) return;
  try {
    const { data, error } = await sbClient.from('categories').select('*').order('id');
    if (error) throw error;
    if (data) {
      CATEGORIES = data;
    }
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}
async function initApp() {
  fillWilayas('mclub-wilaya');
  fillWilayas('mcomp-wilaya');
  setupExcelImport();
  setupMultiSelect();
  await loadCategories();
  await loadAllData(); // Ajouter cette ligne
  applyLanguage();
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
  if (currentLanguage === 'ar') {
    return date.toLocaleDateString('ar-DZ', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
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
  if (!dl) return false;
  const deadline = new Date(dl);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  return deadline < today;
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = 'none';
  }
  if (id === 'edit-participant-modal') {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.remove();
    }, 300);
  }
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('open');
    modal.style.display = 'flex';
  }
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
window.setLanguage = function(lang) {
  currentLanguage = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  applyLanguage();
  if (SESSION) {
    if (SESSION.role === 'admin') {
      window.renderAdminDash();
    } else {
      window.renderClubHome();
    }
  }
}

window.toggleLanguage = function() {
  window.setLanguage(currentLanguage === 'fr' ? 'ar' : 'fr');
}

function applyLanguage() {
  const isAr = currentLanguage === 'ar';
  
  // Login page
  const loginTitle = document.getElementById('login-title');
  const emailLabel = document.getElementById('email-label');
  const passwordLabel = document.getElementById('password-label');
  const loginBtn = document.getElementById('login-btn');
  
  if (loginTitle) loginTitle.textContent = isAr ? 'تسجيل الدخول' : 'Connexion';
  if (emailLabel) emailLabel.textContent = isAr ? 'البريد الإلكتروني' : 'Email';
  if (passwordLabel) passwordLabel.textContent = isAr ? 'كلمة المرور' : 'Mot de passe';
  if (loginBtn) loginBtn.textContent = isAr ? 'تسجيل الدخول' : 'Se connecter';

  // Header texts
  const headerRepublic = document.getElementById('header-republic');
  const headerMinistry = document.getElementById('header-ministry');
  const headerCommissionAr = document.getElementById('header-commission-ar');
  const headerCommissionFr = document.getElementById('header-commission-fr');
  
  if (headerRepublic) headerRepublic.textContent = isAr ? 'الجمهورية الجزائرية الديمقراطية الشعبية' : 'République Algérienne Démocratique et Populaire';
  if (headerMinistry) headerMinistry.textContent = isAr ? 'وزارة الرياضة' : 'Ministère des Sports';
  if (headerCommissionAr) headerCommissionAr.textContent = isAr ? 'اللجنة الوطنية للكيوكوشين كاي' : 'اللجنة الوطنية للكيوكوشين كاي';
  if (headerCommissionFr) headerCommissionFr.textContent = isAr ? 'Commission Nationale de Kyokushin Kai' : 'Commission Nationale de Kyokushin Kai';
  
  // Welcome texts
  const welcomeAr = document.getElementById('welcome-ar');
  const welcomeFr = document.getElementById('welcome-fr');
  if (welcomeAr) welcomeAr.style.display = isAr ? 'block' : 'none';
  if (welcomeFr) welcomeFr.style.display = isAr ? 'none' : 'block';

  // Language switch button
  const langSwitch = document.getElementById('lang-switch');
  if (langSwitch) langSwitch.innerHTML = `<i class="ti ti-language"></i> ${isAr ? 'FR' : 'AR'}`;

  // Logout button
  const logoutHeader = document.getElementById('logout-header');
  if (logoutHeader) logoutHeader.innerHTML = `<i class="ti ti-logout"></i> ${isAr ? 'تسجيل الخروج' : 'Déconnexion'}`;

  // Wilayas dropdowns
  fillWilayas('mclub-wilaya');
  fillWilayas('mcomp-wilaya');

  // Modal titles
  const modalClubTitle = document.getElementById('modal-club-title');
  const modalCatTitle = document.getElementById('modal-cat-title');
  const modalCompTitle = document.getElementById('modal-comp-title');
  
  if (modalClubTitle) modalClubTitle.textContent = isAr ? 'نادي جديد' : 'Nouveau club';
  if (modalCatTitle) modalCatTitle.textContent = isAr ? 'فئة جديدة' : 'Nouvelle catégorie';
  if (modalCompTitle) modalCompTitle.textContent = isAr ? 'فعالية جديدة' : 'Nouvel événement';

  // Manual title in registration modal
  const manualTitle = document.getElementById('manual-title');
  if (manualTitle) manualTitle.textContent = isAr ? 'إضافة يدوياً' : 'Ajouter manuellement';

  // Registration modal labels
  const regNameLabel = document.querySelector('#mreg-dynamic-fields div:first-child label');
  const regDobLabel = document.querySelector('#mreg-dynamic-fields div:nth-child(2) label');
  const regWeightLabel = document.querySelector('#mreg-dynamic-fields div:nth-child(3) label');
  const regGenderLabel = document.querySelector('#mreg-dynamic-fields div:nth-child(4) label');
  const regCatLabel = document.querySelector('#mreg-dynamic-fields div:nth-child(5) label');
  
  if (regNameLabel) regNameLabel.textContent = isAr ? 'الاسم الكامل *' : 'Nom complet *';
  if (regDobLabel) regDobLabel.textContent = isAr ? 'تاريخ الميلاد' : 'Date de naissance';
  if (regWeightLabel) regWeightLabel.textContent = isAr ? 'الوزن (كغ)' : 'Poids (kg)';
  if (regGenderLabel) regGenderLabel.textContent = isAr ? 'الجنس' : 'Sexe';
  if (regCatLabel) regCatLabel.textContent = isAr ? 'الفئة' : 'Catégorie';

  // Add button
  const addBtn = document.getElementById('add-btn');
  if (addBtn) addBtn.innerHTML = `<i class="ti ti-plus"></i> ${isAr ? 'إضافة' : 'Ajouter'}`;

  // Confirm button
  const confirmBtn = document.getElementById('confirm-btn');
  if (confirmBtn) confirmBtn.textContent = isAr ? 'تأكيد التسجيل' : 'Confirmer l\'inscription';

  // Cancel buttons in modals
  document.querySelectorAll('.modal-buttons .btn-outline').forEach(btn => {
    const text = btn.textContent.trim();
    if (text === 'Annuler' || text === 'إلغاء') {
      btn.textContent = isAr ? 'إلغاء' : 'Annuler';
    }
  });

  // Save buttons in modals
  document.querySelectorAll('.modal-buttons .btn-primary').forEach(btn => {
    const text = btn.textContent.trim();
    if (text === 'Enregistrer' || text === 'حفظ') {
      btn.textContent = isAr ? 'حفظ' : 'Enregistrer';
    }
  });

  // Info box text
  const infoBox = document.querySelector('.info-box');
  if (infoBox) {
    const link = infoBox.querySelector('a');
    if (link) link.textContent = isAr ? 'تحميل نموذج إكسل' : 'Télécharger le modèle Excel';
  }

  // File drop text
  const fileDrop = document.querySelector('.file-drop');
  if (fileDrop) {
    const div = fileDrop.querySelector('div');
    if (div) div.innerHTML = `<i class="ti ti-upload" style="font-size:20px;display:block;margin-bottom:6px;"></i>${isAr ? 'انقر أو اسحب ملف إكسل (.xlsx)' : 'Cliquez ou glissez-déposez un fichier Excel (.xlsx)'}`;
  }

  // Update sidebar
  if (SESSION) {
    if (SESSION.role === 'admin') {
      renderAdminSidebar();
    } else {
      renderClubSidebar();
    }
  }
}
// ==================== AUTHENTIFICATION AVEC HASH ADMIN ====================
window.login = async function() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-pw').value;
  const errDiv = document.getElementById('login-error');
  errDiv.style.display = 'none';

  // 1. Vérification admin (PRIORITAIRE - avant la table clubs)
  if (email === ADMIN_EMAIL) {
    try {
      const hashedInput = await hashPassword(password);
      
      if (hashedInput === ADMIN_PASSWORD_HASH) {
       
        // ⚠️ FORCER le rôle admin indépendamment de la table
        SESSION = { role: 'admin', userId: 'admin', clubData: null };
        window.saveSession(SESSION);
        await loadCategories();
        enterApp();
        window.renderAdminDash();
        return;
      }
    } catch (err) {
      console.error('Erreur hash admin:', err);
    }
  }

  // 2. Vérification club dans Supabase (uniquement si ce n'est pas l'admin)
  if (!sbClient) {
    errDiv.style.display = 'block';
    errDiv.textContent = t('خطأ في الاتصال بقاعدة البيانات', 'Erreur de connexion à la base de données');
    return;
  }

  try {
    const { data, error } = await sbClient
      .from('clubs')
      .select('*')
      .eq('email', email)
      .eq('password', password);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      // Vérifier si c'est l'admin (par sécurité)
      if (data[0].email === ADMIN_EMAIL) {
        // Si l'admin est dans la table, on le force en admin
        SESSION = { role: 'admin', userId: 'admin', clubData: null };
        window.saveSession(SESSION);
        await loadCategories();
        enterApp();
        window.renderAdminDash();
        return;
      }
      
     
      SESSION = { 
        role: 'club', 
        userId: data[0].id, 
        clubId: data[0].id, 
        clubData: data[0] 
      };
      window.saveSession(SESSION);
      await loadCategories();
      enterApp();
      window.renderClubHome();
      return;
    }
    
    errDiv.style.display = 'block';
    errDiv.textContent = t('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'Email ou mot de passe incorrect');
    
  } catch (err) {
    console.error('Erreur login:', err);
    errDiv.style.display = 'block';
    errDiv.textContent = 'Erreur: ' + err.message;
  }
}

// ==================== ENTER APP ====================
function enterApp() {
  document.getElementById('page-login').style.display = 'none';
  document.getElementById('app-shell').style.display = 'block';
  
  const isAr = currentLanguage === 'ar';
  const userName = document.getElementById('user-name');
  const userRole = document.getElementById('user-role');
  const welcomeAr = document.getElementById('welcome-ar');
  const welcomeFr = document.getElementById('welcome-fr');
  
  
  
  // Vérifier le rôle de SESSION
  if (SESSION && SESSION.role === 'admin') {
    
    if (userName) userName.textContent = t('المسؤول', 'Administrateur');
    if (userRole) userRole.textContent = t('مدير النظام', 'Administrateur');
    if (welcomeAr) welcomeAr.textContent = 'مرحباً في لوحة تحكم المسؤول';
    if (welcomeFr) welcomeFr.textContent = 'Bienvenue dans le tableau de bord administrateur';
    renderAdminSidebar();
  } else if (SESSION && SESSION.role === 'club') {
    
    const clubName = SESSION.clubData?.name || 'Club';
    if (userName) userName.textContent = clubName;
    if (userRole) userRole.textContent = t('نادي', 'Club');
    if (welcomeAr) welcomeAr.textContent = `مرحباً في ${clubName}`;
    if (welcomeFr) welcomeFr.textContent = `Bienvenue au ${clubName}`;
    renderClubSidebar();
  } else {
    
    if (userName) userName.textContent = 'Utilisateur';
    if (userRole) userRole.textContent = '';
    renderClubSidebar();
  }
}

// ==================== LOGOUT ====================
window.logout = function() {
  window.clearSession();
  document.getElementById('page-login').style.display = 'flex';
  document.getElementById('app-shell').style.display = 'none';
}

// ==================== SIDEBAR ====================
// ==================== SIDEBAR ADMIN - Version corrigée ====================
function renderAdminSidebar() {
  const isAr = currentLanguage === 'ar';
  const items = [
    { id: 'sb-dash', icon: 'ti-layout-dashboard', label: isAr ? 'لوحة التحكم' : 'Dashboard', fn: 'window.renderAdminDash()' },
    { id: 'sb-clubs', icon: 'ti-building', label: isAr ? 'الأندية' : 'Clubs', fn: 'window.renderAdminClubs()' },
    { id: 'sb-cats', icon: 'ti-category', label: isAr ? 'الفئات' : 'Catégories', fn: 'window.renderAdminCategories()' },
    { id: 'sb-comps', icon: 'ti-calendar-event', label: isAr ? 'الفعاليات' : 'Événements', fn: 'window.renderAdminComps()' },
    { id: 'sb-parts', icon: 'ti-users', label: isAr ? 'المشاركون' : 'Participants', fn: 'window.renderAdminParticipants()' },
    // ===== NOUVEAU : Bouton Vérification =====
{ id: 'sb-verification', icon: 'ti-search', label: isAr ? '🔍 التحقق' : '🔍 Vérification', fn: 'window.renderVerification()' },
    // ===== NOUVEAUX ITEMS =====
    { id: 'sb-results', icon: 'ti-trophy', label: isAr ? 'النتائج' : '🏆 Résultats', fn: 'window.renderResults()' },
    { id: 'sb-diplomas', icon: 'ti-certificate', label: isAr ? 'الدبلومات' : '📜 Diplômes', fn: 'window.renderDiplomas()' },
    { id: 'sb-reports', icon: 'ti-file-description', label: isAr ? 'التقارير' : '📊 Rapports', fn: 'window.renderReports()' },
    { id: 'sb-rankings', icon: 'ti-medal', label: isAr ? 'ترتيب الأندية' : '🏅 Classement', fn: 'window.renderRankings()' }
  ];
  document.getElementById('sidebar').innerHTML = items.map(i =>
    `<button id="${i.id}" class="sidebar-btn" onclick="${i.fn};setSidebarActive('${i.id}')"><i class="ti ${i.icon}"></i> ${i.label}</button>`
  ).join('');
}

function renderClubSidebar() {
  const isAr = currentLanguage === 'ar';
  document.getElementById('sidebar').innerHTML = `
    <button id="sb-comps2" class="sidebar-btn" onclick="window.renderClubHome();setSidebarActive('sb-comps2')"><i class="ti ti-calendar-event"></i> ${isAr ? 'الفعاليات' : 'Événements'}</button>
    <button id="sb-myregs" class="sidebar-btn" onclick="window.renderClubMyRegs();setSidebarActive('sb-myregs')"><i class="ti ti-clipboard-list"></i> ${isAr ? 'تسجيلاتي' : 'Mes inscriptions'}</button>
  `;
}

// ==================== ADMIN DASHBOARD ====================
window.renderAdminDash = async function() {
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
window.renderAdminClubs = async function() {
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
          <button class="btn-outline btn-sm" onclick="window.editClub(${c.id})"><i class="ti ti-edit"></i></button>
          <button class="btn-red btn-sm" onclick="window.deleteClub(${c.id})"><i class="ti ti-trash"></i></button>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="7">${isAr ? 'لا توجد أندية' : 'Aucun club'}</td></tr>`;

    setMain(`
      <div class="section-title">${isAr ? 'إدارة الأندية' : 'Gestion des clubs'}</div>
      <div class="table-toolbar"><button class="btn-primary btn-sm" onclick="window.openNewClub()"><i class="ti ti-plus"></i> ${isAr ? 'نادي جديد' : 'Nouveau club'}</button></div>
      <div class="card"><div class="table-wrap"><table><thead><tr><th>${isAr ? 'الاسم' : 'Nom'}</th><th>Code</th><th>Wilaya</th><th>${isAr ? 'المسؤول' : 'Responsable'}</th><th>Email</th><th>${isAr ? 'الهاتف' : 'Téléphone'}</th><th>${isAr ? 'إجراءات' : 'Actions'}</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    `);
  } catch (err) {
    console.error('Erreur renderAdminClubs:', err);
    setMain('<div class="error-msg">Erreur de chargement des clubs</div>');
  }
}

window.openNewClub = function() {
  fillWilayas('mclub-wilaya');
  document.getElementById('mclub-id').value = '';
  ['mclub-email', 'mclub-password', 'mclub-name', 'mclub-code', 'mclub-responsable', 'mclub-phone'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('modal-club-title').textContent = t('نادي جديد', 'Nouveau club');
  openModal('modal-club');
}

window.editClub = async function(id) {
  fillWilayas('mclub-wilaya');
  try {
    const { data: c, error } = await sbClient.from('clubs').select('*').eq('id', id).single();
    if (error) throw error;
    if (c) {
      document.getElementById('mclub-id').value = c.id;
      document.getElementById('mclub-email').value = c.email;
      document.getElementById('mclub-password').value = c.password;
      document.getElementById('mclub-name').value = c.name;
      document.getElementById('mclub-code').value = c.club_code || '';
      document.getElementById('mclub-wilaya').value = c.wilaya || '';
      document.getElementById('mclub-responsable').value = c.responsable || '';
      document.getElementById('mclub-phone').value = c.phone || '';
      document.getElementById('modal-club-title').textContent = t('تعديل النادي', 'Modifier le club');
      openModal('modal-club');
    }
  } catch (err) {
    console.error('Erreur editClub:', err);
    showFlash('Erreur: ' + err.message, 'err');
  }
}

// ==================== SAVE CLUB ====================
window.saveClub = async function() {
  const id = document.getElementById('mclub-id').value;
  const data = {
    email: document.getElementById('mclub-email').value.trim(),
    password: document.getElementById('mclub-password').value,
    name: document.getElementById('mclub-name').value.trim(),
    club_code: document.getElementById('mclub-code').value.trim(),
    wilaya: document.getElementById('mclub-wilaya').value,
    responsable: document.getElementById('mclub-responsable').value.trim(),
    phone: document.getElementById('mclub-phone').value.trim()
  };
  
 
  
  if (!data.email || !data.password || !data.name) {
    showFlash(t('الحقول مطلوبة', 'Champs obligatoires'), 'err');
    return;
  }

  try {
    if (id) {
      // Modification
      const { error } = await sbClient
        .from('clubs')
        .update(data)
        .eq('id', parseInt(id));
      
      if (error) throw error;
      showFlash(t('تم تعديل النادي', 'Club modifié'));
    } else {
      // Création - vérifier si l'email existe déjà
      const { data: existing, error: checkError } = await sbClient
        .from('clubs')
        .select('id')
        .eq('email', data.email)
        .single();
      
      if (existing) {
        showFlash(t('هذا البريد الإلكتروني مستخدم بالفعل', 'Cet email est déjà utilisé'), 'err');
        return;
      }
      
      const { error } = await sbClient
        .from('clubs')
        .insert(data);
      
      if (error) throw error;
      showFlash(t('تم إنشاء النادي', 'Club créé'));
    }
    
    closeModal('modal-club');
    window.renderAdminClubs();
    
  } catch (err) {
    console.error('Erreur saveClub:', err);
    let errorMsg = err.message;
    if (err.message.includes('duplicate key')) {
      errorMsg = t('هذا البريد الإلكتروني مستخدم بالفعل', 'Cet email est déjà utilisé');
    }
    showFlash('Erreur: ' + errorMsg, 'err');
  }
}

// ==================== DELETE CLUB ====================
window.deleteClub = async function(id) {
  if (!confirm(t('هل تريد حذف هذا النادي؟', 'Supprimer ce club ?'))) {
    return;
  }
  
  try {
    const { error } = await sbClient
      .from('clubs')
      .delete()
      .eq('id', parseInt(id));
    
    if (error) throw error;
    
    showFlash(t('تم حذف النادي', 'Club supprimé'));
    window.renderAdminClubs();
    
  } catch (err) {
    console.error('Erreur deleteClub:', err);
    showFlash('Erreur: ' + err.message, 'err');
  }
}

// ==================== ADMIN CATEGORIES (AVEC SOUS-CATÉGORIES) ====================
window.renderAdminCategories = async function() {
  setSidebarActive('sb-cats');
  await loadCategories();
  const isAr = currentLanguage === 'ar';
  
  // Trier les catégories: parents puis enfants
  const parents = CATEGORIES.filter(c => !c.parent_id);
  const children = CATEGORIES.filter(c => c.parent_id);
  
  const rows = parents.map((c, i) => {
    const subCats = children.filter(child => child.parent_id === c.id);
    const subRows = subCats.map((sub, idx) => `
      <tr style="background: #faf8f5;">
        <td>${i + 1}.${idx + 1}</td>
        <td style="padding-right: 30px;">↳ ${sub.name_fr}</td>
        <td>${sub.poids_fr || sub.name_fr}</td>
        <td>${sub.gender}</td>
        <td>${sub.name_ar || ''}</td>
        <td>${sub.poids_ar || ''}</td>
        <td>${sub.gender_ar || ''}</td>
        <td>${sub.annee_min}-${sub.annee_max}</td>
        <td>${sub.poids_min}-${sub.poids_max} kg</td>
        <td>
          <button class="btn-outline btn-sm" onclick="window.editCategory(${sub.id})"><i class="ti ti-edit"></i></button>
          <button class="btn-red btn-sm" onclick="window.deleteCategory(${sub.id})"><i class="ti ti-trash"></i></button>
        </td>
      </tr>
    `).join('');
    
    return `
      <tr style="background: #f0ede8; font-weight: bold;">
        <td>${i + 1}</td>
        <td>${c.name_fr}</td>
        <td>${c.poids_fr || c.name_fr}</td>
        <td>${c.gender}</td>
        <td>${c.name_ar || ''}</td>
        <td>${c.poids_ar || ''}</td>
        <td>${c.gender_ar || ''}</td>
        <td>${c.annee_min}-${c.annee_max}</td>
        <td>${c.poids_min}-${c.poids_max} kg</td>
        <td>
          <button class="btn-outline btn-sm" onclick="window.editCategory(${c.id})"><i class="ti ti-edit"></i></button>
          <button class="btn-red btn-sm" onclick="window.deleteCategory(${c.id})"><i class="ti ti-trash"></i></button>
        </td>
      </tr>
      ${subRows}
    `;
  }).join('') || `<tr><td colspan="10">${isAr ? 'لا توجد فئات' : 'Aucune catégorie'}</td></tr>`;

  setMain(`
    <div class="section-title">${isAr ? 'الفئات' : 'Catégories'}</div>
    <div class="table-toolbar">
      <button class="btn-primary btn-sm" onclick="window.openNewCategory()"><i class="ti ti-plus"></i> ${isAr ? 'فئة رئيسية جديدة' : 'Nouvelle catégorie principale'}</button>
      <button class="btn-primary btn-sm" onclick="window.openNewSubCategory()"><i class="ti ti-plus"></i> ${isAr ? 'فئة فرعية جديدة' : 'Nouvelle sous-catégorie'}</button>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>${isAr ? 'التسمية' : 'Désignation'}</th>
              <th>${isAr ? 'الوزن' : 'Poids'}</th>
              <th>${isAr ? 'الجنس' : 'Genre'}</th>
              <th>${isAr ? 'التسمية (عربي)' : 'AR'}</th>
              <th>${isAr ? 'الوزن (عربي)' : 'Poids AR'}</th>
              <th>${isAr ? 'الجنس (عربي)' : 'Genre AR'}</th>
              <th>${isAr ? 'السنة' : 'Année'}</th>
              <th>${isAr ? 'الوزن' : 'Poids'}</th>
              <th>${isAr ? 'إجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `);
}

// ==================== OUVRIR UNE NOUVELLE CATÉGORIE PRINCIPALE ====================
window.openNewCategory = function() {
  document.getElementById('mcat-id').value = '';
  document.getElementById('mcat-parent-id').value = '';
  ['mcat-nameFr', 'mcat-poidsFr', 'mcat-nameAr', 'mcat-poidsAr', 'mcat-anneeMin', 'mcat-anneeMax', 'mcat-poidsMin', 'mcat-poidsMax'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('mcat-gender').value = 'Hommes';
  document.getElementById('mcat-genderAr').value = 'ذكور';
  
  // Remplir la liste des parents
  fillParentSelect();
  document.getElementById('mcat-parent-select').value = '';
  
  document.getElementById('modal-cat-title').textContent = t('فئة رئيسية جديدة', 'Nouvelle catégorie principale');
  openModal('modal-category');
}

// ==================== OUVRIR UNE NOUVELLE SOUS-CATÉGORIE ====================
window.openNewSubCategory = function() {
  document.getElementById('mcat-id').value = '';
  document.getElementById('mcat-parent-id').value = '';
  ['mcat-nameFr', 'mcat-poidsFr', 'mcat-nameAr', 'mcat-poidsAr', 'mcat-anneeMin', 'mcat-anneeMax', 'mcat-poidsMin', 'mcat-poidsMax'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('mcat-gender').value = 'Hommes';
  document.getElementById('mcat-genderAr').value = 'ذكور';
  
  // Remplir la liste des parents
  fillParentSelect();
  
  document.getElementById('modal-cat-title').textContent = t('فئة فرعية جديدة', 'Nouvelle sous-catégorie');
  openModal('modal-category');
}

// ==================== REMPLIR LA LISTE DES PARENTS ====================
function fillParentSelect() {
  const select = document.getElementById('mcat-parent-select');
  select.innerHTML = '<option value="">Aucune (catégorie principale)</option>';
  
  const parents = CATEGORIES.filter(c => !c.parent_id);
  parents.forEach(p => {
    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = `${p.name_fr} (${p.gender})`;
    select.appendChild(option);
  });
}

// ==================== EDIT CATEGORY ====================
window.editCategory = async function(id) {
  const c = CATEGORIES.find(x => x.id === id);
  if (c) {
    document.getElementById('mcat-id').value = c.id;
    document.getElementById('mcat-nameFr').value = c.name_fr;
    document.getElementById('mcat-poidsFr').value = c.poids_fr || '';
    document.getElementById('mcat-nameAr').value = c.name_ar || '';
    document.getElementById('mcat-poidsAr').value = c.poids_ar || '';
    document.getElementById('mcat-gender').value = c.gender;
    document.getElementById('mcat-genderAr').value = c.gender_ar || 'ذكور';
    document.getElementById('mcat-anneeMin').value = c.annee_min;
    document.getElementById('mcat-anneeMax').value = c.annee_max;
    document.getElementById('mcat-poidsMin').value = c.poids_min;
    document.getElementById('mcat-poidsMax').value = c.poids_max;
    
    // Remplir la liste des parents et sélectionner
    fillParentSelect();
    document.getElementById('mcat-parent-select').value = c.parent_id || '';
    document.getElementById('mcat-parent-id').value = c.parent_id || '';
    
    document.getElementById('modal-cat-title').textContent = t('تعديل الفئة', 'Modifier la catégorie');
    openModal('modal-category');
  }
}

// ==================== SAVE CATEGORY ====================
window.saveCategory = async function() {
  const id = document.getElementById('mcat-id').value;
  const parentId = document.getElementById('mcat-parent-select').value;
  
  const data = {
    name_fr: document.getElementById('mcat-nameFr').value,
    poids_fr: document.getElementById('mcat-poidsFr').value,
    name_ar: document.getElementById('mcat-nameAr').value,
    poids_ar: document.getElementById('mcat-poidsAr').value,
    gender: document.getElementById('mcat-gender').value,
    gender_ar: document.getElementById('mcat-genderAr').value,
    annee_min: parseInt(document.getElementById('mcat-anneeMin').value),
    annee_max: parseInt(document.getElementById('mcat-anneeMax').value),
    poids_min: parseFloat(document.getElementById('mcat-poidsMin').value) || 0,
    poids_max: parseFloat(document.getElementById('mcat-poidsMax').value),
    parent_id: parentId ? parseInt(parentId) : null
  };
  
  // Validation
  if (!data.name_fr || !data.poids_max) {
    showFlash(t('الاسم والوزن الأقصى مطلوبان', 'Nom et poids max requis'), 'err');
    return;
  }
  
  // Pour les sous-catégories, vérifier que poids_min < poids_max
  if (data.parent_id && data.poids_min >= data.poids_max) {
    showFlash(t('الوزن الأدنى يجب أن يكون أقل من الوزن الأقصى', 'Le poids min doit être inférieur au poids max'), 'err');
    return;
  }
  
  try {
    if (id) {
      await sbClient.from('categories').update(data).eq('id', parseInt(id));
      showFlash(t('تم تعديل الفئة', 'Catégorie modifiée'));
    } else {
      await sbClient.from('categories').insert(data);
      showFlash(t('تم إنشاء الفئة', 'Catégorie créée'));
    }
    closeModal('modal-category');
    await loadCategories();
    window.renderAdminCategories();
  } catch (err) {
    console.error('Erreur saveCategory:', err);
    showFlash('Erreur: ' + err.message, 'err');
  }
}

// ==================== DELETE CATEGORY ====================
window.deleteCategory = async function(id) {
  if (confirm(t('هل تريد حذف هذه الفئة؟', 'Supprimer cette catégorie ?'))) {
    try {
      // Vérifier si la catégorie a des sous-catégories
      const hasChildren = CATEGORIES.some(c => c.parent_id === id);
      if (hasChildren) {
        if (!confirm(t('هذه الفئة تحتوي على فئات فرعية. سيتم حذفها جميعاً. هل تريد المتابعة؟', 'Cette catégorie contient des sous-catégories. Elles seront toutes supprimées. Continuer ?'))) {
          return;
        }
      }
      
      await sbClient.from('categories').delete().eq('id', parseInt(id));
      await loadCategories();
      window.renderAdminCategories();
      showFlash(t('تم حذف الفئة', 'Catégorie supprimée'));
    } catch (err) {
      console.error('Erreur deleteCategory:', err);
      showFlash('Erreur: ' + err.message, 'err');
    }
  }
}

// ==================== ADMIN COMPETITIONS ====================
window.renderAdminComps = async function() {
  setSidebarActive('sb-comps');
  await loadCategories();
  const isAr = currentLanguage === 'ar';
  
  try {
    const { data: comps, error } = await sbClient.from('competitions').select('*').order('id', { ascending: false });
    if (error) throw error;
    
    if (!comps || comps.length === 0) {
      setMain(`
        <div class="section-title">${isAr ? 'الفعاليات' : 'Événements'}</div>
        <div class="table-toolbar"><button class="btn-primary btn-sm" onclick="window.openNewComp()"><i class="ti ti-plus"></i> ${isAr ? 'فعالية جديدة' : 'Nouvel événement'}</button></div>
        <div class="card empty-card">${isAr ? 'لا توجد فعاليات' : 'Aucun événement'}</div>
      `);
      return;
    }
    
    const cards = comps.map(c => {
      const catIds = c.category_ids || [];
      const catNames = catIds.map(cid => {
        const cat = CATEGORIES.find(cat => cat.id === cid);
        return cat ? cat.name_fr : '?';
      });
      
      const past = isPast(c.deadline);
      
      return `
        <div class="card comp-card ${past ? 'closed' : ''}">
          <div class="comp-header">
            <div>
              <div class="comp-name-ar">${c.name}</div>
              <div class="comp-name-en">${c.name_en}</div>
              <div class="comp-details">
                <span><i class="ti ti-map-pin"></i> ${c.wilaya || '—'}</span>
                <span><i class="ti ti-calendar"></i> ${fmtDate(c.date_start)} → ${fmtDate(c.date_end)}</span>
                <span><i class="ti ti-clock-hour-4"></i> ${isAr ? 'آخر موعد' : 'Délai'}: ${fmtDate(c.deadline)}</span>
              </div>
              <div class="comp-cats">${catNames.map(name => `<span class="cat-tag">${name}</span>`).join('')}</div>
            </div>
            <div class="comp-actions">
              <button class="btn-outline btn-sm" onclick="window.openEditComp(${c.id})"><i class="ti ti-edit"></i> ${isAr ? 'تعديل' : 'Modifier'}</button>
              <button class="btn-red btn-sm" onclick="window.deleteCompWithCheck(${c.id})"><i class="ti ti-trash"></i></button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    setMain(`
      <div class="section-title">${isAr ? 'الفعاليات' : 'Événements'}</div>
      <div class="table-toolbar"><button class="btn-primary btn-sm" onclick="window.openNewComp()"><i class="ti ti-plus"></i> ${isAr ? 'فعالية جديدة' : 'Nouvel événement'}</button></div>
      ${cards}
    `);
  } catch (err) {
    console.error('Erreur renderAdminComps:', err);
    setMain('<div class="error-msg">Erreur de chargement des événements</div>');
  }
}

window.openNewComp = function() {
  fillWilayas('mcomp-wilaya');
  document.getElementById('mcomp-id').value = '';
  ['mcomp-name', 'mcomp-nameEn', 'mcomp-dateStart', 'mcomp-dateEnd', 'mcomp-deadline'].forEach(id => document.getElementById(id).value = '');
  
  const catSel = document.getElementById('mcomp-cats');
  catSel.innerHTML = CATEGORIES.map(c => 
    `<option value="${c.id}">${c.name_fr} ${c.poids_fr || ''} (${c.gender})</option>`
  ).join('');
  Array.from(catSel.options).forEach(opt => opt.selected = true);
  
  document.getElementById('modal-comp-title').textContent = t('فعالية جديدة', 'Nouvel événement');
  openModal('modal-comp');
}

window.openEditComp = async function(id) {
  fillWilayas('mcomp-wilaya');
  try {
    const { data: c, error } = await sbClient.from('competitions').select('*').eq('id', parseInt(id)).single();
    if (error) throw error;
    
    if (c) {
      document.getElementById('mcomp-id').value = c.id;
      document.getElementById('mcomp-name').value = c.name;
      document.getElementById('mcomp-nameEn').value = c.name_en;
      document.getElementById('mcomp-wilaya').value = c.wilaya || '';
      document.getElementById('mcomp-dateStart').value = fmtDateInput(c.date_start);
      document.getElementById('mcomp-dateEnd').value = fmtDateInput(c.date_end);
      document.getElementById('mcomp-deadline').value = fmtDateInput(c.deadline);
      
      const selectedCats = c.category_ids || [];
      const catSel = document.getElementById('mcomp-cats');
      catSel.innerHTML = CATEGORIES.map(cat => 
        `<option value="${cat.id}" ${selectedCats.includes(cat.id) ? 'selected' : ''}>${cat.name_fr} ${cat.poids_fr || ''} (${cat.gender})</option>`
      ).join('');
      
      document.getElementById('modal-comp-title').textContent = t('تعديل الفعالية', 'Modifier l\'événement');
      openModal('modal-comp');
    }
  } catch (err) {
    console.error('Erreur openEditComp:', err);
    showFlash('Erreur: ' + err.message, 'err');
  }
}

window.selectEventType = function(type) {
  document.getElementById('mcomp-type').value = type;
  document.querySelectorAll('.evt-type-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.type === type);
  });
}

window.saveCompetition = async function() {
  const id = document.getElementById('mcomp-id').value;
  const catSelect = document.getElementById('mcomp-cats');
  const category_ids = Array.from(catSelect.selectedOptions).map(opt => parseInt(opt.value));
  
  const data = {
    name: document.getElementById('mcomp-name').value,
    name_en: document.getElementById('mcomp-nameEn').value,
    wilaya: document.getElementById('mcomp-wilaya').value || null,
    date_start: document.getElementById('mcomp-dateStart').value || null,
    date_end: document.getElementById('mcomp-dateEnd').value || null,
    deadline: document.getElementById('mcomp-deadline').value,
    category_ids: category_ids || []
  };
  
  if (!data.name || !data.name_en || !data.deadline) {
    showFlash(t('الحقول مطلوبة', 'Champs obligatoires'), 'err');
    return;
  }
  
  if (!data.category_ids || data.category_ids.length === 0) {
    showFlash(t('اختر فئة على الأقل', 'Sélectionnez au moins une catégorie'), 'err');
    return;
  }
  
  try {
    if (id) {
      await sbClient.from('competitions').update(data).eq('id', parseInt(id));
      showFlash(t('تم تعديل الفعالية', 'Événement modifié'));
    } else {
      await sbClient.from('competitions').insert(data);
      showFlash(t('تم إنشاء الفعالية', 'Événement créé'));
    }
    closeModal('modal-comp');
    window.renderAdminComps();
  } catch (err) {
    console.error('Erreur saveCompetition:', err);
    showFlash('Erreur: ' + err.message, 'err');
  }
}

// ==================== SUPPRIMER UN ÉVÉNEMENT (AVEC CASCADE) ====================
window.checkCompDependencies = async function(id) {
  try {
    const { data: registrations, count, error } = await sbClient
      .from('registrations')
      .select('id', { count: 'exact' })
      .eq('competition_id', parseInt(id));
    
    if (error) throw error;
    
    return {
      hasRegistrations: count > 0,
      registrationsCount: count || 0
    };
  } catch (err) {
    console.error('Erreur checkCompDependencies:', err);
    return { hasRegistrations: false, registrationsCount: 0 };
  }
}

window.deleteCompWithCheck = async function(id) {
  const isAr = currentLanguage === 'ar';
  
  const deps = await window.checkCompDependencies(id);
  
  let message = isAr ? 'هل تريد حذف هذه الفعالية؟' : 'Voulez-vous supprimer cet événement ?';
  
  if (deps.hasRegistrations) {
    message = isAr 
      ? `هذه الفعالية تحتوي على ${deps.registrationsCount} تسجيل. سيتم حذف جميع التسجيلات المرتبطة. هل تريد المتابعة؟`
      : `Cet événement contient ${deps.registrationsCount} inscription(s). Toutes les inscriptions associées seront supprimées. Voulez-vous continuer ?`;
  }
  
  if (!confirm(message)) {
    return;
  }
  
  try {
    const { error: regError } = await sbClient
      .from('registrations')
      .delete()
      .eq('competition_id', parseInt(id));
    
    if (regError) {
      console.error('Erreur suppression inscriptions:', regError);
    }
    
    const { error: compError } = await sbClient
      .from('competitions')
      .delete()
      .eq('id', parseInt(id));
    
    if (compError) throw compError;
    
    showFlash(
      deps.hasRegistrations 
        ? t(`تم حذف الفعالية و ${deps.registrationsCount} تسجيل`, `Événement et ${deps.registrationsCount} inscription(s) supprimés`)
        : t('تم حذف الفعالية', 'Événement supprimé')
    );
    
    window.renderAdminComps();
    
    if (SESSION && SESSION.role === 'club') {
      window.renderClubHome();
    }
  } catch (err) {
    console.error('Erreur deleteComp:', err);
    showFlash('Erreur: ' + err.message, 'err');
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

// ==================== EXPORT EXCEL ADMIN ====================
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
      ['الرقم', 'الاسم واللقب', 'تاريخ الميلاد', 'الوزن (كغ)', 'الجنس', 'ID_Club', 'Club', 'Wilaya'], 
      ...participantsData
    ]);
    
    sheet1['!cols'] = [
      { wch: 10 }, { wch: 25 }, { wch: 18 }, { wch: 15 },
      { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 15 }
    ];
    
    const clubsData = clubs?.map(c => [c.name, c.club_code || '']) || [];
    const sheet2 = XLSX.utils.aoa_to_sheet([['Club', 'ID'], ...clubsData]);
    sheet2['!cols'] = [{ wch: 25 }, { wch: 12 }];
    
    const catsData = CATEGORIES.map((c, i) => [
      i + 1, c.name_fr, c.poids_fr || c.name_fr, c.gender,
      c.name_ar || '', c.poids_ar || '', c.gender_ar || '',
      c.annee_min, c.annee_max, c.poids_min, c.poids_max, 'OUI'
    ]);
    const sheet3 = XLSX.utils.aoa_to_sheet([
      ['Numero', 'Designation', 'PoidsCategorie', 'Genre', 'DesignationAR', 'PoidsCategorieAR', 'GenreAR', 'AnneeMin', 'AnneeMax', 'PoidsMin', 'PoidsMax', 'Regenerate'], 
      ...catsData
    ]);

    const remarques = [
      ['ملاحظات هامة:'],
      ['1. الرقم: رقم تسلسلي تلقائي'],
      ['2. الاسم واللقب: الاسم الكامل للمشارك'],
      ['3. تاريخ الميلاد: بصيغة DD/MM/YYYY'],
      ['4. الوزن: بالكيلوغرام'],
      ['5. الجنس: "ذكور" أو "إناث"'],
      ['6. ID_Club: رمز النادي'],
      ['7. Club: اسم النادي'],
      ['8. Wilaya: ولاية النادي'],
      [''],
      ['Ce fichier contient les données exportées depuis la plateforme']
    ];
    const sheet4 = XLSX.utils.aoa_to_sheet(remarques);
    sheet4['!cols'] = [{ wch: 50 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet1, 'Participants');
    XLSX.utils.book_append_sheet(wb, sheet2, 'Clubs');
    XLSX.utils.book_append_sheet(wb, sheet3, 'Categories');
    XLSX.utils.book_append_sheet(wb, sheet4, 'Remarques');
    
    XLSX.writeFile(wb, `Participants_${comp?.name_en?.replace(/[^a-z0-9]/gi, '_') || 'evenement'}.xlsx`);
    showFlash(t('تم التصدير', 'Export terminé'));
  } catch (err) {
    console.error('Erreur export:', err);
    showFlash('Erreur: ' + err.message, 'err');
  }
}

// ==================== CLUB FUNCTIONS ====================
window.renderClubHome = async function() {
  setSidebarActive('sb-comps2');
  await loadCategories();
  const isAr = currentLanguage === 'ar';
  
  try {
    const { data: comps, error } = await sbClient.from('competitions').select('*').order('id', { ascending: false });
    if (error) throw error;
    
    const { data: myRegs } = await sbClient.from('registrations').select('*').eq('club_id', SESSION.clubId);

    if (!comps || comps.length === 0) {
      setMain(`<div class="section-title">${isAr ? 'الفعاليات المتاحة' : 'Événements disponibles'}</div><div class="card empty-card">${isAr ? 'لا توجد فعاليات' : 'Aucun événement'}</div>`);
      return;
    }

    const cards = comps.map(comp => {
      const past = isPast(comp.deadline);
      const reg = myRegs?.find(r => r.competition_id === comp.id);
      const catIds = comp.category_ids || [];
      const catNames = catIds.map(cid => {
        const cat = CATEGORIES.find(c => c.id === cid);
        return cat ? cat.name_fr : '?';
      });
      
      return `
        <div class="card comp-card ${past ? 'closed' : ''} ${reg ? 'registered' : ''}">
          <div class="comp-header">
            <div>
              <div class="comp-name-ar">${comp.name}</div>
              <div class="comp-name-en">${comp.name_en}</div>
              <div class="comp-details">
                <span><i class="ti ti-map-pin"></i> ${comp.wilaya || '—'}</span>
                <span><i class="ti ti-calendar"></i> ${fmtDate(comp.date_start)}</span>
                <span><i class="ti ti-clock-hour-4"></i> ${isAr ? 'آخر موعد' : 'Délai'}: ${fmtDate(comp.deadline)}</span>
              </div>
              <div class="comp-cats">${catNames.map(name => `<span class="cat-tag">${name}</span>`).join('')}</div>
            </div>
            <div class="comp-actions">
              ${!past && !reg ? `<button class="btn-primary btn-sm" onclick="window.openRegisterModal(${comp.id})"><i class="ti ti-user-plus"></i> ${isAr ? 'تسجيل' : 'S\'inscrire'}</button>` : ''}
              ${!past && reg ? `<span class="badge badge-green"><i class="ti ti-check"></i> ${isAr ? 'مسجل' : 'Inscrit'} (${reg.participants?.length || 0})</span> <button class="btn-outline btn-sm" onclick="window.openRegisterModal(${comp.id})"><i class="ti ti-edit"></i> ${isAr ? 'تعديل' : 'Modifier'}</button>` : ''}
              ${past ? `<span class="badge badge-red">${isAr ? 'مغلق' : 'Clôturé'}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    setMain(`<div class="section-title">${isAr ? 'الفعاليات المتاحة' : 'Événements disponibles'}</div>${cards}`);
  } catch (err) {
    console.error('Erreur renderClubHome:', err);
    setMain('<div class="error-msg">Erreur de chargement</div>');
  }
}

// ==================== RENDER CLUB MY REGS ====================
// ==================== RENDER CLUB MY REGS ====================
window.renderClubMyRegs = async function() {
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
      const participants = reg.participants || [];
      
      const rows = participants.map((p, idx) => {
        // Trouver le nom d'affichage de la catégorie
        let categoryDisplay = p.category || '—';
        if (p.category_id) {
          const cat = CATEGORIES.find(c => c.id === p.category_id);
          if (cat && cat.parent_id) {
            const parent = CATEGORIES.find(p => p.id === cat.parent_id);
            if (parent) {
              categoryDisplay = `${parent.name_fr} - ${cat.poids_fr || cat.name_fr}`;
            }
          } else if (cat) {
            categoryDisplay = cat.name_fr;
          }
        }
        
        return `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${p.name}</strong></td>
          <td>${fmtDate(p.dob)}</td>
          <td>${p.weight ? p.weight + ' kg' : '—'}</td>
          <td>${p.gender === 'ذكور' ? (isAr ? 'ذكر' : 'Homme') : (isAr ? 'أنثى' : 'Femme')}</td>
          <td>${categoryDisplay}</td>
          <td>
            <button class="btn-outline btn-sm" onclick="window.editParticipant(${reg.id}, ${idx})" style="margin-right: 4px;">
              <i class="ti ti-edit"></i> ${isAr ? 'تعديل' : 'Modifier'}
            </button>
            <button class="btn-red btn-sm" onclick="window.deleteParticipant(${reg.id}, ${idx})">
              <i class="ti ti-trash"></i> ${isAr ? 'حذف' : 'Supprimer'}
            </button>
          </td>
        </tr>
      `}).join('');

      const noData = `<tr><td colspan="7" style="text-align:center; color: var(--ink-500);">${isAr ? 'لا توجد بيانات' : 'Aucune donnée'}</td></tr>`;
      
      html += `
        <div class="card" style="margin-bottom:20px; overflow:hidden; border-top: 3px solid var(--green-700);">
          <div style="background: linear-gradient(135deg, var(--green-800), var(--green-700)); padding: 16px 22px; color: white; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-family: var(--font-ar); font-size: 17px; font-weight: 700;">${comp?.name || '—'}</div>
              <div style="font-size: 12px; opacity: 0.8; font-family: var(--font-fr); letter-spacing: 1px; text-transform: uppercase;">${comp?.name_en || '—'}</div>
              <div style="font-size: 11px; opacity: 0.6; margin-top: 4px;">
                <i class="ti ti-calendar"></i> ${fmtDate(comp?.date_start)} 
                <i class="ti ti-map-pin" style="margin-left: 12px;"></i> ${comp?.wilaya || '—'}
              </div>
            </div>
            <div>
              <span class="badge badge-green" style="background: rgba(255,255,255,0.2); color: white; font-size: 13px; padding: 6px 14px;">
                <i class="ti ti-users"></i> ${participants.length} ${isAr ? 'مشارك' : 'participants'}
              </span>
            </div>
          </div>
          <div style="padding: 18px 20px; background: var(--paper-50);">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style="width: 40px;">#</th>
                    <th>${isAr ? 'الاسم' : 'Nom'}</th>
                    <th>${isAr ? 'الميلاد' : 'Naissance'}</th>
                    <th>${isAr ? 'الوزن' : 'Poids'}</th>
                    <th>${isAr ? 'الجنس' : 'Sexe'}</th>
                    <th>${isAr ? 'الفئة' : 'Catégorie'}</th>
                    <th style="min-width: 200px;">${isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>${rows || noData}</tbody>
              </table>
            </div>
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

// ==================== MODIFIER UN PARTICIPANT ====================
window.editParticipant = function(registrationId, participantIndex) {
  const isAr = currentLanguage === 'ar';
  
  sbClient.from('registrations').select('*').eq('id', registrationId).single()
    .then(({ data: reg }) => {
      if (!reg) {
        showFlash(isAr ? 'لم يتم العثور على التسجيل' : 'Inscription non trouvée', 'err');
        return;
      }
      
      const participant = reg.participants[participantIndex];
      if (!participant) {
        showFlash(isAr ? 'لم يتم العثور على المشارك' : 'Participant non trouvé', 'err');
        return;
      }
      
      const existingModal = document.getElementById('edit-participant-modal');
      if (existingModal) existingModal.remove();
      
      const modalHtml = `
        <div id="edit-participant-modal" class="modal open" style="display:flex; z-index:1001;">
          <div class="modal-content" style="max-width: 480px;">
            <div class="modal-header">
              <h3>${isAr ? 'تعديل بيانات المشارك' : 'Modifier le participant'}</h3>
              <button class="modal-close" onclick="window.closeEditModal()">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-grid">
                <div>
                  <label>${isAr ? 'الاسم الكامل' : 'Nom complet'} *</label>
                  <input type="text" id="edit-pname" value="${participant.name}">
                </div>
                <div>
                  <label>${isAr ? 'تاريخ الميلاد' : 'Date de naissance'}</label>
                  <input type="date" id="edit-pdob" value="${fmtDateInput(participant.dob)}">
                </div>
                <div>
                  <label>${isAr ? 'الوزن (كغ)' : 'Poids (kg)'}</label>
                  <input type="number" step="0.1" id="edit-pweight" value="${participant.weight || ''}">
                </div>
                <div>
                  <label>${isAr ? 'الجنس' : 'Sexe'}</label>
                  <select id="edit-pgender">
                    <option value="ذكور" ${participant.gender === 'ذكور' ? 'selected' : ''}>${isAr ? 'ذكر' : 'Homme'}</option>
                    <option value="إناث" ${participant.gender === 'إناث' ? 'selected' : ''}>${isAr ? 'أنثى' : 'Femme'}</option>
                  </select>
                </div>
              </div>
              <div class="modal-buttons">
                <button class="btn-primary" onclick="window.saveEditedParticipant(${registrationId}, ${participantIndex})">
                  <i class="ti ti-check"></i> ${isAr ? 'حفظ التغييرات' : 'Enregistrer'}
                </button>
                <button class="btn-outline" onclick="window.closeEditModal()">
                  ${isAr ? 'إلغاء' : 'Annuler'}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = modalHtml;
      document.body.appendChild(tempDiv.firstElementChild);
      
      const modal = document.getElementById('edit-participant-modal');
      modal.addEventListener('click', function(e) {
        if (e.target === this) {
          window.closeEditModal();
        }
      });
    })
    .catch(err => {
      console.error('Erreur editParticipant:', err);
      showFlash('Erreur: ' + err.message, 'err');
    });
}

// ==================== FERMER LE MODAL D'ÉDITION ====================
window.closeEditModal = function() {
  const modal = document.getElementById('edit-participant-modal');
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = 'none';
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 300);
  }
}

// ===== SAUVEGARDER LE PARTICIPANT MODIFIÉ =====
window.saveEditedParticipant = async function() {
  const isAr = currentLanguage === 'ar';
  
  const registrationIdEl = document.getElementById('edit-registration-id');
  const participantIndexEl = document.getElementById('edit-participant-index');
  const nameEl = document.getElementById('edit-participant-name');
  const weightEl = document.getElementById('edit-participant-weight');
  const genderEl = document.getElementById('edit-participant-gender');
  const dobEl = document.getElementById('edit-participant-dob');
  
  if (!registrationIdEl || !participantIndexEl || !nameEl || !weightEl || !genderEl || !dobEl) {
    showFlash(isAr ? 'خطأ في النموذج' : 'Erreur de formulaire', 'err');
    return;
  }
  
  const registrationId = parseInt(registrationIdEl.value);
  const participantIndex = parseInt(participantIndexEl.value);
  const name = nameEl.value.trim();
  const weight = parseFloat(weightEl.value);
  const gender = genderEl.value;
  const dob = dobEl.value;
  
  if (!name || name.length === 0) {
    showFlash(isAr ? '⚠️ الاسم مطلوب' : '⚠️ Le nom est requis', 'err');
    nameEl.style.borderColor = '#c41e2e';
    nameEl.style.backgroundColor = '#fff0f0';
    nameEl.focus();
    return;
  }
  
  if (isNaN(weight) || weight <= 0) {
    showFlash(isAr ? '⚠️ الوزن مطلوب' : '⚠️ Le poids est requis', 'err');
    weightEl.style.borderColor = '#c41e2e';
    weightEl.style.backgroundColor = '#fff0f0';
    weightEl.focus();
    return;
  }
  
  nameEl.style.borderColor = '';
  nameEl.style.backgroundColor = '';
  weightEl.style.borderColor = '';
  weightEl.style.backgroundColor = '';
  
  try {
    const { data: reg, error } = await sbClient
      .from('registrations')
      .select('*')
      .eq('id', registrationId)
      .single();
    
    if (error) throw error;
    
    if (!reg) {
      showFlash(isAr ? '❌ Enregistrement non trouvé' : '❌ Enregistrement non trouvé', 'err');
      return;
    }
    
    const participants = reg.participants || [];
    if (participantIndex >= participants.length) {
      showFlash(isAr ? '❌ Participant non trouvé' : '❌ Participant non trouvé', 'err');
      return;
    }
    
    participants[participantIndex] = {
      ...participants[participantIndex],
      name: name,
      weight: weight,
      gender: gender,
      dob: dob || participants[participantIndex].dob
    };
    
    const { error: updateError } = await sbClient
      .from('registrations')
      .update({ participants: participants })
      .eq('id', registrationId);
    
    if (updateError) throw updateError;
    
    closeModal('modal-edit-participant');
    showFlash(isAr ? '✅ تم تعديل المشارك بنجاح' : '✅ Participant modifié avec succès');
    
    await loadVerificationData();
    
  } catch (err) {
    console.error('Erreur saveEditedParticipant:', err);
    showFlash('Erreur: ' + err.message, 'err');
  }
};

// ==================== SUPPRIMER UN PARTICIPANT ====================
window.deleteParticipant = function(registrationId, participantIndex) {
  const isAr = currentLanguage === 'ar';
  
  if (!confirm(isAr ? 'هل تريد حذف هذا المشارك؟' : 'Voulez-vous supprimer ce participant ?')) {
    return;
  }
  
  sbClient.from('registrations').select('*').eq('id', registrationId).single()
    .then(async ({ data: reg }) => {
      if (!reg) {
        showFlash(isAr ? 'لم يتم العثور على التسجيل' : 'Inscription non trouvée', 'err');
        return;
      }
      
      const participants = reg.participants || [];
      participants.splice(participantIndex, 1);
      
      await sbClient.from('registrations').update({ participants }).eq('id', registrationId);
      
      showFlash(isAr ? 'تم حذف المشارك بنجاح' : 'Participant supprimé avec succès');
      window.renderClubMyRegs();
    })
    .catch(err => {
      console.error('Erreur deleteParticipant:', err);
      showFlash('Erreur: ' + err.message, 'err');
    });
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

// ==================== AJOUT MANUEL ====================
window.addManualParticipant = function() {
  const name = document.getElementById('mreg-pname').value.trim();
  const dob = document.getElementById('mreg-pdob').value;
  const weight = parseFloat(document.getElementById('mreg-pweight').value);
  const gender = document.getElementById('mreg-pgender').value;
  const categoryId = document.getElementById('mreg-pcat').value;
  
  if (!name || !dob) {
    showFlash(t('الاسم والتاريخ مطلوبان', 'Nom et date requis'), 'err');
    return;
  }
  
  let categoryName = 'À déterminer';
  let catId = null;
  let parentId = null;
  let displayName = 'À déterminer';
  
  // 1. Si une catégorie est sélectionnée manuellement
  if (categoryId) {
    const found = CATEGORIES.find(c => c.id === parseInt(categoryId));
    if (found) {
      categoryName = found.name_fr;
      catId = found.id;
      parentId = found.parent_id || null;
      // Trouver le nom d'affichage
      if (found.parent_id) {
        const parent = CATEGORIES.find(p => p.id === found.parent_id);
        displayName = parent ? `${parent.name_fr} - ${found.poids_fr || found.name_fr}` : found.name_fr;
      } else {
        displayName = found.name_fr;
      }
    }
  } 
  // 2. Sinon, déterminer automatiquement
  else if (dob && !isNaN(weight) && weight > 0) {
    const result = determineCategory(dob, weight, gender);
    categoryName = result.name;
    catId = result.id;
    parentId = result.parentId;
    displayName = result.displayName || categoryName;
  }
  
  regState.participants.push({ 
    name, 
    dob, 
    weight: isNaN(weight) ? null : weight, 
    gender, 
    category: displayName, // Utiliser le nom d'affichage complet
    category_id: catId,
    parent_category_id: parentId,
    belt: '' 
  });
  
  clearParticipantForm();
  renderParticipantList();
  showFlash(t('تمت الإضافة', 'Ajouté'));
}
// ==================== RENDER PARTICIPANT LIST - Version corrigée ====================
function renderParticipantList() {
  const wrap = document.getElementById('mreg-list-wrap');
  if (!regState.participants.length) {
    wrap.innerHTML = '';
    return;
  }
  
  const isAr = currentLanguage === 'ar';
  
  const rows = regState.participants.map((p, i) => {
    // Vérifier si la catégorie est "À déterminer"
    const isUndetermined = p.category === 'À déterminer' || !p.category_id;
    
    return `
      <tr>
        <td>${i + 1}</td>
        <td>${p.name}</td>
        <td>${fmtDate(p.dob)}</td>
        <td>${p.weight ? p.weight + ' kg' : '—'}</td>
        <td>${p.gender}</td>
        <td style="${isUndetermined ? 'color: #c41e2e; font-weight: 700;' : 'color: var(--green-700); font-weight: 600;'}"">
          ${p.category || 'À déterminer'}
          ${isUndetermined ? ' <span style="font-size: 10px; background: #fbe9eb; padding: 2px 6px; border-radius: 10px;">⚠️</span>' : ' ✅'}
        </td>
        <td><button class="btn-red btn-sm" onclick="window.removeParticipant(${i})"><i class="ti ti-trash"></i></button></td>
      </tr>
    `;
  }).join('');
  
  wrap.innerHTML = `
    <div class="section-title" style="font-size:15px;margin-top:16px;">
      ${isAr ? 'القائمة' : 'Liste'} (${regState.participants.length})
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>${isAr ? 'الاسم' : 'Nom'}</th>
            <th>${isAr ? 'الميلاد' : 'Naissance'}</th>
            <th>${isAr ? 'الوزن' : 'Poids'}</th>
            <th>${isAr ? 'الجنس' : 'Sexe'}</th>
            <th>${isAr ? 'الفئة' : 'Catégorie'}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
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
    window.renderClubHome();
  } catch (err) {
    console.error('Erreur submitRegistration:', err);
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


// Appeler après le chargement des catégories
async function loadCategories() {
  if (!sbClient) return;
  try {
    const { data, error } = await sbClient.from('categories').select('*').order('id');
    if (error) throw error;
    if (data) {
      CATEGORIES = data;
       
    }
    
  } catch (err) {
    console.error('❌ Error loading categories:', err);
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
        ['الرقم', 'الاسم واللقب', 'تاريخ الميلاد', 'الوزن (كغ)', 'الجنس'],
        ['1', 'محمد زكرياء', '2000-01-15', '65', 'ذكور']
      ];
      
      const remarques = [
        ['ملاحظات هامة للتعبئة:'],
        ['1. الرقم: رقم تسلسلي اختياري (يمكن تركه فارغاً)'],
        ['2. الاسم واللقب: يجب كتابة الاسم الكامل'],
        ['3. تاريخ الميلاد: بصيغة YYYY-MM-DD (مثال: 2000-01-15)'],
        ['4. الوزن: بالكيلوغرام (مثال: 65)'],
        ['5. الجنس: يجب كتابة "ذكور" أو "إناث" فقط'],
        [''],
        ['ملاحظة: يمكن ترك خانة "الرقم" فارغة، سيتم تعبئتها تلقائياً']
      ];
      
      const ws1 = XLSX.utils.aoa_to_sheet(template);
      ws1['!cols'] = [
        { wch: 10 }, { wch: 25 }, { wch: 18 }, { wch: 15 }, { wch: 12 }
      ];
      
      const ws2 = XLSX.utils.aoa_to_sheet(remarques);
      ws2['!cols'] = [{ wch: 60 }];
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws1, 'Inscriptions');
      XLSX.utils.book_append_sheet(wb, ws2, 'Remarques');
      
      XLSX.writeFile(wb, 'template_inscription.xlsx');
      showFlash(t('تم التحميل', 'Template téléchargé'));
    };
  }
}

// ==================== PROCESS EXCEL ====================
function processExcel(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { 
        type: 'array',
        cellDates: true,
        raw: true 
      });
      
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { 
        header: 1, 
        defval: '',
        raw: false,
        dateNF: 'yyyy-mm-dd'
      });

      function convertExcelDate(value) {
        if (!value) return null;
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return value;
        }
        if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
          const parts = value.split('/');
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        if (typeof value === 'string') {
          const parsed = new Date(value);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
          }
          return null;
        }
        if (typeof value === 'number') {
          const excelEpoch = new Date(1899, 11, 30);
          const date = new Date(excelEpoch.getTime() + (value * 86400000));
          return date.toISOString().split('T')[0];
        }
        if (value instanceof Date) {
          return value.toISOString().split('T')[0];
        }
        return null;
      }

      let count = 0;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        const numero = row[0] || '';
        const name = (row[1] || '').trim();
        let dobRaw = row[2] || '';
        const weight = parseFloat(row[3]);
        let gender = (row[4] || '').trim();

        // Convertir la date
        let dob = convertExcelDate(dobRaw);
        
        if (!dob && typeof dobRaw === 'string') {
          const match = dobRaw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
          if (match) {
            dob = `${match[3]}-${match[2]}-${match[1]}`;
          }
        }
        
        if (!dob) {
          dob = '2000-01-01';
        }

        // Nettoyer le genre
        gender = gender.trim();
        if (gender === 'ذكر' || gender === 'Masculin' || gender === 'M' || gender === 'Homme' || gender === 'male') {
          gender = 'ذكور';
        } else if (gender === 'أنثى' || gender === 'Feminin' || gender === 'F' || gender === 'Femme' || gender === 'female') {
          gender = 'إناث';
        }

        if (name && dob) {
          // Déterminer la catégorie avec sous-catégories
          let categoryName = 'À déterminer';
          let categoryId = null;
          let parentId = null;
          let displayName = 'À déterminer';
          
          if (!isNaN(weight) && weight > 0) {
            const result = determineCategory(dob, weight, gender);
            categoryName = result.name;
            categoryId = result.id;
            parentId = result.parentId;
            displayName = result.displayName || categoryName;
          }

          regState.participants.push({
            name,
            dob: dob,
            weight: isNaN(weight) ? null : weight,
            gender: gender || 'ذكور',
            category: displayName,
            category_id: categoryId,
            parent_category_id: parentId,
            belt: ''
          });
          count++;
        }
      }

      renderParticipantList();
      showFlash(`${count} ${t('مشارك تم استيراده', 'participants importés')}`);
      
    } catch (err) {
      console.error('❌ Erreur processExcel:', err);
      showFlash('Erreur lecture fichier: ' + err.message, 'err');
    }
  };
  reader.readAsArrayBuffer(file);
}
// ==================== RÉSULTATS - ADMIN ====================
let currentResultsParticipants = [];
let selectedRankings = {};

// ==================== CHARGER LES RÉSULTATS ====================
function loadResultsCategories() {
  const compId = document.getElementById('filter-results-competition').value;
  if (!compId) return;
  
  const catSelect = document.getElementById('filter-results-category');
  catSelect.innerHTML = '<option value="">-- Toutes --</option>';
  
  const comp = COMPETITIONS.find(c => c.id === parseInt(compId));
  if (comp && comp.category_ids) {
    comp.category_ids.forEach(cid => {
      const cat = CATEGORIES.find(c => c.id === cid);
      if (cat) {
        catSelect.innerHTML += `<option value="${cat.id}">${cat.name_fr} (${cat.poids_fr})</option>`;
      }
    });
  }
  loadResultsParticipants();
}

// ==================== CHARGER LES PARTICIPANTS POUR LES RÉSULTATS ====================
window.loadResultsParticipants = async function() {
  const compId = document.getElementById('filter-results-competition').value;
  const parentId = document.getElementById('filter-results-parent').value;
  const catId = document.getElementById('filter-results-category').value;
  const weightMin = parseFloat(document.getElementById('filter-weight-min').value) || 0;
  const weightMax = parseFloat(document.getElementById('filter-weight-max').value) || 1000;
  
  const tbody = document.getElementById('results-tbody');
  
  if (!compId) {
    tbody.innerHTML = '<tr><td colspan="8">Sélectionnez une compétition</td></tr>';
    return;
  }
  
  try {
    // Récupérer les résultats existants avec le nouveau champ category_name
    const { data: existingResults, error: resultsError } = await sbClient
      .from('results')
      .select('*')
      .eq('competition_id', parseInt(compId));
    
    if (resultsError) throw resultsError;
    
    const resultsMap = {};
    if (existingResults) {
      existingResults.forEach(r => {
        resultsMap[r.participant_name.trim()] = {
          rank: r.rank,
          position: r.position,
          medal: r.medal,
          id: r.id,
          category_id: r.category_id,
          category_name: r.category_name
        };
      });
    }
    
    // Récupérer les inscriptions
    const { data: registrations, error } = await sbClient
      .from('registrations')
      .select('*')
      .eq('competition_id', parseInt(compId));
    
    if (error) throw error;
    
    if (!registrations || registrations.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8">Aucun participant trouvé</td></tr>';
      return;
    }
    
    // Récupérer les clubs
    const { data: clubs } = await sbClient.from('clubs').select('id, name, club_code');
    const clubsMap = {};
    clubs.forEach(c => clubsMap[c.id] = c);
    
    const participants = [];
    const comp = COMPETITIONS.find(c => c.id === parseInt(compId));
    const compCatIds = comp?.category_ids || [];
    
    // Récupérer les IDs des sous-catégories si un parent est sélectionné
    let childIds = [];
    if (parentId) {
      childIds = CATEGORIES.filter(c => c.parent_id === parseInt(parentId)).map(c => c.id);
    }
    
    registrations.forEach(reg => {
      const club = clubsMap[reg.club_id];
      reg.participants.forEach(p => {
        const weight = parseFloat(p.weight);
        
        // Filtrer par poids
        if ((isNaN(weight) || weight >= weightMin) && (isNaN(weight) || weight < weightMax)) {
          
          // Vérifier si la catégorie est dans la compétition
          let includeParticipant = true;
          
          if (catId) {
            includeParticipant = p.category_id === parseInt(catId);
          } else if (parentId) {
            includeParticipant = childIds.includes(p.category_id) || p.category_id === parseInt(parentId);
          } else {
            includeParticipant = compCatIds.includes(p.category_id);
          }
          
          if (includeParticipant) {
            const existingResult = resultsMap[p.name.trim()];
            
            participants.push({
              ...p,
              clubName: club?.name || 'Inconnu',
              clubCode: club?.club_code || '?',
              clubId: reg.club_id,
              registrationId: reg.id,
              existingRank: existingResult?.rank || null,
              existingPosition: existingResult?.position || null,
              existingMedal: existingResult?.medal || null,
              resultId: existingResult?.id || null,
              existingCategoryName: existingResult?.category_name || null,
              category_id: p.category_id
            });
          }
        }
      });
    });
    
    currentResultsParticipants = participants;
    
    // Initialiser selectedRankings avec les résultats existants
    const medals = { 1: '🥇 Or', 2: '🥈 Argent', 3: '🥉 Bronze', 4: '🥉 Bronze' };
    const positions = { 1: '1er', 2: '2ème', 3: '3ème', 4: '3ème' };
    
    selectedRankings = {};
    participants.forEach((p, idx) => {
      if (p.existingRank) {
        selectedRankings[idx] = {
          rank: p.existingRank,
          position: p.existingPosition || positions[p.existingRank],
          medal: p.existingMedal || medals[p.existingRank],
          participant: p,
          resultId: p.resultId
        };
      }
    });
    
    renderResultsTable(participants);
    
  } catch (err) {
    console.error('❌ Erreur loadResultsParticipants:', err);
    tbody.innerHTML = '<tr><td colspan="8">Erreur de chargement</td></tr>';
  }
}
// ==================== RENDRE LE TABLEAU DES RÉSULTATS ====================
function renderResultsTable(participants) {
  const tbody = document.getElementById('results-tbody');
  if (!participants || participants.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8">Aucun participant trouvé</td></tr>';
    return;
  }
  
  const isAr = currentLanguage === 'ar';
  
  const rows = participants.map((p, idx) => {
    const savedRank = selectedRankings[idx] || {};
    const existingRank = p.existingRank || null;
    
    let selectedValue = '';
    if (savedRank.rank) {
      selectedValue = savedRank.rank;
    } else if (existingRank) {
      selectedValue = existingRank;
    }
    
    let displayMedal = savedRank.medal || p.existingMedal || '—';
    
    // Afficher la catégorie avec sous-catégorie
    let categoryDisplay = p.category || '—';
    // Si on a l'ID de la catégorie, essayer de trouver le nom complet
    if (p.category_id) {
      const cat = CATEGORIES.find(c => c.id === p.category_id);
      if (cat && cat.parent_id) {
        const parent = CATEGORIES.find(p => p.id === cat.parent_id);
        if (parent) {
          categoryDisplay = `${parent.name_fr} - ${cat.poids_fr || cat.name_fr}`;
        }
      } else if (cat) {
        categoryDisplay = cat.name_fr;
      }
    }
    
    return `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${p.name}</strong></td>
        <td>${p.clubName}</td>
        <td>${p.weight ? p.weight + ' kg' : '—'}</td>
        <td>${categoryDisplay}</td>
        <td>
          <select class="rank-select" data-idx="${idx}" onchange="updateRank(${idx}, this.value)">
            <option value="">—</option>
            <option value="1" ${selectedValue == 1 ? 'selected' : ''}>🥇 1er</option>
            <option value="2" ${selectedValue == 2 ? 'selected' : ''}>🥈 2ème</option>
            <option value="3" ${selectedValue == 3 ? 'selected' : ''}>🥉 3ème</option>
            <option value="4" ${selectedValue == 4 ? 'selected' : ''}>🥉 3ème</option>
          </select>
        </td>
        <td id="medal-${idx}">${displayMedal}</td>
        <td>
          <button class="btn-primary btn-sm" onclick="setRank(${idx}, 1)" title="1er">🥇</button>
          <button class="btn-primary btn-sm" onclick="setRank(${idx}, 2)" title="2ème">🥈</button>
          <button class="btn-primary btn-sm" onclick="setRank(${idx}, 3)" title="3ème">🥉</button>
          <button class="btn-red btn-sm" onclick="clearRank(${idx})" title="Effacer">✕</button>
        </td>
      </tr>
    `;
  }).join('');
  
  tbody.innerHTML = rows;
}
// ==================== GESTION DES RANGS ====================
function setRank(idx, rank) {
  const select = document.querySelector(`.rank-select[data-idx="${idx}"]`);
  if (select) {
    select.value = rank;
    updateRank(idx, rank);
  }
}
// ==================== CHARGER LE CLASSEMENT DES CLUBS ====================
window.loadClubRankingsView = async function() {
  const compId = document.getElementById('rankings-competition')?.value;
  const isAr = currentLanguage === 'ar';
  const container = document.getElementById('rankings-content');
  
  if (!container) return;
  
  try {
    let query = sbClient.from('results').select('*');
    if (compId) {
      query = query.eq('competition_id', parseInt(compId));
    }
    
    const { data: results, error } = await query;
    if (error) throw error;
    
    if (!results || results.length === 0) {
      container.innerHTML = `<p style="color: var(--ink-500); text-align:center; padding:20px;">${isAr ? 'لا توجد نتائج' : 'Aucun résultat'}</p>`;
      return;
    }
    
    // Récupérer tous les clubs
    const { data: clubs } = await sbClient.from('clubs').select('id, name, club_code');
    const clubsMap = {};
    clubs.forEach(c => clubsMap[c.id] = c);
    
    // Calculer le classement par club
    const clubStats = {};
    results.forEach(r => {
      const clubId = r.club_id;
      if (!clubId) return; // Ignorer les résultats sans club
      
      const club = clubsMap[clubId];
      if (!club) return;
      
      if (!clubStats[clubId]) {
        clubStats[clubId] = {
          clubName: club.name,
          clubCode: club.club_code || '?',
          gold: 0,
          silver: 0,
          bronze: 0,
          points: 0
        };
      }
      
      if (r.rank === 1) { 
        clubStats[clubId].gold++; 
        clubStats[clubId].points += 5; 
      } else if (r.rank === 2) { 
        clubStats[clubId].silver++; 
        clubStats[clubId].points += 3; 
      } else if (r.rank === 3 || r.rank === 4) { 
        clubStats[clubId].bronze++; 
        clubStats[clubId].points += 1; 
      }
    });
    
    // Trier par points
    const sorted = Object.values(clubStats).sort((a, b) => b.points - a.points);
    
    if (sorted.length === 0) {
      container.innerHTML = `<p style="color: var(--ink-500); text-align:center; padding:20px;">${isAr ? 'لا توجد بيانات' : 'Aucune donnée'}</p>`;
      return;
    }
    
    const rows = sorted.map((club, idx) => `
      <tr ${idx === 0 ? 'style="background: var(--gold-100);"' : ''}>
        <td>${idx + 1}</td>
        <td><strong>${club.clubName}</strong> (${club.clubCode})</td>
        <td>🥇 ${club.gold}</td>
        <td>🥈 ${club.silver}</td>
        <td>🥉 ${club.bronze}</td>
        <td><strong style="color: var(--green-700); font-size:18px;">${club.points}</strong></td>
      </tr>
    `).join('');
    
    container.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>${isAr ? 'النادي' : 'Club'}</th>
              <th>🥇 ${isAr ? 'ذهبية' : 'Or'}</th>
              <th>🥈 ${isAr ? 'فضية' : 'Argent'}</th>
              <th>🥉 ${isAr ? 'برونزية' : 'Bronze'}</th>
              <th>${isAr ? 'نقاط' : 'Points'}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
    
  } catch (err) {
    console.error('Erreur loadClubRankingsView:', err);
    container.innerHTML = `<div class="error-msg">${isAr ? 'خطأ في تحميل الترتيب' : 'Erreur de chargement'}</div>`;
  }
}
// ==================== METTRE À JOUR LE RANG ====================
// ==================== METTRE À JOUR LE RANG ====================
// ==================== METTRE À JOUR LE RANG ====================
window.updateRank = function(idx, rank) {
  const medals = { 1: '🥇 Or', 2: '🥈 Argent', 3: '🥉 Bronze', 4: '🥉 Bronze' };
  const positions = { 1: '1er', 2: '2ème', 3: '3ème', 4: '3ème' };
  
  const medalEl = document.getElementById(`medal-${idx}`);
  const participant = currentResultsParticipants[idx];
  
  if (!participant) {
    console.warn('⚠️ Participant non trouvé pour idx:', idx);
    return;
  }
  
  
  if (rank && medals[rank]) {
    selectedRankings[idx] = { 
      rank: parseInt(rank), 
      position: positions[rank], 
      medal: medals[rank],
      participant: {
        name: participant.name,
        clubId: participant.clubId || null,
        clubName: participant.clubName || 'Inconnu',
        category_id: participant.category_id || null,
        category: participant.category || 'À déterminer',
        weight: participant.weight
      },
      resultId: participant.resultId || null
    };
    medalEl.textContent = medals[rank];
  } else {
    delete selectedRankings[idx];
    medalEl.textContent = '—';
  }
}
function clearRank(idx) {
  const select = document.querySelector(`.rank-select[data-idx="${idx}"]`);
  if (select) {
    select.value = '';
    updateRank(idx, '');
  }
}

// ==================== ENREGISTRER LES RÉSULTATS ====================
window.saveResults = async function() {
  const compId = document.getElementById('filter-results-competition').value;
  if (!compId) {
    showFlash('Sélectionnez une compétition', 'err');
    return;
  }
  
  if (Object.keys(selectedRankings).length === 0) {
    showFlash('Aucun résultat à enregistrer', 'err');
    return;
  }
  
 
  
  try {
    // Récupérer les inscriptions pour cette compétition
    const { data: registrations, error: regError } = await sbClient
      .from('registrations')
      .select('*')
      .eq('competition_id', parseInt(compId));
    
    if (regError) throw regError;
    
    // Créer un mapping des participants avec leurs infos
    const participantMap = {};
    registrations.forEach(reg => {
      reg.participants.forEach(p => {
        const key = p.name.trim();
        participantMap[key] = {
          club_id: reg.club_id,
          category_id: p.category_id || null,
          category: p.category || 'À déterminer',
          weight: p.weight || 0,
          gender: p.gender || 'Hommes'
        };
      });
    });
    
    
    // Récupérer les résultats existants
    const { data: existingResults } = await sbClient
      .from('results')
      .select('id, participant_name, category_id, category_name')
      .eq('competition_id', parseInt(compId));
    
    const existingMap = {};
    if (existingResults) {
      existingResults.forEach(r => {
        existingMap[r.participant_name.trim()] = r;
      });
    }
    
    let savedCount = 0;
    let updatedCount = 0;
    
    for (const [idx, data] of Object.entries(selectedRankings)) {
      const participant = currentResultsParticipants[parseInt(idx)];
      if (!participant) {
        console.warn(`⚠️ Participant non trouvé pour l'index ${idx}`);
        continue;
      }
      
      const info = participantMap[participant.name.trim()];
      
      // Utiliser l'ID de la catégorie du participant ou de l'info
      let categoryId = info?.category_id || participant.category_id || null;
      
      // Si c'est une catégorie parent (ex: Séniors ID:11), essayer de trouver la sous-catégorie
      if (categoryId) {
        const cat = CATEGORIES.find(c => c.id === categoryId);
        // Si c'est une catégorie parent ET qu'elle a des sous-catégories
        if (cat && !cat.parent_id) {
          const children = CATEGORIES.filter(c => c.parent_id === cat.id);
          if (children.length > 0) {
            // Essayer de trouver la sous-catégorie par poids
            const weight = parseFloat(info?.weight || participant.weight || 0);
            const gender = info?.gender || participant.gender || 'Hommes';
            const foundChild = children.find(c => {
              const min = parseFloat(c.poids_min) || 0;
              const max = parseFloat(c.poids_max) || 0;
              return weight >= min && weight < max;
            });
            if (foundChild) {
              categoryId = foundChild.id;
              console.log(`🔍 Sous-catégorie trouvée pour le poids ${weight}kg: ${foundChild.name_fr} (ID:${foundChild.id})`);
            }
          }
        }
      }
      

      
      // FORMATER LE NOM DE LA CATÉGORIE
      let categoryDisplayName = 'Catégorie non définie';
      if (categoryId) {
        categoryDisplayName = formatCategoryNameForResult(categoryId);
      } else if (info?.category) {
        categoryDisplayName = info.category;
      }
      
      
      const resultData = {
        competition_id: parseInt(compId),
        category_id: categoryId,
        participant_name: participant.name,
        club_id: info?.club_id || participant.clubId || null,
        rank: data.rank,
        position: data.position,
        medal: data.medal,
        category_name: categoryDisplayName
      };
      
      
      // Vérifier si ce participant a déjà un résultat
      const existing = existingMap[participant.name.trim()];
      
      if (existing) {
        const { error } = await sbClient
          .from('results')
          .update({
            category_id: resultData.category_id,
            rank: resultData.rank,
            position: resultData.position,
            medal: resultData.medal,
            category_name: resultData.category_name
          })
          .eq('id', existing.id);
        
        if (!error) {
          updatedCount++;
          console.log(`✅ Résultat mis à jour pour ${participant.name}: ${categoryDisplayName}`);
        }
      } else {
        const { error } = await sbClient
          .from('results')
          .insert(resultData);
        
        if (!error) {
          savedCount++;
          console.log(`✅ Nouveau résultat pour ${participant.name}: ${categoryDisplayName}`);
        }
      }
    }
    
    showFlash(`✅ ${savedCount} nouveaux résultats + ${updatedCount} mises à jour`);
    
    // Recharger les données
    await loadResultsParticipants();
    
    if (document.getElementById('rankings-content')) {
      await window.loadClubRankingsView();
    }
    
  } catch (err) {
    console.error('❌ Erreur saveResults:', err);
    showFlash('Erreur: ' + err.message, 'err');
  }
}
// ==================== FORMATTER LE NOM DE LA CATÉGORIE POUR LES RÉSULTATS ====================
function formatCategoryNameForResult(categoryId) {
  if (!categoryId) {
    console.warn('⚠️ categoryId est null ou undefined');
    return 'Catégorie non définie';
  }
  
  const cat = CATEGORIES.find(c => c.id === categoryId);
  if (!cat) {
    console.warn(`⚠️ Catégorie avec ID ${categoryId} non trouvée`);
    return 'Catégorie non définie';
  }
  
  
  // Cas 1: C'est une sous-catégorie (a un parent_id)
  if (cat.parent_id) {
    const parent = CATEGORIES.find(p => p.id === cat.parent_id);
    if (parent) {
      // Déterminer le format du poids
      let poidsDisplay = '';
      const poidsMin = parseFloat(cat.poids_min) || 0;
      const poidsMax = parseFloat(cat.poids_max) || 0;
      
      // Règle: si poids_max >= 100, utiliser +poids_min, sinon -poids_max
      if (poidsMax >= 100) {
        poidsDisplay = `+${poidsMin}`;
      } else {
        poidsDisplay = `-${poidsMax}`;
      }
      
      const formattedName = `${parent.name_fr} ${poidsDisplay} kg`;
      console.log(`✅ Nom formaté (sous-catégorie): "${formattedName}"`);
      return formattedName;
    }
    return cat.name_fr;
  }
  
  // Cas 2: C'est une catégorie parent, mais elle a des sous-catégories
  // On va essayer de trouver la sous-catégorie correspondante
  const children = CATEGORIES.filter(c => c.parent_id === cat.id);
  
  if (children.length > 0) {
    console.log(`ℹ️ La catégorie "${cat.name_fr}" a ${children.length} sous-catégories`);
    console.log(`ℹ️ Utilisation du nom de la catégorie parent: "${cat.name_fr}"`);
    return cat.name_fr;
  }
  
  // Cas 3: C'est une catégorie parent sans sous-catégories
  console.log(`ℹ️ Catégorie parent sans sous-catégorie: ${cat.name_fr}`);
  return cat.name_fr;
}

// ==================== OBTENIR LE NOM COMPLET POUR L'AFFICHAGE ====================
function getFullCategoryDisplay(categoryId) {
  if (!categoryId) return '—';
  
  const cat = CATEGORIES.find(c => c.id === categoryId);
  if (!cat) return '—';
  
  // Si c'est une sous-catégorie
  if (cat.parent_id) {
    const parent = CATEGORIES.find(p => p.id === cat.parent_id);
    if (parent) {
      let poidsDisplay = '';
      const poidsMin = parseFloat(cat.poids_min) || 0;
      const poidsMax = parseFloat(cat.poids_max) || 0;
      
      if (poidsMax >= 100) {
        poidsDisplay = `+${poidsMin}`;
      } else {
        poidsDisplay = `-${poidsMax}`;
      }
      return `${parent.name_fr} - ${poidsDisplay} kg`;
    }
  }
  
  return cat.name_fr;
}

// ==================== DÉTERMINER LA CATÉGORIE PAR POIDS ET GENRE ====================
function findCategoryByWeightAndGender(parentCategoryId, weight, gender) {
  // Trouver les sous-catégories du parent
  const children = CATEGORIES.filter(c => c.parent_id === parentCategoryId && c.gender === gender);
  
  if (children.length === 0) {
    // Pas de sous-catégories, retourner le parent
    return parentCategoryId;
  }
  
  // Trouver la sous-catégorie correspondant au poids
  const found = children.find(c => {
    const min = parseFloat(c.poids_min) || 0;
    const max = parseFloat(c.poids_max) || 0;
    return weight >= min && weight < max;
  });
  
  if (found) {
    return found.id;
  }
  
  // Si aucun poids ne correspond, retourner le parent
  return parentCategoryId;
}
// ==================== DEBUG: VÉRIFIER LES SOUS-CATÉGORIES ====================
function debugSubCategories() {
  console.log('=== DEBUG SOUS-CATÉGORIES ===');
  
  // Vérifier les parents avec sous-catégories
  const parents = CATEGORIES.filter(c => !c.parent_id);
  
  parents.forEach(parent => {
    const children = CATEGORIES.filter(c => c.parent_id === parent.id);
    if (children.length > 0) {
      console.log(`\n📁 ${parent.name_fr} (ID:${parent.id}) - ${children.length} sous-catégories`);
      children.forEach(child => {
        const formatted = formatCategoryNameForResult(child.id);
        console.log(`  └── ${child.name_fr} (min:${child.poids_min}, max:${child.poids_max}) → "${formatted}"`);
      });
    }
  });
  
  // Vérifier quelles catégories sont utilisées dans les résultats
  console.log('\n📊 Catégories utilisées dans les résultats:');
  // (Cette partie nécessite une requête à Supabase)
}

// Appeler dans la console
// debugSubCategories();
/// ==================== ORDRE DES CATÉGORIES PAR ÂGE ====================
const CATEGORY_ORDER = {
  // Poussins (2016-2018) - Les plus jeunes
  'Poussins': 1,
  'Poussines': 2,
  // Benjamins (2014-2015)
  'Benjamins': 3,
  'Benjamines': 4,
  // Minimes (2012-2013)
  'Minimes': 5,
  'Minimes F': 6,
  // Cadets (2010-2011)
  'Cadets': 7,
  'Cadettes': 8,
  // Juniors (2007-2009)
  'Juniors': 9,
  'Juniores F': 10,
  // Séniors (2000-2006)
  'Séniors': 11,
  'Séniors F': 12,
  // Vétérans (1980-1999) - Les plus âgés
  'Vétérans': 13,
  'Vétérans F': 14
};
// Texte des rangs en arabe
const RANK_TEXT_AR = {
  1: 'المرتبة الأولى 🥇',
  2: 'المرتبة الثانية 🥈',
  3: 'المرتبة الثالثة 🥉',
  4: 'المرتبة الثالثة 🥉'
};
const MEDAL_TEXT_AR = {
  '🥇 Or': '🥇 ذهبية',
  '🥈 Argent': '🥈 فضية',
  '🥉 Bronze': '🥉 برونزية'
};
// ==================== FONCTION DE TRI DES CATÉGORIES ====================
function sortCategories(categories) {
  return categories.sort((a, b) => {
    // 1. Trier par ordre d'âge (catégorie parent)
    const orderA = CATEGORY_ORDER[a.parentName] || CATEGORY_ORDER[a.name] || 999;
    const orderB = CATEGORY_ORDER[b.parentName] || CATEGORY_ORDER[b.name] || 999;
    if (orderA !== orderB) return orderA - orderB;
    
    // 2. Trier par poids min (du plus léger au plus lourd)
    return (a.poidsMin || 0) - (b.poidsMin || 0);
  });
}


// ==================== FORMATEUR DE NOM DE CATÉGORIE EN ARABE ====================
function formatCategoryNameAR(categoryId) {
  if (!categoryId) return 'فئة غير محددة';
  
  const cat = CATEGORIES.find(c => c.id === categoryId);
  if (!cat) return 'فئة غير محددة';
  
  // Si c'est une sous-catégorie
  if (cat.parent_id) {
    const parent = CATEGORIES.find(p => p.id === cat.parent_id);
    if (parent) {
      const parentNameAR = parent.name_ar || parent.name_fr;
      let poidsDisplay = '';
      const poidsMin = parseFloat(cat.poids_min) || 0;
      const poidsMax = parseFloat(cat.poids_max) || 0;
      
      if (poidsMax >= 100) {
        poidsDisplay = `+${poidsMin}`;
      } else {
        poidsDisplay = `-${poidsMax}`;
      }
      return `${parentNameAR} ${poidsDisplay} كغ`;
    }
  }
  
  return cat.name_ar || cat.name_fr;
}

// ==================== FONCTION DE TRI PAR CATÉGORIE ET POIDS ====================
function groupResultsByCategory(results) {
  const groups = {};
  
  results.forEach(r => {
    const catId = r.category_id || 'unknown';
    const cat = CATEGORIES.find(c => c.id === catId);
    
    if (!groups[catId]) {
      groups[catId] = {
        id: catId,
        name: cat?.name_fr || 'Catégorie',
        nameAR: cat?.name_ar || cat?.name_fr || 'فئة',
        parentName: cat?.parent_id ? CATEGORIES.find(p => p.id === cat.parent_id)?.name_fr || '' : cat?.name_fr || '',
        parentNameAR: cat?.parent_id ? CATEGORIES.find(p => p.id === cat.parent_id)?.name_ar || '' : cat?.name_ar || cat?.name_fr || '',
        poidsMin: parseFloat(cat?.poids_min) || 0,
        poidsMax: parseFloat(cat?.poids_max) || 0,
        gender: cat?.gender || 'Hommes',
        results: []
      };
    }
    
    groups[catId].results.push(r);
  });
  
  // Trier les résultats dans chaque catégorie par rang (1er, 2ème, 3ème, 3ème)
  Object.values(groups).forEach(group => {
    group.results.sort((a, b) => {
      const rankA = a.rank || 999;
      const rankB = b.rank || 999;
      return rankA - rankB;
    });
  });
  
  // Trier les catégories
  const sortedGroups = Object.values(groups);
  return sortCategories(sortedGroups);
}
// ==================== OBTENIR LE NOM COMPLET POUR L'AFFICHAGE ====================
function getFullCategoryDisplay(categoryId) {
  if (!categoryId) return '—';
  
  const cat = CATEGORIES.find(c => c.id === categoryId);
  if (!cat) return '—';
  
  if (cat.parent_id) {
    const parent = CATEGORIES.find(p => p.id === cat.parent_id);
    if (parent) {
      let poidsDisplay = '';
      const poidsMin = parseFloat(cat.poids_min) || 0;
      const poidsMax = parseFloat(cat.poids_max) || 0;
      
      if (poidsMax >= 100) {
        poidsDisplay = `+${poidsMin}`;
      } else {
        poidsDisplay = `-${poidsMax}`;
      }
      return `${parent.name_fr} - ${poidsDisplay} kg`;
    }
  }
  
  return cat.name_fr;
}

// ==================== OBTENIR LE NOM COMPLET POUR L'AFFICHAGE ====================
function getFullCategoryDisplay(categoryId) {
  if (!categoryId) return '—';
  
  const cat = CATEGORIES.find(c => c.id === categoryId);
  if (!cat) return '—';
  
  if (cat.parent_id) {
    const parent = CATEGORIES.find(p => p.id === cat.parent_id);
    if (parent) {
      let poidsDisplay = '';
      if (cat.poids_max >= 100) {
        poidsDisplay = `+${cat.poids_min}`;
      } else {
        poidsDisplay = `-${cat.poids_max}`;
      }
      return `${parent.name_fr} - ${poidsDisplay} kg`;
    }
  }
  
  return cat.name_fr;
}
// ==================== EXPORTER LE RAPPORT EN EXCEL ====================
window.exportReportExcel = async function() {
  const compId = document.getElementById('report-competition').value;
  if (!compId) {
    showFlash('Sélectionnez une compétition', 'err');
    return;
  }
  
  try {
    // Récupérer les données
    const [registrationsRes, clubsRes, resultsRes] = await Promise.all([
      sbClient.from('registrations').select('*').eq('competition_id', parseInt(compId)),
      sbClient.from('clubs').select('id, name, club_code, wilaya'),
      sbClient.from('results').select('*').eq('competition_id', parseInt(compId))
    ]);
    
    const registrations = registrationsRes.data || [];
    const clubs = clubsRes.data || [];
    const results = resultsRes.data || [];
    const comp = COMPETITIONS.find(c => c.id === parseInt(compId));
    
    const clubsMap = {};
    clubs.forEach(c => clubsMap[c.id] = c);
    
    // Créer les données pour Excel
    const participantsData = [['#', 'الاسم واللقب', 'النادي', 'الولاية', 'الفئة', 'الوزن', 'الرتبة', 'الميدالية']];
    const resultsMap = {};
    results.forEach(r => {
      resultsMap[r.participant_name.trim()] = { rank: r.rank, position: r.position, medal: r.medal };
    });
    
    let index = 1;
    registrations.forEach(reg => {
      const club = clubsMap[reg.club_id];
      reg.participants.forEach(p => {
        const result = resultsMap[p.name.trim()];
        participantsData.push([
          index++,
          p.name,
          club?.name || 'غير معروف',
          club?.wilaya || 'غير معروفة',
          p.category || 'غير محددة',
          p.weight || '',
          result?.position || '—',
          result?.medal || '—'
        ]);
      });
    });
    
    // Créer le workbook
    const wb = XLSX.utils.book_new();
    
    // Feuille 1: Participants
    const ws1 = XLSX.utils.aoa_to_sheet(participantsData);
    ws1['!cols'] = [
      { wch: 5 }, { wch: 25 }, { wch: 25 }, { wch: 15 },
      { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, ws1, 'Participants');
    
    // Feuille 2: Statistiques
    // (Ajouter les stats si besoin)
    
    XLSX.writeFile(wb, `Rapport_${comp?.name_en?.replace(/[^a-z0-9]/gi, '_') || 'competition'}.xlsx`);
    showFlash('✅ Export Excel terminé');
    
  } catch (err) {
    console.error('Erreur exportReportExcel:', err);
    showFlash('Erreur: ' + err.message, 'err');
  }
}
// ==================== GÉNÉRER LES DIPLÔMES AVEC SOUS-CATÉGORIES ====================
window.generateDiplomasPDF = function() {
  const compId = document.getElementById('diploma-competition').value;
  
  if (!compId) {
    showFlash('Sélectionnez une compétition', 'err');
    return;
  }
  
  const results = getRankedResults(compId);
  
  if (!results || results.length === 0) {
    showFlash('Aucun résultat trouvé', 'err');
    return;
  }
  
  const comp = COMPETITIONS.find(c => c.id === parseInt(compId));
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('landscape', 'mm', 'a4');
  
  results.forEach((result, index) => {
    if (index > 0) doc.addPage();
    
    // Déterminer le nom complet de la catégorie
    let categoryDisplay = result.category || 'Catégorie';
    if (result.category_id) {
      const cat = CATEGORIES.find(c => c.id === result.category_id);
      if (cat && cat.parent_id) {
        const parent = CATEGORIES.find(p => p.id === cat.parent_id);
        if (parent) {
          categoryDisplay = `${parent.name_fr} - ${cat.poids_fr || cat.name_fr}`;
        }
      } else if (cat) {
        categoryDisplay = cat.name_fr;
      }
    }
    
    // Fond blanc
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 297, 210, 'F');
    
    // Cadre doré
    doc.setDrawColor(201, 160, 99);
    doc.setLineWidth(1.5);
    doc.rect(10, 10, 277, 190);
    
    // Cadre intérieur
    doc.setDrawColor(201, 160, 99);
    doc.setLineWidth(0.5);
    doc.rect(15, 15, 267, 180);
    
    // Titre
    doc.setFontSize(32);
    doc.setTextColor(12, 92, 58);
    doc.text('🏆 DIPLÔME', 148.5, 45, { align: 'center' });
    
    // Nom
    doc.setFontSize(26);
    doc.setTextColor(21, 25, 26);
    doc.text(result.participant_name, 148.5, 75, { align: 'center' });
    
    // Détails
    doc.setFontSize(14);
    doc.setTextColor(58, 65, 64);
    doc.text(`a obtenu la ${result.position} place`, 148.5, 95, { align: 'center' });
    doc.text(`Catégorie: ${categoryDisplay}`, 148.5, 110, { align: 'center' });
    doc.text(`Compétition: ${comp?.name || 'Competition'}`, 148.5, 120, { align: 'center' });
    doc.text(`Club: ${result.clubName}`, 148.5, 130, { align: 'center' });
    
    // Médaille
    doc.setFontSize(48);
    doc.text(result.medal, 148.5, 160, { align: 'center' });
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Généré le ${new Date().toLocaleDateString()}`, 148.5, 185, { align: 'center' });
  });
  
  doc.save(`Diplomes_${comp?.name_en?.replace(/[^a-z0-9]/gi, '_') || 'competition'}.pdf`);
  showFlash(`✅ ${results.length} diplômes générés`);
}
// ==================== LOGOS EN BASE64 (à ajouter en haut du fichier) ====================
// Ces logos sont déjà définis dans votre code
// LOGO_BASE64 et KARATE_BASE64 sont déjà présents

// ==================== GÉNÉRER LE HTML DU RAPPORT POUR PDF (VERSION CORRIGÉE) ====================
function generateReportHTMLForPDF(compId, comp, allParticipants, sortedClubs, sortedWilayas, sortedCategories, medalStats, totalParticipants, totalWithResults, totalClubs, totalWilayas, resultsHTML) {
  return `
  <!DOCTYPE html>
  <html dir="rtl">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>تقرير المسابقة</title>
      <style>
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
          }
          body {
              font-family: 'Arial', 'Tahoma', 'Segoe UI', sans-serif;
              background: white;
              padding: 15px;
              direction: rtl;
              color: #1a1a1a;
              font-size: 12px;
              line-height: 1.6;
          }
          .report-container {
              max-width: 1000px;
              margin: 0 auto;
              background: white;
              padding: 20px;
              border-radius: 8px;
          }
          /* En-tête */
          .header {
              text-align: center;
              padding-bottom: 20px;
              border-bottom: 3px solid #0c5c3a;
              margin-bottom: 20px;
          }
          .header-logos {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 20px;
              margin-bottom: 10px;
              flex-wrap: wrap;
          }
          .header-logos img {
              height: 60px;
              width: 60px;
              object-fit: contain;
          }
          .header-text {
              text-align: center;
          }
          .header-text .republic {
              font-size: 14px;
              font-weight: bold;
              color: #06311f;
          }
          .header-text .ministry {
              font-size: 11px;
              color: #3a4140;
          }
          .header-text .federation {
              font-size: 11px;
              color: #3a4140;
          }
          .header-text .commission {
              font-size: 16px;
              font-weight: bold;
              color: #0c5c3a;
              margin-top: 3px;
          }
          .header-title {
              margin-top: 8px;
          }
          .header-title .comp-name {
              font-size: 20px;
              font-weight: bold;
              color: #06311f;
          }
          .header-title .comp-name-en {
              font-size: 13px;
              color: #6b7472;
          }
          .header-title .comp-details {
              display: flex;
              justify-content: center;
              gap: 20px;
              margin-top: 5px;
              color: #3a4140;
              font-size: 12px;
              flex-wrap: wrap;
          }
          
          /* Statistiques */
          .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
              gap: 8px;
              margin-bottom: 20px;
          }
          .stat-card {
              background: #f7f5f0;
              border-radius: 8px;
              padding: 12px 10px;
              text-align: center;
              border: 1px solid #e3ded2;
          }
          .stat-card .stat-value {
              font-size: 22px;
              font-weight: bold;
              color: #0c5c3a;
          }
          .stat-card .stat-label {
              font-size: 10px;
              color: #6b7472;
              margin-top: 2px;
          }
          .stat-card.gold .stat-value { color: #c9a063; }
          .stat-card.silver .stat-value { color: #b0b0b0; }
          .stat-card.bronze .stat-value { color: #cd7f32; }
          
          /* Sections */
          .section-title {
              color: #06311f;
              font-size: 14px;
              border-bottom: 2px solid #e3c794;
              padding-bottom: 6px;
              margin-bottom: 10px;
              margin-top: 18px;
          }
          
          /* Tables */
          .table-wrap {
              overflow-x: auto;
              margin-bottom: 10px;
          }
          table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
          }
          table thead tr {
              background: #0c5c3a;
              color: white;
          }
          table thead th {
              padding: 6px 8px;
              text-align: center;
              font-size: 11px;
          }
          table tbody td {
              padding: 5px 8px;
              border-bottom: 1px solid #eee;
              text-align: center;
              font-size: 11px;
          }
          table tbody tr:nth-child(even) {
              background: #faf8f5;
          }
          
          /* Résultats par catégorie */
          .result-category {
              margin-bottom: 18px;
              background: #faf8f5;
              border-radius: 6px;
              padding: 12px 15px;
              border-right: 3px solid #0c5c3a;
          }
          .result-category .cat-name {
              font-size: 14px;
              font-weight: bold;
              color: #06311f;
              margin-bottom: 8px;
          }
          .result-rank {
              margin: 5px 0 3px 0;
              font-weight: bold;
              color: #0c5c3a;
              font-size: 12px;
              border-bottom: 1px dashed #e3ded2;
              padding-bottom: 3px;
          }
          .result-participants {
              margin-right: 15px;
          }
          .result-participant {
              display: flex;
              justify-content: space-between;
              padding: 3px 0;
              border-bottom: 1px solid #f5f3ef;
              font-size: 11px;
          }
          .result-participant .name {
              font-weight: 500;
          }
          .result-participant .club {
              color: #3a4140;
          }
          .result-participant .wilaya {
              color: #6b7472;
              font-size: 10px;
          }
          
          /* Pied de page */
          .footer {
              text-align: center;
              padding-top: 15px;
              border-top: 2px solid #0c5c3a;
              color: #6b7472;
              font-size: 10px;
              margin-top: 15px;
          }
          .footer .footer-title {
              font-weight: 600;
              color: #06311f;
              font-size: 11px;
          }
          
          @media print {
              body { padding: 0; }
              .report-container { padding: 15px; }
              .no-print { display: none; }
          }
      </style>
  </head>
  <body>
      <div class="report-container">
          <!-- En-tête -->
          <div class="header">
              <div class="header-logos">
                  <img src="${LOGO_BASE64}" alt="Logo">
                  <div class="header-text">
                      <div class="republic">الجمهورية الجزائرية الديمقراطية الشعبية</div>
                      <div class="ministry">وزارة الرياضة</div>
                      <div class="federation">الاتحادية الجزائرية للكراتي دو</div>
                      <div class="commission">اللجنة الوطنية للكيوكوشين كاي</div>
                  </div>
                  <img src="${KARATE_BASE64}" alt="Karate">
              </div>
              
              <div class="header-title">
                  <div class="comp-name">${comp?.name || 'مسابقة'}</div>
                  <div class="comp-name-en">${comp?.name_en || ''}</div>
                  <div class="comp-details">
                      <span>📅 ${fmtDate(comp?.date_start)}${comp?.date_end ? ` → ${fmtDate(comp?.date_end)}` : ''}</span>
                      <span>📍 ${comp?.wilaya || '—'}</span>
                  </div>
              </div>
          </div>
          
          <!-- Statistiques générales -->
          <h3 style="text-align:center;color:#06311f;font-size:16px;margin-bottom:12px;">📊 الإحصائيات العامة</h3>
          <div class="stats-grid">
              <div class="stat-card">
                  <div class="stat-value">${totalParticipants}</div>
                  <div class="stat-label">👤 المشاركين</div>
              </div>
              <div class="stat-card">
                  <div class="stat-value">${totalWithResults}</div>
                  <div class="stat-label">🏅 المصنفين</div>
              </div>
              <div class="stat-card">
                  <div class="stat-value">${totalClubs}</div>
                  <div class="stat-label">🏛️ الأندية</div>
              </div>
              <div class="stat-card">
                  <div class="stat-value">${totalWilayas}</div>
                  <div class="stat-label">🗺️ الولايات</div>
              </div>
              <div class="stat-card gold">
                  <div class="stat-value">${medalStats.gold}</div>
                  <div class="stat-label">🥇 ذهبية</div>
              </div>
              <div class="stat-card silver">
                  <div class="stat-value">${medalStats.silver}</div>
                  <div class="stat-label">🥈 فضية</div>
              </div>
              <div class="stat-card bronze">
                  <div class="stat-value">${medalStats.bronze}</div>
                  <div class="stat-label">🥉 برونزية</div>
              </div>
          </div>
          
          <!-- Statistiques par club -->
          <h4 class="section-title">🏛️ توزيع المشاركين حسب النادي</h4>
          <div class="table-wrap">
              <table>
                  <thead>
                      <tr>
                          <th>النادي</th>
                          <th>الرمز</th>
                          <th>الولاية</th>
                          <th>المشاركين</th>
                          <th>المصنفين</th>
                          <th>🥇</th>
                          <th>🥈</th>
                          <th>🥉</th>
                          <th>نقاط</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${sortedClubs.map((club, idx) => `
                          <tr>
                              <td style="font-weight:600;">${club.name}</td>
                              <td>${club.code}</td>
                              <td>${club.wilaya}</td>
                              <td style="font-weight:bold;">${club.total}</td>
                              <td>${club.withResults}</td>
                              <td style="color:#c9a063;font-weight:bold;">${club.gold}</td>
                              <td style="color:#b0b0b0;font-weight:bold;">${club.silver}</td>
                              <td style="color:#cd7f32;font-weight:bold;">${club.bronze}</td>
                              <td style="font-weight:bold;color:#0c5c3a;">${club.points}</td>
                          </tr>
                      `).join('')}
                  </tbody>
              </table>
          </div>
          
          <!-- Statistiques par wilaya -->
          <h4 class="section-title">🗺️ توزيع المشاركين حسب الولاية</h4>
          <div class="table-wrap">
              <table>
                  <thead>
                      <tr>
                          <th>الولاية</th>
                          <th>المشاركين</th>
                          <th>المصنفين</th>
                          <th>🥇</th>
                          <th>🥈</th>
                          <th>🥉</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${sortedWilayas.map(([wilaya, stats], idx) => `
                          <tr>
                              <td style="font-weight:600;">${wilaya}</td>
                              <td style="font-weight:bold;">${stats.total}</td>
                              <td>${stats.withResults}</td>
                              <td style="color:#c9a063;">${stats.gold}</td>
                              <td style="color:#b0b0b0;">${stats.silver}</td>
                              <td style="color:#cd7f32;">${stats.bronze}</td>
                          </tr>
                      `).join('')}
                  </tbody>
              </table>
          </div>
          
          <!-- Statistiques par catégorie -->
          <h4 class="section-title">📋 توزيع المشاركين حسب الفئة</h4>
          <div class="table-wrap">
              <table>
                  <thead>
                      <tr>
                          <th>الفئة</th>
                          <th>المشاركين</th>
                          <th>المصنفين</th>
                          <th>🥇</th>
                          <th>🥈</th>
                          <th>🥉</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${sortedCategories.map((cat, idx) => `
                          <tr>
                              <td style="font-weight:600;">${cat.name}</td>
                              <td style="font-weight:bold;">${cat.total}</td>
                              <td>${cat.withResults}</td>
                              <td style="color:#c9a063;">${cat.gold}</td>
                              <td style="color:#b0b0b0;">${cat.silver}</td>
                              <td style="color:#cd7f32;">${cat.bronze}</td>
                          </tr>
                      `).join('')}
                  </tbody>
              </table>
          </div>
          
          <!-- Classement des clubs -->
          <h4 class="section-title">🏆 ترتيب الأندية</h4>
          <div class="table-wrap">
              <table>
                  <thead>
                      <tr>
                          <th>#</th>
                          <th>النادي</th>
                          <th>الرمز</th>
                          <th>الولاية</th>
                          <th>🥇</th>
                          <th>🥈</th>
                          <th>🥉</th>
                          <th>نقاط</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${sortedClubs.map((club, idx) => `
                          <tr>
                              <td style="font-weight:bold;">${idx + 1}</td>
                              <td style="font-weight:600;">${club.name}</td>
                              <td>${club.code}</td>
                              <td>${club.wilaya}</td>
                              <td style="color:#c9a063;font-weight:bold;">${club.gold}</td>
                              <td style="color:#b0b0b0;font-weight:bold;">${club.silver}</td>
                              <td style="color:#cd7f32;font-weight:bold;">${club.bronze}</td>
                              <td style="font-weight:bold;color:#0c5c3a;font-size:14px;">${club.points}</td>
                          </tr>
                      `).join('')}
                  </tbody>
              </table>
          </div>
          
          <!-- Résultats par catégorie -->
          <h4 class="section-title">🏅 النتائج حسب الفئة</h4>
          ${resultsHTML || '<div style="text-align:center;padding:20px;color:#999;">لا توجد نتائج</div>'}
          
          <!-- Pied de page -->
          <div class="footer">
              <p class="footer-title">اللجنة الوطنية للكيوكوشين كاي - الجزائر</p>
              <p>تقرير صادر عن المنصة الرقمية الرسمية</p>
              <p>© ${new Date().getFullYear()} - ${new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
      </div>
  </body>
  </html>
  `;
}
// ==================== GÉNÉRER LES DIPLÔMES PDF ====================
function generateDiplomasPDF() {
  const compId = document.getElementById('diploma-competition').value;
  const catId = document.getElementById('diploma-category').value;
  
  if (!compId) {
    showFlash('Sélectionnez une compétition', 'err');
    return;
  }
  
  const comp = COMPETITIONS.find(c => c.id === parseInt(compId));
  const results = getRankedResults(compId, catId);
  
  if (!results.length) {
    showFlash('Aucun résultat trouvé', 'err');
    return;
  }
  
  // Utiliser jsPDF pour générer les diplômes
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('landscape', 'mm', 'a4');
  
  results.forEach((result, index) => {
    if (index > 0) doc.addPage();
    
    // Fond et bordures
    doc.setFillColor(245, 245, 240);
    doc.rect(10, 10, 277, 190, 'F');
    
    // Cadre doré
    doc.setDrawColor(201, 160, 99);
    doc.setLineWidth(2);
    doc.rect(15, 15, 267, 180);
    
    // Titre
    doc.setFontSize(28);
    doc.setTextColor(12, 92, 58);
    doc.text('🏆 DIPLÔME', 148.5, 50, { align: 'center' });
    
    // Nom du participant
    doc.setFontSize(24);
    doc.setTextColor(21, 25, 26);
    doc.text(result.participant_name, 148.5, 80, { align: 'center' });
    
    // Détails
    doc.setFontSize(14);
    doc.setTextColor(58, 65, 64);
    doc.text(`a obtenu la ${result.position} place`, 148.5, 100, { align: 'center' });
    doc.text(`Catégorie: ${result.category}`, 148.5, 115, { align: 'center' });
    doc.text(`Compétition: ${comp?.name}`, 148.5, 125, { align: 'center' });
    doc.text(`Club: ${result.clubName}`, 148.5, 135, { align: 'center' });
    
    // Médaille
    doc.setFontSize(40);
    doc.text(result.medal, 148.5, 165, { align: 'center' });
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Généré le ${new Date().toLocaleDateString()}`, 148.5, 185, { align: 'center' });
  });
  
  doc.save(`Diplomes_${comp?.name_en || 'competition'}.pdf`);
  showFlash('✅ Diplômes générés');
}

// ==================== EXPORT EXCEL DES DIPLÔMES ====================
function exportDiplomasExcel() {
  const compId = document.getElementById('diploma-competition').value;
  if (!compId) {
    showFlash('Sélectionnez une compétition', 'err');
    return;
  }
  
  const comp = COMPETITIONS.find(c => c.id === parseInt(compId));
  const results = getRankedResults(compId);
  
  const data = [
    ['الاسم واللقب', 'النادي', 'الفئة', 'الرتبة', 'الميدالية']
  ];
  
  results.forEach(r => {
    data.push([r.participant_name, r.clubName, r.category, r.position, r.medal]);
  });
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 20 }];
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Diplômes');
  XLSX.writeFile(wb, `Diplomes_${comp?.name_en || 'competition'}.xlsx`);
  showFlash('Export Excel des diplômes terminé');
}
// ==================== CLASSEMENT DES CLUBS ====================
async function loadClubRankings() {
  const compId = document.getElementById('rankings-competition').value;
  const container = document.getElementById('rankings-content');
  
  try {
    let query = sbClient.from('results').select('*');
    if (compId) {
      query = query.eq('competition_id', parseInt(compId));
    }
    
    const { data: results, error } = await query;
    if (error) throw error;
    
    // Calculer le classement par club
    const clubStats = {};
    results.forEach(r => {
      if (!clubStats[r.club_id]) {
        const club = CLUBS.find(c => c.id === r.club_id);
        clubStats[r.club_id] = {
          clubName: club?.name || 'Inconnu',
          clubCode: club?.club_code || '?',
          gold: 0,
          silver: 0,
          bronze: 0,
          points: 0
        };
      }
      if (r.rank === 1) { clubStats[r.club_id].gold++; clubStats[r.club_id].points += 5; }
      else if (r.rank === 2) { clubStats[r.club_id].silver++; clubStats[r.club_id].points += 3; }
      else if (r.rank === 3 || r.rank === 4) { clubStats[r.club_id].bronze++; clubStats[r.club_id].points += 1; }
    });
    
    // Trier par points
    const sorted = Object.values(clubStats).sort((a, b) => b.points - a.points);
    
    if (!sorted.length) {
      container.innerHTML = `
        <div class="card empty-card">
          <i class="ti ti-trophy" style="font-size: 48px;"></i>
          <p>Aucun classement disponible</p>
        </div>
      `;
      return;
    }
    
    const isAr = currentLanguage === 'ar';
    const rows = sorted.map((club, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${club.clubName}</strong> (${club.clubCode})</td>n 
        <td>🥇 ${club.gold}</td>
        <td>🥈 ${club.silver}</td>
        <td>🥉 ${club.bronze}</td>
        <td><strong>${club.points}</strong></td>
      </tr>
    `).join('');
    
    container.innerHTML = `
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>${isAr ? 'النادي' : 'Club'}</th>
                <th>🥇 ${isAr ? 'ذهبية' : 'Or'}</th>
                <th>🥈 ${isAr ? 'فضية' : 'Argent'}</th>
                <th>🥉 ${isAr ? 'برونزية' : 'Bronze'}</th>
                <th>${isAr ? 'نقاط' : 'Points'}</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Erreur loadClubRankings:', err);
    container.innerHTML = '<div class="error-msg">Erreur de chargement</div>';
  }
}
// ==================== RENDU DES SECTIONS ====================

// ===== RÉSULTATS =====
// ===== RENDER LA SECTION RÉSULTATS =====
window.renderResults = function() {
  setSidebarActive('sb-results');
  
  // Cacher toutes les autres sections
  document.querySelectorAll('#results-section, #diplomas-section, #reports-section, #club-rankings-section, #verification-section').forEach(el => {
    if (el) el.style.display = 'none';
  });
  
  // Afficher la section résultats (NE PAS CLONER)
  const section = document.getElementById('results-section');
  if (section) {
    section.style.display = 'block';
    
    // Mettre le contenu dans main-content - utilisation directe
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '';
    mainContent.appendChild(section);  // <-- Utiliser directement, PAS cloneNode()
    
    // Charger les compétitions dans le filtre
    const compSelect = document.getElementById('filter-results-competition');
    if (compSelect) {
      compSelect.innerHTML = '<option value="">-- Sélectionner --</option>';
      if (typeof COMPETITIONS !== 'undefined' && COMPETITIONS.length > 0) {
        COMPETITIONS.forEach(c => {
          compSelect.innerHTML += `<option value="${c.id}">${c.name} (${c.name_en})</option>`;
        });
      }
    }
    
    // Recharger les participants
    setTimeout(loadResultsParticipants, 100);
  }
}

// ===== RENDER DIPLÔMES =====
window.renderDiplomas = function() {
  setSidebarActive('sb-diplomas');
  
  document.querySelectorAll('#results-section, #diplomas-section, #reports-section, #club-rankings-section, #verification-section').forEach(el => {
    if (el) el.style.display = 'none';
  });
  
  const section = document.getElementById('diplomas-section');
  if (section) {
    section.style.display = 'block';
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '';
    mainContent.appendChild(section);  // <-- Utiliser directement, PAS cloneNode()
    
    const compSelect = document.getElementById('diploma-competition');
    if (compSelect) {
      compSelect.innerHTML = '<option value="">-- Sélectionner --</option>';
      if (typeof COMPETITIONS !== 'undefined' && COMPETITIONS.length > 0) {
        COMPETITIONS.forEach(c => {
          compSelect.innerHTML += `<option value="${c.id}">${c.name} (${c.name_en})</option>`;
        });
      }
    }
  }
}
// ===== RENDER RAPPORTS =====
window.renderReports = function() {
  setSidebarActive('sb-reports');
  
  document.querySelectorAll('#results-section, #diplomas-section, #reports-section, #club-rankings-section, #verification-section').forEach(el => {
    if (el) el.style.display = 'none';
  });
  
  const section = document.getElementById('reports-section');
  if (section) {
    section.style.display = 'block';
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '';
    mainContent.appendChild(section);  // <-- Utiliser directement, PAS cloneNode()
    
    const compSelect = document.getElementById('report-competition');
    if (compSelect) {
      compSelect.innerHTML = '<option value="">-- Sélectionner --</option>';
      if (typeof COMPETITIONS !== 'undefined' && COMPETITIONS.length > 0) {
        COMPETITIONS.forEach(c => {
          compSelect.innerHTML += `<option value="${c.id}">${c.name} (${c.name_en})</option>`;
        });
      }
    }
  }
}
// ===== RENDER CLASSEMENT =====
window.renderRankings = function() {
  setSidebarActive('sb-rankings');
  
  document.querySelectorAll('#results-section, #diplomas-section, #reports-section, #club-rankings-section, #verification-section').forEach(el => {
    if (el) el.style.display = 'none';
  });
  
  const section = document.getElementById('club-rankings-section');
  if (section) {
    section.style.display = 'block';
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '';
    mainContent.appendChild(section);  // <-- Utiliser directement, PAS cloneNode()
    
    const compSelect = document.getElementById('rankings-competition');
    if (compSelect) {
      compSelect.innerHTML = '<option value="">-- Toutes --</option>';
      if (typeof COMPETITIONS !== 'undefined' && COMPETITIONS.length > 0) {
        COMPETITIONS.forEach(c => {
          compSelect.innerHTML += `<option value="${c.id}">${c.name} (${c.name_en})</option>`;
        });
      }
    }
    setTimeout(loadClubRankings, 100);
  }
}
// ==================== RÉSULTATS - FONCTIONS MANQUANTES ====================

// ===== APPLIQUER LES FILTRES =====
window.applyResultsFilters = function() {
  loadResultsParticipants();
}

// ===== FILTRER LES RÉSULTATS =====
window.filterResults = function() {
  loadResultsParticipants();
}

// ===== CHARGER LES CATÉGORIES POUR LES RÉSULTATS =====
window.loadResultsCategories = function() {
  const compId = document.getElementById('filter-results-competition').value;
  if (!compId) {
    document.getElementById('results-tbody').innerHTML = '<tr><td colspan="8">Sélectionnez une compétition</td></tr>';
    return;
  }
  
  const catSelect = document.getElementById('filter-results-category');
  catSelect.innerHTML = '<option value="">-- Toutes --</option>';
  
  const comp = COMPETITIONS.find(c => c.id === parseInt(compId));
  if (comp && comp.category_ids) {
    comp.category_ids.forEach(cid => {
      const cat = CATEGORIES.find(c => c.id === cid);
      if (cat) {
        catSelect.innerHTML += `<option value="${cat.id}">${cat.name_fr} (${cat.poids_fr})</option>`;
      }
    });
  }
  loadResultsParticipants();
}

// ==================== CHARGER LES PARTICIPANTS POUR LES RÉSULTATS ====================
window.loadResultsParticipants = async function() {
  const compId = document.getElementById('filter-results-competition').value;
  const catId = document.getElementById('filter-results-category').value;
  const weightMin = parseFloat(document.getElementById('filter-weight-min').value) || 0;
  const weightMax = parseFloat(document.getElementById('filter-weight-max').value) || 1000;
  
  const tbody = document.getElementById('results-tbody');
  
  if (!compId) {
    tbody.innerHTML = '<tr><td colspan="8">Sélectionnez une compétition</td></tr>';
    return;
  }
  
  console.log('🔍 Chargement résultats pour compétition:', compId);
  
  try {
    // 1. Récupérer les résultats existants pour cette compétition
    const { data: existingResults, error: resultsError } = await sbClient
      .from('results')
      .select('*')
      .eq('competition_id', parseInt(compId));
    
    if (resultsError) throw resultsError;
    
    console.log('📊 Résultats existants:', existingResults);
    
    // Créer un mapping des résultats existants par nom de participant
    const resultsMap = {};
    if (existingResults) {
      existingResults.forEach(r => {
        resultsMap[r.participant_name.trim()] = {
          rank: r.rank,
          position: r.position,
          medal: r.medal,
          id: r.id,
          club_id: r.club_id,
          category_id: r.category_id
        };
      });
    }
    
    
    // 2. Récupérer les inscriptions
    const { data: registrations, error } = await sbClient
      .from('registrations')
      .select('*')
      .eq('competition_id', parseInt(compId));
    
    if (error) throw error;
    
    
    if (!registrations || registrations.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8">Aucun participant trouvé</td></tr>';
      return;
    }
    
    // 3. Récupérer les clubs
    const { data: clubs } = await sbClient.from('clubs').select('id, name, club_code');
    const clubsMap = {};
    clubs.forEach(c => clubsMap[c.id] = c);
    
    const participants = [];
    registrations.forEach(reg => {
      const club = clubsMap[reg.club_id];
      reg.participants.forEach(p => {
        const weight = parseFloat(p.weight);
        if ((isNaN(weight) || weight >= weightMin) && (isNaN(weight) || weight < weightMax)) {
          if (!catId || (p.category_id && p.category_id.toString() === catId)) {
            // Vérifier si ce participant a déjà un résultat
            const existingResult = resultsMap[p.name.trim()];
            
            
            participants.push({
              ...p,
              clubName: club?.name || 'Inconnu',
              clubCode: club?.club_code || '?',
              clubId: reg.club_id,
              registrationId: reg.id,
              existingRank: existingResult?.rank || null,
              existingPosition: existingResult?.position || null,
              existingMedal: existingResult?.medal || null,
              resultId: existingResult?.id || null
            });
          }
        }
      });
    });
    
    
    currentResultsParticipants = participants;
    
    // 4. Initialiser selectedRankings avec les résultats existants
    const medals = { 1: '🥇 Or', 2: '🥈 Argent', 3: '🥉 Bronze', 4: '🥉 Bronze' };
    const positions = { 1: '1er', 2: '2ème', 3: '3ème', 4: '3ème' };
    
    selectedRankings = {};
    participants.forEach((p, idx) => {
      if (p.existingRank) {
        selectedRankings[idx] = {
          rank: p.existingRank,
          position: p.existingPosition || positions[p.existingRank],
          medal: p.existingMedal || medals[p.existingRank],
          participant: p,
          resultId: p.resultId
        };
        console.log(`✅ Résultat chargé pour ${p.name}: ${selectedRankings[idx].medal}`);
      }
    });
    
    renderResultsTable(participants);
    
  } catch (err) {
    console.error('Erreur loadResultsParticipants:', err);
    tbody.innerHTML = '<tr><td colspan="8">Erreur de chargement</td></tr>';
  }
}

// ==================== RENDRE LE TABLEAU DES RÉSULTATS ====================
function renderResultsTable(participants) {
  const tbody = document.getElementById('results-tbody');
  if (!participants || participants.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8">Aucun participant trouvé</td></tr>';
    return;
  }
  
  const isAr = currentLanguage === 'ar';
  
  const rows = participants.map((p, idx) => {
    const savedRank = selectedRankings[idx] || {};
    const existingRank = p.existingRank || null;
    
    let selectedValue = '';
    if (savedRank.rank) {
      selectedValue = savedRank.rank;
    } else if (existingRank) {
      selectedValue = existingRank;
    }
    
    let displayMedal = savedRank.medal || p.existingMedal || '—';
    
    // Utiliser le nom formaté de la catégorie
    let categoryDisplay = '—';
    
    // 1. D'abord, essayer d'utiliser le nom déjà formaté existant
    if (p.existingCategoryName) {
      categoryDisplay = p.existingCategoryName;
      console.log(`📝 ${p.name} utilise le nom existant: "${categoryDisplay}"`);
    }
    // 2. Sinon, formater à partir de l'ID
    else if (p.category_id) {
      categoryDisplay = getFullCategoryDisplay(p.category_id);
      console.log(`📝 ${p.name} formaté à partir de l'ID: "${categoryDisplay}"`);
    }
    // 3. Fallback
    else if (p.category) {
      categoryDisplay = p.category;
    }
    
    return `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${p.name}</strong></td>
        <td>${p.clubName}</td>
        <td>${p.weight ? p.weight + ' kg' : '—'}</td>
        <td>${categoryDisplay}</td>
        <td>
          <select class="rank-select" data-idx="${idx}" onchange="updateRank(${idx}, this.value)">
            <option value="">—</option>
            <option value="1" ${selectedValue == 1 ? 'selected' : ''}>🥇 1er</option>
            <option value="2" ${selectedValue == 2 ? 'selected' : ''}>🥈 2ème</option>
            <option value="3" ${selectedValue == 3 ? 'selected' : ''}>🥉 3ème</option>
            <option value="4" ${selectedValue == 4 ? 'selected' : ''}>🥉 3ème</option>
          </select>
        </td>
        <td id="medal-${idx}">${displayMedal}</td>
        <td>
          <button class="btn-primary btn-sm" onclick="setRank(${idx}, 1)" title="1er">🥇</button>
          <button class="btn-primary btn-sm" onclick="setRank(${idx}, 2)" title="2ème">🥈</button>
          <button class="btn-primary btn-sm" onclick="setRank(${idx}, 3)" title="3ème">🥉</button>
          <button class="btn-red btn-sm" onclick="clearRank(${idx})" title="Effacer">✕</button>
        </td>
      </tr>
    `;
  }).join('');
  
  tbody.innerHTML = rows;
}
// ===== METTRE À JOUR LE RANG =====
window.updateRank = function(idx, rank) {
  const medals = { 1: '🥇 Or', 2: '🥈 Argent', 3: '🥉 Bronze', 4: '🥉 Bronze' };
  const positions = { 1: 'المرتبة الأولى', 2: 'المرتبة الثانية', 3: 'المرتبة الثالثة', 4: 'المرتبة الثالثة' };
  
  const medalEl = document.getElementById(`medal-${idx}`);
  
  if (rank && medals[rank]) {
    selectedRankings[idx] = { 
      rank: parseInt(rank), 
      position: positions[rank], 
      medal: medals[rank],
      participant: currentResultsParticipants[idx]
    };
    medalEl.textContent = medals[rank];
  } else {
    delete selectedRankings[idx];
    medalEl.textContent = '—';
  }
}

// ==================== DÉFINIR LE RANG ====================
window.setRank = function(idx, rank) {
  const select = document.querySelector(`.rank-select[data-idx="${idx}"]`);
  if (select) {
    select.value = rank;
    updateRank(idx, rank);
  }
}

// ==================== EFFACER LE RANG ====================
window.clearRank = function(idx) {
  const select = document.querySelector(`.rank-select[data-idx="${idx}"]`);
  if (select) {
    select.value = '';
    updateRank(idx, '');
  }
}

// ===== CHARGER LES CATÉGORIES POUR LES DIPLÔMES =====
window.loadDiplomaCategories = function() {
  const compId = document.getElementById('diploma-competition').value;
  const catSelect = document.getElementById('diploma-category');
  catSelect.innerHTML = '<option value="">-- Toutes --</option>';
  
  if (!compId) return;
  
  const comp = COMPETITIONS.find(c => c.id === parseInt(compId));
  if (comp && comp.category_ids) {
    comp.category_ids.forEach(cid => {
      const cat = CATEGORIES.find(c => c.id === cid);
      if (cat) {
        catSelect.innerHTML += `<option value="${cat.id}">${cat.name_fr} (${cat.poids_fr})</option>`;
      }
    });
  }
}

// ===== APERÇU DES DIPLÔMES AVEC ORDRE DES CATÉGORIES =====
window.previewDiplomas = function() {
  const compId = document.getElementById('diploma-competition').value;
  const preview = document.getElementById('diploma-preview');
  
  if (!compId) {
    preview.innerHTML = '<p>Sélectionnez une compétition</p>';
    return;
  }
  
  const results = getRankedResults(compId);
  
  if (!results || results.length === 0) {
    preview.innerHTML = '<p>Aucun résultat trouvé</p>';
    return;
  }
  
  // Grouper par catégorie
  const categoryGroups = {};
  results.forEach(r => {
    const catId = r.category_id || 'unknown';
    if (!categoryGroups[catId]) {
      const cat = CATEGORIES.find(c => c.id === catId);
      categoryGroups[catId] = {
        id: catId,
        name: cat?.name_fr || 'Catégorie',
        nameAR: cat?.name_ar || cat?.name_fr || 'فئة',
        parentName: cat?.parent_id ? CATEGORIES.find(p => p.id === cat.parent_id)?.name_fr || '' : cat?.name_fr || '',
        parentNameAR: cat?.parent_id ? CATEGORIES.find(p => p.id === cat.parent_id)?.name_ar || '' : cat?.name_ar || cat?.name_fr || '',
        poidsMin: parseFloat(cat?.poids_min) || 0,
        poidsMax: parseFloat(cat?.poids_max) || 0,
        results: []
      };
    }
    categoryGroups[catId].results.push(r);
  });
  
  // Trier les catégories
  const sortedCategories = sortCategories(Object.values(categoryGroups));
  
  let html = '';
  sortedCategories.forEach(cat => {
    const sortedResults = cat.results.sort((a, b) => (a.rank || 999) - (b.rank || 999));
    const categoryName = cat.parentNameAR ? `${cat.parentNameAR} - ${cat.nameAR}` : cat.nameAR;
    
    html += `
      <div style="margin-bottom: 30px;">
        <h4 style="color: #0c5c3a; border-bottom: 2px solid #e3c794; padding-bottom: 6px; font-size: 16px;">
          🏆 ${categoryName}
        </h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 10px;">
          ${sortedResults.map(r => `
            <div class="diploma-card" style="border: 2px solid var(--gold-500); border-radius: 12px; padding: 15px; text-align: center; background: var(--paper-50);">
              <div style="font-size: 14px; color: var(--green-800); font-weight: 700;">🏆 ${r.medal}</div>
              <div style="font-size: 18px; font-weight: 700; margin: 8px 0;">${r.participant_name}</div>
              <div style="font-size: 13px; color: var(--ink-500);">${r.clubName}</div>
              <div style="font-size: 13px; font-weight: 600; color: var(--green-700);">${r.position}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });
  
  preview.innerHTML = html || '<p>Aucun diplôme à afficher</p>';
}

// ===== GÉNÉRER LES DIPLÔMES PDF =====
window.generateDiplomasPDF = function() {
  const compId = document.getElementById('diploma-competition').value;
  
  if (!compId) {
    showFlash('Sélectionnez une compétition', 'err');
    return;
  }
  
  const results = getRankedResults(compId);
  
  if (!results || results.length === 0) {
    showFlash('Aucun résultat trouvé', 'err');
    return;
  }
  
  const comp = COMPETITIONS.find(c => c.id === parseInt(compId));
  
  // Utiliser jsPDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('landscape', 'mm', 'a4');
  
  results.forEach((result, index) => {
    if (index > 0) doc.addPage();
    
    // Fond blanc
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 297, 210, 'F');
    
    // Cadre doré
    doc.setDrawColor(201, 160, 99);
    doc.setLineWidth(1.5);
    doc.rect(10, 10, 277, 190);
    
    // Cadre intérieur
    doc.setDrawColor(201, 160, 99);
    doc.setLineWidth(0.5);
    doc.rect(15, 15, 267, 180);
    
    // Titre
    doc.setFontSize(32);
    doc.setTextColor(12, 92, 58);
    doc.text('🏆 DIPLÔME', 148.5, 45, { align: 'center' });
    
    // Nom
    doc.setFontSize(26);
    doc.setTextColor(21, 25, 26);
    doc.text(result.participant_name, 148.5, 75, { align: 'center' });
    
    // Détails
    doc.setFontSize(14);
    doc.setTextColor(58, 65, 64);
    doc.text(`a obtenu la ${result.position} place`, 148.5, 95, { align: 'center' });
    doc.text(`Catégorie: ${result.category}`, 148.5, 110, { align: 'center' });
    doc.text(`Compétition: ${comp?.name || 'Competition'}`, 148.5, 120, { align: 'center' });
    doc.text(`Club: ${result.clubName}`, 148.5, 130, { align: 'center' });
    
    // Médaille
    doc.setFontSize(48);
    doc.text(result.medal, 148.5, 160, { align: 'center' });
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Généré le ${new Date().toLocaleDateString()}`, 148.5, 185, { align: 'center' });
  });
  
  doc.save(`Diplomes_${comp?.name_en?.replace(/[^a-z0-9]/gi, '_') || 'competition'}.pdf`);
  showFlash(`✅ ${results.length} diplômes générés`);
}

// ===== EXPORTER LES DIPLÔMES EXCEL =====
window.exportDiplomasExcel = function() {
  const compId = document.getElementById('diploma-competition').value;
  
  if (!compId) {
    showFlash('Sélectionnez une compétition', 'err');
    return;
  }
  
  const results = getRankedResults(compId);
  
  if (!results || results.length === 0) {
    showFlash('Aucun résultat trouvé', 'err');
    return;
  }
  
  const comp = COMPETITIONS.find(c => c.id === parseInt(compId));
  
  const data = [
    ['الاسم واللقب', 'النادي', 'الفئة', 'الرتبة', 'الميدالية']
  ];
  
  results.forEach(r => {
    data.push([r.participant_name, r.clubName, r.category, r.position, r.medal]);
  });
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 20 }];
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Diplômes');
  XLSX.writeFile(wb, `Diplomes_${comp?.name_en?.replace(/[^a-z0-9]/gi, '_') || 'competition'}.xlsx`);
  showFlash('✅ Export Excel terminé');
}

// ===== OBTENIR LES RÉSULTATS CLASSÉS =====
function getRankedResults(compId, catId = null) {
  const results = [];
  const selected = Object.values(selectedRankings);
  
  selected.forEach(r => {
    if (r.participant && r.rank) {
      // Vérifier si la catégorie correspond
      if (catId && r.participant.category_id && r.participant.category_id.toString() !== catId) {
        return;
      }
      results.push({
        participant_name: r.participant.name,
        clubName: r.participant.clubName || 'Inconnu',
        category: r.participant.category || 'À déterminer',
        position: r.position,
        medal: r.medal,
        rank: r.rank
      });
    }
  });
  
  // Trier par rang
  results.sort((a, b) => a.rank - b.rank);
  return results;
}

// ==================== GÉNÉRER LE RAPPORT COMPLET (AVEC STATISTIQUES) ====================
window.generateReport = async function() {
  const compId = document.getElementById('report-competition').value;
  const container = document.getElementById('report-content');
  const isAr = currentLanguage === 'ar';
  
  if (!compId) {
    container.innerHTML = `
      <div class="report-placeholder" style="text-align:center;padding:50px;color:#999;">
        <i class="ti ti-file-description" style="font-size:48px;display:block;margin-bottom:10px;"></i>
        <p>${isAr ? 'اختر مسابقة لعرض التقرير' : 'Sélectionnez une compétition pour générer le rapport'}</p>
      </div>
    `;
    return;
  }
  
  try {
    showFlash(isAr ? 'جاري تحميل البيانات...' : 'Chargement des données...', 'ok');
    
    // 1. Récupérer les données
    const [registrationsRes, clubsRes, resultsRes] = await Promise.all([
      sbClient.from('registrations').select('*').eq('competition_id', parseInt(compId)),
      sbClient.from('clubs').select('id, name, club_code, wilaya, responsable, phone, email'),
      sbClient.from('results').select('*').eq('competition_id', parseInt(compId))
    ]);
    
    if (registrationsRes.error) throw registrationsRes.error;
    if (clubsRes.error) throw clubsRes.error;
    if (resultsRes.error) throw resultsRes.error;
    
    const registrations = registrationsRes.data || [];
    const clubs = clubsRes.data || [];
    const results = resultsRes.data || [];
    
    if (registrations.length === 0) {
      container.innerHTML = `
        <div class="report-placeholder" style="text-align:center;padding:50px;color:#999;">
          <i class="ti ti-file-description" style="font-size:48px;display:block;margin-bottom:10px;"></i>
          <p>${isAr ? 'لا توجد مشاركات لهذه المسابقة' : 'Aucune inscription pour cette compétition'}</p>
        </div>
      `;
      return;
    }
    
    const comp = COMPETITIONS.find(c => c.id === parseInt(compId));
    const clubsMap = {};
    clubs.forEach(c => clubsMap[c.id] = c);
    
    // 2. Extraire TOUS les participants
    let allParticipants = [];
    const resultsMap = {};
    results.forEach(r => {
      resultsMap[r.participant_name.trim()] = {
        rank: r.rank,
        position: r.position,
        medal: r.medal,
        club_id: r.club_id,
        category_id: r.category_id,
        category_name: r.category_name
      };
    });
    
    registrations.forEach(reg => {
      const club = clubsMap[reg.club_id];
      reg.participants.forEach(p => {
        const result = resultsMap[p.name.trim()];
        allParticipants.push({
          ...p,
          clubName: club?.name || 'غير معروف',
          clubCode: club?.club_code || '?',
          clubId: reg.club_id,
          clubWilaya: club?.wilaya || 'غير معروفة',
          clubResponsable: club?.responsable || 'غير معروف',
          clubPhone: club?.phone || 'غير متوفر',
          clubEmail: club?.email || 'غير متوفر',
          rank: result?.rank || null,
          position: result?.position || null,
          medal: result?.medal || null,
          category_id: result?.category_id || p.category_id || null,
          category_name: result?.category_name || p.category || 'غير محددة',
          hasResult: !!result
        });
      });
    });
    
    // 3. Statistiques
    const totalParticipants = allParticipants.length;
    const totalWithResults = allParticipants.filter(p => p.hasResult).length;
    
    // Statistiques par club
    const clubStats = {};
    allParticipants.forEach(p => {
      if (p.clubId) {
        if (!clubStats[p.clubId]) {
          clubStats[p.clubId] = {
            name: p.clubName,
            code: p.clubCode,
            wilaya: p.clubWilaya,
            responsable: p.clubResponsable,
            phone: p.clubPhone,
            email: p.clubEmail,
            total: 0,
            withResults: 0,
            gold: 0,
            silver: 0,
            bronze: 0,
            points: 0
          };
        }
        clubStats[p.clubId].total++;
        if (p.hasResult) {
          clubStats[p.clubId].withResults++;
          if (p.rank === 1) { clubStats[p.clubId].gold++; clubStats[p.clubId].points += 5; }
          else if (p.rank === 2) { clubStats[p.clubId].silver++; clubStats[p.clubId].points += 3; }
          else if (p.rank === 3 || p.rank === 4) { clubStats[p.clubId].bronze++; clubStats[p.clubId].points += 1; }
        }
      }
    });
    
    const sortedClubs = Object.values(clubStats).sort((a, b) => b.points - a.points);
    const totalClubs = Object.keys(clubStats).length;
    
    // Statistiques par wilaya
    const wilayaStats = {};
    allParticipants.forEach(p => {
      if (p.clubWilaya && p.clubWilaya !== 'غير معروفة') {
        if (!wilayaStats[p.clubWilaya]) {
          wilayaStats[p.clubWilaya] = { total: 0, withResults: 0, gold: 0, silver: 0, bronze: 0 };
        }
        wilayaStats[p.clubWilaya].total++;
        if (p.hasResult) {
          wilayaStats[p.clubWilaya].withResults++;
          if (p.rank === 1) wilayaStats[p.clubWilaya].gold++;
          else if (p.rank === 2) wilayaStats[p.clubWilaya].silver++;
          else if (p.rank === 3 || p.rank === 4) wilayaStats[p.clubWilaya].bronze++;
        }
      }
    });
    
    const sortedWilayas = Object.entries(wilayaStats).sort((a, b) => b[1].total - a[1].total);
    const totalWilayas = sortedWilayas.length;
    
    // Statistiques par catégorie
    const categoryStats = {};
    allParticipants.forEach(p => {
      const catId = p.category_id || 'unknown';
      const catName = p.category_name || p.category || 'غير محددة';
      const key = catId + '_' + catName;
      if (!categoryStats[key]) {
        categoryStats[key] = {
          id: catId,
          name: catName,
          total: 0,
          withResults: 0,
          gold: 0,
          silver: 0,
          bronze: 0
        };
      }
      categoryStats[key].total++;
      if (p.hasResult) {
        categoryStats[key].withResults++;
        if (p.rank === 1) categoryStats[key].gold++;
        else if (p.rank === 2) categoryStats[key].silver++;
        else if (p.rank === 3 || p.rank === 4) categoryStats[key].bronze++;
      }
    });
    
    const sortedCategories = Object.values(categoryStats).sort((a, b) => b.total - a.total);
    
    // Médailles totales
    const medalStats = { gold: 0, silver: 0, bronze: 0 };
    allParticipants.filter(p => p.hasResult).forEach(p => {
      if (p.rank === 1) medalStats.gold++;
      else if (p.rank === 2) medalStats.silver++;
      else if (p.rank === 3 || p.rank === 4) medalStats.bronze++;
    });
    
    // 4. Grouper les résultats par catégorie pour l'affichage
    const resultsByCategory = {};
    allParticipants.filter(p => p.hasResult).forEach(p => {
      const catId = p.category_id || 'unknown';
      if (!resultsByCategory[catId]) {
        const cat = CATEGORIES.find(c => c.id === catId);
        resultsByCategory[catId] = {
          id: catId,
          name: cat?.name_fr || 'فئة غير محددة',
          nameAR: cat?.name_ar || cat?.name_fr || 'فئة غير محددة',
          parentName: cat?.parent_id ? CATEGORIES.find(p => p.id === cat.parent_id)?.name_fr || '' : cat?.name_fr || '',
          parentNameAR: cat?.parent_id ? CATEGORIES.find(p => p.id === cat.parent_id)?.name_ar || '' : cat?.name_ar || cat?.name_fr || '',
          poidsMin: parseFloat(cat?.poids_min) || 0,
          poidsMax: parseFloat(cat?.poids_max) || 0,
          results: []
        };
      }
      resultsByCategory[catId].results.push(p);
    });
    
    // Trier les catégories
    const sortedResultCategories = sortCategories(Object.values(resultsByCategory));
    
    // 5. Générer le HTML des résultats par catégorie
    let resultsHTML = '';
    sortedResultCategories.forEach(cat => {
      const sortedResults = cat.results.sort((a, b) => (a.rank || 999) - (b.rank || 999));
      
      const rankGroups = {};
      sortedResults.forEach(r => {
        const rank = r.rank || 0;
        if (!rankGroups[rank]) rankGroups[rank] = [];
        rankGroups[rank].push(r);
      });
      
      const rankOrder = [1, 2, 3, 4];
      let categoryRankHTML = '';
      rankOrder.forEach(rank => {
        if (rankGroups[rank] && rankGroups[rank].length > 0) {
          const participants = rankGroups[rank];
          const rankText = RANK_TEXT_AR[rank] || `المرتبة ${rank}`;
          
          categoryRankHTML += `
            <div style="margin: 8px 0 4px 0; font-weight: bold; color: #0c5c3a; font-size: 14px; border-bottom: 1px dashed #e3ded2; padding-bottom: 4px;">
              ${rankText} (${participants.length})
            </div>
            <div style="margin-right: 20px;">
              ${participants.map(p => `
                <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f5f3ef; font-size: 13px;">
                  <span style="font-weight: 500;">${p.name}</span>
                  <span style="color: #3a4140;">${p.clubName}</span>
                  <span style="color: #6b7472; font-size: 12px;">${p.clubWilaya}</span>
                </div>
              `).join('')}
            </div>
          `;
        }
      });
      
      const categoryDisplayName = cat.parentNameAR ? `${cat.parentNameAR} - ${cat.nameAR}` : cat.nameAR;
      
      resultsHTML += `
        <div style="margin-bottom: 25px; background: #faf8f5; border-radius: 8px; padding: 15px 20px; border-right: 4px solid #0c5c3a;">
          <div style="font-size: 17px; font-weight: bold; color: #06311f; margin-bottom: 10px;">
            🏆 ${categoryDisplayName}
          </div>
          ${categoryRankHTML || '<div style="color: #999; font-size: 13px;">لا توجد نتائج</div>'}
        </div>
      `;
    });
    
    // 6. Générer le HTML du classement des clubs
    let clubRankingHTML = '';
    sortedClubs.forEach((club, idx) => {
      clubRankingHTML += `
        <tr style="${idx === 0 ? 'background: #f5ede0;' : (idx % 2 === 0 ? 'background: #faf8f5;' : '')}">
          <td style="padding: 8px 12px; text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="padding: 8px 12px; font-weight: 600;">${club.name}</td>
          <td style="padding: 8px 12px; text-align: center;">${club.code}</td>
          <td style="padding: 8px 12px; text-align: center;">${club.wilaya}</td>
          <td style="padding: 8px 12px; text-align: center; color: #c9a063; font-weight: bold;">${club.gold}</td>
          <td style="padding: 8px 12px; text-align: center; color: #b0b0b0; font-weight: bold;">${club.silver}</td>
          <td style="padding: 8px 12px; text-align: center; color: #cd7f32; font-weight: bold;">${club.bronze}</td>
          <td style="padding: 8px 12px; text-align: center; font-weight: bold; color: #0c5c3a; font-size: 16px;">${club.points}</td>
        </tr>
      `;
    });
    
    // 7. Générer le HTML final du rapport
    const html = `
      <div style="direction: rtl; font-family: 'Cairo', 'Arial', sans-serif; max-width: 1100px; margin: 0 auto; padding: 20px; background: white; direction: rtl;">
        
        <!-- ===== EN-TÊTE ===== -->
        <div style="text-align: center; padding-bottom: 25px; border-bottom: 3px solid #0c5c3a; margin-bottom: 25px; position: relative;">
          <!-- Logos -->
          <div style="display: flex; align-items: center; justify-content: center; gap: 30px; margin-bottom: 15px; flex-wrap: wrap;">
            <img src="${LOGO_BASE64}" alt="Logo" style="height: 75px; width: 75px; object-fit: contain;">
            <div style="text-align: center;">
              <div style="font-size: 16px; font-weight: bold; color: #06311f; letter-spacing: 0.5px;">الجمهورية الجزائرية الديمقراطية الشعبية</div>
              <div style="font-size: 13px; color: #3a4140;">وزارة الرياضة</div>
              <div style="font-size: 13px; color: #3a4140;">الاتحادية الجزائرية للكراتي دو</div>
              <div style="font-size: 19px; font-weight: bold; color: #0c5c3a; margin-top: 5px;">اللجنة الوطنية للكيوكوشين كاي</div>
            </div>
            <img src="${KARATE_BASE64}" alt="Karate" style="height: 75px; width: 75px; object-fit: contain;">
          </div>
          
          <!-- Titre compétition -->
          <div style="margin-top: 10px;">
            <div style="font-size: 26px; font-weight: bold; color: #06311f;">${comp?.name || 'مسابقة'}</div>
            <div style="font-size: 16px; color: #6b7472; letter-spacing: 1px;">${comp?.name_en || ''}</div>
            <div style="display: flex; justify-content: center; gap: 30px; margin-top: 8px; color: #3a4140; font-size: 14px; flex-wrap: wrap;">
              <span><i class="ti ti-calendar"></i> التاريخ: ${fmtDate(comp?.date_start)} ${comp?.date_end ? `→ ${fmtDate(comp?.date_end)}` : ''}</span>
              <span><i class="ti ti-map-pin"></i> المكان: ${comp?.wilaya || '—'}</span>
            </div>
          </div>
        </div>
        
        <!-- ===== STATISTIQUES GÉNÉRALES ===== -->
        <div style="margin-bottom: 30px;">
          <h3 style="text-align: center; color: #06311f; font-size: 20px; margin-bottom: 15px;">📊 الإحصائيات العامة</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;">
            <div style="background: #f7f5f0; border-radius: 10px; padding: 18px 15px; text-align: center; border: 1px solid #e3ded2;">
              <div style="font-size: 30px; font-weight: bold; color: #0c5c3a;">${totalParticipants}</div>
              <div style="font-size: 13px; color: #6b7472; margin-top: 4px;">👤 إجمالي المشاركين</div>
            </div>
            <div style="background: #f7f5f0; border-radius: 10px; padding: 18px 15px; text-align: center; border: 1px solid #e3ded2;">
              <div style="font-size: 30px; font-weight: bold; color: #0c5c3a;">${totalWithResults}</div>
              <div style="font-size: 13px; color: #6b7472; margin-top: 4px;">🏅 مشاركين مصنفين</div>
            </div>
            <div style="background: #f7f5f0; border-radius: 10px; padding: 18px 15px; text-align: center; border: 1px solid #e3ded2;">
              <div style="font-size: 30px; font-weight: bold; color: #0c5c3a;">${totalClubs}</div>
              <div style="font-size: 13px; color: #6b7472; margin-top: 4px;">🏛️ أندية مشاركة</div>
            </div>
            <div style="background: #f7f5f0; border-radius: 10px; padding: 18px 15px; text-align: center; border: 1px solid #e3ded2;">
              <div style="font-size: 30px; font-weight: bold; color: #0c5c3a;">${totalWilayas}</div>
              <div style="font-size: 13px; color: #6b7472; margin-top: 4px;">🗺️ ولايات مشاركة</div>
            </div>
            <div style="background: #f7f5f0; border-radius: 10px; padding: 18px 15px; text-align: center; border: 1px solid #e3ded2;">
              <div style="font-size: 30px; font-weight: bold; color: #c9a063;">${medalStats.gold}</div>
              <div style="font-size: 13px; color: #6b7472; margin-top: 4px;">🥇 ميداليات ذهبية</div>
            </div>
            <div style="background: #f7f5f0; border-radius: 10px; padding: 18px 15px; text-align: center; border: 1px solid #e3ded2;">
              <div style="font-size: 30px; font-weight: bold; color: #b0b0b0;">${medalStats.silver}</div>
              <div style="font-size: 13px; color: #6b7472; margin-top: 4px;">🥈 ميداليات فضية</div>
            </div>
            <div style="background: #f7f5f0; border-radius: 10px; padding: 18px 15px; text-align: center; border: 1px solid #e3ded2;">
              <div style="font-size: 30px; font-weight: bold; color: #cd7f32;">${medalStats.bronze}</div>
              <div style="font-size: 13px; color: #6b7472; margin-top: 4px;">🥉 ميداليات برونزية</div>
            </div>
          </div>
        </div>
        
        <!-- ===== STATISTIQUES PAR CLUB ===== -->
        <div style="margin-bottom: 25px;">
          <h4 style="color: #06311f; font-size: 17px; border-bottom: 2px solid #e3c794; padding-bottom: 8px; margin-bottom: 12px;">
            🏛️ توزيع المشاركين حسب النادي
          </h4>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="background: #0c5c3a; color: white;">
                  <th style="padding: 10px 12px; text-align: right;">النادي</th>
                  <th style="padding: 10px 12px; text-align: center;">الرمز</th>
                  <th style="padding: 10px 12px; text-align: center;">الولاية</th>
                  <th style="padding: 10px 12px; text-align: center;">المشاركين</th>
                  <th style="padding: 10px 12px; text-align: center;">المصنفين</th>
                  <th style="padding: 10px 12px; text-align: center;">🥇</th>
                  <th style="padding: 10px 12px; text-align: center;">🥈</th>
                  <th style="padding: 10px 12px; text-align: center;">🥉</th>
                  <th style="padding: 10px 12px; text-align: center;">نقاط</th>
                </tr>
              </thead>
              <tbody>
                ${sortedClubs.map((club, idx) => `
                  <tr style="${idx % 2 === 0 ? 'background: #faf8f5;' : ''}">
                    <td style="padding: 8px 12px; font-weight: 600;">${club.name}</td>
                    <td style="padding: 8px 12px; text-align: center;">${club.code}</td>
                    <td style="padding: 8px 12px; text-align: center;">${club.wilaya}</td>
                    <td style="padding: 8px 12px; text-align: center; font-weight: bold;">${club.total}</td>
                    <td style="padding: 8px 12px; text-align: center;">${club.withResults}</td>
                    <td style="padding: 8px 12px; text-align: center; color: #c9a063; font-weight: bold;">${club.gold}</td>
                    <td style="padding: 8px 12px; text-align: center; color: #b0b0b0; font-weight: bold;">${club.silver}</td>
                    <td style="padding: 8px 12px; text-align: center; color: #cd7f32; font-weight: bold;">${club.bronze}</td>
                    <td style="padding: 8px 12px; text-align: center; font-weight: bold; color: #0c5c3a;">${club.points}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- ===== STATISTIQUES PAR WILAYA ===== -->
        <div style="margin-bottom: 25px;">
          <h4 style="color: #06311f; font-size: 17px; border-bottom: 2px solid #e3c794; padding-bottom: 8px; margin-bottom: 12px;">
            🗺️ توزيع المشاركين حسب الولاية
          </h4>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="background: #0c5c3a; color: white;">
                  <th style="padding: 10px 12px; text-align: right;">الولاية</th>
                  <th style="padding: 10px 12px; text-align: center;">المشاركين</th>
                  <th style="padding: 10px 12px; text-align: center;">المصنفين</th>
                  <th style="padding: 10px 12px; text-align: center;">🥇</th>
                  <th style="padding: 10px 12px; text-align: center;">🥈</th>
                  <th style="padding: 10px 12px; text-align: center;">🥉</th>
                </tr>
              </thead>
              <tbody>
                ${sortedWilayas.map(([wilaya, stats], idx) => `
                  <tr style="${idx % 2 === 0 ? 'background: #faf8f5;' : ''}">
                    <td style="padding: 8px 12px; font-weight: 600;">${wilaya}</td>
                    <td style="padding: 8px 12px; text-align: center; font-weight: bold;">${stats.total}</td>
                    <td style="padding: 8px 12px; text-align: center;">${stats.withResults}</td>
                    <td style="padding: 8px 12px; text-align: center; color: #c9a063;">${stats.gold}</td>
                    <td style="padding: 8px 12px; text-align: center; color: #b0b0b0;">${stats.silver}</td>
                    <td style="padding: 8px 12px; text-align: center; color: #cd7f32;">${stats.bronze}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- ===== STATISTIQUES PAR CATÉGORIE ===== -->
        <div style="margin-bottom: 25px;">
          <h4 style="color: #06311f; font-size: 17px; border-bottom: 2px solid #e3c794; padding-bottom: 8px; margin-bottom: 12px;">
            📋 توزيع المشاركين حسب الفئة
          </h4>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="background: #0c5c3a; color: white;">
                  <th style="padding: 10px 12px; text-align: right;">الفئة</th>
                  <th style="padding: 10px 12px; text-align: center;">المشاركين</th>
                  <th style="padding: 10px 12px; text-align: center;">المصنفين</th>
                  <th style="padding: 10px 12px; text-align: center;">🥇</th>
                  <th style="padding: 10px 12px; text-align: center;">🥈</th>
                  <th style="padding: 10px 12px; text-align: center;">🥉</th>
                </tr>
              </thead>
              <tbody>
                ${sortedCategories.map((cat, idx) => `
                  <tr style="${idx % 2 === 0 ? 'background: #faf8f5;' : ''}">
                    <td style="padding: 8px 12px; font-weight: 600;">${cat.name}</td>
                    <td style="padding: 8px 12px; text-align: center; font-weight: bold;">${cat.total}</td>
                    <td style="padding: 8px 12px; text-align: center;">${cat.withResults}</td>
                    <td style="padding: 8px 12px; text-align: center; color: #c9a063;">${cat.gold}</td>
                    <td style="padding: 8px 12px; text-align: center; color: #b0b0b0;">${cat.silver}</td>
                    <td style="padding: 8px 12px; text-align: center; color: #cd7f32;">${cat.bronze}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- ===== CLASSEMENT DES CLUBS ===== -->
        <div style="margin-bottom: 25px;">
          <h4 style="color: #06311f; font-size: 17px; border-bottom: 2px solid #e3c794; padding-bottom: 8px; margin-bottom: 12px;">
            🏆 ترتيب الأندية
          </h4>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="background: #0c5c3a; color: white;">
                  <th style="padding: 10px 12px; text-align: center;">#</th>
                  <th style="padding: 10px 12px; text-align: right;">النادي</th>
                  <th style="padding: 10px 12px; text-align: center;">الرمز</th>
                  <th style="padding: 10px 12px; text-align: center;">الولاية</th>
                  <th style="padding: 10px 12px; text-align: center;">🥇</th>
                  <th style="padding: 10px 12px; text-align: center;">🥈</th>
                  <th style="padding: 10px 12px; text-align: center;">🥉</th>
                  <th style="padding: 10px 12px; text-align: center;">نقاط</th>
                </tr>
              </thead>
              <tbody>
                ${clubRankingHTML || '<tr><td colspan="8" style="text-align:center;padding:20px;color:#999;">لا توجد بيانات</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- ===== RÉSULTATS PAR CATÉGORIE ===== -->
        <div style="margin-bottom: 25px;">
          <h4 style="color: #06311f; font-size: 17px; border-bottom: 2px solid #e3c794; padding-bottom: 8px; margin-bottom: 12px;">
            🏅 النتائج حسب الفئة
          </h4>
          ${resultsHTML || '<div style="text-align:center;padding:20px;color:#999;">لا توجد نتائج</div>'}
        </div>
        
        <!-- ===== PIED DE PAGE ===== -->
        <div style="text-align: center; padding-top: 20px; border-top: 2px solid #0c5c3a; color: #6b7472; font-size: 11px; margin-top: 20px;">
          <p style="font-weight: 600; color: #06311f; font-size: 13px;">اللجنة الوطنية للكيوكوشين كاي - الجزائر</p>
          <p>تقرير صادر عن المنصة الرقمية الرسمية</p>
          <p>© ${new Date().getFullYear()} - ${new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        
      </div>
    `;
    
    container.innerHTML = html;
    showFlash(isAr ? '✅ تم إنشاء التقرير بنجاح' : '✅ Rapport généré avec succès', 'ok');
    
  } catch (err) {
    console.error('Erreur generateReport:', err);
    container.innerHTML = `
      <div class="error-msg" style="text-align:center;padding:40px;color:#c41e2e;">
        <i class="ti ti-alert-circle" style="font-size:48px;display:block;margin-bottom:10px;"></i>
        ${isAr ? 'خطأ في إنشاء التقرير' : 'Erreur de génération du rapport'}
        <br><span style="font-size:12px;color:#999;">${err.message}</span>
      </div>
    `;
  }
}
// ==================== EXPORTER RAPPORT PDF (VERSION CORRIGÉE) ====================
window.exportReportPDF = async function() {
  const compId = document.getElementById('report-competition').value;
  const isAr = currentLanguage === 'ar';
  
  if (!compId) {
    showFlash(isAr ? 'اختر مسابقة' : 'Sélectionnez une compétition', 'err');
    return;
  }
  
  showFlash(isAr ? 'جاري إنشاء التقرير...' : 'Génération du rapport en cours...', 'ok');
  
  try {
    // Récupérer les données (même code que generateReport)
    const [registrationsRes, clubsRes, resultsRes] = await Promise.all([
      sbClient.from('registrations').select('*').eq('competition_id', parseInt(compId)),
      sbClient.from('clubs').select('id, name, club_code, wilaya, responsable, phone, email'),
      sbClient.from('results').select('*').eq('competition_id', parseInt(compId))
    ]);
    
    if (registrationsRes.error) throw registrationsRes.error;
    if (clubsRes.error) throw clubsRes.error;
    if (resultsRes.error) throw resultsRes.error;
    
    const registrations = registrationsRes.data || [];
    const clubs = clubsRes.data || [];
    const results = resultsRes.data || [];
    const comp = COMPETITIONS.find(c => c.id === parseInt(compId));
    
    // Traitement des données (même code que generateReport)
    const clubsMap = {};
    clubs.forEach(c => clubsMap[c.id] = c);
    
    // Extraire les participants
    let allParticipants = [];
    const resultsMap = {};
    results.forEach(r => {
      resultsMap[r.participant_name.trim()] = {
        rank: r.rank,
        position: r.position,
        medal: r.medal,
        club_id: r.club_id,
        category_id: r.category_id,
        category_name: r.category_name
      };
    });
    
    registrations.forEach(reg => {
      const club = clubsMap[reg.club_id];
      reg.participants.forEach(p => {
        const result = resultsMap[p.name.trim()];
        allParticipants.push({
          ...p,
          clubName: club?.name || 'غير معروف',
          clubCode: club?.club_code || '?',
          clubId: reg.club_id,
          clubWilaya: club?.wilaya || 'غير معروفة',
          clubResponsable: club?.responsable || 'غير معروف',
          clubPhone: club?.phone || 'غير متوفر',
          clubEmail: club?.email || 'غير متوفر',
          rank: result?.rank || null,
          position: result?.position || null,
          medal: result?.medal || null,
          category_id: result?.category_id || p.category_id || null,
          category_name: result?.category_name || p.category || 'غير محددة',
          hasResult: !!result
        });
      });
    });
    
    // Statistiques
    const totalParticipants = allParticipants.length;
    const totalWithResults = allParticipants.filter(p => p.hasResult).length;
    
    const clubStats = {};
    allParticipants.forEach(p => {
      if (p.clubId) {
        if (!clubStats[p.clubId]) {
          clubStats[p.clubId] = {
            name: p.clubName,
            code: p.clubCode,
            wilaya: p.clubWilaya,
            responsable: p.clubResponsable,
            phone: p.clubPhone,
            email: p.clubEmail,
            total: 0,
            withResults: 0,
            gold: 0,
            silver: 0,
            bronze: 0,
            points: 0
          };
        }
        clubStats[p.clubId].total++;
        if (p.hasResult) {
          clubStats[p.clubId].withResults++;
          if (p.rank === 1) { clubStats[p.clubId].gold++; clubStats[p.clubId].points += 5; }
          else if (p.rank === 2) { clubStats[p.clubId].silver++; clubStats[p.clubId].points += 3; }
          else if (p.rank === 3 || p.rank === 4) { clubStats[p.clubId].bronze++; clubStats[p.clubId].points += 1; }
        }
      }
    });
    
    const sortedClubs = Object.values(clubStats).sort((a, b) => b.points - a.points);
    const totalClubs = Object.keys(clubStats).length;
    
    const wilayaStats = {};
    allParticipants.forEach(p => {
      if (p.clubWilaya && p.clubWilaya !== 'غير معروفة') {
        if (!wilayaStats[p.clubWilaya]) {
          wilayaStats[p.clubWilaya] = { total: 0, withResults: 0, gold: 0, silver: 0, bronze: 0 };
        }
        wilayaStats[p.clubWilaya].total++;
        if (p.hasResult) {
          wilayaStats[p.clubWilaya].withResults++;
          if (p.rank === 1) wilayaStats[p.clubWilaya].gold++;
          else if (p.rank === 2) wilayaStats[p.clubWilaya].silver++;
          else if (p.rank === 3 || p.rank === 4) wilayaStats[p.clubWilaya].bronze++;
        }
      }
    });
    
    const sortedWilayas = Object.entries(wilayaStats).sort((a, b) => b[1].total - a[1].total);
    const totalWilayas = sortedWilayas.length;
    
    const categoryStats = {};
    allParticipants.forEach(p => {
      const catId = p.category_id || 'unknown';
      const catName = p.category_name || p.category || 'غير محددة';
      const key = catId + '_' + catName;
      if (!categoryStats[key]) {
        categoryStats[key] = {
          id: catId,
          name: catName,
          total: 0,
          withResults: 0,
          gold: 0,
          silver: 0,
          bronze: 0
        };
      }
      categoryStats[key].total++;
      if (p.hasResult) {
        categoryStats[key].withResults++;
        if (p.rank === 1) categoryStats[key].gold++;
        else if (p.rank === 2) categoryStats[key].silver++;
        else if (p.rank === 3 || p.rank === 4) categoryStats[key].bronze++;
      }
    });
    
    const sortedCategories = Object.values(categoryStats).sort((a, b) => b.total - a.total);
    
    const medalStats = { gold: 0, silver: 0, bronze: 0 };
    allParticipants.filter(p => p.hasResult).forEach(p => {
      if (p.rank === 1) medalStats.gold++;
      else if (p.rank === 2) medalStats.silver++;
      else if (p.rank === 3 || p.rank === 4) medalStats.bronze++;
    });
    
    // Résultats par catégorie
    const resultsByCategory = {};
    allParticipants.filter(p => p.hasResult).forEach(p => {
      const catId = p.category_id || 'unknown';
      if (!resultsByCategory[catId]) {
        const cat = CATEGORIES.find(c => c.id === catId);
        resultsByCategory[catId] = {
          id: catId,
          name: cat?.name_fr || 'فئة غير محددة',
          nameAR: cat?.name_ar || cat?.name_fr || 'فئة غير محددة',
          parentName: cat?.parent_id ? CATEGORIES.find(p => p.id === cat.parent_id)?.name_fr || '' : cat?.name_fr || '',
          parentNameAR: cat?.parent_id ? CATEGORIES.find(p => p.id === cat.parent_id)?.name_ar || '' : cat?.name_ar || cat?.name_fr || '',
          poidsMin: parseFloat(cat?.poids_min) || 0,
          poidsMax: parseFloat(cat?.poids_max) || 0,
          results: []
        };
      }
      resultsByCategory[catId].results.push(p);
    });
    
    const sortedResultCategories = sortCategories(Object.values(resultsByCategory));
    
    // Générer le HTML des résultats
    let resultsHTML = '';
    sortedResultCategories.forEach(cat => {
      const sortedResults = cat.results.sort((a, b) => (a.rank || 999) - (b.rank || 999));
      
      const rankGroups = {};
      sortedResults.forEach(r => {
        const rank = r.rank || 0;
        if (!rankGroups[rank]) rankGroups[rank] = [];
        rankGroups[rank].push(r);
      });
      
      const rankOrder = [1, 2, 3, 4];
      let categoryRankHTML = '';
      rankOrder.forEach(rank => {
        if (rankGroups[rank] && rankGroups[rank].length > 0) {
          const participants = rankGroups[rank];
          const rankText = RANK_TEXT_AR[rank] || `المرتبة ${rank}`;
          
          categoryRankHTML += `
            <div class="result-rank">${rankText} (${participants.length})</div>
            <div class="result-participants">
              ${participants.map(p => `
                <div class="result-participant">
                  <span class="name">${p.name}</span>
                  <span class="club">${p.clubName}</span>
                  <span class="wilaya">${p.clubWilaya}</span>
                </div>
              `).join('')}
            </div>
          `;
        }
      });
      
      const categoryDisplayName = cat.parentNameAR ? `${cat.parentNameAR} - ${cat.nameAR}` : cat.nameAR;
      
      resultsHTML += `
        <div class="result-category">
          <div class="cat-name">🏆 ${categoryDisplayName}</div>
          ${categoryRankHTML || '<div style="color:#999;font-size:13px;">لا توجد نتائج</div>'}
        </div>
      `;
    });
    
    // Générer le HTML complet
    const reportHTML = generateReportHTMLForPDF(
      compId, comp, allParticipants, sortedClubs, sortedWilayas, 
      sortedCategories, medalStats, totalParticipants, totalWithResults, 
      totalClubs, totalWilayas, resultsHTML
    );
    
    // Créer un conteneur caché
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:1000px;background:white;padding:20px;z-index:9999;';
    document.body.appendChild(container);
    container.innerHTML = reportHTML;
    
    // Attendre le chargement des images
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Utiliser html2canvas
    const html2canvas = window.html2canvas;
    if (html2canvas) {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: 1000,
        height: container.scrollHeight,
        windowWidth: 1000,
        windowHeight: container.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      let page = 1;
      
      while (heightLeft > 0) {
        if (page > 1) doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
        position -= 297;
        page++;
      }
      
      const fileName = `تقرير_${comp?.name_en?.replace(/[^a-z0-9]/gi, '_') || 'competition'}.pdf`;
      doc.save(fileName);
      showFlash('✅ تم إنشاء التقرير بنجاح');
    } else {
      showFlash('html2canvas non chargé', 'err');
    }
    
    document.body.removeChild(container);
    
  } catch (err) {
    console.error('Erreur:', err);
    showFlash('Erreur: ' + err.message, 'err');
  }
}
// ==================== TEST D'AFFICHAGE DU RAPPORT ====================
function testReportDisplay() {
  const compId = document.getElementById('report-competition')?.value;
  if (!compId) {
    alert('Veuillez sélectionner une compétition');
    return;
  }
  
  // Ouvrir le rapport dans une nouvelle fenêtre pour tester
  const comp = COMPETITIONS.find(c => c.id === parseInt(compId));
  const win = window.open('', '_blank', 'width=1000,height=800');
  if (win) {
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Test Rapport</title>
        <style>
          body { font-family: 'Arial', 'Tahoma', sans-serif; padding: 20px; direction: rtl; }
          .report-container { max-width: 1000px; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div id="report-content"></div>
        <script>
          // Copier le contenu du rapport
          const content = document.querySelector('#report-content');
          // ... (le contenu du rapport)
        <\/script>
      </body>
      </html>
    `);
    win.document.close();
  }
}
// ==================== DICTIONNAIRE DE TRADUCTION DES CATÉGORIES ====================
const CATEGORY_TRANSLATIONS = {
  'Poussins': 'براعم',
  'Poussines': 'براعم',
  'Benjamins': 'أشبال',
  'Benjamines': 'أشبال',
  'Minimes': 'مبتدئين',
  'Minimes F': 'مبتدئات',
  'Cadets': 'أواسط',
  'Cadettes': 'أواسط',
  'Juniors': 'شبان',
  'Juniores F': 'شابات',
  'Séniors': 'أكابر',
  'Séniors F': 'أكابر',
  'Vétérans': 'قدامى',
  'Vétérans F': 'قدامى'
};

// ==================== TRADUIRE UN NOM DE CATÉGORIE EN ARABE ====================
function translateCategoryToArabic(categoryName) {
  if (!categoryName || categoryName === '' || categoryName === ' +0 kg') return '—';
  
  let result = categoryName;
  
  for (const [fr, ar] of Object.entries(CATEGORY_TRANSLATIONS)) {
      if (result.includes(fr)) {
          result = result.replace(new RegExp(fr, 'g'), ar);
      }
  }
  
  result = result.replace(/kg/g, 'كغ');
  result = result.replace(/\s+/g, ' ').trim();
  
  return result;
}

// ==================== EXPORTER LES RÉSULTATS EN EXCEL ====================
window.exportResultsExcel = async function() {
  // Récupérer la compétition sélectionnée dans le filtre
  const compSelect = document.getElementById('filter-results-competition');
  const compId = compSelect?.value;
  
  if (!compId) {
      showFlash('⚠️ اختر مسابقة أولاً', 'err');
      return;
  }
  
  console.log('📊 Export Excel - Compétition ID:', compId);
  
  // Récupérer les résultats depuis la base
  try {
      const { data: results, error } = await sbClient
          .from('results')
          .select('*')
          .eq('competition_id', parseInt(compId));
      
      if (error) throw error;
      
      console.log('📊 Résultats trouvés:', results?.length || 0);
      
      if (!results || results.length === 0) {
          showFlash('⚠️ لا توجد نتائج لهذه المسابقة', 'err');
          return;
      }
      
      // Récupérer les clubs
      const { data: clubs } = await sbClient.from('clubs').select('id, name');
      const clubsMap = {};
      clubs.forEach(c => clubsMap[c.id] = c);
      
      const resultsData = [];
      
      // En-têtes en arabe
      const headers = [
          'الرقم',
          'الاسم و اللقب',
          'النادي',
          'الفئة',
          'المرتبة'
      ];
      
      resultsData.push(headers);
      
      // Trier par catégorie puis par rang
      results.sort((a, b) => {
          const nameA = a.category_name || '';
          const nameB = b.category_name || '';
          if (nameA !== nameB) return nameA.localeCompare(nameB);
          return (a.rank || 99) - (b.rank || 99);
      });
      
      let index = 1;
      
      results.forEach(r => {
          let categoryName = '';
          let rankText = '';
          let clubName = clubsMap[r.club_id]?.name || '—';
          
          // Utiliser category_name de la base
          if (r.category_name && r.category_name !== '' && r.category_name !== ' +0 kg') {
              categoryName = r.category_name;
          } 
          // Fallback: construire depuis category_id
          else if (r.category_id) {
              const cat = CATEGORIES.find(c => c.id === r.category_id);
              if (cat) {
                  if (cat.parent_id) {
                      const parent = CATEGORIES.find(p => p.id === cat.parent_id);
                      if (parent) {
                          let poidsDisplay = '';
                          const poidsMin = parseFloat(cat.poids_min) || 0;
                          const poidsMax = parseFloat(cat.poids_max) || 0;
                          if (poidsMax >= 100) {
                              poidsDisplay = `+${poidsMin}`;
                          } else {
                              poidsDisplay = `-${poidsMax}`;
                          }
                          categoryName = `${parent.name_fr} ${poidsDisplay} kg`;
                      }
                  } else {
                      categoryName = cat.name_fr;
                  }
              }
          }
          
          if (!categoryName || categoryName === '') {
              categoryName = '—';
          }
          
          // Traduire en arabe
          const categoryArabic = translateCategoryToArabic(categoryName);
          
          // Traduire le rang
          if (r.rank === 1) rankText = 'الأولى';
          else if (r.rank === 2) rankText = 'الثانية';
          else if (r.rank === 3 || r.rank === 4) rankText = 'الثالثة';
          
          resultsData.push([
              index++,
              r.participant_name || '—',
              clubName,
              categoryArabic,
              rankText
          ]);
      });
      
      // Créer le fichier Excel
      const wb = XLSX.utils.book_new();
      
      const ws = XLSX.utils.aoa_to_sheet(resultsData);
      ws['!cols'] = [
          { wch: 8 },
          { wch: 28 },
          { wch: 28 },
          { wch: 32 },
          { wch: 20 }
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'النتائج');
      
      // Statistiques
      const statsData = [
          ['إحصائيات المسابقة'],
          ['تاريخ التقرير', new Date().toLocaleDateString('ar-DZ')],
          ['عدد النتائج', results.length],
          ['الميداليات', '']
      ];
      
      let gold = 0, silver = 0, bronze = 0;
      results.forEach(r => {
          if (r.rank === 1) gold++;
          else if (r.rank === 2) silver++;
          else if (r.rank === 3 || r.rank === 4) bronze++;
      });
      
      statsData.push(['🥇 ذهبية', gold]);
      statsData.push(['🥈 فضية', silver]);
      statsData.push(['🥉 برونزية', bronze]);
      
      const wsStats = XLSX.utils.aoa_to_sheet(statsData);
      wsStats['!cols'] = [{ wch: 30 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsStats, 'إحصائيات');
      
      const comp = COMPETITIONS.find(c => c.id === parseInt(compId));
      const fileName = comp?.name_en 
          ? `نتائج_${comp.name_en.replace(/[^a-z0-9]/gi, '_')}.xlsx`
          : `نتائج_المسابقة_${compId}.xlsx`;
      
      XLSX.writeFile(wb, fileName);
      showFlash('✅ تم تصدير النتائج بنجاح');
      
  } catch (err) {
      console.error('❌ Erreur:', err);
      showFlash('❌ خطأ في تصدير النتائج: ' + err.message, 'err');
  }
};
// ==================== CHARGER UNE IMAGE EN BASE64 ====================
window.loadImageAsBase64 = function(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function() {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.warn('Erreur conversion:', err);
        resolve(null);
      }
    };
    img.onerror = function() {
      console.warn('Erreur chargement:', url);
      resolve(null);
    };
    img.src = url + '?t=' + Date.now();
  });
}


const LOGO_BASE64 = `data:image/png;iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAYAAAA+s9J6AAAAAXNSR0IArs4c6QAAIABJREFUeF7sfXdgldX5/+fdd+bmZu95M0nCCKAIKoq7KmpFbWudrVarVttaV1up39ZR9Wet1lZr66qtivbrHogWlaFIBLI3IXsnd7/7/XneEL+IhIYQDMI9f0Byc85zznme87nnnGcdCpES4UCEAzPKAWpGe490HuFAhAOIgDCyCCIcmGEOREA4wwKIdB/hQASEkTUQ4cAMcyACwhkWQKT7CAciIIysgQgHZpgDERDOsAAi3Uc4EAFhZA1EODDDHIiAcIYFEOk+woEICCNrIMKBGeZABIQzLIBI9xEOREAYWQMRDswwByIgnGEBRLqPcCACwsgaiHBghjkQAeEMCyDSfYQDERBG1kCEAzPMgQgIZ1gAke4jHIiAMLIGIhyYYQ5EQDjDAoh0H+FABISRNRDhwAxzIALCGRZApPsIByIgjKyBCAdmmAMREM6wACLdRzgQAWFkDUQ4MMMciIBwhgVwALpn4+PjLQMDA4HdaLMpKSl8d3d36AD0GSG5HxyIgHA/mPd1NE1JSbF1d3eLAPS99EfkaJC/Z2RknGAYRmxHR8fzu9WnPJ7MIwEutbm5+cWvY+yRPibHgQgIJ8enaatVXFzM19bWyjk5Oae73e53wuEwRX73eLIv53nr87W1teYOtrOelJGR/qFh6Ks7Orp+t5dBMAUFeb+RZfFDm81mURRtbmNj82921qeKi4u52tpa1ePJ/pZhGNktLW1/3JVWQUHBdaqqvi9JUgsBcFdXVxcAGoA2bROPEJqQAxEQfs2LIzc3NyEQCDzPsuxTXV1dT6amJj/a1dVzZUZG2otOp+uRmpqa98eHVFhYGKuqakBVVWtbW5tvot0wLS021e+Xa2JjY28A6M0MQ1/W1NR8Q1ZW+vNOp/23VVX1NaRtYWFhqSzLJa2trf8CzOzr5u6Zlpb2GoAf6bq+JDo6+vba2tqi4uJioba2Vhmv8zWz6bDqLgLCr0fcDNlVioqKThgdHb3Xbref1NzcPEC6LijIe5FhuEs4DsWiKB/X0NB8z84hkZ1ILyoqOlJRpPObm1tvKC8v5xRFPLeysoaA6ItSUFDgpCiKr6+vHyorK0sTxdDKxsbmH2RmZn7bbg+9U1s7EPB4POcKAnc6TbM3VFVVjRBaFRUVBGQEhK+7XK6Lampqhnf+HtPZ2TkyAQDJuAh4TQBHyv5zIALC/efhpCgQANI0TRb6RTsBQO54Wn5+/gWCwGpVVbWrUlOT1nZ19S7dSZCZNavgGEmSr7RYbAurq2tyyOezZhX8iWGE+yorK7ePd1xQUFCmaZqqaZInKcl4d3DQcntTU/PNxcU5GaIIL03TIs+zl7jdMbcNDg7s0DTjPkEQPhoHXU5Ozjutra0nE3qZmZmXMQxjtLa2PrG3iaWkpLxmtVovb2lp6Z8UAyKVIsfRr2ENkN1OLygoKG1oaKjcvb85c+Y8qWnaUDAYfLK1tbVq/O9FRUXJfr/vns7OrotycrLu5DjhroaGBj/5u8eTcwPDsMcqivSqz+e/KyEhYY2u66X19Y2zy8vL2YqKCpXsSHl5uXeoqvpjjhMKWJb1Aeqy2trGt5KT44/p7x/8IC0tPWCxWIZoGp8wDNunqio0TT9ClpXf79ix46WMjIzXeJ7/XnNz82hubu59FEVtSktLe7m/v58md0lydPV4PPZgMPiB3W4/o7m5uTM3N/fNlpaW0/+LwuhrYPs3v4vITjhNMiRHQp/Pt8Zut1/a3NxcuytZj8cjuFwu5+Dg4EUdHR33UxSFlJSUn9pstsdNwFEw0tPSz7ZYLT8Mh8LndnZ2hncfVklJbjrDWBfQNDWkqkoBRfHPVlZWBkm9oqKiYyhKlWprmzbtbGceFYuL8xfqOu2ur69/Z4JpEvlTRUVFl4qi+LokSee7XC46FAot2LFjx/dIG3IvJcdc8nNOTs4SlmXraZo2OI67saqq6ua90I0cVye5tiIgnCSj9lKNycrKimdZ9sVQKHRWd3f3yIoVK7Bq1SqiWSS7IylkQZomhvz8/DhRFL9LFv/o6OgDNMfIFIXLopzRsyw8/2ZDQ8P6PfRlKlFmlRWcQgHfVVW1X5Wp22w2m0tV5e97vb6rurq6PTvpp3Icl0LTOF2W5TMbGprmjn2et00Updva29tf342+effc9bPMzMxnNE37nt1u30JRFBsKhZbGxMQYfr/f2dLS0lFUVFQSDAaL29vbdzV17EqDysvLu8AwjKHm5uZ3I/fHvS+yCAj3E4TEjme3219NTU09Ze3aterSpUtZ8n9OTs53OY7b2NDQsL2oqOhEnuezJUnK7O7u/qHb7T5ix44d5p0uJyfH1dra6p3kMMYBQ82dW5BM08LFuk7pNM0+VFFRQXZPY9asWTG6rp/IMJRbFOUnmpubyXESJSXZcYIQ46+oqNgnY31paen3AoHA7RRF+S0WS7Su61dzHHeUxWJpHB4ePpHjmIuDQW9pQkJaw7iih/SXnZ3dIAjCyfX19W0FBQWXNzQ0/D0Cxj1LOQLCSa7+iaqlpaWVdnZ2Vubl5XXwPH9NTU3Nqx6PJ81qtT5E0/RZkiTdDeBkRVGeAzASHR395K6LdT+7P2DNs7OzP2AY5mld118c/5LIz89f9vm99lqe50/7HOjraZr+JBwOrmAYbrmmaZ00rXlaWzs2k6M5y7LP1NTUnJWTk/Mdu91eVlVVdcuuZpHdfj5g8/gmEI6AcBJSSkpKKv7ceH1Hb2/vueSIWV5eTldUVJDjJuGfadAuLy+PC4fDv1ZV9Q5FUZjt27f3ZmRkNLMs+4/W1tbfkIXJ8zzr9/vDbW1txAPmoC45OTnLHA7H0aFQ6J3m5uaNuw+W7LiapkXxPD8wOjrKcxz9uN8fOIeiGIfNZltMUVR8a2vrsyUlJZ+IovhtoszZSeML++RBzYCvcXAREE6C2dnZ2ZkMwySrqppF03RLa2vrp8SjhHiaSJIUamtreyw7O/tEn8/3stPpjG1rayP2Ny0nJydDEISjJEk6wjCMJQzDvNvc3HzrJLqc8Sq72BEnAs3451RKSkosRRmfdHX15CQlJZ0WGxt7niRJP+J53hgdHa3u7u7O33VCNptDdLmib7LZhH+TO+aMT3aGBxAB4eQFYGRlZf1ZVdXfCYLgbmlpqc7JyXnfYrEcxzCMLMvyWoqivkvTtH/c0yQ5Obk1JibmdFVVw4Zh+BsbGwcn393BX7OwsDCL3PnISDMyMmaR+2EoJDJRUVFPETNNenr6BYIghJqbm1/dZTa0x+PhrFb7j0OhYGxLS/NtB/9MD+wIIyCcBH+JH2cgEPC0t7c3JiYmChzHvdjZ2XlqYWHhEyzLEpV+T2trK1HXm9rQjIyMIymKutJms31YV1f3+M7PDzk/zNzc3HKaplY2NTWfnpyc+Neenr4rdrLT5ENeXt41TU1ND+70QzW1p+npBSk8rzKKouS3t7e/Nwn2H/JVIiDcu4gJf+ji4mKGOFmTu2F/f39NWlra8+3t7ReMN01PT3+zo6PjtAOxWo46+qhrKZ16cv369aYBf7Jl1qxZJwuC0PPZZ599xXFgsjSmq96407rH4/mH3R61LBwOVdM0flpfX19FtMukn8M5xCoCwj2vNCouLs5hsVhUYjiPi4tzjoyM+Nxut8wwTHpfXx9x1TLNBQUFBQ/uvBcS7d+0l2OWHnU7WNurH65Zs2VfiM+ePfvPiqL8pra2tndf2h2ouuSOOTQ0lGqx2M7lef7eysqt5tojx9jOzs5qXdcP27V42E58t8W2q8HaVDgQZUxPT8+m6Ojo8z5fK3+nKOp4t9vdQ3ZE0jY1NTWW+IKS4+j27dvvP1CL98TTTzzNH/Av/Hjtxyv3pY+8vLz+pqamhH1ps1vd8bUx7Z4vOTme5nBYuqCnp2Mz6bO4uNgxHsK1H+P9xjY9XEHIAjCN2LscKf+uado/u7u738/KyvqJLMv/wzDMkSzLXqLr+hs7duz4zx4W6bQv0N1X0vGnH58qBkIbN6z9OGOSq4wqLy9PCgQC/2poaBh3Bp9k07E4xlAoRDMMc0pLS8vLk264DxWTk5MzY2PjKxRF2S5J4Wfa2tr+mJmZeZzFYpEn8BjaB+rfvKqHEwjHd7gTP3cba+zp6dmxq7hyc3OPE0Wxsqura6i4uHiZ3+//TUdHx5Jd6pjhSDMh4rIjS3uTopLLVq9ePamIhUWLFl4EUO6NGz8hSpHdy3+105WVlb1iGMY2XddjDMN4GkAt2alKS0tLaZr+aTAYbFdVlSha7hm3eRJ3vH3V/mZkZLjb29uHk5KSllqt1npJkqoZhvlBR0fHKxPw+SsudjMhj+nu83ACIREglZGR8anD4Thy/Fg5EUPJcZSE+xmGsYnjuP9ERUUtnClPl6WnHfuuw+56/fVVr+4JVONToOfPn3+JIHDfk2VpxGKx5oXDoWFN0/oURYuxWi394XC4Ji4u4d61a9eSLxNjXGHyeYRHlqIoPqvVetLw8PC1FEX9saWl5XkSIkXc7RRFuYymaaJAWe/zkYiPznBZWVlJIBD4M8PgDw6HY0Ug4BdZViiUZeVnLS0te/J/3eOXAQGi3W6/F0BpIBB4taOj47dut7t0ZGSkerxBQUFBNsuyK2tqai6ebgAcDPQOJxASf8bLGYbxNTc3r9rdbWpnLpcv/CoLCgp+6ff7vX19fQ86HI75Xq/3s5kS2MnfPvHPcXEJc5999NkjyRgWnbzUM9zT80Z0VPRrPMPlQoeFpqGqqvoPWdY2uN1Ri/3+UGDjxo1fctaePbt44eDgyONdXT3Eqdvc1T+/j91ns9mocDhs1XWdmFSIe91/K+ZuWlZWZhdF/yyLxVlDIjry83MvEARbd1VV1Yf/jcCe/k6cG/x+/0Kv17sqJiampLe3l2QEQG5ubq2u66dardYemqbPrq6u3j1/zlS6O2jaHPIgJAoUWZYlkn0sISGhsr+/v2xP3M/NzT2ffPuTv3k8nss/B+ANfX19JTMpqTN/dPYFnJUTVFn/ZZTdGR30h84ID/nOHegdKkp2Ja4ISIEiRmcG1qxZ0z4+zsWLF10jScp6q8CdIatqhyQpfVu3bn1zxYoVDInsKC4uzpBl8QmeZ2tpmie7/QvV1dX/2N95ejw537NYhB/oOnXGVJQsubm5JTRN/7+mpqaTUlNTG2NiYt6pqqq6tqys7D5FUVrr6uoeycvLu9dmsyVu27btop3jPSSOp4c8CIl5QRTFDS6X63pVVYsFQdhOUVRWKBR6cte0gJmZmfNYlv0fWZbn0TQ9qCjKEV+X7Wrh0oVnsZxtyfDo8FynwzGgCyqj24zo1MKMZYk5aZTTFYXQSKitoaKh3xHmb37j6X/vriQia9JckMcee/SvP/jgozsWz12covJqgKbx/Y0bP3lktwgGqqyszDYej7i/AMwryjvBJthP27Z160+zsrIsU/GNJUdjTdPObGhoeDkvL+/Xnzs6HK8oyl84jrtl27Zts8iRlKKo5+vr6xeSU8y8efN+8Nlnn/11f8d+MLQ/5EEIgE9JSYlSFKXb6/VycXFxzzEMs07TtAXd3d2X7CoEcg9UVTW+o2NMdX6gy+LFi1MCuu+J6OiYFxmrffX7/37zC2XRqdeeKgStulh01FxIigIn5cD2zxpWvn7nc+NZ1PY4vCVHLPrJuk82fnF3LJ8z5+KKrVufOpBzIUHLgtV6vyzLwaaGhpumoy+SujEuLo44xP+tsrLyqby8vGqKopYS5c/nwcVrBEF4p66ujtwlv/HlcAAhOV4KmqZFh0Khd61W65mBQCDGbrev2rFjR+5MSHDp0qVxA4MDTzqinS2apj65eePmrxjiz7jiDBvShGBiUSZ4ixXRtFNr/azpped+9fj5exvzCccff/2a99//wxfH00ULr1m/cdPDB3qec+fOTdEM4+rKrVt/OV19ZWdnJ/r9/rbExMR3dV3/S11d3ZuFhYUnUxR1e11d3VHT1c9M0znkQZibm3t8MBh8tLe3N48clTiOeyYcDuf7fL7jfD6fmV3s6yjjwb4LFh3xh6GBobS4mJgrN23aZKaN2FNZsXKFY9A36p919HxolIFkexKq1m15fdVvnjpjb+M99uijb/jgo48e+AKEixf9av36jf9zoOdYWFh4hsEYSkNNw9vT3RcJAyNpQIjyzO/37/D7/fHT3cdM0jvkQZiYmLjB6XSe0tzcHIyLi7MNDg7ukw/mdAiH7MSfhzDJBcWFrzhtjj9v3rz5rcnQvfCeSwaF1KhYp8sFJxOFnpodWx+/8WEzXQUpl1564bxAQNq2M5UGVqxYZPX7ncvffnv1FxrOxYuPvGH9+o+/AOVk+p1Kndlz594hIvSXhi0N3VNpP4k2JPriaVEUr9tLOsZJkDn4qhzyICwsLPx/Pp/vlxaLZYMgCO/X1dX9dCaiussXLLha0aSOys8qSaLdSZVzfnluT0Z5flJYkZERm4b6T6rDz9z6uOnwTMqiJaWvR2emffetZ98iiYGxfPlJ6eEw8lavXv1FAuGTTjrhhtWr1xxwEM4qKXmqprr6kLTjTUpY+1HpkAdhWlraTziOu9rlcp0fDAYvaWpqun4/+DXppsXFxUk+n+9jl8v1IE3TwWAweG5ra+tJkyYA4JxfntufMjsnHiyDKM6OloqG4PO3P+MYp3HJFeev4OF6+bHHHjOT+J565glzaY22vvHG6g3jdY466qgfbtiw4YBrEWfPmf3Etq3bLt2X+UXqjnHgUAbheKZoMkc9Ly/vn5IkPdLe3r7uQAm/sLDwZ5qmne5wOPRgMNhJUdQ1JOeR1Wqlt27dunVf+z3/N98ZSC7LjgupMjLiUrFtXYV31S//4SYpEgmtS677zilZMT1rVq5ca/rBnnXu6cvCfqX2nXfe6Rnv66STTrph9erVB3wnLCwuvoJmmL7aqqqJXM72dfqHTf1DFYRMRkbG2eMp+Vwu1wkpKSmP1dXVmVmsD0SZM2/OM6qs/m91dfW/p4v+8l9+uy9nYVGCqMugFQqddW3DGdEJ2Q9d95B5/LzoJ+efHqb191Y9sMrMU3rGead922LY31y1aux3UpYuXXr92rVrv9CWTtfYdqdTWlrqBo3rq7ZV3X6g+jhU6R6qICTvK1zDsmzA5/NlURR1c2lpqaOvr+9Rv9//687OTvLq0LSVkpKSdMXQbm6oqfvxuD/mdBA/a+WK3vjC9ETWzoOSgdHO/pAQNBY8cesTtSteWMFgvfoaT3FVcpdxK1HOnHb2KXe9+b9vfymu8esCYdn8spKgN3haS1PL76dj7ocTjUMWhESIOTk5l37ujBzT0tJyf3Z29oMWi8VBUdRV/815ezILYNzkUFxcvDwQDt7IM9xpzc3N5g41XeXsO1b0pM3LSwqqImyMFb0t7T4nbVtk+KRyv9d3k8vufFeghK0jA0MnKLL6sDwqn/3aC299KSv2Mccc85MPP/xwb47f0zJcj8ez3BEdja2bNxN/1RmJNpmWicwAkUMZhF8K2SkqKrogGAy+097eTl4b2u+SmZmZbbFYnmU45g+11bUv7DfBPRA49VfLu9LneFIkRoHLGg1GNIyWirq6GLvTER8T96ahqnG+Ad87UjC00dvjO2d4YLTww7fWm+nrx8vXBULSX2paWl1XZ2fRgeDFoUzzUAbhAZFbTk5Oqd1uv3JkZGQuyXR9oPxLidsaG2cRs48ohlcKQJeB1JhESL2+UJTFWt25o32A1Zla2afUycHAJ8/ev+pL71+MT37JkiXXrVu37kuPgh4AxlClpaUlkiKd21jfGLkT7iODIyDcR4ZxHKdnZmZm7Exme8C8+InbWjBaChIQMnYe0ClwKoNY1m5Io8Ht3lHvx+0t20tsBv++QHF/He4NdI7bC3ed0lFHHXXphg0b9vrM2T6yYI/Vi2YVPUwZ1G8Plpw20zGnr4tGBIT7yGni/UJR1AbDMFY2NzdP2vC+j93gzJ+cmai76d6kOTmAlYUaVpAcHQ9eosJNlXXMyMjwZyxF3RDqCRwV64zp9w35tCM9i59fuXLllx53Wbx48TXr168/4L6jxaUlz9RWVX9/X+cZqX9o2wkPqHzz8/PXNzY2HnOglBAX3Pq9ZXQSv8aa40ZQl+G2OmGBgFDncJd/cHT1hrUfntL2RlvK6VeedD4l08sVWa8Su2QSNf+l3DmLFy+6Zf36jXcdUGaQHKOF+e821TeeeKD7ORTpR3bCKUiVOIIzPPdaS2PTAVt03771wvOodMvzfJodECgI4OE0LNj63saeBbllZc88/mRL+ezyKwSVPpUBvyCs4mdGQGl66+W3Wnad0tFHzf22o9//+lvNzdIUpjqpJkVlZVfpmpbSUFPzq0k1iFT6EgciIJzigigsKnqSpqhrphJFPpkuz7jlwltd+dG/YxJ5iIYEQWeRZIvB9oqmwWjGebnoCz7FqVhlZx0vjgz7fgCdWx32qVtfeuaZL8VCLl5cdjTAtKxfv2XaHauJfVSD/gJo9sG6ysrJpMWYzNQPuzoREE5R5CVlJX+qrqz+8RSb/9dm591y4T9S5qZ9L8gEQfE0rLSAOLsbnfWd8A76hkpmz+n2DfvqVFlbG/TLn25bt+U32emZl/3rwcf7diV+xNElZZJmCFs31JBHbKa1zJkz54HPX5r67d5Csqa1w0OUWASEUxRs6Zw5v+Bo+u0DlWb+Wz8/5+2CowpPDjNhUJQBQ9KQHJ0IiDRg0HDGxMDQUTs6NPSS4lPeuuviX3/l+bLxqc09quyqLRsq/zzFqX6lGXFUGBwcesFqtUuffvrxd6aL7uFKJwLCKUq+ZE7JiZRGsVVVVZOKDdzXbk741bmjngW5LpWRYEADEwaSoxNggR1uVwxG/AHExbgkQwq+2FPf/jdjO79+5cqVZnbw3cuCBeVXf/ppBckzMy2lePa8K1maHqzcsvmlaSF4mBOJgHCKC2DRokWlo37/KXXV1dOe5+TMX5zp7KVlX+GRhaB4AzA0UykT54yHEpBhtTgBmkJ8jBtRND4Y3NF9F9/V+v6VV46FNO1elh5zzI/Xfvjhn6Y41a80KyyZ81R99dZI7OA0MTQCwikysqSk5ERGYKhtFdtWT5HEhM0uu/8nFw1ZfE/F5MbCoFWoogRe5ZAYnQie4sHzPBieg9vmQBzn/HR4e99tPzjpyjWf517ZY1r+YxcccWlCVsbT4xH4+zteT2HJ35vrqy/bXzqR9mMciIBwiithzpw5N2qa9nZVVVXVFElM2Oxbt573p4yFOVcHyRmU0cBTDBiVRbQ1GjQYcAwDWRbhSc5EDGyr+2q67rrqOzesnYjg2acsWxQKSKF31q3bNh1jzc0t+Ktu5X65vbr6S0qg6aB9ONKIgHCKUicO4eQN+m3btu134tzdh7D81+dvTJ+XcaTMq9AMFTzLwc7YwTE8OLBwWATQsoIUm0sWhpTnwoPSwxde+PMJtZ8rli51UFb2vBfeWvP3KU73S81yMnKWME5relNNzb+mg97hTiMCwv1YATnZma+3bt9x+n6Q+ErTlStX0vVapZY+KwOKLpr57Q1Fh413ggWLpPgEMKqK8EAfCuJTOpm+4N+G2gdePOe2P37xdsOexvOdo+df/6+PNk9LcO+itDRrB0W91HmAHkadTn5+E2hFQDhFKZFHL4cH+/+8fUfHD6ZIYo/Nvn/FaUfQduPj+HgnCjPSwQcVCCo5hPKQwwoEngVCISRbefQ11Hc6NHwQDikVlCUuoEhMjyHx3YFgoC8QGPAOACLpZOXaterNpx3/o7vffP8v0zXW3PT08wVBaKxtbt6nx0unq/9DiU4EhFOUJgFhwB94pKGx4YdTJLHHZpdfcvzd7gTn5RYrEzfc34NgzzAYhYYc1pESE4cYmkX/lkrYukeQxgOGCKgMwKdn9EWl5G5XKWu2NxC2BUM+OiE5NmDA+MDqtj7bPjDq7pek6vvXfVIxHeOd4/EslUIhrq67+93poHc404iAcD+kn5qS+kqsNfaHlS2Vk3o3cPeuDIBatWIF3QvE2Dn6pDCrXLutp/EIKt4Ca2YsaLcNKVlZCMkaNIVGGm/H0pgM/L8VV+JcuxvJARm0oUJ0RmEbQz93SXffuOGcWnn22fG8GChKFazpTDBwth5QziFmDYmh/ukLe//k15mtt1dUhCmMJY2aQqEz3O43WatzrQj1j8nJycpMPR03hbEfVE0iIJyiOJYCbG9OYRFYnFPfWL/X9yH21AUB4CMXLv++EpBul8PhHFece7UjNfb9z/qb744qTsOoXQOb6AbxutYoFjbOgWzKBte2VrQ89A+cERCQHgzBSrPo5Vls5LnmC33evImms3LpUlbo7v1JdJSjzcpydxuKnOwPS++GWfqemyorP54CG8xHU3MzMspHRkZ+z9ls3+nr65vSl9EU+j6kmkRAOHVxUvn5+SkMxVxV11A3qfcXCPAePHNZQhT4G1X/6M8op/UDr5W9x0hP/PDn9z0TuvKaE26ncmJvDDpgC1p02N0uUCqDRGc8Qn1ezLHEQl39CfDmRzhx2IBHZ6ArAfRzLD6UNQzk5cVdU18/cWr9ouwTYw2hKam+vh25uXHZqamXyuHgLZKmym1Do1fet2MHeR57n3dGElWiivIbnb3dy6bOzsO3ZQSE+yd7uiA7732ry37W1q1bRyciRcB330knxTudlpu6drT9NCsl9X5VCtzfs2hZ365BuGfedGw964kvCNspJKSlIByW4YAdVEBGNGXBIiEGTXc+ivm9YRR1jSJeFEEieL0ChWqdR1NczDlX9fT8796mdFZW+iUvt3U8uWudX6SlLYyKdt2twlgis/zZd27d+sa+siUpNuEiq5Wv397ZuWlf2x7u9SMg3M8VUF5UlKyMhp6Oj0+8473KTR/tTu6Pp54qJFvtt3ePjN6iu6L+0M8xd961atXA7vXOu+nMY7qp/g+iZ6VAYnXERydCMOzgDQGGqIJSw1gkcei99gGcDiuGEeaMAAAgAElEQVSSQzJsmoaQDig2AV0KhQrDePEKVVqxtymdm5B+9Yv9HXv0I/3ZrPwFcRRzn4Nn5gx4/Rfc0bJj0n6xnlRPmqYEj9ve3/PMfrL0sGseAeF+ipxoSYlC4tiisj9F2Sz+1yo2fZFy8PfLlpwSbXBvUTT/z1HauOLG1auDE3W37KfLXk6al7Z8hPUjrClwW2Lh4qJhhGnE2RywySKo1esx95UtmNsXhtMwYGMAmaKhCRaMSsA6NYRtiYmJ9+3lbrY8JTdd1FXPO7079vTQKK5ISbFlOyyzoi3WVe6YmM7W0MDyWzdNfMQdnw95e95G09fXt7VFEj3t45qKgHAfGTZR9RPKy11iT+fadd19c+896SR7dlTMqqFR75IQx551w1uvffFAy57aX/aLy5zNdMdgbFE8r/AaDIaCLlFIik4Cp/JwhWSUsTZ88psHcKHPgpwuHxxQIZD8/jQL1WBA2+yoCIxinY2+7Rch9c69TWterPuaz4ZG9pp35t6yMnus3XldV23LnbEJcadf3VT9BlHuEJvjRLSzcjL+IityVXdHL3EWP2BJsKZJZAcNmQgIp0kUx2RnbFhSmne226vmBHv738nNLXy8Vw3+am+733jXS646/qaEsrS7JZsKjVXAcxbERsWB0WgIGoMUv4aYjXUIvLAap8gWZAUUOChAV2TQrABRJXdDGqNOB1YHfdiYBPtj3QhNNLU5qfFzgqIuNQ0N1U1UZwXAzAIMIXdWjsvGfaBwxpZeg770ri1bvnKU3pVGWk7aaUpAvJIKiT/oDQT2WneaWP+NJxMB4eREaKrjSVVy/LQEApb1DQ3+RbNmxcRZLOJrFRWhH5aVvpEV6/jjUHv3EynZ2ef9fM3ayT48Qy24bslQ9sJit2zR4At44bQ6oQZkpMTEgzGAeSKP7T+7H99Sncj2SoiTNbDmcHToMECRTYem4BUYVBsaNujarbfI2Gtyp1Jr1DVVYd+ksrCRHTCTo/7uGxo5Z8fQyNH/b8cO8rjNhFrUwtTCWNkI/1VW5Mc6B3qm/dHQyYnsm1MrAsIJZFU8p3g5VHYxpSDfojOjUZQAUQwCLAKcRTdsMAzWMFgbw8exssKl2ISzkhPialpHO4790yTuUOPdLvvpKT+NynPfL1loqCwFziJAlxS4OCuSbS7YFQ3Ums1If/IDnEpFwy1KEDQZDEVBNVRwjABFk8BxNPzQ0QlgnQLUpUXFPtA58UvE5Y644/xasLExHCa5ZyZjlqBuzk4/EQregdVx4t1Nde9N1K4c5VwFKpSk+NSLeSvjam9vP9DJh785iNvDSCMgnEB8paWz7hYE6/ObN3/1Pfldm7ywYgWvGNxbA2oItR0dpzxWUbHHwNqJVknZ1QtDGfMyrZzDARIWrxgGWIOB4vVhbkIGEof9qP/947gmFI/cLi94ygBjqKA5FrIim6+kjW/TFE8hSAtopFi8q6m33iaLe90NMwXHj3dIgX0K9r0kNXVOTnLiesjqLXpl5cMryXa852LeCZNS0//V29URSYGxl6+JCAgnYM6Rc0ovUXVK31xZ+fSeqlxRXm4rSWBZtxL/OiwWbJN9p963F+3nnmgsufrk39oLbbfZEm0IiSo4ix0BRYWNE2ARFczlomBfXwXlhf/g20ErcmUGkhoCS5P1PVYoXQdNctBQBhQShE9b0MsKeE/yotJuT3owGJww5i8tNnZhQNSk0eDonuIMJ1SsfDvaNnehp+AzRZFu6QvKDzy0l3SKaWnpf+vs7Lj8G71VHeDBR0C4k8Gz0tJirHZ7kaRIS1iKOs7OWbesq68lz4x96WGZcXkQA/xzy89cFw4rbcpQ/yVX7uMOWLxiBa+ldo9ml6dadU4DT1shKRRUhoWd4cEPjmDOiAbf71/CdxxxyBgIwC6J4HkBqqaAAwNDU8HQFBRdN3WRmkGSQLGQBRuaaAqrwyPP3wpcsLc1FJeQ8PPB/v77dq+TmJho18PK7wSL8GFnfw95c3FXPlArkhxxc7Pyq4f6R++8v7WVHDf3eKQtTM+9RFWCm5p7e/f4VsYBXt/fCPIREALISMu5K9ZuSQgEfe9Z7faNlQ0N2/cmPaKoiKf0J+0Wq/3it945ZypO0KXXL/5PWnnOUthkDI4OgdEF2OwxYEkAb0jDbMqKtoeexSlNASyjXeBHfeAMHQzHQlFUWMGYR1GKBmRdh8GyMHQGID/TAnpZA5vlINZZ2BP+KKrk/rbHkpBgTxTgWtTR301c1r4AWjTFvq4Y1LfI2ZpmmWNFVfwQ5EYMfGGiOCfWuSnZ4low5Astfs4//MUT3bt2NDspY5ZhoedXtrU99Y1AxAwMMgJCAMk5nlU9rc179TTZVTYPLTr6TrvLNk8ZGDxjX3dAQufoa44+q1MYfiajPMfR39+D5LQ06JoAC2cHAjLyVQsSNzVDXbUW52g25IkUFDEIgaZBMWN3QQtoUNBBUYBsABovmLsgpSgwQEPkKGyHik2aYmzR4X4M8E60vtLs9gu9weDbfmBwvE66w900FPB6FLDQSWAxY9wvsPSD4XC4g9TJ5VGiyqgqFizri3LzF3f0daWtGhra0+OrdIE77uGGkcGrZ2B9fyO6POxBGJOT+e04Z3RG47Zt//Vd95UAHV1+5IKwKD4nWZhZKysqJrTFTST9RTcssg74vZ1J81NjRtRRhIJBZGXmwWKJBuVVkKRwmO2j0Xv/UzhRdaDEr8IdlqAaGgSevM4EyKps5p3RDQ3MThDqrAUUWFAq2agM6KyBUQ5oZ1hsDIRWXQ+cvzctaG5K0i9aunvJK7vmbhjHO+8NyMGfxyWk/GJwdNgiyuIdsfExoaGBQTuZW6zArDUk7dg8gevIcsSdHGtz1BqUJebP7VVfef9xTmLaM1v7OiOPxUywKA57EHqKPNczKpNU1tRw26r/8sLs70qOSBRDgWqVtxfeVb9pwmiFvX39ei6b+7YlVThZsYUATgdlsMhKzwarCoj1A55hHS0Pv4AfWFKQ2TsKlyJC0IgpngZLM9A1Yhk0wDAMNE3Zaaogn/BgaA7QVejkxEhrUDgWXppFlaTiPV196B7guonGFmu1plpZYWGnf9R0AI+2Rd8eCPlWOnmLNyyLLnLnFHWduOTdY7Hyd4th+SYLABuAYYC5IjX3+ynxCVfuoMTlT+xm0C9NSrkHPHt31TQ90PqN2N72YZCHPQgJr2bn5yyhgvSVW7uaJ/y2fmHFCmakz9e8faj/53fXbJlS0tv51x23XHJpL8sWCaOhfsTEupGRlgEqqMMpcUjoDIJ+ZROOHDawyKsjNuCFwIz5f3GgSfpR00RPhEYxNDRdBU2Re6AJSxOotJkqWAFI9kMCHIOC1xmND/1BfEYZl96rKV+KoNh1rcQJwpmixH0cQKCfZYUbdV37Pa2r5kWQofGvoI7vWq3CdWFRepAQJ6YRK3QEyPn388Pwbxcu/mjE53vj/vqqu3elW5SWdpqqKENNfX2f7MPaPGyqRkBIFDOJscuSXMlHb2qsXjmR5O+dv+Rxi8WiX7tuzRVTXR1xF+X28On2JMNGgaEM5OV6wFGAPWQgNSAg+OJ6zNs8gONUOzIMBQ45BFCqqXakdHLIJLdA2kShQmugaOK7RoDHgNKIuU4HSxF1jUZwCWLJoDkGg7KBAd6O/0h+1FqtR/0pHP5Kyny307lE0rSWUCi0xOFwfBCSpEpdVRLJXC0Cf7soyndYgMt04G92m/PRkVD4SorS4KSNb/k0vEnqnepwxJe6E/t5G5vDNjTsGLchFhSkp7CK7bya1oZpSTQ1Vf4frO0OexBmZSVlORjbXdUtrRMalH8xv6wgnnZt6hO9KfdVVk4YCbE3IWddPOsRqyf6Kj8XhsFTsDFWZMYlwW4YSPVTGHppPYqbQ/jWiIC8gAqbIYI2Qqb2U9PGdsOxHZCHRhkI6goYjgKtEUDToDQDhq6BJj8bY/ZzhgYUYr0QeAR0HkPRsXh1oAe1PF/yVzlQs+t4XTbbFb5Q6FGwzHsGRS+DvrNTQz8RKtZYwVwA6P8CqOsoUK0haK+BxVKoWJ/i5PO6/XI9oXdzduFJSXbnc6Nx9oRdnb1To9xPdflGIlm797BIDnsQZqfEv8bYXOe6XC59TzlSyDF0aLizud2rXHjX5s3rp/JtOveyhfNb0ftpTH4izPgjmoJvwItMmxsL3OkIvLYBxZ/04NiwDR6RgluRwLEqNF0hr2SbhSWGSbIlEk0oRUMhkRam9wy5VwK0+Xdm7H+zBTHg6xANgGcoGBSPftXAkCsG//H2ocEi5P5ZFFvH5+Oy2cqlkLxZZWmoZFclx1yi9VFEimdwPq3Rz9k569MBJeRQYZyjjSl63rQ72GYpoCYm87azOuTQK4TeQ4uOezfk7Xr/ptrGLzx2ShIS/1Ld3/ejqfDvUG9zWIIwLS0tlaXYo1mW/h4D4+mG7dtXTSToR45dtIKGcdGPPvj4jKkuhswf5leznuhZsqBBlsJwsTa4JB7z7cnwvf0xyrpELOnQkO/X4dRUsIYMnSLKlZ13QGocZGP/g7i1EbMBpYOBNgZOE3cEhOQGR4BIFDgaNEo3j6XkPimBxQjNo0vgsTY8ik6ndcnD/rD5xZII2EeBgAoanNP5piiqp0GVwVLKr2kddzis0dt84cB1vJX5QNIkGAautAjU/aGg4bAyFBwqAxeyLM1olq71eHKjvIPNXIIjdmVN5zChvzgx7WaGEZ79sLvFNHFEyv9x4LABIUnM1OnxMLqmvaTI6rYoh+09g2HW1dbW7vElo50son43f24gyuEqv3btWvO4ta8l76r5r9CZwpk9ej+c0VZwooFkUcA8PRHef3+A+TsCOJq2IyNEwRqUYGfGPEFDRPNJNiPiikYs5KanGg2OHD8Non6hzRgKCoppKyQAHDu0ks/H/tWggaUNaLphfka8bcKgEWBYDLAMNvpH8Slw5qPAa4S6m+OeNlh2RALuC0vhdppmwJBjrkEs9NZkINhHzIYmD1TAwjJ9mqolkrhGoiXtHzPma6d6PMKxUG+w2C2p12+rv5ZUPzsz93ivqse+3zXxF96+8vZQqX/YgJDsfoauP63p+gW9vb2TinO7+4xlt4p9wbSVmz6ekqF5wVXH/b3HNnSp3ybCEs3DRTHIFDkkdooYebkaJ1MclvgMFGgMOFEFuYdxLLEF6ggTrSTHEl80c9WPg1BQYepBxwr5ixlhZSptKGI7JPpRghryN4ocVXUw5FhJ0xAVFSxFQ2c5qCwLr9OOD0eHsNXQLr9bwRPjdkSnwDwakrQrWJ6GJutw2t0XGiy7dNQ7cD0YPAyWvcSmcyMCxRwTlANVBHlu8Od3QX5hHBg3Z2S45fDocIBzxD/W3T14SX5+YWPf0PIN3qF7DhXwTNc8DnkQejweQZblh+w2OyRZurG1tXVCz5FdmXrrEdmJrMZv9jLR8x/85JN9fvhk7vXHPtUtd11kz4iGI9oGyRtCdE8Q+U2jSKntwSnWBCQPBuAcCSFaM5+lH9vh9LEoQbKXGQwN1XRO26mUMUzTonnUHCs7z6E0ASo5npLPqC/uiCYYGRqypsBitUAOi6ZZgdwzVQMIAAhYLKgURTTZHC9uCgUuagYcrUA/6YGkWxRY7kOG47aFwuK1DGNppu12T9DngwDtVAo4Rod6CwPqpTCMc3dflLfNzr85StdzbqpqvuJkh+XtwYB4RgWI/SRSduXAIQ3C5OTk+aIo3pucnHxxbW1t+z6kXKD+evKRt/iG/Dk/21yzz2nuy368ZF0vPbg4KSsWvKpA6R5AARUDa2UHMqv7caTKo1ABnAEZFmPsDCcQy4NBmaFM5NEXMBzMuxfNmeBi9TEFjGmrIIfRnT8b9BhIiaXQhOBOXBLPUvKir0ETRQu56RlgibqUYSHJMgTSIcPCG5IxbLWjiuHwkSyFPzKoVbVK6CLTQZSCYY91LBsdDLw/5jTK7kyqAUQz9HJFE1+RoEKFkQygd3doXevxxHt4o00Kabkf9Hc++kZIXR6B31c5cMiCMCcn56csy8Y2Njbetq+C/3lZmT2dCbcFRLnstrodPZNtf+q1pwqtetcaNZpaYol1ggvJSPMB9Md1mNXkxzyRQ77GIJXhQAUCsFMMOMOAQQJ3zR1v7OjJMcQXhYKiKebnpJg3QMqAyoztggRsZKPTWbLzGeQFNdA7N0hyRxw3aZDwJs7mhBoKgvjSWCgOqqGApQG/DrACi15Q8MWlYrPNil811WHAIphvIgpW6nWWZ/4Q8qlr7BQQ1uknYY3Joxl6MRUYBgUVEumIRTFk7DFVxl/mlD7M6dpAtRh+vyWkzHu1s/PByfLzcKl3SIIwKyvrfE3T0jo6Ou6fiiBvKfUsyrFHvfLDjz9LmGz78u+UxzWFt3+SVpaRY7ezYEZEJAyrUNbWY/YgcLY1DskDPiSTKIhgyIyW0EksoL7T3YSiSLSCuXspKjmxGRAYHgYxEpqaTkCjDfNuqJmKGII4ynSupjUDDKE15iTzBQDNzZBioOk6eJoHMTpqmmxCneUZSJoKWQO8DhtqWTvWyAqeFX0gofY2XUcMz98cZuR/iCo6yZAYgVkeou2PQpKSGJ2EU+nmOxgGyzymSdqVe+LVHR7Ponie+t+rapuST7Van/HZ7VetHxz0T5avh0O9Qw6EGRkZizVNu7Crq+uqqQrwoaMW3u4PiFturax8dTI05nz3qDnNYvsLBUd48iRlFM4+H1K39aOgQ8YxlBvJfhmucBAOWYZFBQTzXseYihRSZEM1Q5FkTTU9aIhfqKwophKFKFYEmjPvhhoNhFQFnGAhhglT98JolFnPAIktVGEoCgSBhSSp4DnShoMkybAwghn8JGkiOHLUNYgJZOz+2GW14W1KwN/8Q2g04c8gBRqOTM9Ds7/n2S4x1Doi6y5N4JrDkvJHmmehE/oGQPZsC+hn+6FfuCdekYRRiwvz+kZF5XQ/RfXUe/0XvTE8+D+T4evhUuebAsIvRXkXFxfzsiznNTc3kyPQl9IrJCUlrent7T1hqgJcWVzscAvWvs6RcO69bbVfuefsTnfhBQvPHqb9/45OdMJBK7COjCKxbQh5NT4cKQsoUnhESRoMouYwdPBk1zJ3LBKKRJtmBJAjImdA1jXYOQHhcBh2ux2yLJv3wzAMjLIUgjYOfo6CxLPwiSJCI0HEUw44aR4sq4FXVdhUGXYDsJIzqa6ZNC08D418ARAHb4qGqqvEgg9ZVWBoFHoSk/F3RcG/hvvNWCYOQCGAk4sXYJRV8HLlVgR5KjCoGA7BQkESDXAGEMVgfSzDX50sy7Vrx+Swx1QXfy0v/5UqahlX1Wz94ekc//Trikw8ZyaT12aqYvxGtTuoQZibm1suiuJKh8PRR9O0oGnagKqqaYZhNIqiOBwVFbVQFsUOwzDSdcOgdF0fFTiupqWtbcqJhf5QfsQSF2N5+tJNH+T+l4VCFZzo+RuTxl6anhQD95AEa1UHspsHUBg0UMwySKVYWEKyuVvB4GAY5IZHYgCJe9mYaYEExbM2q/n8taQaBBugDRpBXYeV5qBTLHpYHXVWA58aMppcgJ7qBGe1hUJdI0Opiv3OuDCj64ODZTYFp6UA2SWcHWmsALs8dmQ0zCOoYu6APk1BFEND1HTTCVyFDQ0xsbhqYId5qbOzPLIcMZBHe3FsSi5G/b3Y7A+CaLVCxOivA7E2rj3H4f4OZDls4Zns//QPkcj7Ccsj2QUFLs5S/73GbdQtadmXN2jiln/39Hz2jULKARzsQQnC/Px8opH8tqIoawzD+FNbW5v52OVEqSbG+ZOakLCoq7//K87J+8K/RxcccbNF58IXV6ybUIGw/Ph5Z8iy+IfcgpScEbEL1NAQ3B1+FI3SKB1UkK9RSLAxCPhCsJjxBTRog5i0iR2P7HzyGAjHNisQ06AoAyxD9kYGBscioBsYsTBopWRU6SoG81zw5iWjJzUKPVAgKwb0jtHtFS+35ew6v0dSUgrC3d3nuIA751ujkaxRcBOkq2FQkME6bJADIfAcEDYYDHNR+ETgcfton5mp7YiMHGTaXaiu24JTM4tgCw1g/cAgWkGhj+MxqkhYOKtAS1LwzyhFe1EOB1osNubkQVlc/1Ln0Cfk+Ll7SNgL5IRdUNY/KktH9dBqqEoKL3++s3tS6Rb3RXbf1LoHGwgZj8fzHMMwLzQ0NEzoSnagmE2CdmNzPG/bOOaSyxsaiH7iS+WK8hSbv8f/cKzDeWlmbBxGm1pgGQoi30EhxxqFGF2HRRTNJE3EqG5lSeoJCqBYUDq708SuAhS50ZkXQ9AMIO302bEKVtPjuleXEEyIxWp1CGvcQHeuFdbCHARsPEI8B41loYkqgttaw4ttg85Vq3Za7HcZ7WXpcSkJ3YMvLoN9USljhUMOgoEIkgFD1Qw4WKBTBWotHP5XVEC+uciLNhfPPgLhzl5sGdqBi/LnInuwG96whNrkAjzdWoUOhMx5nF80B2pzC6KVAOZkZb8/2NMXNyoFP/IDNz4AhHfn3T89nscYu733/G3bfr3Uzj2wNqjccKDk+E2jezCA0LzveTyek2VZvtFut19eV1e3YyYYuTI3MSElyDRbGOrldt+IbI9z9XIMqHDIl+jk2eT+Tu+xPAt7lEVAfkIGLN4AMmQNTmIEl8NQdKIUgXkHU/yyqQjRTHsBszO8b8zGRwpxvDbxOZYWhsTgQmcFjKgaet02vOz1obmYxdCJJWiJoqDbrZBUDVpYglPnEKcxiO4N++a3uWNr4tcas1bB2FP6wf8B+7MSGPctdMQgWpUgij5YWRpWnkeHLKEuzoUnekdRudP17MqFx6CrphabgoO4qnQhMjpa4FeADxzpeKqvHl1Q4MnOwCzejnBDNS4oKELU0DDsQfJNoqNTDsIraFuGaeNj1spV2G2JPUYgwGfExpwuWdjE8yobzzjaQj/2kahPOSRsJtbGgezzYAAhCgoKbjQMw9bY2Ege2/wi2dCBnPieaK+Mc81LGvRWZFEc4pxW0JoCRVQQ7RCgiUFYWDI4ARp5Q55iYWUYCHIANEm8ZCbBpiBrxIFszLWMZVmoqgKK3mlcH++UZEUz1R/kcEpsdkRLyWOEpdHiZNGQ6cLjUieYZWXod/IIWCgosgZO0xClArmGFfFtXtCNPSP0AObG2+NGVjY3+ybi1y/tlkvnhLW/z7M6ECeT59Z0eJUwNIcDdTYWHwaCeCmkoDyzAEfaLeipr8EWXcUF+QVIDQ5hBALu7+rDUEwOtg03grECjjCQRPLlALgoMwXZfh3siB+UhYFfF6FbiTe4AX9IAG1zoCfQCzo1oe/crv7kY4EHPgSu/7rle7D2N5MgpDweDw/gb5qmvbJ9L5EMXxfz7kl1Lcvq9q2ZIzgQo8lw6DpYohxRRbDEU4XsWCyxuxEzNWP6aLKUbBq+icKRgJBYrnVDN+1zuqGCMf03/08VOMZwhvivmIZ4itEhmhm1OXS4LPg41YVnwp2gzp6PFrsO2m4DLepwBTQkqxSYHT1gO4dgH5IQxzggBzSMBhUoNrePi0v8sxHtuP+Jjz76im/srxj6oSW87ZoyDYjXNNNGGRAYdFlodEdF46/tnTi6aA4yGRmt9XWoVg2UxbqRYKXQEpLxxHAAPsGNkD4KSjEQByATwPeiLTjSYkfqcBAxGg1dV6FSGnRGg0TcYdkYDKoqvHagMuhDpyvavSUcvvUVSfrF1yXXg72fGQNhSkqKzWKxvPu5u9OPWltbqw4GRt2T4r6maGD0oUKNRjpvASUGwe3csShopvsYOUKaHmM7Y/fG493Hxv9/SXnH9sOxf7+suR+vQzxkaChmRhgDrI3DRquOP8VbUJ0fA/usOAR5xXx1KS5Awb2lC4lNgzglOhlSOIxPRD9CThdsdvdNYZX9txYVP0jr1DE9w4MnUFbLnW9++ulXzCsrAf8Kq8ORo6iw0CyCioQgS8FvtaElLEKyWQAHjY+6hk2/0iNK56B+sAPv9wyhYacvaRSAEgCXePLgautAHksjBSo4UTbd78DTUBTiHEC+lGhoBosBTYHX5cQnXh+80fa5G8PypS9Iyk8OBpkfDGOYMRBmZWVl0TR9Vmtr60GT8uBOt/352d7geXN5AW5FNxeqoZC7ztg9jsTvEYM5+ZXRiZ1v/4qZroJmIPE0enQRa1zAcwuy0DMnA4JdgSGG4QwD2cMGhFe34dSEdDDBED4bHIJ0XBG2jYygJCXb9sCqjV9RhOxpZDclxJx8Ykh+2xMIIJG1gBxDRF2FYREwEBIRjnagP8aCV1r7TBAuKpmPmp42vDc0CHJJJ1NPB/D9WSXI8fmQHhYRJ2mIEoOwauS0AFA8B5WAUCNO4pppDR2FgQGrFXVSGINxMaesGRw+4wUd1+wf9w6d1vu7jqbMiaKiomRN077b2Ng4JdeyKXe8l4b32flN88Lygjl2O1h/kDxUPfbi0S4gHI90p00Q7v/1leI49DMGGp08/pcPoHbFPGxxkDsmi3iRhm1LBwrbAzjZb8Y/4N9MAO25LljL86DBgmSvq/iZx9+Y8Imz3af7a2D4VB7uAtYKPhQ2vWZY3gJJVBGIdqExwYlnG7eb6s3TiubD37EDbaIPO1KSsaG9zQThRQuPwfbGLShNS0FMSIN7aBSFqgRb0G8es824R4aDpkmQoUHiGHh5Kz4N+sFnZv78naHB9EcCwcidcKdwZhSEiqKc39zcfFDshFcA3HHJiR0ZfX2JeTSLGBLQqmowSMaksX3Q3AlNEJp2v3HX6v1z/JCho8/B44MoHusyeTQcn42OaAaaT0OZZEfaew2Y3SehRDPwacCLDcdnon1WEgapELw7hnCctJhdtWrVmOUfwI3l5bneYf9xj21vfHxP3zd3xdgum6+ofytTKbhVDYqqgiU7vqZj1B6N6qRY/L2lyfzaOb/oSMQN9IHgvyojEU99+jHmJKQiKzkJ72yrMOGWBaAMwAW8HVRX6+EAACAASURBVJmybKbeICzjGQ6yJoEi7kE2K1r9fpDMwFJ66iPrJGnwrv7ByIu+Mw3CnJycjM9f8TqhtbX17wdiV9tXmiuj0mLSfZ1D+eTOw7EgGW5phRynxu5wZoTDzjQT5PdxCO6v9xXF82iKYvBGqh2v2H0Qjy9AD2fAIvFIrOjGCWu7sSw6CZ2MF1uiFbQsK0WlTQOcPKKDAsoGYy61bg+//8c1a4hTC250OT9lomPeunvHjl/viQe/4Pmi+bJce7zdCkcwbCaDYsFC0VUM2dyoS0zF37ZXm00vLliEvL4ehHkKa5PduG/bZ6adMaiRIF6iXhpTZS/63MZ4PWdFgapCJnZIUGa0hkG8vg3ZPKIOGRS2E9/Y2SVv/7OhrufBkHLZvsroUK0/Yzthbm5uumEYBIQkonvGy30pKXEZ3X0DhdBQ6LBBDYZMH08z3ye5u+0M1DPj+L44ppKf/8/2N5VJkKT1NU4Gf3aoaD0iCZ1ZVtBJ8eBCDDwVvbhowxAKDAH/EUZQP8uNqpI4dMdZEVRUJIasWDziPnrrk2+/dWJR9gbb0GhjEs1fMwDq2uu7e/fokbIyJcXm6e4NnmDhkajJZlInmuSrUXX0O5yoT8jFY61bTXBdmDYHswc74dVl/Ntlwd8G+s2gQRLw/61ZC9C0bRsCkHFOShIuDoSQ7fNBIlEVxHRj8KB0DTzHwC+G4WNZ1Kkq3PPmvvNKe1tVfZT7t6smGWA9Fb5+k9rMGAg9Hs88XdezWltb9+p3+HUx806HI35eWO9P10LI5GhYyW2QmBbUsXBZZSzgAZzpbUbYtmuKiakeSSlQrBW1Dh2P2EMYOCkPrekO0y0tjopCae0IVrzTinzGjleZUYyeUIRPsii0RZFAXQF6wwDOlLKcqdu7T89u7f1Xhk7BUCWM8Lb+z1Tm0m6He9Nj3Y1fvC9Bxk/cyi6ISRicHxiOTpRVaCSPDUMSC+vot1pQl1SIx5q3mnP+Tkw2ligBeCHieYHDPweH0UcBqSlJOD57Drrrm1A32IIfejw4ra8LecEwaJYosGioEuGbAeJvyFpIXhsetUERWnbmtjqB+f76gFz6XGfnP78u+R7M/cwoCCmKSm5qanrjYGDQfc6UuFn+voEcaEhjKFNzSO6DrEGb8XtEK0oWJtH6TScIydGtLdGFu+QhaBeUYmsM4LPz4EI0SmuG8cOPh5DiU/GBS0PHonRsyKaw3UmB41xwDerySQPumLyeIdb2XsXo/Oho84zYpdPYorL42OeroXMyfrSqtfFLT3c/HRPjPUGTo2L9AWg0beagIXGL3QKLutRCPNZYbX7FrIhOwyIqjAE9jBd4Ds8PeEE8AsiiybXEIDchGVXtNbhx/kIsaq5DttdvhmKRLy+NRIpwDDTGQNAgWboZ7NCAcGbmthrgZ3W8TftLffXag0H2Mz2GmQThsZqm8du3bye2whkv9zmdccX+4EA2dOQIHFRJGUtBrx04EJJjrsGwqI2x4D7di+2LYjFaFo9BKwU7H4esT7txc42OpJ5RbLQE0TQrBlvnJaLeroO3u2Dtl9VF3kRXWmvnqvitDacl+sNwWS0IRrnfXeMP/+CPIyPmPXH38mR8zOjxuuRyDQXh4HgoigyBB9oYoC6jCI801JlKlyuLyxHf14RBRsM/NRqrh/yIYjn4VMV8VTjFGQPRP4zz4pNxnqEie2QYFvOLayxUS6V0yJwBr2zA4Di0KAqkkv/f3nXA2VFV/TP9zcyb18u2ZJPsJpsCARIhGAKErh8KglJEQaUEAcEPEKQTKQYBQVBUiIofCkhAQbogvUgxQAIpJLsp23dfL9Pbt2f2bQwQIMmWbMze3y9kw06599x75p57yv8/9f1H129YCdV1C375GVk+O3xBjGAHdpgSTp48+VDHcZSWlpYt8tqNoAy8Vy2UpNheJSXViDshCeAjCWApGlyvFnB4zFEPE40i4QOehHv9Jrw/IwLl/eughVAA3ABUv9sNx77QAYfzUWgHGZYlKXhr7nhoTvKIXwhRjYP6Luok5aXlV88VApf5c0XTTucelQXhd1ekS2dsSYYLAdhaCvSDWIAaHYB18MzrAE0DdEk8vFtVD3euWu05XY6dMAVqCl3QQ5hwR1bzSp0Om/VFWLVqFWxU8zBr2jRoXrUKztp7P5irFkBoWQe8bkKt6AefogFgCRVHQF63IBBJwLvZFKTra3L/kos/vSld+gQx6UjP+Wh5345UwsNc1yWam5ufGQ3CuFSSovvoVrrGUGEGzwJtWN45iRtmxwxBktDm5+AfIgFvT/LDh1+QoLdGAtXiYHKehJn/WAlfSFkw3qXh2WwOXvtyDaxrjADj46DUkoY5wm4Nf/vDE5uQtC/ba9oNmk1QtyxfedGW5HolI+4xx5Tf+6JAgaTYQAMDBEWB6mjQ6edgWaIG7mxZ75mcJzTtDvX5NOiSCBc2N3shhiPnHQRvvo7fTQdmzJgBb77/HuxdMx5qbRnqwIGY48JMPgATUgWIWw7ohAlZQwOXE6BFV2AtAKSqY1+4qiu9dDTM+2joww5Twng87pck6bcAsGbdunXX7Ghh4A7RJEkbk6VS1V4CB37bBRpJWMwBXM/hCVHYGCekaWibVAMPEmloPmwSrAwjbTYPyZILMzeWgH9hNRzLRyHtGHB/2ADh6P1gnV4EwmSguqtOePDBBz+SMXPuoUcc+ct//mOLZ+1f0vTl+7rudVMZAnjEOgUaSIYDzTGglfdBy8RJ8PP3lwESL35jxiwYn07B+nwafqergIhXaKbiokFYCwlIUCr4N3iG5D38UYDjIhIcQ/sh1JvxktNNhoKcC7DMUAD55NZK/NybS58kpdnRa2BHvX+HKeHAgJuamg7OZrNXMQxzcmdnJ0KkfwTKYiQF80sf88beAHMmuAB+0/JAmHyeYYZteIL1BM1CnnLhQ9aGxzkLnpubgPKsRlAtDQIuCQnZhtgHHTBnWR52D9XAW4UuSDXGoX2POni/qxfmJmaId9312CayUqTy3pyI5ePyuwmg8CUfGZhIUOAzLCBIBmTTAZLm4UNwoaV+HNzRsgowA3x23QSYH4l5nuEb3/23V/TrgVFZNkjIYVjJJcIgDZ4RGRYQOR/27UPjPptnYQ+LBNaywQASeigK1lgKOBOqb3u1mDd+nlXHErgrk7PDlRD7MX36dH+5XP41TdPvrVu37hbEkPkcePph0c0bg76/7ClrJ0wjSIgACQK6/D3Ksf/kjg5l2ho+VQfH23XMiB+ehDK8dMA0WFXvBzdCg2yp3keAeH8j7LmmBDU9OkytroM1pRwsDQAEGyeDvxQL3fXPf24CND73y98KFK3C3v/37OOf4Km/RhBOP4ijFjfaFrBFFfwYhqEoyNsusNFaWA0E/It24Z6eVk8JBYqBWQEJNuayngL2Yq4peojRKUNxMIn1wax4BELxMCxXyvD6qjVeksPhNMAZ0QhMKGBOKQGy5UDax8PbagH0uPCDN02t6Td551MJS4dlckfxQ0eFEg7Ip6Gh4SBFUa4hCOKkyq44oqK7qTp83cSu3OX7Cj4I6hYwuFi9nfDTlHBw3cPQh0OTQLA0aLoBKwI83BfjYTlCWUwVQYuwYOo28KoJkygB2OZuMP/VCvPGTwQfLUJXbwbqGhpcFZiXCyDRq9u6J5Vc7SVm0oQFjz766EdgBdHcrqPY7HyeFWNlGfwEBxSFil4GTRBhPSdCpqoa3rFsuGftB57S4e4WRGDiyjARkRu1nQIKDp85C2b5fDCpoxXK+Qw8IZc9kKhpAPAVPgL7cxb4i0WgSAIUl8TYJayxVWjxwxEfMPSBuXjjb//ywQdj5DAV835wK2mI766rq+Npmv5tX4UF7ooDgE2bciOH+HUfedz1dbHTx3ekF+/BMFDH8sCqZoVeBUuYKpx/SEWGoIBuP87nJkakzcqYBh768RD+x794XvyRIsDGKnvbhTTPw3OSAK8lScjuVwMdCRoKDAkWxvEsHWJlG+raylBTIMDakAHepiCZrH1fjNZqnSXng4xBXPu7l59ZvyUZ3QzUg/sI/DemmSZETBNIkgXFsUD3cdAjiXBXqhecYBj0ZDU8tmYlZIAEHxAQARum0ATUhidCwQV4Lr3OS+5OAAvjwIALeQn8ugod4QhIkQQQG7phIu3COEIGQtHAYQB0ToBOxYaVjg7d44ORFss+qRAa/9iD/ajou3wbVTthZTY8WqL6+vqDdF2/XBTF77W0jAyd1iU1ob3qUoV3ZgXi4CuqUCUIYBoqMAwFim6AwLHAIX4MEnSC7qW1IV4TlvAglCAikaG3Ewtm0X2BTheXRoIW20PH7udN6i8GrlANgotK6PHQA2i0D9p9PvinkYNX6gHsw/eElhgHPZQBHEmDYNsQ1ByQHBdszD7pKHZU0/PqN0/g3tKKvtZHXznHJK7ZixdAkAseXCGOKeeS0OmPw9P5NPwdDG/3G2BAxc9PE9BwbtMkINo6QIpMgt5QEK7+4GVvN0QnDO5657M8zGRpsCgWZE31wjpBvwBKPgMEQ4PO+KBHNyHvUuDUVcOK5tXM6xL8Ljmx4eI/LW9BC3eXb6NRCTdNyoQJE3yO49xZOSveOtxOm7OCwfB4Tc5KutUT5MRlhqWXgLSDkt+f0BQtROrm+CpgIUiSwHAGBFkKRNWBiE8EpVj0yn99FAu6bQDHcF4Q3Ks/RBMOq/I3Mz0Q+NcrxPd4lVywHNvjeiB5CdZQSI1bhhUTJOjdeyLkasPQqxbBJFygPdIKG2xTB3VNGnruS/2n1moLy/m6qthVdb3pnxzqD0G4VAKOcj1qbZJmIEMy8A7JwyNqBl4BgFxFuQY+EOfMORB2b2+GiGFBLx2GNzQF/pxr9ZR1Zs1EOCAShcNMBSKpbuABP1QKZFQFUo4LwbDUXDDNFxAWymb5npIONUWGPLXZ0R+zEpGfP9y84aVdXvsqAhjVSjgwSePHjz/McZwLHcc5YzjPigunT2fZ7vZ3ApJ0xg82dnwCOvHcxkYu2ZGLRYL8TMVQjnCy2fP2oHmi1iEhxtAQZSgol7MQwgRKzBbBxY4o2gSWPmHeG+6AqHIuOKTrUWF7XKAIj1HBp2HQTOR9sNbRYZUf4GlaB2tuA2QnxaCHdyDv6F41vt/HQVThIbLBmfDkfa9/Ahjr8kjNODbbuWQawL6zJQnCsgqCY3nKZ2H5ElCQpwVYGWDhgWzaQ97Gs98Ju+8JzWvXwStaEb46YzrUpdohFI3AcykZHkmnPAVEc3ScGIaQosL+VVFIEg4wniVgXZcqlpfcKsufQEpYUDXuLJfhxi1ua75s/vz59Isvvuhxzoy1AWblnUASCIdBEMQdDMMs27Bhw3DVIBJ37T7jcsrnI057e+lWQbUvClTtzRe7z2+kxG9WgQPjfQxwhgq8R3UGYJu258hAMxRbvxLaYFJOf91dhdiFYPpR1xC8EBOgFZKBdICF1pogPJ5qh/SEIKQiHOR5EiKT6kG1DDDai9015Ky6zc3Ry+qrZyXL5ulMJn3W/qEExAwd/IbmmdD4QgVcEBgBKIuEAkVAq0hBN0dBcz4HU5uawJ8tI0sM3LmxGQ6d3AgRswRr82l4iw1b/+xN0+g1pTkGKN30iEExXogWAG7HLIASZNlT3zCMBz6+pL4aqdIpx5d8JL8BkRXH2mYS2Cl2wkp/PXauRCJxWN/x6RKfz3dea2vriqGezTv32GMeqcNNyy15/i+bm9EhuFXt8mi0Ni7LNyc07cRpFAlRFyBE0B7sPVvJukHl87BqKCR2cT2lw/Q4E6mT6H4MUgrBkfBs5gLIFAFpNFUDAdA5H6zIpaFNBEgJNLTZBjRNGA9VOfLSkEmGC5lUws2XvhZ3IDQeOJgaCAFdLgA4mrfDSTTrEc3YDAUUyYCpm0DSLGgMAXlDA4fkwLB04H00lG0XViN9Gi2CjwNwGibA9ctXAG5vXCj8K1nRnpf8/L9JxWhQbP1Mx7ZORDZgVEb0oPEU/VgkEl6wMpXCyifiuKqqmJzTOmPxxIR72tdg4s1Y20mVcFO3MY6oKMpiiqLWtLS0XD+UM4omadiiZcNXFbpo+TMDfoqtfsX1YXFmOC//Ys9g8KBqh/RCHaJHmuvgtthPb00hs1I/DTXrICqbAwR6Qe1+Bw7NIPYLeIxJFMuCSzBA2QxoLAdttAnZAANywAeZTAYSGgmi5QLPMhDx8UDnSxDEolrDAsq2gPZh/qsGJjqHsICXF6AgK8ChiYwaQiBAsQMi7fc4KmTKAJVmQebC0GFZ4FQH4E9rWwDLMNLAHk/w0us5tdhOI6w+SYHF0E26q9M8KfzR1PS9++lkHC+WuFtNzax/dXa+e+l+83/EETB/TVsHd9/GtfgRHWs7uxIO9L++vv5gyzAvCQj8BataWnBX3N7Cvo8sipvnzH3Q0ezFFy97c7vzWq/00ZeM16xFM1nBw+cMkZg9YgDYCIOI0C7oIOmvS/QYmigXTI8zwgMs6y8VplARCaAYBgwdnSkcyLYFFk2CGAtDoVAAkaC9cImuqMD7ONA1GYKIFOc6YJt4enSBJSlwHeS/6Oc0xMMYFxTBLMrAIBy+UaFUYwQoOCpogh86bA5W0za8YObgFRW8hIIi8I8YhHs0ghr2PwWAFdndjbLhleJzJPNr3THPwmp9/PDU+32L3y9rC346d/+0QjsLmvOpQq/jHvT8B2uvGNPC/0hgZzJHtzhvuCuW8/k7KIZbvX7j+iEBjbp6zn7zGv2hJUq+u/7MpUu3m975yurY7FBX+i9TCbJxIueDCLjgs2zgXEycxki9CyTh83Yg2jNVkaSlwqaEiG6YJu3tkFgbhIDDpFfPaDtI94k7Du5l/WdNBE7E3xMcDYame8W1yHOBiocgxLaBUB2ul6zt2Ag57BEzeSaxio9nRci4LmgREdaWFfhQ1uBDCuAp2/YyZTz6buA8Xl6PSYp2sAPTQPfQED19lDixTbPMhGMjmxTA3lVVx31BiG2IBfi303yXcOu/2tUvTq77vUMyt7354XoE/R5rozFYv72z0tDQcLBSKl8SjIQvXL169aBxTO/ac26BYJmvnPHWS+i9H0wjbvDRP05q1iJEwA6qKgRICth+nAzvEIXKwzh2Py+hrQNbiTViGMMi3E1FxaTreJz16PDB5hGHIsgwKqPH8lTht8D4JaoN/o0JAagzJAm64wDnwfIjsJPteWddxwGZYqEkRWANAfCPXDfkgtzDWcb31Ovpwl0KBb06Q9imRldX6GrAAAN8Uf8KRdff5126iyPph0zF/Kljmwei2ykZjDwlCMziVV1dD9+y78HXBiSh8fRnH//mgBBnhuMvLs+l5g9GqP9N9+70O2FlMjwMNIwrsiT9K5IiVq9eu3ZQ9Wp/mHfoFVapOHHBsrdOG4oJvz4Wq+bS6SVfYPl5kwQByGIBQkhLbejAugSQA7zyaJ4yDDgmmqYEuATyWUB/SAPr/jZXQlQwL6cHAT+96sR+khncRSvZPOiB9agK0ffDC2CpircLImUovsEgSMiLfmiNxOH5bAaWOuV7uhjmntUF+Z8Ez4BDEbvrusswFP9VQ9NECoyLEQQ5Ulf1ve6u7rvxIyIwbIZzuGMCAf/eQZ/vieWd673d8XuNe8XrWbZXkAJTLn7zWaxi8ubp4Cl77FOiqJPeXvXOGOzhf9NOuLmiTJgw4QhT0y9led931q9fP4Bbu0UCy09TMGRoajjgYLtDLoQuWbp0U4L0YBXyGpa+ZLxhLdqb4yFimcASmJ9KeNadDytrbYTF7wce7s+8GTA3cbb6k8k9tfNgwD95CB5IMK9Q23schLrtAMUyIBsm+GkGTAsxOmiwfT7IURQspzAeSbhPZrJEBqBskoxfc12wXfcoAPuxfmoN9sKgxD9ULhebgXAJj8W7kiYgSMEvKIXCJ+oDF+176MLqRNUR3330zwjI9pE2Zcr0P/VVcJ22IxL1BzuHQ33/f8tO+Am5YA4qQ9O/5Xy+5atXr8a44jbnn94we861EYav7nzjxQVbYjza3sm4hIHZMyj2uSk0HaxybOAUHRICD5qCnLwAAseDqavemQ+dNv17XKXCq6KIiIE6ADflKaRnovYjw+Hfm744eD1JgGZbIPAiqKrmEY+aDAOtpg6tLAUv69qSJwEOWwMQxlCF65DA+riFhpb/STAYDGs28TLhOst1XfERYB2LZ03RL+CzbnRE5wYoeMk2Xroh9gI/YDBzbkxwoCdHO/MWvffGax+XVd2kxht8JFzdvA1hoO2V92i/779WCQcEP7Vx6hHZfOaKqBg7ftXGVViXutXtR4fPFKeXY0VZd2acu/TF1Vt941ZceNb4YNjfWnj5yyK3W4PhQMC0IcQIYCCjkWuDj+FA1zUvxoj0aibGFzBQ7qWlOh60IMYcOTRPN1Vb9bM9oYlqkWjKup53hsFKDac/LkkwHORsG4p+Ht4uZ+FtcL631AZhBcAdMi2A6hCY//qaa5UOQN330cIHumXMIFHpKwhOmPxjO7BfX9XSADTJJgUcOB78ee6hl5Vt59vff/N5TDH9RJu91+zbC6XCRWNKuBNlzGzFuv7US9CDamvGvQzHPP3BqlW/35Zn3TZ7zjWCS+55xjv/Ompb7tvaa68GuP8wv//EycCDqGlAUTYYugI+AkMV/VCEmH/ar4SEB7mIZzIDf0fYwLiOd/7D+CKS1GDUv18J+7kzHFsHhqY8/kMZY4ViFNaqMvzb0aAZ4HuvAjywAUAuARAK+MDph/RNAJRT0YB4t1zWv4t5rSSD2KS27LogCoIIRdUEH8O8FWD422P1iQdXrlyJMQtvA144ZUqs2JVJTd1nTtOC557EjLhPtN0aGm6zHeeWVf3HhV26DflO6Pf74+VyGWvZBiiuR42Ap0xsPN00tKMp3veN5uZm9E987jnxli9+kRdLiqLZxJQfrnqveahikZsLZSEJ9+9HSyc2Egxweh6SnK9fEVkCXBMr+v/TUc+p6pJerilm3dhkf0kVY1NAuWiOoinqgItaRziAhfAFAyDEklAkWNgIFLytq7Bc8p1+W0n5/R48nN+twi1YumQBAzzNzlOtkmc+Bv1wZlmD39I0/YHLkFeRJhzjasbJ+A4MQlCUD9BjG+KZJSk5e8KC2bOZu5YutRbvd8Af3aBALHjy6VM+bfJn1M2IOG7+ryrDHLNhw+hPZZs4cWK9YRj35XK5byiKsk0W1ecpwJApIcdxk23bPsdxnB/yPP8XWZbRJe15wz6vEyP0e68vMxsb60q6/heWZa/6sKXl+a15989nzdqXKVtLwKmdfF7zU1udyrY1zx645iZGvH+a6Zw4OyCBUMwDg2EA/OXHZmhAmLjrodcUzVJsHMYEMVfV09L+8yL+Bx0oDE+AbLjQTlDwumVDiySdvqhU8iyCWhpeLFpwoEnxoNnuVQDaQM5sv4nJQRPGAlmBfsJUrf/xPLloJLPCpbKhLcIMIIweapWeXlZdP4sh6aX6xOrIDa++imfFT2vEHpOm7GfR5LQVa1Yv3hZZjfS1aElls9m1PT09SN0AgiB8W5ble4eqH4NWQr/fP58giBsURZmDnbLt/ngXy7LfUlV1NCIse8q4+4wZ19i2HVy5evVW8eT9bt7/3MuaTuspbz596VAJ/+PPuRrglSP44Lxxug51vA9MOQ8MgSXELjozAakdLMwvRdPUBGBIn/dv01SBxT2QATDQVDX6KyJYHwuqZoLL+6HXtGG5a8IbEeH0RanCJpO8imcvllXjZwbBvKa75ryPfTg9WbEsnGiYcH84FCwbmsloqsbVVNce0NXV9jJqan2A/PWaonPOgpoaoZrg5dC4cQed/8aLWwXsO2PKbotLitJOs9S/dd34ums77TTLPdDa2jzkecGDmDcimUye29PTc5uX+GDbEI1GX6Mo6tienp5B10RutxIyDLOHaZrv4cAGOkbT9C3BYHB+LpebxTCMomka4gFt8t0NQgjDcuuUKVP2MIulOyPx2BlL33//MwP8Nx1+uBjKur2lTO9BdeunLD0e/sOENFSdWwhARwFeOUAK74u1f1UMCySmsmFGDeabOgAmVmdgXpiJpz/Wq8kgSBsI1+qPJ2IiOOaIGgC6g4XCPGQIGtZZBrxLuVf82DI+nmtLRv3++ZlyGUu3PsFzyAPMNQBeo3gSOJa7uVRUfxQQJUMpq1jKCxOj/LGrMurDqLyLDzz4z3wo0vDtvz+EWE9b3ZqadptpmnrC52Nedl03Wi4bF6hqqYZl6R92dnZ+BMZ/qx86NBei8s2gaTre0dHxQiwWq3Yc59VsNjuJYRgwTROV8exMJvObwbxuu5UQXxqJRJ4rFosHY31aIBD4FkmSB+fzeS+4LUlSvFQqIcIdttFikn5cVsTs2bPpfE/P/4Xi8aVL3333M9PeFs6cs29Ud5/TOG3iRcuXD/oLuKWJWwggJADa5waC4VrkqDdMAFPfBDWIhibWKGJ1PsLxY/oa0nRjhYbVn93mwdoTNgWyS0CO42A9RcErcmHJ5QAnbMtikUCKOaCmNOQS5slfOJbTAjb8kvXS4ByoDwS/va6YQ7OM+On4prnBSPhFJREIXfTMtie+f/zoUlc3I2Lbhd/btvUwTZMvDGcd6afJBM3QQqGgd3R0QF1d3cq+9XxuoVB4PhKJXJDNZr21Ul1d/UhXV9cx2yLXTyzCwdwsCEK167r7Oo5Tr+s6Vr4PtOo+GuzuZDKJEPdv9/T0XDaY94zEvdObph9vO9Z3ghR5ylurVw98PD7x6jv3PfRq0cd+vxmUiVha9Vnwgtvb70sEYa9GVXlnL5aFKSQLrFrGFG+vLrEfGGPgy9ZfNOxgYB0z1whUPqd/dwQaNL8I6wgSni/lVl8AMH1bP4Yi+A41wXqWYVmQDQXTzF7ieDjXVuF2iaLuy9n2t1B5Lp/UNJuVnbdrZ06bd/qzj34iJri9csD7amtrDyEI8mzbtq7o6uraCM+W9AAAIABJREFUajLUwbyzci81adKkP69bt+7Empoa6Ozs9P53fX19OpPJnBWLxdpkWb7Pdd090+n0R0C1tvXdg9oJ8WUI4ptKpTZ1QhCEWkVRRJ7n31VVVcSFwfP8PoqivL2tnRvp66dMmRJjLOeeoM9/5+sr3/v7Fneq+fPpGl/gKUfXA0QxPW8wCd6fNb4f0fDjuQx3wz6AcPe6hwvTn7DdXxhMEI6HXYMpaV5NgweXgcSm/WXDBkFBTuThxXIeVvD8uBtVFYvit63V1Ah8trhY07STWIYFy1R+QwOc5eHLBALRfxWL2YUNMxpt2VwbnNF4+I+ee3JYeEXq6uoiFEX/auPGDSdt2wAGdTWbTCbXpNPp+oaGho0sy95RKpVu3LjxPxGVWCxWk06n8YONwHTb3QathPhmSZLuKpVKZwiCMEtRlCkkSf4FOe8qZuoFxWLxtq0JB2z3KIb4xjlTd19g6eoBNZHgAt/SSfqDHzv/3Tl7NiPWTGov5/NPnPnKs6f9pM8zOJQZNQPDuQrglf+hffOagALBcrzKBC8h29U9JfQUEnNDaXTI0GBbLnAEhyhO0GubsNI24G3O/e5lmv1/gxGRCGLSBec3FBjHYBSyliYv+obl3FJuaIhN9le1SjV1N5/01APDWp40blz9tQD0A21tLf0MpsPXyJqaGjzTtpMkmSoWi+tkWa6qq6tbrqrqw7lc7mo8C0YikWsRtHooujEUSkgEg8EQSZLHKYqyj2VZp6H3CBvP8/upqopZFVQ4HK7NfQpL0FAMZKifMatpt5lyIXtHXSxyznMffPCJspsbZh8a9NH6OpYyf/2ebl5z1yBKnj6t7+cHApHZxWJmHheEmG4CCwbQFLLq6h5pKY0bI2LUeEpIgYFKSPq8KvxmS4d/G9rrZ4KNmS2Dbgku2ODoheYAAEwN+Sbsk4jISSm5MlA98eVvPf63bwz6BZ/xgMbGRg/6VFWNJR0drUcP57saGhoSLS0tPX3rdXEul1sQCAQi6NvAMzhuLMFg8GSSJJcSBNE+WDN0YBxDoYTes0RR3N00zeWGYUAymXxJ07RjCoVCzu/3T/P5fCvz+Twq5Qscxx09VJ0fzskYePa8abvdIRBE8ZmV71+KOZGb73gL58/3i5nMBl4SfvOD19/Er+KQO6AWAtx7pD960nhFBcnRwMfSYNiGx/+HSoiZMtgsAtPb8MzIQA9BwnLKgQ8oYuZVWwBd2l65HRarOlDS1KqZgcbHeH/2g8S48f/eaBMnDce5eEt9HDdu/G/b2lq/v739/5z7PERKQRBiiqJ0osKJojitVCqt5nl+nGEYrbi5VLyiGMIdsnjxkCkhDtDn852madrvwuHwAblc7pVQKHRsoVD4K35FsPN+v7+DZdkXenp6Th4mQQ71Y7042Zxp0w6DbPnq6nD024+sfm/DcccdRw2AK90xf77fz7HrNF17GUryN4f6jHhZIpGc2NvbfTArQo1tAOWYnkmKoQr0hJIW0leToJsOAFZKEAysoxh4Wivdd6XjoONkyNqPZs4Ukz094IskmtlE5MWugw761sKFCz8362gQHfDk39DQsJuq6j8nSXpRe/uGrYo/bs876+vr73ddN2Ga5j+7u7t/GolE1riue1k2m/1HhXqjjeO4r+i6PqTEtkOqhDjweDz+V8uy0n1Q9muy2axX0xeJRGySJPd1XfesTCZzqt/vn14ulzEhesh3ju0R/tbcM7umRghQ/J+iFPfMQxtW3rn5PQvnzAlMFqU3i2qpvccqnbzw7ZUIcDRk7cZw8JIvFpRFUwkHwpiuZlleLqdmOiB4EBgAPE1B2bahwPrhZb0M79XEpt7YmR6oeh90X5Bohu7cOMvOam8mJ05Y1H3kEVcMswJin6mGhsleKKClZe2F21MJs7UDTyaTh/T29v4TN4yqqiq5u7sbaTW8hhtIKBR6u1Ao3GYYhheSGcq1OxxK6CcIQsxkMt5CrK2tXZXNZu91XfdxwzDeqwQ4p2cyGUzs/Q/bytZKa8dd59USHTSx6XhDLR8/ob7uVGP8eHlzuMEHDj78pmI+f1qqlPtyl+u+ty1obZ81rB8lk+L0np7ywYIACUP30K81ywaWoTzqNsSgsUzTg0lc6zjwno+973RNHbJd8Gf7NUnjnMgPenrSlzOT6k49558vPLiFUsahmhlvgY8bN/FwlqWvdF377HXr1g0aKeFzOufVf7Es+03Hcf6EdZz4Jx6Pv+jz+Sa1tbWNj0Qiy7LZ7OzKc7a5LO6z3j/kSlh5GdrMqiRJL0Wj0RM3bNjQlUgknkOyF4qiplMU9Xg2m22NxWJT0+n0FrPsh2pGh/g53gLZf9q06kJn6k8Taybc8vdV/35y4B3oNXUd+mjCtu/3C/zFJ73xyi+GarEuAvjxARx3Q4NpQ9grT6LBshGOvxIfZEToclx4x7LgvYi/7opMZkigBS/dqzE+0Rd8Wi+qCSGRPPS0F14Yst11S3OD+LJ+f/BO13WXrV27Gi2pId11Pv7OZDKZqKSeofPZpGl6P5IkX0XfBraJEyeeIMtym6ZpHxaLxfJgwxFbGvNwKSFm0JxYLBbvH0jvwZdXVVXNkWW5gIdd/DfGEH0+X52qqkOyYIZY4T73cUc2zLiGcOygTVkXP7VZcer1s/evnuz3vUmqhtFd7Jnzg88I/n/uSyoXLKwLRKrbi5kvS1EIlPLAQ39QHqEFEQmNIHlYT7PwAuHc+kO9dMHWPvfTrkPzU0h3fClEso/y0eh9LS753eFywAxQ4U2Y0HCC41inUBR5dgURYbDD+Mz7BUHYS1GUd8Lh8PdzudydWAje3t6O2jcFAFaicwZ3RFEUq2VZHtIjxuYdGzYlxJRSv98/pVwur0BlkyRpn2KxiK7mVzDBOxwOFw3DaCkWi3tWgBKGVeBD/fDjAKgHAexDJjbNlHOFX8Rqq89/fMW7ywa+3Lgr9oXpjsxv7Hg4Xlt7lSPAz89cunQTmef29OcygHuPCcROarRsEI2yl9GNxJxFo6/2gZLgdVuHt2pqpi3q3DCoAuTb998/Dkr5UUvXvuBw3HE/WuolLgzb+b2urq7WNNw/8oJw34YNa++uyGZYd0B8RygUQiq+5/GIJAjCpbIs31ChX7QEQUhSFLWRJMkvFwoFdAYNqQk6Ukrovae6uvr6Uqn0Z9u2pzqO8zdd7/fsBoPBIwqFwjOIqE3T9LR8Pv/gUNdpbc9C3857iIPGNS6OC+LaJR8u+9nmoYyb5s5NsJp9L6Eqh5q6feiF61Y+t7l3dVved2lt7RebOlOv7+vjodooQwCJYZDIxQLQxAQ8LGdfPA+sg7blmXjtkuOOo45/8EH79sbGeEAQFnWl0qdFpjZdfuYLLywaRuXzqpQnT2g6J18uzWVYOLWzs3NQH6mtHDc1fvz4pnK5/L5hGOf5/f5eTdOWYAgtFArdkc/nf1BB9sd6048jBmzlK7btsuHcCbEnnjMjFosdlU6nvTSwRCLxYaFQ+Ieu6+fi70VRxC/QT5PJpKaqam2xLxVq24Yweq4+pmnmwcXO9EWRYPz0B9uXfcTEvmG33eaGGOZWgfRNdWj61A7ZePXyD97s2dbeXwGQOrmqNhZPd0PAsr2UNU2UYJliw5si/72LS5k/buszF+82J8lQ2vVd3V2n1dXV/i7nwGXnvfsu0k4MW5taN2n3smLcTPrIm1s7W4cl3W0LnUfr3aitrX2ys7Pzy2huYuwvkUh4CfGpVAo3hwcKhQI6tSrwdcMmgk0PHm4lHFBEDFM8k81mDxFFcS9Zlt9LJBJJ13XPSKfT16IAJk+eXOz7mXIcZxwG+Yd/6MPzhsNnzhS1tuwDoVDg/x5dv/Khcxsb2QEvKe6Ae2/snCs49kVmSflqSPT/xLGI+09b/prn7Fg4Yb5v4YYX0VT4VNPvepq89ECW/+leiB1aLnip2mV/FJ7SitBSHxt/fUvnVrHf3jPzcJGWtCMhW7ygs6NnTnBCzW9KInvFBf/613B/BKlJ4ybdRJK0y4r0pSOJtlZTEx5PAPcSL/j3UOXyI9093QdheVhtbW1PZ2cnrkevLC8YDP44k8ncODwr5JNPHQklxLdS06dPp9ra2pbJsoxmKRGNRq/LZDKX4y8nTJiAQdI/d3V1PRGLxX7Z2dm50/OZf6l+2mmqUj5UCNac+VTzm8XNRY/pnrftNicR4MizaU27MiAKrawgLu7KZh9qW+5vWQifThu2iGH2nmGab82gaEgCAzTBQY/AweNqqucc00HE/S22hQsXkoF//IOrVfSvBhjuK229XSfXTpiwniC4P7bnc39ZsOytYfdSN9U3HZQvla5gGf6HbT1eDuiImHsViwyxzT2X5+TJDT0+XmzIZzPP9KTScyVJak0kEqcqivKtvlhgGCEshvMM+PEJGikl9HbEWCwm0jT9dcdxpqXT6YvRQROPx1ewLDuttbWVrMRmfqiq6rOBQMDX2dn57kh9jYbjPQdPnFivtmf/MGlc9f/eu26LqODEj2bOFOoS0l5Gungyo+oLYgQDDM38Lk2az5kuuVFg2X8vWLoUrU5vd1wCQNkA1mQfD1GSAolgoEXOwXo/d9eJZf3MgXGgot8zdWokGAhM1yl3vs/HHN7SvHZeWAxmA/H4nToF99DxurV4FkQFHc7AO3o/U93pu8KRyPI1zatvGQ5Zf8ozPedOVVXsQNcmZrqE9VIhX1pmGBaMH1/XRZD0JAB4bcOGDbNqa2udUqkU3xHHoZFUQpg9ezbT09ND67re25dN4w8Gg38LBoPXrF+//r3q6uplBEE8zDDMXRs3bvRy9wRBmF8ul3daRtcBD+r/JOp/zpiW+vdcxxUVMKQt8lscdxxQ+y6d1BCThBmsjz3Kstwje9u64kDRemJczSq1WHyVypbWE0rxLFLTGkUCQLABdBIgI3Ev+sfVPWsZ9hzaJffqbWkbx/kYiE6q/ZAKim+nlOKjRZN7sr5puXbcg4AYwcPm7awohKcAddV1Xycp8gxREs9ctWrVSCKref4IhmH2tC3zXZqmgCKob3Es21Eol73Ut0kTJ6wjKHq6oihLVVV1RFGc097e/gl0geH+aIyoEg4MJhaLSYIg3M4wzM9bWlrex1hiIBA4N5lM3tXR0ZErFArIP4kJ3+NVVd2qM85wC2qwz9+/vnGWWsremAgmT3ty/aqNn6WMm78LPa3sXntFHR89mSbIOKjaNMYmrFIhE3IUA0J+gZAtK+3EQiwTlBjKtd80FV0WxdBKqr1dPW/kwXX7la9uSq2m5u8IStL9LRtaPkEaOlh5bs39dXV1PwaA5aVS6WulUmkBWlp+v/8gwzDCtm3/DZ0y1dXVK4PB4AHlcllpb29HhMDh/jh9ous7RAkHgrPjxo1b397ePiEajb7Lsuw8x3E2dHd3x3EX9Pl8NYqi6AzDbKQo6qeapqG7fKduaAnYHR2LwyT7zgudrbd/taZGeGxk3PIjIreBeW2Y2PAjVdVmExT8oKOj41NRCoapU945swLMdDu+o7q6+sCurq6XWJYFzITx+/27O44zV9O0O2tqat5rb2/fB7Nlhqk/n/vYHaKEA73CFCXTNP/EMMzJlmW93tvbuwcG9mmankUQhG0YBpqouCMigtuTpVLpuEqCyOcObJRe4O0S+9TWH2lmiufWJOq++UTr+zutJ/jjMq6qqprgY4U/cDxz3YcffrhVcJJDPU9oZfl8vtnt7e2vV1VVtaTT6Tr0ekajUcx+sTKZDF359zTXdXfLZrMIUjVi4YgtjXeHKuFAhyRJWqSq6iX4b4qijsCsBdM0H0PzQZKk50ul0sHhcNjK5XKY2Y7x6WHLXhjqRfFpz9t7woSqQka+m/KHFq3qWvvy5ueokerDEL3HO3tNmzLtdNtxDi0rpZEKun+8+6QkSUcriuKZmYlE4mVd179WKBS8kEsikcBC3S+uW7duXaWI4M+ZTGZUlNSNBiX04Gvr6uruwSRZ27btXC53HZoO4XD4PFVVv6ooClIsH2FZ1ivRaDRnmubRxWLxuf668p2zTYfp7EpYaUxpbLygXMw3CoHQ+TsjL8PMxpl1WaXwGx/HLG5e3/xoJf9yxJ0byWRyTiqVeqO2tvYKtKxc1z2ikn/aAADNPp8PzVD0tp/uOM53stks4s2OVIjkMxfpaFBC7KBnplVXV3+7q6vrTwO2eyAQuK1YLP4wEolgOdT0QCDwQLFYPD4Wi3Wm0+nazdKLdk5NrPS6vr56mpwu3JSWla/sDAMZOPvtXt/0rZKuH+UL+c5ePQRJ6tsxdioWiwmyLAdFUfxeLpe7prq6+jnXdZ9XFOUrJEnOMQzjIsdxPpBlGQtzoZK9hXRvo6aNFiVEgdC4s1VVVZ1i2zYelNuz2ewiNC1EUdxDVdUvEgSBvAgYWzyvVCoFKIo6myCIfTJDVLazg2bFM+emVtUszNjmzalUCstlRnMjpkyZHaUN5R6CIB9esX7FDoOwj0Qi00VRXNHW1oZrYnIqlUIiUq8NfMjx51AodLTP52syDGNdNpv962gT7mhSwo/IJpFIvNvb27tnJBJ5os99fLHjOCuwohxbPB6/LpVKodmBXtTYZiDDo02+W92fScHo33wsecrKfiWskBFu9e3DfiGyIG/YsEFrmr770XKxfLrfz313B+1+nmzwQ0xR1NpMJvMknvEw59N13bM5jkN4TRN9CIqiHJjNZn8Sj8cXpVKpAezbYa/O2NbJGLVKWF1dXa8oyiqWZZEF5xFZlpl4PP5CKpXyqgRwRyQIYo5pmm+hORsIBPYRBGFdd3c3suoOCgdyW4U4FNfXR6uRx++nJuk8T/nYv7a1tfWjzY6iVlffsNgf8K9a/f6ykcx6+YgEEP0sGAxe19PTc5bf728jWfY7uXT2ebSYAlLg20VLfx4UzZNdKBx6olAoHhkM+MP5fB6xcUelQ2/UKuGA5AOBwLWqql7B8/y1tm3Xmab5PYz1xGKxa9PpNCKc4ZcxyHFcFsukwuFwKJfLDRm99UjrQE1NzXhdM28hSPfcdDo9pBRcgxlLPFZ1fzgSuXXNmpX40dshLRqNnpPL5X6FEJu5XC7PcRzwov86w7A0XVOvsy0LIpHQDJegfpzLZE4JhyNLWJY6taenB4Pwo1IBUZCjXgmxk4FA4KRisfg4QRAFjPFgOVRvb+/USgGmIYrifYZhfBPNkng8LmFFfywWO6ujowOroXc6D2pVVdX0gE84Yc2GdVcPrPbZMJtZCktHPKCMmJ/FTHlJMhm/4v3Vn02aMwya6UGOjxs3brrrujHHcS7o6en5Ksdxtbqu72Pb9sMESUN1Vc3hBAl3d7S318bj8WdSqZ4jksmk2NPTIw9Dn4b8kTuDEiJejSZJUkyW5RTGDsPhcH0ul8N6PVsQBAxhPOqZH6EQHrpXFgqFKyVJurJYLF43WtzQ2zpz46tqTyFd9+s0ARlDUaMsLyxq7ul4Y1ufM9jra6rGPx3zh05f3rx822H0B/tyAAyyH53NZh8JhUJYDndlS0vLtZIkHVUqlR5LJBJP9vamv5ysqnKD4eA316xe85dkIv6rnp5ur1Z1Z0F93xmUcNNUIu+Fbdv7VXAgcYeMFIvFzIAnLBgMIhhPUyQSKWQyGUQFP89xHOSUO8SyrBd2RF7gYNch7kTNzc3WxHHj7zV07baO3l6kMMM2rIusqalJymaKj/kl3wnr16/f5uLj7Rw3rkcCq20syzqMoijkNHmIJMlCa2srE4lE5LIii8lk0m3b2LoXAGD5lVeNj5lVfXi3zwuC8JX29nasyRxOPNTtHN6Wb9uplHCzIXgLsKqqCkFaD4lEIndTFPXtVCqFiFmonPsqisK6rvsyTg4e2v1+/y0kSV63kxYMM9OnTycQ97ICQptFEOX169c/NKSrofIwVMBisfwXx4ke39OzfERNumg0OieTybyBZW44b5Ik3UpR1COKoryE/xb8IpSKRUCmKCDIMwOi+HIfVtHJHMf9M51O44fWQ00bDrkM1zN3ViVEebA1NTUItz+rurp63ooVK95ChYtEIn8kSfLSbDbbads2EQ6HX8rlcgcKgnCGoih3xWKxB/vOlQszmQzSbI2KjIntmdxkMnm04zhnUwTx9+7e3l9vzzO2dM+UKVNqy2X5bpZljsKQxFA99zOe42HNJJPJvTmO+7AP9yXb3d0NM2bMOGTVqlXP4fGjrq5uj3K5fGWpVPqGFJR6fD7fg91d3T8gMNGf5f5XVVX8OO20bWdWQhQ6ZkwkSZI8ureyECORyPi+RO8VpmlKEyZMuLRUKn03k8k0ocOmD97uKOQaR2UVBOGBYDB4cWdnZ+tOOHteYgP2OxGL/Yxm2TuGYhzV1RPrVbXwc79fOHkE6+qoifUTL2tra70mJIabXNZ9IZPJ1IRCof/leX7vvgD8t6LR6DoA+GJfWKIHSETu819Ek3S3TdjpYrb4NFa9bYlleGeZ151dCQeApGoEQbghm82+xbLs6aVSCam80Yv6497e3p+JorhEluUTksnkH3p6er4niuIakiTjPM//kKbpb/RduzCVSu2UVfx1NXU3tHe2XzlYE2zSpEm7K4p6dXd3F7L5Dpc7H9cbzpldXV09KxgM/rZcLNWLkv87G9atf4r3CV8jGZIuFosP4YcykUjs2dHR8R6e+QVBOFpV1UkOuLeyLHerXBo8tupoUdKdXQkH5OidA5ABiqbp1/L5fBjji7Is4+LEc8XXLMtaUy6XV2KQXxCEfYvF4pvIm5FKpY6Nx+PPplKpw8PhMOYgGiO4Cwx6HSQSCUxWfj+VSr23rQ9DkkuG4RtEkT+kUCjUpVI9pw+kD27rs7byeoQ4qXJd9w2GYZ5wHMdJ9faeXVtb91BHR/s34rHYRb3p9M08z5dUVfVHo9HbRVHEmtNbeZ6/TZblS8SQ2CTnZcSn2aHlR1s53q267L9FCTcfLBUIBL5gmqarquqblV8Q8Xj8yXQ6/eVwOPxqNpvdHxUWlRJ/39TUNHX9+vU/dhzne5gax/P8JX2LACHYh2tH2KrJ2YqLiHE1NUepiuGm82kvTPNpDeNmlmXNoGn6YIqiduuLuRVpmu6xLHiLYYhlw5mhU6kbPR3JYjHHs729fW1dXd2f2tvbTwkFAn8slcrfcVwHd757e3p7vy1J0ldLpdKjmJbIMMyzWEUTjUaRv2SnPsd/2tz8NyqhN1ZBEKqDweAlhmGMJ0nymnQ6/Q4G+mtqamYhgFQ8Hv9bNps9Jh6PP92nsFfjzogmbH19/eV97vDrJUk6v1gs/iocDs/J5XKozKMx6E9GI5GHMtnssZtNMF1TU1NtmuYMiqBmuoQ72bZtjiRJTG5+y3Gc5SOUiUPV1NRM7uzsxPdipXtXT09PFXo7y+Xy+X6//8FSqXS8Z6mI0h/Lcuk7yURS6+7tQWgTNxQKXWtZ1ok8z7/ah7CA2LRYF4hezxGHn9iKj+GgLvmvVcIBVzXWt5mmeXlPT8/liUTi+d7e3kOQ9NGyrNbKuXFP27Z/nslkDkkkEjeSJOl2d3f/OBKJXGea5puqqj7m8/l+QhDELy3L4tXt4X4f1BR95s1kPBa7k6LpxRRBzdI0bR6ed1VVztEs+55t22t6e3s/HuMb1gTmaDRai6mFfWb9ZV1dXXwsFgsgKWw0Gj02k8n8Fc96+DHEVqHIw92NkQR/Vjd0v+AXv5PP5/80cHasjH6n9WJvzdT/NyvhR8ZfVVU1Aw/4ra2tK/q+0Pd2dnaeFAqF1jAMc2AqlerCs2JVVdVB7e3tLyCchiRJe5ZKpTtVVZ0TjUYXybJcNgzjepIk5wYCAfS+1gwQ2+yoUAd+YBDDVVXVYwmCeAfxeEY4VQu9tEwikZgny3JSEIRHNE1boGmaxykYj8frK15bRL5GzfMS66urq6Grq8sLsPsZ/7SSUVqdiEaPyReKf6MY+jZVVf93uJMRtkY5RuqaXUYJK3myXjB/3Lhx97e3tx8rSdKXOY7bH8tc0DmD3HS5XO4enufbRFHcu7e312Piqaqq+hVBEAu6urpwMaHMbuc47lyGYdooisIEgLtGasK28J6BzBn8Gxc69m9EskUQL9Z13ZVoUaBCMQyjCIJQm8/nc/hR8/v9pwiCEO7s7PQAl0Kh0E/y+fxV0Wi0hWXZZV1dXcdSBAkCK04t6aVWiZPGl/QSopFvCsHsQLmO2Kt3JSX8iFCj0ejUTCbzYSKRuDCTydw0ceLEC/L5PFZmiIlE4pxisRjSdf16XEwsy6qyLPOSJN3iuu4Nmqb1DtQ20jR9q2VZFySTyaymac8ZhoHB4wEeimE1/UZslQAA8vhpmvZ1URTf7+zsfBXfnUgk7u7t7f3ubrvt9tVcLvdYR0cHWhD79+X6XlIqlY6sUKTfk8vlvlPp6ziapltRdslk8jDXdX+mKcrjpm3ftbPS4w3FHOyySrjZzmiwLHt1X3nUwgE+OiyHUhQlj6VRkUjkwWw2exwuKJ7np8iy/EOSJM+pqqp6uKur65hQKHSBpmn3lsvlHiyt0XUdwag2ZxeaIghCI0VRLaWS95Uf7Q3zNcN49kXF60NLf8C2bQVhIjRNW8Fx3N2yLJ+KgwgGg5dqmvZTmqbvtm27xTCM60Kh0B9lWf4rAnX5/f58n0c0XDEtcZd2BUF4TZKkqeVy+ZuyLD+z+e9Gu2CGq3+7shJ+RKZ4vsrlck2yLL/P8/xRqqr+LR6P/8K2bb5YLJ7JsmwvSZK74S4YDAY7OY77WWdnJyaHf4miKM4wjL+zLLtS1/UZAw/2+Xz7G4bhIal55x+//199XHfz8WwkiuJMXdeDDMOsr+wCw+X1+yzTzhePx1Eh0qqq9oqieA8mNWB/JUl6o1QqHQgAHpdddXX1ycVi8U5N0wRMB8T/h4XU6FXGjw9FUbP7QLmWVpwuYYIgcvizz+ebr2naJhR1rIYplUrp4VrQO+Nzx5RwC7MWiUTG9X3ZT6Zp+mHDMK6coxOpAAAHiUlEQVQtlUpfj0ajVxiG0Vgul78bjUZbSZLckEqlDkC2V5qmLy4UCt/sCzJfqKrqpqpziqIWO45zeiwWw2qOfQuFwkkAMA//WJZ1A5q6FX50dETcxrLsX30+3/vFYnEpALxI0/ReJEnmDcPYUPH24lkP3fSYVI3nWw+prqIowcrvEB4jTAPswXEiCzQsR5ZZlmV3Y1n2Esdx5nAct1TTtAsxdIO7miAIZ2EYwXEczK290TCMI/rwOPfApAaKom7J5XJzK2e6t/P5/N64k1V2dYogCKuibAcJgvBwNpsNBYPBvcvlMpYTnYImfF9V+4U7o3KMVJ/HlPBzJF1dXY1B/TNs216pKMpi3NGCweCt+Xz+fPyZZdkmXdc9M5Pn+Xmqqr62Gc+6i9UADMMcIEnSfRUg2r1DodBDhUKhvqmp6ajVq1c/ispoWVY1QRBduKB5nn9ZVdVrAcDj7aMoCs2/ObZtn1mpLpjKcdxLpmkmI6FwPp3N7MtQ9GqO43rLirwXTVIdtmMDAQQ4/WG1GgDwIB8EQbi8cta9maKoD/s4IRdLkoQ7/tuYV5tIJH6taRris5zHcdyFfWdgn6qq1w+EFfAZDMOcYZrm7yrP+72iKKf2sTLfR1HUlEKh8AWkl8YjY18ivb6TmOAjpW9bfM+YEn62+Dd3rDBILsKy7AGyLGPVgoJKKIriQeVy+QU8M5qmiabfQJZNEgC6K3GxCBLqolUnCAIoitKJ18fj8f07OztfkSQpZRgGmq4ezbUoih/Ytv0PVVW9HYTjOMRc/QbyOVaKmo/K5XKP9n8QpAJBUDOLxfxGmqYLAORxlmU8Ew6HF0qSRCmK8t1sNv91x7HechxUcO5ox7FzLCusMAxllqZZyID1hmVZ51mW9VYoFMoyDPP9zs7OJYFA4BnDMK5RVfVVv9//u3K5fDqemzmOe0xV1aMqH546lmWfLRQKUxHhwLKsawY+Sjt0Ze9ELx9Twm2brE3hAEmSJpMkeaCmabxt278Y8JYGg8FIpWbxQJZlX0T3PU3Te/p8vucpivq14ziPFovFt8LhMO56Z+fz+Yf9fv/rmqZdZlnWi8lksjmVStWHQiFL1/VuVVUn9tXKoQmLjpGjK0SWf7Vt++v9UB+xAklqk1MpGc+sQJJ0o67rawXBh3N7vd8f+GUlYH8VRRE/QeWPRqOKLJe+YttGl6LYqyp1e3FFUVL4zKqqqsPS6fSziOWDMXUAKIfD4SXFYvFh27bvr4iM+xRArf8aj/C2LY3tv3pMCbdfdpvuxIr/vsya2SRJHlIsFhF8Cs2+LyiK8rYkSW+7rvuULMtX9eGnIvXb3fl8/tG+4tWnTNN8GGscWZbFc+Q7lmX9uc+M+7VlWWejYvh8viWmaR5PkuQ+oij+QlXVuQRBvKlpGp7rkHL8iGg0XNY0Y7IsywOgUATDwL4M47tdVbW9sS/hcORLiEaAziDXtS9QFO07DEMBSdqTdR3WSpIEpVJJJElSxp02Eokc3we2vKSyi9Msy1oVhWQFQTiVYZh/FwoFPLeOtSGQwJgSDoEQP/aITTsBVm84jnOZqqpewaogCF/L5/ONtm0/JknSg47juIqiHM/z/Jk0TY8rFouIpbqgLxvnrkgkskJV1Rc1TTuHZdnJPp8Pq8YRdfyWQqFwoSAIVyuK8pNgUMoWCqXJADDAfhQLBIRrOI5vVVW1WC4rv5Yk4a8EQW0sFksYz9zXts3r0unsoUgTFggEXujs7ERvKDqL9lZV9dZKqAXPol+zbfvvHMfhuRfrLkcc3n7op2f0PXFMCUdmTgZyH/Fvtw+e8Ty/378ok8n4BEHAKoGjg8Hgc+VyGVHG56NZSpLkJcFgcK9cLochg2qWZbswnc40ze8rivLbvoyTYwzDeJhl6bxhWIg852X3YEKQz8e2+Xw+2TCMCwzDuNPv9z9h2+7vZbn0t764ZjGbzQcwhVMU/VU0Tf8BQ362bWMB9KuiKFZZlhXQdb1lJ6giGZnZG+a3jCnhMAt4C7sk/q+BmCCmwXkHL57n9zEMY5Jt24+Hw+GryuXyEtd1v+I4zgnIpQcAWSQ10TRtH5Ik33QcZ08AWFZ5fh1JQjvmRbsuSH0/owPlVtt20InyNMOw52Oeq9/vm88wbK3rkko+n38FAPKbVYd4H4jN/gwrkNTIin10v21MCUf3/Iz1bheQwJgS7gKTPDbE0S2BMSUc3fMz1rtdQAJjSrgLTPLYEEe3BMaUcHTPz1jvdgEJjCnhLjDJY0Mc3RIYU8LRPT9jvdsFJDCmhLvAJI8NcXRLYEwJR/f8jPVuF5DAmBLuApM8NsTRLYExJRzd8zPWu11AAmNKuAtM8tgQR7cExpRwdM/PWO92AQmMKeEuMMljQxzdEhhTwtE9P2O92wUkMKaEu8Akjw1xdEtgTAlH9/yM9W4XkMCYEu4Ckzw2xNEtgTElHN3zM9a7XUACY0q4C0zy2BBHtwTGlHB0z89Y73YBCYwp4S4wyWNDHN0SGFPC0T0/Y73bBSQwpoS7wCSPDXF0S2BMCUf3/Iz1bheQwJgS7gKTPDbE0S2BMSUc3fMz1rtdQAL/D5W8ykgjG44HAAAAAElFTkSuQmCC`;
const KARATE_BASE64 = `data:image/png;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`;
// ==================== GÉNÉRER LE HTML DU RAPPORT ====================
// ==================== GÉNÉRER LE HTML DU RAPPORT (VERSION ARABE) ====================
async function generateReportHTML({ compId, isAr }) {
  try {
    // Charger les logos en Base64
    const logoBase64 = LOGO_BASE64;
    const karateBase64 = KARATE_BASE64;
    
    // Récupérer les données...
    const { data: registrations } = await sbClient
      .from('registrations')
      .select('*')
      .eq('competition_id', parseInt(compId));
    
    if (!registrations || registrations.length === 0) {
      return `
        <div style="text-align:center; padding:50px; color:#999; font-family: 'Cairo', Arial, sans-serif; direction: rtl;">
          لا توجد مشاركات
        </div>
      `;
    }
    
    const comp = COMPETITIONS.find(c => c.id === parseInt(compId));
    const { data: clubs } = await sbClient.from('clubs').select('id, name, club_code, wilaya');
    const clubsMap = {};
    clubs.forEach(c => clubsMap[c.id] = c);
    
    // Récupérer les résultats
    const { data: results } = await sbClient
      .from('results')
      .select('*')
      .eq('competition_id', parseInt(compId));
    
    const resultsMap = {};
    if (results) {
      results.forEach(r => {
        resultsMap[r.participant_name.trim()] = {
          rank: r.rank,
          position: r.position,
          medal: r.medal,
          category_id: r.category_id
        };
      });
    }
    
    // Extraire TOUS les participants avec résultats
    let allParticipants = [];
    registrations.forEach(reg => {
      const club = clubsMap[reg.club_id];
      reg.participants.forEach(p => {
        const result = resultsMap[p.name.trim()];
        if (result) {
          allParticipants.push({
            ...p,
            clubName: club?.name || 'غير معروف',
            clubCode: club?.club_code || '?',
            clubId: reg.club_id,
            clubWilaya: club?.wilaya || 'غير معروفة',
            rank: result.rank,
            position: result.position,
            medal: result.medal,
            category_id: result.category_id || p.category_id
          });
        }
      });
    });
    
    // Statistiques
    const clubStats = {};
    const wilayaStats = {};
    const medalStats = { gold: 0, silver: 0, bronze: 0 };
    
    allParticipants.forEach(p => {
      if (p.clubId) {
        if (!clubStats[p.clubId]) {
          clubStats[p.clubId] = { name: p.clubName, count: 0, wilaya: p.clubWilaya };
        }
        clubStats[p.clubId].count++;
        if (p.clubWilaya && p.clubWilaya !== 'غير معروفة') {
          if (!wilayaStats[p.clubWilaya]) wilayaStats[p.clubWilaya] = 0;
          wilayaStats[p.clubWilaya]++;
        }
      }
      if (p.rank === 1) medalStats.gold++;
      else if (p.rank === 2) medalStats.silver++;
      else if (p.rank === 3 || p.rank === 4) medalStats.bronze++;
    });
    
    // Classement des clubs
    const clubRankings = {};
    allParticipants.forEach(p => {
      if (p.clubId) {
        if (!clubRankings[p.clubId]) {
          clubRankings[p.clubId] = { name: p.clubName, gold: 0, silver: 0, bronze: 0, points: 0 };
        }
        if (p.rank === 1) { clubRankings[p.clubId].gold++; clubRankings[p.clubId].points += 5; }
        else if (p.rank === 2) { clubRankings[p.clubId].silver++; clubRankings[p.clubId].points += 3; }
        else if (p.rank === 3 || p.rank === 4) { clubRankings[p.clubId].bronze++; clubRankings[p.clubId].points += 1; }
      }
    });
    
    const sortedClubs = Object.values(clubRankings).sort((a, b) => b.points - a.points);
    const totalParticipants = allParticipants.length;
    const totalClubs = Object.keys(clubStats).length;
    const totalWilayas = Object.keys(wilayaStats).length;
    
    // Grouper les résultats par catégorie
    const resultsByCategory = {};
    allParticipants.forEach(p => {
      const catId = p.category_id || 'unknown';
      let catName = p.category || 'فئة غير محددة';
      let parentName = '';
      
      // Trouver la catégorie complète
      const cat = CATEGORIES.find(c => c.id === catId);
      if (cat) {
        if (cat.parent_id) {
          const parent = CATEGORIES.find(p => p.id === cat.parent_id);
          parentName = parent ? parent.name_ar || parent.name_fr : '';
          catName = `${parentName} - ${cat.poids_ar || cat.poids_fr || cat.name_fr}`;
        } else {
          catName = cat.name_ar || cat.name_fr;
        }
      }
      
      const key = `${catId}_${catName}`;
      if (!resultsByCategory[key]) {
        resultsByCategory[key] = {
          name: catName,
          id: catId,
          results: []
        };
      }
      resultsByCategory[key].results.push(p);
    });
    
    // Trier les résultats par catégorie
    const sortedCategories = Object.values(resultsByCategory).sort((a, b) => {
      // Priorité: Or, Argent, Bronze
      const getRankPriority = (rank) => {
        if (rank === 1) return 0;
        if (rank === 2) return 1;
        if (rank === 3 || rank === 4) return 2;
        return 3;
      };
      a.results.sort((x, y) => getRankPriority(x.rank) - getRankPriority(y.rank));
      b.results.sort((x, y) => getRankPriority(x.rank) - getRankPriority(y.rank));
      return 0;
    });
    
    // Générer le HTML des résultats par catégorie
    const rankTexts = { 1: 'المرتبة الأولى 🥇', 2: 'المرتبة الثانية 🥈', 3: 'المرتبة الثالثة 🥉', 4: 'المرتبة الثالثة 🥉' };
    
    const resultsHTML = sortedCategories.map(cat => {
      const medalEmojis = { 1: '🥇', 2: '🥈', 3: '🥉', 4: '🥉' };
      
      // Regrouper par rang
      const groupedByRank = {};
      cat.results.forEach(p => {
        if (!groupedByRank[p.rank]) groupedByRank[p.rank] = [];
        groupedByRank[p.rank].push(p);
      });
      
      let rankHTML = '';
      const rankOrder = [1, 2, 3, 4];
      rankOrder.forEach(rank => {
        if (groupedByRank[rank] && groupedByRank[rank].length > 0) {
          const participants = groupedByRank[rank];
          rankHTML += `
            <div style="margin: 8px 0 4px 0; font-weight: bold; color: #0c5c3a; font-size: 14px;">
              ${rankTexts[rank] || ''} (${participants.length})
            </div>
            <div style="margin-right: 20px;">
              ${participants.map(p => `
                <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px;">
                  <span style="font-weight: 500;">${p.name}</span>
                  <span style="color: #3a4140;">${p.clubName}</span>
                  <span style="color: #6b7472; font-size: 12px;">${p.clubWilaya}</span>
                </div>
              `).join('')}
            </div>
          `;
        }
      });
      
      return `
        <div style="margin-bottom: 20px; background: #faf8f5; border-radius: 8px; padding: 12px 16px; border-right: 4px solid #0c5c3a;">
          <div style="font-size: 16px; font-weight: bold; color: #06311f; margin-bottom: 8px;">
            ${cat.name} ${cat.poids ? `- ${cat.poids}` : ''}
          </div>
          ${rankHTML}
        </div>
      `;
    }).join('');

    // Construction du HTML
    const logoImg = logoBase64 || 'assets/logo.png';
    const karateImg = karateBase64 || 'assets/karate.png';

    return `
      <div style="font-family: 'Cairo', 'Arial', sans-serif; direction: rtl; max-width: 1000px; margin: 0 auto; padding: 20px; background: white;">
        
        <!-- ===== EN-TÊTE ===== -->
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 3px solid #0c5c3a; margin-bottom: 25px;">
          <!-- Logos -->
          <div style="display: flex; align-items: center; justify-content: center; gap: 30px; margin-bottom: 15px;">
            <img src="${logoImg}" alt="Logo" style="height: 70px; width: 70px; object-fit: contain;">
            <div style="text-align: center;">
              <div style="font-size: 16px; font-weight: bold; color: #06311f;">الجمهورية الجزائرية الديمقراطية الشعبية</div>
              <div style="font-size: 13px; color: #3a4140;">وزارة الرياضة</div>
              <div style="font-size: 13px; color: #3a4140;">الاتحادية الجزائرية للكراتي دو</div>
              <div style="font-size: 18px; font-weight: bold; color: #0c5c3a; margin-top: 4px;">اللجنة الوطنية للكيوكوشين كاي</div>
            </div>
            <img src="${karateImg}" alt="Karate" style="height: 70px; width: 70px; object-fit: contain;">
          </div>
          
          <!-- Titre compétition -->
          <div style="margin-top: 15px;">
            <div style="font-size: 24px; font-weight: bold; color: #06311f;">${comp?.name || 'مسابقة'}</div>
            <div style="font-size: 16px; color: #6b7472;">${comp?.name_en || ''}</div>
            <div style="display: flex; justify-content: center; gap: 30px; margin-top: 8px; color: #3a4140; font-size: 14px;">
              <span>التاريخ: ${fmtDate(comp?.date_start)}</span>
              <span>المكان: ${comp?.wilaya || '—'}</span>
            </div>
          </div>
        </div>

        <!-- ===== STATISTIQUES ===== -->
        <div style="margin-bottom: 25px;">
          <h3 style="text-align: center; color: #06311f; font-size: 18px; margin-bottom: 15px;">الإحصائيات</h3>
          <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px;">
            <div style="background: #f7f5f0; border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #e3ded2;">
              <div style="font-size: 28px; font-weight: bold; color: #0c5c3a;">${totalParticipants}</div>
              <div style="font-size: 12px; color: #6b7472;">مشارك</div>
            </div>
            <div style="background: #f7f5f0; border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #e3ded2;">
              <div style="font-size: 28px; font-weight: bold; color: #0c5c3a;">${totalClubs}</div>
              <div style="font-size: 12px; color: #6b7472;">نادي</div>
            </div>
            <div style="background: #f7f5f0; border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #e3ded2;">
              <div style="font-size: 28px; font-weight: bold; color: #0c5c3a;">${totalWilayas}</div>
              <div style="font-size: 12px; color: #6b7472;">ولاية</div>
            </div>
            <div style="background: #f7f5f0; border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #e3ded2;">
              <div style="font-size: 28px; font-weight: bold; color: #c9a063;">${medalStats.gold}</div>
              <div style="font-size: 12px; color: #6b7472;">🥇 ذهبية</div>
            </div>
            <div style="background: #f7f5f0; border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #e3ded2;">
              <div style="font-size: 28px; font-weight: bold; color: #b0b0b0;">${medalStats.silver}</div>
              <div style="font-size: 12px; color: #6b7472;">🥈 فضية</div>
            </div>
            <div style="background: #f7f5f0; border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #e3ded2;">
              <div style="font-size: 28px; font-weight: bold; color: #cd7f32;">${medalStats.bronze}</div>
              <div style="font-size: 12px; color: #6b7472;">🥉 برونزية</div>
            </div>
          </div>
        </div>

        <!-- ===== PARTICIPANTS PAR CLUB ===== -->
        <div style="margin-bottom: 25px;">
          <h4 style="color: #06311f; font-size: 15px; border-bottom: 2px solid #e3c794; padding-bottom: 8px; margin-bottom: 10px;">
            المشاركون حسب النادي
          </h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #0c5c3a; color: white;">
                <th style="padding: 8px 12px; text-align: right;">النادي</th>
                <th style="padding: 8px 12px; text-align: center;">العدد</th>
              </tr>
            </thead>
            <tbody>
              ${Object.values(clubStats).sort((a, b) => b.count - a.count).map(c => `
                <tr><td style="padding:6px 10px;border-bottom:1px solid #eee;">${c.name}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;font-weight:bold;">${c.count}</td></tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- ===== PARTICIPANTS PAR WILAYA ===== -->
        <div style="margin-bottom: 25px;">
          <h4 style="color: #06311f; font-size: 15px; border-bottom: 2px solid #e3c794; padding-bottom: 8px; margin-bottom: 10px;">
            المشاركون حسب الولاية
          </h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #0c5c3a; color: white;">
                <th style="padding: 8px 12px; text-align: right;">الولاية</th>
                <th style="padding: 8px 12px; text-align: center;">العدد</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(wilayaStats).sort((a, b) => b[1] - a[1]).map(([name, count]) => `
                <tr><td style="padding:6px 10px;border-bottom:1px solid #eee;">${name}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;font-weight:bold;">${count}</td></tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- ===== CLASSEMENT DES CLUBS ===== -->
        ${sortedClubs.length > 0 ? `
        <div style="margin-bottom: 25px;">
          <h4 style="color: #06311f; font-size: 15px; border-bottom: 2px solid #e3c794; padding-bottom: 8px; margin-bottom: 10px;">
            🏅 ترتيب الأندية
          </h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #0c5c3a; color: white;">
                <th style="padding: 8px 12px; text-align: center;">#</th>
                <th style="padding: 8px 12px; text-align: right;">النادي</th>
                <th style="padding: 8px 12px; text-align: center;">🥇</th>
                <th style="padding: 8px 12px; text-align: center;">🥈</th>
                <th style="padding: 8px 12px; text-align: center;">🥉</th>
                <th style="padding: 8px 12px; text-align: center;">نقاط</th>
              </tr>
            </thead>
            <tbody>
              ${sortedClubs.map((club, idx) => `
                <tr style="${idx === 0 ? 'background: #f5ede0;' : (idx % 2 === 0 ? 'background: #f7f5f0;' : '')}">
                  <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;font-weight:bold;">${idx + 1}</td>
                  <td style="padding:6px 10px;border-bottom:1px solid #eee;font-weight:bold;">${club.name}</td>
                  <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;">${club.gold}</td>
                  <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;">${club.silver}</td>
                  <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;">${club.bronze}</td>
                  <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;font-weight:bold;color:#0c5c3a;">${club.points}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- ===== RÉSULTATS PAR CATÉGORIE ===== -->
        <div style="margin-bottom: 25px;">
          <h4 style="color: #06311f; font-size: 15px; border-bottom: 2px solid #e3c794; padding-bottom: 8px; margin-bottom: 10px;">
            📋 النتائج حسب الفئة
          </h4>
          ${resultsHTML || '<div style="text-align:center;padding:20px;color:#999;">لا توجد نتائج</div>'}
        </div>

        <!-- ===== PIED DE PAGE ===== -->
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e3ded2; color: #6b7472; font-size: 11px; margin-top: 20px;">
          <p>تقرير صادر عن المنصة الرقمية للجنة الوطنية للكيوكوشين كاي - الجزائر</p>
          <p>© ${new Date().getFullYear()} - ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    `;
    
  } catch (err) {
    console.error('Erreur generateReportHTML:', err);
    return `<div style="text-align:center;padding:50px;color:red;direction:rtl;">خطأ في إنشاء التقرير</div>`;
  }
}
// ===== EXPORTER LE CLASSEMENT EXCEL =====
window.exportRankingsExcel = function() {
  const compId = document.getElementById('rankings-competition').value;
  const container = document.getElementById('rankings-content');
  
  // Récupérer les données du tableau
  const table = container.querySelector('table');
  if (!table) {
    showFlash('Aucune donnée à exporter', 'err');
    return;
  }
  
  const data = [];
  const headers = [];
  table.querySelectorAll('thead th').forEach(th => headers.push(th.textContent.trim()));
  data.push(headers);
  
  table.querySelectorAll('tbody tr').forEach(tr => {
    const row = [];
    tr.querySelectorAll('td').forEach(td => row.push(td.textContent.trim()));
    data.push(row);
  });
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Classement');
  XLSX.writeFile(wb, `Classement_${compId || 'general'}.xlsx`);
  showFlash('✅ Export Excel terminé');
}
// ==================== DÉTERMINER LA CATÉGORIE AUTOMATIQUEMENT ====================
// ==================== DÉTERMINER LA CATÉGORIE (AVEC SOUS-CATÉGORIES) ====================
function determineCategory(dob, weight, gender) {
  if (!dob || !weight || weight <= 0) {
    return { name: 'À déterminer', id: null, parentId: null, displayName: 'À déterminer' };
  }
  
  const birthYear = new Date(dob).getFullYear();
  const genderFr = gender === 'ذكور' ? 'Hommes' : 'Femmes';
  
  
  // 1. Trouver la catégorie parent (par âge et genre)
  const parents = CATEGORIES.filter(c => !c.parent_id);
  const foundParent = parents.find(c => {
    const match = c.gender === genderFr && 
                  birthYear >= c.annee_min && 
                  birthYear <= c.annee_max;
    if (match) {
      console.log(`✅ Catégorie parent trouvée: ${c.name_fr}`);
    }
    return match;
  });
  
  if (!foundParent) {
    console.log(`❌ Aucune catégorie parent trouvée`);
    return { name: 'À déterminer', id: null, parentId: null, displayName: 'À déterminer' };
  }
  
  // 2. Chercher les sous-catégories
  const children = CATEGORIES.filter(c => c.parent_id === foundParent.id);
  
  if (children.length === 0) {
    // Pas de sous-catégories, utiliser la catégorie parent
    return { 
      name: foundParent.name_fr, 
      id: foundParent.id, 
      parentId: null,
      displayName: foundParent.name_fr
    };
  }
  
  // 3. Trouver la sous-catégorie par poids
  const foundChild = children.find(c => {
    return weight >= c.poids_min && weight < c.poids_max;
  });
  
  if (foundChild) {
    const displayName = `${foundParent.name_fr} - ${foundChild.poids_fr || foundChild.name_fr}`;
    console.log(`✅ Sous-catégorie trouvée: ${displayName}`);
    return { 
      name: foundChild.name_fr, 
      id: foundChild.id, 
      parentId: foundParent.id,
      displayName: displayName,
      parentName: foundParent.name_fr
    };
  }
  
  // 4. Si aucun poids ne correspond, utiliser la catégorie parent
  console.log(`⚠️ Aucune sous-catégorie pour le poids ${weight}kg, utilisation de ${foundParent.name_fr}`);
  return { 
    name: foundParent.name_fr, 
    id: foundParent.id, 
    parentId: null,
    displayName: foundParent.name_fr
  };
}
// ==================== SECTION VÉRIFICATION ====================
let verificationData = [];

// ===== RENDER LA SECTION VÉRIFICATION =====
window.renderVerification = function() {
  setSidebarActive('sb-verification');
  
  // Cacher toutes les autres sections
  document.querySelectorAll('#results-section, #diplomas-section, #reports-section, #club-rankings-section, #verification-section').forEach(el => {
    if (el) el.style.display = 'none';
  });
  
  // Afficher la section vérification (NE PAS CLONER)
  const section = document.getElementById('verification-section');
  if (section) {
    section.style.display = 'block';
    
    // Mettre le contenu dans main-content - utilisation directe, pas de clone
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '';
    mainContent.appendChild(section);
    
    // Charger les données
    setTimeout(loadVerificationData, 100);
  }
}

// ===== CHARGER LES DONNÉES DE VÉRIFICATION =====
window.loadVerificationData = async function() {
  const tbody = document.getElementById('verification-tbody');
  if (!tbody) {
    console.warn('verification-tbody non trouvé');
    return;
  }
  
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#999;padding:30px;">Chargement des données...</td></tr>';
  
  try {
    // Récupérer tous les participants de toutes les compétitions
    const { data: registrations, error } = await sbClient
      .from('registrations')
      .select('*');
    
    if (error) throw error;
    
    if (!registrations || registrations.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#999;padding:30px;">Aucun participant trouvé</td></tr>';
      return;
    }
    
    // Récupérer les clubs
    const { data: clubs } = await sbClient.from('clubs').select('*');
    const clubsMap = {};
    if (clubs) clubs.forEach(c => clubsMap[c.id] = c);
    
    // Récupérer les catégories si pas déjà fait
    if (CATEGORIES.length === 0) {
      await loadCategories();
    }
    
    // Extraire tous les participants avec leurs infos
    verificationData = [];
    registrations.forEach(reg => {
      const club = clubsMap[reg.club_id];
      if (reg.participants && Array.isArray(reg.participants)) {
        reg.participants.forEach((p, idx) => {
          // Déterminer le nom complet de la catégorie
          let categoryDisplay = p.category || '—';
          if (p.category_id) {
            const cat = CATEGORIES.find(c => c.id === p.category_id);
            if (cat) {
              if (cat.parent_id) {
                const parent = CATEGORIES.find(p => p.id === cat.parent_id);
                categoryDisplay = parent ? `${parent.name_fr} - ${cat.poids_fr || cat.name_fr}` : cat.name_fr;
              } else {
                categoryDisplay = cat.name_fr;
              }
            }
          }
          
          verificationData.push({
            registrationId: reg.id,
            participantIndex: idx,
            name: p.name || '—',
            weight: p.weight || 0,
            gender: p.gender || 'ذكور',
            category: categoryDisplay,
            category_id: p.category_id,
            clubId: reg.club_id,
            clubName: club?.name || '—',
            clubCode: club?.club_code || '—',
            wilaya: club?.wilaya || '—',
            dob: p.dob || null
          });
        });
      }
    });
    
    // Remplir les filtres
    populateVerificationFilters();
    
    // Appliquer les filtres
    applyVerificationFilters();
    
  } catch (err) {
    console.error('Erreur loadVerificationData:', err);
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#c41e2e;padding:20px;">Erreur de chargement</td></tr>';
  }
}

// ===== POPULER LES FILTRES =====
function populateVerificationFilters() {
  // Clubs
  const clubSelect = document.getElementById('verif-club');
  if (clubSelect) {
    const clubIds = [...new Set(verificationData.map(p => p.clubId))];
    clubSelect.innerHTML = '<option value="">Tous les clubs</option>';
    clubIds.forEach(clubId => {
      const p = verificationData.find(p => p.clubId === clubId);
      if (p && p.clubName && p.clubName !== '—') {
        clubSelect.innerHTML += `<option value="${clubId}">${p.clubName}</option>`;
      }
    });
  }
  
  // Catégories
  const catSelect = document.getElementById('verif-category');
  if (catSelect) {
    const cats = [...new Set(verificationData.map(p => p.category))];
    catSelect.innerHTML = '<option value="">Toutes les catégories</option>';
    cats.forEach(cat => {
      if (cat && cat !== '—') {
        catSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
      }
    });
  }
  
  // Wilayas
  const wilayaSelect = document.getElementById('verif-wilaya');
  if (wilayaSelect) {
    const wilayas = [...new Set(verificationData.map(p => p.wilaya))].filter(w => w && w !== '—');
    wilayaSelect.innerHTML = '<option value="">Toutes les wilayas</option>';
    wilayas.forEach(wilaya => {
      wilayaSelect.innerHTML += `<option value="${wilaya}">${wilaya}</option>`;
    });
  }
}

// ===== APPLIQUER LES FILTRES =====
window.applyVerificationFilters = function() {
  if (!verificationData || verificationData.length === 0) {
    const tbody = document.getElementById('verification-tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#999;padding:30px;">Aucun participant trouvé</td></tr>';
    }
    return;
  }
  
  const search = document.getElementById('verif-search')?.value.toLowerCase().trim() || '';
  const clubId = document.getElementById('verif-club')?.value || '';
  const category = document.getElementById('verif-category')?.value || '';
  const wilaya = document.getElementById('verif-wilaya')?.value || '';
  
  let filtered = verificationData;
  
  if (search) {
    filtered = filtered.filter(p => p.name && p.name.toLowerCase().includes(search));
  }
  
  if (clubId) {
    filtered = filtered.filter(p => p.clubId === parseInt(clubId));
  }
  
  if (category) {
    filtered = filtered.filter(p => p.category === category);
  }
  
  if (wilaya) {
    filtered = filtered.filter(p => p.wilaya === wilaya);
  }
  
  renderVerificationTable(filtered);
};

// ===== RENDRE LE TABLEAU DE VÉRIFICATION =====
function renderVerificationTable(data) {
  const tbody = document.getElementById('verification-tbody');
  if (!tbody) return;
  
  const isAr = currentLanguage === 'ar';
  
  // Mettre à jour le compteur
  const countEl = document.getElementById('verif-count');
  if (countEl) {
    countEl.textContent = `${data.length} ${isAr ? 'مشارك' : 'participants'}`;
  }
  
  // Statistiques
  const statsEl = document.getElementById('verif-stats');
  if (statsEl) {
    const totalPoids = data.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0);
    const avgPoids = data.length > 0 ? (totalPoids / data.length).toFixed(1) : 0;
    statsEl.textContent = `⚖️ Moyenne: ${avgPoids} kg`;
  }
  
  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#999;padding:30px;">Aucun participant trouvé</td></tr>';
    return;
  }
  
  const rows = data.map((p, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><strong>${p.name}</strong></td>
      <td style="font-weight:600;color:${parseFloat(p.weight) > 0 ? 'var(--green-700)' : '#999'};">${p.weight || '—'}</td>
      <td>${p.gender === 'ذكور' ? (isAr ? 'ذكر' : 'Homme') : (isAr ? 'أنثى' : 'Femme')}</td>
      <td>${p.category}</td>
      <td>${p.clubName}</td>
      <td>${p.wilaya}</td>
      <td>
        <button class="btn-primary btn-sm" onclick="openEditParticipantModal(${idx})" title="${isAr ? 'تعديل' : 'Modifier'}">
          <i class="ti ti-edit"></i>
        </button>
      </td>
    </tr>
  `).join('');
  
  tbody.innerHTML = rows;
}

// ===== OUVRIR LE MODAL D'ÉDITION =====
window.openEditParticipantModal = function(index) {
  if (!verificationData || verificationData.length === 0) {
    showFlash('Aucune donnée disponible', 'err');
    return;
  }
  
  const p = verificationData[index];
  if (!p) {
    showFlash('Participant non trouvé', 'err');
    return;
  }
  
  const isAr = currentLanguage === 'ar';
  
  const registrationIdEl = document.getElementById('edit-registration-id');
  const participantIndexEl = document.getElementById('edit-participant-index');
  const nameEl = document.getElementById('edit-participant-name');
  const weightEl = document.getElementById('edit-participant-weight');
  const genderEl = document.getElementById('edit-participant-gender');
  const dobEl = document.getElementById('edit-participant-dob');
  
  if (!registrationIdEl || !participantIndexEl || !nameEl || !weightEl || !genderEl || !dobEl) {
    showFlash('Erreur: Éléments du modal non trouvés', 'err');
    return;
  }
  
  registrationIdEl.value = p.registrationId || '';
  participantIndexEl.value = p.participantIndex || 0;
  nameEl.value = p.name || '';
  weightEl.value = p.weight || '';
  genderEl.value = p.gender || 'ذكور';
  dobEl.value = p.dob || '';
  
  const titleEl = document.getElementById('edit-participant-title');
  const nameLabelEl = document.getElementById('edit-name-label');
  const weightLabelEl = document.getElementById('edit-weight-label');
  const genderLabelEl = document.getElementById('edit-gender-label');
  const dobLabelEl = document.getElementById('edit-dob-label');
  const saveBtnEl = document.getElementById('edit-save-btn');
  const cancelBtnEl = document.getElementById('edit-cancel-btn');
  
  if (titleEl) titleEl.textContent = isAr ? 'تعديل بيانات المشارك' : 'Modifier le participant';
  if (nameLabelEl) nameLabelEl.textContent = isAr ? 'الاسم الكامل *' : 'Nom complet *';
  if (weightLabelEl) weightLabelEl.textContent = isAr ? 'الوزن (كغ) *' : 'Poids (kg) *';
  if (genderLabelEl) genderLabelEl.textContent = isAr ? 'الجنس' : 'Sexe';
  if (dobLabelEl) dobLabelEl.textContent = isAr ? 'تاريخ الميلاد' : 'Date de naissance';
  if (saveBtnEl) saveBtnEl.textContent = isAr ? 'حفظ' : 'Enregistrer';
  if (cancelBtnEl) cancelBtnEl.textContent = isAr ? 'إلغاء' : 'Annuler';
  
  openModal('modal-edit-participant');
};



// ===== EXPORTER LA VÉRIFICATION EN EXCEL =====
window.exportVerificationExcel = function() {
  const tbody = document.getElementById('verification-tbody');
  if (!tbody) return;
  
  const rows = tbody.querySelectorAll('tr');
  if (rows.length === 0 || (rows.length === 1 && rows[0].textContent.includes('Aucun'))) {
    showFlash('Aucune donnée à exporter', 'err');
    return;
  }
  
  const isAr = currentLanguage === 'ar';
  
  const data = [
    [isAr ? 'الرقم' : '#', isAr ? 'الاسم' : 'Nom', isAr ? 'الوزن' : 'Poids (kg)', 
     isAr ? 'الجنس' : 'Sexe', isAr ? 'الفئة' : 'Catégorie', isAr ? 'النادي' : 'Club', 
     isAr ? 'الولاية' : 'Wilaya']
  ];
  
  let index = 1;
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length === 8) {
      data.push([
        index++,
        cells[1]?.textContent.trim() || '—',
        cells[2]?.textContent.trim() || '—',
        cells[3]?.textContent.trim() || '—',
        cells[4]?.textContent.trim() || '—',
        cells[5]?.textContent.trim() || '—',
        cells[6]?.textContent.trim() || '—'
      ]);
    }
  });
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 25 }, { wch: 25 }, { wch: 18 }];
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Vérification');
  XLSX.writeFile(wb, `Verification_Participants_${new Date().toISOString().slice(0,10)}.xlsx`);
  
  showFlash('✅ Export Excel terminé');
}
