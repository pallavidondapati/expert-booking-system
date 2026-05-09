import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { expertAPI } from '../utils/api';
import { useSocket } from '../context/SocketContext';
import './ExpertDetailPage.css';

const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
};

const isDatePast = (dateStr) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  return new Date(dateStr) < today;
};

const ExpertDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();

  const [expert, setExpert] = useState(null);
  const [slotsByDate, setSlotsByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [realtimeUpdates, setRealtimeUpdates] = useState([]);

  const fetchExpert = useCallback(async () => {
    try {
      const res = await expertAPI.getById(id);
      setExpert(res.data.data);
      setSlotsByDate(res.data.data.slotsByDate || {});
      const dates = Object.keys(res.data.data.slotsByDate || {}).filter(d => !isDatePast(d));
      if (dates.length > 0) setSelectedDate(dates[0]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchExpert();
  }, [fetchExpert]);

  // Real-time socket updates
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('join-expert-room', id);

    const handleSlotBooked = ({ expertId, date, timeSlot }) => {
      if (expertId !== id) return;
      setSlotsByDate((prev) => {
        const updated = { ...prev };
        if (updated[date]) {
          updated[date] = updated[date].map((slot) =>
            slot.time === timeSlot ? { ...slot, isBooked: true } : slot
          );
        }
        return updated;
      });
      setRealtimeUpdates((prev) => [`Slot ${timeSlot} on ${formatDate(date)} was just booked!`, ...prev.slice(0, 2)]);
      setTimeout(() => setRealtimeUpdates((prev) => prev.filter((_, i) => i !== 0)), 4000);
    };

    const handleSlotReleased = ({ expertId, date, timeSlot }) => {
      if (expertId !== id) return;
      setSlotsByDate((prev) => {
        const updated = { ...prev };
        if (updated[date]) {
          updated[date] = updated[date].map((slot) =>
            slot.time === timeSlot ? { ...slot, isBooked: false } : slot
          );
        }
        return updated;
      });
    };

    socket.on('slot-booked', handleSlotBooked);
    socket.on('slot-released', handleSlotReleased);

    return () => {
      socket.off('slot-booked', handleSlotBooked);
      socket.off('slot-released', handleSlotReleased);
      socket.emit('leave-expert-room', id);
    };
  }, [socket, id]);

  if (loading) return (
    <div className="loading-overlay" style={{ minHeight: '60vh' }}>
      <div className="spinner" style={{ width: 48, height: 48 }} />
      <p>Loading expert profile...</p>
    </div>
  );

  if (error) return (
    <div className="container" style={{ padding: '48px 24px' }}>
      <div className="alert alert-error">⚠️ {error}</div>
    </div>
  );

  if (!expert) return null;

  const availableDates = Object.keys(slotsByDate).filter(d => !isDatePast(d)).sort();
  const currentSlots = selectedDate ? (slotsByDate[selectedDate] || []) : [];
  const availableCount = currentSlots.filter(s => !s.isBooked).length;

  return (
    <div className="expert-detail-page">
      {/* Real-time notifications */}
      <div className="realtime-notifications">
        {realtimeUpdates.map((msg, i) => (
          <div key={i} className="realtime-toast">
            <span className="toast-dot" />
            {msg}
          </div>
        ))}
      </div>

      {/* Hero */}
      <div className="expert-hero">
        <div className="container">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back to Experts
          </button>

          <div className="expert-hero-content">
            <div className="expert-hero-left">
              <div className="expert-avatar-lg">{expert.avatar}</div>
              <div className="live-indicator">
                <span className="live-dot-sm" />
                <span>Live slots available</span>
              </div>
            </div>

            <div className="expert-hero-info">
              <span className={`badge badge-${expert.category?.toLowerCase()}`}>
                {expert.category}
              </span>
              <h1>{expert.name}</h1>
              <p className="expert-hero-spec">{expert.specialization}</p>

              <div className="expert-hero-stats">
                <div className="stat-item">
                  <span className="stat-value">⭐ {expert.rating?.toFixed(1)}</span>
                  <span className="stat-label">{expert.reviewCount} reviews</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-value">{expert.experience}+</span>
                  <span className="stat-label">Years experience</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-value">₹{expert.hourlyRate}</span>
                  <span className="stat-label">Per hour</span>
                </div>
              </div>

              <p className="expert-bio">{expert.bio}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Section */}
      <div className="container">
        <div className="booking-section">
          {/* Date Selector */}
          <div className="slot-section">
            <div className="slot-header">
              <h2>Available Sessions</h2>
              <span className="realtime-badge">
                <span className="pulse-dot" />
                Real-time updates
              </span>
            </div>

            {availableDates.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3>No available slots</h3>
                <p>Check back later for new availability</p>
              </div>
            ) : (
              <>
                <div className="date-tabs">
                  {availableDates.map((date) => {
                    const slots = slotsByDate[date] || [];
                    const avail = slots.filter(s => !s.isBooked).length;
                    return (
                      <button
                        key={date}
                        className={`date-tab ${selectedDate === date ? 'active' : ''} ${avail === 0 ? 'fully-booked' : ''}`}
                        onClick={() => setSelectedDate(date)}
                      >
                        <span className="date-tab-date">{formatDate(date)}</span>
                        <span className="date-tab-count">{avail} free</span>
                      </button>
                    );
                  })}
                </div>

                {selectedDate && (
                  <div className="slots-container">
                    <div className="slots-info">
                      <span>{formatDate(selectedDate)}</span>
                      <span className={`slot-availability ${availableCount === 0 ? 'none' : availableCount <= 2 ? 'low' : 'good'}`}>
                        {availableCount === 0 ? '🔴 Fully booked' : availableCount <= 2 ? `🟡 Only ${availableCount} left` : `🟢 ${availableCount} available`}
                      </span>
                    </div>

                    <div className="slots-grid">
                      {currentSlots.map((slot) => (
                        <div
                          key={slot._id}
                          className={`slot-chip ${slot.isBooked ? 'booked' : 'available'}`}
                        >
                          <span className="slot-time">{slot.time}</span>
                          {slot.isBooked ? (
                            <span className="slot-status-icon">🔒</span>
                          ) : (
                            <span className="slot-status-icon">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* CTA */}
          <div className="booking-cta-card card">
            <div className="cta-badge">Ready to connect?</div>
            <h3>Book a Session</h3>
            <p>Select a time slot on the booking form and secure your session with {expert.name}.</p>
            <div className="cta-details">
              <div className="cta-detail-item">
                <span>Duration</span>
                <strong>60 minutes</strong>
              </div>
              <div className="cta-detail-item">
                <span>Format</span>
                <strong>1:1 Video Call</strong>
              </div>
              <div className="cta-detail-item">
                <span>Rate</span>
                <strong>₹{expert.hourlyRate}</strong>
              </div>
            </div>
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              onClick={() => navigate(`/book/${id}`)}
              disabled={availableDates.length === 0}
            >
              Book Now →
            </button>
            {availableDates.length === 0 && (
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
                No slots currently available
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertDetailPage;
