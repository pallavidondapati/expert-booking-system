import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { expertAPI, bookingAPI } from '../utils/api';
import { useSocket } from '../context/SocketContext';
import './BookingPage.css';

const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const isDatePast = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
};

const validate = (form) => {
  const errors = {};
  if (!form.userName.trim() || form.userName.trim().length < 2) errors.userName = 'Name must be at least 2 characters';
  if (!form.userEmail.trim() || !/^\S+@\S+\.\S+$/.test(form.userEmail)) errors.userEmail = 'Enter a valid email address';
  if (!form.userPhone.trim() || !/^[6-9]\d{9}$/.test(form.userPhone)) errors.userPhone = 'Enter a valid 10-digit Indian mobile number';
  if (!form.date) errors.date = 'Please select a date';
  if (!form.timeSlot) errors.timeSlot = 'Please select a time slot';
  if (form.notes && form.notes.length > 500) errors.notes = 'Notes must be under 500 characters';
  return errors;
};

const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();

  const [expert, setExpert] = useState(null);
  const [slotsByDate, setSlotsByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    userName: '', userEmail: '', userPhone: '',
    date: '', timeSlot: '', notes: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    const fetchExpert = async () => {
      try {
        const res = await expertAPI.getById(id);
        setExpert(res.data.data);
        setSlotsByDate(res.data.data.slotsByDate || {});
        const dates = Object.keys(res.data.data.slotsByDate || {}).filter(d => !isDatePast(d));
        if (dates.length > 0) setForm(f => ({ ...f, date: dates[0] }));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchExpert();
  }, [id]);

  // Real-time slot updates
  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('join-expert-room', id);

    const handleSlotBooked = ({ expertId, date, timeSlot }) => {
      if (expertId !== id) return;
      setSlotsByDate((prev) => {
        const updated = { ...prev };
        if (updated[date]) {
          updated[date] = updated[date].map(s =>
            s.time === timeSlot ? { ...s, isBooked: true } : s
          );
        }
        return updated;
      });
      // Clear selection if that slot was selected by someone else
      setForm(f => {
        if (f.date === date && f.timeSlot === timeSlot) {
          return { ...f, timeSlot: '' };
        }
        return f;
      });
    };

    socket.on('slot-booked', handleSlotBooked);
    return () => {
      socket.off('slot-booked', handleSlotBooked);
      socket.emit('leave-expert-room', id);
    };
  }, [socket, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === 'date') setForm(f => ({ ...f, date: value, timeSlot: '' }));
    if (touched[name]) {
      const errs = validate({ ...form, [name]: value });
      setFieldErrors(prev => ({ ...prev, [name]: errs[name] }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const errs = validate(form);
    setFieldErrors(prev => ({ ...prev, [name]: errs[name] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = Object.keys(form).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await bookingAPI.create({ expertId: id, ...form });
      setSuccess(res.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const availableDates = Object.keys(slotsByDate).filter(d => !isDatePast(d)).sort();
  const currentSlots = form.date ? (slotsByDate[form.date] || []) : [];

  if (loading) return (
    <div className="loading-overlay" style={{ minHeight: '60vh' }}>
      <div className="spinner" style={{ width: 48, height: 48 }} />
      <p>Loading booking form...</p>
    </div>
  );

  if (success) return (
    <div className="booking-success-page">
      <div className="success-card card">
        <div className="success-icon">✅</div>
        <h2>Booking Confirmed!</h2>
        <p className="success-sub">Your session has been booked successfully.</p>
        <div className="success-details">
          <div className="success-detail-row">
            <span>Expert</span>
            <strong>{success.expertName}</strong>
          </div>
          <div className="success-detail-row">
            <span>Date</span>
            <strong>{formatDate(success.date)}</strong>
          </div>
          <div className="success-detail-row">
            <span>Time</span>
            <strong>{success.timeSlot}</strong>
          </div>
          <div className="success-detail-row">
            <span>Status</span>
            <span className="status-badge status-pending">{success.status}</span>
          </div>
          <div className="success-detail-row">
            <span>Booking ID</span>
            <code className="booking-id">{success._id}</code>
          </div>
        </div>
        <div className="success-actions">
          <button className="btn btn-primary" onClick={() => navigate('/my-bookings')}>
            View My Bookings
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/')}>
            Browse More Experts
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="booking-page">
      <header className="page-header">
        <div className="container">
          <button className="back-btn-dark" onClick={() => navigate(`/experts/${id}`)}>
            ← Back to Profile
          </button>
          <h1>Book a Session</h1>
          {expert && <p>with {expert.name} · {expert.specialization}</p>}
        </div>
      </header>

      <div className="container">
        <div className="booking-layout">
          {/* Form */}
          <form className="booking-form card" onSubmit={handleSubmit} noValidate>
            <h2>Your Details</h2>

            {error && <div className="alert alert-error">⚠️ {error}</div>}

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="userName">Full Name *</label>
                <input
                  id="userName" name="userName" type="text"
                  className={`form-input ${touched.userName && fieldErrors.userName ? 'error' : ''}`}
                  placeholder="Ramesh Kumar"
                  value={form.userName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.userName && fieldErrors.userName && (
                  <span className="form-error">⚠ {fieldErrors.userName}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="userEmail">Email Address *</label>
                <input
                  id="userEmail" name="userEmail" type="email"
                  className={`form-input ${touched.userEmail && fieldErrors.userEmail ? 'error' : ''}`}
                  placeholder="ramesh@example.com"
                  value={form.userEmail}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.userEmail && fieldErrors.userEmail && (
                  <span className="form-error">⚠ {fieldErrors.userEmail}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="userPhone">Mobile Number *</label>
                <input
                  id="userPhone" name="userPhone" type="tel"
                  className={`form-input ${touched.userPhone && fieldErrors.userPhone ? 'error' : ''}`}
                  placeholder="9876543210"
                  value={form.userPhone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={10}
                />
                {touched.userPhone && fieldErrors.userPhone && (
                  <span className="form-error">⚠ {fieldErrors.userPhone}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="date">Session Date *</label>
                <select
                  id="date" name="date"
                  className={`form-select ${touched.date && fieldErrors.date ? 'error' : ''}`}
                  value={form.date}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  <option value="">Select a date</option>
                  {availableDates.map(d => (
                    <option key={d} value={d}>{formatDate(d)}</option>
                  ))}
                </select>
                {touched.date && fieldErrors.date && (
                  <span className="form-error">⚠ {fieldErrors.date}</span>
                )}
              </div>
            </div>

            {/* Time Slot Picker */}
            <div className="form-group">
              <label className="form-label">Time Slot *</label>
              {!form.date ? (
                <p className="slot-hint">Select a date to see available time slots</p>
              ) : currentSlots.length === 0 ? (
                <p className="slot-hint">No slots available for this date</p>
              ) : (
                <div className="slot-picker">
                  {currentSlots.map(slot => (
                    <button
                      key={slot._id}
                      type="button"
                      className={`slot-pick-btn ${slot.isBooked ? 'booked' : ''} ${form.timeSlot === slot.time && !slot.isBooked ? 'selected' : ''}`}
                      onClick={() => !slot.isBooked && setForm(f => ({ ...f, timeSlot: slot.time }))}
                      disabled={slot.isBooked}
                    >
                      {slot.time}
                      {slot.isBooked && <span className="booked-label">Booked</span>}
                    </button>
                  ))}
                </div>
              )}
              {touched.timeSlot && fieldErrors.timeSlot && (
                <span className="form-error">⚠ {fieldErrors.timeSlot}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="notes">
                Notes / Agenda <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                id="notes" name="notes"
                className={`form-textarea ${touched.notes && fieldErrors.notes ? 'error' : ''}`}
                placeholder="What would you like to discuss? Share any relevant context to help the expert prepare..."
                value={form.notes}
                onChange={handleChange}
                onBlur={handleBlur}
                rows={4}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {touched.notes && fieldErrors.notes ? (
                  <span className="form-error">⚠ {fieldErrors.notes}</span>
                ) : <span />}
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {form.notes.length}/500
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
              style={{ width: '100%', marginTop: 8 }}
            >
              {submitting ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Confirming Booking...
                </>
              ) : (
                'Confirm Booking →'
              )}
            </button>
          </form>

          {/* Summary Sidebar */}
          {expert && (
            <div className="booking-summary card">
              <h3>Session Summary</h3>
              <div className="summary-expert">
                <div className="summary-avatar">{expert.avatar}</div>
                <div>
                  <p className="summary-name">{expert.name}</p>
                  <p className="summary-spec">{expert.specialization}</p>
                </div>
              </div>
              <hr className="divider" />
              <div className="summary-rows">
                <div className="summary-row">
                  <span>Date</span>
                  <strong>{form.date ? formatDate(form.date) : '—'}</strong>
                </div>
                <div className="summary-row">
                  <span>Time</span>
                  <strong>{form.timeSlot || '—'}</strong>
                </div>
                <div className="summary-row">
                  <span>Duration</span>
                  <strong>60 min</strong>
                </div>
                <div className="summary-row total-row">
                  <span>Total</span>
                  <strong>₹{expert.hourlyRate}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
