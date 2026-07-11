export interface Seller {
  name: string;
  phone: string;
}

function buildWaLink(phone: string, message?: string) {
  const digits = phone.replace(/\D/g, '');
  return message ? `https://wa.me/55${digits}?text=${encodeURIComponent(message)}` : `https://wa.me/55${digits}`;
}

interface WhatsAppContactProps {
  sellers?: Seller[];
  fallbackPhone?: string | null;
  message?: string;
  className: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * Renders a WhatsApp CTA. With 0 or 1 sellers it behaves like a plain link
 * (matches the old single-phone behavior). With 2+ sellers it becomes a
 * <details> dropdown listing each seller by name — no client JS needed, so
 * this works from server-rendered storefront pages.
 */
export function WhatsAppContact({ sellers, fallbackPhone, message, className, style, children }: WhatsAppContactProps) {
  const valid = (sellers ?? []).filter(s => s.name?.trim() && s.phone?.replace(/\D/g, ''));

  if (valid.length <= 1) {
    const phone = valid[0]?.phone ?? fallbackPhone;
    if (!phone) return null;
    return (
      <a href={buildWaLink(phone, message)} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        {children}
      </a>
    );
  }

  return (
    <details className="relative pointer-events-auto">
      <summary className={`${className} list-none cursor-pointer [&::-webkit-details-marker]:hidden`} style={style}>
        {children}
      </summary>
      <div
        className="absolute z-30 mt-2 w-full min-w-[220px] right-0 rounded-lg border bg-white shadow-lg overflow-hidden pointer-events-auto"
        style={{ borderColor: '#e5eeff' }}
      >
        <p className="px-4 pt-3 pb-1 font-mono text-[10px] uppercase tracking-wider" style={{ color: '#45464d' }}>
          Falar com
        </p>
        {valid.map(s => (
          <a
            key={s.phone}
            href={buildWaLink(s.phone, message)}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-2.5 text-sm font-medium hover:bg-[#f8f9ff] transition-colors"
            style={{ color: '#0b1c30' }}
          >
            {s.name}
          </a>
        ))}
      </div>
    </details>
  );
}
