import React, { FC, useState, useEffect } from "react";
import { typeDB, miScaleDB, fitbitDB } from "./MyLocalDB";
import { ChartHealth, typeChartProps } from "./Charts";
import SyncIcon from "@mui/icons-material/Sync";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SyncDisabledIcon from "@mui/icons-material/SyncDisabled";
import Zoom from "@mui/material/Zoom";
import "./PageHealth.css";

export function PageHealth() {
  const chart_props_mi: typeChartProps = {
    initial_labels: ["date", "weight_kg", "muscle"],
  };
  const chart_props_fb: typeChartProps = {
    initial_labels: ["date", "pace", "distance"],
    y1formatter: {
      pace: (sec) =>
        (sec - (sec %= 60)) / 60 + (9 < sec ? ":" : ":0") + Math.round(sec),
    },
    filter: (item) => item["distance"] > 1,
  };
  return (
    <div className="body">
      <ChartWrapper
        api_name="MiBodyScale"
        db={miScaleDB}
        chart_props={chart_props_mi}
      />
      <ChartWrapper
        api_name="Fitbit"
        db={fitbitDB}
        chart_props={chart_props_fb}
      />
    </div>
  );
}

type chartWrapperProps = {
  api_name: string;
  db: typeDB;
  chart_props: typeChartProps;
};

const ChartWrapper: FC<chartWrapperProps> = ({ api_name, db, chart_props }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [table, setTabel] = useState<any[]>([]);
  const [fetchStatus, setFetchStatus] = useState<number>(0);

  useEffect(() => {
    (async () => setTabel(await db.items.toArray()))();
  }, [fetchStatus, db.items]);

  useEffect(() => {
    (async () => {
      setFetchStatus(await sync_database(api_name, db));
    })();
  }, [api_name, db]);

  return (
    <div>
      <div className="syncIcon">
        <Zoom in={fetchStatus == 0} timeout={500}>
          <SyncIcon color="action" />
        </Zoom>
        <Zoom in={fetchStatus == 1} timeout={500}>
          <CheckCircleOutlineIcon color="success" />
        </Zoom>
        <Zoom in={fetchStatus == 2} timeout={500}>
          <SyncDisabledIcon color="disabled" />
        </Zoom>
      </div>
      <ChartHealth data={table} chart_props={chart_props} />
    </div>
  );
};

async function sync_database(api_name: string, db: typeDB) {
  let status = 0;
  try {
    const res = await fetch(`https://192.168.10.103:7213/${api_name}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Array<any> = await res.json();
    data.map((item) => {
      // convert date-string to unix-time
      item.date = new Date(item.date).getTime();
      db.items.put(item);
    });
    status = 1;
  } catch (e) {
    console.log("error fetch from MiBodyScale");
    status = 2;
  }
  return status;
}
