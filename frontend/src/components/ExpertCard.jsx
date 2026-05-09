import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ExpertCard.css';

const CATEGORY_ICONS = {
  Technology: '💻',
  Finance: '📈',
  Healthcare: '🏥',
  Legal: '⚖️',
  Marketing: '🎯',
  Design: '🎨',
  Entrepreneurship: '🚀',
  Other: '💡',
};

const getCategoryClass = (cat) => cat?.toLowerCase().replace(/\s+/g, '-') || 'other';

const StarRating = ({ rating }) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="stars">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < full ? 'star filled' : half && i === full ? 'star half' : 'star empty'}>
          ★
        </span>
      ))}
      <span className="rating-value">{rating.toFixed(1)}</span>
    </div>
  );
};

const ExpertCard = ({ expert, style }) => {
  const navigate = useNavigate();
  const icon = CATEGORY_ICONS[expert.category] || '💡';

  return (
    <div className="expert-card card animate-fade-in-up" style={style} onClick={() => navigate(`/experts/${expert._id}`)}>
      <div className="card-accent" />

      <div className="card-header">
        <div className="avatar-wrap">
          <div className="avatar">{expert.avatar}</div>
          <div className="category-icon">{icon}</div>
        </div>
        <div className="card-meta">
          <span className={`badge badge-${getCategoryClass(expert.category)}`}>
            {expert.category}
          </span>
          <span className="experience">{expert.experience} yrs exp</span>
        </div>
      </div>

      <div className="card-body">
        <h3 className="expert-name">{expert.name}</h3>
        <p className="expert-spec">{expert.specialization}</p>
        <div className="card-stats">
          <StarRating rating={expert.rating} />
          <span className="review-count">({expert.reviewCount} reviews)</span>
        </div>
      </div>

      <div className="card-footer">
        <div className="rate">
          <span className="rate-amount">₹{expert.hourlyRate}</span>
          <span className="rate-label">/hour</span>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={(e) => { e.stopPropagation(); navigate(`/experts/${expert._id}`); }}
        >
          View Profile
        </button>
      </div>
    </div>
  );
};

export default ExpertCard;
