import React from "react";
import SyncIcon from "@mui/icons-material/Sync";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SyncDisabledIcon from "@mui/icons-material/SyncDisabled";
import Zoom from "@mui/material/Zoom";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useMoneyCollection } from "./MoneyCollection";
import { useStockCollection } from "./StockCollection";
import { ChartAsset } from "./AssetChart";
import { ChartStock } from "./StockChart";
import "./PageMoney.css";

export function PageMoney() {
  const [chartAlign, setChartAlign] = React.useState("stock");
  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newAlign: string
  ) => {
    setChartAlign(newAlign);
  };

  const moneyCollection = useMoneyCollection();
  const stockCollection = useStockCollection();
  const fetch_status = Math.max(
    moneyCollection.fetchStatus,
    stockCollection.fetchStatus
  );

  const chart = () => {
    if (chartAlign == "asset" && moneyCollection.data && stockCollection.data) {
      return <ChartAsset mc={moneyCollection.data} sc={stockCollection.data} />;
    } else if (chartAlign == "stock" && stockCollection.data) {
      return <ChartStock sc={stockCollection.data} />;
    } else return <div />;
  };
  return (
    <div className="body">
      <div className="syncIcon">
        <Zoom in={fetch_status == 0} timeout={500}>
          <SyncIcon color="action" />
        </Zoom>
        <Zoom in={fetch_status == 1} timeout={500}>
          <CheckCircleOutlineIcon color="success" />
        </Zoom>
        <Zoom in={fetch_status == 2} timeout={500}>
          <SyncDisabledIcon color="disabled" />
        </Zoom>
      </div>
      <ToggleButtonGroup
        color="standard"
        value={chartAlign}
        exclusive
        onChange={handleChange}
      >
        <ToggleButton value="asset">資産チャート</ToggleButton>
        <ToggleButton value="stock">保有株チャート</ToggleButton>
      </ToggleButtonGroup>
      {chart()}
      <a className="ratelink" href="https://www.exchangerate-api.com">
        divates By Exchange Rate API
      </a>
    </div>
  );
}
