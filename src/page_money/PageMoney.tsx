import React, { FC, useState, useEffect } from "react";
import SyncIcon from "@mui/icons-material/Sync";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SyncDisabledIcon from "@mui/icons-material/SyncDisabled";
import Zoom from "@mui/material/Zoom";
import { useMoneyCollection } from "./MoneyCollection";
import { ChartAsset } from "./AssetChart";
import "./PageMoney.css";

export function PageMoney() {
  const moneyCollection = useMoneyCollection();
  return (
    <div className="body">
      <div className="syncIcon">
        <Zoom in={moneyCollection.fetchStatus == 0} timeout={500}>
          <SyncIcon color="action" />
        </Zoom>
        <Zoom in={moneyCollection.fetchStatus == 1} timeout={500}>
          <CheckCircleOutlineIcon color="success" />
        </Zoom>
        <Zoom in={moneyCollection.fetchStatus == 2} timeout={500}>
          <SyncDisabledIcon color="disabled" />
        </Zoom>
      </div>
      {moneyCollection.data ? (
        <ChartAsset mc={moneyCollection.data} />
      ) : (
        <div />
      )}
    </div>
  );
}
