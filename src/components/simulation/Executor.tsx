import React, { useState } from "react";
import { JsonCodeMirrorEditor } from "../JsonCodeMirrorEditor";
import { useNotification } from "../../atoms/snackbarNotificationState";
import { Button, Chip, Grid, Typography } from "@mui/material";
import { useAtomValue } from "jotai";
import T1Container from "../grid/T1Container";
import useSimulation from "../../hooks/useSimulation";
import { useAccounts } from "../../CWSimulationBridge";
import { activeStepState } from "../../atoms/simulationPageAtoms";
import { BeautifyJSON } from "./tabs/Common";
import CollapsibleWidget from "../CollapsibleWidget";
import AccountPopover from "./AccountPopover";
import { Coin } from "@terran-one/cw-simulate/dist/types";
import useMuiTheme from "@mui/material/styles/useTheme";
import { SchemaForm } from "./SchemaForm";

interface IProps {
  contractAddress: string;
}

export const getFormattedStep = (step: string) => {
  const activeStepArr = step.split("-").map((ele) => Number(ele) + 1);
  return activeStepArr.slice(0, activeStepArr.length - 1).join(".");
};

export default function Executor({ contractAddress }: IProps) {
  const sim = useSimulation();
  const theme = useMuiTheme();
  const setNotification = useNotification();
  const accounts = useAccounts(sim);
  const defaultAccount = Object.keys(accounts)[0] || "";

  const [payload, setPayload] = useState("");
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [isAccountValid, setIsAccountValid] = useState(!!defaultAccount);
  const [[account, funds], setAccount] = useState<[string, Coin[]]>([
    defaultAccount,
    [],
  ]);
  const sender = account;
  const schema = sim.getSchema(contractAddress);
  // @ts-ignore
  const executeSchema = schema?.schema.execute;

  const activeStep = useAtomValue(activeStepState);
  const handleExecute = async () => {
    try {
      const res = await sim.execute(
        sender,
        contractAddress,
        JSON.parse(payload),
        funds
      );
      res.unwrap();
    } catch (err) {
      setNotification("Something went wrong while executing.", {
        severity: "error",
      });
      console.error(err);
    }
  };

  React.useEffect(() => {
    setPayload("");
  }, [contractAddress]);

  const isValid = isJsonValid && isAccountValid;

  return (
    <CollapsibleWidget
      title={"Execute"}
      height={280}
      right={
        <>
          <SchemaForm schema={executeSchema} submit={setPayload} />
          <BeautifyJSON
            onChange={setPayload}
            disabled={!payload.length || !isJsonValid}
            sx={{ color: theme.palette.common.white }}
          />
          <AccountPopover
            account={account}
            funds={funds}
            onChange={(address, funds) => setAccount([address, funds])}
            onValidate={setIsAccountValid}
          />
        </>
      }
    >
      <Grid
        item
        container
        direction="column"
        flexWrap="nowrap"
        sx={{
          height: "100%",
          gap: 2,
        }}
      >
        <Grid item flex={1} position="relative">
          <T1Container>
            <JsonCodeMirrorEditor
              jsonValue={payload}
              onChange={setPayload}
              onValidate={setIsJsonValid}
            />
          </T1Container>
        </Grid>
        <Grid item container flexShrink={0} justifyContent="space-between">
          <Grid item>
            <Button
              variant="contained"
              onClick={handleExecute}
              disabled={!payload.length || !isValid}
            >
              Run
            </Button>
          </Grid>
          <Chip
            label={
              <Typography variant="caption">
                Current Active Step : {getFormattedStep(activeStep)}
              </Typography>
            }
          />
        </Grid>
      </Grid>
    </CollapsibleWidget>
  );
}
