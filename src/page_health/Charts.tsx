import React, { FC, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type scaleProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  chart_props: typeChartProps;
};

export type typeChartProps = {
  initial_labels: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y1formatter?: { [key: string]: (y: any) => string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter?: (value: any) => boolean;
};

function to_mmdd(x: Date) {
  return [x.getMonth() + 1, x.getDate()].join("/ ");
}

export const ChartHealth: FC<scaleProps> = ({ data, chart_props }) => {
  const [x_key, y1_key, y2_key] = chart_props.initial_labels;
  // Y2データラベル
  const [y2Key, setY2Key] = useState(y2_key);
  // 全データラベル (x,y1ラベルを除く)
  const key_candidates = useMemo(() => {
    if (data.length == 0) {
      return [];
    } else {
      return Object.keys(data[0]).filter((k) => k != x_key && k != y1_key);
    }
  }, [data, x_key, y1_key]);

  // X ticksの生成
  const ticks = useMemo(() => {
    const start_month = 1;
    const end_month = 12;
    const ticks = [];
    for (let m = start_month; m <= end_month; ++m) {
      ticks.push(new Date(`2022-${m}-01`).getTime());
    }
    return ticks;
  }, []);

  // フィルタ
  const data_filtered = useMemo(
    () =>
      data
        .filter((item) => item["date"] >= ticks[0])
        .filter(chart_props.filter ?? (() => true)),
    [ticks, data, chart_props.filter]
  );

  return (
    <div
      style={{
        fontSize: "1rem",
      }}
    >
      <ResponsiveContainer width="95%" height={300}>
        <LineChart data={data_filtered}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            allowDataOverflow={true}
            dataKey="date"
            type="number"
            domain={[ticks[0], ticks[-1]]}
            angle={-90}
            ticks={ticks}
            interval={0}
            textAnchor="end"
            tickFormatter={(date) => to_mmdd(new Date(date))}
            height={40}
          />
          <YAxis
            yAxisId="y1"
            tickCount={11}
            interval="preserveStart"
            domain={[
              (min: number) => Math.floor(min * 10 - 1) / 10,
              (max: number) => Math.ceil(max * 10 + 1) / 10,
            ]}
            tickFormatter={chart_props.y1formatter?.[y1_key]}
          />
          <YAxis
            yAxisId="y2"
            tickCount={11}
            interval="preserveStart"
            domain={[
              (min: number) => Math.floor(min * 10 - 1) / 10,
              (max: number) => Math.ceil(max * 10 + 1) / 10,
            ]}
            orientation="right"
          />
          <Tooltip
            label={"date"}
            labelFormatter={(date) => new Date(date).toLocaleDateString()}
            labelStyle={{
              color: "black",
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            onClick={(e) => setY2Key(e.dataKey)}
          />
          <Line
            yAxisId="y1"
            type="monotone"
            dataKey={y1_key}
            dot={{ r: 1.5 }}
            stroke="#8884d8"
            key={y1_key}
            isAnimationActive={false}
          />
          {key_candidates.map((data_key) => (
            <Line
              yAxisId="y2"
              type="monotone"
              dataKey={data_key}
              dot={{ r: 1.5 }}
              stroke="#82ca9d"
              key={Math.random()}
              hide={y2Key != data_key}
              animationDuration={500}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
