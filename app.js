/* موجز — shared app logic (front-end demo, data in localStorage) */
(function () {
  'use strict';

  var ROLES = {
    user: { label: 'مستخدم', cls: 'user' },
    leader: { label: 'قائد فريق', cls: 'leader' },
    manager: { label: 'مدير', cls: 'manager' }
  };

  /* ---------- Demo seed data ---------- */
  var DEMO_USERS = [
    { name: 'أحمد سامح', email: 'ahmed@mawjaz.demo', password: 'demo123', role: 'manager' },
    { name: 'سارة محمود', email: 'sara@mawjaz.demo', password: 'demo123', role: 'leader' },
    { name: 'كريم عادل', email: 'karim@mawjaz.demo', password: 'demo123', role: 'user' },
    { name: 'منى حسين', email: 'mona@mawjaz.demo', password: 'demo123', role: 'user' },
    { name: 'يوسف طارق', email: 'youssef@mawjaz.demo', password: 'demo123', role: 'leader' },
    { name: 'نور الدين علي', email: 'nour@mawjaz.demo', password: 'demo123', role: 'user' }
  ];

  var DEMO_MEETINGS = [
    {
      title: 'اجتماع تخطيط الربع القادم',
      date: '٢٥ نوفمبر ٢٠٢٦', duration: '٤٥ دقيقة', status: 'done', owner: 'manager',
      summary: 'مناقشة أهداف الربع القادم وتوزيع الأولويات على الفرق.',
      points: ['اعتماد خطة إطلاق النسخة الجديدة في يناير', 'زيادة ميزانية التسويق بنسبة ١٥٪', 'تعيين قائد جديد لفريق الدعم']
    },
    {
      title: 'مراجعة تصميم الواجهة',
      date: '٢٤ نوفمبر ٢٠٢٦', duration: '٣٠ دقيقة', status: 'done', owner: 'leader',
      summary: 'مراجعة النموذج الأولي للواجهة الجديدة وملاحظات الفريق.',
      points: ['اعتماد لوحة الألوان الهادئة', 'تعديل أماكن الأزرار الرئيسية', 'تسليم النسخة النهائية الخميس']
    },
    {
      title: 'اجتماع فريق الدعم الأسبوعي',
      date: '٢٣ نوفمبر ٢٠٢٦', duration: '٢٥ دقيقة', status: 'done', owner: 'user',
      summary: 'متابعة تذاكر العملاء وأسرع المشاكل تكراراً هذا الأسبوع.',
      points: ['مشكلة تسجيل الدخول حُلّت', 'متوسط زمن الرد نزل لـ ٣ دقائق', 'تدريب جديد يوم الأحد']
    },
    {
      title: 'مناقشة ميزانية المشروع',
      date: '٢٢ نوفمبر ٢٠٢٦', duration: '٥٠ دقيقة', status: 'review', owner: 'leader',
      summary: 'مراجعة المصروفات الحالية وتوزيع الميزانية المتبقية.',
      points: ['تأجيل بند الأدوات للشهر الجاي', 'اعتماد عرض المورّد الجديد']
    },
    {
      title: 'اجتماع تعارف الأعضاء الجدد',
      date: '٢٠ نوفمبر ٢٠٢٦', duration: '٢٠ دقيقة', status: 'done', owner: 'user',
      summary: 'تعارف سريع مع الأعضاء الجدد وشرح طريقة الشغل.',
      points: ['شرح نظام المهام الأسبوعي', 'تحديد موعد المراجعة الأولى']
    }
  ];

  /* ---------- Storage helpers ---------- */
  function seed() {
    if (!localStorage.getItem('mawjaz_users')) {
      localStorage.setItem('mawjaz_users', JSON.stringify(DEMO_USERS));
    }
  }
  function getUsers() { return JSON.parse(localStorage.getItem('mawjaz_users') || '[]'); }
  function saveUsers(u) { localStorage.setItem('mawjaz_users', JSON.stringify(u)); }
  function session() { return JSON.parse(localStorage.getItem('mawjaz_session') || 'null'); }
  function setSession(s) { s ? localStorage.setItem('mawjaz_session', JSON.stringify(s)) : localStorage.removeItem('mawjaz_session'); }

  function showError(el, msg) {
    el.textContent = msg;
    el.classList.add('show');
  }

  /* ---------- Landing counters ---------- */
  function initCounters() {
    var nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;
    nums.forEach(function (el) {
      var target = +el.dataset.count;
      var suffix = el.dataset.suffix || '';
      var done = false;
      function finish() { if (!done) { done = true; el.textContent = target.toLocaleString('ar-EG') + suffix; } }
      var start = null;
      function step(ts) {
        if (done) return;
        if (!start) start = ts;
        var p = Math.min((ts - start) / 1400, 1);
        var val = Math.floor(target * (1 - Math.pow(1 - p, 3)));
        el.textContent = val.toLocaleString('ar-EG') + suffix;
        if (p < 1) requestAnimationFrame(step); else finish();
      }
      requestAnimationFrame(step);
      setTimeout(finish, 1800);
    });
  }

  /* ---------- Register ---------- */
  function initRegister() {
    var form = document.getElementById('registerForm');
    if (!form) return;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var err = document.getElementById('formError');
      err.classList.remove('show');
      var name = document.getElementById('name').value.trim();
      var email = document.getElementById('email').value.trim().toLowerCase();
      var pass = document.getElementById('password').value;
      var role = form.querySelector('input[name="role"]:checked').value;

      if (name.length < 3) return showError(err, 'اكتب اسمك الكامل.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError(err, 'اكتب بريد إلكتروني صحيح.');
      if (pass.length < 6) return showError(err, 'كلمة المرور لازم تكون ٦ حروف على الأقل.');

      var users = getUsers();
      if (users.some(function (u) { return u.email === email; })) {
        return showError(err, 'البريد ده مسجّل قبل كده، جرّب تسجيل الدخول.');
      }
      var user = { name: name, email: email, password: pass, role: role };
      users.push(user);
      saveUsers(users);
      setSession({ email: email });
      window.location.href = 'dashboard.html';
    });
  }

  /* ---------- Login ---------- */
  function initLogin() {
    var form = document.getElementById('loginForm');
    if (!form) return;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var err = document.getElementById('formError');
      err.classList.remove('show');
      var email = document.getElementById('email').value.trim().toLowerCase();
      var pass = document.getElementById('password').value;
      var user = getUsers().find(function (u) { return u.email === email && u.password === pass; });
      if (!user) return showError(err, 'البيانات غير صحيحة، تأكد من البريد وكلمة المرور.');
      setSession({ email: email });
      window.location.href = 'dashboard.html';
    });
    document.querySelectorAll('[data-demo]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var u = getUsers().find(function (x) { return x.role === btn.dataset.demo; });
        if (u) { setSession({ email: u.email }); window.location.href = 'dashboard.html'; }
      });
    });
  }

  /* ---------- Dashboard ---------- */
  function initDashboard() {
    var statsBox = document.getElementById('dashStats');
    if (!statsBox) return;

    // Preview helper: dashboard.html?demo=manager|leader|user
    var params = new URLSearchParams(window.location.search);
    var demoRole = params.get('demo');
    var me = null;

    if (demoRole && ROLES[demoRole]) {
      me = getUsers().find(function (u) { return u.role === demoRole; });
    } else {
      var s = session();
      if (s) me = getUsers().find(function (u) { return u.email === s.email; });
      if (!me) { window.location.href = 'login.html'; return; }
    }

    var role = ROLES[me.role];
    document.getElementById('welcomeTitle').textContent = 'أهلاً ' + me.name.split(' ')[0];
    document.getElementById('welcomeSub').textContent = 'دي نظرة سريعة على اجتماعاتك وملخصاتك.';
    document.getElementById('userName').textContent = me.name;
    document.getElementById('avatarLetter').textContent = me.name.trim().charAt(0);
    var badge = document.getElementById('userRoleBadge');
    badge.textContent = role.label;
    badge.classList.add(role.cls);
    document.getElementById('navRole').textContent = '';

    document.getElementById('logoutBtn').addEventListener('click', function () {
      setSession(null);
      window.location.href = 'index.html';
    });

    var users = getUsers();
    var meetings = DEMO_MEETINGS;

    // Role-based stats
    var stats = [];
    if (me.role === 'manager') {
      stats = [
        { num: users.length, lbl: 'إجمالي المستخدمين' },
        { num: meetings.length, lbl: 'إجمالي الاجتماعات' },
        { num: meetings.filter(function (m) { return m.status === 'done'; }).length, lbl: 'ملخصات جاهزة' },
        { num: users.filter(function (u) { return u.role === 'leader'; }).length, lbl: 'قادة الفرق' }
      ];
      document.getElementById('teamTitle').textContent = 'كل المستخدمين';
    } else if (me.role === 'leader') {
      var team = users.filter(function (u) { return u.role === 'user'; });
      stats = [
        { num: team.length, lbl: 'أعضاء فريقك' },
        { num: meetings.length, lbl: 'اجتماعات الفريق' },
        { num: meetings.filter(function (m) { return m.status === 'done'; }).length, lbl: 'ملخصات جاهزة' },
        { num: meetings.filter(function (m) { return m.status === 'review'; }).length, lbl: 'قيد المراجعة' }
      ];
      document.getElementById('teamTitle').textContent = 'أعضاء فريقك';
    } else {
      var mine = meetings.filter(function (m) { return m.owner === 'user'; });
      stats = [
        { num: mine.length, lbl: 'اجتماعاتك' },
        { num: mine.filter(function (m) { return m.status === 'done'; }).length, lbl: 'ملخصات جاهزة' },
        { num: 3, lbl: 'مهام مفتوحة' },
        { num: 1, lbl: 'اجتماع قادم' }
      ];
      document.getElementById('teamTitle').textContent = 'فريقك';
    }

    statsBox.innerHTML = stats.map(function (s) {
      return '<div class="stat"><div class="num">' + s.num.toLocaleString('ar-EG') + '</div><div class="lbl">' + s.lbl + '</div></div>';
    }).join('');

    // Meetings list (user sees own meetings; leader/manager see all)
    var visible = me.role === 'user'
      ? meetings.filter(function (m) { return m.owner === 'user'; })
      : meetings;

    document.getElementById('meetingsTitle').textContent =
      me.role === 'user' ? 'ملخصات اجتماعاتك' : 'أحدث الاجتماعات والملخصات';

    document.getElementById('meetingsList').innerHTML = visible.map(function (m) {
      var tag = m.status === 'done'
        ? '<span class="tag done">ملخص جاهز</span>'
        : '<span class="tag review">قيد المراجعة</span>';
      return '<div class="meeting">' +
        '<div class="top"><span class="title">' + m.title + '</span>' + tag + '</div>' +
        '<div class="meta">' + m.date + ' • ' + m.duration + '</div>' +
        '<p class="summary">' + m.summary + '</p>' +
        '<ul class="points">' + m.points.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>' +
        '</div>';
    }).join('') || '<p class="empty-note">لا توجد اجتماعات بعد.</p>';

    // Team list
    var teamUsers;
    if (me.role === 'manager') teamUsers = users;
    else if (me.role === 'leader') teamUsers = users.filter(function (u) { return u.role === 'user'; });
    else teamUsers = users.filter(function (u) { return u.email !== me.email && u.role !== 'manager'; });

    document.getElementById('teamList').innerHTML = teamUsers.map(function (u) {
      var r = ROLES[u.role];
      return '<div class="member">' +
        '<div class="avatar">' + u.name.trim().charAt(0) + '</div>' +
        '<div class="info"><div class="name">' + u.name + '</div><div class="role">' + r.label + '</div></div>' +
        '<span class="role-badge ' + r.cls + '">' + r.label + '</span>' +
        '</div>';
    }).join('');
  }

  /* ---------- Boot ---------- */
  seed();
  initCounters();
  initRegister();
  initLogin();
  initDashboard();
})();
