/** Ciclo de pago jueves-a-miércoles usado por Administración Contable para agrupar retiros pendientes. */
export function getCurrentCycleRange() {
  const today = new Date();
  const day = today.getDay();

  const start = new Date(today);
  const diffToThursday = day >= 4 ? day - 4 : day + 3;
  start.setDate(today.getDate() - diffToThursday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}
