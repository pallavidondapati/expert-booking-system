import React, { useState } from 'react';
import { bookingAPI } from '../utils/api';
import './MyBookingsPage.css';

const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
};

const formatCreatedAt = (dateStr) => {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const StatusBadge = ({ status }) => (
  <span className={`status-badge status-${status?.toLowerCase()}`}>{status}</span>
);

const CATEGORY_ICONS = {
  Technology: '💻', Finance: '📈', Healthcare: '🏥',
  Legal: '⚖️', Marketing: '🎯', Design: '🎨',
  Entrepreneurship: '🚀', Other: '💡',
};

const MyBookingsPage = () => {
  const [email, setEmail] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchBookings = async (e) => {
    e?.preventDefault();
    if (!inputEmail.trim() || !/^\S+@\S+\.\S+$/.test(inputEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    setError('');
    setSearched(true);
    setEmail(inputEmail);
    try {
      const res = await bookingAPI.getByEmail(inputEmail.trim());
      setBookings(res.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setUpdatingId(bookingId);
    try {
      await bookingAPI.updateStatus(bookingId, 'Cancelled');
      setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'Cancelled' } : b));
    } catch (err) {
      alert('Failed to cancel: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const activeBookings = bookings.filter(b => b.status !== 'Cancelled');
  const cancelledBookings = bookings.filter(b => b.status === 'Cancelled');

  return (
    <div className="my-bookings-page">
      <header className="page-header">
        <div className="container">
          <h1>My Bookings</h1>
          <p>Track all your expert sessions in one place</p>
        </div>
      </header>

      <div className="container">
        {/* Email Search */}
        <div className="email-search-card card">
          <div className="email-search-icon">📧</div>
          <h3>Find Your Bookings</h3>
          <p>Enter the email address you used when booking a session</p>
          <form className="email-search-form" onSubmit={fetchBookings}>
            <input
              type="email"
              className={`form-input ${error ? 'error' : ''}`}
              placeholder="yourname@example.com"
              value={inputEmail}
              onChange={(e) => { setInputEmail(e.target.value); setError(''); }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Searching...</>
              ) : 'Find Bookings'}
            </button>
          </form>
          {error && <div className="alert alert-error" style={{ marginTop: 12 }}>⚠️ {error}</div>}
        </div>

        {/* Results */}
        {searched && !loading && (
          <div className="bookings-results">
            {bookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No bookings found</h3>
                <p>We couldn't find any bookings for <strong>{email}</strong></p>
              </div>
            ) : (
              <>
                <div className="results-header">
                  <h2>
                    {bookings.length} booking{bookings.length !== 1 ? 's' : ''} for <span className="email-highlight">{email}</span>
                  </h2>
                  <div className="status-summary">
                    {['Pending', 'Confirmed', 'Completed', 'Cancelled'].map(status => {
                      const count = bookings.filter(b => b.status === status).length;
                      if (!count) return null;
                      return (
                        <span key={status} className={`status-badge status-${status.toLowerCase()}`}>
                          {count} {status}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Active Bookings */}
                {activeBookings.length > 0 && (
                  <div className="bookings-group">
                    <h3 className="group-label">Active Sessions</h3>
                    <div className="bookings-list">
                      {activeBookings.map((booking) => (
                        <BookingCard
                          key={booking._id}
                          booking={booking}
                          onCancel={handleCancel}
                          updatingId={updatingId}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Cancelled Bookings */}
                {cancelledBookings.length > 0 && (
                  <div className="bookings-group">
                    <h3 className="group-label" style={{ color: 'var(--text-muted)' }}>Cancelled</h3>
                    <div className="bookings-list">
                      {cancelledBookings.map((booking) => (
                        <BookingCard key={booking._id} booking={booking} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const BookingCard = ({ booking, onCancel, updatingId }) => {
  const canCancel = booking.status === 'Pending' || booking.status === 'Confirmed';
  const icon = CATEGORY_ICONS[booking.expertCategory] || '💡';

  return (
    <div className={`booking-card card ${booking.status === 'Cancelled' ? 'cancelled-card' : ''}`}>
      <div className="booking-card-left">
        <div className="booking-expert-icon">{icon}</div>
        <div className="booking-info">
          <div className="booking-expert-name">{booking.expertName}</div>
          <div className="booking-expert-cat">{booking.expertCategory}</div>
        </div>
      </div>

      <div className="booking-card-center">
        <div className="booking-datetime">
          <span className="booking-date">📅 {formatDate(booking.date)}</span>
          <span className="booking-time">🕐 {booking.timeSlot}</span>
        </div>
        {booking.notes && (
          <div className="booking-notes">
            <span>📝</span>
            <span className="notes-text">{booking.notes.length > 80 ? booking.notes.slice(0, 80) + '...' : booking.notes}</span>
          </div>
        )}
        <div className="booking-created">Booked on {formatCreatedAt(booking.createdAt)}</div>
      </div>

      <div className="booking-card-right">
        <StatusBadge status={booking.status} />
        {canCancel && onCancel && (
          <button
            className="btn btn-ghost btn-sm cancel-btn"
            onClick={() => onCancel(booking._id)}
            disabled={updatingId === booking._id}
          >
            {updatingId === booking._id ? 'Cancelling...' : 'Cancel'}
          </button>
        )}
        <div className="booking-id-small">ID: {booking._id.slice(-6).toUpperCase()}</div>
      </div>
    </div>
  );
};

export default MyBookingsPage;
