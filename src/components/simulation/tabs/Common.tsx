import BrushOutlinedIcon from "@mui/icons-material/BrushOutlined";
import SegmentIcon from "@mui/icons-material/Segment";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Typography, { TypographyProps } from "@mui/material/Typography";
import styled from "@mui/material/styles/styled";
import { TraceLog } from "@terran-one/cw-simulate";
import beautify from "json-beautify-fix";
import React, { PropsWithChildren } from "react";
import { SxProps } from "@mui/material";
import useMuiTheme from "@mui/material/styles/useTheme";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { DynamicForm } from "@mui/icons-material";

export interface IInspectorTabProps {
  traceLog: TraceLog | undefined;
}

export const TabPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
  backgroundColor:
    theme.palette.mode === "dark"
      ? "rgba(255, 255, 255, 0.08)"
      : "rgba(0, 0, 0, 0.08)",
  overflow: "auto",
  maxHeight: "100%",
}));

export const TabHeader = React.memo(({ children }: PropsWithChildren) => {
  return (
    <Typography variant="h6" fontWeight="bold" mb={1}>
      {children}
    </Typography>
  );
});

export const EmptyTab = styled(
  ({ children = "Nothing to see here.", ...props }: TypographyProps) => (
    <Typography variant="body2" {...props}>
      {children}
    </Typography>
  )
)(({ theme }) => ({
  textAlign: "center",
  fontStyle: "italic",
  color: theme.palette.grey[500],
}));

export const BeautifyJSON = ({
  onChange,
  disabled,
  sx,
}: {
  onChange: any;
  disabled: boolean;
  sx: SxProps;
}) => {
  const theme = useMuiTheme();
  return (
    <IconButton
      aria-label="beautify"
      color="primary"
      onClick={() => {
        onChange((payload: string) =>
          beautify(JSON.parse(payload), null, 2, 10)
        );
      }}
      disabled={disabled}
      sx={{ ml: 1 }}
    >
      <SegmentIcon sx={sx} />
      <Typography variant="body2" sx={{ ml: 1, ...sx }}>
        Tidy
      </Typography>
    </IconButton>
  );
};

export const JSONSchemaFormIcon = ({
  onClick,
  iconColor,
}: {
  onClick: any;
  iconColor?: string;
}) => {
  const theme = useMuiTheme();
  return (
    <IconButton
      aria-label="beautify"
      color="primary"
      onClick={onClick}
      sx={{ ml: 1 }}
    >
      <DynamicForm
        sx={{ color: iconColor ? iconColor : theme.palette.common.white }}
      />
      <Typography
        variant="body2"
        color={iconColor ? iconColor : theme.palette.common.white}
        sx={{ ml: 1 }}
      >
        Form
      </Typography>
    </IconButton>
  );
};

export interface IFormDialogProps {
  schema: any;
  open: boolean;
  onClose: () => void;
  onSubmit: (e: any) => void;
}

/**
 * Sanitize the schema to remove any properties that are not supported by the JSON Schema standard.
 * 1. Replace `uint64` with `integer`
 * 2. Remove "format": "integer", as it is not supported by the JSON Schema standard.
 * @param schema
 */
export function sanitizeSchema(schema: any) {
  return JSON.parse(
    JSON.stringify(schema)
      .replace(/"uint64"/g, '"integer"')
      .replace(/"format": "integer",/g, "")
  );
}

export const JSONSchemaFormDialog = ({
  schema,
  open,
  onClose,
  onSubmit,
}: IFormDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>JSON Schema Form</DialogTitle>
      <DialogContent sx={{ minWidth: 380 }}>
        <Form
          schema={sanitizeSchema(schema)}
          validator={validator}
          onChange={() => console.log("changed")}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
};
