import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_NAME = 'Veydo';
const DEFAULT_DESC = 'Создавайте рекламные видео через AI. Готовые шаблоны для TikTok, Reels и Meta.';
const BASE_URL = process.env.REACT_APP_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://veydo.com');

/**
 * Устанавливает title, description и canonical страницы для SEO.
 * @param {string} [title] — заголовок вкладки (к нему добавляется " — Veydo", если не заканчивается на SITE_NAME)
 * @param {string} [description] — meta description
 * @param {string} [canonical] — полный canonical URL (если не передан, строится из BASE_URL + pathname)
 */
function PageSEO({ title, description = DEFAULT_DESC, canonical: canonicalProp }) {
  const { pathname } = useLocation();
  const canonical = canonicalProp || `${BASE_URL.replace(/\/$/, '')}${pathname === '/' ? '' : pathname}`;

  useEffect(() => {
    const fullTitle = title
      ? (title.endsWith(SITE_NAME) ? title : `${title} — ${SITE_NAME}`)
      : SITE_NAME;
    document.title = fullTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    } else {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      metaDesc.content = description;
      document.head.appendChild(metaDesc);
    }

    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (linkCanonical) {
      linkCanonical.href = canonical;
    } else {
      linkCanonical = document.createElement('link');
      linkCanonical.rel = 'canonical';
      linkCanonical.href = canonical;
      document.head.appendChild(linkCanonical);
    }

    return () => {
      document.title = `${SITE_NAME} — AI-видео для рекламы`;
      if (metaDesc) metaDesc.setAttribute('content', DEFAULT_DESC);
    };
  }, [title, description, canonical]);

  return null;
}

export default PageSEO;
