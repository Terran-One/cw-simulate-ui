import * as React from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import { StateTraversal } from "./StateTraversal";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { payloadState } from "../atoms/payloadState";
import { executeQueryTabState } from "../atoms/executeQueryTabState";
import { ExecuteQuery, IState } from "./ExecuteQuery";
import { Instantiate } from "./Instantiate";
import { fileUploadedState } from "../atoms/fileUploadedState";
import { instantiatedState } from "../atoms/instantiatedState";
import { showNotification, snackbarNotificationState } from "../atoms/snackbarNotificationState";
import { Config } from "../configs/config";
import { StateRenderer } from "./StateRenderer";
import "../index.css";

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary,
}));

interface IProps {
  response: JSON | undefined;
  setResponse: (val: JSON | undefined) => void;
  allStates: IState[];
  currentState: number;
  setCurrentState: (val: number) => void;
  setWasmBuffers: (fileBuffer: ArrayBuffer[]) => void;
  wasmBuffers: ArrayBuffer[];
  setAllStates: (val: IState[]) => void;
}

export default function GridLayout({
  response,
  setResponse,
  allStates,
  currentState,
  setCurrentState,
  setAllStates,
}: IProps) {
  const [executeQueryTab, setExecuteQueryTab] =
    useRecoilState(executeQueryTabState);
  const isFileUploaded = useRecoilValue(fileUploadedState);
  const [isInstantiated, setIsInstantiated] = useRecoilState(instantiatedState);
  const setSnackbarNotification = useSetRecoilState(snackbarNotificationState);
  const [payload, setPayload] = useRecoilState(payloadState);
  const { MOCK_ENV, MOCK_INFO } = Config;
  const addState = (stateBefore: any, res: any) => {
    const stateObj: IState = {
      chainStateBefore: stateBefore,
      payload: payload,
      currentTab: executeQueryTab,
      chainStateAfter: window.VM?.backend?.storage.dict["c3RhdGU="],
      res: res,
    };
    setAllStates([...allStates, stateObj]);
    setCurrentState(allStates.length);
  };

  const onInstantiateClickHandler = () => {
    try {
      const res = window.VM.instantiate(MOCK_ENV, MOCK_INFO, { count: 20 });
      addState("", "");
      setIsInstantiated(true);
      showNotification(setSnackbarNotification, "CosmWasm VM successfully instantiated!");
    } catch (err) {
      showNotification(setSnackbarNotification, "CosmWasm VM was not able to instantiate. Please check console for errors.", "error");
    }
  };

  return (
    <Box sx={{ maxWidth: "92vw" }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          {allStates.length > 0 && (
            <Item sx={{ overflowX: "scroll", display: "flex", height: "10vh" }}>
              <div
                style={{
                  display: "flex",
                  height: "100%",
                  marginLeft: "10px",
                  alignItems: "center",
                  padding: "10px",
                  overflowX: "scroll",
                }}
              >
                <StateTraversal />
              </div>
            </Item>
          )}
        </Grid>
        <Grid item xs={12}>
          <Item sx={{ height: "40vh" }}>
            <div
              style={{
                padding: 10,
                height: "100%",
              }}
            >
              {isInstantiated ? (
                <ExecuteQuery
                  response={response}
                  setResponse={setResponse}
                  setAllStates={setAllStates}
                  allStates={allStates}
                  setCurrentState={setCurrentState}
                  currentState={currentState}
                />
              ) : (
                <Instantiate
                  onInstantiateClickHandler={onInstantiateClickHandler}
                />
              )}
            </div>
          </Item>
        </Grid>
        <Grid item xs={12}>
          <Item sx={{ textAlign: "left", height: "30vh" }}>
            <StateRenderer
              isFileUploaded={isFileUploaded}
              allStates={allStates}
              currentState={currentState}
            />
          </Item>
        </Grid>
      </Grid>
    </Box>
  );
}
