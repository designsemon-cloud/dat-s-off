export function Logo() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="inline-flex items-center cursor-pointer"
    >
      <span className="text-lg font-bold text-foreground" style={{ letterSpacing: "-1px" }}>
        Dats <span className="text-primary">off.</span>
      </span>
    </button>
  );
}
