import { useState, useEffect, useRef, useCallback, memo } from 'react';
import type { WheelEvent } from 'react';
import { createPortal } from 'react-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { motion } from 'framer-motion';
import { X, Download, Loader2, Plus, Minus } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const observerOptions = { rootMargin: '200px' };
const pixelRatio = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1;

function useIntersectionObserver(options: IntersectionObserverInit) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        observer.disconnect();
      }
    }, options);
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [options]);
  return [ref, isIntersecting] as const;
}

const LazyPage = memo(({ pageNumber, width, scale, aspectRatio }: { pageNumber: number, width: number, scale: number, aspectRatio: number }) => {
  const [ref, inView] = useIntersectionObserver(observerOptions);
  const [hasRendered, setHasRendered] = useState(false);
  
  const finalWidth = width * scale;
  const finalHeight = finalWidth * aspectRatio;

  return (
    <div 
      ref={ref} 
      data-page={pageNumber}
      className="pdf-page-wrapper flex justify-center w-full shrink-0 relative" 
      style={{ height: finalHeight, minHeight: finalHeight, width: finalWidth, flexShrink: 0, overflow: 'hidden' }}
    >
      {inView && (
        <Page 
          pageNumber={pageNumber} 
          width={width} 
          scale={scale} 
          renderAnnotationLayer={false}
          renderTextLayer={false}
          devicePixelRatio={pixelRatio}
          className="border border-white/10"
          onRenderSuccess={() => setHasRendered(true)}
          loading={<div style={{ width: finalWidth, height: finalHeight }} />}
        />
      )}
      {!hasRendered && (
        <div 
          className="bg-white/5 absolute inset-0" 
          style={{ width: finalWidth, height: finalHeight }} 
        />
      )}
    </div>
  );
});

export default function PdfViewer({ fileUrl, title, onClose }: { fileUrl: string, title: string, onClose: () => void }) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [pdfWidth, setPdfWidth] = useState(() => Math.min(window.innerWidth - 40, 1000));
  const [scale, setScale] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPill, setShowPill] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const pillTimeoutRef = useRef<any>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!numPages) setTimedOut(true);
    }, 15000);
    return () => clearTimeout(timer);
  }, [numPages]);

  useEffect(() => {
    let timeoutId: any;
    let lastWidth = window.innerWidth;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (Math.abs(window.innerWidth - lastWidth) >= 100) {
          lastWidth = window.innerWidth;
          setPdfWidth(Math.min(lastWidth - 40, 1000));
        }
      }, 300);
    };
    
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); clearTimeout(timeoutId); };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !numPages) return;
    const observer = new IntersectionObserver((entries) => {
      let maxRatio = 0;
      let page = currentPage;
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio;
          page = Number(entry.target.getAttribute('data-page'));
        }
      });
      if (maxRatio > 0) {
         setCurrentPage(prev => prev !== page ? page : prev);
      }
    }, { root: containerRef.current, threshold: [0, 0.1, 0.5, 1] });

    const pages = containerRef.current.querySelectorAll('.pdf-page-wrapper');
    pages.forEach(p => observer.observe(p));

    return () => observer.disconnect();
  }, [numPages, scale, pdfWidth]);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      setScale(prev => Math.min(Math.max(prev - e.deltaY * 0.01, 0.5), 3));
    }
  }, []);

  const handleLoadSuccess = useCallback((pdf: PDFDocumentProxy) => {
    setNumPages(pdf.numPages);
    pdf.getPage(1).then((page: any) => {
      const viewport = page.getViewport({ scale: 1 });
      setAspectRatio(viewport.height / viewport.width);
    });
  }, []);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  const handleScroll = useCallback(() => {
    setShowPill(true);
    if (pillTimeoutRef.current) clearTimeout(pillTimeoutRef.current);
    pillTimeoutRef.current = setTimeout(() => setShowPill(false), 1500);
  }, []);

  useEffect(() => {
    handleScroll();
    return () => clearTimeout(pillTimeoutRef.current);
  }, [handleScroll]);

  const ready = aspectRatio !== null;
  
  const content = (
    <motion.div 
      initial={{ y: '100%', opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }} 
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[9999] bg-[#1A1A1A] flex flex-col h-[100dvh]"
    >
      <div className="flex items-center justify-between p-3 md:p-4 bg-surface-dark border-b border-white/10 shrink-0 z-10">
        <button onClick={onClose} className="p-2 text-white/70 hover:text-white transition">
          <X size={24} />
        </button>
        <h2 className="font-semibold text-[15px] truncate flex-1 mx-4 text-center text-white">{title}</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setScale(prev => Math.max(prev - 0.25, 0.5))} className="p-2 text-white/70 hover:text-white transition hidden md:block"><Minus size={20} /></button>
          <button onClick={() => setScale(prev => Math.min(prev + 0.25, 3))} className="p-2 text-white/70 hover:text-white transition hidden md:block"><Plus size={20} /></button>
          <a href={fileUrl} target="_blank" rel="noreferrer" className="p-2 text-white/70 hover:text-white transition">
            <Download size={22} />
          </a>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center py-6 gap-3 bg-[#1A1A1A] relative"
        style={{ scrollbarGutter: 'stable', overflowAnchor: 'none' }}
        onWheel={handleWheel} 
        onScroll={handleScroll}
      >
        {error || timedOut ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <p className="text-white/70 mb-4">Sorry, we couldn't load the preview.</p>
            <a href={fileUrl} target="_blank" rel="noreferrer" className="bg-brand-primary text-black font-semibold px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-brand-primaryHover transition">
              <Download size={18} /> Download PDF
            </a>
          </div>
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={handleLoadSuccess}
            onLoadError={handleError}
            loading={
              <div className="flex flex-col items-center justify-center mt-20">
                <Loader2 className="animate-spin text-brand-primary mb-4" size={32} />
                <p className="text-white/50 text-sm">Loading document...</p>
              </div>
            }
          >
            {ready && numPages && Array.from(new Array(numPages), (_, index) => (
              <LazyPage 
                key={`page_${index + 1}`} 
                pageNumber={index + 1} 
                width={pdfWidth} 
                scale={scale} 
                aspectRatio={aspectRatio!}
              />
            ))}
          </Document>
        )}
      </div>
      
      {numPages && (
        <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-2 rounded-full text-white text-xs font-semibold pointer-events-none z-10 transition-opacity duration-300 ${showPill ? 'opacity-100' : 'opacity-0'}`}>
          {currentPage} / {numPages}
        </div>
      )}
    </motion.div>
  );

  return createPortal(content, document.body);
}
