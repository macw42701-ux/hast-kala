import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { TrendingUp } from 'lucide-react';
import { Language, Order } from '../types';
import { t } from '../i18n/translations';

interface SpendingTrendsChartProps {
  orders: Order[];
  lang: Language;
}

interface MonthlySpendPoint {
  key: string;
  monthLabel: string;
  fullLabel: string;
  total: number;
  orderCount: number;
}

function resolveOrderDate(order: Order): Date | null {
  const raw = order.createdAt as
    | { toDate?: () => Date; seconds?: number }
    | string
    | number
    | Date
    | undefined;

  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw;
  }
  if (raw && typeof raw === 'object') {
    if ('toDate' in raw && typeof raw.toDate === 'function') {
      const d = raw.toDate();
      if (!Number.isNaN(d.getTime())) return d;
    }
    if ('seconds' in raw && typeof raw.seconds === 'number') {
      const d = new Date(raw.seconds * 1000);
      if (!Number.isNaN(d.getTime())) return d;
    }
  }
  if (typeof raw === 'string' || typeof raw === 'number') {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }

  const firstHistoryTs = order.statusHistory?.[0]?.timestamp;
  if (firstHistoryTs) {
    const d = new Date(firstHistoryTs);
    if (!Number.isNaN(d.getTime())) return d;
  }

  return null;
}

function formatCompactInr(val: number): string {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
  return `₹${val}`;
}

