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
import Address from "../chains/Address";
import useSimulation from "../../hooks/useSimulation";

const StyledPaper = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
}));

interface JSONSchemaFormProps {
  schema: any;
}

// Replace all "uint64" with "integer" in the JSON schema
function replaceUint64WithInteger(schema: any) {
  return JSON.parse(JSON.stringify(schema).replace(/uint64/g, "integer"));
}

const Simulation = () => {
  const contractAddress = useParams().instanceAddress!;
  const sim = useSimulation();
  const schema = sim.getSchema(contractAddress);
  // @ts-ignore
  const executeSchema = schema?.schema.execute;

  return (
    <SplitView className="T1Simulation-root">
      <Column xs={4} className="T1Simulation-left">
        <Grid container direction="column" height="100%">
          <Grid item>
            <Address
              address={contractAddress}
              gutterBottom
              fontWeight="bold"
              textAlign="center"
              sx={{ display: "flex", justifyContent: "center" }}
            />

            <Executor contractAddress={contractAddress} />
          </Grid>
          <Divider sx={{ my: 1 }} />
          <Grid item flex={1} sx={{ display: "relative" }}>
            <T1Container>
              <StateStepper contractAddress={contractAddress} />
            </T1Container>
          </Grid>
        </Grid>
      </Column>
      <Column xs={8} className="T1Simulation-right">
        <Widget>
          <StateRenderer contractAddress={contractAddress} />
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

function SplitView({ children, ...props }: ISplitViewProps) {
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

function Column({ children, ...props }: IColumnProps) {
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
          overflow: "auto",
        },
        sx
      )}
      className={`T1Widget-root ${className}`}
      {...props}
    >
      <T1Container>{children}</T1Container>
    </Grid>
  );
}
