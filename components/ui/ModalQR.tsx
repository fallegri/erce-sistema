'use client'

import { QRCodeSVG } from 'qrcode.react'

interface MuestraQR {
  id_unico: string
  nombre_muestra: string
  pertenece_a: string
  fecha_erce: string
  funcionario_entrega: string
}

interface Props {
  muestras: MuestraQR[]
  onClose: () => void
}

export default function ModalQR({ muestras, onClose }: Props) {
  const handlePrint = () => window.print()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-3xl max-h-[90vh] flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Códigos QR generados
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {muestras.length} muestra{muestras.length !== 1 ? 's' : ''} registrada{muestras.length !== 1 ? 's' : ''} exitosamente
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-secondary text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* QR Grid */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-2 gap-4 print:grid-cols-3">
            {muestras.map((m) => {
              const qrData = JSON.stringify({
                id: m.id_unico,
                fecha_erce: m.fecha_erce,
                funcionario: m.funcionario_entrega,
              })

              return (
                <div
                  key={m.id_unico}
                  className="border border-slate-200 rounded-xl p-5 flex flex-col items-center text-center gap-3 hover:border-brand-300 transition-colors"
                >
                  <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <QRCodeSVG
                      value={qrData}
                      size={140}
                      level="M"
                      bgColor="#ffffff"
                      fgColor="#0F1623"
                    />
                  </div>
                  <div className="w-full">
                    <p className="text-xs font-mono text-brand-600 bg-brand-50 rounded-md px-2 py-1 mb-2 break-all">
                      {m.id_unico}
                    </p>
                    <p className="text-sm font-semibold text-slate-800 leading-tight">
                      {m.nombre_muestra}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{m.pertenece_a}</p>
                    <p className="text-xs text-slate-400 mt-1">ERCE: {m.fecha_erce}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="btn-primary">
            Finalizar
          </button>
        </div>
      </div>
    </div>
  )
}
