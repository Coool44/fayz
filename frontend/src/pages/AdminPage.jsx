import React, { useEffect, useMemo, useRef, useState } from 'react';
import Toast from '../components/Toast.jsx';
import Modal from '../components/Modal.jsx';
import { apiAdminLogin, apiDeleteReview, apiGetRates, apiGetReviews, apiPatchReview, apiSaveRates } from '../services/api.js';

const defaultData = [
  { "الدولة": "ويسترن يونيون", "العملة": "دولار", "سعر الكاش": 2.6, "سعر البنكي": 0.92, "بيانات الحساب": "تواصل معنا للتزويد" },
  { "الدولة": "مصر", "العملة": "جنيه", "سعر الكاش": 0.055, "سعر البنكي": 0.019, "بيانات الحساب": "مصر\n01024686132\n01061395394\n01063459026" },
  { "الدولة": "ليبيا", "العملة": "دينار", "سعر الكاش": 0.25, "سعر البنكي": 0.12, "بيانات الحساب": "089207000001205\nمصرف الجمهورية" },
  { "الدولة": "تركيا دولار", "العملة": "دولار", "سعر الكاش": 2.65, "سعر البنكي": 0.92, "بيانات الحساب": "تواصل معنا للتزويد" },
  { "الدولة": "تركيا ليرة", "العملة": "ليرة", "سعر الكاش": 0.03, "سعر البنكي": 0.02, "بيانات الحساب": "TR19 0011 1000 0000 0146 4002 29\nNIDAL I M SHAT" },
  { "الدولة": "الاردن", "العملة": "دينار", "سعر الكاش": 3.65, "سعر البنكي": 1.26, "بيانات الحساب": "MMRWAN17\nالبنك العربي الاسلامي الدولي" },
  { "الدولة": "الضفة الغربية", "العملة": "شيقل", "سعر الكاش": 2, "سعر البنكي": 3.3, "بيانات الحساب": "تواصل معنا للتزويد" },
  { "الدولة": "السعودية", "العملة": "ريال", "سعر الكاش": 0.063, "سعر البنكي": 0.22, "بيانات الحساب": "السعودية 🇸🇦" },
  { "الدولة": "عمان", "العملة": "ريال", "سعر الكاش": 6.2, "سعر البنكي": 2.33, "بيانات الحساب": "Account: 70502007919801\nبنك صحار الإسلامي" },
  { "الدولة": "الامارات", "العملة": "درهم", "سعر الكاش": 0.687, "سعر البنكي": 0.244, "بيانات الحساب": "Mashreq Bank\n019101658187" },
  { "الدولة": "تونس", "العملة": "دينار", "سعر الكاش": 0.7, "سعر البنكي": 0.25, "بيانات الحساب": "تواصل معنا" },
  { "الدولة": "البحرين", "العملة": "دينار", "سعر الكاش": 5.25, "سعر البنكي": 2.5, "بيانات الحساب": "" },
  { "الدولة": "الجزائر", "العملة": "دينار", "سعر الكاش": 0.0088, "سعر البنكي": 0.0034, "بيانات الحساب": "RIP: 007 99999 00292 24346 36" },
  { "الدولة": "العراق", "العملة": "دينار", "سعر الكاش": 0.00155, "سعر البنكي": 0.00053, "بيانات الحساب": "07729782236\nزين كاش" },
  { "الدولة": "قطر", "العملة": "ريال", "سعر الكاش": 0.65, "سعر البنكي": 0.23, "بيانات الحساب": "QNB account.0250495193001" },
  { "الدولة": "الكويت", "العملة": "دينار", "سعر الكاش": 7.7, "سعر البنكي": 2.88, "بيانات الحساب": "Weyay: 2031117380\nKFH: 561320022260" },
  { "الدولة": "المغرب", "العملة": "درهم", "سعر الكاش": 0.24, "سعر البنكي": 0.089, "بيانات الحساب": "Banque Populaire\nRIB: 164728211113121833000427" },
  { "الدولة": "امريكا", "العملة": "دولار", "سعر الكاش": 2.6, "سعر البنكي": 0.91, "بيانات الحساب": "Lead Bank\n212902981687" },
  { "الدولة": "اوروبا", "العملة": "يورو", "سعر الكاش": 2.9, "سعر البنكي": 1.03, "بيانات الحساب": "" },
  { "الدولة": "كندا", "العملة": "دولار كندي", "سعر الكاش": 1.4, "سعر البنكي": 0.6, "بيانات الحساب": "payment@orbitmoney.com" },
  { "الدولة": "تيك توك", "العملة": "دولار", "سعر الكاش": 2.4, "سعر البنكي": 0.91, "بيانات الحساب": "تواصل معنا للتزويد" },
  { "الدولة": "بايبال", "العملة": "دولار", "سعر الكاش": 2.35, "سعر البنكي": 0.87, "بيانات الحساب": "https://www.paypal.me/Tshmw" },
  { "الدولة": "USDT", "العملة": "دولار", "سعر الكاش": 2.72, "سعر البنكي": 0.95, "بيانات الحساب": "TSVv6wCny3REkwhLdMCS5rhwyRgpX7ahVu" },
  { "الدولة": "اليمن", "العملة": "دولار", "سعر الكاش": 2.5, "سعر البنكي": 0.9, "بيانات الحساب": "أحمد نجيب حنيف محمد" },
  { "الدولة": "لبنان", "العملة": "دولار", "سعر الكاش": 2.6, "سعر البنكي": 0.9, "بيانات الحساب": "Wish money 💰\n71072075" },
  { "الدولة": "سوريا", "العملة": "دولار", "سعر الكاش": 2.5, "سعر البنكي": 0.87, "بيانات الحساب": "سوريا شام\ncd4192c8d2b9b6dbbfec319102f70289" }
];

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [loginUser, setLoginUser] = useState('Admin');
  const [loginPass, setLoginPass] = useState('');
  const [tab, setTab] = useState('rates');
  const [toast, setToast] = useState('');

  const ratesLoadedRef = useRef(false);
  const lastSavedRef = useRef('');
  const autosaveTimerRef = useRef(null);
  const lastValidationToastAtRef = useRef(0);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    'الدولة': '',
    'العملة': '',
    'سعر الكاش': '',
    'سعر البنكي': '',
    'سعر USDT': '',
    'بيانات الحساب': '',
    'الشروط': ''
  });

  const [rates, setRates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  function readToken() {
    try {
      return (localStorage.getItem('admin_token') || '').toString();
    } catch {
      return '';
    }
  }

  function setToken(token) {
    try {
      if (token) localStorage.setItem('admin_token', token);
      else localStorage.removeItem('admin_token');
    } catch {
      // ignore
    }
  }

  const orderedRates = useMemo(() => {
    const copy = [...rates];
    copy.sort((a, b) => ((a['الدولة'] || '').toString()).localeCompare(((b['الدولة'] || '').toString()), 'ar'));
    return copy;
  }, [rates]);

  async function loadRates() {
    setLoading(true);
    try {
      const data = await apiGetRates();
      setRates(data);
      ratesLoadedRef.current = true;
      lastSavedRef.current = JSON.stringify(data);
      setToast('تم تحميل البيانات من قاعدة البيانات');
    } catch {
      setRates([]);
      ratesLoadedRef.current = true;
      lastSavedRef.current = JSON.stringify([]);
      setToast('تعذر تحميل البيانات من السيرفر');
    } finally {
      setLoading(false);
    }
  }

  function validateRatesForSave(list) {
    for (const row of list) {
      const country = (row?.['الدولة'] ?? '').toString().trim();
      if (!country) return { ok: false, error: 'اسم الدولة مطلوب' };

      const currency = (row?.['العملة'] ?? '').toString().trim();
      if (!currency) return { ok: false, error: `العملة مطلوبة: ${country}` };

      const cash = row?.['سعر الكاش'];
      const bank = row?.['سعر البنكي'];
      if (cash === '' || cash === null || cash === undefined || !Number.isFinite(Number(cash))) {
        return { ok: false, error: `سعر الكاش مطلوب: ${country}` };
      }
      if (bank === '' || bank === null || bank === undefined || !Number.isFinite(Number(bank))) {
        return { ok: false, error: `سعر البنكي مطلوب: ${country}` };
      }
    }
    return { ok: true };
  }

  async function saveRatesNow(nextRates, okToast = 'تم الحفظ ✅') {
    const v = validateRatesForSave(nextRates);
    if (!v.ok) {
      setToast(v.error);
      return false;
    }

    setSaving(true);
    try {
      await apiSaveRates(nextRates);
      setRates(nextRates);
      lastSavedRef.current = JSON.stringify(nextRates);
      setToast(okToast);
      try {
        localStorage.setItem('rates_updated_at', String(Date.now()));
      } catch {
        // ignore
      }
      return true;
    } catch {
      setToast('تعذر الحفظ في السيرفر (تأكد من تسجيل الدخول كأدمن)');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveAll() {
    await saveRatesNow(rates, 'تم الحفظ ✅');
  }

  async function importDefaults() {
    const ok = window.confirm('سيتم استيراد البيانات الافتراضية إلى قاعدة البيانات (سيتم استبدال البيانات الحالية). متابعة؟');
    if (!ok) return;

    setSaving(true);
    try {
      await apiSaveRates(defaultData);
      setToast('تم استيراد البيانات الافتراضية');
      try {
        localStorage.setItem('rates_updated_at', String(Date.now()));
      } catch {
        // ignore
      }
      await loadRates();
    } catch {
      setToast('تعذر استيراد البيانات الافتراضية');
    } finally {
      setSaving(false);
    }
  }

  function updateRate(index, patch) {
    setRates((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  useEffect(() => {
    if (!authed) return;
    if (!ratesLoadedRef.current) return;
    if (saving) return;

    const snapshot = JSON.stringify(rates);
    if (snapshot === lastSavedRef.current) return;

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
      const v = validateRatesForSave(rates);
      if (!v.ok) {
        const now = Date.now();
        if (now - lastValidationToastAtRef.current > 1500) {
          lastValidationToastAtRef.current = now;
          setToast(v.error);
        }
        return;
      }

      setSaving(true);
      try {
        await apiSaveRates(rates);
        lastSavedRef.current = JSON.stringify(rates);
        setToast('تم الحفظ تلقائياً ✅');
        try {
          localStorage.setItem('rates_updated_at', String(Date.now()));
        } catch {
          // ignore
        }
      } catch {
        setToast('تعذر الحفظ في السيرفر (تأكد من تسجيل الدخول كأدمن)');
      } finally {
        setSaving(false);
      }
    }, 800);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [rates, authed, saving]);

  function openAddCountry() {
    setAddForm({
      'الدولة': '',
      'العملة': '',
      'سعر الكاش': '',
      'سعر البنكي': '',
      'سعر USDT': '',
      'بيانات الحساب': '',
      'الشروط': ''
    });
    setAddOpen(true);
  }

  async function confirmAddCountryAndSave() {
    const name = (addForm['الدولة'] || '').toString().trim();
    if (!name) {
      setToast('اسم الدولة مطلوب');
      return;
    }

    const currency = (addForm['العملة'] || '').toString().trim();
    if (!currency) {
      setToast('العملة مطلوبة للحفظ في قاعدة البيانات');
      return;
    }

    if (addForm['سعر الكاش'] === '' || addForm['سعر البنكي'] === '') {
      setToast('سعر الكاش وسعر البنكي مطلوبان للحفظ في قاعدة البيانات');
      return;
    }

    const exists = rates.some((r) => ((r['الدولة'] || '').toString().trim().toLowerCase()) === name.toLowerCase());
    if (exists) {
      setToast('هذه الدولة موجودة بالفعل');
      return;
    }

    const cash = addForm['سعر الكاش'];
    const bank = addForm['سعر البنكي'];
    const usdt = addForm['سعر USDT'];

    const nextItem = {
      ...addForm,
      'الدولة': name,
      'العملة': currency,
      'سعر الكاش': Number(cash),
      'سعر البنكي': Number(bank),
      'سعر USDT': usdt === '' ? '' : Number(usdt)
    };

    const nextRates = [...rates, nextItem];

    const ok = await saveRatesNow(nextRates, 'تمت إضافة الدولة وحفظها في قاعدة البيانات ✅');
    if (ok) setAddOpen(false);
  }

  function deleteCountry(index) {
    const countryName = (rates[index]?.['الدولة'] || '').toString();
    const ok = window.confirm('هل أنت متأكد من حذف هذه الدولة؟');
    if (!ok) return;

    const nextRates = [...rates];
    nextRates.splice(index, 1);
    saveRatesNow(nextRates, `تم حذف ${countryName} ✅`);
  }

  async function loadReviews() {
    setLoadingReviews(true);
    try {
      const list = await apiGetReviews();
      setReviews(list);
    } catch {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }

  async function toggleReview(id) {
    try {
      const current = reviews.find((r) => Number(r.id) === Number(id));
      const nextApproved = !(current && current.approved === true);
      await apiPatchReview(id, nextApproved);
      await loadReviews();
      setToast('تم تحديث حالة التقييم');
    } catch {
      setToast('تعذر تنفيذ العملية على التقييم (تأكد من تسجيل الدخول كأدمن)');
    }
  }

  async function deleteReview(id) {
    const ok = window.confirm('حذف التقييم؟');
    if (!ok) return;

    try {
      await apiDeleteReview(id);
      await loadReviews();
      setToast('تم حذف التقييم');
    } catch {
      setToast('تعذر حذف التقييم (تأكد من تسجيل الدخول كأدمن)');
    }
  }

  async function submitLogin() {
    try {
      const res = await apiAdminLogin(loginUser, loginPass);
      if (!res || !res.token) {
        setToast('بيانات الدخول غير صحيحة');
        return;
      }
      setToken(res.token);
      setAuthed(true);
      setLoginPass('');
      setToast('✅ تم تسجيل الدخول');
    } catch {
      setToast('بيانات الدخول غير صحيحة');
    }
  }

  function logout() {
    setToken('');
    setAuthed(false);
    setToast('تم تسجيل الخروج');
  }

  useEffect(() => {
    setAuthed(!!readToken());
    loadRates();
  }, []);

  useEffect(() => {
    if (!authed) return;
    if (tab === 'reviews') loadReviews();
  }, [tab, authed]);

  return (
    <>
      <div className="hero">
        <h1>لوحة الإدارة</h1>
        <p>إدارة أسعار الصرف وبيانات الحسابات والتقييمات عبر نفس السيرفر.</p>
      </div>

      {!authed ? (
        <div className="card admin-card" style={{ marginTop: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>تسجيل الدخول للإدارة</h2>
          <div className="admin-toolbar" style={{ marginTop: 10 }}>
            <div className="field" style={{ marginTop: 0 }}>
              <label>اسم المستخدم</label>
              <input value={loginUser} onChange={(e) => setLoginUser(e.target.value)} />
            </div>
            <div className="field" style={{ marginTop: 0 }}>
              <label>كلمة المرور</label>
              <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <button type="button" className="btn" onClick={submitLogin}>دخول</button>
              <button type="button" className="btn btn-secondary" onClick={() => setToast('')}>إلغاء</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card admin-card" style={{ marginTop: 12 }}>
          <div className="admin-toolbar">
            <div className="admin-tabs">
              <button type="button" className={`btn btn-secondary admin-tab`} onClick={() => setTab('rates')}>إدارة الأسعار</button>
              <button type="button" className={`btn btn-secondary admin-tab`} onClick={() => setTab('accounts')}>إدارة الحسابات</button>
              <button type="button" className={`btn btn-secondary admin-tab`} onClick={() => setTab('reviews')}>إدارة التقييمات</button>
            </div>

            <div className="admin-actions">
              <button type="button" className="btn admin-btn" onClick={saveAll} disabled={saving}>حفظ</button>
              <button type="button" className="btn btn-secondary admin-btn" onClick={openAddCountry} disabled={saving}>إضافة</button>
              <button type="button" className="btn btn-secondary admin-btn" onClick={logout} style={{ width: 'auto' }}>خروج</button>
            </div>
          </div>
        </div>
      )}

      {authed && tab === 'rates' ? (
        <div className="card" style={{ marginTop: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>إدارة أسعار الصرف</h2>
          <div className="admin-rates-grid" style={{ marginTop: 12 }}>
            {orderedRates.map((r) => {
              const index = rates.indexOf(r);
              return (
                <div key={`${r['الدولة']}-${index}`} className="admin-rate-card">
                  <div className="admin-rate-title">{(r['الدولة'] || '').toString()}</div>
                  <div className="admin-rate-divider" />

                  <div className="field admin-field-compact" style={{ marginTop: 0 }}>
                    <label>العملة</label>
                    <input value={(r['العملة'] ?? '').toString()} onChange={(e) => updateRate(index, { 'العملة': e.target.value })} />
                  </div>

                  <div className="field admin-field-compact">
                    <label>سعر الكاش</label>
                    <input
                      type="number"
                      step="0.001"
                      value={r['سعر الكاش'] ?? ''}
                      onChange={(e) => updateRate(index, { 'سعر الكاش': e.target.value === '' ? '' : Number(e.target.value) })}
                    />
                  </div>

                  <div className="field admin-field-compact">
                    <label>سعر البنكي</label>
                    <input
                      type="number"
                      step="0.001"
                      value={r['سعر البنكي'] ?? ''}
                      onChange={(e) => updateRate(index, { 'سعر البنكي': e.target.value === '' ? '' : Number(e.target.value) })}
                    />
                  </div>

                  <div className="field admin-field-compact">
                    <label>سعر USDT</label>
                    <input type="number" step="0.001" value={r['سعر USDT'] ?? ''} onChange={(e) => updateRate(index, { 'سعر USDT': e.target.value === '' ? '' : Number(e.target.value) })} />
                  </div>

                  <div className="admin-rate-actions">
                    <button type="button" className="btn admin-btn btn-success" onClick={saveAll} disabled={saving}>حفظ التغييرات</button>
                    <button type="button" className="btn admin-btn btn-danger" onClick={() => deleteCountry(index)}>حذف الدولة</button>
                  </div>
                </div>
              );
            })}

            {!orderedRates.length ? <div className="hint">لا توجد بيانات.</div> : null}
          </div>
        </div>
      ) : null}

      <Modal
        open={addOpen}
        title="إضافة دولة جديدة"
        onClose={() => setAddOpen(false)}
        actions={(
          <div className="row" style={{ marginTop: 0 }}>
            <button type="button" className="btn" onClick={confirmAddCountryAndSave} disabled={saving}>إضافة + حفظ</button>
            <button type="button" className="btn btn-secondary" onClick={() => setAddOpen(false)} disabled={saving}>إلغاء</button>
          </div>
        )}
      >
        <div style={{ display: 'grid', gap: 10 }}>
          <div className="field" style={{ marginTop: 0 }}>
            <label>اسم الدولة</label>
            <input value={(addForm['الدولة'] ?? '').toString()} onChange={(e) => setAddForm((p) => ({ ...p, 'الدولة': e.target.value }))} />
          </div>

          <div className="field" style={{ marginTop: 0 }}>
            <label>العملة</label>
            <input value={(addForm['العملة'] ?? '').toString()} onChange={(e) => setAddForm((p) => ({ ...p, 'العملة': e.target.value }))} />
          </div>

          <div className="row" style={{ marginTop: 0 }}>
            <div className="field" style={{ marginTop: 0 }}>
              <label>سعر الكاش</label>
              <input type="number" step="0.001" value={addForm['سعر الكاش']} onChange={(e) => setAddForm((p) => ({ ...p, 'سعر الكاش': e.target.value }))} />
            </div>

            <div className="field" style={{ marginTop: 0 }}>
              <label>سعر البنكي</label>
              <input type="number" step="0.001" value={addForm['سعر البنكي']} onChange={(e) => setAddForm((p) => ({ ...p, 'سعر البنكي': e.target.value }))} />
            </div>
          </div>

          <div className="field" style={{ marginTop: 0 }}>
            <label>سعر USDT</label>
            <input type="number" step="0.001" value={addForm['سعر USDT']} onChange={(e) => setAddForm((p) => ({ ...p, 'سعر USDT': e.target.value }))} />
          </div>

          <div className="field" style={{ marginTop: 0 }}>
            <label>بيانات الحساب</label>
            <textarea rows={5} value={(addForm['بيانات الحساب'] ?? '').toString()} onChange={(e) => setAddForm((p) => ({ ...p, 'بيانات الحساب': e.target.value }))} />
          </div>

          <div className="field" style={{ marginTop: 0 }}>
            <label>الشروط</label>
            <textarea rows={4} value={(addForm['الشروط'] ?? '').toString()} onChange={(e) => setAddForm((p) => ({ ...p, 'الشروط': e.target.value }))} />
          </div>
        </div>
      </Modal>

      {authed && tab === 'accounts' ? (
        <div className="card" style={{ marginTop: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>إدارة بيانات الحسابات</h2>

          <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
            {orderedRates.map((r) => {
              const index = rates.indexOf(r);
              return (
                <div key={`${r['الدولة']}-${index}`} className="section admin-section">
                  <strong>{(r['الدولة'] || '').toString()}</strong>

                  <div className="field">
                    <label>الشروط</label>
                    <textarea rows={8} value={(r['الشروط'] ?? '').toString()} onChange={(e) => updateRate(index, { 'الشروط': e.target.value })} />
                  </div>

                  <div className="field">
                    <label>بيانات الحساب</label>
                    <textarea rows={6} value={(r['بيانات الحساب'] ?? '').toString()} onChange={(e) => updateRate(index, { 'بيانات الحساب': e.target.value })} />
                  </div>
                </div>
              );
            })}

            {!orderedRates.length ? <div className="hint">لا توجد بيانات.</div> : null}
          </div>
        </div>
      ) : null}

      {authed && tab === 'reviews' ? (
        <div className="card" style={{ marginTop: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>إدارة التقييمات</h2>
          <div className="hint" style={{ marginTop: 10 }}>
            {loadingReviews ? 'جاري تحميل التقييمات...' : `عدد التقييمات: ${reviews.length}`}
          </div>

          <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
            {reviews.map((r) => {
              const name = (r.name || 'زبون').toString();
              const stars = '★★★★★'.slice(0, Math.max(1, Math.min(5, Number(r.rating) || 5)));
              const created = r.created_at ? new Date(r.created_at).toLocaleString('ar') : '';

              return (
                <div key={r.id} className="section admin-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                    <strong>{name} — {stars}</strong>
                    <span style={{ color: 'rgba(31,41,55,0.65)', fontSize: 12 }}>{created}</span>
                  </div>

                  <div className="field">
                    <label>التعليق</label>
                    <textarea rows={6} readOnly value={(r.text || '').toString()} />
                  </div>

                  <div className="row">
                    <button type="button" className="btn" onClick={() => toggleReview(r.id)}>
                      {r.approved ? 'إلغاء الاعتماد' : 'اعتماد'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => deleteReview(r.id)}>حذف</button>
                  </div>
                </div>
              );
            })}

            {!reviews.length && !loadingReviews ? <div className="hint">لا توجد تقييمات.</div> : null}
          </div>
        </div>
      ) : null}

      <Toast message={toast} onClear={() => setToast('')} />
    </>
  );
}

export default AdminPage;
