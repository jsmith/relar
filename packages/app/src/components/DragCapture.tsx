import React, { useState } from "react";
import { FiMusic } from "react-icons/fi";
import AriaModal from "react-aria-modal";

export interface DragCaptureProps {
  children?: React.ReactNode;
  className?: string;
  display: boolean;
  setDisplay: (display: boolean) => void;
}

export const DragCapture = ({ children, className, display, setDisplay }: DragCaptureProps) => {
  return (
    <div
      className={className}
      onDragOver={(e) => {
        e.preventDefault();
        // console.log(
        //   "onDragOver",
        //   e.dataTransfer.files.length,
        //   e.dataTransfer.files[0],
        // );
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDisplay(false);
        // console.log(
        //   "onDrop",
        //   e.dataTransfer.files.length,
        //   e.dataTransfer.files[0].type,
        // );
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        setDisplay(true);
        // console.log(
        //   "onDragEnter",
        //   e.dataTransfer.files.length,
        //   // e.dataTransfer.files[0].type,
        // );
      }}
    >
      {children}
      {display && (
        <AriaModal
          titleText="Upload Music to Library"
          onExit={() => setDisplay(false)}
          initialFocus="#upload-music-button"
          getApplicationNode={() => document.getElementById("root")!}
          underlayStyle={{ paddingTop: "2em" }}
          dialogClass="absolute inset-0 m-8 rounded-lg bg-primary-100 z-10 p-5"
        >
          {/* https://tailwindcomponents.com/component/file-upload-with-drop-on-and-preview */}
          {/* https://tailwindui.com/components/application-ui/overlays/modals */}
          <div className="border-2 border-dashed border-gray-400 h-full rounded p-1">
            <div className="flex items-center justify-center flex-col h-full">
              <FiMusic className="w-20 h-20 text-primary-600" />
              <h1 className="text-primary-800 text-2xl" id="modal-headline">
                Upload Your Music!
              </h1>
              <div className="text-primary-800 text-xm">
                Drag files or a folder to add them to your library.
              </div>
              <div className="text-primary-800 text-xm mt-8">or...</div>
              <button
                id="upload-music-button"
                className="border-2 border-primary-700 text-primary-700 p-2 mt-2 rounded"
              >
                SELECT FROM YOUR COMPUTER
              </button>
            </div>
          </div>
          {/* <div id="demo-one-modal" className="modal">
            <div className="modal-body">
              <p>
                Here is a modal
                {' '}
                <a href="#">with</a>
                {' '}
                <a href="#">some</a>
                {' '}
                <a href="#">focusable</a>
                {' '}
                parts.
              </p>
            </div>
            <footer className="modal-footer">
              <button id="demo-one-deactivate" onClick={this.deactivateModal}>
                deactivate modal
              </button>
            </footer>
          </div> */}
        </AriaModal>
        // <div
        //   className="absolute inset-0 m-5 rounded-lg bg-primary-100 z-10 p-5"
        //   role="dialog"
        //   aria-modal="true"
        //   aria-labelledby="modal-headline"
        // >

        // </div>
      )}
    </div>
  );
};
