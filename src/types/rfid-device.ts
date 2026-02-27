export interface RfidDevice {
  id: string
  serialNumber: string
  name: string
  companyId: string
  siteId: string
  siteName: string
  isOnline: boolean
  lastPingAt: string
}
