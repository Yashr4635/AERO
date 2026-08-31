import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export function TrackAmbulance() {
  const { id } = useParams();
  const [eta, setEta] = useState(8);

  useEffect(() => {
    const timer = setInterval(() => {
      setEta((prev) => Math.max(1, prev - 1));
    }, 60000); // decrease ETA every minute just for prototype visual
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-dvh bg-[#F9FAFB] text-[#111827] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div>
          <h1 className="font-bold text-lg">Ambulance Dispatched</h1>
          <p className="text-sm text-[#4B5563]">ID: {id}</p>
        </div>
        <div className="bg-red-50 text-[#DC2626] font-bold px-3 py-1 rounded-full text-sm border border-red-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse"></span>
          EN ROUTE
        </div>
      </div>

      {/* Map Area placeholder */}
      <div className="flex-1 bg-[#E5E7EB] relative flex items-center justify-center overflow-hidden">
        {/* Placeholder for map */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#D1D5DB 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        {/* Fake ambulance marker for visual context */}
        <div className="absolute z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-[#DC2626]">
          <span className="text-xl">🚑</span>
        </div>
      </div>

      {/* Status Footer */}
      <div className="bg-white border-t border-[#E5E7EB] px-6 py-6 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-[#6B7280] text-sm font-medium mb-1">Estimated Arrival</p>
            <p className="text-4xl font-extrabold text-[#111827]">{eta} <span className="text-xl text-[#4B5563]">min</span></p>
          </div>
          <div className="text-right">
            <p className="text-[#6B7280] text-sm font-medium mb-1">Assigned Unit</p>
            <p className="font-bold">AERO-KA-01</p>
          </div>
        </div>
        
        <div className="w-full bg-[#F3F4F6] rounded-full h-2 mb-6 overflow-hidden">
          <div className="bg-[#DC2626] h-2 rounded-full transition-all duration-1000" style={{ width: '65%' }}></div>
        </div>

        <button 
          className="w-full bg-white border border-[#D1D5DB] text-[#374151] font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors"
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/share/${id}`);
            alert('Tracking link copied to clipboard!');
          }}
        >
          Share Live Tracking Link
        </button>
      </div>
    </div>
  );
}
