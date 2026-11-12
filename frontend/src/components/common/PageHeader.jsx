export default function PageHeader({ icon: Icon, title, description, actions }) {
  return (
    <div className="page-header">
      <div className="page-heading">
        {Icon && <span className="page-heading-icon"><Icon size={27} strokeWidth={1.8} aria-hidden="true" /></span>}
        <div className="page-heading-copy">
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
