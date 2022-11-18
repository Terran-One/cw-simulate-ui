import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import type { Theme } from "@mui/material/styles/createTheme";
import styled from "@mui/material/styles/styled";
import useTheme from "@mui/material/styles/useTheme";
import type { SxProps } from "@mui/system/styleFunctionSx";
import React, { ReactNode } from "react";
import { useParams } from "react-router-dom";
import { joinSx } from "../../utils/reactUtils";
import { GridSizeProps } from "../../utils/typeUtils";
import T1Container from "../grid/T1Container";
import Executor from "./Executor";
import { StateRenderer } from "./StateRenderer";
import StateStepper from "./StateStepper";
import CollapsibleWidget from "../CollapsibleWidget";
import { Typography } from "@mui/material";
import useSimulation from "../../hooks/useSimulation";
import T1Popover from "../T1Popover";

const StyledPaper = styled(Paper)(({theme}) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
}));

const Simulation = () => {
  const sim = useSimulation();
  const contractAddress = useParams().instanceAddress!;

  return (
    <SplitView className="T1Simulation-root">
      <Column xs={4} className="T1Simulation-left">
        <T1Popover text={contractAddress}>
          <Typography gutterBottom sx={{fontWeight: 'bold', textAlign: 'center'}}>
            {sim.shortenAddress(contractAddress)}
          </Typography>
        </T1Popover>
        <CollapsibleExecutor contractAddress={contractAddress}/>
        <Divider sx={{my: 1}}/>
        <StateStepper contractAddress={contractAddress}/>
      </Column>
      <Column xs={8} className="T1Simulation-right">
        <Widget>
          <StateRenderer contractAddress={contractAddress}/>
        </Widget>
      </Column>
    </SplitView>
  );
};

export default Simulation;

interface ISplitViewProps {
  children?: ReactNode;
  className?: string;
}

function SplitView({children, ...props}: ISplitViewProps) {
  return (
    <Grid
      container
      direction="row"
      spacing={1}
      sx={{
        height: "100%",
      }}
      {...props}
    >
      {children}
    </Grid>
  );
}

interface IColumnProps extends GridSizeProps {
  children?: ReactNode;
  className?: string;
}

function Column({children, ...props}: IColumnProps) {
  const theme = useTheme();

  return (
    <Grid
      item
      {...props}
      sx={{
        height: "100%",
      }}
    >
      <Grid
        container
        direction="column"
        component={StyledPaper}
        sx={{
          height: "100%",
          overflow: "auto",
          "> .T1Widget-root:not(:first-of-type)": {
            borderTop: `1px solid ${theme.palette.line}`,
          },
        }}
      >
        {children}
      </Grid>
    </Grid>
  );
}

interface IWidgetProps {
  children?: ReactNode;
  /** An optional size between 1-12. At 12, size is 100%. Lower values are multiples of 100%/12. Default is 12. */
  size?: number;
  className?: string;
  sx?: SxProps<Theme>;
}

function Widget({
  children,
  size = 12,
  className,
  sx,
  ...props
}: IWidgetProps) {
  return (
    <Grid
      item
      sx={joinSx(
        {
          p: 2,
          height: `${(100 * size) / 12}%`,
          overflow: 'auto',
        },
        sx,
      )}
      className={`T1Widget-root ${className}`}
      {...props}
    >
      <T1Container>{children}</T1Container>
    </Grid>
  );
}

interface ICollapsibleExecutorProps {
  contractAddress: string;
}

function CollapsibleExecutor({
  contractAddress,
}: ICollapsibleExecutorProps) {
  return (
    <CollapsibleWidget title={'Execute'} height={280}>
      <Executor contractAddress={contractAddress!}/>
    </CollapsibleWidget>
  )
}
