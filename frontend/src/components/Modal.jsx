export default function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="card modal" onClick={(e) => e.stopPropagation()} role="dialog">
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
