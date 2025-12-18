import React, { useEffect, useMemo, useState } from 'react';
import Toast from '../components/Toast.js';
import { apiDeleteReview, apiGetRates, apiGetReviews, apiPatchReview, apiSaveRates } from '../services/api.js';

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
  const [tab, setTab] = useState('rates');
  const [toast, setToast] = useState('');

  const [rates, setRates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

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
      setToast('تم تحميل البيانات من قاعدة البيانات');
    } catch {
      setRates([]);
      setToast('تعذر تحميل البيانات من السيرفر');
    } finally {
      setLoading(false);
    }
  }

  async function saveAll() {
    setSaving(true);
    try {
      await apiSaveRates(rates);
      setToast('تم حفظ التغييرات');
    } catch {
      setToast('تعذر الحفظ في السيرفر');
    } finally {
      setSaving(false);
    }
  }

  async function importDefaults() {
    const ok = window.confirm('سيتم استيراد البيانات الافتراضية إلى قاعدة البيانات (سيتم استبدال البيانات الحالية). متابعة؟');
    if (!ok) return;

    setSaving(true);
    try {
      await apiSaveRates(defaultData);
      setToast('تم استيراد البيانات الافتراضية');
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

  function addNewCountry() {
    setRates((prev) => [
      ...prev,
      {
        'الدولة': 'دولة جديدة',
        'العملة': 'عملة جديدة',
        'سعر الكاش': 1.0,
        'سعر البنكي': 1.0,
        'سعر USDT': '',
        'بيانات الحساب': 'أدخل بيانات الحساب هنا',
        'الشروط': ''
      }
    ]);
    setToast('تمت إضافة دولة جديدة (لم تُحفظ بعد)');
  }

  function deleteCountry(index) {
    const countryName = (rates[index]?.['الدولة'] || '').toString();
    const ok = window.confirm('هل أنت متأكد من حذف هذه الدولة؟');
    if (!ok) return;

    setRates((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });

    setToast(`تم حذف ${countryName} (لم يُحفظ بعد)`);
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
      setToast('تعذر تنفيذ العملية على التقييم');
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
      setToast('تعذر حذف التقييم');
    }
  }

  useEffect(() => {
    loadRates();
  }, []);

  useEffect(() => {
    if (tab === 'reviews') loadReviews();
  }, [tab]);

  return (
    <>
      <div className="hero">
        <h1>لوحة الإدارة</h1>
        <p>إدارة أسعار الصرف وبيانات الحسابات والتقييمات عبر نفس السيرفر.</p>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button type="button" className={`btn btn-secondary`} onClick={() => setTab('rates')} style={{ width: 'auto', padding: '0 16px' }}>إدارة الأسعار</button>
          <button type="button" className={`btn btn-secondary`} onClick={() => setTab('accounts')} style={{ width: 'auto', padding: '0 16px' }}>إدارة الحسابات</button>
          <button type="button" className={`btn btn-secondary`} onClick={() => setTab('reviews')} style={{ width: 'auto', padding: '0 16px' }}>إدارة التقييمات</button>
        </div>

        <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
          <div className="row">
            <button type="button" className="btn btn-secondary" onClick={loadRates} disabled={loading || saving}>تحميل البيانات</button>
            <button type="button" className="btn" onClick={saveAll} disabled={saving}>حفظ الكل</button>
          </div>
          <div className="row">
            <button type="button" className="btn btn-secondary" onClick={importDefaults} disabled={saving}>استيراد البيانات الافتراضية</button>
            <button type="button" className="btn btn-secondary" onClick={addNewCountry} disabled={saving}>إضافة دولة جديدة</button>
          </div>
        </div>
      </div>

      {tab === 'rates' ? (
        <div className="card" style={{ marginTop: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>إدارة أسعار الصرف</h2>
          <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
            {orderedRates.map((r) => {
              const index = rates.indexOf(r);
              return (
                <div key={`${r['الدولة']}-${index}`} className="section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                    <strong>{(r['الدولة'] || '').toString()}</strong>
                    <button type="button" className="btn btn-secondary" onClick={() => deleteCountry(index)} style={{ width: 'auto', padding: '0 14px' }}>حذف</button>
                  </div>

                  <div className="field">
                    <label>العملة</label>
                    <input value={(r['العملة'] ?? '').toString()} onChange={(e) => updateRate(index, { 'العملة': e.target.value })} />
                  </div>

                  <div className="row">
                    <div className="field">
                      <label>سعر الكاش</label>
                      <input type="number" step="0.001" value={r['سعر الكاش'] ?? ''} onChange={(e) => updateRate(index, { 'سعر الكاش': Number(e.target.value) })} />
                    </div>
                    <div className="field">
                      <label>سعر البنكي</label>
                      <input type="number" step="0.001" value={r['سعر البنكي'] ?? ''} onChange={(e) => updateRate(index, { 'سعر البنكي': Number(e.target.value) })} />
                    </div>
                  </div>

                  <div className="field">
                    <label>سعر USDT (اختياري)</label>
                    <input type="number" step="0.001" value={r['سعر USDT'] ?? ''} onChange={(e) => updateRate(index, { 'سعر USDT': e.target.value === '' ? '' : Number(e.target.value) })} />
                  </div>
                </div>
              );
            })}

            {!orderedRates.length ? <div className="hint">لا توجد بيانات.</div> : null}
          </div>
        </div>
      ) : null}

      {tab === 'accounts' ? (
        <div className="card" style={{ marginTop: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>إدارة بيانات الحسابات</h2>

          <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
            {orderedRates.map((r) => {
              const index = rates.indexOf(r);
              return (
                <div key={`${r['الدولة']}-${index}`} className="section">
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

      {tab === 'reviews' ? (
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
                <div key={r.id} className="section">
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
