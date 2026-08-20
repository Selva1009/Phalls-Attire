'use client';
import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePad = ({ onSave }) => {
  const sigRef = useRef();

  const handleSave = () => {
    const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div>
      <SignatureCanvas
        ref={sigRef}
        penColor="black"
        canvasProps={{ width: 400, height: 150, className: 'border' }}
      />
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onSave ? () => onSave(null) : undefined}
          className="px-4 py-2 bg-gray-300 text-black rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Save Signature
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;
