import React, { useMemo } from 'react';
import { ChevronLeft, Printer, Share2, Download } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

import { Worker, Viewer } from '@react-pdf-viewer/core';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import { thumbnailPlugin } from '@react-pdf-viewer/thumbnail';
import { toolbarPlugin } from '@react-pdf-viewer/toolbar';
import { printPlugin } from '@react-pdf-viewer/print';
import { getFilePlugin } from '@react-pdf-viewer/get-file';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/thumbnail/lib/styles/index.css';
import '@react-pdf-viewer/toolbar/lib/styles/index.css';

const DocumentDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // read url + name from router state or from query
  const passed = location.state || {};
  const pdfUrl = passed.url || searchParams.get('url') || '';
  const pdfName = passed.name || searchParams.get('name') || 'Document.pdf';

  // Plugins
  const pageNav = pageNavigationPlugin();
  const { CurrentPageLabel, GoToNextPage, GoToPreviousPage, NumberOfPages } = pageNav;

  const thumbs = thumbnailPlugin();
  const { Thumbnails } = thumbs;

  const print = printPlugin();
  const { Print } = print;

  const getFile = getFilePlugin({
    fileNameGenerator: () => pdfName,
  });
  const { DownloadButton } = getFile;

  const toolbar = toolbarPlugin();
  const { Toolbar } = toolbar;

  // pdf.js worker (fixed version string; no TS casts)
  const workerUrl = useMemo(
    () => 'https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.js',
    []
  );

  const onShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: pdfName, url: pdfUrl, text: pdfName });
      } else {
        await navigator.clipboard.writeText(pdfUrl);
        alert('Link copied to clipboard');
      }
    } catch (e) {
      // ignore
    }
  };

  if (!pdfUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-600">No PDF URL provided.</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white font-inter">
      {/* Top bar */}
      <div className="w-full h-[94px] bg-[#FDFDFD] drop-shadow-lg drop-shadow-[#18171740] flex justify-between items-center pr-5">
        <div className="flex gap-x-4 items-center">
          <ChevronLeft size={60} onClick={() => navigate(-1)} className="cursor-pointer" />
          <p className="font-semibold text-[20px] md:text-[24px] text-[#282D30] line-clamp-1 max-w-[60vw]">
            {pdfName}
          </p>
        </div>

        {/* Print / Share / Download wired to plugins via render-props */}
        <div className="flex gap-x-3 md:gap-x-5">
          <DownloadButton>
            {(props) => (
              <button
                className="w-[97px] h-[70px] bg-[#36D7A0] rounded-[10px] flex justify-center items-center"
                title="Download"
                onClick={props.onClick}
              >
                <Download color="white" size={30} />
              </button>
            )}
          </DownloadButton>

          <button
            className="w-[97px] h-[70px] bg-[#FB8C5C] rounded-[10px] flex justify-center items-center"
            onClick={onShare}
            title="Share"
          >
            <Share2 color="white" size={30} />
          </button>

          <Print>
            {(props) => (
              <button
                className="w-[97px] h-[70px] bg-[#50B7FF] rounded-[10px] flex justify-center items-center"
                title="Print"
                onClick={props.onClick}
              >
                <Printer color="white" size={30} />
              </button>
            )}
          </Print>
        </div>
      </div>

      {/* Viewer area */}
      <div className="w-full relative portrait:h-[90%] landscape:h-[85%] overflow-hidden">
        {/* Left thumbnails column */}
        <div className="hidden md:block w-[280px] h-full overflow-y-auto float-left px-4 py-5">
          <Thumbnails />
        </div>

        {/* Floating pagination overlay */}
        <div className="absolute right-6 top-6 z-20">
          <div className="bg-white/90 backdrop-blur border rounded-xl shadow px-3 py-2 flex items-center gap-2">
            <GoToPreviousPage>
              {(props) => (
                <button
                  className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    props.onClick();
                  }}
                  disabled={props.isDisabled}
                  title="Previous page"
                >
                  ‹
                </button>
              )}
            </GoToPreviousPage>

            <span className="text-sm text-gray-800">
              <CurrentPageLabel /> / <NumberOfPages />
            </span>

            <GoToNextPage>
              {(props) => (
                <button
                  className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    props.onClick();
                  }}
                  disabled={props.isDisabled}
                  title="Next page"
                >
                  ›
                </button>
              )}
            </GoToNextPage>
          </div>
        </div>

        {/* Main viewer */}
        <div className="md:ml-[280px] h-full overflow-y-auto">
          {/* Optional: full toolbar (search, zoom, rotate, etc.) */}
          <div className="sticky top-0 z-10 bg-white border-b">
            <Toolbar />
          </div>

          <div className="h-[calc(100%-48px)]">
            <Worker workerUrl={workerUrl}>
              <Viewer
                fileUrl={pdfUrl}
                plugins={[pageNav, thumbs, toolbar, print, getFile]}
                defaultScale={1.1}
              />
            </Worker>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetails;