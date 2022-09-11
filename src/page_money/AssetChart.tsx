import React, { FC } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MoneyCollection } from "./MoneyCollection";
import { StockCollection, get_jpy_rate } from "./StockCollection";

type chartAssetProps = {
  mc: MoneyCollection;
  sc: StockCollection;
};

function to_yymmdd(x: Date) {
  return [x.getFullYear() % 100, x.getMonth() + 1, x.getDate()].join("/");
}

export const ChartAsset: FC<chartAssetProps> = ({ mc, sc }) => {
  const xmin = new Date("2020-01-01").getTime(); //mc.date_from;
  const xmax = Date.now();
  const num_x = 100;
  const dx = (xmax - xmin) / (num_x - 1);
  const xs = [...Array(num_x)].map((_, i) => xmin + i * dx);
  const balances = get_money_series(mc, xs);
  const stockvals = get_stockval_series(sc, xs);

  const data = xs.map((x, i) => {
    const y: { [name: string]: number } = {};
    y["date"] = x;
    for (const label in balances) y[label] = balances[label][i];
    for (const idx in stockvals) {
      if (isNaN(stockvals[idx][i])) {
        if (i + 1 < stockvals[idx].length && !isNaN(stockvals[idx][i + 1])) {
          y[sc.holdings[idx].label] = 0.0;
        } else {
          continue;
        }
      } else {
        y[sc.holdings[idx].label] = stockvals[idx][i];
      }
    }
    return y;
  });

  const y_keys: string[] = sc.holdings
    .sort((a, b) => a.start - b.start)
    .map((h) => h.label)
    .concat(Object.keys(balances));
  const colors = [
    "#f44336",
    "#9c27b0",
    "#3f51b5",
    "#03a9f4",
    "#009688",
    "#8bc34a",
    "#ffeb3b",
    "#ff9800",
    "#795548",
    "#607d8b",
    "#e81e63",
    "#673ab7",
    "#2196f3",
    "#00bcd4",
    "#4caf50",
    "#cddc39",
    "#ffc107",
    "#ff5722",
    "#9e9e9e",
  ];

  return (
    <div>
      <ResponsiveContainer width="95%" height={400}>
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 30,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => to_yymmdd(new Date(date))}
          />
          <YAxis tickFormatter={(yen) => yen / 10000 + "万円"} />
          <Tooltip
            labelFormatter={(date) => to_yymmdd(new Date(date))}
            formatter={(yen: number, name: string) =>
              yen !== 0
                ? ["¥" + (yen / 10000).toFixed(2) + "万", name.substring(0, 6)]
                : []
            }
            isAnimationActive={false}
          />
          {y_keys.map((y_key, idx) => (
            <Area
              type="monotone"
              dataKey={y_key}
              stackId="1"
              stroke={colors[idx]}
              fill={colors[idx]}
              key={y_key}
            />
          ))}
          <Legend />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

function get_money_series(mc: MoneyCollection, xs: number[]) {
  const series: { [label: string]: number[] } = {};
  for (const label in mc.tables) {
    const table = mc.tables[label];
    let balance = table.balance;
    if (!balance) continue;

    const ys = [balance];
    let ix = xs.length - 1;
    let it = table.trans.length;
    while (ix >= 0) {
      const x = xs[ix];
      it -= 1;
      if (it < 0) break;
      const val = table.trans[it];
      if (x > val.date) {
        while (ix >= 1 && xs[ix - 1] > val.date) {
          ix -= 1;
          ys.push(balance);
        }
      }
      balance -= val.amount;
    }
    while (ys.length < xs.length) {
      ys.push(balance);
    }
    series[label] = ys.reverse();
  }

  return series;
}

function get_stockval_series(sc: StockCollection, xs: number[]) {
  const series: number[][] = [];
  sc.holdings.forEach((hld) => {
    const evalprices: number[] = [];
    let k = 0;
    xs.forEach((x) => {
      const jpy_rate = get_jpy_rate(hld.code, x, sc);
      const prices = sc.prices[hld.code];
      while (prices[k].date < x && k < prices.length - 1) {
        k += 1;
      }
      const amount = x >= hld.start ? hld.amount : NaN;
      evalprices.push(prices[k].value * amount * jpy_rate);
    });
    series.push(evalprices);
  });
  return series;
}
