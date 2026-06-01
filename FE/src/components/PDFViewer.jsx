import { useState, useRef } from 'react';
import { X, ZoomIn, ZoomOut, Download, Maximize2 } from 'lucide-react';

export default function PDFViewer({ attachment, onClose }) {
    const [scale, setScale] = useState(1.0);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    const handleZoomIn = () => {
        setScale(prev => Math.min(prev + 0.25, 3.0));
    };

    const handleZoomOut = () => {
        setScale(prev => Math.max(prev - 0.25, 0.5));
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = attachment.url;
        link.download = attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFullscreen = () => {
        window.open(attachment.url, '_blank');
    };

    const handleMouseDown = (e) => {
        // Only start dragging if clicking on the container, not on buttons or other interactive elements
        if (e.target === containerRef.current || containerRef.current?.contains(e.target)) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-red-50 to-pink-50">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center shadow-sm">
                            <svg className="w-7 h-7 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                                <path d="M14 2v6h6" />
                                <path d="M9 13h6" />
                                <path d="M9 17h6" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{attachment.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">PDF Document • {attachment.size}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors p-2 hover:bg-white dark:bg-slate-900 rounded-lg"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleZoomOut}
                            className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-white dark:bg-slate-900 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={scale <= 0.5}
                            aria-label="Zoom out"
                        >
                            <ZoomOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Zoom Out</span>
                        </button>
                        <span className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg min-w-[80px] text-center">
                            {Math.round(scale * 100)}%
                        </span>
                        <button
                            onClick={handleZoomIn}
                            className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-white dark:bg-slate-900 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={scale >= 3.0}
                            aria-label="Zoom in"
                        >
                            <ZoomIn className="w-4 h-4" />
                            <span className="hidden sm:inline">Zoom In</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleFullscreen}
                            className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 transition-all flex items-center gap-1.5"
                            aria-label="Open in new tab"
                        >
                            <Maximize2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Full Screen</span>
                        </button>
                        <button
                            onClick={handleDownload}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm"
                            aria-label="Download PDF"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                        </button>
                    </div>
                </div>

                {/* PDF Content */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-auto bg-gray-100 dark:bg-slate-800 p-6"
                    style={{
                        cursor: isDragging ? 'grabbing' : 'grab',
                        userSelect: 'none'
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="flex justify-center min-h-full">
                        <div
                            className="bg-white dark:bg-slate-900 shadow-2xl rounded-lg overflow-hidden transition-transform duration-200"
                            style={{
                                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                transformOrigin: 'top center',
                                width: '100%',
                                maxWidth: '900px'
                            }}
                        >
                            <embed
                                src={`${attachment.url}#toolbar=0&navpanes=0&scrollbar=1`}
                                type="application/pdf"
                                className="w-full h-[800px]"
                                title={attachment.name}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
