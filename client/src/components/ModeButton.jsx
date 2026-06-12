export default function ModeButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      className={active ? "mode-button mode-button-active" : "mode-button"}
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
