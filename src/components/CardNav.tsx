import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ArrowUpRight, Copy } from 'lucide-react';
import { Link, useNavigate, useLocation } from '@tanstack/react-router';
import { toast } from 'sonner';
import './CardNav.css';

export interface CardNavLink {
  label: string;
  href?: string;
  ariaLabel?: string;
}

export interface CardNavItem {
  label: string;
  bgColor?: string;
  textColor?: string;
  href?: string;
  copyText?: string;
  onClick?: () => void;
  links?: CardNavLink[];
}

export interface CardNavProps {
  logo?: string | React.ReactNode;
  logoAlt?: string;
  items?: CardNavItem[];
  className?: string;
  ease?: string;
  baseColor?: string;
  menuColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  ctaText?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  theme?: string;
}

export const CardNav = ({
  logo,
  logoAlt = 'Logo',
  items = [],
  className = '',
  ease = 'power3.out',
  baseColor = '#0e1017',
  menuColor = '#f1f5f9',
  buttonBgColor = '#cbdaf2',
  buttonTextColor = '#0f172a',
  ctaText,
  ctaHref,
  onCtaClick,
}: CardNavProps) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 230;

    const isMobile =
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 768px)').matches;

    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content') as HTMLElement | null;
      if (contentEl) {
        const wasVisible = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;

        contentEl.style.visibility = 'visible';
        contentEl.style.pointerEvents = 'auto';
        contentEl.style.position = 'static';
        contentEl.style.height = 'auto';

        // Trigger reflow
        void contentEl.offsetHeight;

        const topBar = 60;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;

        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        return topBar + contentHeight + padding;
      }
    }
    return 230;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    const validCards = cardsRef.current.filter(Boolean);

    gsap.set(navEl, { height: 60, overflow: 'hidden' });
    if (validCards.length > 0) {
      gsap.set(validCards, { y: 16, opacity: 0, scale: 0.98 });
    }

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.28,
      ease: 'power3.out',
    });

    if (validCards.length > 0) {
      tl.to(
        validCards,
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.24,
          ease: 'power2.out',
          stagger: 0.035,
        },
        '-=0.18'
      );
    }

    return tl;
  };

  useEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;

    return () => {
      tl?.kill();
      tlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ease, items]);

  useEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;

      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });

        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          newTl.progress(1);
          tlRef.current = newTl;
        }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          tlRef.current = newTl;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const closeMenu = () => {
    const tl = tlRef.current;
    if (!tl || !isExpanded) return;
    setIsHamburgerOpen(false);
    tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
    tl.timeScale(1.35).reverse();
  };

  const openMenu = () => {
    const tl = tlRef.current;
    if (!tl || isExpanded) return;
    setIsHamburgerOpen(true);
    setIsExpanded(true);
    tl.timeScale(1).play(0);
  };

  const toggleMenu = () => {
    if (isExpanded) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  // Close when pathname changes
  useEffect(() => {
    if (isExpanded) {
      closeMenu();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isExpanded) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    cardsRef.current[i] = el;
  };

  const isExternalLink = (url?: string) => {
    if (!url) return false;
    return (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('mailto:') ||
      url.startsWith('tel:')
    );
  };

  const handleCardClick = (item: CardNavItem) => {
    if (item.copyText) {
      const copySuccess = () => {
        toast.success('Email copied to clipboard!', {
          description: item.copyText,
        });
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(item.copyText)
          .then(copySuccess)
          .catch(() => {
            const textArea = document.createElement('textarea');
            textArea.value = item.copyText!;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            copySuccess();
          });
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = item.copyText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        copySuccess();
      }

      closeMenu();
      return;
    }

    if (item.onClick) {
      item.onClick();
      closeMenu();
      return;
    }

    if (!item.href) return;
    closeMenu();
    if (isExternalLink(item.href)) {
      window.location.href = item.href;
    } else {
      navigate({ to: item.href });
    }
  };

  const effectiveMenuColor = menuColor || '#f1f5f9';
  const hasCta = Boolean(ctaText && (ctaHref || onCtaClick));

  return (
    <div className={`card-nav-container ${className}`}>
      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? 'open' : ''}`}
        style={{ backgroundColor: baseColor }}
      >
        <div className="card-nav-top">
          <button
            type="button"
            className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            aria-expanded={isExpanded}
            style={{ color: effectiveMenuColor }}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </button>

          <div className="logo-container">
            {logo ? (
              typeof logo === 'string' &&
              (logo.endsWith('.svg') ||
                logo.endsWith('.png') ||
                logo.endsWith('.jpg') ||
                logo.endsWith('.webp') ||
                logo.startsWith('http') ||
                logo.startsWith('/')) ? (
                <Link to="/" aria-label="Home" onClick={closeMenu}>
                  <img src={logo} alt={logoAlt} className="logo" />
                </Link>
              ) : (
                <Link
                  to="/"
                  className="logo-text"
                  style={{ color: effectiveMenuColor }}
                  onClick={closeMenu}
                >
                  {logo}
                </Link>
              )
            ) : (
              <Link
                to="/"
                className="logo-text text-primary"
                onClick={closeMenu}
              >
                Marcell's Portfolio
              </Link>
            )}
          </div>

          {hasCta ? (
            ctaHref ? (
              <a
                href={ctaHref}
                className="card-nav-cta-button"
                style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
                onClick={closeMenu}
              >
                {ctaText}
              </a>
            ) : (
              <button
                type="button"
                className="card-nav-cta-button"
                style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
                onClick={() => {
                  onCtaClick?.();
                  closeMenu();
                }}
              >
                {ctaText}
              </button>
            )
          ) : (
            <div className="top-spacer" aria-hidden="true" />
          )}
        </div>

        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {(items || []).slice(0, 3).map((item, idx) => {
            const isClickable = Boolean(
              item.href || item.copyText || item.onClick
            );

            return (
              <div
                key={`${item.label}-${idx}`}
                className={`nav-card ${isClickable ? 'clickable' : ''}`}
                ref={setCardRef(idx)}
                onClick={() => handleCardClick(item)}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={e => {
                  if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleCardClick(item);
                  }
                }}
                style={{
                  backgroundColor: item.bgColor || '#141724',
                  color: item.textColor || '#fff',
                }}
              >
                <div className="nav-card-header">
                  <span className="nav-card-label">{item.label}</span>
                  {isClickable && (
                    item.copyText ? (
                      <Copy className="nav-card-arrow" aria-hidden="true" />
                    ) : (
                      <ArrowUpRight className="nav-card-arrow" aria-hidden="true" />
                    )
                  )}
                </div>

                {item.links && item.links.length > 0 && (
                  <div className="nav-card-mentions">
                    {item.links.map((lnk, i) => (
                      <span
                        key={`${lnk.label}-${i}`}
                        className="nav-card-mention"
                        aria-label={lnk.ariaLabel}
                      >
                        {lnk.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
