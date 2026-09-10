/**
 * Chupalla con cinta tricolor para adornar la fila destacada en septiembre.
 * SVG inline (no imagen): pesa nada, escala y se anima con CSS.
 * Se cuelga sobre el título de la colección — ver `adorno` en ColeccionRow.
 */
export default function Chupalla({ className = "", id = "chupalla" }: { className?: string; id?: string }) {
  // El id del clipPath se pasa por prop: dos chupallas en la misma página (logo
  // y fila destacada) no pueden compartir un id de SVG.
  return (
    <svg
      viewBox="0 0 64 44"
      className={className}
      role="img"
      aria-label="Chupalla con cinta chilena"
    >
      {/* Ala */}
      <ellipse cx="32" cy="32" rx="29" ry="7.5" fill="#E8C77E" stroke="#C09A4E" strokeWidth="1.2" />
      {/* Copa */}
      <path d="M16 32 C16 11 48 11 48 32 Z" fill="#F0D89A" stroke="#C09A4E" strokeWidth="1.2" />
      {/* Cinta tricolor, recortada a la forma de la copa */}
      <clipPath id={`${id}-copa`}>
        <path d="M16 32 C16 11 48 11 48 32 Z" />
      </clipPath>
      <g clipPath={`url(#${id}-copa)`}>
        <rect x="15" y="24" width="14" height="8" fill="#0039A6" />
        <rect x="29" y="24" width="10" height="8" fill="#FFFFFF" />
        <rect x="39" y="24" width="10" height="8" fill="#D52B1E" />
        <polygon
          points="22.5,25 23.21,27.03 25.35,27.07 23.64,28.37 24.26,30.43 22.5,29.2 20.74,30.43 21.36,28.37 19.65,27.07 21.79,27.03"
          fill="#FFFFFF"
        />
      </g>
      <path d="M16 32 C16 11 48 11 48 32" fill="none" stroke="#C09A4E" strokeWidth="1.2" />
    </svg>
  );
}
