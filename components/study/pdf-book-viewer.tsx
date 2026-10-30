"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, PDFPageProxy, TextItem } from "pdfjs-dist/types/src/display/api";
import { ActionButton } from "../ui/action-button";
import { Icon } from "../ui/icons";
import { useI18n } from "../../lib/localization/i18n";

type Props = { materialId: string; title: string; excerpt: string; sourceOffset?: number; contentLength: number; outlinePage?: number };
type Match = { page: number; itemStart: number; itemEnd: number };

const words = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().match(/[a-z0-9]+/g) ?? [];
const textItems = (page: Awaited<ReturnType<PDFPageProxy['getTextContent']>>) => page.items.filter((item): item is TextItem => 'str' in item);

function locate(items: TextItem[], excerpt: string): { itemStart: number; itemEnd: number } | null {
  const target = words(excerpt);
  if (target.length < 3) return null;
  const pageWords = items.flatMap((item, index) => words(item.str).map((word) => ({ word, index })));
  for (let size = Math.min(8, target.length); size >= Math.min(4, target.length); size--) {
    for (let start = 0; start <= pageWords.length - size; start++) {
      if (target.slice(0, size).every((word, offset) => pageWords[start + offset].word === word)) {
        let end = size;
        while (end < target.length && start + end < pageWords.length && target[end] === pageWords[start + end].word) end++;
        return { itemStart: pageWords[start].index, itemEnd: pageWords[start + end - 1].index };
      }
    }
  }
  return null;
}

