export default function RoomScene({
  variant = "living",
}: {
  variant?: "living" | "nook" | "work";
}) {
  const work = variant === "work";
  const wall = variant === "nook" ? "#e4d1b4" : work ? "#d7dccc" : "#dfc9b4";
  return (
    <svg
      className="room-scene"
      viewBox="0 0 560 600"
      role="img"
      aria-label={`Original illustration of ${work ? "a quiet home workspace" : variant === "nook" ? "a warm reading nook" : "a considered living space"}`}
    >
      <rect width="560" height="600" fill={wall} />
      <path d="M0 445h560v155H0z" fill="#b29a7e" />
      <path
        d="M0 445h560M0 514h560M0 570h560M112 445v155M335 445v155"
        stroke="#8d795f"
        strokeWidth="1"
        opacity=".3"
      />
      <path d="M80 445V170a160 160 0 01320 0v275" fill="#f2e8d6" />
      <path d="M96 445V172a144 144 0 01288 0v273" fill="#d4bda1" />
      <path d="M102 80h108v240H102z" fill="#ecedde" />
      <path d="M156 80v240M102 195h108" stroke="#b2a081" strokeWidth="7" />
      <path d="M210 198l155 247H260L102 318V198z" fill="#fcf1d7" opacity=".3" />
      <ellipse
        cx="295"
        cy="520"
        rx="195"
        ry="35"
        fill="#806d55"
        opacity=".18"
      />
      {work ? (
        <>
          <path d="M138 374h276v17H138z" fill="#805f43" />
          <path d="M154 391h12v124h-12zM388 391h12v124h-12z" fill="#5d4c3c" />
          <rect x="241" y="300" width="89" height="61" rx="4" fill="#4a5146" />
          <rect x="248" y="307" width="75" height="47" rx="1" fill="#a7b6a0" />
          <path d="M283 361v12m-20 0h40" stroke="#4a5146" strokeWidth="5" />
          <path d="M236 443q2-70 42-70h41q18 0 18 30v63h-98" fill="#9c6f51" />
          <path
            d="M243 469l-9 75M319 469l13 75"
            stroke="#594632"
            strokeWidth="8"
          />
          <path d="M170 365h45l-6-7h-31z" fill="#e7dac2" />
        </>
      ) : (
        <>
          <path
            d="M126 387q0-52 43-52h159q48 0 48 52v107H126z"
            fill={variant === "nook" ? "#9b7454" : "#9c5c42"}
          />
          <rect x="112" y="407" width="46" height="90" rx="17" fill="#a97050" />
          <rect x="347" y="407" width="43" height="90" rx="17" fill="#a97050" />
          <rect
            x="161"
            y="403"
            width="178"
            height="70"
            rx="17"
            fill="#bd8060"
          />
          <path
            d="M137 495l-7 36M363 495l8 36"
            stroke="#604a37"
            strokeWidth="9"
          />
          <rect
            x="177"
            y="357"
            width="61"
            height="60"
            rx="9"
            fill="#ded5b7"
            transform="rotate(-9 207 387)"
          />
          <rect
            x="281"
            y="358"
            width="42"
            height="57"
            rx="6"
            fill="#555f48"
            transform="rotate(8 300 385)"
          />
        </>
      )}
      <ellipse cx="409" cy="476" rx="64" ry="15" fill="#947254" />
      <path d="M398 489v55M425 489l14 54" stroke="#705239" strokeWidth="8" />
      <path d="M411 411h20l6 49q-6 12-16 12t-17-12z" fill="#c19165" />
      <path d="M421 412v-81" stroke="#536046" strokeWidth="3" />
      <path
        d="M421 356q-44-37-43-5 2 18 43 5M422 371q40-43 40-11-3 18-40 11M421 337q-13-40-27-27-9 17 27 27"
        fill="#67704f"
      />
      <path d="M471 201v280" stroke="#5f5946" strokeWidth="5" />
      <path d="M435 217l17-42h38l17 42z" fill="#f5e9ce" />
      <ellipse cx="471" cy="481" rx="32" ry="7" fill="#5f5946" />
      <path d="M282 174h67v82h-67z" fill="#f3e8d4" />
      <path d="M290 184h51v62h-51z" fill="#b79c77" />
      <circle cx="315" cy="211" r="17" fill="#d9c9ab" />
      <path d="M291 236l17-22 32 22" fill="#6e7757" />
      <path d="M40 561h480" stroke="#f1e8d5" strokeWidth="1" opacity=".3" />
    </svg>
  );
}
