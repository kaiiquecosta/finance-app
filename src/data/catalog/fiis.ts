/**
 * FIIs — ranking Investidor10 (principais por patrimônio líquido).
 * Cotações via Yahoo (`TICKER11.SA`).
 */
import { brFii } from './helpers'

export const FIIS_CATALOG = [
  brFii('KNCR11', 'Kinea Rendimentos Imob.', ['papel']),
  brFii('HGLG11', 'Pátria Log', ['logistico']),
  brFii('BTLG11', 'BTG Pactual Logística', ['logistico']),
  brFii('KNIP11', 'Kinea Índice de Preços', ['papel']),
  brFii('XPML11', 'XP Malls', ['tijolo']),
  brFii('TRXF11', 'TRX Real Estate', ['hibrido']),
  brFii('XPLG11', 'XP Log', ['logistico']),
  brFii('KNRI11', 'Kinea Renda Imob.', ['hibrido']),
  brFii('MXRF11', 'Maxi Renda', ['papel', 'hibrido']),
  brFii('VISC11', 'Vinci Shopping Centers', ['tijolo']),
  brFii('CPTS11', 'Capitânia Securities II', ['papel']),
  brFii('KNHY11', 'Kinea High Yield CRI', ['papel']),
  brFii('HGRU11', 'Pátria Renda Urbana', ['hibrido']),
  brFii('HGBS11', 'Hedge Brasil Shopping', ['tijolo']),
  brFii('IRIM11', 'Iridium', ['hibrido']),
  brFii('PVBI11', 'VBI Prime Properties', ['tijolo']),
  brFii('GARE11', 'Guardian Real Estate', ['hibrido']),
  brFii('GGRC11', 'Zagros Renda Imob.', ['logistico']),
  brFii('RECR11', 'REC Recebíveis Imob.', ['papel']),
  brFii('HCTR11', 'Hectare CE', ['papel']),
  brFii('KNUQ11', 'Kinea Unique HY CDI', ['papel']),
  brFii('BRCR11', 'BTG Corporate Office', ['hibrido']),
  brFii('HSML11', 'HSI Malls', ['tijolo']),
  brFii('PMLL11', 'Genial Malls', ['tijolo']),
  brFii('BRCO11', 'Bresco Logística', ['logistico']),
  brFii('BTHF11', 'BTG Real Estate Hedge', ['papel']),
  brFii('KNHF11', 'Kinea Hedge Fund', ['hibrido']),
  brFii('LVBI11', 'VBI Logístico', ['logistico']),
  brFii('RZTR11', 'Riza Terrax', ['hibrido']),
  brFii('RBVA11', 'Rio Bravo Renda Varejo', ['hibrido']),
  brFii('KNSC11', 'Kinea Securities', ['papel']),
  brFii('ALZR11', 'Alianza Trust Renda', ['hibrido']),
  brFii('HGRE11', 'Pátria Escritórios', ['tijolo']),
  brFii('HFOF11', 'Hedge Top FOF', ['papel']),
  brFii('VILG11', 'Vinci Logística', ['logistico']),
  brFii('MCCI11', 'Mauá Capital Recebíveis', ['papel']),
  brFii('HGCR11', 'CSHG Recebíveis Imob.', ['papel']),
  brFii('RBRR11', 'RBR Rendimento High Grade', ['papel']),
  brFii('VGIR11', 'Valora RE III', ['papel']),
  brFii('HSLG11', 'HSI Logística', ['logistico']),
  brFii('VRTA11', 'Fator Verita', ['papel']),
  brFii('RBRY11', 'RBR Private Crédito Imob.', ['papel']),
  brFii('VGIP11', 'Valora CRI IPCA', ['papel']),
  brFii('MCRE11', 'Mauá Capital Real Estate', ['papel']),
  brFii('DEVA11', 'Devant Recebíveis', ['papel']),
  brFii('VGHF11', 'Valora Hedge', ['papel']),
  brFii('JSRE11', 'JS Real Estate', ['hibrido']),
  brFii('RBRX11', 'Pátria Plus Multi RE', ['papel']),
  brFii('GTWR11', 'Green Towers', ['tijolo']),
  brFii('CPSH11', 'Shoppings AAA', ['tijolo']),
  brFii('BROF11', 'BRPR Corporate Offices', ['hibrido']),
  brFii('TVRI11', 'Tivio Renda Imob.', ['tijolo']),
  brFii('PCIP11', 'Pátria Crédito IPCA', ['papel']),
  brFii('VCJR11', 'Vectis Juros Real', ['papel']),
  brFii('PSEC11', 'VBI REITs FOF', ['papel']),
  brFii('KDIF11', 'Kinea FI-Infra', ['infra']),
  brFii('CDII11', 'Sparta Infra CDI', ['infra']),
  brFii('JURO11', 'Sparta Infra', ['infra']),
  brFii('IFRA11', 'Itaú FI Infra RF', ['infra']),
  brFii('BDIF11', 'BTG Dívida Infra', ['infra']),
  brFii('CPTI11', 'Capitânia Infra', ['infra']),
  brFii('IFRI11', 'Itaú FI Infra CDI', ['infra']),
  brFii('KNCA11', 'Kinea Crédito Agro', ['papel']),
  brFii('RURA11', 'Itaú Asset Rural Fiagro', ['papel']),
  brFii('GSFI11', 'General Shopping', ['tijolo']),
  brFii('KORE11', 'Kinea Oportunidades RE', ['tijolo']),
  brFii('TGAR11', 'TG Ativo Real', ['hibrido']),
  brFii('GZIT11', 'Gazit Malls', ['hibrido']),
  brFii('MCLO11', 'Mauá Capital Logística', ['logistico']),
  brFii('URPR11', 'Urca Prime Renda', ['papel']),
]

export const FIIS_CATALOG_UNIQUE = (() => {
  const seen = new Set<string>()
  return FIIS_CATALOG.filter((d) => {
    if (seen.has(d.yahoo)) return false
    seen.add(d.yahoo)
    return true
  })
})()
