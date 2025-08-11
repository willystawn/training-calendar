
import React, { useState } from 'react';
import { toPng } from 'html-to-image';

interface DownloadButtonProps {
    elementRef: React.RefObject<HTMLDivElement>;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ elementRef }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleDownloadImage = async () => {
        const element = elementRef.current;
        if (!element) {
            console.error("Download failed: element not found.");
            return;
        }

        setIsLoading(true);

        try {
            // Ensure fonts are loaded to prevent text rendering issues
            await document.fonts.ready;

            const dataUrl = await toPng(element, {
                backgroundColor: '#FFF9F2', // Match body bg
                pixelRatio: 2, // Use higher resolution for better quality
                width: element.scrollWidth,
                height: element.scrollHeight,
                // The html-to-image library is generally better at handling styles,
                // so the onclone hack is often not needed.
            });
            
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'training-schedule.png';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Oops, something went wrong!', error);
            alert('Failed to generate image. Please check the console for more details.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleDownloadImage}
            disabled={isLoading}
            className="flex items-center gap-3 bg-green-500 text-white font-bold py-3 px-6 rounded-xl border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:bg-green-600 active:bg-green-700 active:shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] transition-all duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
            {isLoading ? (
               <>
                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 Generating...
               </>
            ) : (
                <>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-download">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download Image
                </>
            )}
        </button>
    );
};

export default DownloadButton;