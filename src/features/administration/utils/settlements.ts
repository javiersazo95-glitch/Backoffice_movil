import type { Order, Settlement, SettlementStatus, Withdrawal } from '@/types/administration';
import { PARTNERS } from './constants';

export function isWithinRange(dateValue: string, start: string, end: string): boolean {
  if (!dateValue) return false;
  if (start && dateValue < start) return false;
  if (end && dateValue > end) return false;
  return true;
}

function getSettlementId(orderId: string): string {
  return `LQ-${orderId.replace(/^PED-/, '')}`;
}

/** Deriva las liquidaciones (comisión de servicio por pedido) a partir de pedidos Finalizados. */
export function getSettlements(orders: Order[], statuses: Record<string, SettlementStatus>): Settlement[] {
  return orders
    .filter((order) => order.status === 'Finalizado')
    .map((order) => {
      const subtotal = Number(order.subtotalPublicado ?? order.total);
      const saleTotal = Number(order.total ?? subtotal);
      const serviceCommission = Number(order.comisionServicio ?? 0);
      const serviceCommissionRate = Number(
        order.comisionServicioPorcentaje ??
          (order.sellerFounder ? 0.05 : subtotal > 250000 ? 0.05 : subtotal > 100000 ? 0.07 : 0.1),
      );
      const serviceCommissionIva = Number(order.ivaComisionServicio ?? 0);
      const gatewayFeeSeller = Number(order.comisionPagoFlowVendedor ?? 0);
      const gatewayFeeRepuestop = Number(order.comisionPagoFlowRepuestop ?? 0);
      const grossEarnings = Number(order.descuentosVendedor ?? serviceCommission + serviceCommissionIva + gatewayFeeSeller);
      const netSettlement = Number(order.liquidacionServicio ?? serviceCommission + serviceCommissionIva);
      const paidAmount = subtotal - grossEarnings;
      const sellerPayout = Number(order.montoPagarVendedor ?? paidAmount);
      const settlementId = getSettlementId(order.id);
      return {
        id: settlementId,
        date: order.date.slice(0, 10),
        seller: order.seller,
        sellerFounder: order.sellerFounder,
        sellerTaxId: order.sellerTaxId,
        sellerLegalName: order.sellerLegalName,
        sellerEmail: order.sellerEmail,
        orderId: order.id,
        saleTotal,
        saleDetail: order.totalVentaDetalle ?? {
          'Valor publicado por el vendedor': subtotal,
          'Costo de despacho': Number(order.costoEnvio ?? 0),
        },
        saleTooltip: order.totalVentaTooltip,
        commission: grossEarnings,
        serviceCommission,
        serviceCommissionRate,
        serviceCommissionIva,
        gatewayFeeSeller,
        gatewayFeeRepuestop,
        gatewayTooltip: order.comisionPagoTooltip,
        netSettlement,
        sellerPayout,
        liquidationStatus: order.estadoLiquidacion ?? 'PENDIENTE_LIQUIDACION',
        paidAmount,
        status: statuses[settlementId] ?? 'Completada',
      };
    });
}

export function getCashAllocation(totalCommission: number): { cashFund: number; withdrawalAvailable: number } {
  const cashFund = Math.round(totalCommission * 0.7);
  return { cashFund, withdrawalAvailable: totalCommission - cashFund };
}

export function getExpenseTotal(source: { amount: number }[]): number {
  return source.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
}

export function getPartnerBalances(
  withdrawals: Withdrawal[],
  partnerPool: number,
  start: string,
  end: string,
): Record<string, number> {
  const partnerShare = Math.floor(partnerPool / PARTNERS.length);
  return Object.fromEntries(
    PARTNERS.map((partner) => {
      const withdrawn = withdrawals
        .filter((withdrawal) => withdrawal.type === 'partner' && withdrawal.beneficiary === partner && isWithinRange(withdrawal.date, start, end))
        .reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0);
      return [partner, partnerShare - withdrawn];
    }),
  );
}
