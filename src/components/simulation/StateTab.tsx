import Box from "@mui/material/Box";
import ReactDiffViewer from "@terran-one/react-diff-viewer";
import { useAtomValue } from "jotai";
import React, { useEffect, useState } from "react";
import { blockState, compareStates } from "../../atoms/simulationPageAtoms";
import T1JsonTree from "../T1JsonTree";
import CloseDiff from "./CloseDiff";

export interface IStateTabProps {}

export const StateTab = ({}: IStateTabProps) => {
  const compareStateObj = useAtomValue(compareStates);
  const currentJSON = useAtomValue(blockState);
  const [isDiff, setIsDiff] = useState(false);
  useEffect(() => {
    setIsDiff(
      Object.keys(compareStateObj.state1).length !== 0 &&
        Object.keys(compareStateObj.state2).length !== 0
    );
  }, [compareStateObj]);

  if (isDiff) {
    return (
      <Box>
        <CloseDiff
          onClick={() => {
            setIsDiff(false);
          }}
        />
        <ReactDiffViewer
          oldValue={JSON.stringify(compareStateObj.state1)}
          newValue={JSON.stringify(compareStateObj.state2)}
          splitView={false}
        />
      </Box>
    );
  } else {
    return <T1JsonTree data={currentJSON ?? {}} />;
  }
};
