import QRCode from 'qrcode'

/** Genera un QR (data URL PNG) que codifica el codigo interno del activo. */
export async function generateAssetQrDataUrl(assetCode: string): Promise<string> {
  return QRCode.toDataURL(assetCode, { width: 240, margin: 1 })
}
