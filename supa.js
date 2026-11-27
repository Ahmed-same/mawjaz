/* موجز: real accounts and meetings through Supabase (Auth + Postgres with row-level security) */
(function () {
  'use strict';
  var URL_ = 'https://tnzudztygcdvixctosel.supabase.co';
  var KEY = 'sb_publishable_zgQZIeS2igyn9w3LH62YkQ_I5CPAABF';
  if (!window.supabase) return;
  var sb = window.supabase.createClient(URL_, KEY);
  var ROLE_LABEL = { user: 'مستخدم', leader: 'قائد فريق', manager: 'مدير' };

  function showError(msg) {
    var el = document.getElementById('formError');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
  }
  function clearError() {
    var el = document.getElementById('formError');
    if (el) el.classList.remove('show');
  }
  function val(id) { return document.getElementById(id).value; }

  var reg = document.getElementById('registerForm');
  if (reg) {
    reg.addEventListener('submit', function (ev) {
      ev.preventDefault();
      clearError();
      var name = val('name').trim(), email = val('email').trim().toLowerCase(), pass = val('password');
      if (name.length < 3) return showError('اكتب اسمك الكامل.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError('اكتب بريد إلكتروني صحيح.');
      if (pass.length < 8) return showError('كلمة المرور لازم تكون ٨ حروف على الأقل.');
      sb.auth.signUp({ email: email, password: pass, options: { data: { name: name } } }).then(function (r) {
        if (r.error) return showError('تعذر إنشاء الحساب: ' + r.error.message);
        if (r.data && r.data.session) { window.location.href = 'account.html'; }
        else { showError('تم إنشاء الحساب. سجّل دخولك من صفحة الدخول.'); }
      });
    });
  }

  var login = document.getElementById('loginForm');
  if (login) {
    login.addEventListener('submit', function (ev) {
      ev.preventDefault();
      clearError();
      sb.auth.signInWithPassword({ email: val('email').trim().toLowerCase(), password: val('password') }).then(function (r) {
        if (r.error) return showError('البيانات غير صحيحة، تأكد من البريد وكلمة المرور.');
        window.location.href = 'account.html';
      });
    });
  }

  var list = document.getElementById('meetingsList');
  if (list) {
    var me = null;
    function render(rows, names) {
      list.textContent = '';
      if (!rows.length) { list.textContent = 'مفيش اجتماعات لسه.'; return; }
      rows.forEach(function (m) {
        var card = document.createElement('div');
        card.className = 'auth-card';
        card.style.cssText = 'max-width:none;margin-bottom:12px';
        var h = document.createElement('h3'); h.textContent = m.title;
        var meta = document.createElement('p'); meta.className = 'hint';
        meta.textContent = (names[m.owner] || '') + ' · ' + new Date(m.created_at).toLocaleDateString('ar-EG');
        var p = document.createElement('p'); p.textContent = m.notes || '(من غير ملاحظات)';
        card.appendChild(h); card.appendChild(meta); card.appendChild(p);
        if (m.owner === me.id) {
          var del = document.createElement('button');
          del.className = 'btn ghost small'; del.textContent = 'حذف';
          del.addEventListener('click', function () {
            sb.from('meetings').delete().eq('id', m.id).then(load);
          });
          card.appendChild(del);
        }
        list.appendChild(card);
      });
    }
    function load() {
      Promise.all([
        sb.from('meetings').select('id,owner,title,notes,created_at').order('created_at', { ascending: false }),
        sb.from('profiles').select('id,name')
      ]).then(function (r) {
        var names = {};
        (r[1].data || []).forEach(function (p) { names[p.id] = p.name; });
        render(r[0].data || [], names);
      });
    }
    sb.auth.getSession().then(function (r) {
      if (!r.data.session) { window.location.href = 'login.html'; return; }
      me = r.data.session.user;
      sb.from('profiles').select('name,role').eq('id', me.id).single().then(function (p) {
        var prof = p.data || { name: '', role: 'user' };
        document.getElementById('welcomeTitle').textContent = 'أهلاً ' + (prof.name || '').split(' ')[0];
        document.getElementById('welcomeSub').textContent = 'دورك: ' + (ROLE_LABEL[prof.role] || prof.role) + (prof.role === 'manager' ? ' (بتشوف كل الاجتماعات)' : prof.role === 'leader' ? ' (بتشوف اجتماعات فريقك)' : '');
        load();
      });
    });
    document.getElementById('logoutBtn').addEventListener('click', function () {
      sb.auth.signOut().then(function () { window.location.href = 'login.html'; });
    });
    document.getElementById('meetingForm').addEventListener('submit', function (ev) {
      ev.preventDefault();
      clearError();
      var t = val('mtitle').trim();
      if (!t) return showError('اكتب عنوان الاجتماع.');
      sb.from('meetings').insert({ title: t, notes: val('mnotes') }).then(function (r) {
        if (r.error) return showError('تعذر الحفظ.');
        document.getElementById('mtitle').value = ''; document.getElementById('mnotes').value = '';
        load();
      });
    });
  }
})();
