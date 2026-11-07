import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { motion } from 'framer-motion';
import { X, Download, Loader2, Plus, Minus } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const observerOptions = { rootMargin: '400px' };
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

const LazyPage = memo(({ pageNumber, width, scale, aspectRatio }: { pageNumber: number, width: number, scale: number, aspectRatio: number | null }) => {
  const [ref, inView] = useIntersectionObserver(observerOptions);
  const height = width * scale * (aspectRatio || 1.414);

  useEffect(() => {
    if (inView) console.log(`Page ${pageNumber} rendered`);
  }, [inView, pageNumber]);

  return (
    <div ref={ref} className="flex justify-center w-full" style={{ height: inView ? 'auto' : height }}>
      {inView ? (
        <Page 
          pageNumber={pageNumber} 
          width={width} 
          scale={scale} 
          renderAnnotationLayer={false}
          renderTextLayer={false}
          devicePixelRatio={pixelRatio}
          className="shadow-2xl bg-white"
        />
      ) : (
        <div className="bg-white/10 animate-pulse rounded-lg" style={{ width: width * scale, height: height }} />
      )}
    </div>
  );
});

export default function PdfViewer({ fileUrl, title, onClose }: { fileUrl: string, title: string, onClose: () => void }) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number>();
  const [scale, setScale] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    console.log('PdfViewer MOUNTED');
    return () => console.log('PdfViewer UNMOUNTED');
  }, []);

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
    const el = containerRef.current;
    if (!el) return;
    let timeoutId: any;
    
    const observer = new ResizeObserver(entries => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const newWidth = entries[0].contentRect.width;
        if (newWidth > 0) {
          setContainerWidth(prev => {
            if (!prev || Math.abs(prev - newWidth) >= 4) {
              console.log(`width changed to ${newWidth}`);
              return newWidth;
            }
            return prev;
          });
        }
      }, 150);
    });
    
    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(timeoutId); };
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      setScale(prev => Math.min(Math.max(prev - e.deltaY * 0.01, 0.5), 3));
    }
  }, []);

  const handleLoadSuccess = useCallback((pdf: PDFDocumentProxy) => {
    console.log('Document loaded');
    setNumPages(pdf.numPages);
    pdf.getPage(1).then((page: any) => {
      const viewport = page.getViewport({ scale: 1 });
      setAspectRatio(viewport.height / viewport.width);
    });
  }, []);

  const handleError = useCallback((err: any) => {
    console.error("PDF Load Error:", err);
    setError(true);
  }, []);

  const basePdfWidth = containerWidth ? Math.min(containerWidth - 24, 1000) : 300;
  
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

      <div ref={containerRef} onWheel={handleWheel} className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center py-6 gap-3 bg-[#1A1A1A] relative">
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
            {numPages && Array.from(new Array(numPages), (_, index) => (
              <LazyPage 
                key={`page_${index + 1}`} 
                pageNumber={index + 1} 
                width={basePdfWidth} 
                scale={scale} 
                aspectRatio={aspectRatio}
              />
            ))}
          </Document>
        )}
      </div>
      
      {numPages && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-semibold pointer-events-none z-10">
          Scroll to read &bull; {numPages} pages
        </div>
      )}
    </motion.div>
  );

  return createPortal(content, document.body);
}
