import "./InformationCard.css";

export default function InformationCard() {
  return (
    <div className="information-card card">
      <div className="info-image">
        <img
          src="https://randomuser.me/api/portraits/women/68.jpg"
          alt="Profile"
        />
      </div>
      <div className="info-content">
        <h3>Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Email</span>
            <a href="mailto:jeny@gmail.com" className="info-value">
              jeny@gmail.com
            </a>
          </div>
          <div className="info-item">
            <span className="info-label">Phone</span>
            <span className="info-value">0023-333-526136</span>
          </div>
        </div>
      </div>
    </div>
  );
}
