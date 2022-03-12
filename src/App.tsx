import React, { FC } from "react";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CurrencyYenIcon from "@mui/icons-material/CurrencyYen";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import "./App.css";
import { PageHealth } from "./page_health/PageHealth";

type bodyProps = {
  value: number;
};

const Body: FC<bodyProps> = ({ value }) => {
  if (value == 0) {
    return <PageHealth></PageHealth>;
  }
  return <p>Val {value}</p>;
};

function App() {
  const [value, setValue] = React.useState(0);

  return (
    <div className="App">
      <Box sx={{ pb: 7 }}>
        <Body value={value}></Body>

        <Paper
          sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
          elevation={3}
        >
          <BottomNavigation
            showLabels
            value={value}
            onChange={(event, newValue) => {
              setValue(newValue);
            }}
          >
            <BottomNavigationAction label="Health" icon={<FavoriteIcon />} />
            <BottomNavigationAction label="Money" icon={<CurrencyYenIcon />} />
          </BottomNavigation>
        </Paper>
      </Box>
    </div>
  );
}

export default App;
