import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../components/Modal.js';
import Toast from '../components/Toast.js';
import { apiCreateReview, apiGetRates, apiGetReviews } from '../services/api.js';
import { formatNumber } from '../utils/number.js';
import { normalizeStr } from '../utils/text.js';

function buildMaps(data) {
  const rates = {};
  const accountData = {};
  const termsData = {};

  data.forEach((row) => {
    const countryName = normalizeStr(row['الدولة']);
    if (!countryName) return;

    rates[countryName] = {
      name: normalizeStr(row['العملة']) || 'العملة',
      cash: Number(row['سعر الكاش']),
      bank: Number(row['سعر البنكي']),
      USDT: Number(row['سعر USDT'] ?? row['سعر البنكي'])
    };

    accountData[countryName] = (row['بيانات الحساب'] ?? '').toString();
    termsData[countryName] = (row['الشروط'] ?? '').toString();
  });

  return { rates, accountData, termsData };
}

function CalculatorPage() {
  const [status, setStatus] = useState('جاهز');
  const [dataBadge, setDataBadge] = useState('—');
  const [ratesData, setRatesData] = useState([]);
  const [error, setError] = useState('');

  const [country, setCountry] = useState('');
  const [method, setMethod] = useState('cash');
  const [amount, setAmount] = useState('');

  const [toast, setToast] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalModel, setModalModel] = useState({
    country: '',
    method: 'cash',
    total: NaN,
    currencyOutput: '',
    termsText: '',
    accountText: ''
  });

  const [reviews, setReviews] = useState([]);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const maps = useMemo(() => buildMaps(ratesData), [ratesData]);

  const countryList = useMemo(() => Object.keys(maps.rates).sort((a, b) => a.localeCompare(b, 'ar')),
    [maps.rates]
  );

  const currencyName = maps.rates[normalizeStr(country)]?.name || 'العملة';

  async function loadRates() {
    setStatus('جاري التحميل...');
    setError('');

    try {
      const data = await apiGetRates();
      setRatesData(data);
      setStatus('جاهز');
      setDataBadge('DB');
    } catch {
      setStatus('تعذر التحميل');
      setDataBadge('Offline');
      setError('تعذر تحميل البيانات من السيرفر');
      setToast('تعذر تحميل البيانات من السيرفر');
    }
  }

  async function loadReviews() {
    try {
      const list = await apiGetReviews();
      setReviews(list);
    } catch {
      setReviews([]);
    }
  }

  useEffect(() => {
    loadRates();
    loadReviews();
  }, []);

  function showModal(model) {
    setModalModel(model);
    setModalOpen(true);
  }

  function calculate() {
    const c = normalizeStr(country);

    if (!c) {
      setToast('اختر الدولة أولاً');
      return;
    }

    if (!maps.rates[c]) {
      setToast('❌ الدولة غير مدعومة');
      return;
    }

    const amountValue = Number(amount);
    const hasAmount = Number.isFinite(amountValue) && amountValue > 0;

    const termsText = (maps.termsData[c] ?? '').toString().trim();
    const isWU = c === 'ويسترن يونيون';

    let accountText = (maps.accountData[c] ?? '').toString().trim();
    if (isWU) accountText = 'انتهت الحسابات';
    if (!accountText) accountText = '📞 تواصل معنا لتزويدك ببيانات الحساب لهذه الدولة.';

    if (!hasAmount) {
      showModal({ country: c, method, total: NaN, currencyOutput: '', termsText, accountText });
      return;
    }

    const rate = maps.rates[c][method];
    const total = amountValue * rate;
    const currencyOutput = method === 'bank' ? 'دولار' : (method === 'USDT' ? 'USDT' : 'شيقل');

    showModal({ country: c, method, total, currencyOutput, termsText, accountText });
  }

  function buildCopyText() {
    const c = modalModel.country || '—';
    const termsText = (modalModel.termsText || '').trim();
    const accText = (modalModel.accountText || '').trim();

    const amountText = Number.isFinite(modalModel.total)
      ? `💰 ${formatNumber(modalModel.total)} ${modalModel.currencyOutput}\nالمبلغ الذي سيستلمه الطرف الآخر`
      : '';

    let out = '';
    if (amountText) out += amountText + '\n\n';
    out += `بيانات الحساب:\n${c}\n`;
    if (termsText) out += `\nاقرأ الشروط جيدا قبل التحويل :\n${termsText}\n`;
    out += `\n${accText}`;
    return out.trim();
  }

  async function copyModal() {
    try {
      await navigator.clipboard.writeText(buildCopyText());
      setToast('✅ تم النسخ');
    } catch {
      setToast('تعذر النسخ');
    }
  }

  const approvedReviews = useMemo(() => reviews.filter((r) => r.approved === true), [reviews]);

  async function submitReview() {
    const text = normalizeStr(reviewText);
    if (!text) {
      setToast('اكتب تعليقك أولاً');
      return;
    }

    try {
      await apiCreateReview({
        name: normalizeStr(reviewName) || null,
        rating: Math.max(1, Math.min(5, Number(reviewRating) || 5)),
        text
      });
      setReviewText('');
      await loadReviews();
      setToast('✅ تم إرسال التقييم');
    } catch {
      setToast('تعذر إرسال التقييم');
    }
  }

  return (
    <>
      <div className="hero">
        <h1>حاسبة التحويل</h1>
        <p>اختر الدولة وطريقة التسليم وأدخل المبلغ، ثم اضغط <b>احسب المبلغ</b> لعرض النتيجة.</p>
      </div>

      <div className="grid">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>بيانات التحويل</h2>
            <span className="badge">العملة: {currencyName}</span>
          </div>

          {error ? <div className="error">{error}</div> : null}

          <div className="field">
            <label htmlFor="country">الدولة المرسلة منها الأموال</label>
            <input
              id="country"
              list="countries"
              placeholder="اختر الدولة"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
            <datalist id="countries">
              {countryList.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div className="row">
            <div className="field">
              <label htmlFor="method">طريقة تسليم الأموال</label>
              <select id="method" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="cash">كاش</option>
                <option value="bank">بنكي</option>
                <option value="USDT">USDT</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="amount">ادخل المبلغ ({currencyName})</label>
              <input
                id="amount"
                type="number"
                inputMode="decimal"
                placeholder="مثلاً: 100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <button type="button" className="btn" onClick={calculate}>احسب المبلغ</button>
          </div>

          <div className="hint">إذا تركت المبلغ فارغًا، سيتم عرض الشروط وبيانات الحساب فقط.</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>معلومات سريعة</h2>
            <span className="badge">{status}</span>
          </div>

          <div className="hint">
            مصدر البيانات: <b>{dataBadge}</b>
          </div>

          <div className="field">
            <button type="button" className="btn btn-secondary" onClick={loadRates}>تحديث البيانات</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>تقييمات وتعليقات الزبائن</h2>
          <span className="badge">{approvedReviews.length}</span>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr', marginTop: 0 }}>
          <div className="section">
            <p className="section-title">✍️ اترك تقييمك</p>

            <div className="field">
              <label htmlFor="reviewName">الاسم</label>
              <input id="reviewName" placeholder="اسمك (اختياري)" maxLength={40} value={reviewName} onChange={(e) => setReviewName(e.target.value)} />
            </div>

            <div className="row">
              <div className="field">
                <label htmlFor="reviewRating">التقييم</label>
                <select id="reviewRating" value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
                  <option value={5}>5</option>
                  <option value={4}>4</option>
                  <option value={3}>3</option>
                  <option value={2}>2</option>
                  <option value={1}>1</option>
                </select>
              </div>

              <div className="field">
                <label>إرسال</label>
                <button type="button" className="btn" onClick={submitReview}>إرسال التقييم</button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="reviewText">التعليق</label>
              <textarea
                id="reviewText"
                placeholder="اكتب تعليقك هنا..."
                maxLength={400}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
            </div>
          </div>

          <div className="section">
            <p className="section-title">⭐ آراء الزبائن</p>
            {approvedReviews.length ? (
              <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                {approvedReviews.map((r) => {
                  const stars = '★★★★★'.slice(0, Math.max(1, Math.min(5, Number(r.rating) || 5)));
                  const date = r.created_at ? new Date(r.created_at).toLocaleDateString('ar') : '';
                  return (
                    <div key={r.id} className="hint" style={{ background: 'rgba(255,255,255,0.98)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                        <strong>{(r.name || 'زبون').toString().trim() || 'زبون'}</strong>
                        <span style={{ color: 'rgba(31,41,55,0.65)' }}>{date ? `${stars} • ${date}` : stars}</span>
                      </div>
                      <div style={{ marginTop: 6 }}>{(r.text || '').toString().trim()}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="hint">لا توجد تقييمات بعد. كن أول من يترك تقييمًا.</div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title="نتيجة التحويل"
        onClose={() => setModalOpen(false)}
        actions={
          <>
            <button type="button" className="btn btn-secondary" onClick={copyModal}>نسخ البيانات</button>
            <button type="button" className="btn" onClick={() => setModalOpen(false)}>إغلاق</button>
          </>
        }
      >
        {Number.isFinite(modalModel.total) ? (
          <div className="card" style={{ boxShadow: 'none', marginBottom: 12 }}>
            <p style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              fontSize: 34,
              fontWeight: 900,
              margin: 0,
              color: modalModel.method === 'bank' ? 'var(--green)' : 'var(--blue)'
            }}>
              💰 {formatNumber(modalModel.total)} {modalModel.currencyOutput}
            </p>
            <p style={{ margin: '8px 0 0', textAlign: 'center', color: 'rgba(31,41,55,0.65)', fontSize: 13, lineHeight: 1.6 }}>
              المبلغ الذي سيستلمه الطرف الآخر
            </p>
          </div>
        ) : null}

        <div className="section">
          <p className="section-title">📄 بيانات الحساب</p>
          <p style={{ margin: '10px 0 0', textAlign: 'center', fontWeight: 800, color: 'rgba(31,41,55,0.72)' }}>{modalModel.country || '—'}</p>

          {modalModel.termsText ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 900, color: 'rgba(31,41,55,0.9)', fontSize: 13, marginBottom: 6 }}>اقرأ الشروط جيدا قبل التحويل :</div>
              <pre style={{ margin: 0, color: 'rgba(31,41,55,0.78)', lineHeight: 1.9, fontSize: 14, whiteSpace: 'pre-wrap' }}>{modalModel.termsText}</pre>
            </div>
          ) : null}

          <div style={{ fontWeight: 900, color: 'rgba(31,41,55,0.9)', fontSize: 13, margin: '12px 0 6px' }}>بيانات الحساب:</div>
          <pre style={{ margin: 0, color: 'rgba(31,41,55,0.78)', lineHeight: 1.9, fontSize: 14, whiteSpace: 'pre-wrap' }}>{modalModel.accountText}</pre>
        </div>
      </Modal>

      <Toast message={toast} onClear={() => setToast('')} />
    </>
  );
}

export default CalculatorPage;