export function PdfBookViewer({ materialId, title, excerpt, sourceOffset, contentLength, outlinePage }: Props) {
  const { t } = useI18n();
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(1);
  const [match, setMatch] = useState<Match | null>(null);
  const [status, setStatus] = useState<'loading' | 'searching' | 'ready' | 'unmatched' | 'error'>('loading');
  const [turnSide, setTurnSide] = useState<'left' | 'right' | null>(null);
  const [width, setWidth] = useState(0);
  const bookRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const sideOfPage = (left: number, width: number, clientX: number): 'left' | 'right' | null => {
    if (width <= 0) return null;
    const position = (clientX - left) / width;
    return position < 0.28 ? 'left' : position > 0.72 ? 'right' : null;
  };
  const turnPage = (direction: -1 | 1) => {
    if (!pageCount) return;
    setPage((current) => Math.max(1, Math.min(pageCount, current + direction)));
    bookRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
  };
  const jumpToPage = (target: number) => {
    if (!pageCount) return;
    setPage(target);
    bookRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
  };

  useEffect(() => setTurnSide(null), [page, pdf]);

  useEffect(() => {
    const element = sheetRef.current;
    if (!element) return;
    const measure = () => setWidth(element.clientWidth);
    measure();
    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    let active = true;
    let pdfDocument: PDFDocumentProxy | undefined;
    let task: { destroy: () => Promise<void> } | undefined;
    setPdf(null); setPageCount(0); setMatch(null); setStatus('loading');
    void (async () => {
      try {
        const response = await fetch(`/api/materials/${encodeURIComponent(materialId)}/file`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`PDF ${response.status}`);
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
        task = pdfjs.getDocument({ data: new Uint8Array(await response.arrayBuffer()) });
        pdfDocument = await (task as ReturnType<typeof pdfjs.getDocument>).promise;
        if (!active || !pdfDocument) return;
        const loadedPageCount = pdfDocument.numPages;
        setPageCount(loadedPageCount);
        setPdf(pdfDocument);
        const estimate = Math.max(1, Math.min(loadedPageCount, outlinePage ?? (Math.round(((sourceOffset ?? 0) / Math.max(1, contentLength)) * loadedPageCount) || 1)));
        setPage(estimate);
        setStatus('searching');
        const order = Array.from({ length: loadedPageCount }, (_, index) => index + 1).sort((a, b) => Math.abs(a - estimate) - Math.abs(b - estimate));
        for (const number of order) {
          if (!active) return;
          const pdfPage = await pdfDocument.getPage(number);
          const found = locate(textItems(await pdfPage.getTextContent()), excerpt);
          pdfPage.cleanup();
          if (found) {
            if (active) { setMatch({ page: number, ...found }); setPage(number); setStatus('ready'); }
            return;
          }
        }
        if (active) setStatus('unmatched');
      } catch {
        if (active) setStatus('error');
      }
    })();
    return () => { active = false; void task?.destroy(); };
  }, [materialId, excerpt, sourceOffset, contentLength, outlinePage]);

  useEffect(() => {
    if (!pdf || !width || !canvasRef.current || !highlightRef.current) return;
    let active = true;
    let rendering: { cancel: () => void } | undefined;
    void (async () => {
      try {
        const pdfPage = await pdf.getPage(page);
        if (!active) return;
        const natural = pdfPage.getViewport({ scale: 1 });
        const viewport = pdfPage.getViewport({ scale: width / natural.width });
        const canvas = canvasRef.current!;
        const overlay = highlightRef.current!;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        overlay.style.width = `${viewport.width}px`;
        overlay.style.height = `${viewport.height}px`;
        overlay.replaceChildren();
        const context = canvas.getContext('2d');
        if (!context) return;
        rendering = pdfPage.render({ canvas, canvasContext: context, viewport, transform: [pixelRatio, 0, 0, pixelRatio, 0, 0] });
        await (rendering as ReturnType<typeof pdfPage.render>).promise;
        if (!active || !match || match.page !== page) return;
        const { Util } = await import('pdfjs-dist');
        const items = textItems(await pdfPage.getTextContent());
        for (const item of items.slice(match.itemStart, match.itemEnd + 1)) {
          const transform = Util.transform(viewport.transform, item.transform);
          const height = Math.hypot(transform[2], transform[3]);
          const mark = document.createElement('span');
          mark.className = 'pdf-book-highlight';
          mark.style.left = `${transform[4]}px`;
          mark.style.top = `${transform[5] - height}px`;
          mark.style.width = `${item.width * viewport.scale}px`;
          mark.style.height = `${height * 1.2}px`;
          overlay.appendChild(mark);
        }
      } catch (error) {
        if (active && !(error instanceof Error && error.name === 'RenderingCancelledException')) setStatus('error');
      }
    })();
    return () => { active = false; rendering?.cancel(); };
  }, [pdf, page, match, width]);

  return <section className="pdf-book" ref={bookRef} aria-label={title}>
    <div className="pdf-book-toolbar"><strong>{title}</strong><div className="pdf-book-controls">
      <div className="pdf-book-control-group">
        <ActionButton variant="secondary" size="small" className="pdf-book-page-button first" onClick={() => jumpToPage(1)} disabled={!pageCount || page <= 1} aria-label={t('firstPage')} title={t('firstPage')}><span aria-hidden="true">«</span><span className="pdf-book-button-label">{t('firstPage')}</span></ActionButton>
        <ActionButton variant="secondary" size="small" className="pdf-book-page-button previous" onClick={() => turnPage(-1)} disabled={!pageCount || page <= 1} aria-label={t('previousPage')} title={t('previousPage')}><Icon name="chevron" /><span className="pdf-book-button-label">{t('previousPage')}</span></ActionButton>
      </div>
      <span className="pdf-book-pagination" aria-live="polite">{t('sourcePage')} {page}{pageCount ? ` / ${pageCount}` : ''}</span>
      <div className="pdf-book-control-group">
        <ActionButton variant="secondary" size="small" className="pdf-book-page-button" onClick={() => turnPage(1)} disabled={!pageCount || page >= pageCount} aria-label={t('nextPage')} title={t('nextPage')}><span className="pdf-book-button-label">{t('nextPage')}</span><Icon name="chevron" /></ActionButton>
        <ActionButton variant="secondary" size="small" className="pdf-book-page-button last" onClick={() => jumpToPage(pageCount)} disabled={!pageCount || page >= pageCount} aria-label={t('lastPage')} title={t('lastPage')}><span className="pdf-book-button-label">{t('lastPage')}</span><span aria-hidden="true">»</span></ActionButton>
      </div>
    </div></div>
    {status === 'loading' && <p className="pdf-book-status" role="status">{t('loadingPdf')}</p>}
    {status === 'searching' && <p className="pdf-book-status" role="status">{t('findingPassage')}</p>}
    {status === 'unmatched' && <p className="pdf-book-status" role="status">{t('passageNotLocated')}</p>}
    {status === 'error' && <p className="pdf-book-status" role="alert">{t('pdfUnavailable')}</p>}
    <div className="pdf-book-stage">
      <div
        className={`pdf-book-sheet${turnSide ? ` turn-${turnSide}` : ''}`}
        ref={sheetRef}
        role="group"
        tabIndex={pageCount ? 0 : -1}
        aria-label={`${t('sourcePage')} ${page}`}
        title={turnSide === 'left' ? t('previousPage') : turnSide === 'right' ? t('nextPage') : undefined}
        onPointerMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const side = pageCount ? sideOfPage(bounds.left, bounds.width, event.clientX) : null;
          const available = (side === 'left' && page > 1) || (side === 'right' && page < pageCount) ? side : null;
          setTurnSide(available);
        }}
        onPointerLeave={() => setTurnSide(null)}
        onClick={(event) => {
          if (!pageCount) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          const side = sideOfPage(bounds.left, bounds.width, event.clientX);
          if (side === 'left' && page > 1) turnPage(-1);
          if (side === 'right' && page < pageCount) turnPage(1);
        }}
        onKeyDown={(event) => {
          if (!pageCount) return;
          if (event.key === 'ArrowLeft' && page > 1) { event.preventDefault(); turnPage(-1); }
          if (event.key === 'ArrowRight' && page < pageCount) { event.preventDefault(); turnPage(1); }
        }}
      >
        <canvas ref={canvasRef} aria-label={`${t('sourcePage')} ${page}`} />
        <div className="pdf-book-highlights" ref={highlightRef} aria-hidden="true" />
      </div>
    </div>
  </section>;
}
