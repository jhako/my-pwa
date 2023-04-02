import React, { FC, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  LineChart,
} from "recharts";
import { StockCollection, get_jpy_rate, date2str } from "./StockCollection";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";

type chartStockProps = {
  sc: StockCollection;
};

function to_yymmdd(x: Date) {
  return [x.getFullYear() % 100, x.getMonth() + 1, x.getDate()].join("/");
}

export const ChartStock: FC<chartStockProps> = ({ sc }) => {
  const [rateAlign, setRateAlign] = React.useState("profit");
  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newAlign: string
  ) => {
    setRateAlign(newAlign);
  };

  return (
    <div>
      <ToggleButtonGroup
        color="primary"
        value={rateAlign}
        exclusive
        onChange={handleChange}
      >
        <ToggleButton value="profit">評価損益</ToggleButton>
        <ToggleButton value="dividends">配当実績</ToggleButton>
      </ToggleButtonGroup>
      {rateAlign == "profit" ? (
        <ChartProfit sc={sc} />
      ) : rateAlign == "dividends" ? (
        <ChartDividends sc={sc} />
      ) : (
        <div />
      )}
    </div>
  );
};

const ChartProfit: FC<chartStockProps> = ({ sc }) => {
  const [checked_excgain, setCheckedExcGain] = React.useState(true);
  const [x_range_day, setXRangeDay] = React.useState("183");

  const xmin_limit = new Date("2019-08-01").getTime();
  const xmax = Date.now();
  const xrange_milli = Number.parseInt(x_range_day) * 86400000;
  const xmin = Math.max(xmax - xrange_milli, xmin_limit);
  const num_x = Math.min((xmax - xmin) / 86400000, 200);
  const dx = (xmax - xmin) / (num_x - 1);
  const xs = [...Array(num_x)].map((_, i) => xmin + i * dx);

  // 株価含み益データ
  const profits = get_stock_profits(sc, xs, checked_excgain);
  const data = xs.map((x, i) => {
    const y: { [name: string]: number } = {};
    y["date"] = x;
    for (const idx in profits) {
      const profit = profits[idx][i];
      if (isNaN(profit)) continue;
      const label = sc.holdings[idx].label;
      const key = label + (profit > 0 ? "+" : "-");
      y[key] = profit;
    }
    y["exrate"] = sc.exrates[date2str(new Date(x))];
    return y;
  });

  // 符号入れ替わり時に0点を指すダミーデータを追加する
  for (const h of sc.holdings) {
    const plabel = h.label + "+";
    const nlabel = h.label + "-";
    for (let i = 0; i < data.length - 1; ++i) {
      const p0 = plabel in data[i] && data[i][plabel] !== 0;
      const n0 = nlabel in data[i] && data[i][nlabel] !== 0;
      const p1 = plabel in data[i + 1] && data[i + 1][plabel] !== 0;
      const n1 = nlabel in data[i + 1] && data[i + 1][nlabel] !== 0;
      if (p0 && !p1) data[i + 1][plabel] = 0;
      if (!p0 && p1) data[i][plabel] = 0;
      if (n0 && !n1) data[i + 1][nlabel] = 0;
      if (!n0 && n1) data[i][nlabel] = 0;
    }
  }

  const y_keys: string[] = sc.holdings
    .sort((a, b) => a.start - b.start)
    .map((h) => h.label);
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

  const handleChangeToggle = (
    event: React.MouseEvent<HTMLElement>,
    value: string
  ) => {
    setXRangeDay(value);
    //Number.parseInt(xrange)
  };

  const handleChangeCheckBoxExcGain = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCheckedExcGain(event.target.checked);
  };

  return (
    <div>
      <ToggleButtonGroup
        color="primary"
        value={x_range_day}
        exclusive
        onChange={handleChangeToggle}
        aria-label="Platform"
      >
        <ToggleButton value="7">1週間</ToggleButton>
        <ToggleButton value="30">1ヶ月</ToggleButton>
        <ToggleButton value="183">半年</ToggleButton>
        <ToggleButton value="365">1年</ToggleButton>
        <ToggleButton value="99999">すべて</ToggleButton>
      </ToggleButtonGroup>
      <FormControlLabel
        control={
          <Checkbox
            checked={checked_excgain}
            onChange={handleChangeCheckBoxExcGain}
          />
        }
        label="為替差益あり"
      />
      <ResponsiveContainer width="95%" height={600}>
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 30,
            bottom: 10,
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
          <ReferenceLine y={0} stroke="gray" />
          {y_keys.map((y_key, idx) =>
            ["+", "-"].map((s, k) => (
              <Area
                type="monotone"
                stackId={k}
                dataKey={y_key + s}
                dot={{ strokeWidth: 0, r: 2 }}
                stroke={colors[idx]}
                fill={colors[idx]}
                key={y_key + s}
                isAnimationActive={false}
                name={y_key}
                legendType={k == 0 ? "line" : "none"}
              />
            ))
          )}
          <Legend />
        </AreaChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="95%" height={300}>
        <LineChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 30,
            bottom: 10,
          }}
        >
          <XAxis
            dataKey="date"
            tickFormatter={(date) => to_yymmdd(new Date(date))}
          />
          <YAxis domain={["auto", "auto"]} />
          <Tooltip
            labelFormatter={(date) => to_yymmdd(new Date(date))}
            isAnimationActive={false}
          />
          <Legend />
          <CartesianGrid strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="exrate"
            name="JPY/USD"
            stroke="#82ca9d"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

