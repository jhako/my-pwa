import React, { FC, useState, useMemo } from "react";
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

type chartAssetProps = {
  mc: MoneyCollection;
};

function to_yymmdd(x: Date) {
  return [x.getFullYear() % 100, x.getMonth() + 1, x.getDate()].join("/");
}

export const ChartAsset: FC<chartAssetProps> = ({ mc }) => {
  const series = get_series(mc, 30, undefined);
  const y_keys = Object.keys(series[0]).filter((k) => k != "date");
  const colors = ["#274B6F", "#D0D0B4", "#F7BCBC", "#F6F9E4", "#938496"];

  return (
    <div>
      <ResponsiveContainer width="95%" height={300}>
        <AreaChart
          data={series}
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
            labelFormatter={(date) => new Date(date).toLocaleDateString()}
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

function get_series(
  collection: MoneyCollection,
  num_x: number,
  xmin: number | undefined
) {
  xmin ??= collection.date_from;
  const xmax = Date.now();
  const dx = (xmax - xmin) / (num_x - 1);
  const balance_arr: { [label: string]: number[] } = {};
  for (const label in collection.tables) {
    const table = collection.tables[label];
    let balance = table.balance;
    if (!balance) continue;

    const ys = [balance];
    let i = table.trans.length;
    let x = xmax;
    while (x > xmin - dx / 2) {
      i -= 1;
      if (i < 0) break;
      const val = table.trans[i];
      if (x > val.date) {
        while (x - dx > val.date) {
          x -= dx;
          ys.push(balance);
        }
      }
      balance -= val.amount;
    }
    while (ys.length < num_x) {
      ys.push(balance);
    }
    balance_arr[label] = ys.reverse();
  }

  const series = [];
  for (let i = 0; i < num_x; ++i) {
    const item: { [key: string]: number } = {};
    item["date"] = xmin + i * dx;
    for (const label in balance_arr) {
      item[label] = balance_arr[label][i];
    }
    series.push(item);
  }

  return series;
}
