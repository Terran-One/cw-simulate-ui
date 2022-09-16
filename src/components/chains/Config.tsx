import { Button, Grid, Typography } from "@mui/material";
import { JsonCodeMirrorEditor } from "../JsonCodeMirrorEditor";
import { useRecoilState, useRecoilValue } from "recoil";
import { useNavigate, useParams } from "react-router-dom";
import filteredConfigsFromSimulationState from "../../selectors/filteredConfigsFromSimulationState";
import { payloadState } from "../../atoms/payloadState";
import { snackbarNotificationState } from "../../atoms/snackbarNotificationState";
import { validateConfigJSON } from "../../utils/fileUtils";
import simulationState from "../../atoms/simulationState";

const Config = () => {
  const param = useParams();
  const configValue = useRecoilValue(filteredConfigsFromSimulationState(param.id as string));
  const [simulation, setSimulation] = useRecoilState(simulationState);
  const jsonValue = JSON.stringify(configValue, null, 2);
  const jsonPayload = useRecoilValue(payloadState);
  const [snackbarNotification, setSnackbarNotification] = useRecoilState(snackbarNotificationState);
  const navigate = useNavigate();

  const handleOnClick = (e: any) => {
    e.preventDefault();
    const json = jsonPayload !== "" ? JSON.parse(jsonPayload) : JSON.parse(jsonValue);
    if (!validateConfigJSON(json)) {
      setSnackbarNotification({
        ...snackbarNotification,
        open: true,
        message: "Invalid Config JSON",
        severity: "error",
      });
      return;
    }

    let newSimulation = {...simulation};
    const currentChain = newSimulation.simulation.chains.find((chain: any) => chain.chainId === param.id);
    const newChain = {...currentChain};
    newChain.chainId = json.chainId;
    newChain.bech32Prefix = json.bech32Prefix;
    const chainIds = newSimulation.simulation.chains.map((chain: any) => chain.chainId);
    if (chainIds.includes(json.chainId)) {
      setSnackbarNotification({
        ...snackbarNotification,
        open: true,
        message: "Chain ID already exists",
        severity: "error",
      });
      return;
    }
    newSimulation = {
      simulation: {
        ...newSimulation.simulation,
        chains: newSimulation.simulation.chains.map((chain: any) => {
          if (chain.chainId === param.id) {
            return newChain;
          }
          return chain;
        }),
      }
    };
    setSimulation(newSimulation);
    if (json.chainId !== param.id) {
      navigate(`/chains/${json.chainId}`);
    }
    setSnackbarNotification({
      ...snackbarNotification,
      open: true,
      message: "Config updated successfully",
      severity: "success"
    });
  };

  return (
    <>
      <Typography variant="h6">Configuration</Typography>
      <JsonCodeMirrorEditor jsonValue={jsonValue}/>
      <Grid
        item
        xs={12}
        sx={{display: "flex", justifyContent: "end", marginTop: 2}}
      >
        <Button variant="contained" sx={{borderRadius: 2}} onClick={handleOnClick}>
          <Typography variant="button">Update Configuration</Typography>
        </Button>
      </Grid>
    </>
  );
};

export default Config;