function get_stock_profits(
  sc: StockCollection,
  xs: number[],
  rate_considered: boolean
) {
  const series: number[][] = [];
  sc.holdings.forEach((hld) => {
    const profits: number[] = [];
    let k = 0;

    xs.forEach((x) => {
      const prices = sc.prices[hld.code];
      while (prices[k].date < x && k < prices.length - 1) {
        k += 1;
      }
      const jpy_rate = get_jpy_rate(hld.code, x, sc);
      const base_price = rate_considered
        ? hld.acq_price * (hld.acq_rate / jpy_rate)
        : hld.acq_price;
      const profit =
        hld.start <= x && x <= hld.end
          ? hld.amount * jpy_rate * (prices[k].value - base_price)
          : NaN;
      profits.push(profit);
    });
    series.push(profits);
  });
  return series;
}

const ChartDividends: FC<chartStockProps> = ({ sc }) => {
  const [value, setValue] = React.useState("sum");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue((event.target as HTMLInputElement).value);
  };

  const { xs, dividends } = get_stock_dividends(sc, value);

  const data = xs.map((x, i) => {
    const y: { [name: string]: number } = {};
    y["date"] = x;
    for (const idx in dividends) {
      const dividend = dividends[idx][i];
      if (isNaN(dividend)) continue;
      const label = sc.holdings[idx].label;
      y[label] = dividend;
    }
    return y;
  });

  const y_keys: string[] = sc.holdings
    .sort((a, b) => a.start - b.start)
    .map((h) => h.label);
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
      <RadioGroup row value={value} onChange={handleChange}>
        <FormControlLabel value="sum" control={<Radio />} label="累積額" />
        <FormControlLabel value="half" control={<Radio />} label="半期" />
        <FormControlLabel value="rate" control={<Radio />} label="利回り" />
      </RadioGroup>
      <ResponsiveContainer width="95%" height={600}>
        <BarChart
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
          <YAxis
            tickFormatter={
              value === "rate"
                ? (rate) => (rate * 100).toFixed(3) + "%"
                : (yen) => yen / 10000 + "万円"
            }
          />
          <Tooltip
            labelFormatter={(date) => to_yymmdd(new Date(date))}
            formatter={(y: number, name: string) =>
              value === "rate"
                ? (y * 100).toFixed(3) + "%"
                : y !== 0
                ? ["¥" + (y / 10000).toFixed(2) + "万", name.substring(0, 6)]
                : []
            }
            isAnimationActive={false}
          />
          <ReferenceLine y={0} stroke="gray" />
          {y_keys.map((y_key, idx) => (
            <Bar
              stackId={value == "sum" ? 1 : undefined}
              dataKey={y_key}
              fill={colors[idx]}
              key={y_key}
              isAnimationActive={false}
              name={y_key}
            />
          ))}
          <Legend />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

function get_stock_dividends(sc: StockCollection, type: string) {
  const xs: number[] = [];
  const date_from = new Date("2019-07-01");
  const date_to = new Date();
  const d = date_from;
  while (d < date_to) {
    d.setMonth(d.getMonth() + 6);
    xs.push(d.getTime());
  }

  const series: number[][] = [];
  sc.holdings.forEach((hld) => {
    const val_s: number[] = [];
    if (hld.code in sc.dividends) {
      const prices = sc.prices[hld.code];
      const dividends = sc.dividends[hld.code];
      let k = 0;
      let n = 0;
      let sum = 0.0;
      xs.forEach((x) => {
        let val = 0;
        const jpy_rate = get_jpy_rate(hld.code, new Date().getTime(), sc); //本日
        while (dividends[k]?.date < x && k < dividends.length) {
          val += dividends[k].value;
          k += 1;
        }
        while (prices[n].date < x && n < prices.length - 1) {
          n += 1;
        }
        sum += val;
        const y =
          type === "sum"
            ? hld.amount * sum * jpy_rate
            : type === "half"
            ? hld.amount * val * jpy_rate
            : type === "rate"
            ? (val / prices[n].value) * 2 //半期を全期だと仮定
            : NaN;
        const dividend = hld.start <= x && x <= hld.end ? y : NaN;
        val_s.push(dividend);
      });
    }
    series.push(val_s);
  });
  return { xs: xs, dividends: series };
}
