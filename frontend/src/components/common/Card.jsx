export default function Card({ title, children, actions, icon: Icon, description, className = "" }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions || description) && (
        <div className="card-header">
          <div className="card-heading">
            {Icon && <span className="card-heading-icon"><Icon size={22} aria-hidden="true" /></span>}
            <div>
              {title && <h2 className="card-title">{title}</h2>}
              {description && <p className="card-description">{description}</p>}
            </div>
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}