export const SpendingTrendsChart: React.FC<SpendingTrendsChartProps> = ({ orders, lang }) => {
  const copy = t(lang);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [chartWidth, setChartWidth] = useState(640);
  const [activeMonth, setActiveMonth] = useState<MonthlySpendPoint | null>(null);

  const monthlyData = useMemo<MonthlySpendPoint[]>(() => {
    const now = new Date();
    const locale = lang === 'gu' ? 'gu-IN' : 'en-IN';
    const shortFmt = new Intl.DateTimeFormat(locale, { month: 'short' });
    const fullFmt = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });

    const buckets: MonthlySpendPoint[] = [];
    const bucketMap = new Map<string, MonthlySpendPoint>();

    for (let offset = 5; offset >= 0; offset--) {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const point: MonthlySpendPoint = {
        key,
        monthLabel: shortFmt.format(d),
        fullLabel: fullFmt.format(d),
        total: 0,
        orderCount: 0,
      };
      buckets.push(point);
      bucketMap.set(key, point);
    }

    for (const order of orders) {
      if (order.status === 'Cancelled') continue;
      const orderDate = resolveOrderDate(order);
      if (!orderDate) continue;
      const key = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      const target = bucketMap.get(key);
      if (target) {
        target.total += Number(order.totalAmount) || 0;
        target.orderCount += 1;
      }
    }

    return buckets;
  }, [orders, lang]);

  const sixMonthTotal = useMemo(
    () => monthlyData.reduce((sum, item) => sum + item.total, 0),
    [monthlyData],
  );
  const monthlyAvg = Math.round(sixMonthTotal / 6);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const next = Math.max(280, Math.floor(el.clientWidth));
      setChartWidth(next);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svgNode = svgRef.current;
    if (!svgNode) return;

    const height = 240;
    const margin = { top: 24, right: 16, bottom: 32, left: 54 };
    const innerWidth = Math.max(180, chartWidth - margin.left - margin.right);
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgNode);
    svg.selectAll('*').remove();
    svg
      .attr('width', chartWidth)
      .attr('height', height)
      .attr('viewBox', `0 0 ${chartWidth} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const maxSpend = d3.max(monthlyData, (d) => d.total) ?? 0;
    const yMax = maxSpend > 0 ? Math.ceil((maxSpend * 1.2) / 500) * 500 : 5000;

    const x = d3
      .scaleBand<string>()
      .domain(monthlyData.map((d) => d.key))
      .range([0, innerWidth])
      .padding(0.36);

    const y = d3.scaleLinear().domain([0, yMax]).nice(4).range([innerHeight, 0]);

    // Horizontal dashed gridlines
    const gridAxis = d3
      .axisLeft(y)
      .ticks(4)
      .tickSize(-innerWidth)
      .tickFormat(() => '');

    g.append('g')
      .attr('class', 'grid')
      .call(gridAxis)
      .call((grid) => grid.select('.domain').remove())
      .call((grid) =>
        grid
          .selectAll('line')
          .attr('stroke', '#E5E1D8')
          .attr('stroke-dasharray', '3,3'),
      );

    // Y-axis
    const yAxis = d3
      .axisLeft(y)
      .ticks(4)
      .tickFormat((val) => formatCompactInr(Number(val)));

    g.append('g')
      .call(yAxis)
      .call((axis) => axis.select('.domain').remove())
      .call((axis) => axis.selectAll('line').remove())
      .call((axis) =>
        axis
          .selectAll('text')
          .attr('fill', '#66615B')
          .attr('font-size', '11px')
          .style('font-variant-numeric', 'tabular-nums'),
      );

    // X-axis
    const labelMap = new Map(monthlyData.map((d) => [d.key, d.monthLabel]));
    const xAxis = d3
      .axisBottom(x)
      .tickSizeOuter(0)
      .tickFormat((key) => labelMap.get(String(key)) || String(key));

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((axis) => axis.select('.domain').attr('stroke', '#E5E1D8'))
      .call((axis) => axis.selectAll('line').remove())
      .call((axis) =>
        axis
          .selectAll('text')
          .attr('fill', '#1C1B19')
          .attr('font-size', '11px')
          .attr('font-weight', '500'),
      );

    // Bars
    const barWidth = Math.min(44, x.bandwidth());
    const barOffset = (x.bandwidth() - barWidth) / 2;

    g.selectAll('.spend-bar')
      .data(monthlyData)
      .enter()
      .append('rect')
      .attr('class', 'spend-bar')
      .attr('x', (d) => (x(d.key) ?? 0) + barOffset)
      .attr('y', (d) => (d.total > 0 ? y(d.total) : innerHeight - 2))
      .attr('width', barWidth)
      .attr('height', (d) => (d.total > 0 ? Math.max(4, innerHeight - y(d.total)) : 2))
      .attr('rx', 6)
      .attr('fill', (d) => {
        if (activeMonth?.key === d.key) return '#B85D3B';
        return d.total > 0 ? '#1E3A5F' : '#E5E1D8';
      })
      .style('cursor', 'pointer')
      .on('mouseenter', (_event, d) => setActiveMonth(d))
      .on('click', (_event, d) => setActiveMonth(d));

    // Smooth trend line overlay when there is spend data
    if (maxSpend > 0) {
      const lineGen = d3
        .line<MonthlySpendPoint>()
        .x((d) => (x(d.key) ?? 0) + x.bandwidth() / 2)
        .y((d) => y(d.total))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(monthlyData)
        .attr('fill', 'none')
        .attr('stroke', '#B85D3B')
        .attr('stroke-width', 2)
        .attr('d', lineGen);

      g.selectAll('.spend-dot')
        .data(monthlyData)
        .enter()
        .append('circle')
        .attr('class', 'spend-dot')
        .attr('cx', (d) => (x(d.key) ?? 0) + x.bandwidth() / 2)
        .attr('cy', (d) => y(d.total))
        .attr('r', (d) => (activeMonth?.key === d.key ? 5 : 3.5))
        .attr('fill', '#FFFFFF')
        .attr('stroke', '#B85D3B')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseenter', (_event, d) => setActiveMonth(d))
        .on('click', (_event, d) => setActiveMonth(d));
    }

    // Direct currency labels above non-zero bars
    g.selectAll('.spend-label')
      .data(monthlyData.filter((d) => d.total > 0))
      .enter()
      .append('text')
      .attr('class', 'spend-label')
      .attr('x', (d) => (x(d.key) ?? 0) + x.bandwidth() / 2)
      .attr('y', (d) => y(d.total) - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', '#1C1B19')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .style('font-variant-numeric', 'tabular-nums')
      .text((d) => formatCompactInr(d.total));
  }, [monthlyData, chartWidth, activeMonth]);

  return (
    <div className="bg-white rounded-xl border border-[#E5E1D8] p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#1E3A5F]">
            <TrendingUp className="w-4 h-4" />
            <h2 className="font-display text-lg sm:text-xl font-semibold text-[#1C1B19]">
              {copy.spendingTrendsTitle}
            </h2>
          </div>
          <p className="text-xs text-[#66615B] mt-0.5">{copy.spendingTrendsSubtitle}</p>
        </div>

        <div className="flex items-center gap-6 tabular-nums">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[#66615B]">
              {copy.totalSixMonthSpend}
            </p>
            <p className="text-lg font-bold text-[#1C1B19]">
              ₹{sixMonthTotal.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="border-l border-[#E5E1D8] pl-6">
            <p className="text-[11px] uppercase tracking-wider text-[#66615B]">
              {copy.monthlyAverage}
            </p>
            <p className="text-lg font-semibold text-[#1E3A5F]">
              ₹{monthlyAvg.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {activeMonth && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#F9F8F6] border border-[#E5E1D8] px-3.5 py-2 text-xs">
          <span className="font-semibold text-[#1C1B19]">{activeMonth.fullLabel}</span>
          <span className="text-[#4A4640] tabular-nums">
            ₹{activeMonth.total.toLocaleString('en-IN')} · {activeMonth.orderCount}{' '}
            {activeMonth.orderCount === 1 ? 'order' : 'orders'}
          </span>
        </div>
      )}

      <div ref={containerRef} className="w-full overflow-hidden">
        <svg
          ref={svgRef}
          role="img"
          aria-label={copy.spendingTrendsTitle}
          className="w-full block select-none"
        />
      </div>

      {sixMonthTotal === 0 && (
        <p className="text-xs text-[#66615B] text-center">{copy.spendingNoData}</p>
      )}
    </div>
  );
};
