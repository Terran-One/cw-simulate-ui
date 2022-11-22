import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTheme } from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { TraceLog } from "@terran-one/cw-simulate";
import { chromeDark } from "react-inspector";
import T1JsonTree from "../../T1JsonTree";
import { EmptyTab, IInspectorTabProps } from "./Common";

const INSPECTOR_THEME: any = {
  ...chromeDark,
  BASE_BACKGROUND_COLOR: "transparent",
};

export default function LogsTab({ traceLog }: IInspectorTabProps) {
  if (!traceLog) return <EmptyTab />;

  let combinedLogs = combineLogs(traceLog).filter((log) => log.type === "call");

  return (
    <Grid sx={{ height: "100%", width: "100%" }}>
      {combinedLogs.length === 0 ? (
        <Grid
          sx={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="caption">No Logs to show.</Typography>
        </Grid>
      ) : (
        combinedLogs.map((log, index) => (
          <CallListItem
            ix={index}
            key={`a-${index}`}
            call={log}
            islastItem={index === combinedLogs.length - 1}
          />
        ))
      )}
    </Grid>
  );
}

const CallListItem = ({
  call,
  ix,
  islastItem,
}: {
  call: { args: { [k: string]: any }; result: any; fn: string };
  ix: number;
  islastItem: boolean;
}) => {
  const theme = useTheme();
  return (
    <Accordion
      sx={{
        "&.Mui-expanded": {
          margin: "0px",
          borderBottom: !islastItem ? "1px solid #bccabc" : "",
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel1a-content"
        id="panel1a-header"
      >
        <Typography
          fontFamily={"JetBrains Mono"}
          sx={{ wordWrap: "break-word" }}
        >
          [{ix}] {call.fn}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <table style={{ wordBreak: "break-word" }}>
          <T1JsonTree data={call.args} />
        </table>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: "bold", mt: 1, mb: 1 }}
        >
          Result
        </Typography>
        {call.result ? (
          <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
            {call.result}
          </Typography>
        ) : (
          <Typography variant="body2" color={theme.palette.grey[600]}>
            None
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

const combineLogs = (traceLog: TraceLog): any[] => {
  let res = [...traceLog.logs];
  if (traceLog.trace) {
    traceLog.trace.forEach((t) => {
      res = res.concat(combineLogs(t));
    });
  }
  return res;
};
